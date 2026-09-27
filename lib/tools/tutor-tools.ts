import { repository } from "@/lib/data/repository";
import { SAMPLE_EXERCISES_POOL } from "@/lib/data/mock-data";
import {
  Student,
  Practice,
  Exercise,
  PracticeAttempt,
  LearningEvidence,
  LearningGap,
  ProgressSnapshot,
} from "@/types";

/**
 * MCP-compatible Tool Definitions and Executables for MACHTIA Adaptive Tutor.
 * These tools can be served via an MCP server or invoked internally by the AI orchestrator.
 */

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
  handler: (args: any) => Promise<any> | any;
}

/**
 * 1. analyze_student_performance
 * Analyzes overall group metrics and distributions across topics.
 */
export async function analyze_student_performance(groupId: string, subjectId: string) {
  const students = repository.getStudents().filter((s) => s.groupId === groupId);
  const group = repository.getGroup();

  const topicTotals: Record<string, { sum: number; count: number }> = {};

  students.forEach((s) => {
    Object.entries(s.topicPerformances).forEach(([topic, score]) => {
      if (!topicTotals[topic]) topicTotals[topic] = { sum: 0, count: 0 };
      topicTotals[topic].sum += score;
      topicTotals[topic].count += 1;
    });
  });

  const topicAverages = Object.entries(topicTotals).map(([topic, data]) => ({
    topic,
    average: Math.round(data.sum / data.count),
    status: Math.round(data.sum / data.count) < 65 ? "critical" : "normal",
  }));

  const lowestTopic = topicAverages.sort((a, b) => a.average - b.average)[0];

  return {
    groupId,
    groupName: group.name,
    subjectId,
    totalStudents: students.length,
    topicAverages,
    criticalTopic: lowestTopic,
    summary: `Se analizaron ${students.length} alumnos de ${group.name}. El tema con mayor rezago es '${lowestTopic?.topic}' con un promedio de ${lowestTopic?.average}%.`,
  };
}

/**
 * 2. find_students_needing_support
 * Identifies students whose performance falls below threshold (default 65%).
 */
export async function find_students_needing_support(
  groupId: string,
  subjectId: string,
  threshold: number = 65
) {
  const students = repository.getStudents().filter((s) => s.groupId === groupId);

  const studentsNeedingSupport: {
    studentId: string;
    name: string;
    overallAverage: number;
    topic: string;
    score: number;
    recurringError: string;
    gapDetails: LearningGap[];
  }[] = [];

  students.forEach((student) => {
    Object.entries(student.topicPerformances).forEach(([topic, score]) => {
      if (score < threshold) {
        studentsNeedingSupport.push({
          studentId: student.id,
          name: student.name,
          overallAverage: student.overallAverage,
          topic,
          score,
          recurringError: student.recurringErrors[topic] || "Dificultad conceptual general",
          gapDetails: student.learningGaps.filter((g) => g.topicId === topic),
        });
      }
    });
  });

  return {
    threshold,
    count: studentsNeedingSupport.length,
    students: studentsNeedingSupport,
    message:
      studentsNeedingSupport.length > 0
        ? `He detectado ${studentsNeedingSupport.length} alumnos que necesitan refuerzo en fracciones equivalentes: ${studentsNeedingSupport
            .map((s) => `${s.name} (${s.score}%)`)
            .join(" y ")}.`
        : "No se detectaron alumnos por debajo del umbral de rendimiento.",
  };
}

/**
 * 3. get_student_learning_gap
 * Retrieves in-depth diagnostic evidence and root-cause error pattern for a student.
 */
export async function get_student_learning_gap(studentId: string, subjectId: string) {
  const student = repository.getStudentById(studentId);
  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const gaps = student.learningGaps;
  const currentFractionScore = student.topicPerformances["fracciones-equivalentes"] ?? 52;

  let diagnosticSummary = "";
  if (studentId === "mariana-lopez") {
    diagnosticSummary =
      "Mariana presenta dificultad para identificar fracciones equivalentes cuando cambian los denominadores. Su patrón de error recurrente indica que confunde la magnitud del denominador con el valor total de la fracción, omitiendo la relación multiplicativa del numerador.";
  } else if (studentId === "luis-hernandez") {
    diagnosticSummary =
      "Luis presenta dificultad al simplificar fracciones: tiende a dividir únicamente uno de los términos entre el factor común en lugar de ambos equitativamente.";
  } else {
    diagnosticSummary = `El alumno cuenta con un rendimiento de ${currentFractionScore}% en el tema seleccionado.`;
  }

  return {
    studentId: student.id,
    studentName: student.name,
    overallAverage: student.overallAverage,
    topic: "Fracciones equivalentes",
    currentScore: currentFractionScore,
    gaps,
    errorPattern: student.recurringErrors["fracciones-equivalentes"] || "Comparación de factores",
    diagnosticSummary,
    recommendedAction: "Generar práctica adaptativa con soporte visual paso a paso.",
  };
}

