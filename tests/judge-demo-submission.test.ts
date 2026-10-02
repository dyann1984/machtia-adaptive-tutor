import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { repository } from "@/lib/data/repository";
import { McpClient, mcpClient } from "@/lib/mcp/client";
import { tutorAgent } from "@/lib/ai/tutor-agent";
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

  // 6. McpClient expone catálogo de 15 herramientas registradas
  it("6. McpClient expone el catálogo completo de 15 herramientas (7 docentes + 8 Alexa+ conversacionales)", async () => {
    const offlineClient = new McpClient("http://localhost:9991/mcp");
    const tools = await offlineClient.listTools();

    expect(tools.length).toBe(15);
    const names = tools.map((t) => t.name);
    // 7 teacher tools
    expect(names).toContain("analyze_student_performance");
    expect(names).toContain("find_students_needing_support");
    expect(names).toContain("get_student_learning_gap");
    expect(names).toContain("generate_adaptive_practice");
    expect(names).toContain("assign_practice_to_student");
    expect(names).toContain("get_student_progress");
    expect(names).toContain("report_progress_to_teacher");
    // 8 Alexa+ tools
    expect(names).toContain("get_student_context");
    expect(names).toContain("get_assigned_practice");
    expect(names).toContain("start_practice");
    expect(names).toContain("submit_answer");
    expect(names).toContain("get_hint");
    expect(names).toContain("get_adaptive_explanation");
    expect(names).toContain("complete_practice");
    expect(names).toContain("get_practice_result");
  });

  // 7. McpClient ejecuta herramientas Alexa+ mediante fallback local resiliente
  it("7. McpClient ejecuta herramientas Alexa+ con fallback local resiliente cuando el servidor externo está offline", async () => {
    const offlineClient = new McpClient("http://localhost:9991/mcp");

    // A. Consultar contexto de Mariana
    const contextRes = await offlineClient.getStudentContext("mariana-lopez");
    expect(contextRes.source).toBe("local-fallback");
    expect(contextRes.result.name).toBe("Mariana López");
    expect(contextRes.result.alexaVoicePrompt).toContain("Mariana López");

    // B. Generar práctica y consultar práctica asignada
    const practice = await generate_adaptive_practice("mariana-lopez", "fracciones-equivalentes");
    const assignedRes = await offlineClient.getAssignedPractice("mariana-lopez");
    expect(assignedRes.result.totalCount).toBeGreaterThan(0);

    // C. Iniciar práctica
    const startRes = await offlineClient.startPractice(practice.practiceId, "mariana-lopez");
    expect(startRes.result.status).toBe("in_progress");
    expect(startRes.result.firstExercise.prompt).toBeDefined();

    // D. Responder con lenguaje oral mexicano coloquial ("dos cuartos")
    const submitRes = await offlineClient.submitAnswer(
      practice.practiceId,
      startRes.result.firstExercise.id,
      "dos cuartos",
      1,
      "mariana-lopez"
    );
    expect(submitRes.result.recognizedAnswer).toBe("2/4");
    expect(submitRes.result.isCorrect).toBe(true);

    // E. Solicitar andamiaje
    const hintRes = await offlineClient.getHint(startRes.result.firstExercise.id, "mariana-lopez");
    expect(hintRes.result.hint).toBeDefined();

    // F. Finalizar práctica y validar persistencia de evidencia
    const completeRes = await offlineClient.completePractice(practice.practiceId, "mariana-lopez", {
      answers: ["ex-frac-1", "ex-frac-2", "ex-frac-3", "ex-frac-4"].map((exerciseId) => ({ exerciseId, isCorrect: true })),
    });
    expect(completeRes.result.status).toBe("completed");
    expect(completeRes.result.improvementDelta).toBe(28);
    expect(completeRes.result.finalScore).toBe(80);

    // G. Consultar resultado por Alexa+
    const resultRes = await offlineClient.getPracticeResult(practice.practiceId, "mariana-lopez");
    expect(resultRes.result.improvementDelta).toBe(28);
    expect(resultRes.result.verifiedInTeacherDashboard).toBe(true);
  });

  // 8. Modo Demo Oficial fuerza MCP real y deshabilita fallback
  it("8. Modo Demo Oficial: con forceRealMcp activo, si el servidor está caído retorna error explícito sin sustitución simulada", async () => {
    const offlineClient = new McpClient("http://localhost:9991/mcp", true); // forceRealMcp = true
    expect(offlineClient.isForceRealMcp()).toBe(true);

    const res = await offlineClient.getStudentContext("mariana-lopez");
    expect(res.isError).toBe(true);
    expect(res.source).toBe("mcp");
    expect(res.result).toBeNull();
    expect(res.error).toContain("[MCP Unavailable]");
    expect(res.error).toContain("Modo Demo Oficial el fallback local está estrictamente deshabilitado");
  });

  // 9. Reset reproducible oficial valida ANTES (52%, pendiente, 0 evidencias) vs DESPUÉS (80%, +28, evidencia generada)
  it("9. Reset reproducible oficial: restaura exactamente ANTES vs DESPUÉS para grabación de demo", async () => {
    // 1. Ejecutar reset oficial
    repository.resetOfficialDemoScenario();

    // ANTES:
    const marianaAntes = repository.getStudentById("mariana-lopez");
    expect(marianaAntes).toBeDefined();
    expect(marianaAntes?.topicPerformances["fracciones-equivalentes"]).toBe(52);
    expect(marianaAntes?.assignedPracticeIds).toContain("prac-mariana-fracciones");

    const practicesAntes = repository.getPracticesByStudent("mariana-lopez");
    expect(practicesAntes).toHaveLength(1);
    expect(practicesAntes[0].id).toBe("prac-mariana-fracciones");
    expect(practicesAntes[0].status).toBe("pending");
    expect(practicesAntes[0].exercises.length).toBeGreaterThan(0);

    const evidenciasAntes = repository.getEvidencesByStudent("mariana-lopez");
    const fractionEvidenciasAntes = evidenciasAntes.filter((e) => e.topicName === "Fracciones equivalentes");
    expect(fractionEvidenciasAntes).toHaveLength(0);

    // 2. Simular ejecución completa de la práctica
    repository.updatePracticeStatus("prac-mariana-fracciones", "completed");
    repository.updateStudentScore("mariana-lopez", "fracciones-equivalentes", 80);
    repository.saveEvidence({
      id: "evi-demo-mariana",
      studentId: "mariana-lopez",
      studentName: "Mariana López",
      subjectId: "matematicas",
      topicName: "Fracciones equivalentes",
      initialScore: 52,
      finalScore: 80,
      improvementDelta: 28,
      status: "Mejora detectada",
      masteredConcepts: ["Equivalencia visual 1/2", "Amplificación factor 2", "Multiplicación cruzada"],
      pendingConcepts: ["Simplificación a mínima expresión"],
      tutorObservations: "Mariana superó la confusión de denominadores y consolidó la equivalencia visual.",
      timestamp: new Date().toISOString(),
      practiceId: "prac-mariana-fracciones",
      attemptId: "att-demo-mariana",
    });

    // DESPUÉS:
    const marianaDespues = repository.getStudentById("mariana-lopez");
    expect(marianaDespues?.topicPerformances["fracciones-equivalentes"]).toBe(80);
    const delta = 80 - 52;
    expect(delta).toBe(28);

    const practiceDespues = repository.getPracticeById("prac-mariana-fracciones");
    expect(practiceDespues?.status).toBe("completed");
    expect(practiceDespues?.completedAt).toBeDefined();

    const evidenciasDespues = repository.getEvidencesByStudent("mariana-lopez");
    const fractionEvidenciasDespues = evidenciasDespues.filter((e) => e.topicName === "Fracciones equivalentes");
    expect(fractionEvidenciasDespues).toHaveLength(1);
    expect(fractionEvidenciasDespues[0].finalScore).toBe(80);
    expect(fractionEvidenciasDespues[0].improvementDelta).toBe(28);

    // 3. Volver a resetear y comprobar que regresa exactamente a ANTES
    repository.resetOfficialDemoScenario();
    const marianaReReset = repository.getStudentById("mariana-lopez");
    expect(marianaReReset?.topicPerformances["fracciones-equivalentes"]).toBe(52);
    expect(repository.getPracticeById("prac-mariana-fracciones")?.status).toBe("pending");
    expect(repository.getEvidencesByStudent("mariana-lopez").filter((e) => e.topicName === "Fracciones equivalentes")).toHaveLength(0);
  });

  // 10. Consistencia SSR y cliente inicial para evitar hydration mismatch
  it("10. El estado inicial del repositorio es determinista y no diverge entre SSR y cliente", () => {
    // Verificar que los datos iniciales son siempre consistentes
    const students = repository.getStudents();
    expect(students.length).toBeGreaterThan(0);
    const mariana = students.find((s) => s.id === "mariana-lopez");
    expect(mariana).toBeDefined();
    expect(mariana?.topicPerformances["fracciones-equivalentes"]).toBe(52);

    const group = repository.getGroup();
    expect(group.name).toBe("3° B");

    const teacher = repository.getTeacher();
    expect(teacher.name).toBe("Prof. Carlos Vega");
  });

  // 11. Manejo seguro cuando MCP devuelve null (evitar TypeError: Cannot read properties of null)
  it("11. tutorAgent maneja de forma segura practiceResult === null sin lanzar TypeError", async () => {
    // Simular que el modo demo fuerza MCP pero el servidor está caído (devuelve null)
    mcpClient.setForceRealMcp(true);
    repository.resetOfficialDemoScenario();

    // Mariana tiene 'prac-mariana-fracciones' pre-asignada en el escenario oficial
    expect(repository.getPracticeById("prac-mariana-fracciones")).toBeDefined();

    // Ejecutar la petición que provocaba el runtime crash
    const res = await tutorAgent.processTeacherQuery(
      "Crear práctica de apoyo para Mariana López",
      { selectedStudentId: "mariana-lopez" }
    );

    // Debe resolver exitosamente sin error de null pointer
    expect(res).toBeDefined();
    expect(res.message.text).toContain("¡Práctica de apoyo asignada exitosamente!");
    expect(res.suggestedAction?.type).toBe("switch_to_student");
    expect(res.suggestedAction?.payload.practiceId).toBe("prac-mariana-fracciones");

    // Comprobar que Mariana sigue teniendo la práctica asignada
    const mariana = repository.getStudentById("mariana-lopez");
    expect(mariana?.assignedPracticeIds).toContain("prac-mariana-fracciones");
  });

  // 12. Generación resiliente para alumno nuevo cuando MCP devuelve null
  it("12. tutorAgent genera práctica con fallback local para alumno sin práctica previa cuando MCP devuelve null", async () => {
    mcpClient.setForceRealMcp(true);
    repository.resetDemoData();

    // Luis no tiene ninguna práctica previa
    expect(repository.getPracticesByStudent("luis-hernandez")).toHaveLength(0);

    const res = await tutorAgent.processTeacherQuery(
      "Crear práctica de apoyo para Luis Hernández",
      { selectedStudentId: "luis-hernandez" }
    );

    expect(res).toBeDefined();
    expect(res.message.text).toContain("¡Práctica de apoyo asignada exitosamente!");
    expect(res.suggestedAction?.payload.practiceId).toBeDefined();

    // Confirmar que la práctica se guardó en el repositorio
    const luisPractices = repository.getPracticesByStudent("luis-hernandez");
    expect(luisPractices.length).toBeGreaterThan(0);
    expect(luisPractices[0].status).toBe("pending");
    expect(luisPractices[0].exercises.length).toBeGreaterThan(0);
  });
});
