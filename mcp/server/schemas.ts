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

  get_student_context: {
    name: "get_student_context",
    description: "Obtiene el perfil escolar, grupo, brechas pedagógicas activas y estado de prácticas del alumno autenticado.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: {
          type: "string",
          description: "ID único del alumno a consultar.",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar para validación de aislamiento.",
        },
        requesterId: {
          type: "string",
          description: "ID del usuario que realiza la petición.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante para control de acceso RBAC.",
        },
      },
      required: ["studentId"],
      additionalProperties: false,
    },
  },

  get_assigned_practice: {
    name: "get_assigned_practice",
    description: "Recupera las prácticas pedagógicas asignadas legítimamente al alumno por su docente.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: {
          type: "string",
          description: "ID único del alumno.",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "assigned"],
          description: "Filtro opcional por estado de la práctica.",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar.",
        },
        requesterId: {
          type: "string",
          description: "ID del solicitante.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante.",
        },
      },
      required: ["studentId"],
      additionalProperties: false,
    },
  },

  start_practice: {
    name: "start_practice",
    description: "Inicia la sesión de práctica pedagógica, cambia su estado a 'in_progress' y entrega el primer reactivo con prompt oral para Alexa+.",
    inputSchema: {
      type: "object",
      properties: {
        practiceId: {
          type: "string",
          description: "ID de la práctica a iniciar.",
        },
        studentId: {
          type: "string",
          description: "ID del alumno que realiza la práctica.",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar.",
        },
        requesterId: {
          type: "string",
          description: "ID del solicitante.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante.",
        },
      },
      required: ["practiceId", "studentId"],
      additionalProperties: false,
    },
  },

  submit_answer: {
    name: "submit_answer",
    description: "Evalúa en tiempo real la respuesta oral o escrita del alumno utilizando normalizador lingüístico y andamiaje progresivo.",
    inputSchema: {
      type: "object",
      properties: {
        practiceId: {
          type: "string",
          description: "ID de la práctica activa.",
        },
        exerciseId: {
          type: "string",
          description: "ID del reactivo evaluado.",
        },
        studentAnswer: {
          type: "string",
          description: "Respuesta del alumno (ej. 'dos cuartos', '2/4', 'opción A').",
        },
        attemptNumber: {
          type: "number",
          description: "Número de intento (1, 2 o 3).",
        },
        studentId: {
          type: "string",
          description: "ID del alumno que responde.",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar.",
        },
        requesterId: {
          type: "string",
          description: "ID del solicitante.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante.",
        },
      },
      required: ["practiceId", "exerciseId", "studentAnswer", "attemptNumber", "studentId"],
      additionalProperties: false,
    },
  },

  get_hint: {
    name: "get_hint",
    description: "Proporciona una pista formativa de Nivel 1 orientadora sin revelar prematuramente la solución.",
    inputSchema: {
      type: "object",
      properties: {
        exerciseId: {
          type: "string",
          description: "ID del ejercicio para el cual se solicita pista.",
        },
        studentId: {
          type: "string",
          description: "ID del alumno solicitante.",
        },
        practiceId: {
          type: "string",
          description: "ID de la práctica asociada (opcional).",
        },
        attemptNumber: {
          type: "number",
          description: "Número de intento en curso (opcional).",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar.",
        },
        requesterId: {
          type: "string",
          description: "ID del solicitante.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante.",
        },
      },
      required: ["exerciseId", "studentId"],
      additionalProperties: false,
    },
  },

  get_adaptive_explanation: {
    name: "get_adaptive_explanation",
    description: "Genera una explicación adaptativa con analogía cotidiana (Nivel 2) o andamiaje paso a paso (Nivel 3).",
    inputSchema: {
      type: "object",
      properties: {
        exerciseId: {
          type: "string",
          description: "ID del reactivo a explicar.",
        },
        studentId: {
          type: "string",
          description: "ID del alumno destinatario.",
        },
        practiceId: {
          type: "string",
          description: "ID de la práctica asociada (opcional).",
        },
        level: {
          type: "string",
          enum: ["analogy", "step_by_step"],
          description: "Nivel de andamiaje: 'analogy' (Nivel 2) o 'step_by_step' (Nivel 3).",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar.",
        },
        requesterId: {
          type: "string",
          description: "ID del solicitante.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante.",
        },
      },
      required: ["exerciseId", "studentId"],
      additionalProperties: false,
    },
  },

  complete_practice: {
    name: "complete_practice",
    description: "Finaliza la práctica, calcula la calificación real obtenida, actualiza el perfil del estudiante y genera LearningEvidence auditable.",
    inputSchema: {
      type: "object",
      properties: {
        practiceId: {
          type: "string",
          description: "ID de la práctica completada.",
        },
        studentId: {
          type: "string",
          description: "ID del alumno que concluyó la práctica.",
        },
        answers: {
          type: "array",
          description: "Historial opcional de reactivos resueltos por el alumno.",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar.",
        },
        requesterId: {
          type: "string",
          description: "ID del solicitante.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante.",
        },
      },
      required: ["practiceId", "studentId"],
      additionalProperties: false,
    },
  },

  get_practice_result: {
    name: "get_practice_result",
    description: "Permite a Alexa+ o al docente consultar los resultados definitivos, delta de mejora (+28 puntos) y evidencia persistida.",
    inputSchema: {
      type: "object",
      properties: {
        practiceId: {
          type: "string",
          description: "ID de la práctica a consultar.",
        },
        studentId: {
          type: "string",
          description: "ID del alumno evaluado.",
        },
        tenantId: {
          type: "string",
          description: "ID del tenant escolar.",
        },
        requesterId: {
          type: "string",
          description: "ID del solicitante.",
        },
        requesterRole: {
          type: "string",
          enum: ["student", "teacher", "system"],
          description: "Rol del solicitante.",
        },
      },
      required: ["practiceId", "studentId"],
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
      } else if (propSchema.type === "array" && !Array.isArray(value)) {
        errors.push(`El parámetro '${key}' debe ser de tipo array, recibido: ${typeof value}.`);
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
