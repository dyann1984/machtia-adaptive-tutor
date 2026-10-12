// scripts/test-cdp.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";

async function testCDP() {
  console.log("Starting Chrome with remote debugging...");
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDir = "C:\\Users\\DYANN\\AppData\\Local\\Temp\\chrome_temp_" + Date.now();
  fs.mkdirSync(userDir, { recursive: true });

  const proc = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDir}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { detached: true, stdio: "ignore" });

  // Wait for port 9222 to be ready
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        console.log("Connected to Chrome! Version:", data.Browser);
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error("Could not connect to Chrome debugging port");
    proc.kill();
    process.exit(1);
  }

  // Get pages
  const pagesRes = await fetch("http://127.0.0.1:9222/json/list");
  const pages = await pagesRes.json();
  console.log("Open pages:", pages.length, pages[0]?.url);

  // Clean exit
  proc.kill();
  console.log("Chrome CDP successfully tested!");
}

testCDP().catch(console.error);
