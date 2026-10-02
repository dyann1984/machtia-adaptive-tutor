/**
 * MACHTIA Adaptive Tutor - Alexa+ & MCP Real End-to-End Flow Tests
 * Tests the complete conversational journey of 8 MCP tools over real Streamable HTTP transport,
 * verifying authentication, tenant isolation, IDOR prevention, oral normalization,
 * progressive scaffolding, authentic score calculation, and teacher evidence traceability.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
import { startMcpServer, stopMcpServer } from "@/mcp/server/index";
import { repository } from "@/lib/data/repository";
import { generate_adaptive_practice, assign_practice_to_student, report_progress_to_teacher } from "@/lib/tools/tutor-tools";

const ALEXA_TEST_PORT = 3199;
const ALEXA_MCP_URL = `http://localhost:${ALEXA_TEST_PORT}/mcp`;

describe("MACHTIA Adaptive Tutor - Alexa+ Real MCP Streamable HTTP Journey", () => {
  let server: http.Server;
  let testPracticeId: string;

  beforeAll(async () => {
    server = await startMcpServer(ALEXA_TEST_PORT);
  });

  afterAll(async () => {
    await stopMcpServer(server);
  });

  beforeEach(async () => {
    repository.resetToInitialState();

    // Setup authentic teacher assignment for Mariana
    const practiceGen = await generate_adaptive_practice("mariana-lopez", "fracciones-equivalentes");
    testPracticeId = practiceGen.practiceId;
    await assign_practice_to_student(testPracticeId, "mariana-lopez");
  });

  // Helper to make standard MCP JSON-RPC 2.0 requests over Streamable HTTP
  async function callMcpRpc(method: string, params: Record<string, any> = {}) {
    const res = await fetch(ALEXA_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `rpc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        method,
        params,
      }),
    });

    const data = await res.json();
    return { status: res.status, data };
  }

  // Helper to execute tools via tools/call over Streamable HTTP
  async function callMcpTool(name: string, args: Record<string, any> = {}) {
    const res = await callMcpRpc("tools/call", { name, arguments: args });
    return res;
  }

  // -------------------------------------------------------------------------
  // 1. PROTOCOL COMPLIANCE & STREAMABLE HTTP
  // -------------------------------------------------------------------------
  it("1. Protocolo MCP 2025-11-25: Handshake initialize y registro de 15 herramientas reales", async () => {
    const { status, data } = await callMcpRpc("initialize", {
      protocolVersion: "2025-11-25",
      clientInfo: { name: "alexa-plus-simulator", version: "2.0.0" },
    });

    expect(status).toBe(200);
    expect(data.result.protocolVersion).toBe("2025-11-25");
    expect(data.result.serverInfo.name).toBe("machtia-tutor-mcp-server");

    // tools/list must return 15 tools (7 teacher tools + 8 Alexa+ conversational tools)
    const listRes = await callMcpRpc("tools/list");
    expect(listRes.status).toBe(200);
    const tools = listRes.data.result.tools;
    expect(tools.length).toBe(15);

    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain("get_student_context");
    expect(toolNames).toContain("get_assigned_practice");
    expect(toolNames).toContain("start_practice");
    expect(toolNames).toContain("submit_answer");
    expect(toolNames).toContain("get_hint");
    expect(toolNames).toContain("get_adaptive_explanation");
    expect(toolNames).toContain("complete_practice");
    expect(toolNames).toContain("get_practice_result");
  });

  // -------------------------------------------------------------------------
  // 2. GET_STUDENT_CONTEXT
  // -------------------------------------------------------------------------
  it("2. get_student_context: Alexa+ recupera el contexto autorizado de Mariana (3° B, 52% rezago)", async () => {
    const { data } = await callMcpTool("get_student_context", {
      studentId: "mariana-lopez",
      tenantId: "escuela-benito-juarez",
      requesterId: "mariana-lopez",
      requesterRole: "student",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.studentId).toBe("mariana-lopez");
    expect(res.name).toBe("Mariana López");
    expect(res.groupName).toBe("3° B");
    expect(res.topicPerformances["fracciones-equivalentes"]).toBe(52);
    expect(res.learningGaps.length).toBeGreaterThan(0);
    expect(res.alexaVoicePrompt).toContain("Mariana López");
  });

  // -------------------------------------------------------------------------
  // 3. SEGURIDAD: AISLAMIENTO MULTI-TENANT
  // -------------------------------------------------------------------------
  it("3. Seguridad Multi-Tenant: Rechaza peticiones de tenants no autorizados (TENANT_MISMATCH)", async () => {
    const { data } = await callMcpTool("get_student_context", {
      studentId: "mariana-lopez",
      tenantId: "escuela-ajena-99", // Tenant ajeno
    });

    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent.message).toContain("Violación de aislamiento multi-tenant");
  });

  // -------------------------------------------------------------------------
  // 4. SEGURIDAD: PREVENCIÓN DE IDOR (INSECURE DIRECT OBJECT REFERENCE)
  // -------------------------------------------------------------------------
  it("4. Seguridad IDOR: Un alumno no puede consultar ni modificar la sesión de otro alumno", async () => {
    // Luis intenta acceder a los datos de Mariana haciéndose pasar por estudiante
    const { data } = await callMcpTool("get_student_context", {
      studentId: "mariana-lopez",
      requesterId: "luis-hernandez", // ID del atacante
      requesterRole: "student",
    });

    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent.message).toContain("Violación IDOR detectada");
  });

  // -------------------------------------------------------------------------
  // 5. GET_ASSIGNED_PRACTICE
  // -------------------------------------------------------------------------
  it("5. get_assigned_practice: Alexa+ recupera la práctica asignada por el docente", async () => {
    const { data } = await callMcpTool("get_assigned_practice", {
      studentId: "mariana-lopez",
      status: "pending",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.totalCount).toBeGreaterThan(0);
    const practice = res.practices.find((p: any) => p.practiceId === testPracticeId);
    expect(practice).toBeDefined();
    expect(practice.topicName).toBe("Fracciones equivalentes");
    expect(practice.exerciseCount).toBe(5);
  });

  // -------------------------------------------------------------------------
  // 6. START_PRACTICE
  // -------------------------------------------------------------------------
  it("6. start_practice: Inicia la práctica y entrega el primer ejercicio con prompt conversacional", async () => {
    const { data } = await callMcpTool("start_practice", {
      practiceId: testPracticeId,
      studentId: "mariana-lopez",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.practiceId).toBe(testPracticeId);
    expect(res.status).toBe("in_progress");
    expect(res.currentExerciseIndex).toBe(0);
    expect(res.firstExercise.id).toBe("ex-frac-1");
    expect(res.alexaSpeechPrompt).toContain("Comenzamos tu práctica");

    // Repo status must be in_progress
    const repoPractice = repository.getPracticeById(testPracticeId);
    expect(repoPractice?.status).toBe("in_progress");
  });

  // -------------------------------------------------------------------------
  // 7. SUBMIT_ANSWER CON NORMALIZACIÓN ORAL (RESPUESTA CORRECTA)
  // -------------------------------------------------------------------------
  it("7. submit_answer: Normaliza expresión oral ('dos cuartos' -> '2/4') y evalúa acierto", async () => {
    const { data } = await callMcpTool("submit_answer", {
      practiceId: testPracticeId,
      exerciseId: "ex-frac-1",
      studentAnswer: "dos cuartos", // Expresión oral que diría el alumno a Alexa
      attemptNumber: 1,
      studentId: "mariana-lopez",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.recognizedAnswer).toBe("2/4");
    expect(res.isCorrect).toBe(true);
    expect(res.feedback).toContain("2/4");
    expect(res.alexaSpeechFeedback).toContain("¡Muy bien");
  });

  // -------------------------------------------------------------------------
  // 8. SUBMIT_ANSWER CON ERROR (INTENTO 1) -> PISTA PROGRESSIVA
  // -------------------------------------------------------------------------
  it("8. submit_answer: Ante primer error devuelve pista formativa sin revelar la respuesta", async () => {
    const { data } = await callMcpTool("submit_answer", {
      practiceId: testPracticeId,
      exerciseId: "ex-frac-2",
      studentAnswer: "1 parte (1/6)", // Error intencional
      attemptNumber: 1,
      studentId: "mariana-lopez",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.isCorrect).toBe(false);
    expect(res.supportLevel).toBe("hint");
    expect(res.allowRetry).toBe(true);
    expect(res.hint).toBeDefined();
    // Do NOT reveal the solution
    expect(res.hint).not.toContain("2 partes (2/6)");
    expect(res.alexaSpeechFeedback).toContain("Casi lo tienes");
  });

  // -------------------------------------------------------------------------
  // 9. GET_HINT EXPLICITA
  // -------------------------------------------------------------------------
  it("9. get_hint: Herramienta dedicada entrega pista sin revelar la solución", async () => {
    const { data } = await callMcpTool("get_hint", {
      exerciseId: "ex-frac-2",
      studentId: "mariana-lopez",
      practiceId: testPracticeId,
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.supportLevel).toBe("hint");
    expect(res.hint).toBeDefined();
    expect(res.alexaSpeechHint).toContain("Aquí tienes una pista de tu Tutor");
  });

  // -------------------------------------------------------------------------
  // 10. SUBMIT_ANSWER CON ERROR (INTENTO 2) -> EXPLICACIÓN ADAPTATIVA
  // -------------------------------------------------------------------------
  it("10. submit_answer: Ante segundo error entrega explicación alternativa con analogía", async () => {
    const { data } = await callMcpTool("submit_answer", {
      practiceId: testPracticeId,
      exerciseId: "ex-frac-2",
      studentAnswer: "tres partes", // Segundo error oral
      attemptNumber: 2,
      studentId: "mariana-lopez",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.isCorrect).toBe(false);
    expect(res.supportLevel).toBe("alternative_explanation");
    expect(res.alternativeExplanation).toBeDefined();
    expect(res.alexaSpeechFeedback).toContain("Te lo explico con otro ejemplo");
  });

  // -------------------------------------------------------------------------
  // 11. GET_ADAPTIVE_EXPLANATION EXPLICITA
  // -------------------------------------------------------------------------
  it("11. get_adaptive_explanation: Entrega analogía cotidiana y desglose paso a paso", async () => {
    const { data } = await callMcpTool("get_adaptive_explanation", {
      exerciseId: "ex-frac-2",
      studentId: "mariana-lopez",
      practiceId: testPracticeId,
      level: "analogy",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.supportLevel).toBe("analogy");
    expect(res.explanation.toLowerCase()).toContain("trozo");
    expect(res.alexaSpeechExplanation).toContain("Te lo explico paso a paso");
  });

  // -------------------------------------------------------------------------
  // 12. NORMALIZADOR ORAL: ALUMNO CORRIGE RESPUESTA
  // -------------------------------------------------------------------------
  it("12. submit_answer: Alumna corrige verbalmente diciendo 'dos partes' -> normaliza a '2 partes (2/6)'", async () => {
    const { data } = await callMcpTool("submit_answer", {
      practiceId: testPracticeId,
      exerciseId: "ex-frac-2",
      studentAnswer: "comer dos partes", // Frase conversacional oral
      attemptNumber: 3,
      studentId: "mariana-lopez",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.recognizedAnswer).toBe("2 partes (2/6)");
    expect(res.isCorrect).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 13. SEGURIDAD IDOR EN SUBMIT_ANSWER
  // -------------------------------------------------------------------------
  it("13. Seguridad IDOR en submit_answer: Un estudiante no puede responder por otro", async () => {
    const { data } = await callMcpTool("submit_answer", {
      practiceId: testPracticeId,
      exerciseId: "ex-frac-1",
      studentAnswer: "2/4",
      attemptNumber: 1,
      studentId: "mariana-lopez",
      requesterId: "luis-hernandez", // ID no coincide con Mariana
      requesterRole: "student",
    });

    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent.message).toContain("Violación IDOR detectada");
  });

  // -------------------------------------------------------------------------
  // 14. COMPLETE_PRACTICE & PERSISTENCIA REAL DE LEARNINGEVIDENCE
  // -------------------------------------------------------------------------
  it("14. complete_practice: Calcula puntaje auténtico (80%), mejora (+28 puntos) y persiste LearningEvidence", async () => {
    const { data } = await callMcpTool("complete_practice", {
      practiceId: testPracticeId,
      studentId: "mariana-lopez",
      answers: [
        { exerciseId: "ex-frac-1", isCorrect: true, studentAnswer: "2/4" },
        { exerciseId: "ex-frac-2", isCorrect: true, studentAnswer: "2 partes (2/6)" },
        { exerciseId: "ex-frac-3", isCorrect: true, studentAnswer: "Sí" },
        { exerciseId: "ex-frac-4", isCorrect: true, studentAnswer: "3x8 = 24" },
        { exerciseId: "ex-frac-5", isCorrect: false, studentAnswer: "3/3" }, // 4 de 5 correctos = 80%
      ],
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.status).toBe("completed");
    expect(res.finalScore).toBe(80);
    expect(res.initialScore).toBe(52);
    expect(res.improvementDelta).toBe(28);
    expect(res.masteredConcepts.length).toBeGreaterThan(0);
    expect(res.evidenceId).toBeDefined();
    expect(res.alexaCelebrationSpeech).toContain("80%");

    // Verify Repository persistence
    const savedPractice = repository.getPracticeById(testPracticeId);
    expect(savedPractice?.status).toBe("completed");

    const student = repository.getStudentById("mariana-lopez");
    expect(student?.topicPerformances["fracciones-equivalentes"]).toBe(80);

    const evidences = repository.getEvidencesByStudent("mariana-lopez");
    const matchingEv = evidences.find((e) => e.practiceId === testPracticeId);
    expect(matchingEv).toBeDefined();
    expect(matchingEv?.finalScore).toBe(80);
    expect(matchingEv?.improvementDelta).toBe(28);
  });

  // -------------------------------------------------------------------------
  // 15. GET_PRACTICE_RESULT
  // -------------------------------------------------------------------------
  it("15. get_practice_result: Consulta el resultado consolidado y la evidencia generada", async () => {
    // Complete practice to generate evidence for this practiceId
    await callMcpTool("complete_practice", {
      practiceId: testPracticeId,
      studentId: "mariana-lopez",
      answers: ["ex-frac-1", "ex-frac-2", "ex-frac-3", "ex-frac-4"].map((exerciseId) => ({ exerciseId, isCorrect: true })),
    });

    const { data } = await callMcpTool("get_practice_result", {
      practiceId: testPracticeId,
      studentId: "mariana-lopez",
    });

    expect(data.result.isError).toBe(false);
    const res = data.result.structuredContent;

    expect(res.finalScore).toBe(80);
    expect(res.improvementDelta).toBe(28);
    expect(res.evidenceStatus).toBe("Mejora detectada");
    expect(res.verifiedInTeacherDashboard).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 16. CONSULTA POSTERIOR POR EL DOCENTE
  // -------------------------------------------------------------------------
  it("16. Trazabilidad Docente: El profesor Carlos consulta y comprueba el progreso de Mariana (+28 puntos)", async () => {
    // Complete practice to record evidence in repository
    await callMcpTool("complete_practice", {
      practiceId: testPracticeId,
      studentId: "mariana-lopez",
      answers: ["ex-frac-1", "ex-frac-2", "ex-frac-3", "ex-frac-4"].map((exerciseId) => ({ exerciseId, isCorrect: true })),
    });

    const teacherReport = await report_progress_to_teacher("mariana-lopez", "matematicas");

    expect(teacherReport.studentName).toBe("Mariana López");
    expect(teacherReport.scoreBefore).toBe(52);
    expect(teacherReport.scoreAfter).toBe(80);
    expect(teacherReport.improvementDelta).toBe(28);
    expect(teacherReport.status).toBe("Mejora detectada");
    expect(teacherReport.reportText).toContain("Mariana López mostró una mejora notable");
  });
});
