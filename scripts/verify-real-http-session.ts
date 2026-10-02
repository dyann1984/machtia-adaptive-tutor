/**
 * MACHTIA Adaptive Tutor - Real HTTP Session & Security Audit Script
 * Executes an authentic end-to-end HTTP session against the live MCP server on port 3150.
 * Verifies protocol version 2025-11-25, Streamable HTTP transport, oral normalization,
 * LearningEvidence persistence in repository, and the 8-point security/IDOR matrix.
 */

import fs from "node:fs";
import path from "node:path";
import { startMcpServer, stopMcpServer } from "../mcp/server/index";
import { repository } from "../lib/data/repository";
import { generate_adaptive_practice } from "../lib/tools/tutor-tools";

const PORT = 3150;
const MCP_URL = `http://localhost:${PORT}/mcp`;
const HEALTH_URL = `http://localhost:${PORT}/health`;

interface StepEvidence {
  step: string;
  method: string;
  httpStatus: number;
  requestHeaders: Record<string, string>;
  requestPayload: any;
  responsePayload: any;
  timestamp: string;
}

const auditEvidence: {
  auditTimestamp: string;
  protocolVersion: string;
  serverInfo: any;
  e2eSession: StepEvidence[];
  evidenceVerification: any;
  securityMatrix: Array<{
    testCase: string;
    description: string;
    expectedCode: string | number;
    actualCode: string | number;
    passed: boolean;
    evidence: any;
  }>;
} = {
  auditTimestamp: new Date().toISOString(),
  protocolVersion: "2025-11-25",
  serverInfo: null,
  e2eSession: [],
  evidenceVerification: null,
  securityMatrix: [],
};

async function postRpc(payload: any): Promise<{ status: number; body: any }> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { status: res.status, body: data };
}

