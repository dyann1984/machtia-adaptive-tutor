import {
  analyze_student_performance,
  find_students_needing_support,
  get_student_learning_gap,
  generate_adaptive_practice,
  assign_practice_to_student,
  explain_concept,
  evaluate_answer,
  adapt_difficulty,
  evaluate_practice,
  save_learning_evidence,
  get_student_progress,
  report_progress_to_teacher,
} from "@/lib/tools/tutor-tools";
import { getAIProvider } from "./providers";
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
  private provider = getAIProvider();

  /**
   * Main agent execution pipeline. Processes teacher queries and dispatches tools.
   */
  async processTeacherQuery(
    query: string,
    context?: { selectedStudentId?: string; practiceId?: string }
  ): Promise<AgentExecutionResult> {
    const executedActions: TutorAction[] = [];

    const recordAction = (
      toolName: string,
      displayName: string,
      description: string,
      input: Record<string, any>,
      output: Record<string, any>
    ) => {
      const action = repository.logAction({
        toolName,
        displayName,
        description,
        input,
        output,
        status: "success",
        durationMs: Math.floor(Math.random() * 200) + 120,
      });
      executedActions.push(action);
      return action;
    };

    const q = query.toLowerCase();

    // 1. QUERY: Who needs support? / Detección de rezago
    if (
      q.includes("quién necesita apoyo") ||
      q.includes("quien necesita apoyo") ||
      q.includes("qué alumnos") ||
      q.includes("que alumnos") ||
      q.includes("apoyo") ||
      q.includes("rezago")
    ) {
      // Step A: analyze_student_performance
      const perf = await analyze_student_performance("grupo-3b", "matematicas");
      recordAction(
        "analyze_student_performance",
        "Consultó desempeño del grupo",
        "Analizó calificaciones de 5 alumnos en 3 temas curriculares.",
        { groupId: "grupo-3b", subjectId: "matematicas" },
        perf
      );

      // Step B: find_students_needing_support
      const support = await find_students_needing_support("grupo-3b", "matematicas", 65);
      recordAction(
        "find_students_needing_support",
        "Detectó patrones y alumnos con rezago",
        "Identificó alumnos con rendimiento inferior al 65%.",
        { groupId: "grupo-3b", subjectId: "matematicas", threshold: 65 },
        support
      );

      // Step C: get_student_learning_gap for detected students
      const marianaGap = await get_student_learning_gap("mariana-lopez", "matematicas");
      recordAction(
        "get_student_learning_gap",
        "Identificó brecha de Mariana López",
        "Error recurrente: comparación de denominadores (52% de aciertos).",
        { studentId: "mariana-lopez", subjectId: "matematicas" },
        marianaGap
      );

      const luisGap = await get_student_learning_gap("luis-hernandez", "matematicas");
      recordAction(
        "get_student_learning_gap",
        "Identificó brecha de Luis Hernández",
        "Error recurrente: simplificación de fracciones (58% de aciertos).",
        { studentId: "luis-hernandez", subjectId: "matematicas" },
        luisGap
      );

      const responseText = `He analizado el desempeño curricular del grupo **3° B** en **Matemáticas**:\n\n• **Mariana López** necesita apoyo en **Matemáticas**, específicamente en **fracciones equivalentes**.\n  - **Calificación actual:** 52% (4 de 7 reactivos fallados en examen diagnóstico).\n  - **Brecha de aprendizaje detectada:** *Comparación de denominadores* — Asume que a mayor denominador mayor es la fracción, sin comprobar la relación multiplicativa (confunde 1/2 con 1/4 y afirma que 2/6 es menor que 1/6).\n\n• **Luis Hernández** necesita apoyo en **Matemáticas**, específicamente en **fracciones equivalentes**.\n  - **Calificación actual:** 58%.\n  - **Brecha de aprendizaje detectada:** *Simplificación* — Omite dividir ambos términos uniformemente entre el factor común.\n\nEl resto del grupo mantiene un desempeño óptimo (promedio 89%). Te recomiendo generar una práctica de apoyo personalizada para **Mariana López**.`;

      const message: AgentChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "agent",
        text: responseText,
        timestamp: new Date().toISOString(),
        agentActions: [...executedActions],
        quickActions: [
          {
            label: "Crear práctica de apoyo para Mariana",
            actionKey: "generate_practice",
            payload: { studentId: "mariana-lopez" },
            primary: true,
          },
          {
            label: "Ver brecha de Mariana López",
            actionKey: "inspect_mariana",
            payload: { studentId: "mariana-lopez" },
          },
          {
            label: "Ver brecha de Luis Hernández",
            actionKey: "inspect_luis",
            payload: { studentId: "luis-hernandez" },
          },
        ],
        dataPayload: {
          supportList: support.students,
        },
      };

      return {
        message,
        actions: executedActions,
        suggestedAction: {
          type: "inspect_student",
          payload: { studentId: "mariana-lopez" },
        },
      };
    }

    // 2. QUERY: Gap diagnosis for specific student
    if (q.includes("mariana") || q.includes("diagnóstico") || q.includes("brecha")) {
      const studentId = q.includes("luis") ? "luis-hernandez" : "mariana-lopez";
      const studentName = studentId === "mariana-lopez" ? "Mariana López" : "Luis Hernández";

      const gap = await get_student_learning_gap(studentId, "matematicas");
      recordAction(
        "get_student_learning_gap",
        `Identificó brecha de aprendizaje de ${studentName}`,
        gap.diagnosticSummary,
        { studentId, subjectId: "matematicas" },
        gap
      );

      const responseText = `**Diagnóstico de ${studentName}**:\n\n${gap.diagnosticSummary}\n\n• **Materia:** Matemáticas\n• **Tema específico:** Fracciones equivalentes\n• **Brecha concreta:** ${gap.learningGap}\n• **Evidencia de diagnóstico:** ${gap.evidence}\n• **Rendimiento actual:** ${gap.currentScore}%\n\nPulsa **"Crear práctica de apoyo"** para generar una batería adaptativa de 5 ejercicios con acompañamiento visual interactivo.`;

      const message: AgentChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "agent",
        text: responseText,
        timestamp: new Date().toISOString(),
        agentActions: [...executedActions],
        quickActions: [
          {
            label: `Crear práctica de apoyo para ${studentName.split(" ")[0]}`,
            actionKey: "generate_practice",
            payload: { studentId },
            primary: true,
          },
        ],
        dataPayload: { gap },
      };

      return {
        message,
        actions: executedActions,
        suggestedAction: {
          type: "generate_practice",
          payload: { studentId },
        },
      };
    }

    // 3. QUERY: Generate Practice
    if (q.includes("generar práctica") || q.includes("crear práctica") || q.includes("asignar práctica") || q.includes("práctica de apoyo")) {
      const studentId = context?.selectedStudentId || "mariana-lopez";
      const student = repository.getStudentById(studentId) || repository.getStudents()[0];

      // Step A: generate_adaptive_practice
      const practiceResult = await generate_adaptive_practice(
        student.id,
        "fracciones-equivalentes",
        student.recurringErrors["fracciones-equivalentes"],
        5
      );
      recordAction(
        "generate_adaptive_practice",
        "Generó práctica de apoyo adaptativa",
        `Creó 5 ejercicios calibrados para corregir: ${practiceResult.targetGapDescription}.`,
        { studentId: student.id, count: 5 },
        practiceResult
      );

      // Step B: assign_practice_to_student
      const assignResult = await assign_practice_to_student(practiceResult.practiceId, student.id);
      recordAction(
        "assign_practice_to_student",
        "Asignó práctica al portal del alumno",
        `Práctica registrada como pendiente en la cuenta de ${student.name}.`,
        { practiceId: practiceResult.practiceId, studentId: student.id },
        assignResult
      );

      const responseText = `✅ **¡Práctica de apoyo asignada exitosamente!**\n\n• **Alumno:** ${student.name}\n• **Materia:** Matemáticas | **Tema:** Fracciones equivalentes\n• **Práctica:** ${practiceResult.practiceTitle}\n• **Estado:** Pendiente en portal del alumno\n• **Enfoque pedagógico:** 5 ejercicios interactivos adaptativos con apoyo visual paso a paso.\n\nAhora puedes cambiar al rol **Alumno** en la barra superior para ver la práctica asignada y comenzar la resolución guiada.`;

      const message: AgentChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "agent",
        text: responseText,
        timestamp: new Date().toISOString(),
        agentActions: [...executedActions],
        quickActions: [
          {
            label: `Entrar como ${student.name.split(" ")[0]} a resolver práctica`,
            actionKey: "switch_student_role",
            payload: { studentId: student.id, practiceId: practiceResult.practiceId },
            primary: true,
          },
        ],
        dataPayload: { practiceId: practiceResult.practiceId },
      };

      return {
        message,
        actions: executedActions,
        suggestedAction: {
          type: "switch_to_student",
          payload: { studentId: student.id, practiceId: practiceResult.practiceId },
        },
      };
    }

    // 4. QUERY: Has student improved? / Progreso antes y después
    if (
      q.includes("mejoró") ||
      q.includes("mejora") ||
      q.includes("progreso") ||
      q.includes("resultado") ||
      q.includes("después") ||
      q.includes("antes")
    ) {
      const studentId = context?.selectedStudentId || "mariana-lopez";
      const student = repository.getStudentById(studentId) || repository.getStudents()[0];

      // Step A: get_student_progress
      const progress = await get_student_progress(student.id, "matematicas");
      recordAction(
        "get_student_progress",
        "Consultó historial de progreso",
        `Recuperó diagnóstico inicial vs calificaciones de prácticas completadas.`,
        { studentId: student.id, subjectId: "matematicas" },
        progress
      );

      // Step B: report_progress_to_teacher
      const report = await report_progress_to_teacher(student.id, "matematicas");
      recordAction(
        "report_progress_to_teacher",
        "Generó reporte pedagógico consolidado",
        `Calculó delta de mejora (+${report.improvementDelta}%) y conceptos dominados.`,
        { studentId: student.id, subjectId: "matematicas" },
        report
      );

      const responseText = `📊 **Reporte de Progreso de ${student.name}**\n\n• **Materia:** Matemáticas | **Tema:** Fracciones equivalentes\n• **ANTES:** ${report.scoreBefore}%\n• **DESPUÉS:** ${report.scoreAfter}%\n• **DELTA DE MEJORA:** +${report.improvementDelta}% 📈\n• **ESTADO:** **${report.status}**\n\n**Evidencia del progreso:**\n${report.reportText}\n\n**Conceptos dominados:**\n${report.masteredConcepts.map((c) => `✓ ${c}`).join("\n")}\n\n**Pendientes para siguiente ciclo:**\n${report.pendingConcepts.map((c) => `⏳ ${c}`).join("\n")}`;

      const message: AgentChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "agent",
        text: responseText,
        timestamp: new Date().toISOString(),
        agentActions: [...executedActions],
        quickActions: [
          {
            label: "Ver tabla completa de evidencias",
            actionKey: "view_evidences_tab",
            primary: true,
          },
        ],
        dataPayload: { report },
      };

      return {
        message,
        actions: executedActions,
        suggestedAction: {
          type: "check_progress",
          payload: { studentId: student.id },
        },
      };
    }

    // Default Fallback
    const fallbackResponse = `Hola Profesor, soy tu **MACHTIA Adaptive Tutor**. Puedo ayudarte a:\n\n1. Identificar alumnos que requieren apoyo pedagógico en tu grupo.\n2. Analizar brechas cognitivas y errores recurrentes.\n3. Generar prácticas adaptativas personalizadas.\n4. Evaluar la mejora del alumno antes y después de practicar.\n\n¿Por dónde deseas empezar?`;

    const message: AgentChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "agent",
      text: fallbackResponse,
      timestamp: new Date().toISOString(),
      quickActions: [
        {
          label: "¿Quién necesita apoyo en matemáticas?",
          actionKey: "ask_who_needs_support",
          primary: true,
        },
        {
          label: "¿Mejoró Mariana López?",
          actionKey: "ask_mariana_improvement",
        },
      ],
    };

    return {
      message,
      actions: executedActions,
    };
  }
}

export const tutorAgent = new TutorAgentOrchestrator();
