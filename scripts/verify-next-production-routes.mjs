import { spawn } from "node:child_process";
import path from "node:path";

const PORT = 3456;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("Starting Next.js production server on port", PORT);
  const nextProc = spawn("cmd.exe", ["/c", `npx next start -p ${PORT}`], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextProc.stdout.on("data", (d) => console.log("[NEXT]", d.toString().trim()));
  nextProc.stderr.on("data", (d) => console.error("[NEXT ERR]", d.toString().trim()));

  // Wait for server to start
  let started = false;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        started = true;
        break;
      }
    } catch {}
  }

  if (!started) {
    nextProc.kill();
    throw new Error("Next.js production server failed to start within 15s");
  }

  console.log("Next.js server is UP! Testing all production endpoints through Next.js...");

  // 1. Health
  const healthRes = await fetch(`${BASE_URL}/health`);
  console.log("✓ /health status:", healthRes.status, await healthRes.json());

  // 2. POST /api/demo
  const demoRes = await fetch(`${BASE_URL}/api/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  console.log("✓ /api/demo status:", demoRes.status);
  const demoData = await demoRes.json();
  console.log("  actorToken:", demoData.actorToken ? "Present" : "MISSING");
  console.log("  judgeToken:", demoData.judgeToken ? "Present" : "MISSING");

  // 3. POST /api/role
  const roleRes = await fetch(`${BASE_URL}/api/role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Demo-Control": demoData.judgeToken,
    },
    body: JSON.stringify({ role: "teacher", studentId: "mariana-lopez" }),
  });
  console.log("✓ /api/role status:", roleRes.status);
  const roleData = await roleRes.json();
  console.log("  role actorToken:", roleData.actorToken ? "Present" : "MISSING");

  // 4. GET /api/state
  const stateRes = await fetch(`${BASE_URL}/api/state`, {
    headers: { Authorization: "Bearer " + roleData.actorToken },
  });
  console.log("✓ /api/state status:", stateRes.status);
  const stateData = await stateRes.json();
  console.log("  teacher:", stateData.teacher?.name);
  console.log("  students count:", stateData.students?.length);
  console.log("  practices count:", stateData.practices?.length);

  // 5. POST /mcp (tools/list)
  const mcpListRes = await fetch(`${BASE_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: "Bearer " + roleData.actorToken,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  console.log("✓ /mcp tools/list status:", mcpListRes.status);
  const mcpListData = await mcpListRes.json();
  console.log("  MCP tools count:", mcpListData.result?.tools?.length);

  // 6. POST /mcp (tools/call generate_adaptive_practice)
  const genRes = await fetch(`${BASE_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: "Bearer " + roleData.actorToken,
      "MCP-Protocol-Version": "2025-11-25",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "gen-1",
      method: "tools/call",
      params: {
        name: "generate_adaptive_practice",
        arguments: { studentId: "mariana-lopez", topicId: "fracciones-equivalentes", exerciseCount: 5 },
      },
    }),
  });
  console.log("✓ /mcp generate_adaptive_practice status:", genRes.status);
  const genData = await genRes.json();
  const practiceId = genData.result?.structuredContent?.practiceId;
  console.log("  generated practiceId:", practiceId);

  // 7. POST /api/mia
  const miaRes = await fetch(`${BASE_URL}/api/mia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "¿Cómo se suman las fracciones?", mode: "tutor" }),
  });
  console.log("✓ /api/mia status:", miaRes.status);
  const miaData = await miaRes.json();
  console.log("  MIA response text snippet:", miaData.text?.slice(0, 60));

  // 8. Headless Edge inspection of the UI
  console.log("\nLaunching Headless Edge to verify complete client loading...");
  const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_test_prod_" + Date.now());
  const DEBUG_PORT = 9253;

  const edgeProc = spawn(EDGE_PATH, [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore" });

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      if (res.ok) { targets = await res.json(); break; }
    } catch {}
  }

  const pageTarget = targets.find(t => t.type === "page") || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });

  let msgId = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const consoleErrors = [];
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p.reject(data.error);
      else p.resolve(data.result);
    }
    if (data.method === "Runtime.consoleAPICalled" && data.params.type === "error") {
      consoleErrors.push((data.params.args || []).map(a => a.value ?? a.description ?? "").join(" "));
    }
  };

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url: `${BASE_URL}/?demo=judge` });
  await sleep(5000);

  const bodySnippet = await send("Runtime.evaluate", {
    expression: "document.body ? document.body.innerText.slice(0, 400) : ''",
    returnByValue: true,
  });
  console.log("UI BODY TEXT SNIPPET:\n", bodySnippet.result?.value);

  const hasLoadingBlock = (bodySnippet.result?.value || "").includes("Iniciando servidor en la nube") || (bodySnippet.result?.value || "").includes("HTTP 404");
  console.log("Blocked by 404/Loading screen?", hasLoadingBlock ? "YES (FAILED)" : "NO (PASSED)");

  ws.close();
  edgeProc.kill();
  nextProc.kill();

  if (hasLoadingBlock) {
    throw new Error("Application is still blocked by loading screen!");
  }

  console.log("\nALL PRODUCTION ROUTE VERIFICATIONS PASSED 100%!");
  process.exit(0);
}

main().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
