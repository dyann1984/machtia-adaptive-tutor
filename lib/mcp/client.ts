/**
 * MACHTIA Adaptive Tutor - MCP Client
 * Protocol Version: 2025-11-25
 * Communicates with MACHTIA MCP Server via Streamable HTTP, with seamless resilient fallback.
 */

import {
  analyze_student_performance,
  find_students_needing_support,
  get_student_learning_gap,
  generate_adaptive_practice,
  assign_practice_to_student,
  get_student_progress,
  report_progress_to_teacher,
} from "@/lib/tools/tutor-tools";
import {
  get_student_context,
  get_assigned_practice,
  start_practice,
  submit_answer,
  get_hint,
  get_adaptive_explanation,
  complete_practice,
  get_practice_result,
} from "@/mcp/server/alexa-service";
import { PracticeGenerationResult } from "@/types";

export interface McpConnectionStatus {
  connected: boolean;
  protocolVersion?: string;
  serverName?: string;
  latencyMs?: number;
  error?: string;
  transport?: string;
  toolsCount?: number;
}

export interface McpClientToolCallResponse<T = any> {
  result: T;
  source: "mcp" | "local-fallback";
  toolName: string;
  durationMs: number;
  isError: boolean;
  error?: string;
}

export class McpClient {
  private serverUrl: string;
  private isConnected: boolean = false;
  private lastCheckTime: number = 0;
  private cachedProtocolVersion: string = "2025-11-25";
  private forceRealMcp: boolean;

  constructor(serverUrl?: string, forceRealMcp?: boolean) {
    this.serverUrl =
      serverUrl ||
      process.env.NEXT_PUBLIC_MCP_URL ||
      process.env.MCP_URL ||
      "http://localhost:3100/mcp";

    this.forceRealMcp =
      forceRealMcp !== undefined
        ? forceRealMcp
        : process.env.NEXT_PUBLIC_JUDGE_DEMO === "true" ||
          process.env.JUDGE_DEMO === "true" ||
          process.env.NEXT_PUBLIC_FORCE_REAL_MCP === "true";
  }

  public setForceRealMcp(force: boolean): void {
    this.forceRealMcp = force;
  }

  public isForceRealMcp(): boolean {
    return this.forceRealMcp;
  }

  public getServerUrl(): string {
    return this.serverUrl;
  }

  public getHealthUrl(): string {
    try {
      const url = new URL(this.serverUrl);
      url.pathname = "/health";
      return url.toString();
    } catch {
      return this.serverUrl.replace(/\/mcp\/?$/, "/health");
    }
  }

