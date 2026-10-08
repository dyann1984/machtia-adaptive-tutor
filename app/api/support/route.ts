import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/mcp/backend-proxy";

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/api/support");
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Demo-Control",
    },
  });
}
