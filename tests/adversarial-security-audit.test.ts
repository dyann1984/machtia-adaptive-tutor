import { describe, it, expect, beforeEach } from "vitest";
import {
  generateDidacticSignature,
  verifyDidacticSignature,
  verifyDidacticSignatureDetail,
  resetSignatureStateForTesting,
  CANONICAL_WELCOME_TEXT,
} from "@/lib/tts/signature";
import { sanitizePiiForTTS, validateContentSafety } from "@/lib/tts/normalization";
import { ttsSessionGuard, registerActorResolver } from "@/lib/tts/session-guard";
import { ElevenLabsTTSAdapter } from "@/lib/tts/elevenlabs-adapter";
import { POST } from "@/app/api/tts/route";
import { NextRequest } from "next/server";

// Setup mock session environment
const mockActors = new Map([
  ["token-student-mariana", { role: "student" as const, id: "student-mariana-1" }],
  ["token-student-santiago", { role: "student" as const, id: "student-santiago-2" }],
  ["token-teacher-carlos", { role: "teacher" as const, id: "teacher-carlos-vega" }],
]);

registerActorResolver((token) => mockActors.get(token));

describe("MACHTIA — Fase 1 & 2: Auditoría Adversarial de Seguridad y Control de Cuotas", () => {
  beforeEach(() => {
    resetSignatureStateForTesting();
    ttsSessionGuard.resetForTesting();
    ElevenLabsTTSAdapter.resetCircuitBreaker();
  });

  // ==========================================================================
  // 1. Ciclo Completo /api/mia -> Firma HMAC -> /api/tts
  // ==========================================================================
  describe("1. Ciclo Completo de Firma Didáctica HMAC", () => {
    const authenticText = "Un tercio más dos tercios es igual a un entero o tres tercios.";

    it("genera una firma versionada v1 ligada al actor y con marca de tiempo", () => {
      const sig = generateDidacticSignature(authenticText, "student-mariana-1");
      expect(sig.startsWith("v1.")).toBe(true);
      const parts = sig.split(".");
      expect(parts.length).toBe(4);
      expect(parts[2]).toBe("student-mariana-1");
    });

    it("valida exitosamente el texto con el actor auténtico", () => {
      const sig = generateDidacticSignature(authenticText, "student-mariana-1");
      const res = verifyDidacticSignatureDetail(authenticText, sig, "student-mariana-1");
      expect(res.valid).toBe(true);
      expect(res.reason).toBe("VALID");
      expect(verifyDidacticSignature(authenticText, sig, "student-mariana-1")).toBe(true);
    });
  });

  // ==========================================================================
  // 2. Caducidad de Firma y Ventana Temporal (TTL & Clock Skew)
  // ==========================================================================
  describe("2. Caducidad y Ventana Temporal (Anti-Replay por Tiempo)", () => {
    const text = "Dos cuartos es equivalente a un medio.";

    it("rechaza firmas con más de 15 minutos de antigüedad (EXPIRED)", () => {
      const twentyMinsAgo = Date.now() - 20 * 60 * 1000;
      const expiredSig = generateDidacticSignature(text, "student-mariana-1", twentyMinsAgo);
      const res = verifyDidacticSignatureDetail(text, expiredSig, "student-mariana-1");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("EXPIRED");
    });

    it("rechaza firmas forjadas con timestamp en el futuro lejano (FUTURE_TIMESTAMP)", () => {
      const fiveMinsFuture = Date.now() + 5 * 60 * 1000;
      const futureSig = generateDidacticSignature(text, "student-mariana-1", fiveMinsFuture);
      const res = verifyDidacticSignatureDetail(text, futureSig, "student-mariana-1");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("FUTURE_TIMESTAMP");
    });
  });

  // ==========================================================================
  // 3. Vinculación al Actor Autenticado y Uso Cruzado entre Alumnos
  // ==========================================================================
  describe("3. Vinculación al Actor y Prevención de Uso Cruzado", () => {
    const text = "Tres quintos es menor que cuatro quintos.";

    it("rechaza cuando Santiago intenta usar una firma generada para Mariana (ACTOR_MISMATCH)", () => {
      const marianaSig = generateDidacticSignature(text, "student-mariana-1");
      const res = verifyDidacticSignatureDetail(text, marianaSig, "student-santiago-2");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("ACTOR_MISMATCH");
    });

    it("en /api/tts devuelve HTTP 403 ante intento de suplantación de actor", async () => {
      const marianaSig = generateDidacticSignature(text, "student-mariana-1");
      // Request comes from Santiago's token, but signature belongs to Mariana
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer token-student-santiago",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          signature: marianaSig,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.reason).toBe("ACTOR_MISMATCH");
      expect(data.error).toContain("suplantación");
    });
  });

  // ==========================================================================
  // 4. Integridad Criptográfica del Texto e Inyección de Caracteres
  // ==========================================================================
  describe("4. Integridad Criptográfica y Detección de Modificaciones", () => {
    const text = "Seis octavos equivale a tres cuartos.";

    it("detecta alteración de un solo carácter en el texto didáctico (TAMPERED_TEXT)", () => {
      const sig = generateDidacticSignature(text, "student-mariana-1");
      const tampered = "Seis octavos equivale a CUATRO cuartos.";
      const res = verifyDidacticSignatureDetail(tampered, sig, "student-mariana-1");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("TAMPERED_TEXT");
    });

    it("rechaza inyecciones SQL o scripts sin firma legítima del servidor", () => {
      const sig = generateDidacticSignature(text, "student-mariana-1");
      const injection = "'; DROP TABLE students; --";
      const res = verifyDidacticSignatureDetail(injection, sig, "student-mariana-1");
      expect(res.valid).toBe(false);
    });
  });

  // ==========================================================================
  // 5. Prevención de Replay Masivo (Replay Bounding)
  // ==========================================================================
  describe("5. Control de Replay Masivo", () => {
    const text = "Un quinto de pizza.";

    it("permite repeticiones normales de estudio (hasta 5) y bloquea exceso", () => {
      const sig = generateDidacticSignature(text, "student-mariana-1");
      for (let i = 0; i < 5; i++) {
        const check = verifyDidacticSignatureDetail(text, sig, "student-mariana-1");
        expect(check.valid).toBe(true);
      }
      // 6th playback attempt of the exact same signature
      const overCheck = verifyDidacticSignatureDetail(text, sig, "student-mariana-1");
      expect(overCheck.valid).toBe(false);
      expect(overCheck.reason).toBe("REPLAY_EXCEEDED");
    });
  });

  // ==========================================================================
  // 6. Acceso Anónimo y Tokens Inválidos
  // ==========================================================================
  describe("6. Acceso Anónimo y Rechazo de Tokens Inválidos", () => {
    it("rechaza peticiones anónimas sin autorización con HTTP 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Texto anónimo" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("no autorizada");
    });

    it("rechaza tokens sintácticamente inválidos con HTTP 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid_short_$$",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Texto con token corrupto" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  // ==========================================================================
  // 7. Protección de Datos Personales (Cero PII & Structural Safety Gate)
  // ==========================================================================
  describe("7. Protección de Datos Personales (Cero PII)", () => {
    it("bloquea textos con números telefónicos sospechosos", () => {
      const res = validateContentSafety("Llama al 55-1234-5678 para más información");
      expect(res.safe).toBe(false);
      expect(res.reason).toBe("SUSPECTED_PHONE_NUMBER");
    });

    it("bloquea textos con CURP / identificaciones oficiales mexicanas", () => {
      const res = validateContentSafety("Folio CURP: MARL901010HMCRLN01");
      expect(res.safe).toBe(false);
      expect(res.reason).toBe("SUSPECTED_GOVERNMENT_ID");
    });

    it("anonimiza nombres de alumnos, profesores y correos institucionales", () => {
      const raw = "¡Hola Mariana! Consulta con el Prof. Carlos Vega al correo carlos.vega@machtia.edu.mx expediente student-mariana-1";
      const sanitized = sanitizePiiForTTS(raw);
      expect(sanitized).not.toContain("Mariana!");
      expect(sanitized).not.toContain("Carlos Vega");
      expect(sanitized).not.toContain("carlos.vega@machtia.edu.mx");
      expect(sanitized).not.toContain("student-mariana-1");
    });
  });

  // ==========================================================================
  // 8. Longitud Máxima de Payload
  // ==========================================================================
  describe("8. Límites de Tamaño de Payload", () => {
    it("rechaza payloads con más de 600 caracteres", () => {
      const text = "Fracciones ".repeat(70);
      const res = ttsSessionGuard.validateContent(text);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("600");
    });
  });

  // ==========================================================================
  // 9. Circuit Breaker ante HTTP 402 / HTTP 429 (Cero Reintentos)
  // ==========================================================================
  describe("9. Control de Consumo y Circuit Breaker", () => {
    it("abre el circuito ante HTTP 402 y evita llamadas de red subsiguientes", async () => {
      expect(ElevenLabsTTSAdapter.isCircuitBreakerTripped()).toBe(false);

      ElevenLabsTTSAdapter.tripCircuitBreaker("PLAN_LIMIT_HTTP_402");
      expect(ElevenLabsTTSAdapter.isCircuitBreakerTripped()).toBe(true);

      const adapter = new ElevenLabsTTSAdapter({ apiKey: "test", voiceId: "test" });
      const synth = await adapter.synthesize("Texto de prueba");
      expect(synth.success).toBe(false);
      expect(synth.fallback).toBe(true);
      expect(synth.reason).toBe("RATE_LIMITED");
      expect(synth.message).toContain("Circuito abierto");
    });

    it("rearma el circuito cuando se solicita manualmente o tras expiración", () => {
      ElevenLabsTTSAdapter.tripCircuitBreaker("TEST");
      expect(ElevenLabsTTSAdapter.isCircuitBreakerTripped()).toBe(true);
      ElevenLabsTTSAdapter.resetCircuitBreaker();
      expect(ElevenLabsTTSAdapter.isCircuitBreakerTripped()).toBe(false);
    });
  });

  // ==========================================================================
  // 10. Contención de Credenciales y Saludo Canónico
  // ==========================================================================
  describe("10. Contención de Credenciales y Saludo Canónico", () => {
    it("no expone la API key en el resumen de configuración pública", () => {
      const adapter = new ElevenLabsTTSAdapter();
      const summary = adapter.getConfigSummary();
      expect((summary as any).apiKey).toBeUndefined();
    });

    it("reconoce y aprueba el saludo canónico de bienvenida sin firma dinámica", () => {
      expect(verifyDidacticSignature(CANONICAL_WELCOME_TEXT, undefined)).toBe(true);
    });
  });
});
