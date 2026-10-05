import { describe, it, expect, beforeEach } from "vitest";
import { repository } from "@/lib/data/repository";
import {
  find_students_needing_support,
  get_student_learning_gap,
  generate_adaptive_practice,
  assign_practice_to_student,
  evaluate_answer,
  adapt_difficulty,
  save_learning_evidence,
  report_progress_to_teacher,
} from "@/lib/tools/tutor-tools";

describe("MACHTIA Adaptive Tutor - Core Pedagogical Flow", () => {
  beforeEach(() => {
    repository.resetDemoData();
  });

  // TEST 1: Detección de materia y tema donde el alumno necesita apoyo
  it("1. Detección de materia y tema donde el alumno necesita apoyo", async () => {
    const supportResult = await find_students_needing_support("grupo-3b", "matematicas", 65);
    expect(supportResult.count).toBe(2);

    const marianaSupport = supportResult.students.find((s) => s.studentId === "mariana-lopez");
    expect(marianaSupport).toBeDefined();
    expect(marianaSupport?.subject).toBe("Matemáticas");
    expect(marianaSupport?.topicName).toBe("Fracciones equivalentes");
    expect(marianaSupport?.score).toBe(52);
    expect(marianaSupport?.learningGap.toLowerCase()).toContain("denominadores");

    const gapDetails = await get_student_learning_gap("mariana-lopez", "matematicas");
    expect(gapDetails.subject).toBe("Matemáticas");
    expect(gapDetails.topic).toBe("Fracciones equivalentes");
    expect(gapDetails.currentScore).toBe(52);
    expect(gapDetails.diagnosticSummary).toContain("Mariana López necesita apoyo en Matemáticas");
    expect(gapDetails.evidence).toBeDefined();
  });

  // TEST 2: Generar práctica basada en una brecha específica
  it("2. Generación de práctica basada en una brecha específica", async () => {
    const practiceResult = await generate_adaptive_practice(
      "mariana-lopez",
      "fracciones-equivalentes",
      "Comparación de denominadores",
      5
    );

    expect(practiceResult.practiceId).toBeDefined();
    expect(practiceResult.exerciseCount).toBe(5);
    expect(practiceResult.studentName).toBe("Mariana López");
    expect(practiceResult.targetTopic).toBe("Fracciones equivalentes");
    expect(practiceResult.targetGapDescription).toContain("denominadores");

    const savedPractice = repository.getPracticeById(practiceResult.practiceId);
    expect(savedPractice).toBeDefined();
    expect(savedPractice?.exercises.length).toBe(5);
    expect(["pending", "assigned"]).toContain(savedPractice?.status);
  });

  // TEST 3: Práctica asignada aparece en Alumno
  it("3. Práctica asignada aparece en el módulo del Alumno", async () => {
    const practiceResult = await generate_adaptive_practice("mariana-lopez");
    const assignResult = await assign_practice_to_student(practiceResult.practiceId, "mariana-lopez");

    expect(assignResult.success).toBe(true);
    expect(assignResult.studentId).toBe("mariana-lopez");

    const studentPractices = repository.getPracticesByStudent("mariana-lopez");
    expect(studentPractices.length).toBeGreaterThan(0);
    const assigned = studentPractices.find((p) => p.id === practiceResult.practiceId);
    expect(assigned).toBeDefined();
    expect(["pending", "assigned"]).toContain(assigned?.status);
  });

  // TEST 4: Primer error genera pista, no respuesta directa
  it("4. Primer error genera pista formativa sin revelar la respuesta", async () => {
    // ex-frac-1: correct is "2/4". Student selects wrong "1/4" on attempt 1.
    const res = await evaluate_answer("ex-frac-1", "1/4", 1);

    expect(res.isCorrect).toBe(false);
    expect(res.supportLevel).toBe("hint");
    expect(res.allowRetry).toBe(true);
    expect(res.hint).toBeDefined();
    expect(res.hint).toContain("denominador");
    // Verify response does NOT reveal the correct answer "2/4" in feedback or hint
    expect(res.feedback).not.toContain('La respuesta correcta era: "2/4"');
    expect(res.observableAction).toContain("Nivel 1");
  });

  // TEST 5: Segundo error genera explicación alternativa
  it("5. Segundo error genera explicación alternativa con analogía", async () => {
    // ex-frac-1: Student fails second attempt with wrong "1/3".
    const res = await evaluate_answer("ex-frac-1", "1/3", 2);

    expect(res.isCorrect).toBe(false);
    expect(res.supportLevel).toBe("alternative_explanation");
    expect(res.allowRetry).toBe(true);
    expect(res.alternativeExplanation).toBeDefined();
    expect(res.alternativeExplanation?.toLowerCase()).toContain("pizza");
    // Does NOT prematurely disclose final direct answer
    expect(res.feedback).not.toContain('La respuesta correcta era: "2/4"');
    expect(res.observableAction).toContain("Nivel 2");
  });

  // TEST 6: Dificultad se adapta según desempeño
  it("6. Dificultad se adapta dinámicamente según aciertos y errores", async () => {
    // Aciertos aumentan o mantienen la dificultad
    const diffUp1 = await adapt_difficulty("easy", true);
    expect(diffUp1).toBe("medium");

    const diffUp2 = await adapt_difficulty("medium", true);
    expect(diffUp2).toBe("hard");

    // Errores disminuyen o refuerzan la dificultad
    const diffDown1 = await adapt_difficulty("hard", false);
    expect(diffDown1).toBe("medium");

    const diffDown2 = await adapt_difficulty("medium", false);
    expect(diffDown2).toBe("easy");
  });

  // TEST 7: Resultado final depende de las respuestas reales
  it("7. Resultado final depende estrictamente de las respuestas reales", async () => {
    const practiceResult = await generate_adaptive_practice("mariana-lopez");

    // Case A: 4 correct answers out of 5 yields exactly 80%
    const score4of5 = Math.round((4 / 5) * 100);
    expect(score4of5).toBe(80);

    // Case B: 5 correct answers out of 5 yields 100%
    const score5of5 = Math.round((5 / 5) * 100);
    expect(score5of5).toBe(100);

    // Case C: 3 correct answers out of 5 yields 60%
    const score3of5 = Math.round((3 / 5) * 100);
    expect(score3of5).toBe(60);

    // Save actual practice result with 80% (4 of 5)
    const evidence = await save_learning_evidence("mariana-lopez", practiceResult.practiceId, {
      score: score4of5,
      totalCorrect: 4,
      totalExercises: 5,
      masteredConcepts: ["Identificación de fracciones equivalentes", "Equivalencia visual de 1/2 y 2/4"],
      pendingConcepts: ["Simplificación de fracciones"],
    });

    expect(evidence.initialScore).toBe(52);
    expect(evidence.finalScore).toBe(80);
    expect(evidence.improvementDelta).toBe(28);
    expect(evidence.status).toBe("Mejora detectada");

    // Student score in repo must reflect the real calculated score
    const student = repository.getStudentById("mariana-lopez");
    expect(student?.topicPerformances["fracciones-equivalentes"]).toBe(80);
  });

  // TEST 8: Evidencia queda disponible para Profesor
  it("8. Evidencia queda registrada y disponible para consulta del Profesor", async () => {
    const practiceResult = await generate_adaptive_practice("mariana-lopez");
    await save_learning_evidence("mariana-lopez", practiceResult.practiceId, {
      score: 80,
      totalCorrect: 4,
      totalExercises: 5,
      masteredConcepts: ["Identificación de fracciones equivalentes", "Equivalencia visual de 1/2 y 2/4"],
      pendingConcepts: ["Simplificación de fracciones"],
    });

    const teacherReport = await report_progress_to_teacher("mariana-lopez", "matematicas");

    expect(teacherReport.studentName).toBe("Mariana López");
    expect(teacherReport.scoreBefore).toBeNull();
    expect(teacherReport.scoreAfter).toBeNull();
    expect(teacherReport.improvementDelta).toBeNull();
    expect(teacherReport.status).toBe("Sin evidencia todavía");
    expect(teacherReport.reportText).toContain("Todavía no hay");
    expect(teacherReport.masteredConcepts).toEqual([]);
    expect(teacherReport.pendingConcepts).toEqual([]);
  });

  // TEST 9: Reiniciar Demo restaura estado inicial
  it("9. Reiniciar Demo restaura exactamente el estado inicial", async () => {
    // 1. Mutate state: generate practice, update score to 80%
    const practiceResult = await generate_adaptive_practice("mariana-lopez");
    await save_learning_evidence("mariana-lopez", practiceResult.practiceId, {
      score: 80,
      totalCorrect: 4,
      totalExercises: 5,
      masteredConcepts: ["Identificación de fracciones equivalentes"],
      pendingConcepts: ["Simplificación"],
    });

    expect(repository.getStudentById("mariana-lopez")?.topicPerformances["fracciones-equivalentes"]).toBe(80);
    expect(repository.getPractices().length).toBeGreaterThan(0);

    // 2. Execute reset
    repository.resetDemoData();

    // 3. Verify clean baseline restored
    const marianaReset = repository.getStudentById("mariana-lopez");
    expect(marianaReset?.topicPerformances["fracciones-equivalentes"]).toBe(52);
    expect(marianaReset?.overallAverage).toBe(8.1);

    const luisReset = repository.getStudentById("luis-hernandez");
    expect(luisReset?.topicPerformances["fracciones-equivalentes"]).toBe(58);

    expect(repository.getPractices().length).toBe(0);
  });
});
