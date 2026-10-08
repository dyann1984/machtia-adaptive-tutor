import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/mcp/backend-proxy";

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/mcp");
}

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/mcp");
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, MCP-Protocol-Version, MCP-Session-Id, X-Demo-Control",
    },
  });
}
