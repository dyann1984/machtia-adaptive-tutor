import { spawn } from "node:child_process";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_repro3_" + Date.now());
const PORT = 9295;
const TARGET_URL = "https://machtia-adaptive-tutor.vercel.app/?demo=judge";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("==================================================================");
  console.log("🔍 TESTING CLICKING 'Ver brecha de Mariana López' EXACTLY");
  console.log("==================================================================");

  const edgeProc = spawn(EDGE_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
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
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
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

  const consoleLogs = [];
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p.reject(data.error);
      else p.resolve(data.result);
    }
    if (data.method === "Runtime.consoleAPICalled") {
      const text = (data.params.args || []).map(a => a.value ?? a.description ?? "").join(" ");
      consoleLogs.push(`[Console ${data.params.type}]: ${text}`);
      console.log(`  [Console ${data.params.type}]: ${text}`);
    }
    if (data.method === "Runtime.exceptionThrown") {
      consoleLogs.push(`[Exception]: ` + JSON.stringify(data.params.exceptionDetails));
      console.log(`  [Exception]:`, JSON.stringify(data.params.exceptionDetails));
    }
    if (data.method === "Network.responseReceived") {
      console.log(`  [Network Response]: ${data.params.response.status} ${data.params.response.url}`);
    }
  };

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");

  console.log("\n1. Navigating to TARGET_URL...");
  await send("Page.navigate", { url: TARGET_URL });
  await sleep(6000);

  console.log("\n2. Switching to Tutor IA tab...");
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const tab = btns.find(b => b.textContent && b.textContent.trim().startsWith('Tutor'));
    if (tab) tab.click();
  })()`);
  await sleep(2000);

  console.log("\n3. Finding and clicking the button 'Ver brecha de Mariana López'...");
  const clicked = await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.textContent && b.textContent.includes('Ver brecha de Mariana López'));
    if (target) {
      target.click();
      return target.textContent.trim();
    }
    return null;
  })()`);
  console.log("Clicked button:", clicked);

  console.log("\n4. Monitoring state over 25 seconds...");
  for (let i = 1; i <= 10; i++) {
    await sleep(2500);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const hasStep = text.includes('Consultando herramientas MCP del servidor');
      const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enviar'));
      const isSendDisabled = sendBtn ? sendBtn.disabled : null;
      const chatBoxes = Array.from(document.querySelectorAll('.whitespace-pre-line, [class*=\"max-w-2xl\"]')).map(el => el.textContent.trim());
      return {
        hasThinking,
        hasStep,
        isSendDisabled,
        chats: chatBoxes.slice(-2)
      };
    })()`);
    console.log(`[t = ${(i * 2.5).toFixed(1)}s]`, JSON.stringify(state));
  }

  ws.close();
  edgeProc.kill();
}

main().catch(err => {
  console.error("Script error:", err);
  process.exit(1);
});
