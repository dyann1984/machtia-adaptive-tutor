import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_cdp_robot_" + Date.now());
const PORT = 9245;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const edgeProc = spawn(
    EDGE_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      "--disable-gpu",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch {}
  }

  if (!targets) {
    edgeProc.kill();
    throw new Error("Cannot connect to Edge");
  }

  const page = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (e) => {
        const data = JSON.parse(e.data);
        if (data.id === id) {
          ws.removeEventListener("message", handler);
          if (data.error) reject(data.error);
          else resolve(data.result?.value);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const rawJpg = fs.readFileSync("public/machtia-tutor-official.jpg");
  const base64Jpg = rawJpg.toString("base64");

  const transparentPngBase64 = await send("Runtime.evaluate", {
    expression: `(async () => {
      const img = new Image();
      img.src = 'data:image/jpeg;base64,${base64Jpg}';
      await new Promise(r => { img.onload = r; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      // Soft color-key out the dark background while preserving antialiased edges
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        const maxVal = Math.max(r, g, b);
        if (maxVal < 15) {
          d[i+3] = 0; // completely transparent
        } else if (maxVal < 35) {
          // Soft transition edge
          d[i+3] = Math.round(((maxVal - 15) / 20) * 255);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/png').split(',')[1];
    })()`,
    returnByValue: true,
    awaitPromise: true,
  });

  if (transparentPngBase64) {
    fs.writeFileSync("public/machtia-tutor-robot.png", Buffer.from(transparentPngBase64, "base64"));
    console.log("Successfully created transparent public/machtia-tutor-robot.png (" + transparentPngBase64.length + " bytes base64)");
  }

  ws.close();
  edgeProc.kill();
}

main().catch((err) => {
  console.error("Error creating robot png:", err);
  process.exit(1);
});
