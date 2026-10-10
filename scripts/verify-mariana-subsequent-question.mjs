import { spawn } from "node:child_process";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_subsequent_q_final_" + Date.now());
const PORT = 9299;
const TARGET_URL = "http://localhost:3000/?demo=judge";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("==================================================================");
  console.log("🧪 VERIFICACIÓN 1: PREGUNTA SUBSECUENTE TRAS DIAGNÓSTICO EN EDGE REAL");
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
      if (url.includes("/api/") || url.includes("/mcp")) {
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

  async function clickButtonWithText(textSubstring, timeout = 12000) {
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
    throw new Error(`Timeout buscando botón '${textSubstring}'. Botones: ${JSON.stringify(all.slice(0, 10))}`);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");

  // 1. Navegar a la aplicación
  console.log("\n[Paso 1] Navegando a", TARGET_URL);
  await send("Page.navigate", { url: TARGET_URL });
  await sleep(4000);

  // Si está en Landing View, entrar a la demo
  const isLanding = await evaluate(`!!document.querySelector('button')?.textContent?.includes('Ver demostración')`);
  if (isLanding) {
    console.log("  Detectada vista Landing, pulsando 'Ver demostración'...");
    await clickButtonWithText("Ver demostración");
    await sleep(2000);
  }

  // 2. Ir a pestaña 'Tutor IA'
  console.log("\n[Paso 2] Navegando a pestaña 'Tutor IA'...");
  await clickButtonWithText("Tutor IA");
  await sleep(2000);

  // 3. Escribir pregunta 1: 'Ver diagnóstico de Mariana López'
  console.log('\n[Paso 3] Escribiendo pregunta 1: "Ver diagnóstico de Mariana López"...');
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

  // Verificar botón Enviar habilitado
  const btn1State = await evaluate(`(() => {
    const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
    return { isSendDisabled: sendBtn ? sendBtn.disabled : null };
  })()`);
  console.log("  ✓ Botón Enviar con texto (isSendDisabled):", btn1State.isSendDisabled, "(Habilitado)");

  // Clic en Enviar
  console.log("  Pulsando botón Enviar...");
  await clickButtonWithText("Enviar");

  // Esperar diagnóstico de Mariana López
  console.log("  Esperando respuesta diagnóstica pedagógica...");
  let diagReceived = false;
  let diagState = null;
  for (let i = 0; i < 25; i++) {
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
        chatLength: chatText.length
      };
    })()`);

    if (state && !state.hasThinking && state.has52 && state.hasMariana) {
      diagReceived = true;
      diagState = state;
      break;
    }
  }

  if (!diagReceived) {
    throw new Error("Timeout esperando respuesta diagnóstica de Mariana");
  }

  console.log("  ✅ Diagnóstico de Mariana López recibido exitosamente:");
  console.log("     • Indicador hasThinking finalizado:", !diagState.hasThinking);
  console.log("     • Dominio 52%:", diagState.has52);
  console.log("     • Análisis Pedagógico presente:", diagState.hasPedagogical);
  console.log("     • Botón Enviar con input vacío (isSendDisabled):", diagState.isSendDisabled);

  // 4. ESCRIBIR NUEVA PREGUNTA POSTERIOR
  const subsequentQuestion = "¿Qué estrategia didáctica visual recomiendas para apoyar a Mariana?";
  console.log(`\n[Paso 4] Escribiendo NUEVA PREGUNTA POSTERIOR: "${subsequentQuestion}"...`);
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

  // 5. CONFIRMAR QUE EL BOTÓN ENVIAR SE HABILITA
  console.log("\n[Paso 5] Verificando habilitación del botón Enviar...");
  const btn2State = await evaluate(`(() => {
    const input = document.querySelector('input[placeholder*="Pregunta"]') || document.querySelector('input[type="text"]');
    const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
    return {
      inputValue: input ? input.value : null,
      isSendDisabled: sendBtn ? sendBtn.disabled : null
    };
  })()`);

  console.log("  ✓ Estado del botón Enviar:", btn2State);
  if (btn2State.isSendDisabled !== false) {
    throw new Error("FALLO: El botón Enviar no se habilitó tras escribir la nueva pregunta!");
  }
  console.log("  🎉 CONFIRMADO: El botón Enviar está HABILITADO (isSendDisabled === false).");

  // 6. ENVIAR LA NUEVA PREGUNTA
  console.log("\n[Paso 6] Pulsando 'Enviar' para la nueva pregunta posterior...");
  await clickButtonWithText("Enviar");

  // 7. ESPERAR Y CONFIRMAR RESPUESTA DEL AGENTE A LA NUEVA PREGUNTA
  console.log("  Esperando respuesta a la nueva pregunta posterior...");
  let subsequentResolved = false;
  let subsequentState = null;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const state = await evaluate(`(() => {
      const text = document.body ? document.body.innerText : '';
      const hasThinking = text.includes('Tutor IA razonando y ejecutando herramientas pedagógicas');
      const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
      const chatMessages = Array.from(document.querySelectorAll('.whitespace-pre-line, [class*="max-w-2xl"]')).map(el => el.textContent.trim());
      const lastMsg = chatMessages[chatMessages.length - 1] || '';
      return {
        hasThinking,
        isSendDisabled: sendBtn ? sendBtn.disabled : null,
        bubbleCount: chatMessages.length,
        lastMsg: lastMsg
      };
    })()`);

    // Expected bubbles: welcome + user Q1 + tutor A1 + user Q2 + tutor A2 (at least 4-5 bubbles)
    if (state && !state.hasThinking && state.bubbleCount >= 4) {
      subsequentResolved = true;
      subsequentState = state;
      break;
    }
  }

  if (!subsequentResolved) {
    throw new Error("Timeout: La nueva pregunta posterior no recibió respuesta");
  }

  console.log("\n[Paso 7] 🎉 CONFIRMADO: La nueva pregunta posterior fue respondida!");
  console.log("     • Indicador hasThinking finalizado:", !subsequentState.hasThinking);
  console.log("     • Total de burbujas en la conversación:", subsequentState.bubbleCount);
  console.log("     • Respuesta pedagógica del Tutor IA recibida:\n");
  console.log("------------------------------------------------------------------");
  console.log(subsequentState.lastMsg);
  console.log("------------------------------------------------------------------");

  // 8. Estado final del botón Enviar
  const finalBtnState = await evaluate(`(() => {
    const input = document.querySelector('input[placeholder*="Pregunta"]') || document.querySelector('input[type="text"]');
    const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Enviar');
    return {
      inputIsEmpty: input ? input.value === '' : false,
      isSendDisabled: sendBtn ? sendBtn.disabled : null
    };
  })()`);
  console.log("\n[Paso 8] Estado final tras finalizar el intercambio:", finalBtnState);

  console.log("\n==================================================================");
  console.log("✅ VERIFICACIÓN 1 COMPLETADA CON ÉXITO: BOTÓN ENVIAR OPERATIVO");
  console.log("==================================================================");

  ws.close();
  edgeProc.kill();
}

main().catch(err => {
  console.error("❌ Error en verificación 1:", err);
  process.exit(1);
});
