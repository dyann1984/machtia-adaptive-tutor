/**
 * MACHTIA Adaptive Tutor - MCP Tool Schemas
 * Protocol Version: 2025-11-25
 * Specification: Model Context Protocol (MCP) Standard JSON Schema
 */

export interface McpToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: any;
    }>;
    required: string[];
    additionalProperties?: boolean;
  };
}

export const MCP_TOOLS_SCHEMAS: Record<string, McpToolSchema> = {
  analyze_student_performance: {
    name: "analyze_student_performance",
    description: "Analiza el desempeño grupal en una materia curricular para identificar distribuciones y promedios por tema.",
    inputSchema: {
      type: "object",
      properties: {
        groupId: {
          type: "string",
          description: "Identificador del grupo escolar (ej. 'grupo-3b').",
        },
        subjectId: {
          type: "string",
          description: "Identificador de la materia curricular (ej. 'matematicas').",
        },
      },
      required: ["groupId", "subjectId"],
      additionalProperties: false,
    },
  },

  find_students_needing_support: {
    name: "find_students_needing_support",
    description: "Identifica a los estudiantes que presentan rezago académico o desempeño inferior al umbral establecido.",
    inputSchema: {
      type: "object",
      properties: {
        groupId: {
          type: "string",
          description: "Identificador del grupo escolar a examinar.",
        },
        subjectId: {
          type: "string",
          description: "Materia específica para filtrar rezago (opcional, ej. 'matematicas').",
        },
        threshold: {
          type: "number",
          description: "Umbral de calificación porcentual mínima esperada (por defecto 65).",
        },
      },
      required: ["groupId"],
      additionalProperties: false,
    },
  },

  get_student_learning_gap: {
    name: "get_student_learning_gap",
    description: "Extrae el diagnóstico cognitivo detallado, error recurrente y evidencia empírica de rezago de un alumno.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: {
          type: "string",
          description: "Identificador único del alumno (ej. 'mariana-lopez').",
        },
        subjectId: {
          type: "string",
          description: "Materia curricular asociada (opcional, ej. 'matematicas').",
        },
        topicId: {
          type: "string",
          description: "Tema pedagógico específico a inspeccionar (opcional).",
        },
      },
      required: ["studentId"],
      additionalProperties: false,
    },
  },

  generate_adaptive_practice: {
    name: "generate_adaptive_practice",
    description: "Genera una secuencia adaptativa de ejercicios pedagógicos con andamiaje progresivo para el estudiante.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: {
          type: "string",
          description: "ID del estudiante al que se destina la práctica.",
        },
        topicId: {
          type: "string",
          description: "ID del tema curricular a reforzar (ej. 'fracciones-equivalentes').",
        },
        initialDifficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "Dificultad inicial calibrada ('easy', 'medium', 'hard').",
        },
        exerciseCount: {
          type: "number",
          description: "Cantidad de reactivos adaptativos a generar (por defecto 5).",
        },
      },
      required: ["studentId", "topicId"],
      additionalProperties: false,
    },
  },

  assign_practice_to_student: {
    name: "assign_practice_to_student",
    description: "Asigna formalmente una práctica generada al expediente del alumno para su realización inmediata.",
    inputSchema: {
      type: "object",
      properties: {
        practiceId: {
          type: "string",
          description: "ID único de la práctica pedagógica.",
        },
        studentId: {
          type: "string",
          description: "ID del estudiante destinatario.",
        },
      },
      required: ["practiceId", "studentId"],
      additionalProperties: false,
    },
  },

  get_student_progress: {
    name: "get_student_progress",
    description: "Recupera la trayectoria histórica y comparativas de evolución de aprendizaje del alumno.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: {
          type: "string",
          description: "ID único del estudiante a consultar.",
        },
        subjectId: {
          type: "string",
          description: "ID de la materia curricular (opcional).",
        },
      },
      required: ["studentId"],
      additionalProperties: false,
    },
  },

  report_progress_to_teacher: {
    name: "report_progress_to_teacher",
    description: "Genera el reporte de impacto pedagógico antes vs después para rendición de cuentas al docente.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: {
          type: "string",
          description: "ID del alumno evaluado.",
        },
        practiceId: {
          type: "string",
          description: "ID de la práctica completada (opcional).",
        },
        subjectId: {
          type: "string",
          description: "ID de la materia (opcional).",
        },
      },
      required: ["studentId"],
      additionalProperties: false,
    },
  },
};

/**
 * Validates arguments against the defined schema for a given tool.
 */
export function validateToolArguments(
  toolName: string,
  args: Record<string, any>
): { valid: boolean; errors: string[] } {
  const schema = MCP_TOOLS_SCHEMAS[toolName];
  if (!schema) {
    return {
      valid: false,
      errors: [`Tool desconocida: '${toolName}'. Herramientas soportadas: ${Object.keys(MCP_TOOLS_SCHEMAS).join(", ")}`],
    };
  }

  const errors: string[] = [];

  // Check required fields
  for (const requiredProp of schema.inputSchema.required) {
    if (args[requiredProp] === undefined || args[requiredProp] === null || args[requiredProp] === "") {
      errors.push(`El campo requerido '${requiredProp}' no fue proporcionado.`);
    }
  }

  // Check property types and enums if provided
  for (const [key, value] of Object.entries(args)) {
    const propSchema = schema.inputSchema.properties[key];
    if (!propSchema) {
      if (schema.inputSchema.additionalProperties === false) {
        errors.push(`Parámetro inesperado '${key}' no permitido para la herramienta '${toolName}'.`);
      }
      continue;
    }

    if (value !== undefined && value !== null) {
      if (propSchema.type === "string" && typeof value !== "string") {
        errors.push(`El parámetro '${key}' debe ser de tipo string, recibido: ${typeof value}.`);
      } else if (propSchema.type === "number" && typeof value !== "number") {
        errors.push(`El parámetro '${key}' debe ser de tipo number, recibido: ${typeof value}.`);
      }

      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push(`Valor inválido '${value}' para '${key}'. Valores permitidos: ${propSchema.enum.join(", ")}.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
