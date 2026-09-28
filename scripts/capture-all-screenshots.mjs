import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_cdp_screens_" + Date.now());
const PORT = 9222;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
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

  // Wait for Edge to listen
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
        const btn = buttons.find(b => b.textContent.toLowerCase().includes('${lower}'));
        if (btn) {
          btn.scrollIntoView({ behavior: 'instant', block: 'center' });
          btn.click();
          return true;
        }
        return false;
      })()`);
      if (found) return true;
      await sleep(400);
    }
    const all = await evaluate(`(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().replace(/\\s+/g, ' ')))()`);
    console.log("Available buttons when looking for '" + textSubstring + "':", all);
    throw new Error("Timeout waiting for button: " + textSubstring);
  }

  async function selectOptionByIndex(index) {
    await evaluate(`(() => {
      const container = document.querySelector('div.space-y-2\\\\.5') || document.querySelector('.space-y-2\\\\.5');
      if (container) {
        const opts = container.querySelectorAll('button');
        if (opts[${index}]) {
          opts[${index}].scrollIntoView({ behavior: 'instant', block: 'center' });
          opts[${index}].click();
          return true;
        }
      }
      return false;
    })()`);
  }

  async function waitForText(textSubstring, timeout = 15000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const found = await evaluate(`document.body.innerText.toLowerCase().includes('${lower}')`);
      if (found) return true;
      await sleep(400);
    }
    const text = await evaluate(`document.body.innerText`);
    console.log("PAGE TEXT DUMP:\n", text);
    throw new Error("Timeout waiting for text: " + textSubstring);
  }

  async function saveScreenshot(fileName) {
    const res = await sendCommand("Page.captureScreenshot", { format: "png" });
    const filePath = path.join("docs", "screenshots", fileName);
    fs.writeFileSync(filePath, Buffer.from(res.data, "base64"));
    console.log(`📸 Saved screenshot: ${filePath} (${Math.round((res.data.length * 0.75) / 1024)} KB)`);
  }

  // Set desktop viewport
  await sendCommand("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await sendCommand("Page.enable");
  await sendCommand("Runtime.enable");

  // 1. SCREENSHOT 01: Landing Page
  console.log("\n--- Capturing 01: Landing Page ---");
  await sendCommand("Page.navigate", { url: "http://localhost:3000" });
  await sleep(2500);
  await saveScreenshot("01-landing-and-mcp-status.png");

  // 2. SCREENSHOT 02: Teacher Alert & Prescription
  console.log("\n--- Capturing 02: Teacher Alert & Prescription ---");
  await waitForButton("Profesor");
  await sleep(1000);

  // Trigger quick prompt 1: "¿Quién necesita apoyo en matemáticas?"
  console.log("Asking who needs support...");
  await waitForButton("¿Quién necesita apoyo");
  await waitForText("Mariana López");
  await sleep(1000);

  // Trigger quick prompt 3: "Crear práctica de apoyo (5 reactivos)"
  console.log("Triggering prompt 3: Crear práctica de apoyo...");
  await waitForButton("Crear práctica de apoyo (5 reactivos)");
  await sleep(2000);

  // Click the action button "Crear práctica de apoyo para Mariana"
  console.log("Confirming creation of practice for Mariana...");
  await waitForButton("Crear práctica de apoyo para Mariana");
  await waitForText("¡Práctica de apoyo asignada exitosamente!");
  await sleep(1500);

  await saveScreenshot("02-teacher-alert-and-prescription.png");

  // Click quick action "Entrar como Mariana a resolver práctica"
  console.log("Clicking 'Entrar como Mariana a resolver práctica'...");
  await waitForButton("Entrar como Mariana");
  await sleep(2000);

  // 3. SCREENSHOT 03: Student Pre-explanation
  console.log("\n--- Capturing 03: Student Pre-explanation ---");
  // Mariana is now in InteractivePracticeRunner viewing FractionBarVisualizer pre-explanation!
  await saveScreenshot("03-student-pre-explanation.png");

  // Advance explanation: Step 1 -> Step 2 -> Step 3 -> Start Questions
  console.log("Advancing pre-explanation steps...");
  await waitForButton("Siguiente explicación");
  await sleep(800);
  await waitForButton("Siguiente explicación");
  await sleep(800);
  await waitForButton("¡Entendido!");
  await sleep(1500);

  // 4. SCREENSHOT 04: Adaptive Hints
  console.log("\n--- Capturing 04: Student Adaptive Hints ---");
  // Reactivo 1: Option A (2/4, correct)
  console.log("Reactivo 1: Answering option A (2/4, correct)...");
  await selectOptionByIndex(0);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await sleep(800);
  await waitForButton("Siguiente ejercicio");
  await sleep(1200);

  // Reactivo 2: Falla intencional (Seleccionar opción C: 3 partes (3/6), incorrecta)
  console.log("Reactivo 2: Selecting incorrect option C (3/6) to trigger Level 1 hint...");
  await selectOptionByIndex(2);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await waitForText("Pista");
  await sleep(1000);

  // Level 1 hint is displayed now!
  await saveScreenshot("04-student-adaptive-hints.png");

  // 5. SCREENSHOT 05: Student Result Calculated
  console.log("\n--- Capturing 05: Student Result Calculated ---");
  // Click "Intentar de nuevo con la pista" on reactivo 2
  await waitForButton("Intentar de nuevo");
  await sleep(600);

  // Answer reactivo 2 correctly: Option B (2 partes (2/6))
  console.log("Reactivo 2: Answering option B (2 partes (2/6), correct)...");
  await selectOptionByIndex(1);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await sleep(800);
  await waitForButton("Siguiente ejercicio");
  await sleep(1200);

  // Reactivo 3: Option A (Sí, correct)
  console.log("Reactivo 3: Option A (correct)...");
  await selectOptionByIndex(0);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await sleep(800);
  await waitForButton("Siguiente ejercicio");
  await sleep(1200);

  // Reactivo 4: Option A (3/4 y 6/8, correct)
  console.log("Reactivo 4: Option A (correct)...");
  await selectOptionByIndex(0);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await sleep(800);
  await waitForButton("Siguiente ejercicio");
  await sleep(1200);

  // Reactivo 5: 3 incorrect attempts to exhaust retries and yield authentic 4/5 = 80% result
  console.log("Reactivo 5 (Attempt 1): Option B (3/3, incorrect)...");
  await selectOptionByIndex(1);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await sleep(800);
  await waitForButton("Intentar de nuevo con la pista");
  await sleep(1000);

  console.log("Reactivo 5 (Attempt 2): Option C (2/6, incorrect)...");
  await selectOptionByIndex(2);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await sleep(800);
  await waitForButton("Intentar de nuevo con nueva explicación");
  await sleep(1000);

  console.log("Reactivo 5 (Attempt 3): Option D (1/3, incorrect to conclude 4/5)...");
  await selectOptionByIndex(3);
  await sleep(500);
  await waitForButton("Comprobar respuesta");
  await sleep(800);
  await waitForButton("Finalizar y ver progreso");
  await waitForText("completada con éxito");
  await sleep(2500); // Wait for celebratory confetti & score calculation

  // Result screen is visible with authentic 80% calculated score!
  await saveScreenshot("05-student-result-calculated.png");

  // 6. SCREENSHOT 06: Teacher Before/After Evidence
  console.log("\n--- Capturing 06: Teacher Before/After Evidence ---");
  // Click "Guardar evidencia y regresar al Panel del Profesor"
  await waitForButton("Guardar evidencia");
  await waitForText("MEJORA");
  await sleep(1500);

  await saveScreenshot("06-teacher-before-after-evidence.png");

  console.log("\n🎉 ALL 6 SCREENSHOTS SUCCESSFULLY CAPTURED WITH AUTHENTIC PEDAGOGICAL FLOW!");

  ws.close();
  edgeProc.kill();
  try {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  } catch (e) {}
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
