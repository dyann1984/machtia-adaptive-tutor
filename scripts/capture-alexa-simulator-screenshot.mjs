import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_cdp_alexa_" + Date.now());
const PORT = 9224;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const outputDir = path.join("docs", "screenshots", "interactive");
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Check or start next server
  let nextProc = null;
  let isServerRunning = false;
  try {
    const res = await fetch("http://localhost:3000");
    if (res.ok) isServerRunning = true;
  } catch (e) {}

  if (!isServerRunning) {
    console.log("Starting Next.js production server on port 3000...");
    nextProc = spawn("cmd.exe", ["/c", "npx.cmd next start -p 3000"], {
      stdio: "ignore",
      detached: false,
    });
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      try {
        const r = await fetch("http://localhost:3000");
        if (r.ok) {
          isServerRunning = true;
          break;
        }
      } catch (e) {}
    }
  }

  if (!isServerRunning) {
    throw new Error("Could not start or connect to Next.js on port 3000");
  }

  console.log("Launching Headless Edge on port", PORT);
  const edgeProc = spawn(
    EDGE_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let targets = null;
  for (let i = 0; i < 25; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    throw new Error("Could not connect to Edge DevTools");
  }

  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  console.log("Connecting to target WebSocket:", pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCommand("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async function waitForButton(textSubstring, timeout = 15000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const found = await evaluate(`(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.toLowerCase().includes('${lower}') && !b.disabled);
        if (btn) {
          btn.scrollIntoView({ behavior: 'instant', block: 'center' });
          btn.click();
          return true;
        }
        return false;
      })()`);
      if (found) return true;
      await sleep(300);
    }
    throw new Error("Timeout waiting for button: " + textSubstring);
  }

  async function waitForText(textSubstring, timeout = 15000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const found = await evaluate(`document.body.innerText.toLowerCase().includes('${lower}')`);
      if (found) return true;
      await sleep(400);
    }
    throw new Error("Timeout waiting for text: " + textSubstring);
  }

  async function saveScreenshot(fileName) {
    const res = await sendCommand("Page.captureScreenshot", { format: "png" });
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(res.data, "base64"));
    console.log(`📸 Saved screenshot: ${filePath} (${Math.round((res.data.length * 0.75) / 1024)} KB)`);
  }

  try {
    await sendCommand("Page.enable");
    await sendCommand("Runtime.enable");

    // Set 1440x900 viewport
    await sendCommand("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to http://localhost:3000 ...");
    await sendCommand("Page.navigate", { url: "http://localhost:3000" });
    await sleep(2500);

    // If on landing, click enter
    try {
      await waitForButton("ir a la aplicación", 3000);
      await sleep(1500);
    } catch (e) {
      console.log("Already inside application");
    }

    // Click "Simulador Alexa+"
    console.log("Opening Alexa+ Simulator Modal...");
    await waitForButton("simulador alexa+", 6000);
    await sleep(1500);

    // Wait for Alexa modal text
    await waitForText("simulación amazon alexa+", 6000);
    console.log("Modal opened successfully.");

    // Step 1: get_student_context
    console.log("Executing Step 1: get_student_context...");
    await waitForButton("1. get_student_context", 4000);
    await sleep(1200);

    // Step 2: start_practice
    console.log("Executing Step 2: start_practice...");
    await waitForButton("2. start_practice", 4000);
    await sleep(1200);

    // Step 3: submit_answer ("dos cuartos")
    console.log("Executing Step 3: submit oral answer 'dos cuartos'...");
    await waitForButton("dos cuartos", 4000);
    await sleep(1200);

    // Capture screenshot 14: Echo Show simulator in action
    await saveScreenshot("14-alexa-plus-simulator-echo-show.png");

    // Toggle JSON-RPC inspector
    console.log("Toggling JSON-RPC Inspector...");
    await waitForButton("inspector técnico", 4000);
    await sleep(800);

    // Capture screenshot 15: Inspector with live JSON-RPC request and response
    await saveScreenshot("15-alexa-plus-json-rpc-inspector.png");

    // Step 4: complete_practice
    console.log("Executing Step 4: complete_practice...");
    await waitForButton("4. complete_practice", 4000);
    await sleep(1200);

    // Capture screenshot 16: Completed practice and delta celebration
    await saveScreenshot("16-alexa-plus-celebration-and-evidence.png");

    console.log("🎉 All Alexa+ Simulator screenshots successfully captured!");
  } finally {
    try {
      ws.close();
    } catch (e) {}
    try {
      edgeProc.kill();
    } catch (e) {}
    if (nextProc) {
      try {
        nextProc.kill();
      } catch (e) {}
    }
  }
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
