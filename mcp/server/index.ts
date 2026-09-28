/**
 * MACHTIA Adaptive Tutor - MCP Server Entrypoint
 * Protocol Version: 2025-11-25
 * Transport: Streamable HTTP
 */

import http from "node:http";
import { createMcpHttpServer, PROTOCOL_VERSION, SERVER_NAME } from "./transport";
import { listMcpTools } from "./tools";

export const DEFAULT_MCP_PORT = 3100;

export function startMcpServer(port: number = DEFAULT_MCP_PORT): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = createMcpHttpServer({ port });

    server.listen(port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 MACHTIA Adaptive Tutor - MCP Server`);
      console.log(`   Protocol Version: ${PROTOCOL_VERSION}`);
      console.log(`   Server Name:      ${SERVER_NAME}`);
      console.log(`   Transport:        Streamable HTTP / SSE`);
      console.log(`   Port:             ${port}`);
      console.log(`   Tools Registered: ${listMcpTools().length}`);
      console.log(`------------------------------------------------------`);
      console.log(`   Endpoints:`);
      console.log(`   • JSON-RPC POST:  http://localhost:${port}/mcp`);
      console.log(`   • SSE Stream GET: http://localhost:${port}/mcp`);
      console.log(`   • Health Check:   http://localhost:${port}/health`);
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

// Auto-run if executed directly
if (process.env.NODE_ENV !== "test" && typeof require !== "undefined" && require.main === module) {
  const port = parseInt(process.env.MCP_PORT || String(DEFAULT_MCP_PORT), 10);
  startMcpServer(port).catch((err) => {
    console.error("Failed to start MCP server:", err);
    process.exit(1);
  });
} else if (process.argv[1] && process.argv[1].includes("index.ts")) {
  const port = parseInt(process.env.MCP_PORT || String(DEFAULT_MCP_PORT), 10);
  startMcpServer(port).catch((err) => {
    console.error("Failed to start MCP server:", err);
    process.exit(1);
  });
}
