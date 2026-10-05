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
  mode: "demo" | "amazon" | "nebius";
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
  name = "MockAIProvider (Modo Demo Offline / Hackathon)";
  mode = "demo" as const;

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
 * AmazonProvider / AmazonAIProvider
 * Integration adapter prepared for Amazon Bedrock / Alexa+ LLM
 * Configurable via environment variables without hardcoded credentials.
 */
export class AmazonProvider implements AIProvider {
  name = "Amazon Bedrock / Alexa+ Provider";
  mode = "amazon" as const;
  private region: string;
  private accessKeyId?: string;
  private secretAccessKey?: string;
  private bedrockApiKey?: string;
  private modelId: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.bedrockApiKey = process.env.AWS_BEDROCK_API_KEY;
    this.modelId = process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0";
  }

  isAvailable(): boolean {
    return false;
  }

  async decideToolCall(userQuery: string, context?: Record<string, any>) {
    if (!this.isAvailable()) {
      // Graceful fallback to MockAIProvider when credentials are not yet configured
      return new MockAIProvider().decideToolCall(userQuery, context);
    }
    // Future AWS Bedrock Converse API invocation using AWS SDK v3
    return new MockAIProvider().decideToolCall(userQuery, context);
  }

  async generateResponse(prompt: string, context?: Record<string, any>): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      throw new Error("Este proveedor externo no está implementado. Usa el modo demo determinista.");
    }
    return {
      content: `[Amazon Bedrock (${this.modelId})]: ${prompt}`,
      thought: `Adaptador Bedrock no implementado; no se ejecutó inferencia.`,
    };
  }
}

// Backward-compatible alias
export const AmazonAIProvider = AmazonProvider;

/**
 * NebiusAIProvider
 * Integration adapter prepared for Nebius AI Studio & NVIDIA NIM
 */
export class NebiusAIProvider implements AIProvider {
  name = "Nebius AI Studio / NVIDIA NIM Provider";
  mode = "nebius" as const;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.NEBIUS_API_KEY;
  }

  isAvailable(): boolean {
    return false;
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
      thought: `Adaptador Nebius no implementado; no se ejecutó inferencia.`,
    };
  }
}

/**
 * Provider factory based on AI_PROVIDER environment variable or available credentials.
 */
export function getAIProvider(): AIProvider {
  const requestedProvider = (process.env.AI_PROVIDER || "").toLowerCase().trim();

  if (requestedProvider === "amazon") {
    return new AmazonProvider();
  }
  if (requestedProvider === "nebius") {
    return new NebiusAIProvider();
  }
  if (requestedProvider === "mock" || requestedProvider === "demo") {
    return new MockAIProvider();
  }

  // Auto-detection fallback
  if (process.env.AWS_BEDROCK_API_KEY || process.env.AWS_ACCESS_KEY_ID) {
    return new AmazonProvider();
  }
  if (process.env.NEBIUS_API_KEY) {
    return new NebiusAIProvider();
  }

  return new MockAIProvider();
}
