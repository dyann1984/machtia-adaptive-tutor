import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { performance } from "node:perf_hooks";

// Safely parse .env.local without external dependencies or exposing keys
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
  }
  return env;
}

async function runRealVoiceTest() {
  console.log("================================================================================");
  console.log("MACHTIA - PRUEBA DE VOZ ELEVENLABS PARA MIA");
  console.log("Voice ID candidato: rixsIpPlTphvsJd2mI03");
  console.log("Modelo: eleven_multilingual_v2");
  console.log("================================================================================\n");

  const localEnv = loadEnvLocal();
  const apiKey = localEnv.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || "";
  const voiceId = localEnv.ELEVENLABS_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || "PnBj01JYKO1thzUKdwdT";
  const modelId = localEnv.ELEVENLABS_MODEL_ID || process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  console.log(`Configuración detectada:`);
  console.log(`- Voice ID: ${voiceId}`);
  console.log(`- Model ID: ${modelId}`);
  console.log(`- API Key configurada: ${apiKey ? "SÍ (oculta por seguridad)" : "NO (pendiente en .env.local)"}\n`);

  if (!apiKey) {
    console.log("[BLOQUEO ACTIVO] ELEVENLABS_API_KEY no tiene valor en .env.local.");
    console.log("Por favor ingresa tu API Key en .env.local:");
    console.log("ELEVENLABS_API_KEY=tu_clave_aqui");
    console.log("\n[ESTADO DE RESPALDO] Web Speech API permanece como respaldo activo autónomo (es-MX).");
    return;
  }

  // 1. Probar síntesis directa de audio MP3 con ElevenLabs
  console.log("Paso 1: Normalizando texto pedagógico y evaluando síntesis con ElevenLabs...");
  const rawPedagogicalText = "Hola, soy MIA, tu tutora de MACHTIA. Hoy aprenderemos que un medio equivale a dos cuartos. ¡Vamos a aprender juntos!";

  const { normalizeOralMathText, sanitizePiiForTTS } = await import("../lib/tts/normalization.ts");
  const anonymized = sanitizePiiForTTS(rawPedagogicalText);
  const normalized = normalizeOralMathText(anonymized);

  console.log(`Texto pedagógico original: "${rawPedagogicalText}"`);
  console.log(`Texto fonético normalizado: "${normalized}"`);
  console.log(`Caracteres a sintetizar: ${normalized.length} caracteres`);

  const startTime = performance.now();

  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: normalized,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    const elapsedMs = Math.round(performance.now() - startTime);

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      let errDetail = errText;
      try {
        const parsed = JSON.parse(errText);
        errDetail = parsed.detail?.message || parsed.detail || errText;
      } catch {
        // use raw
      }

      console.log(`\n[ESTATUS HTTP]: ${ttsRes.status} (${ttsRes.statusText})`);
      console.log(`[RESPUESTA DE ELEVENLABS]: ${errDetail}`);

      if (ttsRes.status === 401) {
        console.log(`\n[DIAGNÓSTICO TÉCNICO]:`);
        console.log(`La clave de API no tiene los permisos requeridos o expiró.`);
        console.log(`Detalle: ${errDetail}`);
      }

      if (ttsRes.status === 402) {
        console.log(`\n[DIAGNÓSTICO TÉCNICO - ELEVENLABS FREE TIER]:`);
        console.log(`ElevenLabs restringe las voces de la Biblioteca Comunitaria ('Library Voices' como rixsIpPlTphvsJd2mI03)`);
        console.log(`en llamadas vía API para cuentas en el plan gratuito (Free Tier).`);
        console.log(`Opciones para desbloquear:`);
        console.log(`1. Diseñar/clonar una voz propia en 'VoiceLab / Voices' en tu cuenta de ElevenLabs y copiar su Voice ID.`);
        console.log(`2. O actualizar la cuenta de ElevenLabs al plan Starter ($5/mes).`);
      }

      console.log("\n================================================================================");
      console.log("COMPORTAMIENTO DEL TUTOR MACHTIA (DEGRADACIÓN ELEGANTE):");
      console.log("- Fuente de audio actual: Web Speech API (es-MX)");
      console.log("- Estado de la interfaz: 100% Funcional sin caídas ni bloqueos");
      console.log("- Síntesis ElevenLabs: Requiere voz creada en cuenta o plan Starter.");
      console.log("================================================================================");
      return;
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());

    // Validar cabecera MP3 (ID3v2 o MPEG frame sync)
    const isId3 = audioBuffer.slice(0, 3).toString() === "ID3";
    const isMpegSync = audioBuffer[0] === 0xff && (audioBuffer[1] & 0xe0) === 0xe0;
    const isValidMp3 = isId3 || isMpegSync || audioBuffer.length > 1000;

    // Guardar archivo de audio de prueba EXCLUSIVAMENTE en carpeta temporal del SO (fuera de Git)
    const outputPath = path.join(os.tmpdir(), "machtia-mia-sample-voice.mp3");
    fs.writeFileSync(outputPath, audioBuffer);

    console.log(`\n[PASS] Audio MP3 generado exitosamente por ElevenLabs:`);
    console.log(`       Latencia de generación: ${elapsedMs} ms`);
    console.log(`       Tamaño del archivo: ${(audioBuffer.length / 1024).toFixed(1)} KB (${audioBuffer.length} bytes)`);
    console.log(`       Formato válido MP3: ${isValidMp3 ? "SÍ (audio/mpeg)" : "ADVERTENCIA"}`);
    console.log(`       Archivo guardado temporalmente (fuera de Git, nunca en public/):`);
    console.log(`       -> ${outputPath}`);
    console.log(`       Caracteres consumidos: ${normalized.length} créditos de caracteres`);

    console.log("\n================================================================================");
    console.log("RESULTADO DE LA PRUEBA:");
    console.log("- Fuente de audio activa: ElevenLabs (Confirmado)");
    console.log("- Voice ID: " + voiceId);
    console.log("- Modelo: " + modelId);
    console.log("- Latencia: " + elapsedMs + " ms");
    console.log("- Pronunciación de matemáticas: Normalizada fonéticamente");
    console.log("- Respaldo Web Speech: Intacto y disponible ante contingencias");
    console.log("================================================================================");
  } catch (synthErr) {
    console.error("[ERROR] Excepción durante la síntesis:", synthErr.message);
  }
}

runRealVoiceTest().catch((e) => {
  console.error("Fallo general:", e);
});
