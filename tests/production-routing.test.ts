import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type http from "node:http";
import { createMcpHttpServer } from "../mcp/server/transport";

describe("Production web and MCP share one service", () => {
  let server: http.Server;
  let baseUrl: string;
  beforeAll(async () => {
    server = createMcpHttpServer({
      port: 0,
      webHandler: (req, res) => {
        res.setHeader("Content-Type", "text/html");
        res.end(`<html>${req.url}</html>`);
      },
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as import("node:net").AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  it("routes judge query and assets to the web app", async () => {
    for (const path of ["/?demo=judge", "/_next/static/test.js", "/machtia-tutor-official.png"]) {
      const response = await fetch(baseUrl + path);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain(path);
    }
  });
  it("retains MCP health and JSON-RPC on the same origin", async () => {
    const health = await fetch(baseUrl + "/health");
    expect((await health.json()).toolsCount).toBe(15);
    const response = await fetch(baseUrl + "/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    expect((await response.json()).result.protocolVersion).toBe("2025-11-25");
  });
});
