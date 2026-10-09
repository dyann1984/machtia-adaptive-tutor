/**
 * MACHTIA Adaptive Tutor - ElevenLabs Text-to-Speech Adapter
 *
 * Decoupled server-side adapter for ElevenLabs API.
 * Synthesizes text into high-quality MP3 audio using a configured Mexican Spanish female voice.
 * Never leaks the API key in error messages, logs, or responses.
 *
 * Circuit Breaker:
 * Prevents retries and consumption exhaustion upon receiving HTTP 402 (payment required)
 * or HTTP 429 (quota exhausted) by flipping an in-memory circuit breaker that immediately
 * routes subsequent synthesis requests to Web Speech fallback.
 */

export interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
  modelId?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface SynthesisResult {
  success: boolean;
  audioBuffer?: Buffer;
  contentType?: string;
  fallback: boolean;
  status?: number;
  reason?: "CONFIG_MISSING" | "UNAUTHORIZED" | "RATE_LIMITED" | "TIMEOUT" | "PROVIDER_ERROR";
  message?: string;
}

export class ElevenLabsTTSAdapter {
  private apiKey: string;
  private voiceId: string;
  private modelId: string;
  private baseUrl: string;
  private timeoutMs: number;

  private static circuitBreakerTripped = false;
  private static circuitBreakerReason: string | null = null;
  private static circuitBreakerTripTime = 0;
  private static readonly CIRCUIT_BREAKER_RESET_MS = 5 * 60 * 1000; // 5 min cooldown

  constructor(config?: ElevenLabsConfig) {
    this.apiKey = config?.apiKey || process.env.ELEVENLABS_API_KEY || "";
    this.voiceId = config?.voiceId || process.env.ELEVENLABS_VOICE_ID || "";
    this.modelId = config?.modelId || process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
    this.baseUrl = config?.baseUrl || "https://api.elevenlabs.io/v1";
    this.timeoutMs = config?.timeoutMs || 5500;
  }

  /**
   * Evaluates if circuit breaker is currently active.
   */
  public static isCircuitBreakerTripped(): boolean {
    if (!ElevenLabsTTSAdapter.circuitBreakerTripped) return false;
    if (Date.now() - ElevenLabsTTSAdapter.circuitBreakerTripTime > ElevenLabsTTSAdapter.CIRCUIT_BREAKER_RESET_MS) {
      ElevenLabsTTSAdapter.circuitBreakerTripped = false;
      ElevenLabsTTSAdapter.circuitBreakerReason = null;
      return false;
    }
    return true;
  }

  /**
   * Trips the circuit breaker to prevent repeated failed network calls.
   */
  public static tripCircuitBreaker(reason: string) {
    ElevenLabsTTSAdapter.circuitBreakerTripped = true;
    ElevenLabsTTSAdapter.circuitBreakerReason = reason;
    ElevenLabsTTSAdapter.circuitBreakerTripTime = Date.now();
  }

  /**
   * Resets the circuit breaker (for testing and manual rearming).
   */
  public static resetCircuitBreaker() {
    ElevenLabsTTSAdapter.circuitBreakerTripped = false;
    ElevenLabsTTSAdapter.circuitBreakerReason = null;
    ElevenLabsTTSAdapter.circuitBreakerTripTime = 0;
  }

  /**
   * Returns true if ElevenLabs has all necessary credentials and voice configured.
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey.trim() && this.voiceId.trim());
  }

  /**
   * Retrieves current configuration details (excluding the secret API key).
   */
  public getConfigSummary() {
    return {
      isConfigured: this.isConfigured(),
      hasApiKey: Boolean(this.apiKey.trim()),
      voiceId: this.voiceId ? this.voiceId.slice(0, 6) + "..." : null,
      modelId: this.modelId,
      circuitBreakerTripped: ElevenLabsTTSAdapter.isCircuitBreakerTripped(),
    };
  }

