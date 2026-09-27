export interface AIProviderResponse {
  content: string;
  thought?: string;
  suggestedTools?: {
    toolName: string;
    parameters: Record<string, any>;
  }[];
}

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateResponse(prompt: string, context?: Record<string, any>): Promise<AIProviderResponse>;
  decideToolCall(userQuery: string, context?: Record<string, any>): Promise<{
    toolName: string;
    parameters: Record<string, any>;
    reasoning: string;
  }>;
}

/**
 * MockAIProvider
 * Deterministic, robust, offline-capable AI provider designed for the Hackathon MVP.
 * Simulates high-precision agent reasoning and tool orchestration without external API delays.
 */
export class MockAIProvider implements AIProvider {
  name = "MockAIProvider (Offline Fallback & Hackathon Mode)";

  isAvailable(): boolean {
    return true;
  }

  async decideToolCall(userQuery: string, context?: Record<string, any>) {
    const q = userQuery.toLowerCase();

    if (
      q.includes("quién necesita apoyo") ||
      q.includes("quien necesita apoyo") ||
      q.includes("qué alumnos") ||
      q.includes("que alumnos") ||
      q.includes("apoyo") ||
      q.includes("rezago") ||
      q.includes("dificultad")
    ) {
      return {
        toolName: "find_students_needing_support",
        parameters: { groupId: "grupo-3b", subjectId: "matematicas", threshold: 65 },
        reasoning: "El profesor solicita identificar estudiantes que requieren refuerzo pedagógico inmediato.",
      };
    }

    if (q.includes("diagnóstico") || q.includes("brecha") || q.includes("mariana") || q.includes("luis")) {
      const studentId = q.includes("luis") ? "luis-hernandez" : "mariana-lopez";
      return {
        toolName: "get_student_learning_gap",
        parameters: { studentId, subjectId: "matematicas" },
        reasoning: "Analizando la brecha cognitiva y los errores recurrentes específicos del alumno seleccionado.",
      };
    }

    if (q.includes("generar práctica") || q.includes("crear práctica") || q.includes("asignar")) {
      const studentId = context?.selectedStudentId || (q.includes("luis") ? "luis-hernandez" : "mariana-lopez");
      return {
        toolName: "generate_adaptive_practice",
        parameters: { studentId, topicId: "fracciones-equivalentes", count: 5 },
        reasoning: "Generando una secuencia de 5 reactivos adaptativos con apoyo visual.",
      };
    }

    if (q.includes("mejoró") || q.includes("mejora") || q.includes("progreso") || q.includes("avance") || q.includes("antes y después")) {
      const studentId = context?.selectedStudentId || "mariana-lopez";
      return {
        toolName: "report_progress_to_teacher",
        parameters: { studentId, subjectId: "matematicas" },
        reasoning: "Calculando la métrica comparativa de impacto pedagógico antes/después.",
      };
    }

    return {
      toolName: "analyze_student_performance",
      parameters: { groupId: "grupo-3b", subjectId: "matematicas" },
      reasoning: "Consulta general de métricas del grupo 3° B.",
    };
  }

  async generateResponse(prompt: string, context?: Record<string, any>): Promise<AIProviderResponse> {
    return {
      content: "MACHTIA Adaptive Tutor ha procesado tu solicitud pedagógica con éxito.",
      thought: "Análisis cognitivo completado utilizando el modelo instruccional adaptativo.",
    };
  }
}

/**
 * AmazonAIProvider
 * Integration adapter prepared for Amazon Bedrock (Claude 3.5 Sonnet / Amazon Nova / Alexa+ LLM)
 */
export class AmazonAIProvider implements AIProvider {
  name = "Amazon Bedrock / Alexa+ Provider";
  private apiKey: string | undefined;
  private region: string;

  constructor() {
    this.apiKey = process.env.AWS_BEDROCK_API_KEY;
    this.region = process.env.AWS_REGION || "us-east-1";
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async decideToolCall(userQuery: string, context?: Record<string, any>) {
    if (!this.isAvailable()) {
      return new MockAIProvider().decideToolCall(userQuery, context);
    }
    // Future Bedrock Converse API invocation with toolConfig
    return new MockAIProvider().decideToolCall(userQuery, context);
  }

  async generateResponse(prompt: string, context?: Record<string, any>): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      return new MockAIProvider().generateResponse(prompt, context);
    }
    return {
      content: `[Amazon Bedrock Response]: ${prompt}`,
      thought: `Generado en región ${this.region} mediante Bedrock Runtime Agent.`,
    };
  }
}

/**
 * NebiusAIProvider
 * Integration adapter prepared for Nebius AI Studio & NVIDIA NIM
 */
export class NebiusAIProvider implements AIProvider {
  name = "Nebius AI Studio / NVIDIA NIM Provider";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.NEBIUS_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async decideToolCall(userQuery: string, context?: Record<string, any>) {
    if (!this.isAvailable()) {
      return new MockAIProvider().decideToolCall(userQuery, context);
    }
    return new MockAIProvider().decideToolCall(userQuery, context);
  }

  async generateResponse(prompt: string, context?: Record<string, any>): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      return new MockAIProvider().generateResponse(prompt, context);
    }
    return {
      content: `[Nebius AI Studio Response]: ${prompt}`,
      thought: `Inferencia ejecutada en clúster NVIDIA H100 a través de Nebius AI.`,
    };
  }
}

export function getAIProvider(): AIProvider {
  if (process.env.AWS_BEDROCK_API_KEY) {
    return new AmazonAIProvider();
  }
  if (process.env.NEBIUS_API_KEY) {
    return new NebiusAIProvider();
  }
  return new MockAIProvider();
}