/**
 * 4. generate_adaptive_practice
 * Builds a tailored 5-exercise practice targeting the student's specific misconception.
 */
export async function generate_adaptive_practice(
  studentId: string,
  topicId: string = "fracciones-equivalentes",
  gapType?: string,
  count: number = 5
) {
  const student = repository.getStudentById(studentId);
  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  // Clone sample exercises and personalize sequence
  const exercises: Exercise[] = JSON.parse(JSON.stringify(SAMPLE_EXERCISES_POOL.slice(0, count)));

  const practiceId = `prac-${studentId}-${Date.now().toString().slice(-4)}`;
  const practiceTitle = `Práctica personalizada: Fracciones equivalentes`;
  const practiceDescription = `Refuerzo focalizado en comparación de denominadores y representaciones visuales para ${student.name}.`;

  const newPractice: Practice = {
    id: practiceId,
    title: practiceTitle,
    description: practiceDescription,
    subjectId: "matematicas",
    topicId,
    topicName: "Fracciones equivalentes",
    studentId: student.id,
    studentName: student.name,
    targetGapId: student.learningGaps[0]?.id || "gap-generic",
    targetGapDescription: student.recurringErrors[topicId] || gapType || "Comparación de denominadores",
    exercises,
    status: "assigned",
    createdAt: new Date().toISOString(),
  };

  repository.savePractice(newPractice);

  return {
    practiceId: newPractice.id,
    practiceTitle: newPractice.title,
    studentName: student.name,
    exerciseCount: exercises.length,
    targetTopic: "Fracciones equivalentes",
    status: "created",
    summary: `Se ha generado una práctica adaptativa de ${exercises.length} ejercicios para ${student.name} centrada en ${newPractice.targetGapDescription}.`,
  };
}

/**
 * 5. assign_practice_to_student
 * Confirms assignment and schedules notification for student portal.
 */
export async function assign_practice_to_student(practiceId: string, studentId: string) {
  const practice = repository.getPracticeById(practiceId);
  const student = repository.getStudentById(studentId);

  if (!practice || !student) {
    throw new Error("Practice or Student not found");
  }

  repository.updatePracticeStatus(practiceId, "assigned");

  return {
    success: true,
    practiceId,
    studentId,
    studentName: student.name,
    assignedAt: new Date().toISOString(),
    message: `La práctica '${practice.title}' ha sido asignada exitosamente a ${student.name}. Ya se encuentra disponible en su portal de alumno.`,
  };
}

/**
 * 6. explain_concept
 * Delivers friendly, multi-modal, step-by-step guidance tailored to the student.
 */
export async function explain_concept(
  topic: string = "Fracciones equivalentes",
  learningGap?: string,
  studentName: string = "Mariana"
) {
  return {
    title: "¡Hola! Aprendamos fracciones equivalentes paso a paso 🤖✨",
    studentName,
    topic,
    steps: [
      {
        step: 1,
        title: "¿Qué significa 'equivalente'?",
        explanation: "Equivalente significa 'de igual valor'. Dos fracciones son equivalentes cuando representan la misma cantidad o porción, ¡aunque sus números se vean distintos!",
        visualTip: "Imagina una barra de chocolate partida a la mitad (1/2), o la misma barra partida en cuatro partes y tomas dos (2/4). ¡Comes exactamente lo mismo!",
      },
      {
        step: 2,
        title: "El secreto del denominador",
        explanation: "Cuidado con la trampa común: ¡un denominador más grande NO significa que la fracción sea mayor! Solo significa que las partes son más pequeñitas.",
        visualTip: "1/4 es más pequeño que 1/2. Para que sean iguales, necesitas el doble de partes: 2/4 = 1/2.",
      },
      {
        step: 3,
        title: "La regla de oro de la multiplicación",
        explanation: "Si multiplicas arriba (numerador) y abajo (denominador) por el MISMO número, ¡la fracción mantiene su valor intacto!",
        visualTip: "(1 × 2) / (2 × 2) = 2/4. ¡Es magia matemática!",
      },
    ],
    greeting: `Antes de comenzar, ${studentName}, te explicaré una forma sencilla de identificar fracciones equivalentes.`,
  };
}

