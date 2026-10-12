// scripts/browser-production-audit.mjs
// Full browser interactive audit of MACHTIA MIA 2.0 on Vercel Production

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TARGET_URL = "https://machtia-adaptive-tutor.vercel.app/?demo=judge";
const EVIDENCE_DIR = "l:\\HACK DEV\\MACHTIA TUTOR\\docs\\evidence";

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

  async captureScreenshot(outputPath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(res.data, "base64");
    fs.writeFileSync(outputPath, buffer);
    console.log(`[SCREENSHOT] Saved: ${outputPath} (${buffer.length} bytes)`);
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

async function runBrowserAudit() {
  console.log("=== STARTING MACHTIA MIA 2.0 BROWSER PRODUCTION AUDIT ===");
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDir = "C:\\Users\\DYANN\\AppData\\Local\\Temp\\chrome_audit_" + Date.now();
  fs.mkdirSync(userDir, { recursive: true });

  const proc = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDir}`,
    "--window-size=1366,850",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--autoplay-policy=no-user-gesture-required",
    "about:blank",
  ], { detached: true, stdio: "ignore" });

  try {
    let versionData = null;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        const res = await fetch("http://127.0.0.1:9222/json/version");
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
    }

    if (!versionData) throw new Error("Could not connect to Chrome debugging port");
    console.log(`[CHROME] Connected successfully: ${versionData.Browser}`);

    // Create a new blank tab
    const newTabRes = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
    const newTab = await newTabRes.json();
    const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
    await cdp.connect();
    console.log("[CDP] Connected to target page tab");

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    // Telemetry tracking
    const networkCalls = { tts: [] };
    const webSpeechCalls = [];

    cdp.on("Network.responseReceived", (params) => {
      if (params.response.url.includes("/api/tts")) {
        networkCalls.tts.push({
          url: params.response.url,
          status: params.response.status,
          headers: params.response.headers,
        });
      }
    });

    // Instrument window to detect speech synthesis usage and audio element playback
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        window.__machtiaAudit = {
          webSpeechUsed: false,
          webSpeechUtterances: [],
          audioElementsCreated: 0,
          audioPlayEvents: [],
          ttsResponses: []
        };
        if (window.speechSynthesis) {
          const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
          window.speechSynthesis.speak = function(utt) {
            window.__machtiaAudit.webSpeechUsed = true;
            window.__machtiaAudit.webSpeechUtterances.push(utt?.text);
            return origSpeak(utt);
          };
        }
        const OrigAudio = window.Audio;
        window.Audio = function(src) {
          const a = new OrigAudio(src);
          window.__machtiaAudit.audioElementsCreated++;
          a.addEventListener('play', () => {
            window.__machtiaAudit.audioPlayEvents.push({ src: a.src, time: Date.now() });
          });
          return a;
        };
      `,
    });

    // Step 1: Navigate to Production
    console.log(`\n--- NAVIGATING TO ${TARGET_URL} ---`);
    await cdp.send("Page.navigate", { url: TARGET_URL });
    await new Promise((r) => setTimeout(r, 4500)); // wait for full load & hydration

    const pageTitle = await cdp.eval("document.title");
    console.log(`[PAGE LOADED] Title: "${pageTitle}"`);

    // Capture Landing Screenshot
    await cdp.captureScreenshot(path.join(EVIDENCE_DIR, "browser_01_landing.png"));

    // Step 2: Verify MiaLivingAvatar & Non-obstructive Layout
    console.log("\n--- VERIFYING MIA LIVING AVATAR & LAYOUT ---");
    const avatarInfo = await cdp.eval(`
      (() => {
        const avatar = document.querySelector('[data-testid="mia-living-avatar"]') ||
                       document.querySelector('svg[aria-label*="MIA"]') ||
                       document.querySelector('svg');
        const floatingWidget = document.querySelector('[data-testid="mia-floating-companion"]') ||
                               document.querySelector('.fixed.bottom-4.right-4') ||
                               document.querySelector('[aria-label="Abrir compañera MIA"]') ||
                               document.querySelector('button[title*="MIA"]');
        return {
          hasAvatar: Boolean(avatar),
          avatarTag: avatar ? avatar.tagName : null,
          hasFloatingWidget: Boolean(floatingWidget),
          floatingBounds: floatingWidget ? floatingWidget.getBoundingClientRect() : null,
          bodyWidth: window.innerWidth,
          bodyHeight: window.innerHeight
        };
      })()
    `);
    console.log("Avatar & Layout Info:", JSON.stringify(avatarInfo, null, 2));

    // Step 3: Open MIA Floating Companion if closed
    console.log("\n--- OPENING MIA COMPANION ---");
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('[aria-label="Abrir compañera MIA"]') ||
                    document.querySelector('button[title*="MIA"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('MIA') || b.textContent.includes('Preguntar'));
        if (btn) btn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 1200));

    // Capture open companion screenshot
    await cdp.captureScreenshot(path.join(EVIDENCE_DIR, "browser_02_companion_open.png"));

    // Function to submit chat question and wait for reply
    async function askMIA(questionText) {
      console.log(`\n[ASKING MIA] "${questionText}"`);
      await cdp.eval(`
        (() => {
          const input = document.querySelector('input[placeholder*="Pregúntale a MIA"]') ||
                        document.querySelector('input[type="text"]') ||
                        document.querySelector('textarea');
          if (input) {
            input.value = ${JSON.stringify(questionText)};
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const form = input?.closest('form');
          const submitBtn = form?.querySelector('button[type="submit"]') ||
                            Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enviar') || b.querySelector('svg'));
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          } else if (submitBtn) {
            submitBtn.click();
          }
        })()
      `);

      // Wait for response and TTS
      let replyFound = null;
      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 500));
        replyFound = await cdp.eval(`
          (() => {
            const chatContainers = document.querySelectorAll('.rounded-2xl, .chat-bubble, [data-sender="mia"]');
            const messages = Array.from(chatContainers).map(el => el.textContent.trim()).filter(Boolean);
            const lastMiaMessage = messages.filter(m => !m.includes(${JSON.stringify(questionText)})).pop();
            return {
              count: messages.length,
              lastMessage: lastMiaMessage || '',
              allMessages: messages.slice(-4)
            };
          })()
        `);
        if (replyFound?.lastMessage && replyFound.lastMessage.length > 50) {
          break;
        }
      }
      return replyFound;
    }

    // Step 4: Test Case A - "¿Quién descubrió América?"
    console.log("\n--- TEST CASE A: HISTORY QUESTION ---");
    const replyA = await askMIA("¿Quién descubrió América?");
    console.log("Reply A snippet:", replyA?.lastMessage?.slice(0, 150) + "...");
    await new Promise((r) => setTimeout(r, 3000)); // allow audio playback
    await cdp.captureScreenshot(path.join(EVIDENCE_DIR, "browser_03_history_columbus.png"));

    // Step 5: Test Case B - "Explícame un medio y un cuarto"
    console.log("\n--- TEST CASE B: MATH FRACTIONS QUESTION ---");
    const replyB = await askMIA("Explícame un medio y un cuarto");
    console.log("Reply B snippet:", replyB?.lastMessage?.slice(0, 150) + "...");
    await new Promise((r) => setTimeout(r, 3000)); // allow audio playback
    await cdp.captureScreenshot(path.join(EVIDENCE_DIR, "browser_04_math_fractions.png"));

    // Step 6: Test Case C - "No entendí, explícamelo de otra manera"
    console.log("\n--- TEST CASE C: ADAPTIVE REFORMULATION ---");
    const replyC = await askMIA("No entendí, explícamelo de otra manera");
    console.log("Reply C snippet:", replyC?.lastMessage?.slice(0, 150) + "...");
    await new Promise((r) => setTimeout(r, 3000)); // allow audio playback
    await cdp.captureScreenshot(path.join(EVIDENCE_DIR, "browser_05_adaptive_reformulation.png"));

    // Step 7: Check Voice Telemetry in Browser
    console.log("\n--- BROWSER AUDIO & SPEECH TELEMETRY ---");
    const audioTelemetry = await cdp.eval(`
      (() => ({
        audit: window.__machtiaAudit,
        activeAudioElements: Array.from(document.querySelectorAll('audio')).map(a => ({
          src: a.src ? a.src.slice(0, 40) + '...' : '',
          paused: a.paused,
          duration: a.duration,
          currentTime: a.currentTime
        }))
      }))()
    `);
    console.log("Browser Audio Telemetry:", JSON.stringify(audioTelemetry, null, 2));
    console.log("Intercepted /api/tts network calls:", networkCalls.tts.length);

    // Step 8: Verify Alexa+ Simulator Modal
    console.log("\n--- OPENING ALEXA+ SIMULATOR MODAL ---");
    await cdp.eval(`
      (() => {
        const alexaBtn = Array.from(document.querySelectorAll('button')).find(b =>
          b.textContent.includes('Alexa') || b.textContent.includes('Simulador')
        );
        if (alexaBtn) alexaBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 1500));
    await cdp.captureScreenshot(path.join(EVIDENCE_DIR, "browser_06_alexa_simulator_modal.png"));

    // Close CDP and Chrome
    cdp.ws.close();
    proc.kill();

    const auditSummary = {
      timestamp: new Date().toISOString(),
      targetUrl: TARGET_URL,
      chromeVersion: versionData.Browser,
      historyReplyReceived: Boolean(replyA?.lastMessage?.includes("Colón") || replyA?.lastMessage?.includes("1492")),
      mathReplyReceived: Boolean(replyB?.lastMessage?.includes("1/2") || replyB?.lastMessage?.includes("cuarto")),
      reformulationReceived: Boolean(replyC?.lastMessage?.includes("monedas") || replyC?.lastMessage?.includes("dinero") || replyC?.lastMessage?.includes("ejemplo")),
      ttsNetworkCallsCount: networkCalls.tts.length,
      webSpeechInvoluntarilyUsed: audioTelemetry.audit.webSpeechUsed,
      audioElementsCreated: audioTelemetry.audit.audioElementsCreated,
      screenshots: [
        "browser_01_landing.png",
        "browser_02_companion_open.png",
        "browser_03_history_columbus.png",
        "browser_04_math_fractions.png",
        "browser_05_adaptive_reformulation.png",
        "browser_06_alexa_simulator_modal.png"
      ]
    };

    fs.writeFileSync(path.join(EVIDENCE_DIR, "browser-production-audit.json"), JSON.stringify(auditSummary, null, 2));
    console.log("\n=== AUDIT SUMMARY ===");
    console.log(JSON.stringify(auditSummary, null, 2));
    console.log("\n>>> BROWSER PRODUCTION AUDIT COMPLETED SUCCESSFULLY! <<<");

  } catch (err) {
    console.error("Browser audit failed:", err);
    proc.kill();
    process.exit(1);
  }
}

runBrowserAudit().catch(console.error);
