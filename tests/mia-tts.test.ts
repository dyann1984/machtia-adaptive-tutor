import { describe, it, expect, beforeEach, vi } from "vitest";
import { normalizeOralMathText, sanitizePiiForTTS } from "@/lib/tts/normalization";
import {
  generateDidacticSignature,
  verifyDidacticSignature,
  CANONICAL_WELCOME_TEXT,
  isCanonicalDidacticText,
  resetSignatureStateForTesting,
} from "@/lib/tts/signature";
import { ElevenLabsTTSAdapter } from "@/lib/tts/elevenlabs-adapter";
import { ttsSessionGuard } from "@/lib/tts/session-guard";
import { POST, GET } from "@/app/api/tts/route";
import { NextRequest } from "next/server";

describe("MIA TTS System - Complete Test Suite", () => {
  beforeEach(() => {
    ttsSessionGuard.resetForTesting();
    ElevenLabsTTSAdapter.resetCircuitBreaker();
    resetSignatureStateForTesting();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. Phonetical & Pedagogical Normalization (Mexican Spanish Primary Math)
  // ============================================================================
  describe("Phonetic Math and Fraction Normalization", () => {
    it("normalizes primary school fractions into natural spoken Mexican Spanish", () => {
      expect(normalizeOralMathText("1/2")).toBe("un medio");
      expect(normalizeOralMathText("2/4")).toBe("dos cuartos");
      expect(normalizeOralMathText("3/4")).toBe("tres cuartos");
      expect(normalizeOralMathText("1/3")).toBe("un tercio");
      expect(normalizeOralMathText("2/3")).toBe("dos tercios");
      expect(normalizeOralMathText("1/5")).toBe("un quinto");
      expect(normalizeOralMathText("2/5")).toBe("dos quintos");
      expect(normalizeOralMathText("3/5")).toBe("tres quintos");
      expect(normalizeOralMathText("4/5")).toBe("cuatro quintos");
      expect(normalizeOralMathText("1/6")).toBe("un sexto");
      expect(normalizeOralMathText("5/6")).toBe("cinco sextos");
      expect(normalizeOralMathText("7/8")).toBe("siete octavos");
      expect(normalizeOralMathText("4/10")).toBe("cuatro décimos");
      expect(normalizeOralMathText("9/10")).toBe("nueve décimos");
    });

    it("normalizes mathematical operations and comparisons", () => {
      expect(normalizeOralMathText("6 x 7")).toBe("6 por 7");
      expect(normalizeOralMathText("12 ÷ 3")).toBe("12 entre 3");
      expect(normalizeOralMathText("10 - 4")).toBe("10 menos 4");
      expect(normalizeOralMathText("2/4 = 1/2")).toBe("dos cuartos es igual a un medio");
      expect(normalizeOralMathText("500 + 2")).toBe("quinientos más dos");
      expect(normalizeOralMathText("50%")).toBe("50 por ciento");
    });

    it("normalizes school grades, decimals, and educational abbreviations", () => {
      expect(normalizeOralMathText("3° B")).toBe("tercero B");
      expect(normalizeOralMathText("3° Primaria")).toBe("tercero de primaria");
      expect(normalizeOralMathText("pág. 42")).toBe("página 42");
      expect(normalizeOralMathText("ej. 2")).toBe("ejemplo 2");
      expect(normalizeOralMathText("núm. 5")).toBe("número 5");
      expect(normalizeOralMathText("3.5")).toBe("3 punto 5");
    });

    it("strips emojis and markdown cleanly to prevent audio distortion", () => {
      const raw = "¡Hola! 🍰 ¿Qué es una fracción? **Mira** este ejemplo: #1 `1/2`";
      const normalized = normalizeOralMathText(raw);
      expect(normalized).not.toContain("🍰");
      expect(normalized).not.toContain("**");
      expect(normalized).not.toContain("`");
      expect(normalized).not.toContain("#");
      expect(normalized).toContain("un medio");
    });
  });

  // ============================================================================
  // 2. Data Minimization & Zero Student PII
  // ============================================================================
  describe("PII Minimization for Voice Providers", () => {
    it("strips student names from greetings", () => {
      expect(sanitizePiiForTTS("¡Hola Mariana! ¿En qué te ayudo hoy?")).toBe("¡Hola! ¿En qué te ayudo hoy?");
      expect(sanitizePiiForTTS("Hola Santiago, vamos a practicar")).toBe("¡Hola! vamos a practicar");
    });

    it("replaces student and teacher names in sentence body", () => {
      expect(sanitizePiiForTTS("Mariana López resolvió la actividad")).toBe("la alumna resolvió la actividad");
      expect(sanitizePiiForTTS("Consulta con el Prof. Carlos Vega")).toBe("Consulta con el profesor");
    });

    it("anonymizes email addresses and internal database identifiers", () => {
      expect(sanitizePiiForTTS("Envía duda a carlos.vega@machtia.edu.mx")).toBe("Envía duda a tu profesor");
      expect(sanitizePiiForTTS("Registro student-mariana-123 y prof-carlos")).toBe("Registro y");
    });
  });

  // ============================================================================
  // 3. Session Capability Authorization & Quota Guard
  // ============================================================================
  describe("Session Guard & Quota Controls", () => {
    const validToken = "Bearer machtia-session-token-valid-abc123456789";

    it("validates legitimate session tokens and rejects invalid ones", () => {
      expect(ttsSessionGuard.isValidSessionToken(validToken)).toBe(true);
      expect(ttsSessionGuard.isValidSessionToken("")).toBe(false);
      expect(ttsSessionGuard.isValidSessionToken("short")).toBe(false);
      expect(ttsSessionGuard.isValidSessionToken(null)).toBe(false);
      expect(ttsSessionGuard.isValidSessionToken("invalid token with spaces $$$")).toBe(false);
    });

    it("validates content length: accepts <= 600 chars, rejects > 600", () => {
      expect(ttsSessionGuard.validateContent("Hola mundo").valid).toBe(true);
      expect(ttsSessionGuard.validateContent("").valid).toBe(false);
      expect(ttsSessionGuard.validateContent("   ").valid).toBe(false);

      const longText = "a".repeat(601);
      const res = ttsSessionGuard.validateContent(longText);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("600");
    });

    it("enforces sliding-window rate limit (max 12 req/min)", () => {
      const token = "machtia-test-rate-limit-token-123456789";
      for (let i = 0; i < 12; i++) {
        const check = ttsSessionGuard.checkSessionQuota(token, 20);
        expect(check.allowed).toBe(true);
      }
      // 13th request should be blocked
      const blockedCheck = ttsSessionGuard.checkSessionQuota(token, 20);
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.reason).toBe("RATE_LIMITED");
    });

    it("stores and retrieves cached audio by deterministic hash", () => {
      const text = "tres cuartos de pizza";
      const key = ttsSessionGuard.computeHash(text, "test-voice");
      const mockAudio = Buffer.from([1, 2, 3, 4]);

      expect(ttsSessionGuard.getCachedAudio(key)).toBeNull();
      ttsSessionGuard.setCachedAudio(key, mockAudio);

      const cached = ttsSessionGuard.getCachedAudio(key);
      expect(cached).not.toBeNull();
      expect(cached?.buffer).toEqual(mockAudio);
    });
  });

  // ============================================================================
  // 4. ElevenLabs TTS Adapter
  // ============================================================================
  describe("ElevenLabs TTS Adapter", () => {
    it("reports not configured when API key or Voice ID is missing", () => {
      const adapter = new ElevenLabsTTSAdapter({ apiKey: "", voiceId: "" });
      expect(adapter.isConfigured()).toBe(false);
      const summary = adapter.getConfigSummary();
      expect(summary.isConfigured).toBe(false);
      expect(summary.hasApiKey).toBe(false);
      // Ensures secret API key is never exposed
      expect((summary as any).apiKey).toBeUndefined();
    });

    it("returns graceful fallback result when unconfigured", async () => {
      const adapter = new ElevenLabsTTSAdapter({ apiKey: "", voiceId: "" });
      const result = await adapter.synthesize("Hola mundo");
      expect(result.success).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.reason).toBe("CONFIG_MISSING");
    });

    it("handles HTTP 401 unauthorized gracefully without leaking secrets", async () => {
      const adapter = new ElevenLabsTTSAdapter({
        apiKey: "invalid_key_secret_123",
        voiceId: "voice_mx_1",
      });

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ detail: "Invalid API Key" }),
      } as any);

      const result = await adapter.synthesize("Hola");
      expect(result.success).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.status).toBe(401);
      expect(result.reason).toBe("UNAUTHORIZED");
      expect(result.message).not.toContain("invalid_key_secret_123");
    });

    it("handles HTTP 429 quota exhaustion gracefully", async () => {
      const adapter = new ElevenLabsTTSAdapter({
        apiKey: "test_key",
        voiceId: "voice_mx_1",
      });

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ detail: "Quota exceeded" }),
      } as any);

      const result = await adapter.synthesize("Hola");
      expect(result.success).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.status).toBe(429);
      expect(result.reason).toBe("RATE_LIMITED");
    });

    it("handles network timeout safely", async () => {
      const adapter = new ElevenLabsTTSAdapter({
        apiKey: "test_key",
        voiceId: "voice_mx_1",
        timeoutMs: 50,
      });

      vi.spyOn(global, "fetch").mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            setTimeout(() => reject(err), 60);
          })
      );

      const result = await adapter.synthesize("Hola");
      expect(result.success).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.status).toBe(504);
      expect(result.reason).toBe("TIMEOUT");
    });
  });

  // ============================================================================
  // 5. Next.js Route Handler /api/tts
  // ============================================================================
  describe("Next.js Route Handler /api/tts", () => {
    const validAuth = "Bearer machtia-active-session-test-token-123456789";

    it("rejects unauthenticated requests with HTTP 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: "¿Qué es una fracción?" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Sesión no autorizada");
      expect(res.headers.get("Cache-Control")).toContain("private");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("rejects payloads exceeding 600 characters with HTTP 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        headers: {
          Authorization: validAuth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "a".repeat(650) }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("600");
    });

    it("returns clean fallback flag when ElevenLabs credentials are not configured", async () => {
      const originalKey = process.env.ELEVENLABS_API_KEY;
      const originalVoice = process.env.ELEVENLABS_VOICE_ID;
      delete process.env.ELEVENLABS_API_KEY;
      delete process.env.ELEVENLABS_VOICE_ID;

      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        headers: {
          Authorization: validAuth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Explícame qué es 1/2 en matemáticas" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("X-TTS-Fallback")).toBe("true");
      expect(res.headers.get("Cache-Control")).toContain("private, no-cache, no-store");

      const data = await res.json();
      expect(data.fallback).toBe(true);
      expect(data.reason).toBe("CONFIG_MISSING");

      // Restore
      if (originalKey) process.env.ELEVENLABS_API_KEY = originalKey;
      if (originalVoice) process.env.ELEVENLABS_VOICE_ID = originalVoice;
    });

    it("serves synthesized audio and utilizes private in-memory cache", async () => {
      process.env.ELEVENLABS_API_KEY = "test_key";
      process.env.ELEVENLABS_VOICE_ID = "test_voice";

      const mockMp3 = Buffer.from("ID3-MOCK-MP3-AUDIO-STREAM");

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "audio/mpeg" }),
        arrayBuffer: async () => mockMp3.buffer,
      } as any);

      const makeReq = () =>
        new NextRequest("http://localhost:3000/api/tts", {
          method: "POST",
          headers: {
            Authorization: validAuth,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: "¿Por qué el cielo es azul?" }),
        });

      // First call: hits provider
      const res1 = await POST(makeReq());
      expect(res1.status).toBe(200);
      expect(res1.headers.get("Content-Type")).toBe("audio/mpeg");
      expect(res1.headers.get("X-TTS-Source")).toBe("elevenlabs");
      expect(res1.headers.get("Cache-Control")).toContain("private");

      // Second call: served from memory cache (zero provider call)
      const res2 = await POST(makeReq());
      expect(res2.status).toBe(200);
      expect(res2.headers.get("Content-Type")).toBe("audio/mpeg");
      expect(res2.headers.get("X-TTS-Source")).toBe("cache");
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      delete process.env.ELEVENLABS_API_KEY;
      delete process.env.ELEVENLABS_VOICE_ID;
    });

    it("GET method returns service health without exposing credentials", async () => {
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.service).toBe("MACHTIA MIA TTS Endpoint");
      expect(data.apiKey).toBeUndefined();
    });
  });

  // ============================================================================
  // 6. Cryptographic Didactic Signature Guard (Anti-Spam & Arbitrary Text Gate)
  // ============================================================================
  describe("Cryptographic Didactic Signature & Anti-Arbitrary Text Guard", () => {
    it("generates deterministic HMAC signature for didactic text", () => {
      const text = "Un medio equivale a dos cuartos en una pizza de 4 rebanadas.";
      const fixedTs = 1700000000000;
      const sig1 = generateDidacticSignature(text, "student-mariana-1", fixedTs);
      const sig2 = generateDidacticSignature(text, "student-mariana-1", fixedTs);
      expect(sig1).toBe(sig2);
      expect(sig1.startsWith("v1.")).toBe(true);
    });

    it("verifies authentic signatures and rejects modified or forged text", () => {
      const originalText = "Tres cuartos es mayor que un medio.";
      const signature = generateDidacticSignature(originalText);

      expect(verifyDidacticSignature(originalText, signature)).toBe(true);
      expect(verifyDidacticSignature("Tres cuartos es MENOR que un medio.", signature)).toBe(false);
      expect(
        verifyDidacticSignature(originalText, "forged_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef")
      ).toBe(false);
      expect(verifyDidacticSignature(originalText, null)).toBe(false);
      expect(verifyDidacticSignature("", signature)).toBe(false);
    });

    it("automatically recognizes and approves canonical welcome greeting without explicit signature", () => {
      expect(isCanonicalDidacticText(CANONICAL_WELCOME_TEXT)).toBe(true);
      expect(verifyDidacticSignature(CANONICAL_WELCOME_TEXT, undefined)).toBe(true);
      expect(isCanonicalDidacticText("Texto arbitrario no canónico")).toBe(false);
    });

    it("rejects unauthorized text with invalid signature with HTTP 403 in /api/tts", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer machtia-active-session-test-token-123456789",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Texto arbitrario de un script no autorizado",
          signature: "invalidsignature1234567890abcdef1234567890abcdef1234567890abcdef",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Texto didáctico no autorizado");
      expect(["UNAUTHORIZED_DIDACTIC_TEXT", "INVALID_FORMAT", "TAMPERED_TEXT"]).toContain(data.reason);
      expect(res.headers.get("Cache-Control")).toContain("private");
    });

    it("accepts canonical welcome message in /api/tts without error", async () => {
      const req = new NextRequest("http://localhost:3000/api/tts", {
        method: "POST",
        headers: {
          Authorization: "Bearer machtia-active-session-test-token-123456789",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: CANONICAL_WELCOME_TEXT,
        }),
      });

      const res = await POST(req);
      // If no ElevenLabs credentials, returns 200 with fallback flag, NOT 403 Forbidden
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.reason).not.toBe("UNAUTHORIZED_DIDACTIC_TEXT");
    });
  });
});

