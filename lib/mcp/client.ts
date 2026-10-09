import { PracticeGenerationResult } from "@/types";
export interface McpConnectionStatus { connected: boolean; protocolVersion?: string; serverName?: string; latencyMs?: number; error?: string; transport?: string; toolsCount?: number }
export interface McpClientToolCallResponse<T = any> { result: T; source: "mcp" | "local-fallback"; toolName: string; durationMs: number; isError: boolean; error?: string }

export function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return "mcp-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
}

export class McpHttpError extends Error {
  status: number;
  endpoint: string;
  isColdStart: boolean;
  isNotFound: boolean;
  isUnauthorized: boolean;
  isForbidden: boolean;
  isRateLimited: boolean;
  isTimeout: boolean;

  constructor(status: number, message: string, endpoint: string, options?: { isTimeout?: boolean; isColdStart?: boolean }) {
    super(message);
    this.name = "McpHttpError";
    this.status = status;
    this.endpoint = endpoint;
    this.isTimeout = Boolean(options?.isTimeout);
    this.isNotFound = status === 404;
    this.isUnauthorized = status === 401;
    this.isForbidden = status === 403;
    this.isRateLimited = status === 429;
    this.isColdStart = Boolean(options?.isColdStart) || (!this.isTimeout && !this.isNotFound && (status === 502 || status === 503 || status === 504));
  }
}

