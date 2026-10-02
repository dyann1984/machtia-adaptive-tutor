import { afterEach, describe, expect, it, vi } from "vitest";
import { repository } from "@/lib/data/repository";
import { mcpClient } from "@/lib/mcp/client";
import { tutorAgent } from "@/lib/ai/tutor-agent";
import { evaluate_answer } from "@/lib/tools/tutor-tools";
import { complete_practice } from "@/mcp/server/alexa-service";

afterEach(() => vi.restoreAllMocks());

describe("Final audit regressions", () => {
  it("does not invent successful answers when completing an empty Alexa session", async () => {
    repository.resetOfficialDemoScenario();
    const result = await complete_practice({ practiceId: "prac-mariana-fracciones", studentId: "mariana-lopez" });
    expect(result.finalScore).toBe(0);
    expect(result.masteredConcepts).toEqual([]);
  });
  it.each([null, undefined, {}, { practiceId: "invalid", exercises: [null] }, { practiceId: 123, exercises: [{}] }])("preserves the existing practice when MCP returns %j", async (result) => {
    repository.resetOfficialDemoScenario();
    vi.spyOn(mcpClient, "generateAdaptivePractice").mockResolvedValue({ result, source: "mcp", durationMs: 1 } as any);
    vi.spyOn(mcpClient, "assignPracticeToStudent").mockResolvedValue({ result: null, source: "mcp", durationMs: 1 } as any);
    const response = await tutorAgent.processTeacherQuery("Crear práctica de apoyo para Mariana López", { selectedStudentId: "mariana-lopez" });
    expect(response.suggestedAction?.payload.practiceId).toBe("prac-mariana-fracciones");
    expect(repository.getPracticeById("invalid")).toBeUndefined();
  });

  it("offers guidance and another attempt after three errors without giving the answer", async () => {
    const response = await evaluate_answer("ex-frac-5", "1/3", 3);
    expect(response.supportLevel).toBe("guided_example");
    expect(response.allowRetry).toBe(true);
    expect(response.guidedExample).not.toContain("2/3");
  });
});
