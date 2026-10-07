import { mcpClient } from "@/lib/mcp/client";
import { repository } from "@/lib/data/repository";
import { AgentChatMessage, TutorAction } from "@/types";
export interface AgentExecutionResult { message: AgentChatMessage; actions: TutorAction[]; suggestedAction?: { type: "inspect_student" | "generate_practice" | "switch_to_student" | "check_progress"; payload: any } }
export class TutorAgentOrchestrator {
  async processTeacherQuery(query: string, context?: { selectedStudentId?: string; practiceId?: string }): Promise<AgentExecutionResult> {
    const studentId = context?.selectedStudentId || "mariana-lopez";
    const q = query.toLocaleLowerCase();
    const actions: TutorAction[] = [];
    let text = "Soy el tutor demo determinista. Puedo consultar diagnósticos, asignar prácticas y recuperar evidencia registrada mediante MCP.";
    let quickActions: AgentChatMessage["quickActions"] = [];
    try {
      await mcpClient.selectRole("teacher", studentId);
      if (/crear|generar/.test(q) && /práctica|practica/.test(q)) {
        const generated = await mcpClient.generateAdaptivePractice(studentId, "fracciones-equivalentes", "easy", 5);
        if (!generated.result) throw new Error("No se generó la práctica");
        await mcpClient.assignPracticeToStudent(generated.result.practiceId, studentId);
        text = `${generated.result.studentName || studentId}: ¡Práctica de apoyo asignada exitosamente! Incluye explicación previa y apoyos progresivos.`;
        quickActions = [{ label: "Entrar como alumno", actionKey: "enter_as_mariana", payload: { studentId, practiceId: generated.result.practiceId }, primary: true }];
      } else if (/mejor|progreso|resultado|how did/.test(q)) {
        const result = await mcpClient.reportProgressToTeacher(studentId);
        text = result.result.reportText;
        quickActions = [{ label: "Ver evidencias", actionKey: "view_evidences_tab" }];
      } else if (/quién|quien|apoyo|rezago/.test(q)) {
        const result = await mcpClient.findStudentsNeedingSupport(repository.getGroup().id);
        text = `Diagnóstico demo consultado en MCP:\n\n${JSON.stringify(result.result, null, 2)}`;
        quickActions = [{ label: "Ver brecha de Mariana", actionKey: "inspect_mariana" }, { label: "Crear práctica", actionKey: "create_practice_mariana", primary: true }];
      } else if (/brecha|diagnóstico|mariana|luis/.test(q)) {
        const result = await mcpClient.getStudentLearningGap(studentId);
        text = `Diagnóstico demo:\n\n${JSON.stringify(result.result, null, 2)}`;
        quickActions = [{ label: "Crear práctica de apoyo", actionKey: "generate_practice", payload: { studentId }, primary: true }];
      }
    } catch (error) { text = `No se pudo completar la consulta en el servidor: ${String(error)}. Vuelve a intentar cuando MCP esté disponible.`; }
    return { actions, message: { id: crypto.randomUUID(), sender: "agent", text, timestamp: new Date().toISOString(), quickActions } };
  }
}
export const tutorAgent = new TutorAgentOrchestrator();