  /**
   * Synthesizes oral text into MP3 audio stream.
   * Catches all errors safely without leaking credentials.
   */
  public async synthesize(
    text: string,
    voiceSettings?: VoiceSettings
  ): Promise<SynthesisResult> {
    if (ElevenLabsTTSAdapter.isCircuitBreakerTripped()) {
      return {
        success: false,
        fallback: true,
        reason: "RATE_LIMITED",
        message: `Circuito abierto por ${ElevenLabsTTSAdapter.circuitBreakerReason}; evitando reintentos y activando Web Speech.`,
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        fallback: true,
        reason: "CONFIG_MISSING",
        message: "ElevenLabs API Key o Voice ID no configurados; activando Web Speech de respaldo.",
      };
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return {
        success: false,
        fallback: true,
        reason: "PROVIDER_ERROR",
        message: "Texto de síntesis vacío.",
      };
    }

    const url = `${this.baseUrl}/text-to-speech/${encodeURIComponent(this.voiceId)}`;

    const payload = {
      text: cleanText,
      model_id: this.modelId,
      voice_settings: {
        stability: voiceSettings?.stability ?? 0.5,
        similarity_boost: voiceSettings?.similarity_boost ?? 0.75,
        style: voiceSettings?.style ?? 0.0,
        use_speaker_boost: voiceSettings?.use_speaker_boost ?? true,
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
          success: true,
          audioBuffer: buffer,
          contentType: "audio/mpeg",
          fallback: false,
        };
      }

      // Handle HTTP 402: Payment required / voice unsupported on plan (trip circuit breaker)
      if (response.status === 402) {
        console.warn("[ElevenLabsTTSAdapter] Pago requerido o plan no disponible (HTTP 402). Disparando circuit breaker permanente.");
        ElevenLabsTTSAdapter.tripCircuitBreaker("PLAN_LIMIT_HTTP_402");
        return {
          success: false,
          fallback: true,
          status: 402,
          reason: "RATE_LIMITED",
          message: "Límite de plan ElevenLabs alcanzado (HTTP 402). Circuito abierto para evitar consumo.",
        };
      }

      // Handle HTTP 401: Invalid credentials
      if (response.status === 401) {
        console.warn("[ElevenLabsTTSAdapter] Clave de API no válida o expirada (HTTP 401). Fallback a Web Speech.");
        return {
          success: false,
          fallback: true,
          status: 401,
          reason: "UNAUTHORIZED",
          message: "Credenciales de ElevenLabs no autorizadas.",
        };
      }

      // Handle HTTP 429: Rate limited or character quota exhausted (trip circuit breaker)
      if (response.status === 429) {
        console.warn("[ElevenLabsTTSAdapter] Límite de cuota de ElevenLabs alcanzado (HTTP 429). Disparando circuit breaker.");
        ElevenLabsTTSAdapter.tripCircuitBreaker("QUOTA_EXHAUSTED_HTTP_429");
        return {
          success: false,
          fallback: true,
          status: 429,
          reason: "RATE_LIMITED",
          message: "Cuota de voz externa agotada; circuito abierto para evitar reintentos.",
        };
      }

      console.warn(`[ElevenLabsTTSAdapter] Error del proveedor externo (HTTP ${response.status}). Fallback a Web Speech.`);
      return {
        success: false,
        fallback: true,
        status: response.status,
        reason: "PROVIDER_ERROR",
        message: `Error de proveedor ElevenLabs HTTP ${response.status}`,
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err?.name === "AbortError" || err?.name === "TimeoutError";

      if (isTimeout) {
        console.warn(`[ElevenLabsTTSAdapter] Timeout excedido (${this.timeoutMs}ms). Fallback a Web Speech.`);
        return {
          success: false,
          fallback: true,
          status: 504,
          reason: "TIMEOUT",
          message: "Tiempo de espera de síntesis agotado; activando Web Speech.",
        };
      }

      console.warn("[ElevenLabsTTSAdapter] Error de conexión de red. Fallback a Web Speech.");
      return {
        success: false,
        fallback: true,
        status: 503,
        reason: "PROVIDER_ERROR",
        message: "Error de red al conectar con ElevenLabs; activando Web Speech.",
      };
    }
  }
}
