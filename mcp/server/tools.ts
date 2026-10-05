/**
 * MACHTIA Adaptive Tutor - MCP Tool Registry & Handlers
 * Protocol Version: 2025-11-25
 * Reuses existing pedagogical domain logic from lib/tools/tutor-tools without duplication.
 */

import {
  analyze_student_performance,
  find_students_needing_support,
  get_student_learning_gap,
  generate_adaptive_practice,
  assign_practice_to_student,
  get_student_progress,
  report_progress_to_teacher,
} from "../../lib/tools/tutor-tools";
import {
  get_student_context,
  get_assigned_practice,
  start_practice,
  submit_answer,
  get_hint,
  get_adaptive_explanation,
  complete_practice,
  get_practice_result,
} from "./alexa-service";
import { MCP_TOOLS_SCHEMAS, validateToolArguments, McpToolSchema } from "./schemas";
import { authorizeTool } from "./session";
import { repository } from "@/lib/data/repository";

export interface McpCallResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  structuredContent?: Record<string, any>;
  isError: boolean;
}

/**
 * Returns list of exposed MCP tools with standard JSON schemas.
 */
export function listMcpTools(): McpToolSchema[] {
  return Object.values(MCP_TOOLS_SCHEMAS);
}

/**
 * Executes an MCP tool call by name with arguments.
 * Performs schema validation, error handling, and formats standard MCP response.
 */
export async function executeMcpTool(
  toolName: string,
  args: Record<string, any> = {}
): Promise<McpCallResult> {
  // 1. Validate parameters
  const validation = validateToolArguments(toolName, args);
  if (!validation.valid) {
    return {
      content: [
        {
          type: "text",
          text: `[MCP 2025-11-25 Schema Error] Parámetros inválidos para '${toolName}':\n${validation.errors.join("\n")}`,
        },
      ],
      structuredContent: {
        error: "INVALID_PARAMS",
        details: validation.errors,
      },
      isError: true,
    };
  }

  // 2. Dispatch to domain functions
  try {
    authorizeTool(toolName, args);
    const startedAt = Date.now();
    let result: any;

    switch (toolName) {
      case "analyze_student_performance": {
        result = await analyze_student_performance(args.groupId, args.subjectId);
        break;
      }

      case "find_students_needing_support": {
        result = await find_students_needing_support(
          args.groupId,
          args.subjectId || "matematicas",
          args.threshold !== undefined ? args.threshold : 65
        );
        break;
      }

      case "get_student_learning_gap": {
        result = await get_student_learning_gap(
          args.studentId,
          args.subjectId || "matematicas",
          args.topicId
        );
        break;
      }

      case "generate_adaptive_practice": {
        result = await generate_adaptive_practice(
          args.studentId,
          args.topicId,
          args.initialDifficulty || "easy",
          args.exerciseCount || 5
        );
        break;
      }

      case "assign_practice_to_student": {
        result = await assign_practice_to_student(args.practiceId, args.studentId);
        break;
      }

      case "get_student_progress": {
        result = await get_student_progress(
          args.studentId,
          args.subjectId || "matematicas"
        );
        break;
      }

      case "report_progress_to_teacher": {
        result = await report_progress_to_teacher(
          args.studentId,
          args.subjectId || "matematicas"
        );
        break;
      }

      // --- 8 HERRAMIENTAS CONVERSACIONALES AMAZON ALEXA+ ---
      case "get_student_context": {
        result = await get_student_context(args as any);
        break;
      }

      case "get_assigned_practice": {
        result = await get_assigned_practice(args as any);
        break;
      }

      case "start_practice": {
        result = await start_practice(args as any);
        break;
      }

      case "submit_answer": {
        result = await submit_answer(args as any);
        break;
      }

      case "get_hint": {
        result = await get_hint(args as any);
        break;
      }

      case "get_adaptive_explanation": {
        result = await get_adaptive_explanation(args as any);
        break;
      }

      case "complete_practice": {
        result = await complete_practice(args as any);
        break;
      }

      case "get_practice_result": {
        result = await get_practice_result(args as any);
        break;
      }

      default: {
        return {
          content: [
            {
              type: "text",
              text: `[MCP Error] Herramienta desconocida: '${toolName}'.`,
            },
          ],
          structuredContent: { error: "TOOL_NOT_FOUND", toolName },
          isError: true,
        };
      }
    }

    repository.logAction({ toolName, displayName: toolName, description: "Herramienta ejecutada en servidor MCP", input: args, output: result, status: "success", source: "mcp", durationMs: Date.now() - startedAt, mcpProtocol: "2025-11-25" });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      structuredContent: result,
      isError: false,
    };
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `[MCP Execution Error] Error ejecutando '${toolName}': ${err?.message || String(err)}`,
        },
      ],
      structuredContent: {
        error: err?.code || "EXECUTION_FAILED",
        code: err?.code || "EXECUTION_FAILED",
        statusCode: err?.statusCode || (err?.code?.includes("FORBIDDEN") || err?.code?.includes("MISMATCH") ? 403 : 400),
        message: err?.message || String(err),
      },
      isError: true,
    };
  }
}
