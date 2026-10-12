// scripts/test-chat-keystrokes.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          for (const fn of listeners) fn(msg.params);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { res, rej });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  on(method, fn) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(fn);
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }
}

async function testChat() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDir = "C:\\Users\\DYANN\\AppData\\Local\\Temp\\chrome_keystrokes_" + Date.now();
  fs.mkdirSync(userDir, { recursive: true });

  const proc = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDir}`,
    "--window-size=1366,850",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { detached: true, stdio: "ignore" });

  await new Promise((r) => setTimeout(r, 2000));
  const newTabRes = await fetch("http://127.0.0.1:9222/json/new?https://machtia-adaptive-tutor.vercel.app/?demo=judge", { method: "PUT" });
  const newTab = await newTabRes.json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");

  let ttsCalls = [];
  cdp.on("Network.responseReceived", (p) => {
    if (p.response.url.includes("/api/tts")) {
      ttsCalls.push({
        status: p.response.status,
        source: p.response.headers["x-tts-source"],
        type: p.response.headers["content-type"],
      });
      console.log(`[NETWORK /api/tts] status: ${p.response.status}, source: ${p.response.headers["x-tts-source"]}`);
    }
  });

  console.log("Waiting 5s for page load...");
  await new Promise((r) => setTimeout(r, 5000));

  // Step 1: Open MIA by clicking button
  console.log("Clicking open MIA button...");
  const opened = await cdp.eval(`
    (() => {
      const btn = document.querySelector('button[aria-label="Abrir compañera educativa MIA"]') ||
                  document.querySelector('button[aria-label*="Abrir a MIA"]');
      if (btn) {
        btn.click();
        return { clicked: true, aria: btn.getAttribute('aria-label') };
      }
      return { clicked: false };
    })()
  `);
  console.log("Opened MIA result:", opened);
  await new Promise((r) => setTimeout(r, 1500));

  // Step 2: Switch to "Pregunta Libre" mode
  await cdp.eval(`
    (() => {
      const libreBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pregunta Libre') || b.textContent.includes('Libre'));
      if (libreBtn) libreBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Step 3: Find input, focus it and insert text
  const inputInfo = await cdp.eval(`
    (() => {
      const input = document.querySelector('input[placeholder*="Pregúntale a MIA"]') ||
                    document.querySelector('input[placeholder*="Pide una pista"]') ||
                    document.querySelector('form input');
      if (input) {
        input.focus();
        return { found: true, placeholder: input.placeholder };
      }
      return { found: false };
    })()
  `);
  console.log("Input found:", inputInfo);

  if (inputInfo.found) {
    // Type Question A: "¿Quién descubrió América?"
    console.log("Typing: ¿Quién descubrió América?");
    await cdp.send("Input.insertText", { text: "¿Quién descubrió América?" });
    await new Promise((r) => setTimeout(r, 300));

    // Submit form
    await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 13, code: "Enter", key: "Enter" });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 13, code: "Enter", key: "Enter" });

    console.log("Submitted! Waiting for reply and audio...");
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const check = await cdp.eval(`
        (() => {
          const texts = Array.from(document.querySelectorAll('.rounded-2xl, [data-sender="mia"]')).map(el => el.textContent);
          const historyAns = texts.find(t => t.includes('Colón') || t.includes('1492'));
          return historyAns ? historyAns.slice(0, 120) : null;
        })()
      `);
      if (check) {
        console.log("[MIA ANSWERED!]", check);
        break;
      }
    }
  }

  // Wait 4s for audio to synthesize and play
  await new Promise((r) => setTimeout(r, 4000));
  console.log("TTS calls captured:", JSON.stringify(ttsCalls, null, 2));

  cdp.ws.close();
  proc.kill();
}

testChat().catch(console.error);
