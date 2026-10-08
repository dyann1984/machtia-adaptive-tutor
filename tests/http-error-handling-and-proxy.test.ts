import { describe, it, expect } from "vitest";
import { McpHttpError } from "@/lib/mcp/client";
import { createMcpHttpServer } from "@/mcp/server/transport";
import type { Server } from "node:http";

describe("HTTP Error Classification and Resilience", () => {
  it("classifies HTTP 404 strictly as not-found and NEVER as cold-start", () => {
    const err = new McpHttpError(404, "Ruta no encontrada", "/api/demo");
    expect(err.isNotFound).toBe(true);
    expect(err.isColdStart).toBe(false);
    expect(err.isUnauthorized).toBe(false);
    expect(err.isForbidden).toBe(false);
    expect(err.status).toBe(404);
  });

  it("classifies HTTP 502, 503, 504 as cold-start / server wake-up", () => {
    const err502 = new McpHttpError(502, "Bad Gateway", "/api/demo");
    const err503 = new McpHttpError(503, "Service Unavailable", "/api/demo");
    const err504 = new McpHttpError(504, "Gateway Timeout", "/api/demo");

    expect(err502.isColdStart).toBe(true);
    expect(err502.isNotFound).toBe(false);
    expect(err503.isColdStart).toBe(true);
    expect(err504.isColdStart).toBe(true);
  });

  it("classifies HTTP 401 as unauthorized and HTTP 403 as forbidden", () => {
    const err401 = new McpHttpError(401, "Unauthorized", "/api/state");
    const err403 = new McpHttpError(403, "Forbidden", "/api/state");

    expect(err401.isUnauthorized).toBe(true);
    expect(err401.isColdStart).toBe(false);
    expect(err403.isForbidden).toBe(true);
    expect(err403.isColdStart).toBe(false);
  });

  it("allows requests strictly from authorized MACHTIA domains and rejects unauthorized origins", async () => {
    const server: Server = createMcpHttpServer({ port: 0 });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

    try {
      // 1. Authorized MACHTIA Vercel production origin
      const resVercel = await fetch(base + "/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://machtia-adaptive-tutor.vercel.app",
        },
        body: "{}",
      });
      expect(resVercel.status).toBe(201);
      const dataVercel = await resVercel.json();
      expect(dataVercel.actorToken).toBeDefined();

      // 2. Unauthorized Vercel subdomain must be rejected
      const resUnauthorizedVercel = await fetch(base + "/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://unauthorized-project.vercel.app",
        },
        body: "{}",
      });
      expect(resUnauthorizedVercel.status).toBe(403);

      // 3. Evil origin must still be rejected with 403
      const resEvil = await fetch(base + "/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.example.com",
        },
        body: "{}",
      });
      expect(resEvil.status).toBe(403);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
