import { PracticeGenerationResult } from "@/types";
export interface McpConnectionStatus { connected: boolean; protocolVersion?: string; serverName?: string; latencyMs?: number; error?: string; transport?: string; toolsCount?: number }
export interface McpClientToolCallResponse<T = any> { result: T; source: "mcp" | "local-fallback"; toolName: string; durationMs: number; isError: boolean; error?: string }
export class McpClient {
  private serverUrl: string;
  private actorToken = "";
  private judgeToken = "";
  private initialization?: Promise<void>;
  constructor(serverUrl?: string, _forceRealMcp?: boolean) { this.serverUrl = serverUrl || process.env.NEXT_PUBLIC_MCP_URL || "/mcp"; }
  setForceRealMcp(_force: boolean) {}
  isForceRealMcp() { return true; }
  getServerUrl() { return this.serverUrl; }
  getHealthUrl() { return this.serverUrl.replace(/\/mcp\/?$/, "/health"); }
  private endpoint(path: string) { return this.serverUrl.replace(/\/mcp\/?$/, path); }
  async demoApi(path: string, body?: unknown) {
    const res = await fetch(this.endpoint(path), { method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + this.actorToken, "X-Demo-Control": this.judgeToken }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    const result = await res.json(); if (!res.ok) throw new Error(result.error || "Server unavailable"); return result;
  }
  async initializeDemo(reset = false) {
    if (this.initialization) { await this.initialization; if (!reset) return; }
    if (!reset && !this.actorToken && typeof window !== "undefined") {
      try {
        const stored = JSON.parse(sessionStorage.getItem("machtia_demo_capability") || "null");
        if (stored) {
          this.actorToken=stored.actorToken;this.judgeToken=stored.judgeToken;
          const res = await fetch(this.endpoint("/api/state"), { headers: { Authorization: "Bearer " + this.actorToken }, cache: "no-store" });
          if (res.status === 401) { this.actorToken="";this.judgeToken="";sessionStorage.removeItem("machtia_demo_capability"); }
          else if (!res.ok) throw new Error("No se pudo restaurar la sesión demo");
        }
      } catch (error) { this.actorToken="";this.judgeToken=""; throw error; }
    }
    if (!reset && this.actorToken) return;
    if (!reset && this.initialization) return this.initialization;
    this.initialization = (async () => { const result = await this.demoApi("/api/demo", {}); this.actorToken = result.actorToken; this.judgeToken = result.judgeToken; if (typeof window !== "undefined") sessionStorage.setItem("machtia_demo_capability", JSON.stringify({ actorToken: this.actorToken, judgeToken: this.judgeToken })); })();
    try { await this.initialization; } finally { this.initialization = undefined; }
  }
  async selectRole(role: "teacher" | "student", studentId: string) {
    await this.initializeDemo(); const result = await this.demoApi("/api/role", { role, studentId }); this.actorToken = result.actorToken; if (typeof window !== "undefined") sessionStorage.setItem("machtia_demo_capability", JSON.stringify({actorToken:this.actorToken,judgeToken:this.judgeToken}));
  }
  async snapshot() { await this.initializeDemo(); return this.demoApi("/api/state"); }
  async checkHealth() { try { const res = await fetch(this.getHealthUrl(), { signal: AbortSignal.timeout(15000) }); return res.ok ? await res.json() : null; } catch { return null; } }
  async checkConnection(): Promise<McpConnectionStatus> { const started = Date.now(); const health = await this.checkHealth(); return { connected: Boolean(health), protocolVersion: health?.protocolVersion, serverName: health?.server, toolsCount: health?.toolsCount, latencyMs: Date.now() - started, transport: "Streamable HTTP", error: health ? undefined : "Servidor no disponible. No se guardarán resultados locales." }; }
  async listTools() { const res = await fetch(this.serverUrl, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) }); const value = await res.json(); if (!res.ok || !value.result) throw new Error("Cannot list MCP tools"); return value.result.tools; }
  async callTool<T = any>(name: string, args: Record<string, any>): Promise<McpClientToolCallResponse<T>> {
    await this.initializeDemo(); const started = Date.now();
    const res = await fetch(this.serverUrl, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25", Authorization: "Bearer " + this.actorToken }, body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method: "tools/call", params: { name, arguments: args } }), signal: AbortSignal.timeout(30000) });
    const json = await res.json(); if (!res.ok || json.error || json.result?.isError) throw new Error(json.error?.message || json.result?.structuredContent?.message || json.result?.content?.[0]?.text || "MCP request failed");
    return { result: json.result.structuredContent as T, source: "mcp", toolName: name, durationMs: Date.now() - started, isError: false };
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
