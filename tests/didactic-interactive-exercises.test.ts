import { describe, it, expect, beforeEach } from "vitest";
import { repository } from "@/lib/data/repository";
import {
  evaluate_answer,
  adapt_difficulty,
  save_learning_evidence,
} from "@/lib/tools/tutor-tools";
import {
  normalizeOralMathText,
  findPreferredSpanishVoice,
  cancelGlobalSpeech,
} from "@/lib/hooks/use-speech";

describe("MACHTIA Adaptive Tutor - Interactive Didactic Exercises & Robot Tutor Integration", () => {
  beforeEach(() => {
    repository.resetToInitialState();
  });

  it("1. Ejercicio 1 (Visual Fraction Cards): Comprobación de equivalencia visual de 1/2 y 2/4", async () => {
    // Correct answer for 1/2 equivalent is 2/4
    const res = await evaluate_answer("ex-frac-1", "2/4", 1);
    expect(res.isCorrect).toBe(true);
    expect(res.feedback).toContain("1/2 = 2/4");
  });

  it("2. Ejercicio 2 (Manipulador Barra de Chocolate): 1 tercio equivale a 2 partes de seis (2/6)", async () => {
    // When student selects 2 chocolate pieces of 6
    const res = await evaluate_answer("ex-frac-2", "2 partes (2/6)", 1);
    expect(res.isCorrect).toBe(true);
    expect(res.feedback.toLowerCase()).toContain("equivalen a un tercio");
  });

  it("3. Ejercicio 3 (Tablero Relacional y Factor Común): Multiplicación por factor 2", async () => {
    const res = await evaluate_answer(
      "ex-frac-3",
      "Sí, porque si multiplicamos 2/5 por 2 arriba y abajo obtenemos 4/10",
      1
    );
    expect(res.isCorrect).toBe(true);
    expect(res.feedback.toLowerCase()).toContain("correcto");
  });

  it("4. Ejercicio 4 (Calculadora Productos Cruzados): 3x8 = 24 y 4x6 = 24", async () => {
    const res = await evaluate_answer(
      "ex-frac-4",
      "3/4 y 6/8 representan el mismo valor (3×8 = 24 y 4×6 = 24)",
      1
    );
    expect(res.isCorrect).toBe(true);
    expect(res.feedback.toLowerCase()).toContain("productos cruzados");
  });

  it("5. Ejercicio 5 (Simplificación Guiada): 6/9 simplificado entre divisor común 3 resulta en 2/3", async () => {
    const res = await evaluate_answer("ex-frac-5", "2/3", 1);
    expect(res.isCorrect).toBe(true);
    expect(res.feedback).toContain("2/3");
  });

  it("6. Andamiaje progresivo del Robot Tutor: Error en Intento 1 activa Pista sin respuesta", async () => {
    const res = await evaluate_answer("ex-frac-2", "1 parte (1/6)", 1);
    expect(res.isCorrect).toBe(false);
    expect(res.supportLevel).toBe("hint");
    expect(res.allowRetry).toBe(true);
    expect(res.hint).toBeDefined();
    // Does not give away the answer
    expect(res.hint).not.toContain("La respuesta correcta es");
    expect(res.hint).not.toContain("2 partes");
  });

  it("7. Andamiaje progresivo del Robot Tutor: Error en Intento 2 activa Explicación Alternativa cotidiana", async () => {
    const res = await evaluate_answer("ex-frac-2", "3 partes (3/6)", 2);
    expect(res.isCorrect).toBe(false);
    expect(res.supportLevel).toBe("alternative_explanation");
    expect(res.allowRetry).toBe(true);
    expect(res.alternativeExplanation).toBeDefined();
    expect(res.alternativeExplanation?.toLowerCase()).toContain("trozo");
    expect(res.alternativeExplanation).not.toContain("La respuesta correcta es");
  });

  it("8. Registro de evidencia didáctica calcula +28 puntos (52% -> 80%) y persiste para el docente", async () => {
    const practice = repository.getPractices()[0] || (await repository.savePractice({
      id: "prac-demo-test",
      title: "Práctica de apoyo: Fracciones equivalentes",
      description: "Práctica adaptativa",
      subjectId: "matematicas",
      topicId: "fracciones-equivalentes",
      topicName: "Fracciones equivalentes",
      studentId: "mariana-lopez",
      studentName: "Mariana López",
      exercises: [],
      status: "pending",
      createdAt: new Date().toISOString(),
    }));

    const evidence = await save_learning_evidence("mariana-lopez", practice.id, {
      score: 80,
      totalCorrect: 4,
      totalExercises: 5,
      masteredConcepts: [
        "Fracciones equivalentes",
        "Comparación visual con barras",
        "Amplificación por factor 2",
        "Productos cruzados",
      ],
      pendingConcepts: ["Simplificación de números mayores"],
    });

    expect(evidence.initialScore).toBe(52);
    expect(evidence.finalScore).toBe(80);
    expect(evidence.improvementDelta).toBe(28);
    expect(evidence.status).toBe("Mejora detectada");

    const student = repository.getStudentById("mariana-lopez");
    expect(student?.topicPerformances["fracciones-equivalentes"]).toBe(80);
  });

  it("9. Normalización fonética y matemática para TTS (Web Speech API)", () => {
    const raw1 = "¡Hola Mariana! 👋 Mira 1/2 y 2/4. ¿Son equivalentes?";
    const normalized1 = normalizeOralMathText(raw1);
    expect(normalized1).toContain("un medio");
    expect(normalized1).toContain("dos cuartos");
    expect(normalized1).not.toContain("👋");

    const raw2 = "Calcula 500 + 2 y observa 3 × 8 = 24.";
    const normalized2 = normalizeOralMathText(raw2);
    expect(normalized2).toContain("quinientos más dos");
    expect(normalized2).toContain("3 por 8 es igual a 24");

    const raw3 = "Comprobación de 6/9 simplificado a 2/3 en 3° B.";
    const normalized3 = normalizeOralMathText(raw3);
    expect(normalized3).toContain("seis novenos");
    expect(normalized3).toContain("dos tercios");
    expect(normalized3).toContain("tercero B");
  });

  it("10. Selección prioritaria de voces en español (es-MX femenina preferida)", () => {
    const mockVoices = [
      { name: "Microsoft David", lang: "en-US" } as SpeechSynthesisVoice,
      { name: "Google español", lang: "es-ES" } as SpeechSynthesisVoice,
      { name: "Microsoft Sabina - Spanish (Mexico)", lang: "es-MX" } as SpeechSynthesisVoice,
      { name: "Microsoft Raul - Spanish (Mexico)", lang: "es-MX" } as SpeechSynthesisVoice,
    ];

    const chosen = findPreferredSpanishVoice(mockVoices);
    expect(chosen).toBeDefined();
    expect(chosen?.name).toContain("Sabina");
    expect(chosen?.lang).toBe("es-MX");

    // Fallback scenario where only generic Spanish is available
    const fallbackVoices = [
      { name: "Google US English", lang: "en-US" } as SpeechSynthesisVoice,
      { name: "Spanish Spain", lang: "es-ES" } as SpeechSynthesisVoice,
    ];
    const fallbackChosen = findPreferredSpanishVoice(fallbackVoices);
    expect(fallbackChosen?.lang).toBe("es-ES");
  });

  it("11. Caso 4 de evaluación: Alumno acierta tras andamiaje y registra evidencia auténtica", async () => {
    // Attempt 1 fails
    const att1 = await evaluate_answer("ex-frac-1", "1/4", 1);
    expect(att1.isCorrect).toBe(false);
    expect(att1.supportLevel).toBe("hint");

    // Attempt 2 fails
    const att2 = await evaluate_answer("ex-frac-1", "1/3", 2);
    expect(att2.isCorrect).toBe(false);
    expect(att2.supportLevel).toBe("alternative_explanation");

    // Attempt 3 succeeds
    const att3 = await evaluate_answer("ex-frac-1", "2/4", 3);
    expect(att3.isCorrect).toBe(true);

    // Save actual score derived from 5 correct answers (100%)
    const practice = await repository.savePractice({
      id: "prac-test-authentic",
      title: "Práctica de apoyo",
      description: "Práctica adaptativa",
      subjectId: "matematicas",
      topicId: "fracciones-equivalentes",
      topicName: "Fracciones equivalentes",
      studentId: "mariana-lopez",
      studentName: "Mariana López",
      exercises: [],
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const evidence = await save_learning_evidence("mariana-lopez", practice.id, {
      score: 100,
      totalCorrect: 5,
      totalExercises: 5,
      masteredConcepts: ["Fracciones equivalentes", "Resolución con andamiaje"],
      pendingConcepts: [],
    });

    expect(evidence.initialScore).toBe(52);
    expect(evidence.finalScore).toBe(100);
    expect(evidence.improvementDelta).toBe(48);
    expect(evidence.status).toBe("Mejora detectada");
  });

  it("12. Cancelación global de audio safe-check", () => {
    // Must execute cleanly in node/vitest without throwing exceptions
    expect(() => cancelGlobalSpeech()).not.toThrow();
  });
});
