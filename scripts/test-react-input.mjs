// scripts/test-react-input.mjs
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
    return res.result?.result?.value;
  }
}

async function testReactInput() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDir = "C:\\Users\\DYANN\\AppData\\Local\\Temp\\chrome_react_" + Date.now();
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

  let ttsResponses = [];
  cdp.on("Network.responseReceived", (p) => {
    if (p.response.url.includes("/api/tts")) {
      ttsResponses.push({
        status: p.response.status,
        headers: p.response.headers,
      });
      console.log(`[TTS NETWORK EVENT] status: ${p.response.status}, source: ${p.response.headers["x-tts-source"]}`);
    }
  });

  console.log("Waiting 5s for page hydration...");
  await new Promise((r) => setTimeout(r, 5000));

  // Open companion
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('button[aria-label="Abrir compañera educativa MIA"]') ||
                  document.querySelector('button[aria-label*="Abrir a MIA"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Switch to Libre tab
  await cdp.eval(`
    (() => {
      const libreTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pregunta Libre') || b.textContent.includes('Libre'));
      if (libreTab) libreTab.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Enter text using React native value setter and submit
  const submitResult = await cdp.eval(`
    (() => {
      const input = document.querySelector('input[placeholder*="Pregúntale a MIA"]') ||
                    document.querySelector('input[placeholder*="Pide una pista"]') ||
                    document.querySelector('footer input');
      if (!input) return { ok: false, error: 'Input not found' };

      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, '¿Quién descubrió América?');
      input.dispatchEvent(new Event('input', { bubbles: true }));

      const form = input.closest('form');
      const submitBtn = form?.querySelector('button[type="submit"]');

      const btnDisabled = submitBtn ? submitBtn.disabled : null;

      // Click submit button directly
      if (submitBtn) {
        submitBtn.click();
      } else if (form) {
        form.requestSubmit();
      }

      return {
        ok: true,
        inputValue: input.value,
        btnDisabledBefore: btnDisabled,
        hasSubmitBtn: Boolean(submitBtn)
      };
    })()
  `);
  console.log("Submit result:", submitResult);

  // Poll for MIA reply
  console.log("Polling for response in DOM...");
  let replyText = null;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 600));
    replyText = await cdp.eval(`
      (() => {
        const bubbles = Array.from(document.querySelectorAll('.rounded-2xl, [data-sender="mia"]')).map(el => el.textContent);
        const columbusMsg = bubbles.find(b => b.includes('Colón') || b.includes('1492') || b.includes('pueblos originarios'));
        return columbusMsg || null;
      })()
    `);
    if (replyText) {
      console.log("\n[SUCCESS] MIA Reply found in browser DOM:");
      console.log(replyText.slice(0, 160) + "...\n");
      break;
    }
  }

  // Wait 4s for audio synthesis and playback
  await new Promise((r) => setTimeout(r, 4000));
  console.log("TTS calls received:", JSON.stringify(ttsResponses, null, 2));

  cdp.ws.close();
  proc.kill();
}

testReactInput().catch(console.error);
