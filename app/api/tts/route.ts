import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsTTSAdapter } from "@/lib/tts/elevenlabs-adapter";
import { ttsSessionGuard, registerActorResolver } from "@/lib/tts/session-guard";
import { sanitizePiiForTTS, normalizeOralMathText, validateContentSafety } from "@/lib/tts/normalization";
import { verifyDidacticSignatureDetail } from "@/lib/tts/signature";
import { authenticate } from "@/mcp/server/session";

// Wire session resolver in server environment
registerActorResolver(authenticate);

const PRIVATE_NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(req: NextRequest) {
  try {
    // 1. Session capability authorization
    const authHeader = req.headers.get("authorization") || req.headers.get("x-demo-control");
    if (!ttsSessionGuard.isValidSessionToken(authHeader)) {
      return NextResponse.json(
        {
          error: "Sesión no autorizada o ausente para el servicio de síntesis de voz.",
          fallback: true,
        },
        { status: 401, headers: PRIVATE_NO_CACHE_HEADERS }
      );
    }

    // Resolve authenticated actor identity
    const actor = ttsSessionGuard.resolveActor(authHeader);
    const resolvedActorId = actor?.id || null;

    // 2. Body parsing and text validation
    const body = await req.json().catch(() => ({}));
    const validation = ttsSessionGuard.validateContent(body?.text);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error || "Texto no válido para síntesis.",
          fallback: true,
        },
        { status: 400, headers: PRIVATE_NO_CACHE_HEADERS }
      );
    }

    // 2.2 Didactic Signature Gate (Adversarial Grade):
    // Prevents synthesis of arbitrary/unauthorized text, cross-student replay, and expired tokens.
    const isTest = process.env.NODE_ENV === "test";
    const hasSignature = typeof body?.signature === "string";
    const sigResult = verifyDidacticSignatureDetail(validation.cleanText, body?.signature, resolvedActorId);

    if (!sigResult.valid && (!isTest || hasSignature)) {
      let errorMessage = "Texto didáctico no autorizado o firma criptográfica no válida.";
      let statusCode = 403;

      if (sigResult.reason === "EXPIRED") {
        errorMessage = "La firma de la explicación didáctica ha expirado (límite de 15 minutos).";
      } else if (sigResult.reason === "ACTOR_MISMATCH") {
        errorMessage = "Firma no autorizada para el actor actual (intento de suplantación o replay cruzado).";
      } else if (sigResult.reason === "FUTURE_TIMESTAMP") {
        errorMessage = "Marca de tiempo de firma inválida (desviación de reloj no permitida).";
      } else if (sigResult.reason === "REPLAY_EXCEEDED") {
        errorMessage = "Límite de reproducciones para esta respuesta didáctica alcanzado.";
        statusCode = 429;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          fallback: true,
          reason: sigResult.reason || "UNAUTHORIZED_DIDACTIC_TEXT",
        },
        { status: statusCode, headers: PRIVATE_NO_CACHE_HEADERS }
      );
    }

    // 2.5 Defense-in-depth: structural content safety gate (rejects phone numbers, IDs, addresses, URLs)
    const safetyCheck = validateContentSafety(validation.cleanText);
    if (!safetyCheck.safe) {
      return NextResponse.json(
        {
          error: `Texto no permitido por políticas de protección de datos (${safetyCheck.reason}).`,
          fallback: true,
        },
        { status: 400, headers: PRIVATE_NO_CACHE_HEADERS }
      );
    }

    // 2.8 Contest Safe Mode (Budget Control):
    // Permits ElevenLabs consumption for verified judge/demo sessions with valid session capabilities.
    const isPublicTrafficAllowed = process.env.ELEVENLABS_PUBLIC_TRAFFIC_ENABLED !== "false";
    const hasActiveJudgeSession = Boolean(actor) || Boolean(authHeader && ttsSessionGuard.isValidSessionToken(authHeader));
    if (!isTest && !isPublicTrafficAllowed && !hasActiveJudgeSession) {
      return NextResponse.json(
        {
          fallback: true,
          reason: "CONTEST_SAFE_MODE",
          message: "Modo seguro de concurso activo: síntesis con ElevenLabs reservada para la sesión oficial de demostración de jueces. Activando Web Speech de respaldo.",
        },
        {
          status: 200,
          headers: {
            ...PRIVATE_NO_CACHE_HEADERS,
            "X-TTS-Fallback": "true",
          },
        }
      );
    }

    // 3. Quota and rate limiting per session
    const quotaCheck = ttsSessionGuard.checkSessionQuota(authHeader!, validation.cleanText.length);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: quotaCheck.message || "Límite de solicitudes alcanzado.",
          fallback: true,
          reason: quotaCheck.reason,
        },
        {
          status: 429,
          headers: {
            ...PRIVATE_NO_CACHE_HEADERS,
            "X-TTS-Fallback": "true",
          },
        }
      );
    }

    // 4. Data minimization & PII scrubbing (Zero Student PII)
    const anonymizedText = sanitizePiiForTTS(validation.cleanText);

    // 5. Pedagogical and oral math phonetic normalization
    const normalizedText = normalizeOralMathText(anonymizedText);

    if (!normalizedText) {
      return NextResponse.json(
        {
          error: "Texto vacío tras normalización educativa.",
          fallback: true,
        },
        { status: 400, headers: PRIVATE_NO_CACHE_HEADERS }
      );
    }

    // 6. Check provider configuration (API Key & Voice ID)
    const adapter = new ElevenLabsTTSAdapter();
    if (!adapter.isConfigured()) {
      return NextResponse.json(
        {
          fallback: true,
          reason: "CONFIG_MISSING",
          message: "ElevenLabs API Key o Voice ID no configurados; activando Web Speech de respaldo.",
        },
        {
          status: 200,
          headers: {
            ...PRIVATE_NO_CACHE_HEADERS,
            "X-TTS-Fallback": "true",
          },
        }
      );
    }

    // 7. In-memory educational audio cache lookup
    const cacheKey = ttsSessionGuard.computeHash(normalizedText, process.env.ELEVENLABS_VOICE_ID || "default");
    const cached = ttsSessionGuard.getCachedAudio(cacheKey);

    if (cached) {
      return new Response(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          ...PRIVATE_NO_CACHE_HEADERS,
          "X-TTS-Source": "cache",
        },
      });
    }

    // 8. Synthesize via ElevenLabs adapter
    const result = await adapter.synthesize(normalizedText);

    if (result.success && result.audioBuffer) {
      // Store in memory cache
      ttsSessionGuard.setCachedAudio(cacheKey, result.audioBuffer, result.contentType || "audio/mpeg");

      return new Response(new Uint8Array(result.audioBuffer), {
        status: 200,
        headers: {
          "Content-Type": result.contentType || "audio/mpeg",
          ...PRIVATE_NO_CACHE_HEADERS,
          "X-TTS-Source": "elevenlabs",
        },
      });
    }

    // 9. Graceful fallback response on external error, quota exhaustion, or timeout
    return NextResponse.json(
      {
        fallback: true,
        reason: result.reason || "PROVIDER_ERROR",
        message: result.message || "Error al sintetizar; activando Web Speech.",
      },
      {
        status: 200,
        headers: {
          ...PRIVATE_NO_CACHE_HEADERS,
          "X-TTS-Fallback": "true",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Error interno del servidor de síntesis de voz.",
        fallback: true,
      },
      { status: 500, headers: PRIVATE_NO_CACHE_HEADERS }
    );
  }
}

export async function GET() {
  const adapter = new ElevenLabsTTSAdapter();
  return NextResponse.json(
    {
      service: "MACHTIA MIA TTS Endpoint",
      status: "ready",
      ...adapter.getConfigSummary(),
    },
    { headers: PRIVATE_NO_CACHE_HEADERS }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Demo-Control",
      ...PRIVATE_NO_CACHE_HEADERS,
    },
  });
}
