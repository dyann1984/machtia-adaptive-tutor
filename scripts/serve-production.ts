import next from "next";
import { createMcpHttpServer } from "../mcp/server/transport";

async function main() {
  const port = Number(process.env.PORT || 3000);
  const host = "0.0.0.0";
  const app = next({ dev: false, hostname: host, port });
  await app.prepare();
  const server = createMcpHttpServer({ port, host, webHandler: app.getRequestHandler() });
  server.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
  server.listen(port, host, () => {
    console.log(`MACHTIA web + MCP ready on port ${port}`);
  });
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      server.close(() => process.exit(0));
      server.closeIdleConnections();
      setTimeout(() => process.exit(0), 10000).unref();
    });
  }
}

main().catch((error) => {
  console.error("Failed to start MACHTIA production service:", error);
  process.exit(1);
});
