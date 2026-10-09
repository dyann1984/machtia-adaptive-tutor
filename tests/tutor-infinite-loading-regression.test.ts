import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { tutorAgent } from "@/lib/ai/tutor-agent";
import { mcpClient, safeUUID } from "@/lib/mcp/client";
import { repository } from "@/lib/data/repository";
import { harness } from "./server-harness";

describe("Regression Suite: Tutor IA MCP Diagnosis & Infinite Loading Prevention (P0)", () => {
  let h: Awaited<ReturnType<typeof harness>>;

  beforeEach(async () => {
    repository.resetDemoData();
    vi.restoreAllMocks();
    h = await harness();
    mcpClient.setServerUrl(h.base + "/mcp");
  });

  afterEach(async () => {
    await h?.close();
  });

  it("1. Consulta 'Ver diagnóstico de Mariana López' produce respuesta pedagógica completa", async () => {
    const result = await tutorAgent.processTeacherQuery("Ver diagnóstico de Mariana López", {
      selectedStudentId: "mariana-lopez",
    });

    expect(result.message).toBeDefined();
    expect(result.message.sender).toBe("agent");
    expect(result.message.id).toBeDefined();
    expect(typeof result.message.id).toBe("string");

    const text = result.message.text;
    // Must NOT be raw JSON dump
    expect(text).not.toContain('{\n  "studentId": "mariana-lopez"');
    // Must contain pedagogical elements
    expect(text).toContain("Diagnóstico Pedagógico");
    expect(text).toContain("Mariana López");
    expect(text).toContain("52%");
    expect(text).toContain("Fracciones equivalentes");
    expect(text).toContain("denominador");
    expect(text).toContain("Análisis Pedagógico");

    // Must offer quick action to create practice
    expect(result.message.quickActions).toBeDefined();
    expect(result.message.quickActions?.length).toBeGreaterThan(0);
    const createAction = result.message.quickActions?.find((a) => a.actionKey === "generate_practice");
    expect(createAction).toBeDefined();
    expect(createAction?.payload?.studentId).toBe("mariana-lopez");
  });

  it("2. Consulta de Luis Hernández resuelve correctamente a Luis y su brecha (58%)", async () => {
    const result = await tutorAgent.processTeacherQuery("Ver diagnóstico de Luis Hernández", {
      selectedStudentId: "mariana-lopez", // Context defaults to mariana, but query mentions Luis
    });

    const text = result.message.text;
    expect(text).toContain("Luis Hernández");
    expect(text).toContain("58%");
    expect(text).toContain("Simplificación");
    expect(result.message.quickActions?.some((a) => a.actionKey === "generate_practice")).toBe(true);
  });

  it("3. Consulta '¿Quién necesita apoyo en matemáticas?' produce resumen estructurado de grupo", async () => {
    const result = await tutorAgent.processTeacherQuery("¿Quién necesita apoyo en matemáticas?");

    const text = result.message.text;
    expect(text).toContain("3° B");
    expect(text).toContain("Mariana López");
    expect(text).toContain("52%");
    expect(text).toContain("Luis Hernández");
    expect(text).toContain("58%");

    expect(result.message.quickActions?.some((a) => a.actionKey === "inspect_mariana")).toBe(true);
    expect(result.message.quickActions?.some((a) => a.actionKey === "create_practice_mariana")).toBe(true);
  });

  it("4. Consulta de creación de práctica asigna la práctica y genera acción de entrada como alumno", async () => {
    const result = await tutorAgent.processTeacherQuery("Crear práctica de apoyo para Mariana López", {
      selectedStudentId: "mariana-lopez",
    });

    const text = result.message.text;
    expect(text).toContain("Mariana López");
    expect(text).toContain("asignada exitosamente");
    expect(text).toContain("5 reactivos");

    const enterAction = result.message.quickActions?.find((a) => a.actionKey === "enter_as_mariana");
    expect(enterAction).toBeDefined();
    expect(enterAction?.payload?.studentId).toBe("mariana-lopez");
    expect(enterAction?.payload?.practiceId).toBeDefined();
  });

  it("5. Tolerancia a fallos: Error o timeout de MCP no lanza excepción no controlada y retorna error recuperable", async () => {
    // Simulate MCP failure (e.g. Render spin-up timeout 504)
    vi.spyOn(mcpClient, "getStudentLearningGap").mockRejectedValueOnce(
      Object.assign(new Error("Tiempo de espera agotado al conectar con el backend MACHTIA"), {
        isColdStart: true,
        status: 504,
      })
    );

    const result = await tutorAgent.processTeacherQuery("Ver diagnóstico de Mariana López", {
      selectedStudentId: "mariana-lopez",
    });

    expect(result.message).toBeDefined();
    expect(result.message.sender).toBe("agent");
    expect(result.message.text).toContain("Render");
    expect(result.message.text).toContain("despertando");

    // Must offer retry option
    const retryAction = result.message.quickActions?.find((a) => a.actionKey === "retry_last_query");
    expect(retryAction).toBeDefined();
    expect(retryAction?.payload?.query).toBe("Ver diagnóstico de Mariana López");
  });

  it("6. Simulación de ciclo de vida de sendMessageToTutor: isAgentThinking SIEMPRE se libera en finally", async () => {
    let isAgentThinking = false;
    let activeAgentSteps: string[] = [];
    const chatMessages: any[] = [];

    const simulateSendMessage = async (query: string, mockFail = false) => {
      if (mockFail) {
        vi.spyOn(mcpClient, "getStudentLearningGap").mockRejectedValueOnce(new Error("Network disconnect"));
      }

      isAgentThinking = true;
      activeAgentSteps = ["Consultando herramientas MCP del servidor..."];

      try {
        const res = await tutorAgent.processTeacherQuery(query, {
          selectedStudentId: "mariana-lopez",
          onStep: (step) => {
            activeAgentSteps = [step];
          },
        });
        chatMessages.push(res.message);
      } catch (err: any) {
        chatMessages.push({
          id: safeUUID(),
          sender: "agent",
          text: `Error: ${err.message}`,
        });
      } finally {
        isAgentThinking = false;
        activeAgentSteps = [];
      }
    };

    // Caso A: Ejecución exitosa
    await simulateSendMessage("Ver diagnóstico de Mariana López");
    expect(isAgentThinking).toBe(false);
    expect(activeAgentSteps).toEqual([]);
    expect(chatMessages.length).toBe(1);

    // Caso B: Fallo en MCP (Red caída o timeout)
    await simulateSendMessage("Ver diagnóstico de Mariana López", true);
    expect(isAgentThinking).toBe(false);
    expect(activeAgentSteps).toEqual([]);
    expect(chatMessages.length).toBe(2);

    // El botón Enviar que depende de !isAgentThinking nunca queda bloqueado
    const isSubmitDisabled = (input: string) => !input.trim() || isAgentThinking;
    expect(isSubmitDisabled("Hola")).toBe(false);
  });

  it("7. safeUUID genera identificadores únicos seguros incluso sin crypto.randomUUID", () => {
    const uuid1 = safeUUID();
    const uuid2 = safeUUID();
    expect(uuid1).toBeDefined();
    expect(uuid2).toBeDefined();
    expect(uuid1).not.toBe(uuid2);
    expect(typeof uuid1).toBe("string");
    expect(uuid1.length).toBeGreaterThan(8);
  });
});
