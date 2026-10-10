import path from "node:path";
import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const USER_DATA_DIR = path.join(process.env.TEMP || "C:\\Temp", "edge_cdp_hydration_" + Date.now());
const PORT = 9233;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("==================================================");
  console.log("🔍 INICIANDO PRUEBA DE HYDRATION Y MODO JUEZ EN EDGE REAL");
  console.log("==================================================");

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
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    edgeProc.kill();
    throw new Error("No se pudo conectar con DevTools de Microsoft Edge en puerto " + PORT);
  }

  const pageTarget = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];
  const exceptions = [];

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
      consoleMessages.push({ type, text });
      if (type === "error" || text.toLowerCase().includes("hydration") || text.toLowerCase().includes("mismatch")) {
        console.log(`[Browser Console ${type.toUpperCase()}]:`, text);
      }
    }

    if (data.method === "Runtime.exceptionThrown") {
      const desc = data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text;
      exceptions.push(desc);
      console.log(`[Browser Uncaught Exception]:`, desc);
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

  await sendCommand("Runtime.enable");
  await sendCommand("Page.enable");

  // ----------------------------------------------------
  // TEST 1: http://localhost:3000/?demo=judge
  // ----------------------------------------------------
  console.log("\n--- TEST 1: Navegando a http://localhost:3000/?demo=judge ---");
  consoleMessages.length = 0;
  exceptions.length = 0;

  await sendCommand("Page.navigate", { url: "http://localhost:3000/?demo=judge" });
  await sleep(3500);

  const test1Diagnosis = await evaluate(`(() => {
    const nextErrorPortal = document.querySelector('nextjs-portal') || document.querySelector('[data-nextjs-dialog]') || document.querySelector('#nextjs__container_errors__body');
    const bodyText = document.body ? document.body.innerText : '';
    const hasHydrationErrorText = bodyText.includes('Hydration failed') || bodyText.includes('Unhandled Runtime Error');
    const headerNav = document.querySelector('header nav');
    const navButtons = headerNav ? Array.from(headerNav.querySelectorAll('button')).map(b => b.textContent.trim()) : [];
    const hasMariana = bodyText.includes('Mariana López');
    const hasGuide = bodyText.includes('Guía de Evaluación');
    const title = document.title;

    return {
      title,
      hasErrorPortal: !!nextErrorPortal,
      hasHydrationErrorText,
      hasHeaderNav: !!headerNav,
      navButtons,
      hasMariana,
      hasGuide,
      bodySnippet: bodyText.substring(0, 300).replace(/\\s+/g, ' ')
    };
  })()`);

  console.log("Resultado TEST 1 (?demo=judge):");
  console.log("  Título:", test1Diagnosis?.title);
  console.log("  Tiene portal de error de Next.js:", test1Diagnosis?.hasErrorPortal);
  console.log("  Tiene texto de error de hydration:", test1Diagnosis?.hasHydrationErrorText);
  console.log("  Tiene <nav> en header:", test1Diagnosis?.hasHeaderNav);
  console.log("  Botones de navegación:", test1Diagnosis?.navButtons);
  console.log("  Mariana López visible:", test1Diagnosis?.hasMariana);
  console.log("  Guía de jurado visible:", test1Diagnosis?.hasGuide);
  console.log("  Excepciones capturadas:", exceptions.length);
  console.log("  Errores de consola:", consoleMessages.filter(m => m.type === "error").length);

  // ----------------------------------------------------
  // TEST 2: http://localhost:3000/
  // ----------------------------------------------------
  console.log("\n--- TEST 2: Navegando a http://localhost:3000/ (sin query params) ---");
  consoleMessages.length = 0;
  exceptions.length = 0;

  await sendCommand("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(3500);

  const test2Diagnosis = await evaluate(`(() => {
    const nextErrorPortal = document.querySelector('nextjs-portal') || document.querySelector('[data-nextjs-dialog]') || document.querySelector('#nextjs__container_errors__body');
    const bodyText = document.body ? document.body.innerText : '';
    const hasHydrationErrorText = bodyText.includes('Hydration failed') || bodyText.includes('Unhandled Runtime Error');
    const isLandingVisible = bodyText.includes('Del diagnóstico a la intervención personalizada');
    const title = document.title;

    return {
      title,
      hasErrorPortal: !!nextErrorPortal,
      hasHydrationErrorText,
      isLandingVisible,
      bodySnippet: bodyText.substring(0, 300).replace(/\\s+/g, ' ')
    };
  })()`);

  console.log("Resultado TEST 2 (/):");
  console.log("  Título:", test2Diagnosis?.title);
  console.log("  Tiene portal de error de Next.js:", test2Diagnosis?.hasErrorPortal);
  console.log("  Tiene texto de error de hydration:", test2Diagnosis?.hasHydrationErrorText);
  console.log("  Landing view visible:", test2Diagnosis?.isLandingVisible);
  console.log("  Excepciones capturadas:", exceptions.length);
  console.log("  Errores de consola:", consoleMessages.filter(m => m.type === "error").length);

  ws.close();
  edgeProc.kill();

  const success =
    !test1Diagnosis?.hasErrorPortal &&
    !test1Diagnosis?.hasHydrationErrorText &&
    test1Diagnosis?.hasHeaderNav &&
    test1Diagnosis?.hasMariana &&
    !test2Diagnosis?.hasErrorPortal &&
    !test2Diagnosis?.hasHydrationErrorText &&
    test2Diagnosis?.isLandingVisible;

  console.log("\n==================================================");
  if (success) {
    console.log("🎉 VERIFICACIÓN EXITOSA: ZERO ERRORES DE HYDRATION EN AMBAS RUTAS.");
  } else {
    console.log("❌ FALLÓ LA VERIFICACIÓN: REVISAR DIAGNÓSTICO ARRIBA.");
  }
  console.log("==================================================");

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error("Error fatal en verificación:", err);
  process.exit(1);
});
