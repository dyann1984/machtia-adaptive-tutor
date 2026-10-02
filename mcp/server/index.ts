/**
 * MACHTIA Adaptive Tutor - MCP Server Entrypoint
 * Protocol Version: 2025-11-25
 * Transport: Streamable HTTP
 */

import http from "node:http";
import { createMcpHttpServer, PROTOCOL_VERSION, SERVER_NAME } from "./transport";
import { listMcpTools } from "./tools";

export const DEFAULT_MCP_PORT = 3100;

export function startMcpServer(
  port: number = parseInt(process.env.PORT || process.env.MCP_PORT || String(DEFAULT_MCP_PORT), 10),
  host: string = process.env.MCP_HOST || "0.0.0.0"
): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = createMcpHttpServer({ port, host });

    server.listen(port, host, () => {
      const displayHost = host === "0.0.0.0" ? "localhost" : host;
      console.log(`\n======================================================`);
      console.log(`🚀 MACHTIA Adaptive Tutor - MCP Server`);
      console.log(`   Protocol Version: ${PROTOCOL_VERSION}`);
      console.log(`   Server Name:      ${SERVER_NAME}`);
      console.log(`   Transport:        Streamable HTTP / SSE`);
      console.log(`   Host:             ${host}`);
      console.log(`   Port:             ${port}`);
      console.log(`   Tools Registered: ${listMcpTools().length}`);
      console.log(`------------------------------------------------------`);
      console.log(`   Endpoints:`);
      console.log(`   • JSON-RPC POST:  http://${displayHost}:${port}/mcp`);
      console.log(`   • SSE Stream GET: http://${displayHost}:${port}/mcp`);
      console.log(`   • Health Check:   http://${displayHost}:${port}/health`);
      console.log(`======================================================\n`);
      resolve(server);
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}

export function stopMcpServer(server?: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Auto-run only if executed directly as entrypoint
const isImported = Boolean(
  process.env.VITEST ||
  process.env.NODE_ENV === "test" ||
  process.env.npm_lifecycle_event?.startsWith("test") ||
  process.argv[1]?.includes("verify-")
);

if (!isImported) {
  const port = parseInt(process.env.PORT || process.env.MCP_PORT || String(DEFAULT_MCP_PORT), 10);
  const host = process.env.MCP_HOST || "0.0.0.0";
  startMcpServer(port, host).catch((err) => {
    console.error("Failed to start MCP server:", err);
    process.exit(1);
  });
}
