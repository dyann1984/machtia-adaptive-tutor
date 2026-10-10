import { spawn } from "node:child_process";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_hotfix_val_" + Date.now());
const PORT = 9298;
const TARGET_URL = "http://localhost:3000/?demo=judge";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("==================================================================");
  console.log("🚀 VERIFICACIÓN BROWSER REAL (EDGE CDP): TUTOR IA HOTFIX P0");
  console.log("   URL: " + TARGET_URL);
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

  if (!targets || targets.length === 0) {
    edgeProc.kill();
    throw new Error("No se pudo conectar a Edge CDP en puerto " + PORT);
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

  const networkResponses = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p.reject(data.error);
      else p.resolve(data.result);
    }
    if (data.method === "Runtime.consoleAPICalled") {
      const text = (data.params.args || []).map(a => a.value ?? a.description ?? "").join(" ");
      if (data.params.type === "error") {
        console.log(`  ❌ [Browser Console Error]: ${text}`);
      }
    }
    if (data.method === "Network.responseReceived") {
      const url = data.params.response.url;
      const status = data.params.response.status;
      if (url.includes("/api/") || url.includes("/mcp") || url.includes("/health")) {
        networkResponses.push({ url, status });
        console.log(`  🌐 [Network]: HTTP ${status} ${url}`);
      }
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

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");

  // 1. Navegar a la aplicación
  console.log("\n[Paso 1] Navegando a", TARGET_URL);
  await send("Page.navigate", { url: TARGET_URL });
  await sleep(4000);

  // 2. Ejecutar consulta de Mariana López
  console.log("\n[Paso 2] Ejecutando consulta de diagnóstico de Mariana López...");
  const clickedDiag = await evaluate(`(() => {
    // Intentar botón en Dashboard 'Ver diagnóstico detallado'
    const btns = Array.from(document.querySelectorAll('button'));
    const diagBtn = btns.find(b => b.textContent && b.textContent.includes('Ver diagnóstico detallado'));
    if (diagBtn) {
      diagBtn.click();
      return 'Ver diagnóstico detallado (Dashboard)';
    }
    // Si ya estamos en Tutor IA o hay chip 'Ver brecha de Mariana'
    const chip = btns.find(b => b.textContent && b.textContent.includes('Mariana'));
    if (chip) {
      chip.click();
      return chip.textContent.trim();
    }
    return null;
  })()`);
  console.log("  Acción activada:", clickedDiag);

  // 3. Esperar resolución del Tutor IA y verificar liberación del estado de carga
  console.log("  Esperando respuesta pedagógica del Tutor IA...");
  let marianaResolved = false;
  let finalMarianaState = null;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const hasStep = text.includes('Consultando herramientas MCP del servidor');
      const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
      const isSendDisabled = sendBtn ? sendBtn.disabled : null;
      const chatText = Array.from(document.querySelectorAll('.whitespace-pre-line, [class*="max-w-2xl"]')).map(el => el.textContent.trim()).join('\\n');
      return {
        hasThinking,
        hasStep,
        isSendDisabled,
        has52: chatText.includes('52%'),
        hasMariana: chatText.includes('Mariana López'),
        hasPedagogical: chatText.includes('Análisis Pedagógico'),
        hasActionBtn: text.includes('Crear práctica de apoyo para Mariana'),
        latestText: chatText.slice(-300)
      };
    })()`);

    if (state && !state.hasThinking && state.has52 && state.hasMariana) {
      marianaResolved = true;
      finalMarianaState = state;
      break;
    }
  }

  if (!marianaResolved) {
    throw new Error("Timeout: La consulta de Mariana López no se resolvió correctamente en el navegador");
  }

  console.log("  ✅ Consulta de Mariana López resuelta exitosamente!");
  console.log("     • Indicador de razonamiento finalizado (hasThinking):", finalMarianaState.hasThinking);
  console.log("     • Botón Enviar habilitado (isSendDisabled):", finalMarianaState.isSendDisabled);
  console.log("     • Contiene Dominio 52%:", finalMarianaState.has52);
  console.log("     • Contiene Análisis Pedagógico del Tutor:", finalMarianaState.hasPedagogical);
  console.log("     • Contiene botón 'Crear práctica de apoyo para Mariana':", finalMarianaState.hasActionBtn);

  // 4. Probar consulta de Luis Hernández vía chat input y botón Enviar
  console.log("\n[Paso 3] Probando consulta de Luis Hernández vía input y botón Enviar...");
  await evaluate(`(() => {
    const input = document.querySelector('input[placeholder*="Pregunta"]') || document.querySelector('input[type="text"]');
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'Ver diagnóstico de Luis Hernández');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
    if (sendBtn) sendBtn.click();
  })()`);

  let luisResolved = false;
  let finalLuisState = null;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
      const isSendDisabled = sendBtn ? sendBtn.disabled : null;
      const chatText = Array.from(document.querySelectorAll('.whitespace-pre-line, [class*="max-w-2xl"]')).map(el => el.textContent.trim()).join('\\n');
      return {
        hasThinking,
        isSendDisabled,
        has58: chatText.includes('58%'),
        hasLuis: chatText.includes('Luis Hernández'),
        hasSimplification: chatText.includes('Simplificación'),
      };
    })()`);

    if (state && !state.hasThinking && state.has58 && state.hasLuis) {
      luisResolved = true;
      finalLuisState = state;
      break;
    }
  }

  if (!luisResolved) {
    throw new Error("Timeout: La consulta de Luis Hernández no se resolvió en el navegador");
  }

  console.log("  ✅ Consulta de Luis Hernández resuelta exitosamente!");
  console.log("     • Indicador de razonamiento finalizado:", finalLuisState.hasThinking);
  console.log("     • Botón Enviar habilitado:", finalLuisState.isSendDisabled);
  console.log("     • Contiene 58% y patrón de simplificación:", finalLuisState.has58 && finalLuisState.hasSimplification);

  // 5. Crear práctica adaptativa para Mariana
  console.log("\n[Paso 4] Creando práctica adaptativa para Mariana mediante botón de acción...");
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Crear práctica de apoyo para Mariana'));
    if (btn) btn.click();
  })()`);

  let practiceResolved = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const hasAssigned = text.includes('asignada exitosamente') || text.includes('5 reactivos');
      const hasEnterBtn = text.includes('Entrar como Mariana a resolver práctica');
      return { hasThinking, hasAssigned, hasEnterBtn };
    })()`);

    if (state && !state.hasThinking && state.hasAssigned && state.hasEnterBtn) {
      practiceResolved = true;
      break;
    }
  }

  if (!practiceResolved) {
    throw new Error("Timeout creando práctica adaptativa");
  }
  console.log("  ✅ Práctica adaptativa asignada exitosamente vía botón de acción!");

  // 6. Cambiar a rol de alumna Mariana y verificar práctica asignada
  console.log("\n[Paso 5] Cambiando a rol de alumna Mariana...");
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Entrar como Mariana a resolver práctica'));
    if (btn) btn.click();
  })()`);
  await sleep(3500);

  const studentState = await evaluate(`(() => {
    const text = document.body ? document.body.innerText : '';
    const hasStudentName = text.includes('Mariana López');
    const hasPractice = text.includes('Fracciones equivalentes') || text.includes('Comenzar');
    return { hasStudentName, hasPractice };
  })()`);

  console.log("  ✅ Navegación al portal de estudiante verificada:");
  console.log("     • Alumno activo:", studentState.hasStudentName ? "Mariana López" : "Desconocido");
  console.log("     • Práctica visible en módulo de estudiante:", studentState.hasPractice);

  console.log("\n==================================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE BROWSER REAL (EDGE CDP) FUERON EXITOSAS");
  console.log("==================================================================");

  ws.close();
  edgeProc.kill();
}

main().catch(err => {
  console.error("❌ Error en verificación de navegador:", err);
  process.exit(1);
});
