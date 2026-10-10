import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_cdp_interactive_" + Date.now());
const PORT = 9223;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const outputDir = path.join("docs", "screenshots", "interactive");
  fs.mkdirSync(outputDir, { recursive: true });

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

  async function selectOptionByIndex(index) {
    return await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="exercise-option-${index}"]');
      if (btn) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        btn.click();
        return true;
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
    throw new Error("Timeout waiting for text: " + textSubstring);
  }

  async function saveScreenshot(fileName) {
    const res = await sendCommand("Page.captureScreenshot", { format: "png" });
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(res.data, "base64"));
    console.log(`📸 Saved screenshot: ${filePath} (${Math.round((res.data.length * 0.75) / 1024)} KB)`);
  }

  async function setDesktopViewport() {
    await sendCommand("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async function setMobileViewport() {
    await sendCommand("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
  }

  await setDesktopViewport();
  await sendCommand("Page.enable");
  await sendCommand("Runtime.enable");

  console.log("\n--- Starting Interactive Child Tutoring Flow ---");
  await sendCommand("Page.navigate", { url: "http://localhost:3000" });
  await sleep(2500);

  // Click 'Ver demostración'
  console.log("Clicking 'Ver demostración'...");
  await waitForButton("Ver demostración");
  await sleep(1500);

  // Navigate to Tutor IA tab in teacher view
  console.log("Navigating to Tutor IA tab in teacher view...");
  await waitForButton("Tutor IA");
  await sleep(1200);

  console.log("Clicking '¿Quién necesita apoyo en matemáticas?'...");
  await waitForButton("¿Quién necesita apoyo en matemáticas?");
  await waitForText("Mariana López");
  await sleep(1500);

  console.log("Clicking 'Crear práctica de apoyo'...");
  await waitForButton("Crear práctica de apoyo");
  await waitForText("¡Práctica de apoyo asignada exitosamente!");
  await sleep(1500);

  // Switch to Alumna role
  console.log("\nSwitching to Student role...");
  await waitForButton("Alumna");
  await sleep(1500);
  await waitForButton("Inicio Alumna");
  await sleep(1500);

  // 1. CAPTURE 01: alumno bienvenida
  console.log("\n--- Capturing 01: alumno bienvenida ---");
  await saveScreenshot("01-alumno-bienvenida.png");

  // Enter Practice with "Comenzar"
  console.log("Starting practice from Student Home...");
  await waitForButton("Comenzar");
  await sleep(2000);

  // 2. CAPTURE 02: robot explicando (Paso 1: Observa)
  console.log("\n--- Capturing 02: robot explicando ---");
  await saveScreenshot("02-robot-explicando.png");

  // Step 2: Tocar la barra azul
  console.log("Advancing to Step 2 (Tocar barra azul)...");
  await evaluate(`document.querySelector('[data-testid="btn-step-2"]')?.click()`);
  await sleep(800);

  console.log("Clicking segment 0 of blue fraction bar...");
  await evaluate(`document.querySelector('[data-testid="bar-a-segment-0"]')?.click()`);
  await sleep(1000);

  // 3. CAPTURE 03: seleccion interactiva de 1/2
  console.log("\n--- Capturing 03: selección interactiva de 1/2 ---");
  await saveScreenshot("03-seleccion-interactiva-1-2.png");

  // Step 3: Tocar la barra naranja
  console.log("Advancing to Step 3 (Pintar barra naranja)...");
  await evaluate(`document.querySelector('[data-testid="btn-step-3"]')?.click()`);
  await sleep(800);

  console.log("Clicking 2 segments of orange fraction bar...");
  await evaluate(`document.querySelector('[data-testid="bar-b-segment-0"]')?.click()`);
  await sleep(400);
  await evaluate(`document.querySelector('[data-testid="bar-b-segment-1"]')?.click()`);
  await sleep(1000);

  // 4. CAPTURE 04: seleccion interactiva de 2/4
  console.log("\n--- Capturing 04: selección interactiva de 2/4 ---");
  await saveScreenshot("04-seleccion-interactiva-2-4.png");

  // Step 4: Comparar longitudes
  console.log("Advancing to Step 4 (Comparar longitudes)...");
  await evaluate(`document.querySelector('[data-testid="btn-step-4"]')?.click()`);
  await sleep(1500);

  // 5. CAPTURE 05: comparacion/revelacion equivalencia
  console.log("\n--- Capturing 05: comparación/revelación equivalencia ---");
  await saveScreenshot("05-comparacion-revelacion-equivalencia.png");

  // Mobile capture of discovery step
  console.log("\n--- Capturing mobile discovery step ---");
  await setMobileViewport();
  await sleep(800);
  await saveScreenshot("mobile-01-tutor-descubrimiento.png");
  await setDesktopViewport();
  await sleep(800);

  // Advance to Practice Questions
  console.log("Starting practice questions...");
  await evaluate(`document.querySelector('[data-testid="btn-start-exercises"]')?.click()`);
  await sleep(2000);

  // 6. CAPTURE: Ejercicio 1 (Visual Fraction Cards)
  console.log("\n--- Capturing Ejercicio 1 (Visual Cards) ---");
  await saveScreenshot("06-ejercicio-1-fracciones-visuales.png");

  // Reactivo 1: Answer correct option A (2/4)
  console.log("Exercise 1: Selecting Option A (2/4)...");
  await selectOptionByIndex(0);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await sleep(1500);
  await waitForButton("Siguiente ejercicio");
  await sleep(1500);

  // 7. CAPTURE: Ejercicio 2 (Manipulador Barra de Chocolate)
  console.log("\n--- Capturing Ejercicio 2 (Chocolate Bar) ---");
  await saveScreenshot("07-ejercicio-2-chocolate-interactivo.png");

  // Mobile capture of chocolate manipulative
  await setMobileViewport();
  await sleep(800);
  await saveScreenshot("mobile-02-ejercicio-chocolate.png");
  await setDesktopViewport();
  await sleep(800);

  // Reactivo 2: Intentional error to trigger hint (Select option C: 3 partes)
  console.log("Exercise 2: Selecting incorrect option C (3 partes) to trigger hint...");
  await selectOptionByIndex(2);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await waitForText("Casi lo tienes");
  await sleep(1500);

  // 8. CAPTURE: Pista tras error
  console.log("\n--- Capturing Ejercicio 2 (Pista tras error) ---");
  await saveScreenshot("08-ejercicio-2-pista-progresiva.png");

  // Retry Reactivo 2 correctly with Option B (2 partes (2/6))
  console.log("Retrying Exercise 2 with correct Option B (2 partes (2/6))...");
  await waitForButton("Intentar de nuevo con la pista");
  await sleep(800);
  await selectOptionByIndex(1);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await sleep(1500);
  await waitForButton("Siguiente ejercicio");
  await sleep(1500);

  // 9. CAPTURE: Ejercicio 3 (Tablero Relacional y Factor Común)
  console.log("\n--- Capturing Ejercicio 3 (Tablero Relacional) ---");
  await saveScreenshot("09-ejercicio-3-comparador-relacional.png");
  await selectOptionByIndex(0);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await sleep(1500);
  await waitForButton("Siguiente ejercicio");
  await sleep(1500);

  // 10. CAPTURE: Ejercicio 4 (Calculadora Productos Cruzados)
  console.log("\n--- Capturing Ejercicio 4 (Productos Cruzados) ---");
  await saveScreenshot("10-ejercicio-4-productos-cruzados.png");
  await selectOptionByIndex(0);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await sleep(1500);
  await waitForButton("Siguiente ejercicio");
  await sleep(1500);

  // 11. CAPTURE: Ejercicio 5 (Simplificación Guiada)
  console.log("\n--- Capturing Ejercicio 5 (Simplificación Guiada) ---");
  await saveScreenshot("11-ejercicio-5-simplificacion-guiada.png");

  // Exercise 5: Fail attempt 1 and attempt 2, conclude 4/5 (80%)
  console.log("Exercise 5 (Attempt 1): Option B (incorrect)...");
  await selectOptionByIndex(1);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await sleep(1200);
  await waitForButton("Intentar de nuevo con la pista");
  await sleep(1000);

  console.log("Exercise 5 (Attempt 2): Option C (incorrect)...");
  await selectOptionByIndex(2);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await sleep(1200);
  await waitForButton("Intentar de nuevo con nueva explicación");
  await sleep(1000);

  console.log("Exercise 5 (Attempt 3): Option D (conclude)...");
  await selectOptionByIndex(3);
  await sleep(800);
  await waitForButton("Comprobar respuesta");
  await sleep(1500);
  await waitForButton("Finalizar y ver progreso");
  await waitForText("completada");
  await sleep(2000);
  await evaluate("window.scrollTo(0, 0)");
  await sleep(1000);

  // 12. CAPTURE: Resultado Final con Celebración y Robot
  console.log("\n--- Capturing 12: Resultado Final Celebración ---");
  await saveScreenshot("12-resultado-final-celebracion.png");

  // Mobile capture of final celebration
  await setMobileViewport();
  await sleep(800);
  await saveScreenshot("mobile-03-resultado-celebracion.png");
  await setDesktopViewport();
  await sleep(800);

  // Return to Teacher View and verify evidence
  console.log("\nReturning to Teacher View to verify evidence...");
  await waitForButton("Guardar evidencia y regresar");
  await sleep(2000);
  await waitForText("Mariana López");
  await sleep(1000);

  console.log("\n--- Capturing 13: Evidencia y Progreso Docente ---");
  await saveScreenshot("13-docente-evidencia-progreso.png");

  console.log("\n🎉 ALL INTERACTIVE & MOBILE SCREENSHOTS SUCCESSFULLY CAPTURED IN docs/screenshots/interactive/!");
  try {
    ws.close();
    edgeProc.kill();
  } catch (e) {}
}

main().catch((err) => {
  console.error("Error capturing interactive screenshots:", err);
  process.exit(1);
});
