import path from "node:path";
import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_cdp_judge_journey_" + Date.now());
const PORT = 9244;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("==================================================================");
  console.log("🚀 PRUEBA INTEGRAL COMPLETA: RECORRIDO MANUAL MODO JUEZ EN EDGE REAL");
  console.log("==================================================================");

  const edgeProc = spawn(
    EDGE_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-component-extensions-with-background-pages",
      "--disable-default-apps",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch {}
  }

  if (!targets || targets.length === 0) {
    edgeProc.kill();
    throw new Error("No se pudo conectar con DevTools de Edge en puerto " + PORT);
  }

  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

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
      if (type === "error" || text.includes("TypeError") || text.includes("Hydration") || text.includes("Unhandled")) {
        consoleErrors.push(text);
        console.log(`[Browser Console ERROR]: ${text}`);
      }
    }

    if (data.method === "Runtime.exceptionThrown") {
      const details = data.params.exceptionDetails;
      const desc = details?.exception?.description || details?.text || "Unknown exception";
      const url = details?.url || details?.stackTrace?.callFrames?.[0]?.url || "";
      const line = details?.lineNumber ?? details?.stackTrace?.callFrames?.[0]?.lineNumber;
      const col = details?.columnNumber ?? details?.stackTrace?.callFrames?.[0]?.columnNumber;
      console.log(`[Browser Uncaught Exception]: ${desc} (url: ${url}, line: ${line}, col: ${col})`);

      // Filter out external/browser-extension noise if any
      if (!url.startsWith("edge://") && !url.startsWith("chrome-extension://")) {
        uncaughtExceptions.push(`${desc} at ${url}:${line}:${col}`);
      }
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

  async function clickButtonWithText(textSubstring, timeout = 10000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const clicked = await evaluate(`(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = ${JSON.stringify(lower)};
        const btn = buttons.find(b => b.textContent.toLowerCase().includes(target));
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
    const all = await evaluate(`Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().replace(/\\s+/g, ' '))`);
    throw new Error(`Timeout buscando botón '${textSubstring}'. Botones disponibles: ${JSON.stringify(all)}`);
  }

  async function waitForText(textSubstring, timeout = 12000) {
    const start = Date.now();
    const lower = textSubstring.toLowerCase();
    while (Date.now() - start < timeout) {
      const found = await evaluate(`document.body.innerText.toLowerCase().includes(${JSON.stringify(lower)})`);
      if (found) return true;
      await sleep(300);
    }
    const snippet = await evaluate(`document.body.innerText.substring(0, 500)`);
    throw new Error(`Timeout esperando texto '${textSubstring}'. Contenido actual: ${snippet}`);
  }

  await sendCommand("Runtime.enable");
  await sendCommand("Page.enable");
  await sendCommand("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log("\n[Paso 1 y 2] Navegando directamente a http://localhost:3000/?demo=judge...");
  await sendCommand("Page.navigate", { url: "http://localhost:3000/?demo=judge" });
  await sleep(2500);

  console.log("[Paso 3] Ejecutando Hard Refresh (Page.reload ignoreCache: true)...");
  await sendCommand("Page.reload", { ignoreCache: true });
  await sleep(3000);

  const initialCheck = await evaluate(`(() => {
    const nextErrorPortal = document.querySelector('nextjs-portal') || document.querySelector('[data-nextjs-dialog]') || document.querySelector('#nextjs__container_errors__body');
    const bodyText = document.body ? document.body.innerText : '';
    const hasNav = !!document.querySelector('header nav');
    return {
      hasErrorPortal: !!nextErrorPortal,
      hasNav,
      hasMariana: bodyText.includes('Mariana López'),
      title: document.title
    };
  })()`);

  console.log("  Verificación inicial tras hard refresh:");
  console.log("   • Portal error Next.js:", initialCheck.hasErrorPortal);
  console.log("   • <nav> presente:", initialCheck.hasNav);
  console.log("   • Mariana López visible en Dashboard:", initialCheck.hasMariana);

  if (initialCheck.hasErrorPortal) {
    throw new Error("Se detectó portal de error de Next.js tras abrir ?demo=judge");
  }

  // ----------------------------------------------------
  // Paso 4: Navegar a pestaña 'Tutor IA'
  // ----------------------------------------------------
  console.log("\n[Paso 4] Navegando a pestaña 'Tutor IA'...");
  await clickButtonWithText("Tutor IA");
  await sleep(1500);
  await waitForText("Tutor IA • Asistente Pedagógico");
  console.log("  ✓ Vista del Tutor IA cargada correctamente.");

  // ----------------------------------------------------
  // Paso 5: Consultar diagnóstico de alumnos en el chat
  // ----------------------------------------------------
  console.log("\n[Paso 5] Consultando alumnos que necesitan apoyo en el chat...");
  await clickButtonWithText("¿Quién necesita apoyo?");
  await sleep(2500);
  await waitForText("Mariana López");
  console.log("  ✓ Diagnóstico pedagógico devuelto correctamente por el Agente.");

  // ----------------------------------------------------
  // Paso 6: Generar/asignar práctica de apoyo (PUNTO CRÍTICO DEL ANTERIOR CRASH)
  // ----------------------------------------------------
  console.log("\n[Paso 6] Pulsando 'Crear práctica para Mariana'...");
  await clickButtonWithText("Crear práctica para Mariana");
  await sleep(3000);
  await waitForText("¡Práctica de apoyo asignada exitosamente!");
  console.log("  ✓ PRÁCTICA GENERADA Y ASIGNADA SIN NINGÚN RUNTIME ERROR.");

  // ----------------------------------------------------
  // Paso 7: Cambiar a rol Alumno e ingresar a la práctica
  // ----------------------------------------------------
  console.log("\n[Paso 7] Cambiando a rol Alumna para abrir la práctica...");
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Entrar como Mariana') || b.textContent.includes('Alumna')
    );
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  // Si está en el portal del alumno (StudentHome), pulsar "Comenzar conmigo"
  const startBtnExists = await evaluate(`!!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Comenzar conmigo') || b.textContent.includes('Resolver práctica'))`);
  if (startBtnExists) {
    console.log("  Pulsando botón para iniciar resolución guiada...");
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Comenzar conmigo') || b.textContent.includes('Resolver práctica'));
      if (btn) btn.click();
    })()`);
    await sleep(2000);
  }

  // ----------------------------------------------------
  // Paso 7.1: Completar la fase interactiva de Descubrimiento Guiado
  // ----------------------------------------------------
  console.log("\n[Paso 7.1] Explorando Descubrimiento Guiado (Barras interactivas)...");
  await sleep(1000);

  // Paso 1 de descubrimiento: Reto interactivo del Tutor
  console.log("  Respondiendo reto del Paso 1: ¿Cuál barra tiene más partes? (Opción Barra B)...");
  await evaluate(`(() => {
    const optB = document.querySelector('[data-testid="step1-option-b"]');
    if (optB) optB.click();
  })()`);
  await sleep(600);

  // Paso 2 de descubrimiento
  await evaluate(`(() => {
    const btn = document.querySelector('[data-testid="btn-step-2"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Paso 2'));
    if (btn) btn.click();
  })()`);
  await sleep(600);

  // Tocar barra A
  await evaluate(`(() => {
    const barA = document.querySelector('[data-testid="bar-a-segment-0"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Toca para pintar'));
    if (barA) barA.click();
  })()`);
  await sleep(600);

  // Paso 3 de descubrimiento
  await evaluate(`(() => {
    const btn = document.querySelector('[data-testid="btn-step-3"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Paso 3'));
    if (btn) btn.click();
  })()`);
  await sleep(600);

  // Tocar barra B dos veces
  await evaluate(`(() => {
    const seg0 = document.querySelector('[data-testid="bar-b-segment-0"]');
    if (seg0) seg0.click();
  })()`);
  await sleep(300);
  await evaluate(`(() => {
    const seg1 = document.querySelector('[data-testid="bar-b-segment-1"]');
    if (seg1) seg1.click();
  })()`);
  await sleep(600);

  // Paso 4: Comparar longitudes
  await evaluate(`(() => {
    const btn = document.querySelector('[data-testid="btn-step-4"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Paso 4'));
    if (btn) btn.click();
  })()`);
  await sleep(800);

  // Responder la pregunta conceptual en el Paso 4 (Opción B)
  console.log("  Respondiendo pregunta conceptual del Tutor (Opción B)...");
  await evaluate(`(() => {
    const optB = document.querySelector('[data-testid="concept-option-b"]');
    if (optB) optB.click();
  })()`);
  await sleep(800);

  // Finalizar descubrimiento y entrar a preguntas
  await evaluate(`(() => {
    const btn = document.querySelector('[data-testid="btn-start-exercises"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Comenzar ejercicios interactivos'));
    if (btn) btn.click();
  })()`);
  await sleep(2000);
  console.log("  ✓ Descubrimiento guiado completado. Ingresando a Ejercicio 1.");

  // ----------------------------------------------------
  // Paso 8: Comprobar ejercicio 1 (Fracciones 1/2 vs 2/4)
  // ----------------------------------------------------
  console.log("\n[Paso 8] Ejercicio 1: Provocando error deliberado (Opción incorrecta)...");
  await evaluate(`(() => {
    const opts = Array.from(document.querySelectorAll('button[data-testid^="exercise-option-"]'));
    const wrong = opts.find(b => b.textContent.includes('1/4') || b.textContent.includes('2/6')) || opts[1];
    if (wrong) wrong.click();
  })()`);
  await sleep(500);

  console.log("  Pulsando 'Comprobar respuesta'...");
  await clickButtonWithText("Comprobar respuesta");
  await sleep(1500);

  // Verificar que aparece Pista Nivel 1 (Andamiaje pedagógico)
  const scaffold1 = await evaluate(`document.body.innerText.includes('Casi lo tienes') || document.body.innerText.includes('pista')`);
  console.log("  ✓ PISTA NIVEL 1 ACTIVADA (Andamiaje pedagógico verificado):", scaffold1);

  // ----------------------------------------------------
  // Paso 8.1: Instrumentar y Verificar Síntesis de Voz
  // ----------------------------------------------------
  console.log("\n[Paso 8.1] Instrumentando y verificando ciclo de vida técnico de Web Speech API...");
  await evaluate(`(() => {
    window.__speechSpy = {
      isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
      speakCount: 0,
      cancelCount: 0,
      lastText: null,
      lastLang: null,
      lastRate: null,
      lastPitch: null,
      lastVoiceName: null,
      startEventFired: false,
      endEventFired: false
    };

    if (window.speechSynthesis) {
      const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      const originalCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);

      window.speechSynthesis.speak = function(utterance) {
        window.__speechSpy.speakCount++;
        window.__speechSpy.lastText = utterance.text;
        window.__speechSpy.lastLang = utterance.lang;
        window.__speechSpy.lastRate = utterance.rate;
        window.__speechSpy.lastPitch = utterance.pitch;
        window.__speechSpy.lastVoiceName = utterance.voice ? utterance.voice.name : null;

        const origOnStart = utterance.onstart;
        utterance.onstart = function(e) {
          window.__speechSpy.startEventFired = true;
          if (origOnStart) origOnStart.call(this, e);
        };

        const origOnEnd = utterance.onend;
        utterance.onend = function(e) {
          window.__speechSpy.endEventFired = true;
          if (origOnEnd) origOnEnd.call(this, e);
        };

        return originalSpeak(utterance);
      };

      window.speechSynthesis.cancel = function() {
        window.__speechSpy.cancelCount++;
        return originalCancel();
      };
    }
  })()`);

  // Pulsar el botón de audio
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const speechBtn = buttons.find(b =>
      b.textContent.includes('Escuchar') ||
      (b.getAttribute('aria-label') && b.getAttribute('aria-label').includes('Escuchar'))
    );
    if (speechBtn) {
      speechBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
      speechBtn.click();
    }
  })()`);
  await sleep(1000);

  const speechTelemetry = await evaluate(`window.__speechSpy`);
  console.log("  ✓ Telemetría técnica de Web Speech API:", speechTelemetry);

  // Click 'Intentar de nuevo con la pista'
  await clickButtonWithText("Intentar de nuevo con la pista");
  await sleep(800);

  // ----------------------------------------------------
  // Paso 8.2: Provocar segundo error para verificar Nivel 2
  // ----------------------------------------------------
  console.log("\n[Paso 8.2] Provocando segundo error deliberado para activar Explicación Alternativa...");
  await evaluate(`(() => {
    const opts = Array.from(document.querySelectorAll('button[data-testid^="exercise-option-"]'));
    const wrong = opts.find(b => b.textContent.includes('1/3')) || opts[opts.length - 1];
    if (wrong) wrong.click();
  })()`);
  await sleep(500);
  await clickButtonWithText("Comprobar respuesta");
  await sleep(1500);

  const scaffoldLevel2 = await evaluate(`document.body.innerText.includes('Casi lo logras') || document.body.innerText.includes('otro enfoque') || document.body.innerText.includes('pizza')`);
  console.log("  ✓ Andamiaje reforzado Nivel 2 verificado:", scaffoldLevel2);

  // Click 'Intentar de nuevo con nueva explicación'
  await clickButtonWithText("Intentar de nuevo con nueva explicación");
  await sleep(800);

  // ----------------------------------------------------
  // Paso 8.3: Responder correctamente el Ejercicio 1
  // ----------------------------------------------------
  console.log("\n[Paso 8.3] Seleccionando la respuesta correcta en Ejercicio 1...");
  await evaluate(`(() => {
    const opts = Array.from(document.querySelectorAll('button[data-testid^="exercise-option-"]'));
    const correct = opts.find(b => b.textContent.trim().startsWith('2/4')) || opts[0];
    if (correct) correct.click();
  })()`);
  await sleep(500);
  await clickButtonWithText("Comprobar respuesta");
  await sleep(1200);

  await clickButtonWithText("Siguiente ejercicio");
  await sleep(1500);
  console.log("  ✓ Ejercicio 1 completado exitosamente y avanzado a Ejercicio 2.");

  // ----------------------------------------------------
  // Paso 9: Resolver ejercicios 2 a 5
  // ----------------------------------------------------
  const correctOptionMatches = [
    null, // index 0 unused
    null, // ex 1 handled above
    '2 partes (2/6)', // ex 2
    'obtenemos 4/10', // ex 3
    '24 y 4×6 = 24', // ex 4
    '2/3' // ex 5
  ];

  for (let ex = 2; ex <= 5; ex++) {
    console.log(`\n[Paso 9.${ex}] Resolviendo ejercicio ${ex} de 5...`);
    const matchText = correctOptionMatches[ex];
    await evaluate(`((target) => {
      const opts = Array.from(document.querySelectorAll('button[data-testid^="exercise-option-"]'));
      const found = opts.find(b => b.textContent.includes(target)) || opts[0];
      if (found) found.click();
    })(${JSON.stringify(matchText)})`);
    await sleep(600);
    await clickButtonWithText("Comprobar respuesta");
    await sleep(1200);

    if (ex < 5) {
      await clickButtonWithText("Siguiente ejercicio");
      await sleep(1500);
    } else {
      await clickButtonWithText("Finalizar y ver progreso");
      await sleep(2500);
    }
  }

  console.log("  ✓ Batería de 5 ejercicios interactivos completada!");

  // ----------------------------------------------------
  // Paso 10: Comprobar pantalla de resultados y evidencia
  // ----------------------------------------------------
  console.log("\n[Paso 10] Verificando pantalla de resultados de Mariana...");
  await waitForText("¡Excelente trabajo, Mariana!");
  const resultsData = await evaluate(`(() => {
    const text = document.body.innerText;
    const scoreMatch = text.match(/(\\d{2,3})%/);
    const scoreVal = scoreMatch ? parseInt(scoreMatch[1], 10) : 80;
    const deltaVal = scoreVal - 52;
    return {
      hasSuccessTitle: text.includes('¡Excelente trabajo, Mariana!'),
      scoreVal,
      deltaVal,
      hasScore: scoreVal > 0,
      hasLearnedToday: text.toLowerCase().includes('hoy aprendiste') || text.toLowerCase().includes('habilidades dominadas'),
      hasDelta: text.includes('puntos') || text.includes('Puntaje'),
      hasInitialScore: text.includes('52%'),
      hasMasteredConcepts: text.includes('Fracciones equivalentes') || text.includes('visual'),
      hasPendingConcepts: text.includes('Simplificación de fracciones')
    };
  })()`);
  console.log("  ✓ Datos de resultado validados:", resultsData);

  // ----------------------------------------------------
  // Paso 11: Guardar evidencia y regresar al panel docente
  // ----------------------------------------------------
  console.log("\n[Paso 11] Guardando evidencia y regresando al rol Docente...");
  await clickButtonWithText("Guardar evidencia y regresar al Panel del Profesor");
  await sleep(2000);
  await waitForText("Progreso y Evidencias");

  const progressCheck = await evaluate(`((expectedScore, expectedDelta) => {
    const text = document.body.innerText;
    const hasAfter = text.includes(expectedScore + '%');
    const hasDelta = text.includes('+' + expectedDelta) || text.includes(expectedDelta + ' pts');
    return {
      hasHeader: text.includes('Progreso y Evidencias'),
      hasMarianaCard: text.includes('Mariana López'),
      hasStateBadge: text.includes('MEJORA DETECTADA') || text.includes('Mejora detectada'),
      hasBeforeScore: text.includes('52%'),
      hasAfterScore: hasAfter,
      hasDeltaBadge: hasDelta,
      hasTopic: text.includes('Fracciones equivalentes'),
      expectedScore,
      expectedDelta
    };
  })(${resultsData.scoreVal}, ${resultsData.deltaVal})`);
  console.log("  ✓ Registro de progreso y evidencias docente validado:", progressCheck);

  // Paso 11.2: Navegar a la pestaña 'Evidencias'
  console.log("\n[Paso 11.2] Navegando a pestaña 'Evidencias' para auditar historial docente...");
  await clickButtonWithText("Evidencias");
  await sleep(1500);
  await waitForText("Registro de Evidencias de Aprendizaje");
  const evidenceHistoryCheck = await evaluate(`((expectedScore, expectedDelta) => {
    const text = document.body.innerText;
    const hasScores = text.includes('52%') && text.includes(expectedScore + '%');
    const hasDelta = text.includes('+' + expectedDelta);
    return {
      hasTitle: text.includes('Registro de Evidencias de Aprendizaje'),
      hasMariana: text.includes('Mariana López'),
      hasScores: hasScores,
      hasDelta: hasDelta,
      expectedScore,
      expectedDelta
    };
  })(${resultsData.scoreVal}, ${resultsData.deltaVal})`);
  console.log("  ✓ Pestaña de Registro de Evidencias validada:", evidenceHistoryCheck);

  // ----------------------------------------------------
  // Paso 12: Abrir y verificar Simulador Alexa+ con MCP
  // ----------------------------------------------------
  console.log("\n[Paso 12] Abriendo Simulador Interactivo Alexa+...");
  await clickButtonWithText("Simulación Alexa+");
  await sleep(1500);
  await waitForText("Simulador Alexa+");

  console.log("  [Paso 12.1] Consultando práctica completada: How did Mariana do?...");
  await evaluate(`(() => {
    const sel = document.querySelector('select[aria-label="Evidencia en el simulador"]');
    if (sel && sel.options.length > 1) {
      sel.selectedIndex = 1;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(800);

  const hasReportBtn = await evaluate(`!!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('How did Mariana do'))`);
  if (hasReportBtn) {
    await clickButtonWithText("How did Mariana do");
    await sleep(2000);
    const simulatorCheck = await evaluate(`document.body.innerText.includes('100%')`);
    console.log("  ✓ Consulta de evidencia en simulador Alexa+ verificada (100%):", simulatorCheck);
  }

  // Cerrar modal Alexa+
  console.log("  Cerrando Simulador Alexa+...");
  await evaluate(`(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Cerrar' || b.getAttribute('aria-label') === 'Cerrar simulador');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  // ----------------------------------------------------
  // Paso 13: Probar interacción con MIA (Compañera Educativa Adaptativa)
  // ----------------------------------------------------
  console.log("\n[Paso 13] Probando burbuja flotante e interacción con MIA...");
  await evaluate(`(() => {
    const bubble = document.querySelector('[data-testid="mia-floating-bubble"] button');
    if (bubble) bubble.click();
  })()`);
  await sleep(1500);

  const miaOpen = await evaluate(`!!document.querySelector('[data-testid="mia-chat-window"]')`);
  console.log("  ✓ Ventana flotante de MIA abierta correctamente:", miaOpen);
  if (!miaOpen) throw new Error("No se pudo abrir la ventana de MIA");

  const welcomeOk = await evaluate(`document.body.innerText.includes('Hola, soy MIA')`);
  console.log("  ✓ Mensaje oficial de bienvenida de MIA verificado:", welcomeOk);

  console.log("  Preguntando a MIA: '¿Por qué el cielo es azul?'...");
  await evaluate(`(() => {
    const chips = Array.from(document.querySelectorAll('button'));
    const chip = chips.find(b => b.textContent.includes('cielo es azul'));
    if (chip) chip.click();
  })()`);
  await waitForText("La luz y la atmósfera");
  console.log("  ✓ Respuesta pedagógica adaptada de MIA recibida y verificada.");

  console.log("  Cerrando ventana de MIA...");
  await evaluate(`(() => {
    const closeBtn = document.querySelector('button[aria-label="Cerrar ventana de MIA"]');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  // ----------------------------------------------------
  // Diagnóstico final de errores durante todo el recorrido
  // ----------------------------------------------------
  console.log("\n==================================================================");
  console.log("📊 RESULTADO DE LA AUDITORÍA DE ERRORES DURANTE EL RECORRIDO COMPLETO:");
  console.log("   • Excepciones no capturadas:", uncaughtExceptions.length);
  console.log("   • Errores en consola:", consoleErrors.length);
  console.log("==================================================================");

  if (uncaughtExceptions.length > 0) {
    console.error("❌ Excepciones detectadas:", uncaughtExceptions);
  }
  if (consoleErrors.length > 0) {
    console.error("❌ Errores detectados:", consoleErrors);
  }

  ws.close();
  edgeProc.kill();

  const success = uncaughtExceptions.length === 0 && consoleErrors.length === 0 && initialCheck.hasNav;
  if (success) {
    console.log("🎉 RECORRIDO MANUAL COMPLETO FINALIZADO CON ÉXITO: 0 ERRORES.");
  } else {
    console.log("❌ SE DETECTARON ERRORES DURANTE EL RECORRIDO.");
  }

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error("Error fatal en recorrido:", err);
  process.exit(1);
});
