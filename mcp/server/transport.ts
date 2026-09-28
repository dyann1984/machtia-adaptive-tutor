/**
 * MACHTIA Adaptive Tutor - MCP Streamable HTTP Transport
 * Protocol Version: 2025-11-25
 * Specification: Model Context Protocol (MCP) Streamable HTTP & SSE Transport
 */

import http from "node:http";
import { listMcpTools, executeMcpTool } from "./tools";

export interface TransportConfig {
  port: number;
  host?: string;
  corsOrigin?: string;
}

export const PROTOCOL_VERSION = "2025-11-25";
export const SERVER_NAME = "machtia-tutor-mcp-server";
export const SERVER_VERSION = "1.0.0";

/**
 * Creates and configures the Streamable HTTP MCP Server.
 */
export function createMcpHttpServer(config: TransportConfig): http.Server {
  const { port, host = "0.0.0.0", corsOrigin } = config;

  const server = http.createServer(async (req, res) => {
    // 1. Setup CORS Headers dynamically supporting MCP_ALLOWED_ORIGINS
    const incomingOrigin = req.headers.origin;
    const envOrigins = process.env.MCP_ALLOWED_ORIGINS;
    let resolvedOrigin = "*";

    if (envOrigins) {
      const allowed = envOrigins.split(",").map((s) => s.trim()).filter(Boolean);
      if (incomingOrigin) {
        const matches = allowed.some((allowedOrigin) => {
          if (allowedOrigin === "*") return true;
          if (allowedOrigin === incomingOrigin) return true;
          if (allowedOrigin.includes("*")) {
            const regex = new RegExp("^" + allowedOrigin.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
            return regex.test(incomingOrigin);
          }
          return false;
        });
        if (matches) {
          resolvedOrigin = incomingOrigin;
        } else {
          resolvedOrigin = allowed[0] || "*";
        }
      } else {
        resolvedOrigin = allowed[0] || "*";
      }
    } else if (corsOrigin) {
      resolvedOrigin = corsOrigin;
    }

    res.setHeader("Access-Control-Allow-Origin", resolvedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-mcp-session-id, x-mcp-protocol-version"
    );
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    // 2. Health Endpoint
    if (req.method === "GET" && (pathname === "/health" || pathname === "/healthz")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          protocolVersion: PROTOCOL_VERSION,
          transport: "Streamable HTTP",
          server: SERVER_NAME,
          version: SERVER_VERSION,
          toolsCount: listMcpTools().length,
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // 3. SSE / Streamable connection (GET /mcp or GET /sse)
    if (req.method === "GET" && (pathname === "/mcp" || pathname === "/sse" || pathname === "/mcp/stream")) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });

      res.write(`event: endpoint\ndata: ${pathname}\n\n`);
      res.write(
        `event: ready\ndata: ${JSON.stringify({
          server: SERVER_NAME,
          protocolVersion: PROTOCOL_VERSION,
          transport: "Streamable HTTP",
        })}\n\n`
      );

      // Keep alive heartbeat interval
      const heartbeat = setInterval(() => {
        if (!res.writableEnded) {
          res.write(`event: ping\ndata: {}\n\n`);
        }
      }, 15000);

      req.on("close", () => {
        clearInterval(heartbeat);
      });
      return;
    }

    // 4. Main MCP JSON-RPC Streamable HTTP Endpoint (POST /mcp or POST /)
    if (req.method === "POST" && (pathname === "/mcp" || pathname === "/")) {
      let body = "";
      req.setEncoding("utf8");

      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        if (!body.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Empty request body" }));
          return;
        }

        try {
          const jsonRpcRequest = JSON.parse(body);
          const response = await handleJsonRpcMessage(jsonRpcRequest);

          if (response === null) {
            // Notification without response
            res.writeHead(204);
            res.end();
            return;
          }

          res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Transfer-Encoding": "chunked",
          });
          res.end(JSON.stringify(response));
        } catch (err: any) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              id: null,
              error: {
                code: -32700,
                message: "Parse error",
                data: err?.message,
              },
            })
          );
        }
      });
      return;
    }

    // 404 Fallback
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found", path: pathname }));
  });

  return server;
}

/**
 * Handles incoming JSON-RPC 2.0 messages according to the MCP specification.
 */
async function handleJsonRpcMessage(
  req: any
): Promise<any | null> {
  // Support batch requests
  if (Array.isArray(req)) {
    const results = await Promise.all(req.map((r) => handleJsonRpcMessage(r)));
    return results.filter((r) => r !== null);
  }

  const { jsonrpc, id, method, params } = req || {};

  // Notifications (no id)
  if (id === undefined || id === null) {
    if (method === "notifications/initialized") {
      return null;
    }
  }

  // 1. initialize
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
        instructions:
          "MACHTIA Adaptive Tutor MCP Server - Exposes educational diagnostics, adaptive practice generation, and teacher reporting for Amazon Alexa+ and AI tutors.",
      },
    };
  }

  // 2. ping
  if (method === "ping") {
    return {
      jsonrpc: "2.0",
      id,
      result: {},
    };
  }

  // 3. tools/list
  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: listMcpTools(),
      },
    };
  }

  // 4. tools/call
  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};

    if (!toolName) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32602,
          message: "Invalid params: 'name' is required in tools/call",
        },
      };
    }

    const callResult = await executeMcpTool(toolName, args);
    return {
      jsonrpc: "2.0",
      id,
      result: callResult,
    };
  }

  // Method not found
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: '${method}'`,
    },
  };
}
