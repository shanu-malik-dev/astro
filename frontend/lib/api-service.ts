export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
export const AUTH_UNAUTHORIZED_EVENT = "astronova:unauthorized";
const inFlightRequests = new Map<string, Promise<unknown>>();
const AUTH_STORAGE_KEYS = [
  "astronova_admin_session",
  "astronova_website_session",
] as const;
let refreshPromise: Promise<string | null> | null = null;

function getAcceptLanguage() {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("astronova_language") || "en";
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function notifyUnauthorized() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}

function getTokenFromHeaders(headers: HeadersInit | undefined) {
  const authHeader = new Headers(headers).get("authorization");
  const match = /^Bearer\s+(.+)$/i.exec(authHeader || "");

  return match?.[1] || null;
}

function withAuthorizationHeader(
  headers: HeadersInit | undefined,
  accessToken: string
) {
  return {
    ...Object.fromEntries(new Headers(headers).entries()),
    Authorization: `Bearer ${accessToken}`,
  };
}

function findStoredSession(accessToken: string | null) {
  if (typeof window === "undefined") return null;

  for (const key of AUTH_STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const session = JSON.parse(raw) as {
        accessToken?: string | null;
        refreshToken?: string | null;
        user?: unknown;
      };
      if (!accessToken || session.accessToken === accessToken) {
        return { key, session };
      }
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  const scopedKey = window.location.pathname.startsWith("/admin")
    ? "astronova_admin_session"
    : "astronova_website_session";
  const scopedRaw = window.localStorage.getItem(scopedKey);
  if (scopedRaw) {
    try {
      return {
        key: scopedKey,
        session: JSON.parse(scopedRaw) as {
          accessToken?: string | null;
          refreshToken?: string | null;
          user?: unknown;
        },
      };
    } catch {
      window.localStorage.removeItem(scopedKey);
    }
  }

  return null;
}

function getAuthSessionFromRefreshResponse(data: any) {
  const user = data?.user || data?.data?.user;
  const accessToken =
    data?.accessToken ||
    data?.access_token ||
    data?.data?.accessToken ||
    data?.data?.access_token ||
    data?.data?.token ||
    null;
  const refreshToken =
    data?.refreshToken ||
    data?.refresh_token ||
    data?.data?.refreshToken ||
    data?.data?.refresh_token ||
    null;

  if (!user || !accessToken || !refreshToken) return null;

  return {
    user: {
      ...user,
      fullName: user.fullName || user.name || "",
    },
    accessToken,
    refreshToken,
  };
}

async function refreshAccessToken(headers: HeadersInit | undefined) {
  const accessToken = getTokenFromHeaders(headers);
  const stored = findStoredSession(accessToken);
  const refreshToken = stored?.session.refreshToken;
  const tenantId = new Headers(headers).get("x-tenant-id");

  if (!stored || !refreshToken || !tenantId) return null;

  if (stored.session.accessToken && stored.session.accessToken !== accessToken) {
    return stored.session.accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": getAcceptLanguage(),
        "x-tenant-id": tenantId,
      },
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type");
        const isJson = contentType?.includes("application/json");
        const data = isJson ? await response.json().catch(() => null) : null;

        if (!response.ok || data?.statusCode === 401) return null;

        const nextSession = getAuthSessionFromRefreshResponse(data);
        if (!nextSession) return null;

        window.localStorage.setItem(stored.key, JSON.stringify(nextSession));
        window.dispatchEvent(
          new CustomEvent("astronova:token-refreshed", {
            detail: { storageKey: stored.key, session: nextSession },
          })
        );

        return nextSession.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  dedupe?: boolean;
};

function shouldDedupeRequest(
  path: string,
  options: ApiRequestOptions,
  body: unknown
) {
  if (options.dedupe !== undefined) return options.dedupe;

  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers as HeadersInit | undefined);
  const hasAuth = Boolean(headers.get("authorization"));
  const isWebsiteRead =
    !hasAuth &&
    !path.startsWith("/auth") &&
    !path.startsWith("/admin") &&
    !path.includes("/generate") &&
    !path.includes("/create") &&
    !path.includes("/update") &&
    !path.includes("/delete") &&
    !path.includes("/status") &&
    !path.includes("/close") &&
    !path.includes("/save");

  if (!isWebsiteRead) return false;
  if (method === "GET") return true;

  return method === "POST" && body !== undefined;
}

function getDedupeKey(
  path: string,
  options: ApiRequestOptions,
  serializedBody?: string
) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers as HeadersInit | undefined);
  const tenantId = headers.get("x-tenant-id") || "";
  const language = getAcceptLanguage();

  return JSON.stringify({
    method,
    path,
    tenantId,
    language,
    body: serializedBody || "",
  });
}

export async function apiService<T>(
  path: string,
  { headers, body, dedupe, ...options }: ApiRequestOptions = {}
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const serializedBody =
    body === undefined
      ? undefined
      : isFormData
        ? body
      : typeof body === "string"
        ? body
        : JSON.stringify(body);
  const requestOptions = {
    ...options,
    dedupe,
    headers,
  };
  const dedupeEnabled = shouldDedupeRequest(path, requestOptions, body);
  const dedupeKey = dedupeEnabled
    ? getDedupeKey(
        path,
        requestOptions,
        typeof serializedBody === "string" ? serializedBody : undefined
      )
    : "";
  const existingRequest = dedupeKey ? inFlightRequests.get(dedupeKey) : null;
  if (existingRequest) return existingRequest as Promise<T>;

  const getCurrentHeaders = (requestHeaders: HeadersInit | undefined) => {
    const requestToken = getTokenFromHeaders(requestHeaders);
    if (!requestToken) return requestHeaders;

    const stored = findStoredSession(requestToken);
    const storedToken = stored?.session.accessToken;

    if (storedToken && storedToken !== requestToken) {
      return withAuthorizationHeader(requestHeaders, storedToken);
    }

    return requestHeaders;
  };

  const executeRequest = (
    requestHeaders: HeadersInit | undefined,
    retry = true
  ): Promise<T> => {
    const currentHeaders = getCurrentHeaders(requestHeaders);

    return (
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      body: serializedBody,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        "Accept-Language": getAcceptLanguage(),
        ...currentHeaders,
      },
    }).then(async (response) => {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await response.json().catch(() => null) : null;

    if (response.status === 401 || data?.statusCode === 401) {
      if (retry && path !== "/auth/refresh" && getTokenFromHeaders(currentHeaders)) {
        const nextAccessToken = await refreshAccessToken(currentHeaders);
        if (nextAccessToken) {
          return executeRequest(
            withAuthorizationHeader(currentHeaders, nextAccessToken),
            false
          );
        }
      }

      notifyUnauthorized();

      const message =
        data?.message ||
        data?.error ||
        "Session expired. Please login again.";

      throw new ApiError(
        401,
        Array.isArray(message) ? message.join(", ") : message
      );
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;

      throw new ApiError(
        response.status,
        Array.isArray(message) ? message.join(", ") : message
      );
    }

    return data as T;
  })
    );
  };

  const requestPromise = executeRequest(headers).finally(() => {
    if (dedupeKey) inFlightRequests.delete(dedupeKey);
  });

  if (dedupeKey) inFlightRequests.set(dedupeKey, requestPromise);

  return requestPromise;
}
