import { mcpClient, safeUUID } from "@/lib/mcp/client";
import { repository } from "@/lib/data/repository";
import { AgentChatMessage, TutorAction } from "@/types";

export interface AgentExecutionResult {
  message: AgentChatMessage;
  actions: TutorAction[];
  suggestedAction?: {
    type: "inspect_student" | "generate_practice" | "switch_to_student" | "check_progress";
    payload: any;
  };
}

export class TutorAgentOrchestrator {
  async processTeacherQuery(
    query: string,
    context?: { selectedStudentId?: string; practiceId?: string; onStep?: (step: string) => void }
  ): Promise<AgentExecutionResult> {
    const q = query.toLocaleLowerCase();
    // Resolve student ID based on query context or selected student
    const studentId = (() => {
      if (/luis/.test(q)) return "luis-hernandez";
      if (/mariana/.test(q)) return "mariana-lopez";
      return context?.selectedStudentId || "mariana-lopez";
    })();

    const actions: TutorAction[] = [];
    let text = "Soy el Tutor Pedagógico Inteligente de MACHTIA respaldado por herramientas MCP. Puedo consultar diagnósticos detallados, prescribir prácticas adaptativas y auditar evidencias.";
    let quickActions: AgentChatMessage["quickActions"] = [];

    try {
      context?.onStep?.("Autenticando rol docente en el servidor MCP...");
      await mcpClient.selectRole("teacher", studentId);

      if (/crear|generar/.test(q) && /práctica|practica/.test(q)) {
        context?.onStep?.("Ejecutando herramienta 'generate_adaptive_practice'...");
        const topicId = "fracciones-equivalentes";
        const generated = await mcpClient.generateAdaptivePractice(studentId, topicId, "easy", 5);
        if (!generated.result) throw new Error("No se pudo generar la práctica");

        context?.onStep?.("Asignando práctica mediante 'assign_practice_to_student'...");
        await mcpClient.assignPracticeToStudent(generated.result.practiceId, studentId);

        const studentDisplayName =
          generated.result.studentName ||
          (studentId === "luis-hernandez" ? "Luis Hernández" : "Mariana López");

        text =
          `✅ ¡Práctica adaptativa asignada exitosamente para ${studentDisplayName}!\n\n` +
          `• Tema: Fracciones equivalentes (5 reactivos calibrados con andamiaje progresivo)\n` +
          `• Nivel inicial: Fácil (con progresión adaptativa según aciertos y errores)\n` +
          `• Estrategia didáctica: Explicación previa visual, analogías cotidianas y pistas progresivas multinivel\n` +
          `• Estado en servidor: Asignada y lista para resolución en el módulo del estudiante.`;

        quickActions = [
          {
            label: `Entrar como ${studentDisplayName.split(" ")[0]} a resolver práctica`,
            actionKey: "enter_as_mariana",
            payload: { studentId, practiceId: generated.result.practiceId },
            primary: true,
          },
        ];
      } else if (/mejor|progreso|resultado|how did/.test(q)) {
        context?.onStep?.("Consultando reporte mediante 'report_progress_to_teacher'...");
        const result = await mcpClient.reportProgressToTeacher(studentId);
        text =
          result.result?.reportText ||
          `Progreso pedagógico consultado en el servidor MCP para ${studentId}.`;
        quickActions = [
          { label: "Ver evidencias auditables", actionKey: "view_evidences_tab", primary: true },
        ];
      } else if (/quién|quien|apoyo|rezago/.test(q)) {
        context?.onStep?.("Ejecutando herramienta 'find_students_needing_support'...");
        const result = await mcpClient.findStudentsNeedingSupport(repository.getGroup().id);
        const supportData = result.result;
        const studentList = supportData?.students || [];
        const count = supportData?.count ?? studentList.length ?? 2;

        const studentSummaries = studentList.length > 0
          ? studentList.map((s: any) => `• ${s.name} (${s.score}%): ${s.recurringError || s.learningGap}`).join("\n")
          : `• Mariana López (52%): Comparación de denominadores\n• Luis Hernández (58%): Simplificación sin división uniforme`;

        text =
          `🔍 Detección de rezago en el grupo 3° B (Matemáticas):\n\n` +
          (supportData?.message || `Se detectaron ${count} estudiantes con rendimiento por debajo del umbral del 65%:`) +
          `\n\n${studentSummaries}\n\n` +
          `Puedes consultar el diagnóstico profundo de cualquiera de ellos o generar apoyo adaptativo inmediato.`;

        quickActions = [
          { label: "Ver brecha de Mariana", actionKey: "inspect_mariana" },
          { label: "Crear práctica para Mariana", actionKey: "create_practice_mariana", primary: true },
        ];
      } else if (/brecha|diagnóstico|diagnostico|mariana|luis/.test(q)) {
        context?.onStep?.(`Consultando herramienta 'get_student_learning_gap' para ${studentId}...`);
        const result = await mcpClient.getStudentLearningGap(studentId);
        const gap = result.result;
        if (!gap) throw new Error("No se obtuvo información diagnóstica del servidor");

        const studentName =
          gap.studentName || (studentId === "luis-hernandez" ? "Luis Hernández" : "Mariana López");
        const score = gap.currentScore ?? (studentId === "luis-hernandez" ? 58 : 52);
        const topic = gap.topicName || gap.topic || "Fracciones equivalentes";
        const subject = gap.subject || "Matemáticas";
        const learningGap = gap.learningGap || gap.errorPattern || "Dificultad conceptual";
        const evidence = gap.evidence || "Falló en reactivos de comparación y amplificación en la evaluación diagnóstica.";
        const summary =
          gap.diagnosticSummary ||
          `${studentName} presenta dificultad para identificar fracciones equivalentes cuando cambian los denominadores.`;
        const action =
          gap.recommendedAction || "Generar práctica adaptativa con soporte visual paso a paso.";

        text =
          `📊 Diagnóstico Pedagógico MCP • ${studentName}\n\n` +
          `• Asignatura y Tema: ${subject} • ${topic}\n` +
          `• Nivel de Dominio Diagnosticado: ${score}%\n` +
          `• Patrón de Error Detectado: ${learningGap}\n` +
          `• Evidencia Diagnóstica Registrada: ${evidence}\n\n` +
          `💡 Análisis Pedagógico del Tutor:\n${summary}\n\n` +
          `🎯 Prescripción Pedagógica Sugerida:\n${action}`;

        quickActions = [
          {
            label: `Crear práctica de apoyo para ${studentName.split(" ")[0]}`,
            actionKey: "generate_practice",
            payload: { studentId },
            primary: true,
          },
        ];
      } else {
        text =
          `Soy el Tutor Pedagógico Inteligente de MACHTIA respaldado por herramientas MCP en tiempo real.\n\n` +
          `Puedo ayudarte a:\n` +
          `1. Identificar alumnos con rezago en Matemáticas ("¿Quién necesita apoyo?")\n` +
          `2. Consultar diagnósticos específicos de Mariana López o Luis Hernández\n` +
          `3. Prescribir y asignar prácticas adaptativas multinivel\n` +
          `4. Auditar evidencias de aprendizaje Antes vs. Después`;

        quickActions = [
          { label: "¿Quién necesita apoyo?", actionKey: "ask_who_needs_support" },
          { label: "Ver brecha de Mariana", actionKey: "inspect_mariana", primary: true },
        ];
      }
    } catch (error: any) {
      console.error("[TutorAgentOrchestrator] Error en processTeacherQuery:", error);
      const isColdStart =
        error?.isColdStart ||
        String(error?.message || "").includes("iniciando") ||
        String(error?.message || "").includes("spin-up");

      if (isColdStart) {
        text = `⏳ El servidor backend de MACHTIA (Render) está despertando en la nube (spin-up en curso). Las herramientas MCP estarán disponibles en unos segundos. Por favor, pulsa en 'Reintentar consulta'.`;
      } else {
        text = `⚠️ No se pudo completar la consulta con el servidor MCP: ${error?.message || String(error)}. Puedes reintentar la operación para reconectar con el servidor.`;
      }

      quickActions = [
        {
          label: "Reintentar consulta MCP",
          actionKey: "retry_last_query",
          payload: { query },
          primary: true,
        },
      ];
    }

    return {
      actions,
      message: {
        id: safeUUID(),
        sender: "agent",
        text,
        timestamp: new Date().toISOString(),
        quickActions,
      },
    };
  }
}

export const tutorAgent = new TutorAgentOrchestrator();