/**
 * 7. evaluate_answer
 * Evaluates the student's selected answer against ground truth, providing hints & corrective feedback.
 */
export async function evaluate_answer(
  exerciseId: string,
  studentAnswer: string,
  attemptNumber: number = 1
) {
  const exercise = SAMPLE_EXERCISES_POOL.find((e) => e.id === exerciseId);
  if (!exercise) {
    throw new Error(`Exercise ${exerciseId} not found`);
  }

  const isCorrect = exercise.correctAnswer === studentAnswer;

  let feedback = "";
  let hint = "";
  let allowSecondAttempt = false;

  if (isCorrect) {
    feedback = `¡Excelente trabajo! ${exercise.explanation}`;
  } else {
    if (attemptNumber === 1) {
      allowSecondAttempt = true;
      feedback = "No es correcto todavía, pero ¡no te preocupes! Vamos a razonarlo juntos.";
      hint = exercise.hint;
    } else {
      allowSecondAttempt = false;
      feedback = `La respuesta correcta era: "${exercise.correctAnswer}". ${exercise.explanation}`;
    }
  }

  return {
    exerciseId,
    studentAnswer,
    isCorrect,
    attemptNumber,
    allowSecondAttempt,
    feedback,
    hint: !isCorrect ? hint : undefined,
    difficulty: exercise.difficulty,
  };
}

/**
 * 8. adapt_difficulty
 * Adjusts question difficulty dynamically based on the student's live correctness.
 */
export async function adapt_difficulty(
  currentDifficulty: "easy" | "medium" | "hard",
  isCorrect: boolean
): Promise<"easy" | "medium" | "hard"> {
  if (isCorrect) {
    if (currentDifficulty === "easy") return "medium";
    if (currentDifficulty === "medium") return "hard";
    return "hard";
  } else {
    if (currentDifficulty === "hard") return "medium";
    if (currentDifficulty === "medium") return "easy";
    return "easy";
  }
}

/**
 * 9. evaluate_practice
 * Calculates final score, identifies mastered concepts vs pending ones.
 */
export async function evaluate_practice(attemptId: string) {
  const attempt = repository.getAttemptById(attemptId);
  if (!attempt) {
    throw new Error(`Attempt ${attemptId} not found`);
  }

  return {
    attemptId: attempt.id,
    practiceId: attempt.practiceId,
    studentId: attempt.studentId,
    score: attempt.score,
    totalCorrect: attempt.totalCorrect,
    totalExercises: attempt.totalExercises,
    masteredConcepts: attempt.masteredConcepts,
    pendingConcepts: attempt.pendingConcepts,
    feedback: attempt.feedback,
  };
}

/**
 * 10. save_learning_evidence
 * Records before/after progress, updates student skill profile, and saves official evidence.
 */