  /**
   * Directly queries the /health endpoint of the MCP server.
   */
  async checkHealth(): Promise<{ status: string; protocolVersion: string; transport: string; server: string; toolsCount: number } | null> {
    try {
      const healthUrl = this.getHealthUrl();
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 1500) : null;
      const res = await fetch(healthUrl, {
        method: "GET",
        signal: controller ? controller.signal : undefined,
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // offline or unreachable
    }
    return null;
  }

  /**
   * Checks real connectivity with the MCP Server over HTTP.
   */
  async checkConnection(): Promise<McpConnectionStatus> {
    const startTime = Date.now();
    try {
      const health = await this.checkHealth();

      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 1800) : null;

      const res = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mcp-protocol-version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: `check-${Date.now()}`,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            clientInfo: {
              name: "machtia-adaptive-tutor-web",
              version: "1.0.0",
            },
          },
        }),
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (data?.result?.serverInfo) {
        this.isConnected = true;
        this.lastCheckTime = Date.now();
        this.cachedProtocolVersion = data.result.protocolVersion || health?.protocolVersion || "2025-11-25";

        return {
          connected: true,
          protocolVersion: this.cachedProtocolVersion,
          serverName: data.result.serverInfo.name,
          latencyMs,
          transport: health?.transport || "Streamable HTTP",
          toolsCount: health?.toolsCount ?? 7,
        };
      }

      throw new Error("Invalid MCP handshake response");
    } catch (err: any) {
      this.isConnected = false;
      return {
        connected: false,
        error: err?.message || "MCP Server unreachable",
        latencyMs: Date.now() - startTime,
        transport: "Streamable HTTP (Offline fallback)",
        toolsCount: undefined,
      };
    }
  }

  /**
   * Retrieves registered tools directly from MCP server or fallback list.
   */
  async listTools(): Promise<any[]> {
    try {
      const res = await fetch(this.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: `list-${Date.now()}`,
          method: "tools/list",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.result?.tools) {
          return data.result.tools;
        }
      }
    } catch (e) {
      // Ignore and fallback
    }

    // Fallback list of 15 registered tools (7 teacher + 8 Alexa+ conversational)
    return [
      { name: "analyze_student_performance" },
      { name: "find_students_needing_support" },
      { name: "get_student_learning_gap" },
      { name: "generate_adaptive_practice" },
      { name: "assign_practice_to_student" },
      { name: "get_student_progress" },
      { name: "report_progress_to_teacher" },
      { name: "get_student_context" },
      { name: "get_assigned_practice" },
      { name: "start_practice" },
      { name: "submit_answer" },
      { name: "get_hint" },
      { name: "get_adaptive_explanation" },
      { name: "complete_practice" },
      { name: "get_practice_result" },
    ];
  }

  /**
   * Invokes an MCP tool. If the MCP Server is reachable, executes via Streamable HTTP.
   * If offline or errors, transparently falls back to local tools without crashing.
   */
  async callTool<T = any>(
    name: string,
    args: Record<string, any>
  ): Promise<McpClientToolCallResponse<T>> {
    const startTime = Date.now();

    // 1. Attempt Real MCP Execution via Streamable HTTP
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3000) : null;

      const res = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mcp-protocol-version": "2025-11-25",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: `call-${name}-${Date.now()}`,
          method: "tools/call",
          params: {
            name,
            arguments: args,
          },
        }),
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json?.result) {
          const durationMs = Date.now() - startTime;
          const resultData =
            json.result.structuredContent ||
            (json.result.content?.[0]?.text
              ? JSON.parse(json.result.content[0].text)
              : json.result);

          return {
            result: resultData,
            source: "mcp",
            toolName: name,
            durationMs,
            isError: Boolean(json.result.isError),
            error: json.result.isError
              ? (json.result.structuredContent?.message || json.result.content?.[0]?.text || "Tool execution error")
              : undefined,
          };
        }
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      if (this.forceRealMcp) {
        const durationMs = Date.now() - startTime;
        return {
          result: null as any,
          source: "mcp",
          toolName: name,
          durationMs,
          isError: true,
          error: `[MCP Unavailable] El servidor MCP en ${this.serverUrl} no está disponible (${err?.message || "Conexión rechazada"}). En Modo Demo Oficial el fallback local está estrictamente deshabilitado para garantizar que toda respuesta provenga del servidor real.`,
        };
      }
      // Will proceed to local fallback below only in development mode
    }

    if (this.forceRealMcp) {
      return {
        result: null as any,
        source: "mcp",
        toolName: name,
        durationMs: Date.now() - startTime,
        isError: true,
        error: `[MCP Unavailable] Servidor MCP no disponible en ${this.serverUrl}.`,
      };
    }

    // 2. Controlled Local Fallback (reusing tutor-tools without duplication, only when NOT in demo mode)
    try {
      const localResult = await this.executeLocalFallback(name, args);
      const durationMs = Date.now() - startTime;

      return {
        result: localResult,
        source: "local-fallback",
        toolName: name,
        durationMs,
        isError: false,
      };
    } catch (localErr: any) {
      return {
        result: null as any,
        source: "local-fallback",
        toolName: name,
        durationMs: Date.now() - startTime,
        isError: true,
        error: localErr?.message || String(localErr),
      };
    }
  }

  /**
   * Internal local fallback runner reusing domain logic.
   */
  private async executeLocalFallback(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case "analyze_student_performance":
        return analyze_student_performance(args.groupId, args.subjectId);
      case "find_students_needing_support":
        return find_students_needing_support(
          args.groupId,
          args.subjectId || "matematicas",
          args.threshold !== undefined ? args.threshold : 65
        );
      case "get_student_learning_gap":
        return get_student_learning_gap(
          args.studentId,
          args.subjectId || "matematicas",
          args.topicId
        );
      case "generate_adaptive_practice":
        return generate_adaptive_practice(
          args.studentId,
          args.topicId,
          args.initialDifficulty || "easy",
          args.exerciseCount || 5
        );
      case "assign_practice_to_student":
        return assign_practice_to_student(args.practiceId, args.studentId);
      case "get_student_progress":
        return get_student_progress(args.studentId, args.subjectId || "matematicas");
      case "report_progress_to_teacher":
        return report_progress_to_teacher(args.studentId, args.subjectId || "matematicas");
      // Alexa+ 8 conversational tools
      case "get_student_context":
        return get_student_context(args as any);
      case "get_assigned_practice":
        return get_assigned_practice(args as any);
      case "start_practice":
        return start_practice(args as any);
      case "submit_answer":
        return submit_answer(args as any);
      case "get_hint":
        return get_hint(args as any);
      case "get_adaptive_explanation":
        return get_adaptive_explanation(args as any);
      case "complete_practice":
        return complete_practice(args as any);
      case "get_practice_result":
        return get_practice_result(args as any);
      default:
        throw new Error(`Herramienta '${name}' no encontrada en el catálogo local.`);
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
