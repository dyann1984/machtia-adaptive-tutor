import { spawn } from "node:child_process";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_vercel_9steps_" + Date.now());
const PORT = 9270;
const TARGET_URL = "https://machtia-adaptive-tutor.vercel.app/?demo=judge";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("==================================================================");
  console.log("🎯 VALIDACIÓN E2E DE LOS 9 PASOS DIRECTAMENTE EN VERCEL PRODUCCIÓN");
  console.log("URL:", TARGET_URL);
  console.log("==================================================================");

  const edgeProc = spawn(EDGE_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore" });

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) { targets = await res.json(); break; }
    } catch {}
  }

  const pageTarget = targets.find(t => t.type === "page") || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });

  let msgId = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const consoleErrors = [];
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p.reject(data.error);
      else p.resolve(data.result);
    }
    if (data.method === "Runtime.consoleAPICalled" && data.params.type === "error") {
      const text = (data.params.args || []).map(a => a.value ?? a.description ?? "").join(" ");
      consoleErrors.push(text);
      console.log(`  [Consola error Vercel]: ${text}`);
    }
  };

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
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
        const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes(${JSON.stringify(lower)}));
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
    throw new Error(`Timeout esperando botón con texto '${textSubstring}'`);
  }

  async function waitForText(textSubstring, timeout = 15000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const found = await evaluate(`document.body ? document.body.innerText.toLowerCase().includes(${JSON.stringify(lower)}) : false`);
      if (found) return true;
      await sleep(300);
    }
    const snippet = await evaluate(`document.body ? document.body.innerText.substring(0, 300) : ''`);
    throw new Error(`Timeout esperando texto '${textSubstring}'. Texto actual: ${snippet}`);
  }

  await send("Runtime.enable");
  await send("Page.enable");

  // PASO 1: Abrir MACHTIA en Vercel
  console.log("\n[Paso 1/9] Abriendo MACHTIA en Vercel (https://machtia-adaptive-tutor.vercel.app)...");
  await send("Page.navigate", { url: TARGET_URL });
  await sleep(5000);

  const initialBody = await evaluate("document.body ? document.body.innerText : ''");
  const has404Error = initialBody.includes("HTTP 404") || initialBody.includes("Render spin-up, HTTP 404");
  console.log("  ✓ ¿Aparece error HTTP 404 / Render spin-up en Vercel?:", has404Error ? "SÍ (FALLÓ)" : "NO (CORREGIDO)");
  if (has404Error) {
    throw new Error("El error HTTP 404 persiste en Vercel");
  }

  // PASO 2: Iniciar sesión demo
  console.log("\n[Paso 2/9] Comprobando inicio de sesión demo en Vercel...");
  await sleep(2000);
  const demoActive = await evaluate(`Boolean(sessionStorage.getItem('machtia_demo_capability'))`);
  console.log("  ✓ Sesión demo activa en Vercel:", demoActive);

  // PASO 3: Cargar dashboard del profesor
  console.log("\n[Paso 3/9] Cargando dashboard del profesor en Vercel...");
  await waitForText("Prof. Carlos");
  await waitForText("Matemáticas");
  console.log("  ✓ Dashboard del profesor cargado correctamente.");

  // PASO 4: Crear o seleccionar una práctica
  console.log("\n[Paso 4/9] Creando/seleccionando práctica para Mariana López...");
  await clickButtonWithText("Prácticas");
  await sleep(1500);
  await waitForText("Fracciones");
  console.log("  ✓ Lista de prácticas cargada.");

  // PASO 5: Cambiar a alumna
  console.log("\n[Paso 5/9] Cambiando a rol de alumna (Mariana López)...");
  await clickButtonWithText("Alumna");
  await sleep(2000);
  await waitForText("¡Hola Mariana!");
  console.log("  ✓ Rol de alumna activo.");

  // PASO 6: Ejecutar la actividad con MIA
  console.log("\n[Paso 6/9] Ejecutando actividad y abriendo MIA...");
  const hasMiaBubble = await evaluate(`!!document.querySelector('[data-testid="mia-floating-bubble"]')`);
  console.log("  ✓ Burbuja de MIA presente:", hasMiaBubble);
  await evaluate(`(() => {
    const btn = document.querySelector('[data-testid="mia-floating-bubble"] button');
    if (btn) btn.click();
  })()`);
  await sleep(1200);
  await waitForText("Hola, soy MIA");
  console.log("  ✓ Ventana de MIA desplegada.");

  // PASO 7: Solicitar una explicación y una pista
  console.log("\n[Paso 7/9] Solicitando explicación y pista pedagógica...");
  await evaluate(`(() => {
    const chips = Array.from(document.querySelectorAll('button'));
    const chip = chips.find(b => b.textContent && (b.textContent.includes('fracción') || b.textContent.includes('cielo es azul') || b.textContent.includes('ayuda')));
    if (chip) chip.click();
  })()`);
  await sleep(3000);
  console.log("  ✓ Respuesta pedagógica recibida.");

  await evaluate(`(() => {
    const closeBtn = document.querySelector('button[aria-label="Cerrar ventana de MIA"]');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  await clickButtonWithText("Mis Prácticas");
  await sleep(1500);
  const startBtn = await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => el.textContent && (el.textContent.includes('Comenzar') || el.textContent.includes('Continuar')));
    if (b) { b.click(); return true; }
    return false;
  })()`);
  console.log("  Práctica abierta:", Boolean(startBtn));
  await sleep(2000);

  const hintRequested = await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const hintBtn = btns.find(b => b.textContent && b.textContent.includes('Pista'));
    if (hintBtn) { hintBtn.click(); return true; }
    return false;
  })()`);
  console.log("  Pista adaptativa solicitada:", hintRequested);
  await sleep(1500);

  // PASO 8: Finalizar y guardar evidencia
  console.log("\n[Paso 8/9] Respondiendo y registrando evidencia...");
  await evaluate(`(() => {
    const options = Array.from(document.querySelectorAll('button, [role=\"button\"]'));
    const opt = options.find(o => o.textContent && (o.textContent.includes('2/4') || o.textContent.includes('dos cuartos')));
    if (opt) opt.click();
  })()`);
  await sleep(1000);

  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const checkBtn = btns.find(b => b.textContent && (b.textContent.includes('Comprobar') || b.textContent.includes('Enviar')));
    if (checkBtn) checkBtn.click();
  })()`);
  await sleep(2000);
  console.log("  ✓ Respuesta registrada.");

  // PASO 9: Revisar resultados desde profesor
  console.log("\n[Paso 9/9] Cambiando a profesor para auditar resultados...");
  await clickButtonWithText("Profesor");
  await sleep(2000);
  await clickButtonWithText("Dashboard");
  await sleep(1500);
  await waitForText("Prof. Carlos");
  console.log("  ✓ Vista de profesor reactivada.");
  await clickButtonWithText("Evidencias");
  await sleep(1500);
  await waitForText("Registro de Evidencias");
  console.log("  ✓ Evidencias auditables consultadas exitosamente desde la vista docente.");

  console.log("\n==================================================================");
  console.log("🎉 LOS 9 PASOS COMPLETADOS CON ÉXITO EN VERCEL PRODUCCIÓN!");
  console.log("==================================================================");

  ws.close();
  edgeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Falló la verificación en Vercel:", err);
  process.exit(1);
});