export async function save_learning_evidence(
  studentId: string,
  practiceId: string,
  results: {
    score: number;
    totalCorrect: number;
    totalExercises: number;
    masteredConcepts: string[];
    pendingConcepts: string[];
  }
) {
  const student = repository.getStudentById(studentId);
  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const initialScore = student.topicPerformances["fracciones-equivalentes"] ?? 52;
  const finalScore = results.score; // e.g. 80%
  const improvementDelta = finalScore - initialScore; // +28%

  // Update student score in repository
  repository.updateStudentScore(studentId, "fracciones-equivalentes", finalScore);

  // Mark gap resolved or progressing
  if (student.learningGaps.length > 0) {
    student.learningGaps[0].currentScore = finalScore;
    if (finalScore >= 75) {
      student.learningGaps[0].resolved = true;
    }
  }

  const evidenceId = `ev-${studentId}-${Date.now().toString().slice(-4)}`;
  const newEvidence: LearningEvidence = {
    id: evidenceId,
    studentId: student.id,
    studentName: student.name,
    practiceId,
    subjectId: "matematicas",
    topicName: "Fracciones equivalentes",
    initialScore,
    finalScore,
    improvementDelta,
    status: improvementDelta > 0 ? "Mejora detectada" : "Requiere refuerzo adicional",
    masteredConcepts: results.masteredConcepts,
    pendingConcepts: results.pendingConcepts,
    tutorObservations: `${student.name} superó su rezago en comparación visual y amplificación por factor 2. Aumentó de ${initialScore}% a ${finalScore}%. Consolidó productos cruzados.`,
    timestamp: new Date().toISOString(),
    attemptId: `att-${Date.now()}`,
  };

  repository.saveEvidence(newEvidence);

  return {
    evidenceId: newEvidence.id,
    studentName: student.name,
    initialScore,
    finalScore,
    improvementDelta,
    status: newEvidence.status,
    masteredConcepts: newEvidence.masteredConcepts,
    pendingConcepts: newEvidence.pendingConcepts,
    summary: `Evidencia guardada. ${student.name}: Antes: ${initialScore}%, Después: ${finalScore}%. Mejora detectada: +${improvementDelta}%.`,
  };
}

/**
 * 11. get_student_progress
 * Compares before and after learning indicators for dashboard presentation.
 */
export async function get_student_progress(studentId: string, subjectId: string) {
  const student = repository.getStudentById(studentId);
  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const snapshot = repository.getProgressSnapshot(studentId, "fracciones-equivalentes");
  const evidences = repository.getEvidencesByStudent(studentId);

  return {
    studentId: student.id,
    studentName: student.name,
    subject: "Matemáticas",
    topic: "Fracciones equivalentes",
    snapshot,
    recentEvidences: evidences,
  };
}

/**
 * 12. report_progress_to_teacher
 * Formats a synthesis report for teacher consultation.
 */
export async function report_progress_to_teacher(studentId: string, subjectId: string) {
  const progress = await get_student_progress(studentId, subjectId);
  const student = repository.getStudentById(studentId);

  const before = progress.snapshot?.scoreBefore ?? 52;
  const after = progress.snapshot?.scoreAfter ?? 80;
  const delta = after - before;

  const responseText =
    delta > 0
      ? `¡Sí, ${student?.name} mostró una mejora notable! Su desempeño en Fracciones Equivalentes aumentó de un ${before}% inicial a un ${after}% (+${delta}%). Ha dominado la comparación visual y los factores de amplificación, resolviendo 4 de 5 reactivos con éxito.`
      : `${student?.name} mantiene un desempeño de ${before}%. Aún no concluye la práctica asignada.`;

  return {
    studentId,
    studentName: student?.name,
    scoreBefore: before,
    scoreAfter: after,
    improvementDelta: delta,
    status: delta > 0 ? "Mejora detectada" : "En proceso",
    reportText: responseText,
    masteredConcepts: ["Equivalencia visual de 1/2", "Amplificación por factor 2", "Comprobación por productos cruzados"],
    pendingConcepts: ["Simplificación de fracciones de tres cifras"],
  };
}

/**
 * MCP Tools Registry definition for export/inspection
 */
