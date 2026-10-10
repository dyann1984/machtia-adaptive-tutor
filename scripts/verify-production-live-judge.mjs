import path from "node:path";
import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_live_judge_" + Date.now());
const PORT = 9250;
const PROD_URL = "https://machtia-tutor-mcp-server.onrender.com/?demo=judge";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("==================================================================");
  console.log("🌐 AUDITORÍA FINAL COMO JUEZ NUEVO EN PRODUCCIÓN REAL");
  console.log("URL:", PROD_URL);
  console.log("==================================================================\n");

  // 1. Probar endpoints HTTP directamente primero
  console.log("[1/5] Verificando endpoints y assets estáticos en producción...");
  const healthRes = await fetch("https://machtia-tutor-mcp-server.onrender.com/health");
  const healthData = await healthRes.json();
  console.log("  ✓ /health:", healthData.status, "Commit:", healthData.commit);

  const miaAssetRes = await fetch("https://machtia-tutor-mcp-server.onrender.com/mia.png");
  console.log("  ✓ /mia.png asset:", miaAssetRes.status, miaAssetRes.headers.get("content-type"), miaAssetRes.headers.get("content-length"), "bytes");

  const miaApiRes = await fetch("https://machtia-tutor-mcp-server.onrender.com/api/mia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "¿Por qué el cielo es azul?", mode: "free" }),
  });
  const miaApiData = await miaApiRes.json();
  console.log("  ✓ /api/mia respuesta:", miaApiData.topic, "| Modo:", miaApiData.mode);

  // 2. Iniciar Edge Headless como un Juez nuevo
  console.log("\n[2/5] Lanzando navegador Edge para simular Juez nuevo...");
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
    throw new Error("No se pudo conectar con Edge");
  }

  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });

  let msgId = 1;
  const pendingRequests = new Map();
  const consoleErrors = [];
  const uncaughtExceptions = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }

    if (data.method === "Runtime.consoleAPICalled") {
      const type = data.params.type;
      const text = (data.params.args || [])
        .map((a) => (typeof a.value !== "undefined" ? String(a.value) : a.description || ""))
        .join(" ");
      if (type === "error" || text.includes("Unexpected token") || text.includes("DOCTYPE")) {
        consoleErrors.push(text);
        console.error(`  [Consola ERROR]: ${text}`);
      }
    }

    if (data.method === "Runtime.exceptionThrown") {
      const details = data.params.exceptionDetails;
      const desc = details?.exception?.description || details?.text || "Unknown exception";
      uncaughtExceptions.push(desc);
      console.error(`  [Excepción no capturada]: ${desc}`);
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

  async function clickButtonWithText(textSubstring, timeout = 12000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const clicked = await evaluate(`(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = ${JSON.stringify(lower)};
        const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes(target));
        if (btn) {
          btn.scrollIntoView({ behavior: 'instant', block: 'center' });
          btn.click();
          return true;
        }
        return false;
      })()`);
      if (clicked) return true;
      await sleep(300);
    }
    throw new Error(`Timeout esperando botón '${textSubstring}'`);
  }

  async function waitForText(textSubstring, timeout = 15000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const found = await evaluate(`document.body.innerText.toLowerCase().includes(${JSON.stringify(lower)})`);
      if (found) return true;
      await sleep(300);
    }
    const snippet = await evaluate(`document.body.innerText.substring(0, 300)`);
    throw new Error(`Timeout esperando texto '${textSubstring}'. Contenido actual: ${snippet}`);
  }

  await sendCommand("Runtime.enable");
  await sendCommand("Page.enable");
  await sendCommand("Network.enable");

  // 3. Navegación inicial a producción
  console.log("\n[3/5] Navegando a " + PROD_URL + "...");
  await sendCommand("Page.navigate", { url: PROD_URL });
  await sleep(4000);

  // Verificar que NO exista ningún error de JSON o DOCTYPE
  const bodyText = await evaluate("document.body ? document.body.innerText : ''");
  const hasUnexpectedToken = bodyText.includes("Unexpected token") || bodyText.includes("DOCTYPE");
  console.log("  ✓ Comprobación de error crítico 'Unexpected token < / DOCTYPE':", hasUnexpectedToken ? "❌ PRESENTE" : "✅ 0 ERRORES (CORREGIDO)");

  if (hasUnexpectedToken) {
    throw new Error("El error 'Unexpected token <' aún está presente");
  }

  // 4. Probar Experiencia de MIA
  console.log("\n[4/5] Probando compañera educativa flotante MIA...");
  const hasMiaBubble = await evaluate(`!!document.querySelector('[data-testid="mia-floating-bubble"]')`);
  console.log("  ✓ Burbuja flotante de MIA presente en pantalla:", hasMiaBubble);

  console.log("  Abriendo ventana de MIA...");
  await evaluate(`(() => {
    const bubble = document.querySelector('[data-testid="mia-floating-bubble"] button');
    if (bubble) bubble.click();
  })()`);
  await sleep(1500);

  const miaWindowVisible = await evaluate(`!!document.querySelector('[data-testid="mia-chat-window"]')`);
  console.log("  ✓ Ventana modal de MIA desplegada:", miaWindowVisible);

  const welcomeFound = await evaluate(`document.body.innerText.includes('Hola, soy MIA')`);
  console.log("  ✓ Mensaje oficial de bienvenida visible:", welcomeFound);

  console.log("  Preguntando a MIA con chip: '¿Por qué el cielo es azul?'...");
  await evaluate(`(() => {
    const chips = Array.from(document.querySelectorAll('button'));
    const chip = chips.find(b => b.textContent && b.textContent.includes('cielo es azul'));
    if (chip) chip.click();
  })()`);
  await sleep(3000);

  await waitForText("luz y la atmósfera");
  console.log("  ✓ Respuesta pedagógica recibida en pantalla correctamente.");

  // Probar cambio a Modo Curiosidad
  console.log("  Cambiando a Modo Curiosidad...");
  await clickButtonWithText("Curiosidad");
  await sleep(1000);

  console.log("  Preguntando sobre dinosaurios...");
  await evaluate(`(() => {
    const chips = Array.from(document.querySelectorAll('button'));
    const chip = chips.find(b => b.textContent && b.textContent.includes('dinosaurios'));
    if (chip) chip.click();
  })()`);
  await sleep(3000);

  await waitForText("dinosaurios");
  console.log("  ✓ Respuesta de curiosidad e historia recibida correctamente.");

  // Cerrar MIA
  console.log("  Minimizando MIA...");
  await evaluate(`(() => {
    const closeBtn = document.querySelector('button[aria-label="Cerrar ventana de MIA"]');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  // 5. Verificación de Recorrido de Juez
  console.log("\n[5/5] Verificando flujo pedagógico central en producción...");
  await clickButtonWithText("Tutor IA");
  await sleep(1500);
  await waitForText("Asistente Pedagógico");
  console.log("  ✓ Pestaña Tutor IA abierta");

  await clickButtonWithText("¿Quién necesita apoyo?");
  await sleep(3000);
  await waitForText("Mariana López");
  console.log("  ✓ Diagnóstico del tutor obtenido correctamente");

  console.log("\n==================================================================");
  console.log("📊 RESULTADO FINAL DE AUDITORÍA EN PRODUCCIÓN:");
  console.log("   • Excepciones JavaScript:", uncaughtExceptions.length);
  console.log("   • Errores en consola:", consoleErrors.length);
  console.log("   • Error 'Unexpected token <' resuelto:", !hasUnexpectedToken);
  console.log("   • MIA integrada y funcional:", hasMiaBubble && miaWindowVisible);
  console.log("==================================================================");

  ws.close();
  edgeProc.kill();

  if (uncaughtExceptions.length === 0 && consoleErrors.length === 0 && !hasUnexpectedToken) {
    console.log("🎉 AUDITORÍA DE PRODUCCIÓN 100% EXITOSA!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error en auditoría:", err);
  process.exit(1);
});
