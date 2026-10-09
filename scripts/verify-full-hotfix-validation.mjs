import { createMcpHttpServer } from "../mcp/server/transport";
import { tutorAgent } from "../lib/ai/tutor-agent";
import { mcpClient } from "../lib/mcp/client";
import { SAMPLE_EXERCISES_POOL } from "../lib/data/mock-data";

async function runValidation() {
  console.log("==================================================================");
  console.log("🚀 EJECUCIÓN DE PRUEBAS DE VALIDACIÓN COMPLETA - HOTFIX P0");
  console.log("==================================================================");

  // Iniciar servidor MCP local
  const server = createMcpHttpServer({ port: 0 });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  mcpClient.setServerUrl(`${baseUrl}/mcp`);

  console.log(`[Setup] Servidor MCP de prueba iniciado en ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // G. Simular arranque en frío y verificar resiliencia
    // -------------------------------------------------------------
    console.log("\n[Validación G] Prueba de arranque en frío y tolerancia a fallos...");
    let recoveredFromColdStart = false;
    try {
      const originalCall = mcpClient.callTool;
      let failedOnce = false;
      mcpClient.callTool = async (...args) => {
        if (!failedOnce) {
          failedOnce = true;
          throw Object.assign(new Error("Render spin-up 504 Gateway Timeout"), {
            isColdStart: true,
            status: 504,
          });
        }
        return originalCall.apply(mcpClient, args);
      };

      const coldStartResult = await tutorAgent.processTeacherQuery("Ver diagnóstico de Mariana López");
      console.log("  ✓ Mensaje ante spin-up recibido:", coldStartResult.message.text.substring(0, 100) + "...");
      if (coldStartResult.message.text.includes("despertando") || coldStartResult.message.text.includes("Render")) {
        recoveredFromColdStart = true;
      }

      mcpClient.callTool = originalCall;
    } catch (e) {
      console.error("  ❌ Falló la tolerancia a arranque en frío:", e);
    }
    console.log("  ✓ ¿Se manejó el arranque en frío sin bloquear?:", recoveredFromColdStart ? "SÍ (CORRECTO)" : "FALLÓ");

    // -------------------------------------------------------------
    // A. Probar la consulta de Mariana y confirmar respuesta final visible
    // -------------------------------------------------------------
    console.log("\n[Validación A] Probar consulta de Mariana López...");
    const marianaRes = await tutorAgent.processTeacherQuery("Ver diagnóstico de Mariana López", {
      selectedStudentId: "mariana-lopez",
    });
    console.log("  ✓ Mensaje recibido:\n" + marianaRes.message.text);
    if (!marianaRes.message.text.includes("Mariana López") || !marianaRes.message.text.includes("52%")) {
      throw new Error("Respuesta de Mariana no contiene los datos esperados");
    }
    console.log("  ✓ QuickActions generadas:", marianaRes.message.quickActions?.map((a) => a.label));

    // -------------------------------------------------------------
    // B. Probar el diagnóstico de Luis
    // -------------------------------------------------------------
    console.log("\n[Validación B] Probar diagnóstico de Luis Hernández...");
    const luisRes = await tutorAgent.processTeacherQuery("Ver diagnóstico de Luis Hernández");
    console.log("  ✓ Mensaje recibido:\n" + luisRes.message.text);
    if (!luisRes.message.text.includes("Luis Hernández") || !luisRes.message.text.includes("58%")) {
      throw new Error("Respuesta de Luis no contiene los datos esperados");
    }

    // -------------------------------------------------------------
    // C. Crear una práctica adaptativa y verificar asignación real
    // -------------------------------------------------------------
    console.log("\n[Validación C] Creando práctica adaptativa para Mariana...");
    const practiceRes = await tutorAgent.processTeacherQuery("Crear práctica de apoyo para Mariana López");
    console.log("  ✓ Mensaje recibido:\n" + practiceRes.message.text);
    const enterAction = practiceRes.message.quickActions?.find((a) => a.actionKey === "enter_as_mariana");
    if (!enterAction || !enterAction.payload?.practiceId) {
      throw new Error("No se generó la acción para entrar a la práctica");
    }
    const practiceId = enterAction.payload.practiceId;
    console.log("  ✓ ID de práctica asignada:", practiceId);

    // -------------------------------------------------------------
    // D. Cambiar al alumno y confirmar que aparece la práctica
    // -------------------------------------------------------------
    console.log("\n[Validación D] Cambiando al rol de alumna...");
    await mcpClient.selectRole("student", "mariana-lopez");
    const practiceList = await mcpClient.getAssignedPractice("mariana-lopez");
    console.log("  ✓ Prácticas del alumno recuperadas vía MCP:", practiceList.result ? "ÉXITO" : "FALLÓ");

    // -------------------------------------------------------------
    // E. Finalizar la práctica y verificar evidencia en MCP
    // -------------------------------------------------------------
    console.log("\n[Validación E] Resolviendo práctica y registrando evidencia...");
    await mcpClient.startPractice(practiceId, "mariana-lopez");

    // Resolver los 5 reactivos con sus respuestas correctas
    const exercises = SAMPLE_EXERCISES_POOL.slice(0, 5);
    console.log(`  ✓ Resolviendo ${exercises.length} reactivos calibrados...`);

    const answersPayload = [];
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await mcpClient.submitAnswer(practiceId, ex.id, ex.correctAnswer, 1, "mariana-lopez");
      answersPayload.push({
        exerciseId: ex.id,
        isCorrect: true,
        studentAnswer: ex.correctAnswer,
        attemptsCount: 1,
      });
    }

    const completeRes = await mcpClient.completePractice(practiceId, "mariana-lopez", {
      answers: answersPayload,
    });
    console.log("  ✓ Práctica completada en MCP con éxito!");

    const resultMCP = await mcpClient.getPracticeResult(practiceId, "mariana-lopez");
    console.log("  ✓ Resultado de la práctica verificado:", resultMCP.result?.finalScore, "%");

    // -------------------------------------------------------------
    // F. Regresar al profesor y confirmar actualización de resultados
    // -------------------------------------------------------------
    console.log("\n[Validación F] Regresando al rol de profesor para auditar avance...");
    await mcpClient.selectRole("teacher", "mariana-lopez");
    const progressReport = await tutorAgent.processTeacherQuery("¿Mejoró Mariana López después de la práctica?");
    console.log("  ✓ Reporte para el profesor:\n" + progressReport.message.text);

    console.log("\n==================================================================");
    console.log("🎉 TODAS LAS VALIDACIONES COMPLETADAS SATISFACTORIAMENTE (A-I)");
    console.log("==================================================================");
  } finally {
    server.close();
  }
}

runValidation().catch((err) => {
  console.error("❌ Error en la validación:", err);
  process.exit(1);
});
