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

  constructor(serverUrl?: string) {
    this.serverUrl =
      serverUrl ||
      process.env.NEXT_PUBLIC_MCP_URL ||
      process.env.MCP_URL ||
      "http://localhost:3100/mcp";
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

    // Fallback list of 7 primary tools
    return [
      { name: "analyze_student_performance" },
      { name: "find_students_needing_support" },
      { name: "get_student_learning_gap" },
      { name: "generate_adaptive_practice" },
      { name: "assign_practice_to_student" },
      { name: "get_student_progress" },
      { name: "report_progress_to_teacher" },
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
          };
        }
      }
    } catch (err: any) {
      // Log connection error in development without interrupting user experience
      // Will proceed to local fallback below
    }

    // 2. Controlled Local Fallback (reusing tutor-tools without duplication)
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
  ) {
    return this.callTool("generate_adaptive_practice", {
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
}

export const mcpClient = new McpClient();
