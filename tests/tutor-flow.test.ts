import { describe, it, expect, beforeEach } from "vitest";
import { repository } from "@/lib/data/repository";
import {
  find_students_needing_support,
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

  it("1. Detección de alumnos con bajo desempeño (find_students_needing_support)", async () => {
    const result = await find_students_needing_support("grupo-3b", "matematicas", 65);

    expect(result.count).toBe(2);
    const names = result.students.map((s) => s.name);
    expect(names).toContain("Mariana López");
    expect(names).toContain("Luis Hernández");

    const mariana = result.students.find((s) => s.name === "Mariana López");
    expect(mariana?.score).toBe(52);
    expect(mariana?.recurringError).toContain("denominadores");

    const luis = result.students.find((s) => s.name === "Luis Hernández");
    expect(luis?.score).toBe(58);
  });

  it("2. Generación de práctica adaptativa (generate_adaptive_practice)", async () => {
    const practiceResult = await generate_adaptive_practice(
      "mariana-lopez",
      "fracciones-equivalentes",
      "Comparación de denominadores",
      5
    );

    expect(practiceResult.practiceId).toBeDefined();
    expect(practiceResult.exerciseCount).toBe(5);
    expect(practiceResult.studentName).toBe("Mariana López");

    const savedPractice = repository.getPracticeById(practiceResult.practiceId);
    expect(savedPractice).toBeDefined();
    expect(savedPractice?.exercises.length).toBe(5);
    expect(savedPractice?.status).toBe("assigned");
  });

  it("3. Asignación de práctica al alumno (assign_practice_to_student)", async () => {
    const practiceResult = await generate_adaptive_practice("mariana-lopez");
    const assignResult = await assign_practice_to_student(practiceResult.practiceId, "mariana-lopez");

    expect(assignResult.success).toBe(true);
    expect(assignResult.studentId).toBe("mariana-lopez");

    const studentPractices = repository.getPracticesByStudent("mariana-lopez");
    expect(studentPractices.some((p) => p.id === practiceResult.practiceId)).toBe(true);
  });

  it("4. Evaluación de respuestas y adaptación de dificultad (evaluate_answer & adapt_difficulty)", async () => {
    // Correct answer test
    const correctRes = await evaluate_answer("ex-frac-1", "2/4", 1);
    expect(correctRes.isCorrect).toBe(true);
    expect(correctRes.feedback).toContain("¡Excelente trabajo!");

    // Incorrect answer attempt 1 gives hint
    const wrongRes1 = await evaluate_answer("ex-frac-1", "1/4", 1);
    expect(wrongRes1.isCorrect).toBe(false);
    expect(wrongRes1.allowSecondAttempt).toBe(true);
    expect(wrongRes1.hint).toBeDefined();

    // Dificultad adaptativa
    const higherDiff = await adapt_difficulty("easy", true);
    expect(higherDiff).toBe("medium");

    const lowerDiff = await adapt_difficulty("hard", false);
    expect(lowerDiff).toBe("medium");
  });

  it("5. Actualización de progreso y reporte de evidencia (save_learning_evidence & report_progress_to_teacher)", async () => {
    const practiceResult = await generate_adaptive_practice("mariana-lopez");

    // Initially Mariana has 52%
    const studentBefore = repository.getStudentById("mariana-lopez");
    expect(studentBefore?.topicPerformances["fracciones-equivalentes"]).toBe(52);

    // Save evidence of practice completed with 80%
    const evidence = await save_learning_evidence("mariana-lopez", practiceResult.practiceId, {
      score: 80,
      totalCorrect: 4,
      totalExercises: 5,
      masteredConcepts: ["Equivalencia visual de 1/2", "Amplificación por factor 2"],
      pendingConcepts: ["Simplificación avanzada"],
    });

    expect(evidence.initialScore).toBe(52);
    expect(evidence.finalScore).toBe(80);
    expect(evidence.improvementDelta).toBe(28);
    expect(evidence.status).toBe("Mejora detectada");

    // Verify student performance in repository updated
    const studentAfter = repository.getStudentById("mariana-lopez");
    expect(studentAfter?.topicPerformances["fracciones-equivalentes"]).toBe(80);

    // Report to teacher
    const teacherReport = await report_progress_to_teacher("mariana-lopez", "matematicas");
    expect(teacherReport.scoreBefore).toBe(52);
    expect(teacherReport.scoreAfter).toBe(80);
    expect(teacherReport.improvementDelta).toBe(28);
    expect(teacherReport.status).toBe("Mejora detectada");
    expect(teacherReport.reportText).toContain("Mariana López mostró una mejora notable");
  });
});
