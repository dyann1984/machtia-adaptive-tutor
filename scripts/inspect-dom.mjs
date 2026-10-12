// scripts/inspect-dom.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";

async function inspectDOM() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDir = "C:\\Users\\DYANN\\AppData\\Local\\Temp\\chrome_dom_" + Date.now();
  fs.mkdirSync(userDir, { recursive: true });
  const proc = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDir}`,
    "about:blank",
  ], { detached: true, stdio: "ignore" });

  await new Promise((r) => setTimeout(r, 2000));
  const tabRes = await fetch("http://127.0.0.1:9222/json/new?https://machtia-adaptive-tutor.vercel.app/?demo=judge", { method: "PUT" });
  const tab = await tabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => ws.onopen = r);

  console.log("Waiting 5s for page to load...");
  await new Promise((r) => setTimeout(r, 5000));

  ws.send(JSON.stringify({
    id: 1,
    method: "Runtime.evaluate",
    params: {
      expression: `
        Array.from(document.querySelectorAll('button, a, input, h1, h2, h3, [role="button"]'))
          .map(el => ({
            tag: el.tagName,
            text: el.textContent.trim().slice(0, 50),
            aria: el.getAttribute('aria-label') || el.getAttribute('title') || '',
            className: el.className ? el.className.slice(0, 30) : ''
          }))
      `,
      returnByValue: true,
    },
  }));

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id === 1) {
      const val = data.result?.result?.value;
      console.log("Elements found:", val?.length);
      console.log(JSON.stringify(val, null, 2));
      proc.kill();
      process.exit(0);
    }
  };
}

inspectDOM().catch(console.error);
