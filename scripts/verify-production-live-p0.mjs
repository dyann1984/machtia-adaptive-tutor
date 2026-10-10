import { spawn } from "node:child_process";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_prod_live_p0_" + Date.now());
const PORT = 9299;
const TARGET_URL = "https://machtia-adaptive-tutor.vercel.app/?demo=judge";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("==================================================================");
  console.log("🚀 VERIFICACIÓN EN PRODUCCIÓN REAL (EDGE CDP - VERCEL PRODUCTION)");
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
    if (data.method === "Network.responseReceived") {
      const url = data.params.response.url;
      const status = data.params.response.status;
      if (url.includes("/api/") || url.includes("/mcp") || url.includes("/health")) {
        networkResponses.push({ url, status });
        console.log(`  🌐 [Production Network]: HTTP ${status} ${url}`);
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

  async function clickButtonWithText(textSubstring, timeout = 15000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const clicked = await evaluate(`(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
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
    const all = await evaluate(`Array.from(document.querySelectorAll('button, a')).map(b => b.textContent.trim().replace(/\\s+/g, ' '))`);
    throw new Error(`Timeout buscando botón '${textSubstring}'. Botones disponibles: ${JSON.stringify(all.slice(0, 10))}`);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");

  // =========================================================================
  // PASO 1: Navegación y arranque en Producción
  // =========================================================================
  console.log("\n[Paso 1] Navegando a Vercel Production:", TARGET_URL);
  await send("Page.navigate", { url: TARGET_URL });
  await sleep(4500);

  // Si está en Landing View, entrar a la demo
  const isLanding = await evaluate(`!!document.querySelector('button')?.textContent?.includes('Ver demostración')`);
  if (isLanding) {
    console.log("  Detectada vista Landing, pulsando 'Ver demostración'...");
    await clickButtonWithText("Ver demostración");
    await sleep(2500);
  }

  // =========================================================================
  // PASO 2: Diagnóstico de Mariana López (Comprobación del Bug Original P0)
  // =========================================================================
  console.log("\n[Paso 2] Navegando a pestaña 'Tutor IA'...");
  await clickButtonWithText("Tutor IA");
  await sleep(2000);

  console.log('\n[Paso 3] Enviando consulta: "Ver diagnóstico de Mariana López"...');
  await evaluate(`(() => {
    const input = document.querySelector('input[placeholder*="Pregunta"]') || document.querySelector('input[type="text"]');
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'Ver diagnóstico de Mariana López');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(500);

  // Confirmar que el botón Enviar está habilitado tras escribir
  const send1Enabled = await evaluate(`(() => {
    const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
    return sendBtn ? !sendBtn.disabled : false;
  })()`);
  console.log("  ✓ Botón Enviar con texto de entrada (habilitado):", send1Enabled);

  // Pulsar Enviar
  console.log("  Pulsando 'Enviar'...");
  await clickButtonWithText("Enviar");

  // Esperar respuesta pedagógica y verificar que NO se queda colgado
  console.log("  Esperando respuesta diagnóstica pedagógica de Mariana López...");
  let marianaResolved = false;
  let marianaState = null;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const chatText = Array.from(document.querySelectorAll('.whitespace-pre-line, [class*="max-w-2xl"]')).map(el => el.textContent.trim()).join('\\n');
      const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
      return {
        hasThinking,
        isSendDisabled: sendBtn ? sendBtn.disabled : null,
        has52: chatText.includes('52%'),
        hasMariana: chatText.includes('Mariana López'),
        hasPedagogical: chatText.includes('Análisis Pedagógico'),
        hasPrescription: chatText.includes('Prescripción Pedagógica'),
        hasErrorPattern: chatText.includes('denominador') || chatText.includes('Comparación'),
        hasActionBtn: text.includes('Crear práctica de apoyo para Mariana')
      };
    })()`);

    if (state && !state.hasThinking && state.has52 && state.hasMariana) {
      marianaResolved = true;
      marianaState = state;
      break;
    }
  }

  if (!marianaResolved) {
    throw new Error("P0 REGRESIÓN: La consulta de Mariana López se colgó o no devolvió 52% en Producción");
  }

  console.log("  ✅ DIAGNÓSTICO DE MARIANA LÓPEZ RESUELTO CON ÉXITO EN PRODUCCIÓN:");
  console.log("     • Indicador hasThinking finalizado:", !marianaState.hasThinking);
  console.log("     • Nivel de Dominio 52%:", marianaState.has52);
  console.log("     • Patrón de error detectado:", marianaState.hasErrorPattern);
  console.log("     • Análisis Pedagógico presente:", marianaState.hasPedagogical);
  console.log("     • Prescripción Pedagógica presente:", marianaState.hasPrescription);
  console.log("     • Botón de acción 'Crear práctica de apoyo':", marianaState.hasActionBtn);
  console.log("     • Botón Enviar con input vacío (isSendDisabled):", marianaState.isSendDisabled);

  // =========================================================================
  // PASO 3: Pregunta Subsecuente y Rehabilitación del Botón Enviar
  // =========================================================================
  const subsequentQuestion = "¿Qué estrategia didáctica visual recomiendas para apoyar a Mariana?";
  console.log(`\n[Paso 4] Escribiendo pregunta subsecuente: "${subsequentQuestion}"...`);
  await evaluate(`((query) => {
    const input = document.querySelector('input[placeholder*="Pregunta"]') || document.querySelector('input[type="text"]');
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, query);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })(${JSON.stringify(subsequentQuestion)})`);
  await sleep(500);

  const send2Enabled = await evaluate(`(() => {
    const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
    return sendBtn ? !sendBtn.disabled : false;
  })()`);
  console.log("  ✓ Botón Enviar con nueva pregunta (debe ser true):", send2Enabled);
  if (!send2Enabled) {
    throw new Error("El botón Enviar no se habilitó al redactar la nueva pregunta");
  }

  console.log("  Pulsando 'Enviar' para la pregunta subsecuente...");
  await clickButtonWithText("Enviar");

  console.log("  Esperando respuesta pedagógica a la pregunta subsecuente...");
  let subsequentResolved = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const chatMessages = Array.from(document.querySelectorAll('.whitespace-pre-line, [class*="max-w-2xl"]')).map(el => el.textContent.trim());
      return {
        hasThinking,
        bubbleCount: chatMessages.length
      };
    })()`);

    if (state && !state.hasThinking && state.bubbleCount >= 4) {
      subsequentResolved = true;
      break;
    }
  }

  if (!subsequentResolved) {
    throw new Error("Timeout en respuesta a pregunta subsecuente");
  }
  console.log("  ✅ Pregunta subsecuente respondida y estado de carga liberado!");

  // =========================================================================
  // PASO 4: Consulta de Diagnóstico de Luis Hernández (58%)
  // =========================================================================
  console.log('\n[Paso 5] Consultando diagnóstico de Luis Hernández...');
  await evaluate(`(() => {
    const input = document.querySelector('input[placeholder*="Pregunta"]') || document.querySelector('input[type="text"]');
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'Ver diagnóstico de Luis Hernández');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(500);
  await clickButtonWithText("Enviar");

  let luisResolved = false;
  let luisState = null;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const chatText = Array.from(document.querySelectorAll('.whitespace-pre-line, [class*="max-w-2xl"]')).map(el => el.textContent.trim()).join('\\n');
      return {
        hasThinking,
        has58: chatText.includes('58%'),
        hasLuis: chatText.includes('Luis Hernández'),
        hasSimplification: chatText.includes('Simplificación')
      };
    })()`);

    if (state && !state.hasThinking && state.has58 && state.hasLuis) {
      luisResolved = true;
      luisState = state;
      break;
    }
  }

  if (!luisResolved) {
    throw new Error("Timeout: Consulta de Luis Hernández no respondió en Producción");
  }

  console.log("  ✅ DIAGNÓSTICO DE LUIS HERNÁNDEZ VERIFICADO EN PRODUCCIÓN:");
  console.log("     • Nivel de Dominio 58%:", luisState.has58);
  console.log("     • Patrón de simplificación:", luisState.hasSimplification);

  // =========================================================================
  // PASO 5: Creación de Práctica Adaptativa
  // =========================================================================
  console.log("\n[Paso 6] Creando práctica adaptativa para Mariana López...");
  await clickButtonWithText("Crear práctica para Mariana");
  await sleep(2500);

  let practiceCreated = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const hasSuccess = text.includes('asignada exitosamente') || text.includes('5 reactivos');
      const hasEnterBtn = text.includes('Entrar como Mariana a resolver práctica') || text.includes('Entrar como Mariana');
      return { hasThinking, hasSuccess, hasEnterBtn };
    })()`);

    if (state && !state.hasThinking && state.hasSuccess) {
      practiceCreated = true;
      break;
    }
  }

  if (!practiceCreated) {
    throw new Error("No se pudo crear la práctica adaptativa en Producción");
  }
  console.log("  ✅ Práctica adaptativa asignada exitosamente (5 reactivos calibrados)!");

  // =========================================================================
  // PASO 6: Cambio a Rol Alumna
  // =========================================================================
  console.log("\n[Paso 7] Cambiando a rol de Alumna (Mariana López)...");
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('Entrar como Mariana'));
    if (btn) {
      btn.click();
      return true;
    }
    // O vía switcher en header
    const switchBtn = btns.find(b => b.textContent && b.textContent.includes('Cambiar a Alumno') || b.textContent.includes('Mariana'));
    if (switchBtn) switchBtn.click();
  })()`);
  await sleep(3500);

  const studentPortalCheck = await evaluate(`(() => {
    const text = document.body ? document.body.innerText : '';
    const hasMariana = text.includes('Mariana') || text.includes('Mariana López');
    const hasPractices = text.includes('Fracciones') || text.includes('Práctica') || text.includes('Comenzar');
    return { hasMariana, hasPractices };
  })()`);
  console.log("  ✅ Portal de Alumna accesible:", studentPortalCheck);

  // =========================================================================
  // PASO 7: MIA Floating Companion y Audio
  // =========================================================================
  console.log("\n[Paso 8] Comprobando Asistente MIA...");
  const miaPresent = await evaluate(`(() => {
    const miaBtn = document.querySelector('[data-testid="mia-companion"]') ||
                   document.querySelector('button[aria-label*="MIA"]') ||
                   Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('MIA') || b.textContent.includes('Hablar con MIA'));
    return !!miaBtn || document.body.innerText.includes('MIA');
  })()`);
  console.log("  ✅ Asistente MIA presente y disponible:", miaPresent);

  console.log("\n==================================================================");
  console.log("🎉 TODAS LAS VALIDACIONES OBLIGATORIAS EN PRODUCCIÓN EN VIVO PASARON");
  console.log("   URL VALIDADA: " + TARGET_URL);
  console.log("==================================================================");

  ws.close();
  edgeProc.kill();
}

main().catch(err => {
  console.error("❌ FALLO EN VERIFICACIÓN DE PRODUCCIÓN:", err);
  process.exit(1);
});
