import { NextResponse } from "next/server";
import { listMcpTools } from "@/mcp/server/tools";
import { PROTOCOL_VERSION, SERVER_NAME, SERVER_VERSION } from "@/mcp/server/transport";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    protocolVersion: PROTOCOL_VERSION,
    transport: "Streamable HTTP",
    server: SERVER_NAME,
    version: SERVER_VERSION,
    toolsCount: listMcpTools().length,
    commit: process.env.RENDER_GIT_COMMIT || process.env.BUILD_SHA || null,
    dataMode: "isolated-ephemeral-demo",
    aiProvider: "deterministic",
    timestamp: new Date().toISOString(),
  });
}
