/**
 * MACHTIA Adaptive Tutor - TTS Session Guard & Quota Controller
 *
 * Enforces:
 * 1. Scope-bound session capability authorization (rejecting unauthenticated callers).
 * 2. Strict text validation (max 600 chars, no empty payloads).
 * 3. Rate limiting and quota consumption limits per session and globally.
 * 4. Configurable and persistent global daily consumption ledger.
 * 5. In-memory LRU audio cache for anonymous educational phrases (saving credit costs).
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type ActorResolver = (token: string) => { role: "student" | "teacher"; id: string } | undefined;
let activeActorResolver: ActorResolver | null = null;

export function registerActorResolver(resolver: ActorResolver) {
  activeActorResolver = resolver;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: "UNAUTHORIZED" | "TEXT_TOO_LONG" | "EMPTY_TEXT" | "RATE_LIMITED" | "QUOTA_EXCEEDED" | "GLOBAL_QUOTA_EXCEEDED";
  message?: string;
  remainingRequests?: number;
  actorScope?: { role: "student" | "teacher"; id: string };
}

interface SessionUsage {
  requestTimestamps: number[];
  hourlyChars: number;
  lastResetHour: number;
}

interface CachedAudio {
  buffer: Buffer;
  contentType: string;
  timestamp: number;
}

interface PersistentQuotaData {
  date: string; // YYYY-MM-DD
  totalChars: number;
  totalRequests: number;
}

class TtsSessionGuard {
  // Session tracking: identityKey -> usage
  private sessionUsageMap = new Map<string, SessionUsage>();

  // In-memory audio LRU cache: hash -> audio
  private audioCache = new Map<string, CachedAudio>();
  private readonly MAX_CACHE_SIZE = 120;
  private readonly CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

  // Persistent ledger path
  private ledgerPath: string;

  constructor() {
    const isVercel = Boolean(process.env.VERCEL);
    this.ledgerPath = isVercel
      ? path.join("/tmp", ".tts-quota-ledger.json")
      : path.join(process.cwd(), ".tts-quota-ledger.json");
  }

  // Configurable thresholds
  private get MAX_TEXT_LENGTH(): number {
    return 600;
  }

  private get MAX_REQUESTS_PER_MINUTE(): number {
    return parseInt(process.env.TTS_MAX_REQUESTS_PER_MINUTE || "12", 10);
  }

  private get MAX_CHARS_PER_HOUR(): number {
    return parseInt(process.env.TTS_SESSION_MAX_CHARS_HOURLY || "25000", 10);
  }

  private get GLOBAL_MAX_CHARS_DAILY(): number {
    return parseInt(process.env.TTS_GLOBAL_MAX_CHARS_DAILY || "100000", 10);
  }

  /**
   * Reads current day persistent quota from filesystem if available.
   */
  private readPersistentLedger(): PersistentQuotaData {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (fs.existsSync(this.ledgerPath)) {
        const raw = fs.readFileSync(this.ledgerPath, "utf-8");
        const data = JSON.parse(raw);
        if (data && data.date === today) {
          return data;
        }
      }
    } catch {
      // Safe fallback if filesystem is read-only or corrupted
    }
    return { date: today, totalChars: 0, totalRequests: 0 };
  }

  /**
   * Persists updated quota counters.
   */
  private writePersistentLedger(data: PersistentQuotaData) {
    try {
      fs.writeFileSync(this.ledgerPath, JSON.stringify(data), "utf-8");
    } catch {
      // Non-fatal if filesystem write fails (e.g. read-only environment)
    }
  }

  /**
   * Validates whether the incoming token matches an authorized MACHTIA session format.
   * Format: base64url or alphanumeric token of at least 16 characters.
   */
  public isValidSessionToken(token: string | null | undefined): boolean {
    if (!token) return false;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    if (cleanToken.length < 16 || cleanToken.length > 128) return false;
    return /^[a-zA-Z0-9_\-]+$/.test(cleanToken);
  }

  /**
   * Resolves the authenticated actor if present in the active repository session.
   */
  public resolveActor(token: string | null | undefined): { role: "student" | "teacher"; id: string } | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    if (activeActorResolver) {
      try {
        const actor = activeActorResolver(cleanToken);
        if (actor) {
          return { role: actor.role, id: actor.id };
        }
      } catch {
        // safe fallback
      }
    }
    return null;
  }

  /**
   * Performs content length and character validation.
   */
  public validateContent(text: unknown): { valid: boolean; error?: string; cleanText: string } {
    if (typeof text !== "string") {
      return { valid: false, error: "El cuerpo debe contener una cadena de texto válida.", cleanText: "" };
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return { valid: false, error: "El texto a sintetizar no puede estar vacío.", cleanText: "" };
    }

    if (trimmed.length > this.MAX_TEXT_LENGTH) {
      return {
        valid: false,
        error: `El texto excede el límite permitido de ${this.MAX_TEXT_LENGTH} caracteres (recibidos: ${trimmed.length}).`,
        cleanText: "",
      };
    }

    return { valid: true, cleanText: trimmed };
  }

  /**
   * Evaluates quota and rate limits for an authorized session token,
   * binding limits to the resolved actor ID when available to prevent token hopping.
   */
  public checkSessionQuota(token: string, textLength: number): QuotaCheckResult {
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    const actor = this.resolveActor(cleanToken);

    // Identity key: if actor resolved, bind to actor.id; otherwise bind to token
    const identityKey = actor ? `${actor.role}:${actor.id}` : cleanToken;

    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));

    // 1. Check Global Daily Persistent Quota
    const persistentData = this.readPersistentLedger();
    if (persistentData.totalChars + textLength > this.GLOBAL_MAX_CHARS_DAILY) {
      return {
        allowed: false,
        reason: "GLOBAL_QUOTA_EXCEEDED",
        message: `Límite diario global de síntesis de la plataforma alcanzado (${this.GLOBAL_MAX_CHARS_DAILY} caracteres).`,
        remainingRequests: 0,
        actorScope: actor || undefined,
      };
    }

    // 2. Check Session Hourly & Minute Limits
    let usage = this.sessionUsageMap.get(identityKey);
    if (!usage) {
      usage = {
        requestTimestamps: [],
        hourlyChars: 0,
        lastResetHour: currentHour,
      };
      this.sessionUsageMap.set(identityKey, usage);
    }

    // Reset hourly bucket if hour transitioned
    if (usage.lastResetHour !== currentHour) {
      usage.hourlyChars = 0;
      usage.lastResetHour = currentHour;
    }

    // Filter requests in the last 60 seconds
    const oneMinuteAgo = now - 60 * 1000;
    usage.requestTimestamps = usage.requestTimestamps.filter((t) => t > oneMinuteAgo);

    // Check 1-minute rate limit
    if (usage.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return {
        allowed: false,
        reason: "RATE_LIMITED",
        message: `Límite por minuto alcanzado (${this.MAX_REQUESTS_PER_MINUTE} req/min). Por favor espera un momento.`,
        remainingRequests: 0,
        actorScope: actor || undefined,
      };
    }

    // Check hourly character quota
    if (usage.hourlyChars + textLength > this.MAX_CHARS_PER_HOUR) {
      return {
        allowed: false,
        reason: "QUOTA_EXCEEDED",
        message: "Límite de cuota horaria de síntesis alcanzado para este usuario.",
        remainingRequests: 0,
        actorScope: actor || undefined,
      };
    }

    // Register consumption in session
    usage.requestTimestamps.push(now);
    usage.hourlyChars += textLength;

    // Register consumption in persistent global ledger
    persistentData.totalChars += textLength;
    persistentData.totalRequests += 1;
    this.writePersistentLedger(persistentData);

    return {
      allowed: true,
      remainingRequests: this.MAX_REQUESTS_PER_MINUTE - usage.requestTimestamps.length,
      actorScope: actor || undefined,
    };
  }

  /**
   * Generates a deterministic hash for anonymous text + voice ID.
   */
  public computeHash(cleanText: string, voiceId = "default"): string {
    return createHash("sha256").update(`${cleanText}::${voiceId}`).digest("hex");
  }

  /**
   * Retrieves cached audio buffer if present and unexpired.
   */
  public getCachedAudio(key: string): CachedAudio | null {
    const item = this.audioCache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.CACHE_TTL_MS) {
      this.audioCache.delete(key);
      return null;
    }

    return item;
  }

  /**
   * Stores synthesized audio buffer in the memory cache.
   */
  public setCachedAudio(key: string, buffer: Buffer, contentType = "audio/mpeg") {
    if (this.audioCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.audioCache.keys().next().value;
      if (oldestKey) this.audioCache.delete(oldestKey);
    }

    this.audioCache.set(key, {
      buffer,
      contentType,
      timestamp: Date.now(),
    });
  }

  /**
   * Resets all internal stores and persistent file (primarily for testing).
   */
  public resetForTesting() {
    this.sessionUsageMap.clear();
    this.audioCache.clear();
    try {
      if (fs.existsSync(this.ledgerPath)) {
        fs.unlinkSync(this.ledgerPath);
      }
    } catch {
      // ignore
    }
  }
}

export const ttsSessionGuard = new TtsSessionGuard();