async function runAudit() {
  console.log("==================================================================");
  console.log("🔍 INICIANDO AUDITORÍA TÉCNICA MCP Y CERTIFICACIÓN AMAZON ALEXA+");
  console.log("==================================================================");

  // 1. Reset repository
  repository.resetToInitialState();
  console.log("✅ Repositorio restablecido a estado limpio de prueba.");

  // 2. Start MCP server on port 3150
  const server = await startMcpServer(PORT, "127.0.0.1");
  console.log(`✅ Servidor MCP iniciado en http://127.0.0.1:${PORT}`);

  try {
    // 3. Health check
    const healthRes = await fetch(HEALTH_URL);
    const healthData = await healthRes.json();
    auditEvidence.serverInfo = healthData;
    console.log("✅ Endpoint /health verificado:", healthData);

    // ==================================================================
    // 4. SESIÓN COMPLETA E2E POR HTTP REAL
    // ==================================================================
    console.log("\n--- EJECUTANDO FLUJO E2E REAL POR POST /mcp (JSON-RPC 2.0) ---");

    // Paso 1: initialize
    const initReq = {
      jsonrpc: "2.0",
      id: "req-init-1",
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        clientInfo: { name: "amazon-developer-auditor", version: "1.0.0" },
      },
    };
    const initRes = await postRpc(initReq);
    auditEvidence.e2eSession.push({
      step: "1. initialize",
      method: "initialize",
      httpStatus: initRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: initReq,
      responsePayload: initRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 1: initialize -> Protocol:", initRes.body.result?.protocolVersion);

    // Paso 2: tools/list
    const listReq = {
      jsonrpc: "2.0",
      id: "req-list-2",
      method: "tools/list",
    };
    const listRes = await postRpc(listReq);
    const tools = listRes.body.result?.tools || [];
    auditEvidence.e2eSession.push({
      step: "2. tools/list",
      method: "tools/list",
      httpStatus: listRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: listReq,
      responsePayload: { toolsCount: tools.length, toolNames: tools.map((t: any) => t.name) },
      timestamp: new Date().toISOString(),
    });
    console.log(`Paso 2: tools/list -> ${tools.length} herramientas registradas.`);

    // Paso 3: get_student_context
    const contextReq = {
      jsonrpc: "2.0",
      id: "req-ctx-3",
      method: "tools/call",
      params: {
        name: "get_student_context",
        arguments: {
          studentId: "mariana-lopez",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
          requesterRole: "student",
        },
      },
    };
    const contextRes = await postRpc(contextReq);
    auditEvidence.e2eSession.push({
      step: "3. get_student_context",
      method: "tools/call",
      httpStatus: contextRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: contextReq,
      responsePayload: contextRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 3: get_student_context -> Alumna:", contextRes.body.result?.structuredContent?.name);

    // Generar práctica pedagógica asignada para Mariana en el dominio
    const createdPractice = await generate_adaptive_practice("mariana-lopez", "fracciones-equivalentes");
    const practiceId = createdPractice.practiceId;
    console.log(`Práctica creada en repositorio: ${practiceId}`);

    // Paso 4: get_assigned_practice
    const assignedReq = {
      jsonrpc: "2.0",
      id: "req-assigned-4",
      method: "tools/call",
      params: {
        name: "get_assigned_practice",
        arguments: {
          studentId: "mariana-lopez",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
          requesterRole: "student",
        },
      },
    };
    const assignedRes = await postRpc(assignedReq);
    auditEvidence.e2eSession.push({
      step: "4. get_assigned_practice",
      method: "tools/call",
      httpStatus: assignedRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: assignedReq,
      responsePayload: assignedRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 4: get_assigned_practice -> Total:", assignedRes.body.result?.structuredContent?.totalCount);

    // Paso 5: start_practice
    const startReq = {
      jsonrpc: "2.0",
      id: "req-start-5",
      method: "tools/call",
      params: {
        name: "start_practice",
        arguments: {
          practiceId: practiceId,
          studentId: "mariana-lopez",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
        },
      },
    };
    const startRes = await postRpc(startReq);
    const firstExId = startRes.body.result?.structuredContent?.firstExercise?.id || "ex-frac-1";
    auditEvidence.e2eSession.push({
      step: "5. start_practice",
      method: "tools/call",
      httpStatus: startRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: startReq,
      responsePayload: startRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 5: start_practice -> Estado:", startRes.body.result?.structuredContent?.status);

    // Paso 6: submit_answer incorrecta (lenguaje oral: "un tercio")
    const submitWrongReq = {
      jsonrpc: "2.0",
      id: "req-submit-wrong-6",
      method: "tools/call",
      params: {
        name: "submit_answer",
        arguments: {
          practiceId: practiceId,
          exerciseId: firstExId,
          studentAnswer: "un tercio",
          attemptNumber: 1,
          studentId: "mariana-lopez",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
        },
      },
    };
    const submitWrongRes = await postRpc(submitWrongReq);
    auditEvidence.e2eSession.push({
      step: "6. submit_answer (incorrecta)",
      method: "tools/call",
      httpStatus: submitWrongRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: submitWrongReq,
      responsePayload: submitWrongRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 6: submit_answer (incorrecta) -> isCorrect:", submitWrongRes.body.result?.structuredContent?.isCorrect);

    // Paso 7: get_hint
    const hintReq = {
      jsonrpc: "2.0",
      id: "req-hint-7",
      method: "tools/call",
      params: {
        name: "get_hint",
        arguments: {
          exerciseId: firstExId,
          studentId: "mariana-lopez",
          practiceId: practiceId,
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
        },
      },
    };
    const hintRes = await postRpc(hintReq);
    auditEvidence.e2eSession.push({
      step: "7. get_hint",
      method: "tools/call",
      httpStatus: hintRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: hintReq,
      responsePayload: hintRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 7: get_hint -> Pista:", hintRes.body.result?.structuredContent?.hint ? "Entregada" : "Fallo");

    // Paso 8: get_adaptive_explanation (step_by_step)
    const explainReq = {
      jsonrpc: "2.0",
      id: "req-explain-8",
      method: "tools/call",
      params: {
        name: "get_adaptive_explanation",
        arguments: {
          exerciseId: firstExId,
          studentId: "mariana-lopez",
          practiceId: practiceId,
          level: "step_by_step",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
        },
      },
    };
    const explainRes = await postRpc(explainReq);
    auditEvidence.e2eSession.push({
      step: "8. get_adaptive_explanation",
      method: "tools/call",
      httpStatus: explainRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: explainReq,
      responsePayload: explainRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 8: get_adaptive_explanation -> Explicación:", explainRes.body.result?.structuredContent?.explanation ? "Entregada" : "Fallo");

    // Paso 9: submit_answer correcta (lenguaje oral coloquial: "dos cuartos")
    const submitRightReq = {
      jsonrpc: "2.0",
      id: "req-submit-right-9",
      method: "tools/call",
      params: {
        name: "submit_answer",
        arguments: {
          practiceId: practiceId,
          exerciseId: firstExId,
          studentAnswer: "dos cuartos",
          attemptNumber: 2,
          studentId: "mariana-lopez",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
        },
      },
    };
    const submitRightRes = await postRpc(submitRightReq);
    auditEvidence.e2eSession.push({
      step: "9. submit_answer (correcta con normalización)",
      method: "tools/call",
      httpStatus: submitRightRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: submitRightReq,
      responsePayload: submitRightRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 9: submit_answer (correcta) -> recognizedAnswer:", submitRightRes.body.result?.structuredContent?.recognizedAnswer);

    // Paso 10: complete_practice
    const completeReq = {
      jsonrpc: "2.0",
      id: "req-complete-10",
      method: "tools/call",
      params: {
        name: "complete_practice",
        arguments: {
          practiceId: practiceId,
          studentId: "mariana-lopez",
          answers: [
            { exerciseId: "ex-frac-1", isCorrect: true, studentAnswer: "2/4" },
            { exerciseId: "ex-frac-2", isCorrect: true, studentAnswer: "2 partes" },
            { exerciseId: "ex-frac-3", isCorrect: true, studentAnswer: "multiplicar por 2" },
            { exerciseId: "ex-frac-4", isCorrect: true, studentAnswer: "3x8 = 24" },
            { exerciseId: "ex-frac-5", isCorrect: false, studentAnswer: "2/4" },
          ],
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
        },
      },
    };
    const completeRes = await postRpc(completeReq);
    const evidenceId = completeRes.body.result?.structuredContent?.evidenceId;
    auditEvidence.e2eSession.push({
      step: "10. complete_practice",
      method: "tools/call",
      httpStatus: completeRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: completeReq,
      responsePayload: completeRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 10: complete_practice -> Score:", completeRes.body.result?.structuredContent?.finalScore, "Delta:", completeRes.body.result?.structuredContent?.improvementDelta);

    // Paso 11: get_practice_result
    const resultReq = {
      jsonrpc: "2.0",
      id: "req-result-11",
      method: "tools/call",
      params: {
        name: "get_practice_result",
        arguments: {
          practiceId: practiceId,
          studentId: "mariana-lopez",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez",
        },
      },
    };
    const resultRes = await postRpc(resultReq);
    auditEvidence.e2eSession.push({
      step: "11. get_practice_result",
      method: "tools/call",
      httpStatus: resultRes.status,
      requestHeaders: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
      requestPayload: resultReq,
      responsePayload: resultRes.body,
      timestamp: new Date().toISOString(),
    });
    console.log("Paso 11: get_practice_result -> Verified in Dashboard:", resultRes.body.result?.structuredContent?.verifiedInTeacherDashboard);

    // ==================================================================
    // 5. CONFIRMACIÓN DE PERSISTENCIA REAL DE LearningEvidence
    // ==================================================================
    console.log("\n--- VERIFICACIÓN EN REPOSITORIO DE DATOS MACHTIA ---");
    const allEvidences = repository.getEvidences();
    const createdEvidence = allEvidences.find((e) => e.practiceId === practiceId || e.id === evidenceId);
    const updatedStudent = repository.getStudentById("mariana-lopez");
    const updatedPractice = repository.getPracticeById(practiceId);

    const persistenceCheck = {
      evidenceExists: Boolean(createdEvidence),
      evidenceId: createdEvidence?.id,
      studentName: createdEvidence?.studentName,
      topicName: createdEvidence?.topicName,
      initialScore: createdEvidence?.initialScore,
      finalScore: createdEvidence?.finalScore,
      improvementDelta: createdEvidence?.improvementDelta,
      studentScoreInRepo: updatedStudent?.topicPerformances["fracciones-equivalentes"],
      practiceStatusInRepo: updatedPractice?.status,
    };
    auditEvidence.evidenceVerification = persistenceCheck;
    console.log("Verificación de persistencia:", persistenceCheck);

    // ==================================================================
    // 6. MATRIZ DE PRUEBAS DE SEGURIDAD E IDOR POR HTTP REAL
    // ==================================================================
    console.log("\n--- EJECUTANDO MATRIZ DE SEGURIDAD Y DEFENSA IDOR ---");

    // Seguridad 1: Tenant correcto
    const sec1Req = {
      jsonrpc: "2.0",
      id: "sec-1",
      method: "tools/call",
      params: {
        name: "get_student_context",
        arguments: { studentId: "mariana-lopez", tenantId: "escuela-benito-juarez" },
      },
    };
    const sec1Res = await postRpc(sec1Req);
    const sec1Passed = sec1Res.status === 200 && sec1Res.body.result?.isError === false;
    auditEvidence.securityMatrix.push({
      testCase: "1. Tenant Correcto",
      description: "Acceso con tenant institucional válido 'escuela-benito-juarez'.",
      expectedCode: "SUCCESS_200",
      actualCode: sec1Passed ? "SUCCESS_200" : "ERROR",
      passed: sec1Passed,
      evidence: sec1Res.body.result?.structuredContent?.name,
    });
    console.log("Seguridad 1 (Tenant correcto):", sec1Passed ? "PASS" : "FAIL");

    // Seguridad 2: Tenant incorrecto
    const sec2Req = {
      jsonrpc: "2.0",
      id: "sec-2",
      method: "tools/call",
      params: {
        name: "get_student_context",
        arguments: { studentId: "mariana-lopez", tenantId: "escuela-rival-ajena" },
      },
    };
    const sec2Res = await postRpc(sec2Req);
    const sec2ErrorText = sec2Res.body.result?.content?.[0]?.text || "";
    const sec2Struct = sec2Res.body.result?.structuredContent;
    const sec2Passed =
      sec2Res.body.result?.isError === true &&
      (sec2Struct?.code === "TENANT_MISMATCH" || sec2ErrorText.includes("multi-tenant"));
    auditEvidence.securityMatrix.push({
      testCase: "2. Tenant Incorrecto",
      description: "Intento de acceso con tenant ajeno 'escuela-rival-ajena'. Debe rechazarse con TENANT_MISMATCH (403).",
      expectedCode: "TENANT_MISMATCH_403",
      actualCode: sec2Passed ? "TENANT_MISMATCH_403" : "FAIL_NOT_REJECTED",
      passed: sec2Passed,
      evidence: sec2ErrorText,
    });
    console.log("Seguridad 2 (Tenant incorrecto bloqueado):", sec2Passed ? "PASS" : "FAIL");

    // Seguridad 3: Alumno autorizado
    const sec3Req = {
      jsonrpc: "2.0",
      id: "sec-3",
      method: "tools/call",
      params: {
        name: "get_student_context",
        arguments: {
          studentId: "mariana-lopez",
          requesterId: "mariana-lopez",
          requesterRole: "student",
          tenantId: "escuela-benito-juarez",
        },
      },
    };
    const sec3Res = await postRpc(sec3Req);
    const sec3Passed = sec3Res.status === 200 && sec3Res.body.result?.isError === false;
    auditEvidence.securityMatrix.push({
      testCase: "3. Alumno Autorizado",
      description: "Mariana López consulta sus propios datos con requesterRole 'student'.",
      expectedCode: "SUCCESS_200",
      actualCode: sec3Passed ? "SUCCESS_200" : "ERROR",
      passed: sec3Passed,
      evidence: sec3Res.body.result?.structuredContent?.studentId,
    });
    console.log("Seguridad 3 (Alumno autorizado):", sec3Passed ? "PASS" : "FAIL");

    // Seguridad 4: Alumno intentando acceder a otro alumno (IDOR)
    const sec4Req = {
      jsonrpc: "2.0",
      id: "sec-4",
      method: "tools/call",
      params: {
        name: "get_student_context",
        arguments: {
          studentId: "mariana-lopez",
          requesterId: "juan-perez",
          requesterRole: "student",
          tenantId: "escuela-benito-juarez",
        },
      },
    };
    const sec4Res = await postRpc(sec4Req);
    const sec4ErrorText = sec4Res.body.result?.content?.[0]?.text || "";
    const sec4Struct = sec4Res.body.result?.structuredContent;
    const sec4Passed =
      sec4Res.body.result?.isError === true &&
      (sec4Struct?.code === "IDOR_FORBIDDEN" || sec4ErrorText.includes("IDOR"));
    auditEvidence.securityMatrix.push({
      testCase: "4. Alumno Intentando Acceder a Otro Alumno (IDOR)",
      description: "Juan Pérez intenta ver el expediente de Mariana López. Debe ser bloqueado por IDOR_FORBIDDEN (403).",
      expectedCode: "IDOR_FORBIDDEN_403",
      actualCode: sec4Passed ? "IDOR_FORBIDDEN_403" : "FAIL_IDOR_ALLOWED",
      passed: sec4Passed,
      evidence: sec4ErrorText,
    });
    console.log("Seguridad 4 (IDOR bloqueado):", sec4Passed ? "PASS" : "FAIL");

    // Seguridad 5: Práctica de otro alumno
    const sec5Req = {
      jsonrpc: "2.0",
      id: "sec-5",
      method: "tools/call",
      params: {
        name: "start_practice",
        arguments: {
          practiceId: practiceId, // Pertenece a Mariana
          studentId: "luis-hernandez", // Luis intenta iniciar la práctica de Mariana
          tenantId: "escuela-benito-juarez",
          requesterId: "luis-hernandez",
        },
      },
    };
    const sec5Res = await postRpc(sec5Req);
    const sec5ErrorText = sec5Res.body.result?.content?.[0]?.text || "";
    const sec5Struct = sec5Res.body.result?.structuredContent;
    const sec5Passed =
      sec5Res.body.result?.isError === true &&
      (sec5Struct?.code === "PRACTICE_STUDENT_MISMATCH" || sec5ErrorText.includes("Inconsistencia"));
    auditEvidence.securityMatrix.push({
      testCase: "5. Práctica de Otro Alumno",
      description: "Luis Hernández intenta iniciar la práctica creada para Mariana. Debe rechazarse por discordancia (400).",
      expectedCode: "PRACTICE_STUDENT_MISMATCH_400",
      actualCode: sec5Passed ? "PRACTICE_STUDENT_MISMATCH_400" : "FAIL_MISMATCH_ALLOWED",
      passed: sec5Passed,
      evidence: sec5ErrorText,
    });
    console.log("Seguridad 5 (Práctica ajena bloqueada):", sec5Passed ? "PASS" : "FAIL");

    // Seguridad 6: Evidencia de otro tenant
    const sec6Req = {
      jsonrpc: "2.0",
      id: "sec-6",
      method: "tools/call",
      params: {
        name: "get_practice_result",
        arguments: {
          practiceId: practiceId,
          studentId: "mariana-lopez",
          tenantId: "escuela-ajena-foranea",
        },
      },
    };
    const sec6Res = await postRpc(sec6Req);
    const sec6ErrorText = sec6Res.body.result?.content?.[0]?.text || "";
    const sec6Struct = sec6Res.body.result?.structuredContent;
    const sec6Passed =
      sec6Res.body.result?.isError === true &&
      (sec6Struct?.code === "TENANT_MISMATCH" || sec6ErrorText.includes("multi-tenant"));
    auditEvidence.securityMatrix.push({
      testCase: "6. Evidencia de Otro Tenant",
      description: "Consulta de resultados con tenant ajeno. Debe bloquearse con TENANT_MISMATCH (403).",
      expectedCode: "TENANT_MISMATCH_403",
      actualCode: sec6Passed ? "TENANT_MISMATCH_403" : "FAIL_TENANT_LEAK",
      passed: sec6Passed,
      evidence: sec6ErrorText,
    });
    console.log("Seguridad 6 (Evidencia de otro tenant bloqueada):", sec6Passed ? "PASS" : "FAIL");

    // Seguridad 7: requesterRole manipulado
    const sec7Req = {
      jsonrpc: "2.0",
      id: "sec-7",
      method: "tools/call",
      params: {
        name: "get_student_context",
        arguments: {
          studentId: "mariana-lopez",
          tenantId: "escuela-benito-juarez",
          requesterId: "alumno-falso",
          requesterRole: "student",
        },
      },
    };
    const sec7Res = await postRpc(sec7Req);
    const sec7ErrorText = sec7Res.body.result?.content?.[0]?.text || "";
    const sec7Struct = sec7Res.body.result?.structuredContent;
    const sec7Passed =
      sec7Res.body.result?.isError === true &&
      (sec7Struct?.code === "IDOR_FORBIDDEN" || sec7ErrorText.includes("IDOR"));
    auditEvidence.securityMatrix.push({
      testCase: "7. requesterRole Manipulado",
      description: "Invocador con requesterId falso intentando suplantar a Mariana con rol de alumno.",
      expectedCode: "IDOR_FORBIDDEN_403",
      actualCode: sec7Passed ? "IDOR_FORBIDDEN_403" : "FAIL_IMPERSONATION_ALLOWED",
      passed: sec7Passed,
      evidence: sec7ErrorText,
    });
    console.log("Seguridad 7 (Suplantación bloqueada):", sec7Passed ? "PASS" : "FAIL");

    // Seguridad 8: IDs inexistentes
    const sec8Req = {
      jsonrpc: "2.0",
      id: "sec-8",
      method: "tools/call",
      params: {
        name: "get_student_context",
        arguments: {
          studentId: "alumno-no-existe-9999",
          tenantId: "escuela-benito-juarez",
        },
      },
    };
    const sec8Res = await postRpc(sec8Req);
    const sec8ErrorText = sec8Res.body.result?.content?.[0]?.text || "";
    const sec8Struct = sec8Res.body.result?.structuredContent;
    const sec8Passed =
      sec8Res.body.result?.isError === true &&
      (sec8Struct?.code === "STUDENT_NOT_FOUND" || sec8ErrorText.includes("no encontrado"));
    auditEvidence.securityMatrix.push({
      testCase: "8. IDs Inexistentes",
      description: "Consulta de alumno no registrado. Debe responder con STUDENT_NOT_FOUND de forma sanitizada.",
      expectedCode: "STUDENT_NOT_FOUND",
      actualCode: sec8Passed ? "STUDENT_NOT_FOUND" : "FAIL",
      passed: sec8Passed,
      evidence: sec8ErrorText,
    });
    console.log("Seguridad 8 (ID inexistente sanitizado):", sec8Passed ? "PASS" : "FAIL");

    // 7. Write evidence output
    const evidenceDir = path.join("docs", "evidence");
    fs.mkdirSync(evidenceDir, { recursive: true });
    const evidenceFilePath = path.join(evidenceDir, "real-http-session-evidence.json");
    fs.writeFileSync(evidenceFilePath, JSON.stringify(auditEvidence, null, 2), "utf8");
    console.log(`\n🎉 Evidencia sanitizada guardada exitosamente en ${evidenceFilePath}`);

  } finally {
    await stopMcpServer(server);
    console.log("🛑 Servidor MCP detenido limpiamente.");
  }
}

runAudit().catch((err) => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
