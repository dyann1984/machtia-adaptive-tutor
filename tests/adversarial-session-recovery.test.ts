import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { harness, solve } from "./server-harness";
import { McpClient } from "@/lib/mcp/client";
import { repository } from "@/lib/data/repository";

describe("Adversarial Security Test: MCP Session Recovery & Non-Duplication (Hotfix P0)", () => {
  let h: Awaited<ReturnType<typeof harness>>;
  let client: McpClient;

  beforeEach(async () => {
    repository.resetDemoData();
    h = await harness();
    client = new McpClient(h.base + "/mcp");
  });

  afterEach(async () => {
    await h?.close();
  });

  describe("1. Control de Autorización y Prevención de Escalada de Privilegios", () => {
    it("alumno NUNCA adquiere permisos docentes al fallar con 403 Forbidden", async () => {
      // Configurar rol como estudiante Mariana López
      await client.selectRole("student", "mariana-lopez");

      // Intento adversarial: El estudiante intenta invocar herramienta docente 'generate_adaptive_practice'
      await expect(
        client.callTool("generate_adaptive_practice", {
          studentId: "mariana-lopez",
          topicId: "fracciones-equivalentes",
        })
      ).rejects.toThrow();

      // Verificar que el cliente NO se convirtió en docente de forma silenciosa
      // Una consulta de estudiante legítima debe seguir operando con identidad de estudiante
      const studentContext = await client.callTool("get_student_context", {
        studentId: "mariana-lopez",
      });
      expect(studentContext.result).toBeDefined();

      // Pero un IDOR hacia otro estudiante debe seguir siendo RECHAZADO
      await expect(
        client.callTool("get_student_context", {
          studentId: "luis-hernandez",
        })
      ).rejects.toThrow();
    });

    it("recuperación de sesión vía selectRole PRESERVA el rol de estudiante y no otorga permisos docentes", async () => {
      // 1. Iniciar como estudiante
      await client.selectRole("student", "mariana-lopez");

      // 2. Simular pérdida de sesión en Render corrompiendo tokens almacenados
      (client as any).judgeToken = "invalid-judge-token-from-restart";
      (client as any).actorToken = "invalid-actor-token-from-restart";

      // 3. Al re-establecer rol de estudiante o refrescar sesión:
      // Debe recuperarse limpiamente solicitando nueva sesión y emitiendo token de estudiante
      await client.selectRole("student", "mariana-lopez");

      // 4. Confirmar que la herramienta autorizada de estudiante funciona
      const res = await client.callTool("get_student_context", {
        studentId: "mariana-lopez",
      });
      expect(res.result).toBeDefined();

      // 5. VERIFICACIÓN CRÍTICA: Confirmar que el estudiante NUNCA adquirió permisos docentes
      await expect(
        client.callTool("generate_adaptive_practice", {
          studentId: "mariana-lopez",
          topicId: "fracciones-equivalentes",
        })
      ).rejects.toThrow();
    });
  });

  describe("2. Idempotencia y Prevención de Duplicados en Reintentos", () => {
    it("reintentos de 'assign_practice_to_student' son idempotentes y no duplican asignaciones", async () => {
      await client.selectRole("teacher", "mariana-lopez");

      const generated = await client.callTool("generate_adaptive_practice", {
        studentId: "mariana-lopez",
        topicId: "fracciones-equivalentes",
      });
      const practiceId = (generated.result as any).practiceId;

      // Asignar primera vez
      const assign1 = await client.callTool("assign_practice_to_student", {
        practiceId,
        studentId: "mariana-lopez",
      });
      expect((assign1.result as any).success).toBe(true);

      // Reintentar asignación (simulando reintento de red o reintento de usuario)
      const assign2 = await client.callTool("assign_practice_to_student", {
        practiceId,
        studentId: "mariana-lopez",
      });
      expect((assign2.result as any).success).toBe(true);

      // Auditar estado en servidor: la práctica debe seguir siendo una sola
      const state = await client.snapshot();
      const matchingPractices = (state.practices || []).filter((p: any) => p.id === practiceId);
      expect(matchingPractices).toHaveLength(1);
    });

    it("reintentos de 'complete_practice' devuelven la misma evidencia y no duplican el ledger", async () => {
      // 1. Resolver los reactivos
      const p = await solve(h, 5);

      // 2. Primera finalización
      await h.role("student", p.studentId);
      const firstComplete = await h.call("complete_practice", {
        practiceId: p.id,
        studentId: p.studentId,
      });

      expect(firstComplete.status).toBe(200);
      const evidence1 = firstComplete.body.result?.structuredContent?.evidenceId ||
        firstComplete.body.result?.evidenceId;
      expect(evidence1).toBeDefined();

      // Contar evidencias iniciales
      const stateBefore = await h.state();
      const evidencesForPracticeBefore = (stateBefore.evidences || []).filter(
        (e: any) => e.practiceId === p.id
      );
      expect(evidencesForPracticeBefore).toHaveLength(1);

      // 3. Reintento de finalización (simulando reintento por timeout o re-envío del cliente)
      const secondComplete = await h.call("complete_practice", {
        practiceId: p.id,
        studentId: p.studentId,
      });

      expect(secondComplete.status).toBe(200);
      const evidence2 = secondComplete.body.result?.structuredContent?.evidenceId ||
        secondComplete.body.result?.evidenceId;

      // Debe retornar exactamente la misma evidencia
      expect(evidence2).toBe(evidence1);

      // 4. Auditar que el ledger de evidencias en servidor no duplicó el registro
      const stateAfter = await h.state();
      const evidencesForPracticeAfter = (stateAfter.evidences || []).filter(
        (e: any) => e.practiceId === p.id
      );
      expect(evidencesForPracticeAfter).toHaveLength(1);
    });
  });
});
