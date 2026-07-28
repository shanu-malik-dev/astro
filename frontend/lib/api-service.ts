const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
export const AUTH_UNAUTHORIZED_EVENT = "astronova:unauthorized";
const inFlightRequests = new Map<string, Promise<unknown>>();

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
  const serializedBody =
    body === undefined
      ? undefined
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
    ? getDedupeKey(path, requestOptions, serializedBody)
    : "";
  const existingRequest = dedupeKey ? inFlightRequests.get(dedupeKey) : null;
  if (existingRequest) return existingRequest as Promise<T>;

  const requestPromise = fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body: serializedBody,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": getAcceptLanguage(),
      ...headers,
    },
  }).then(async (response) => {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await response.json().catch(() => null) : null;

    if (response.status === 401 || data?.statusCode === 401) {
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
  }).finally(() => {
    if (dedupeKey) inFlightRequests.delete(dedupeKey);
  });

  if (dedupeKey) inFlightRequests.set(dedupeKey, requestPromise);

  return requestPromise;
}
