import { NextRequest, NextResponse } from "next/server";

export const DEFAULT_RENDER_BACKEND = "https://machtia-tutor-mcp-server.onrender.com";

export function getBackendBaseUrl(): string {
  return process.env.MCP_BACKEND_URL || process.env.NEXT_PUBLIC_MCP_URL?.replace(/\/mcp\/?$/, "") || DEFAULT_RENDER_BACKEND;
}

export async function proxyToBackend(req: NextRequest, targetPath: string): Promise<Response> {
  const backendBase = getBackendBaseUrl();
  const targetUrl = new URL(targetPath, backendBase);

  // Preserve query parameters
  req.nextUrl.searchParams.forEach((val, key) => {
    targetUrl.searchParams.set(key, val);
  });

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const demoControl = req.headers.get("x-demo-control");
  if (demoControl) headers.set("x-demo-control", demoControl);

  const mcpVersion = req.headers.get("mcp-protocol-version") || req.headers.get("x-mcp-protocol-version");
  if (mcpVersion) headers.set("mcp-protocol-version", mcpVersion);

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // Set Origin and Host to match Render backend so CORS checks always pass
  headers.set("Origin", backendBase);

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {
      body = null;
    }
  }

  try {
    const res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(35000),
    });

    const resContentType = res.headers.get("content-type") || "";
    const resBody = await res.text();

    // If backend returns HTML during spin-up (502/503/504), normalize to JSON so frontend does not choke
    if (resContentType.includes("text/html") && (res.status === 502 || res.status === 503 || res.status === 504 || resBody.toLowerCase().includes("waking up"))) {
      return NextResponse.json(
        {
          error: `Servidor MACHTIA iniciando en la nube (Render spin-up, HTTP ${res.status}). Reintentando conexión...`,
          isColdStart: true,
          status: res.status,
        },
        { status: res.status }
      );
    }

    return new Response(resBody, {
      status: res.status,
      headers: {
        "content-type": resContentType || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return NextResponse.json(
      {
        error: isTimeout
          ? `Tiempo de espera agotado al conectar con el backend MACHTIA (${targetPath}).`
          : `Error al conectar con el servidor backend (${targetPath}): ${err?.message || "Servidor no disponible"}`,
        isColdStart: isTimeout,
        status: isTimeout ? 504 : 503,
      },
      { status: isTimeout ? 504 : 503 }
    );
  }
}
