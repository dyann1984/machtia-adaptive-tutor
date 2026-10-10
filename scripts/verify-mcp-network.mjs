import http from "node:http";

async function doFetch(url, options = {}) {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: data,
            json: () => JSON.parse(data),
          });
        });
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function run() {
  console.log("=== VERIFYING REAL MCP SERVER ON 127.0.0.1:3100 ===\n");

  // 1. GET /health
  console.log("1. GET http://127.0.0.1:3100/health");
  const healthRes = await doFetch("http://127.0.0.1:3100/health");
  console.log(`Status: ${healthRes.status}`);
  const healthJson = healthRes.json();
  console.log("Response:", JSON.stringify(healthJson, null, 2));

  if (healthRes.status !== 200 || healthJson.status !== "ok") {
    throw new Error(`Health check failed: ${healthRes.status}`);
  }

  // 2. POST /mcp -> initialize
  console.log("\n2. POST http://127.0.0.1:3100/mcp (method: initialize)");
  const initRes = await doFetch("http://127.0.0.1:3100/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "verify-init-1",
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        clientInfo: { name: "manual-verifier", version: "1.0.0" },
      },
    }),
  });
  console.log(`Status: ${initRes.status}`);
  const initJson = initRes.json();
  console.log("Initialize Result:", JSON.stringify(initJson.result, null, 2));

  if (initRes.status !== 200 || !initJson.result?.protocolVersion) {
    throw new Error(`Initialize failed: ${initRes.status}`);
  }

  // 3. POST /mcp -> tools/list
  console.log("\n3. POST http://127.0.0.1:3100/mcp (method: tools/list)");
  const toolsRes = await doFetch("http://127.0.0.1:3100/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "verify-tools-1",
      method: "tools/list",
      params: {},
    }),
  });
  console.log(`Status: ${toolsRes.status}`);
  const toolsJson = toolsRes.json();
  const tools = toolsJson.result?.tools || [];
  console.log(`Tools count: ${tools.length}`);
  console.log("Tool names:", tools.map((t) => t.name));

  if (tools.length !== 15) {
    throw new Error(`Expected 15 tools, got ${tools.length}`);
  }

  console.log("\n✅ ALL REAL NETWORK CHECKS PASSED ON 127.0.0.1:3100!");
}

run().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
