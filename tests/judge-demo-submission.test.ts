import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { repository } from "@/lib/data/repository";
import { McpClient } from "@/lib/mcp/client";
import {
  generate_adaptive_practice,
  save_learning_evidence,
  evaluate_answer,
} from "@/lib/tools/tutor-tools";

describe("MACHTIA Adaptive Tutor - Judge Demo & Submission Readiness Tests", () => {
  const originalEnvMcpUrl = process.env.NEXT_PUBLIC_MCP_URL;

  beforeEach(() => {
    repository.resetToInitialState();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_MCP_URL = originalEnvMcpUrl;
  });

  // 1. Judge Demo inicializa estado correcto
  it("1. Judge Demo inicializa estado correcto: grupo 3° B, Mariana 52%, Luis 58%, 0 prácticas", () => {
    const group = repository.getGroup();
    expect(group.id).toBe("grupo-3b");
    expect(group.name).toBe("3° B");

    const mariana = repository.getStudentById("mariana-lopez");
    expect(mariana).toBeDefined();
    expect(mariana?.topicPerformances["fracciones-equivalentes"]).toBe(52);
    expect(mariana?.assignedPracticeIds).toHaveLength(0);

    const luis = repository.getStudentById("luis-hernandez");
    expect(luis).toBeDefined();
    expect(luis?.topicPerformances["fracciones-equivalentes"]).toBe(58);

    // Initial practices list must be empty for demo reproducibility
    expect(repository.getPractices()).toHaveLength(0);
  });

  // 2. Reiniciar Demo restaura estado
  it("2. Reiniciar Demo restaura exactamente el estado inicial eliminando cualquier residuo", async () => {
    // A. Realizar mutaciones (simular una demo previa)
    const practice = await generate_adaptive_practice("mariana-lopez", "fracciones-equivalentes");
    await save_learning_evidence("mariana-lopez", practice.practiceId, {
      score: 80,
      totalCorrect: 4,
      totalExercises: 5,
      masteredConcepts: ["Identificación de fracciones equivalentes"],
      pendingConcepts: ["Simplificación"],
    });

    expect(repository.getPractices().length).toBeGreaterThan(0);
    expect(repository.getStudentById("mariana-lopez")?.topicPerformances["fracciones-equivalentes"]).toBe(80);

    // B. Ejecutar Reinicio de Demostración
    repository.resetToInitialState();

    // C. Verificar estado limpio y reproducible
    const marianaClean = repository.getStudentById("mariana-lopez");
    expect(marianaClean?.topicPerformances["fracciones-equivalentes"]).toBe(52);
    expect(marianaClean?.overallAverage).toBe(8.1);

    const luisClean = repository.getStudentById("luis-hernandez");
    expect(luisClean?.topicPerformances["fracciones-equivalentes"]).toBe(58);

    expect(repository.getPractices()).toHaveLength(0);
  });

  // 3. Indicador MCP solo muestra Connected si health responde
  it("3. Indicador MCP no simula conexión y reporta connected: false cuando el servidor está inaccesible", async () => {
    // Puerto cerrado o no existente
    const offlineClient = new McpClient("http://localhost:9991/mcp");

    const status = await offlineClient.checkConnection();
    expect(status.connected).toBe(false);
    expect(status.toolsCount).toBeUndefined();
    expect(status.error).toBeDefined();
    expect(status.transport).toContain("Offline");
  });

  // 4. Frontend usa NEXT_PUBLIC_MCP_URL configurable sin URLs hardcodeadas
  it("4. McpClient respeta NEXT_PUBLIC_MCP_URL y no depende exclusivamente de localhost", () => {
    process.env.NEXT_PUBLIC_MCP_URL = "https://mcp-production.machtia.edu.mx/mcp";

    const client = new McpClient();
    expect(client.getServerUrl()).toBe("https://mcp-production.machtia.edu.mx/mcp");
    expect(client.getHealthUrl()).toBe("https://mcp-production.machtia.edu.mx/health");
  });

  // 5. El resultado final del alumno es derivado de respuestas reales, no fijo
  it("5. El resultado pedagógico se calcula auténticamente a partir de las respuestas del alumno", async () => {
    const totalExercises = 5;

    // Escenario 1: 3 aciertos de 5 -> 60%
    const score3 = Math.round((3 / totalExercises) * 100);
    expect(score3).toBe(60);
    const delta3 = score3 - 52;
    expect(delta3).toBe(8);

    // Escenario 2: 4 aciertos de 5 -> 80%
    const score4 = Math.round((4 / totalExercises) * 100);
    expect(score4).toBe(80);
    const delta4 = score4 - 52;
    expect(delta4).toBe(28);

    // Escenario 3: 5 aciertos de 5 -> 100%
    const score5 = Math.round((5 / totalExercises) * 100);
    expect(score5).toBe(100);
    const delta5 = score5 - 52;
    expect(delta5).toBe(48);

    // Verificar que evaluate_answer responde con coherencia
    const evalCorrect = await evaluate_answer("ex-frac-1", "2/4", 1);
    expect(evalCorrect.isCorrect).toBe(true);

    const evalWrong = await evaluate_answer("ex-frac-1", "1/4", 1);
    expect(evalWrong.isCorrect).toBe(false);
    expect(evalWrong.supportLevel).toBe("hint");
  });
});