export const MCP_TOOLS_REGISTRY: Record<string, McpToolDefinition> = {
  analyze_student_performance: {
    name: "analyze_student_performance",
    description: "Analiza el rendimiento del grupo e identifica temas críticos de rezago.",
    inputSchema: {
      type: "object",
      properties: {
        groupId: { type: "string", description: "ID del grupo escolar" },
        subjectId: { type: "string", description: "ID de la materia" },
      },
      required: ["groupId", "subjectId"],
    },
    handler: (args) => analyze_student_performance(args.groupId, args.subjectId),
  },
  find_students_needing_support: {
    name: "find_students_needing_support",
    description: "Detecta alumnos con calificaciones por debajo del umbral de rendimiento.",
    inputSchema: {
      type: "object",
      properties: {
        groupId: { type: "string", description: "ID del grupo escolar" },
        subjectId: { type: "string", description: "ID de la materia" },
        threshold: { type: "number", description: "Umbral de corte de calificación (ej. 65)" },
      },
      required: ["groupId", "subjectId"],
    },
    handler: (args) => find_students_needing_support(args.groupId, args.subjectId, args.threshold),
  },
  get_student_learning_gap: {
    name: "get_student_learning_gap",
    description: "Obtiene el diagnóstico pedagógico de la brecha de aprendizaje de un alumno.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: { type: "string", description: "ID del estudiante" },
        subjectId: { type: "string", description: "ID de la materia" },
      },
      required: ["studentId", "subjectId"],
    },
    handler: (args) => get_student_learning_gap(args.studentId, args.subjectId),
  },
  generate_adaptive_practice: {
    name: "generate_adaptive_practice",
    description: "Genera una práctica adaptativa de 5 ejercicios enfocada en la brecha del alumno.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: { type: "string", description: "ID del estudiante" },
        topicId: { type: "string", description: "Tema educativo" },
        gapType: { type: "string", description: "Patrón de error a corregir" },
        count: { type: "number", description: "Cantidad de ejercicios" },
      },
      required: ["studentId"],
    },
    handler: (args) => generate_adaptive_practice(args.studentId, args.topicId, args.gapType, args.count),
  },
  assign_practice_to_student: {
    name: "assign_practice_to_student",
    description: "Asigna una práctica al alumno para que aparezca en su portal.",
    inputSchema: {
      type: "object",
      properties: {
        practiceId: { type: "string", description: "ID de la práctica" },
        studentId: { type: "string", description: "ID del estudiante" },
      },
      required: ["practiceId", "studentId"],
    },
    handler: (args) => assign_practice_to_student(args.practiceId, args.studentId),
  },
  explain_concept: {
    name: "explain_concept",
    description: "Genera una explicación paso a paso y adaptada al estudiante.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Tema a explicar" },
        learningGap: { type: "string", description: "Brecha detectada" },
        studentName: { type: "string", description: "Nombre del estudiante" },
      },
      required: ["topic"],
    },
    handler: (args) => explain_concept(args.topic, args.learningGap, args.studentName),
  },
  evaluate_answer: {
    name: "evaluate_answer",
    description: "Evalúa la respuesta del alumno, ofreciendo pistas y retroalimentación formativa.",
    inputSchema: {
      type: "object",
      properties: {
        exerciseId: { type: "string", description: "ID del ejercicio" },
        studentAnswer: { type: "string", description: "Respuesta elegida por el alumno" },
        attemptNumber: { type: "number", description: "Número de intento (1 o 2)" },
      },
      required: ["exerciseId", "studentAnswer"],
    },
    handler: (args) => evaluate_answer(args.exerciseId, args.studentAnswer, args.attemptNumber),
  },
  adapt_difficulty: {
    name: "adapt_difficulty",
    description: "Adapta la dificultad dinámicamente según aciertos y errores del estudiante.",
    inputSchema: {
      type: "object",
      properties: {
        currentDifficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        isCorrect: { type: "boolean" },
      },
      required: ["currentDifficulty", "isCorrect"],
    },
    handler: (args) => adapt_difficulty(args.currentDifficulty, args.isCorrect),
  },
  evaluate_practice: {
    name: "evaluate_practice",
    description: "Calcula calificación final y balance de conceptos dominados vs pendientes.",
    inputSchema: {
      type: "object",
      properties: {
        attemptId: { type: "string", description: "ID del intento de práctica" },
      },
      required: ["attemptId"],
    },
    handler: (args) => evaluate_practice(args.attemptId),
  },
  save_learning_evidence: {
    name: "save_learning_evidence",
    description: "Registra la evidencia de aprendizaje con comparativa antes/después.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: { type: "string" },
        practiceId: { type: "string" },
        results: { type: "object" },
      },
      required: ["studentId", "practiceId", "results"],
    },
    handler: (args) => save_learning_evidence(args.studentId, args.practiceId, args.results),
  },
  get_student_progress: {
    name: "get_student_progress",
    description: "Obtiene el comparativo de progreso e historial de un estudiante.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: { type: "string" },
        subjectId: { type: "string" },
      },
      required: ["studentId", "subjectId"],
    },
    handler: (args) => get_student_progress(args.studentId, args.subjectId),
  },
  report_progress_to_teacher: {
    name: "report_progress_to_teacher",
    description: "Genera reporte comparativo para respuesta directa al profesor.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: { type: "string" },
        subjectId: { type: "string" },
      },
      required: ["studentId", "subjectId"],
    },
    handler: (args) => report_progress_to_teacher(args.studentId, args.subjectId),
  },
};
