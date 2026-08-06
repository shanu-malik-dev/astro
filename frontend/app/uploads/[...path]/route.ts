const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const filePath = (params.path || [])
    .map((part) => encodeURIComponent(part))
    .join("/");

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  const upstreamUrl = `${API_BASE_URL.replace(/\/$/, "")}/uploads/${filePath}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      Accept: "*/*",
    },
    cache: "no-store",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return new Response("Not found", { status: upstreamResponse.status });
  }

  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const contentLength = upstreamResponse.headers.get("content-length");

  if (contentType) headers.set("content-type", contentType);
  if (contentLength) headers.set("content-length", contentLength);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
