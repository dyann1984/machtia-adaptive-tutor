import { normalizeOralMathText, sanitizePiiForTTS } from "../lib/tts/normalization.ts";
import { ttsSessionGuard } from "../lib/tts/session-guard.ts";
import { ElevenLabsTTSAdapter } from "../lib/tts/elevenlabs-adapter.ts";
import {
  generateDidacticSignature,
  verifyDidacticSignature,
  CANONICAL_WELCOME_TEXT,
  isCanonicalDidacticText,
} from "../lib/tts/signature.ts";

async function runVerification() {
  console.log("================================================================================");
  console.log("MACHTIA MIA VOICE PIPELINE AUDIT & VERIFICATION");
  console.log("================================================================================\n");

  let passes = 0;
  let total = 0;

  function assert(title, condition, extra = "") {
    total++;
    if (condition) {
      console.log(`[PASS] ${title}`);
      if (extra) console.log(`       ${extra}`);
      passes++;
    } else {
      console.error(`[FAIL] ${title}`);
      if (extra) console.error(`       ${extra}`);
      process.exitCode = 1;
    }
  }

  // 1. Phonetical Math Normalization
  console.log("1. Phonetical Math & Educational Terms Normalization:");
  const fractionInput = "Mira 1/2 y 2/4. También 3/4 y 7/8. La operación 6 x 7 = 42 y 10 - 4.";
  const normalizedFraction = normalizeOralMathText(fractionInput);
  assert(
    "Fractions converted to spoken words",
    normalizedFraction.includes("un medio") &&
    normalizedFraction.includes("dos cuartos") &&
    normalizedFraction.includes("tres cuartos") &&
    normalizedFraction.includes("siete octavos"),
    normalizedFraction
  );
  assert(
    "Operators converted to spoken words",
    normalizedFraction.includes("por") &&
    normalizedFraction.includes("es igual a") &&
    normalizedFraction.includes("menos"),
    normalizedFraction
  );

  const gradeInput = "Alumna del grupo 3° B en pág. 42 ej. 1 con promedio 8.1";
  const normalizedGrade = normalizeOralMathText(gradeInput);
  assert(
    "School abbreviations converted cleanly",
    normalizedGrade.includes("tercero B") &&
    normalizedGrade.includes("página 42") &&
    normalizedGrade.includes("ejemplo 1") &&
    normalizedGrade.includes("8 punto 1"),
    normalizedGrade
  );

  // 2. Student Data Minimization (Zero PII)
  console.log("\n2. Student Data Minimization (Zero PII):");
  const piiInput = "¡Hola Mariana! Mariana López obtuvo 8.1. Consulta con Prof. Carlos Vega al correo carlos.vega@machtia.edu.mx con folio student-mariana-1.";
  const sanitized = sanitizePiiForTTS(piiInput);
  assert(
    "Student name removed from greeting",
    !sanitized.includes("Mariana!") && sanitized.startsWith("¡Hola!"),
    sanitized
  );
  assert(
    "Full name replaced with anonymized role",
    !sanitized.includes("Mariana López") && sanitized.includes("la alumna"),
    sanitized
  );
  assert(
    "Email replaced with safe educational label",
    !sanitized.includes("carlos.vega@machtia.edu.mx"),
    sanitized
  );
  assert(
    "Internal database IDs scrubbed",
    !sanitized.includes("student-mariana-1"),
    sanitized
  );

  // 3. Session Guard & Quota
  console.log("\n3. Session Capability Guard & Quotas:");
  const testToken = "machtia-active-session-token-123456789";
  assert("Validates valid session token", ttsSessionGuard.isValidSessionToken(testToken));
  assert("Rejects empty token", !ttsSessionGuard.isValidSessionToken(""));
  assert("Rejects short/invalid token", !ttsSessionGuard.isValidSessionToken("abc"));

  const contentValidation = ttsSessionGuard.validateContent("¿Por qué el cielo es azul?");
  assert("Accepts didactic questions <= 600 chars", contentValidation.valid);

  const longContent = ttsSessionGuard.validateContent("x".repeat(601));
  assert("Rejects questions > 600 chars", !longContent.valid);

  // 4. ElevenLabs Adapter Fallback & Secret Safety
  console.log("\n4. ElevenLabs Adapter & Fallback Safety:");
  const adapter = new ElevenLabsTTSAdapter({ apiKey: "", voiceId: "" });
  assert("Unconfigured adapter reports fallback=true", !adapter.isConfigured());

  const summary = adapter.getConfigSummary();
  assert("Secret API key is never exposed in summary", !("apiKey" in summary));

  const synthResult = await adapter.synthesize("Texto de prueba");
  assert("Fallback flag is true when unconfigured", synthResult.fallback === true && synthResult.reason === "CONFIG_MISSING");

  // 5. In-Memory Cache
  console.log("\n5. Private In-Memory Audio Cache:");
  const cacheKey = ttsSessionGuard.computeHash("un medio es igual a dos cuartos", "test-voice");
  const dummyBuffer = Buffer.from("ID3-MOCK-AUDIO");
  ttsSessionGuard.setCachedAudio(cacheKey, dummyBuffer);
  const hit = ttsSessionGuard.getCachedAudio(cacheKey);
  assert("In-memory cache stores and retrieves anonymous educational audio", hit !== null && hit.buffer.equals(dummyBuffer));

  // 6. Cryptographic Didactic Signature Guard (Anti-Spam / Anti-Drain)
  console.log("\n6. Cryptographic Didactic Signature Guard:");
  const pedagogicalReply = "¡Excelente observación! Dos cuartos es exactamente igual a un medio.";
  const signature = generateDidacticSignature(pedagogicalReply);
  assert("Generates 64-character hex HMAC signature for pedagogical text", signature.length === 64, `Signature: ${signature.slice(0, 16)}...`);
  assert("Authentic didactic text passes signature verification", verifyDidacticSignature(pedagogicalReply, signature));
  assert("Tampered or arbitrary text is rejected", !verifyDidacticSignature("Texto malicioso o spam no didáctico", signature));
  assert("Canonical welcome greeting is recognized and approved without signature", verifyDidacticSignature(CANONICAL_WELCOME_TEXT, undefined));
  assert("Arbitrary string is rejected as non-canonical without signature", !isCanonicalDidacticText("Texto arbitrario"));

  console.log(`\n================================================================================`);
  console.log(`VERIFICATION SUMMARY: ${passes}/${total} CHECKS PASSED`);
  console.log(`================================================================================`);
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