async function parseResponseSafely<T = any>(res: Response, endpoint: string): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  let raw = "";
  try {
    raw = await res.text();
  } catch (readErr) {
    throw new McpHttpError(res.status, `Error al leer respuesta (${endpoint}): ${String(readErr)}`, endpoint);
  }
  const trimmed = raw.trim();

  // Specific handling for HTTP 404 - NEVER classify 404 as cold-start
  if (res.status === 404) {
    throw new McpHttpError(404, `Ruta no encontrada en el servidor (HTTP 404) para ${endpoint}.`, endpoint);
  }

  // Specific handling for HTTP 401 Unauthorized
  if (res.status === 401) {
    throw new McpHttpError(401, `Sesión demo no autorizada o expirada (HTTP 401) para ${endpoint}.`, endpoint);
  }

  // Specific handling for HTTP 403 Forbidden
  if (res.status === 403) {
    throw new McpHttpError(403, `Acceso denegado u origen no permitido (HTTP 403) para ${endpoint}.`, endpoint);
  }

  // Specific handling for HTTP 429 Rate limit
  if (res.status === 429) {
    throw new McpHttpError(429, `Límite de solicitudes alcanzado (HTTP 429). Por favor espere un momento.`, endpoint);
  }

  // Guard against HTML responses (Render cold-start spin-up 502/503/504 or gateway error)
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || contentType.includes("text/html")) {
    const isColdStart = (res.status === 502 || res.status === 503 || res.status === 504) ||
      trimmed.toLowerCase().includes("waking up") ||
      trimmed.toLowerCase().includes("spinning up") ||
      trimmed.toLowerCase().includes("service is waking");
    if (isColdStart) {
      throw new McpHttpError(
        res.status || 503,
        `Servidor MACHTIA iniciando en la nube (Render spin-up, HTTP ${res.status}). Reintentando conexión...`,
        endpoint,
        { isColdStart: true }
      );
    }
    throw new McpHttpError(res.status, `Servidor devolvió HTML inesperado (HTTP ${res.status}) para ${endpoint}.`, endpoint);
  }

  if (!trimmed) {
    if (res.ok) return {} as T;
    throw new McpHttpError(res.status, `Respuesta vacía del servidor (HTTP ${res.status}) para ${endpoint}`, endpoint);
  }

  let data: any;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new McpHttpError(res.status, `Respuesta no válida del servidor (HTTP ${res.status}): ${trimmed.slice(0, 100)}`, endpoint);
  }

  if (!res.ok) {
    const errorMsg = data?.error?.message || data?.error || data?.message || `HTTP ${res.status}`;
    const msg = typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg);
    throw new McpHttpError(res.status, msg, endpoint);
  }

  return data as T;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1200): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || 0;
      // Do not retry 400, 401, 403, 404
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        throw err;
      }
      const isRetriable =
        err?.isColdStart ||
        err?.isTimeout ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        status === 429 ||
        err?.name === "AbortError" ||
        err?.name === "TimeoutError" ||
        String(err?.message || "").includes("iniciando") ||
        String(err?.message || "").includes("spin-up") ||
        String(err?.message || "").includes("Failed to fetch") ||
        String(err?.message || "").includes("NetworkError");

      if (attempt < retries && isRetriable) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export class McpClient {
  private serverUrl: string;
  private actorToken = "";
  private judgeToken = "";
  private initialization?: Promise<void>;
  constructor(serverUrl?: string, _forceRealMcp?: boolean) { this.serverUrl = serverUrl || process.env.NEXT_PUBLIC_MCP_URL || "/mcp"; }
  setForceRealMcp(_force: boolean) {}
  isForceRealMcp() { return true; }
  setServerUrl(url: string) { this.serverUrl = url; }
  getServerUrl(): string {
    if (!this.serverUrl.startsWith("http://") && !this.serverUrl.startsWith("https://")) {
      if (typeof window !== "undefined" && window.location?.origin) {
        return new URL(this.serverUrl, window.location.origin).toString();
      }
      const host = process.env.MCP_BACKEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return new URL(this.serverUrl, host).toString();
    }
    return this.serverUrl;
  }
  getHealthUrl(): string {
    return this.endpoint("/health");
  }
  private endpoint(path: string): string {
    const raw = this.serverUrl.replace(/\/mcp\/?$/, path);
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      if (typeof window !== "undefined" && window.location?.origin) {
        return new URL(raw, window.location.origin).toString();
      }
      const host = process.env.MCP_BACKEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return new URL(raw, host).toString();
    }
    return raw;
  }
  async demoApi(path: string, body?: unknown) {
    return withRetry(async () => {
      const res = await fetch(this.endpoint(path), {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + this.actorToken, "X-Demo-Control": this.judgeToken },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      return parseResponseSafely(res, path);
    }, 3, 1200);
  }
  async initializeDemo(reset = false) {
    if (this.initialization) { await this.initialization; if (!reset) return; }
    if (!reset && !this.actorToken && typeof window !== "undefined") {
      try {
        const stored = JSON.parse(sessionStorage.getItem("machtia_demo_capability") || "null");
        if (stored?.actorToken && stored?.judgeToken) {
          this.actorToken = stored.actorToken;
          this.judgeToken = stored.judgeToken;
          const res = await fetch(this.endpoint("/api/state"), {
            headers: { Authorization: "Bearer " + this.actorToken },
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          });
          if (res.status === 401 || res.status === 403) {
            // Expired or lost session token clears stored credentials cleanly
            this.actorToken = "";
            this.judgeToken = "";
            sessionStorage.removeItem("machtia_demo_capability");
          } else if (res.ok) {
            return;
          } else if (res.status === 404) {
            throw new McpHttpError(404, "Endpoint /api/state no encontrado (HTTP 404)", "/api/state");
          } else if (res.status >= 500) {
            // Server error / spin-up: DO NOT wipe valid student session tokens!
            throw new McpHttpError(res.status, `Servidor MACHTIA temporalmente no disponible (HTTP ${res.status}).`, "/api/state", { isColdStart: true });
          }
        }
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          this.actorToken = "";
          this.judgeToken = "";
        } else if (err?.status === 404 || err?.status >= 500) {
          throw err;
        }
      }
    }
    if (!reset && this.actorToken) return;
    if (!reset && this.initialization) return this.initialization;
    this.initialization = (async () => {
      const result = await this.demoApi("/api/demo", {});
      this.actorToken = result.actorToken;
      this.judgeToken = result.judgeToken;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("machtia_demo_capability", JSON.stringify({ actorToken: this.actorToken, judgeToken: this.judgeToken }));
      }
    })();
    try { await this.initialization; } finally { this.initialization = undefined; }
  }
  async selectRole(role: "teacher" | "student", studentId: string) {
    await this.initializeDemo();
    try {
      const result = await this.demoApi("/api/role", { role, studentId });
      this.actorToken = result.actorToken;
      if (typeof window !== "undefined") sessionStorage.setItem("machtia_demo_capability", JSON.stringify({ actorToken: this.actorToken, judgeToken: this.judgeToken }));
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || String(err?.message || "").includes("Judge controller capability")) {
        // Backend lost session or restarted in memory: cleanly recreate demo session and retry
        this.actorToken = "";
        this.judgeToken = "";
        if (typeof window !== "undefined") sessionStorage.removeItem("machtia_demo_capability");
        await this.initializeDemo(true);
        const retryResult = await this.demoApi("/api/role", { role, studentId });
        this.actorToken = retryResult.actorToken;
        if (typeof window !== "undefined") sessionStorage.setItem("machtia_demo_capability", JSON.stringify({ actorToken: this.actorToken, judgeToken: this.judgeToken }));
      } else {
        throw err;
      }
    }
  }
  async snapshot() { await this.initializeDemo(); return this.demoApi("/api/state"); }
  async checkHealth() {
    try {
      const res = await fetch(this.getHealthUrl(), { signal: AbortSignal.timeout(10000), cache: "no-store" });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      if (!text || text.trim().startsWith("<") || !contentType.includes("json")) {
        return null;
      }
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  async checkConnection(): Promise<McpConnectionStatus> {
    const started = Date.now();
    const health = await this.checkHealth();
    return {
      connected: Boolean(health),
      protocolVersion: health?.protocolVersion,
      serverName: health?.server,
      toolsCount: health?.toolsCount,
      latencyMs: Date.now() - started,
      transport: "Streamable HTTP",
      error: health ? undefined : "Servidor no disponible. No se guardarán resultados locales.",
    };
  }
  async listTools() {
    return withRetry(async () => {
      const res = await fetch(this.getServerUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        signal: AbortSignal.timeout(15000),
      });
      const value = await parseResponseSafely<any>(res, "tools/list");
      if (!value.result?.tools) throw new Error("Cannot list MCP tools");
      return value.result.tools;
    }, 3, 1200);
  }
  private async executeCallToolInternal<T = any>(name: string, args: Record<string, any>, started: number): Promise<McpClientToolCallResponse<T>> {
    return withRetry(async () => {
      const res = await fetch(this.getServerUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": "2025-11-25",
          Authorization: "Bearer " + this.actorToken,
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: safeUUID(), method: "tools/call", params: { name, arguments: args } }),
        signal: AbortSignal.timeout(20000),
      });
      const json = await parseResponseSafely<any>(res, `tools/call:${name}`);
      if (json.error || json.result?.isError) {
        throw new Error(
          json.error?.message ||
          json.result?.structuredContent?.message ||
          json.result?.content?.[0]?.text ||
          "MCP request failed"
        );
      }
      return { result: (json.result?.structuredContent ?? json.result) as T, source: "mcp" as const, toolName: name, durationMs: Date.now() - started, isError: false };
    }, 2, 1000);
  }
  async callTool<T = any>(name: string, args: Record<string, any>): Promise<McpClientToolCallResponse<T>> {
    await this.initializeDemo();
    const started = Date.now();
    try {
      return await this.executeCallToolInternal<T>(name, args, started);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || String(err?.message || "").includes("actor required") || String(err?.message || "").includes("capability required")) {
        // Backend lost session or restarted in memory: auto-refresh demo session and retry once
        this.actorToken = "";
        this.judgeToken = "";
        if (typeof window !== "undefined") sessionStorage.removeItem("machtia_demo_capability");
        await this.initializeDemo(true);
        return await this.executeCallToolInternal<T>(name, args, started);
      }
      throw err;
    }
  }
  // Type-safe convenience wrappers
  async analyzeStudentPerformance(groupId: string, subjectId: string) {
    return this.callTool("analyze_student_performance", { groupId, subjectId });
  }

  async findStudentsNeedingSupport(groupId: string, subjectId: string = "matematicas", threshold: number = 65) {
    return this.callTool("find_students_needing_support", { groupId, subjectId, threshold });
  }

  async getStudentLearningGap(studentId: string, subjectId: string = "matematicas", topicId?: string) {
    return this.callTool("get_student_learning_gap", { studentId, subjectId, topicId });
  }

  async generateAdaptivePractice(
    studentId: string,
    topicId: string,
    initialDifficulty: "easy" | "medium" | "hard" = "easy",
    exerciseCount: number = 5
  ): Promise<McpClientToolCallResponse<PracticeGenerationResult | null>> {
    return this.callTool<PracticeGenerationResult | null>("generate_adaptive_practice", {
      studentId,
      topicId,
      initialDifficulty,
      exerciseCount,
    });
  }

  async assignPracticeToStudent(practiceId: string, studentId: string) {
    return this.callTool("assign_practice_to_student", { practiceId, studentId });
  }

  async getStudentProgress(studentId: string, subjectId: string = "matematicas") {
    return this.callTool("get_student_progress", { studentId, subjectId });
  }

  async reportProgressToTeacher(studentId: string, subjectId: string = "matematicas") {
    return this.callTool("report_progress_to_teacher", { studentId, subjectId });
  }

  // Alexa+ 8 conversational convenience wrappers
  async getStudentContext(
    studentId: string,
    options?: { tenantId?: string; requesterId?: string; requesterRole?: "student" | "teacher" | "system" }
  ) {
    return this.callTool("get_student_context", { studentId, ...options });
  }

  async getAssignedPractice(
    studentId: string,
    options?: { status?: string; tenantId?: string; requesterId?: string; requesterRole?: "student" | "teacher" | "system" }
  ) {
    return this.callTool("get_assigned_practice", { studentId, ...options });
  }

  async startPractice(
    practiceId: string,
    studentId: string,
    options?: { tenantId?: string; requesterId?: string }
  ) {
    return this.callTool("start_practice", { practiceId, studentId, ...options });
  }

  async submitAnswer(
    practiceId: string,
    exerciseId: string,
    studentAnswer: string,
    attemptNumber: number,
    studentId: string,
    options?: { tenantId?: string; requesterId?: string }
  ) {
    return this.callTool("submit_answer", {
      practiceId,
      exerciseId,
      studentAnswer,
      attemptNumber,
      studentId,
      ...options,
    });
  }

  async getHint(
    exerciseId: string,
    studentId: string,
    options?: { practiceId?: string; attemptNumber?: number; tenantId?: string; requesterId?: string }
  ) {
    return this.callTool("get_hint", { exerciseId, studentId, ...options });
  }

  async getAdaptiveExplanation(
    exerciseId: string,
    studentId: string,
    options?: { practiceId?: string; level?: "analogy" | "step_by_step"; tenantId?: string; requesterId?: string }
  ) {
    return this.callTool("get_adaptive_explanation", { exerciseId, studentId, ...options });
  }

  async completePractice(
    practiceId: string,
    studentId: string,
    options?: {
      answers?: Array<{ exerciseId: string; isCorrect: boolean; studentAnswer?: string; attemptsCount?: number }>;
      tenantId?: string;
      requesterId?: string;
    }
  ) {
    return this.callTool("complete_practice", { practiceId, studentId, ...options });
  }

  async getPracticeResult(
    practiceId: string,
    studentId: string,
    options?: { tenantId?: string; requesterId?: string; requesterRole?: "student" | "teacher" | "system" }
  ) {
    return this.callTool("get_practice_result", { practiceId, studentId, ...options });
  }
}

export const mcpClient = new McpClient();
