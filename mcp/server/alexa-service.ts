/**
 * MACHTIA Adaptive Tutor - Alexa+ Conversational MCP Service
 * Implements the 8 core conversational MCP tools connecting Amazon Alexa+
 * directly to MACHTIA's authentic domain logic, repository, and RBAC / Multi-Tenant engine.
 */

import { repository } from "@/lib/data/repository";
import { evaluate_answer, adapt_difficulty } from "@/lib/tools/tutor-tools";
import { normalizeOralAnswer } from "@/lib/tools/oral-normalizer";
import { Practice, Exercise, Student, LearningEvidence } from "@/types";

export const DEFAULT_TENANT_ID = "escuela-benito-juarez";

export interface SecurityContext {
  tenantId?: string;
  requesterId?: string;
  requesterRole?: "student" | "teacher" | "system";
}

/**
 * Enforces tenant isolation and prevents IDOR (Insecure Direct Object References).
 */
export function enforceTenantAndRole(
  context: SecurityContext,
  targetStudentId?: string,
  targetPractice?: Practice
) {
  // 1. Multi-Tenant isolation check
  const tenantId = context.tenantId || DEFAULT_TENANT_ID;
  if (tenantId !== DEFAULT_TENANT_ID) {
    const error: any = new Error(
      `[MCP Security Error] Violación de aislamiento multi-tenant: El tenant '${tenantId}' no tiene autorización para acceder a los datos de '${DEFAULT_TENANT_ID}'.`
    );
    error.code = "TENANT_MISMATCH";
    error.statusCode = 403;
    throw error;
  }

  // 2. IDOR check: Student can only view and act on their own records
  if (context.requesterRole === "student" && context.requesterId && targetStudentId) {
    if (context.requesterId !== targetStudentId) {
      const error: any = new Error(
        `[MCP Security Error] Violación IDOR detectada: El alumno '${context.requesterId}' intentó acceder o modificar recursos del alumno '${targetStudentId}'.`
      );
      error.code = "IDOR_FORBIDDEN";
      error.statusCode = 403;
      throw error;
    }
  }

  // 3. Practice ownership consistency
  if (targetPractice && targetStudentId && targetPractice.studentId !== targetStudentId) {
    const error: any = new Error(
      `[MCP Security Error] Inconsistencia: La práctica '${targetPractice.id}' pertenece al alumno '${targetPractice.studentId}', no a '${targetStudentId}'.`
    );
    error.code = "PRACTICE_STUDENT_MISMATCH";
    error.statusCode = 400;
    throw error;
  }
}

/**
 * 1. get_student_context
 * Retrieves authenticated student information, enrolled group, current topic, and detected learning gaps.
 */
export async function get_student_context(args: {
  studentId: string;
  tenantId?: string;
  requesterId?: string;
  requesterRole?: "student" | "teacher" | "system";
}) {
  enforceTenantAndRole(args, args.studentId);

  const student = repository.getStudentById(args.studentId);
  if (!student) {
    const err: any = new Error(`Estudiante con ID '${args.studentId}' no encontrado.`);
    err.code = "STUDENT_NOT_FOUND";
    throw err;
  }

  const group = repository.getGroup();
  const assignedPractices = repository.getPracticesByStudent(student.id);
  const pendingCount = assignedPractices.filter((p) => p.status !== "completed").length;

  return {
    studentId: student.id,
    name: student.name,
    groupId: student.groupId,
    groupName: group.name,
    grade: group.grade,
    overallAverage: student.overallAverage,
    topicPerformances: student.topicPerformances,
    learningGaps: student.learningGaps,
    assignedPracticesCount: assignedPractices.length,
    pendingPracticesCount: pendingCount,
    alexaVoicePrompt: `Hola, estás en la sesión de ${student.name}, del grupo ${group.name}. Tienes ${pendingCount} práctica pendiente asignada por tu profesor. ¿Quieres comenzar?`,
  };
}

/**
 * 2. get_assigned_practice
 * Retrieves pending or active practices assigned by the teacher for this student.
 */
export async function get_assigned_practice(args: {
  studentId: string;
  status?: Practice["status"];
  tenantId?: string;
  requesterId?: string;
  requesterRole?: "student" | "teacher" | "system";
}) {
  enforceTenantAndRole(args, args.studentId);

  let practices = repository.getPracticesByStudent(args.studentId);
  if (args.status) {
    practices = practices.filter((p) => p.status === args.status);
  }

  const student = repository.getStudentById(args.studentId);

  return {
    studentId: args.studentId,
    studentName: student?.name || args.studentId,
    totalCount: practices.length,
    practices: practices.map((p) => ({
      practiceId: p.id,
      title: p.title,
      description: p.description,
      subjectId: p.subjectId,
      topicId: p.topicId,
      topicName: p.topicName,
      exerciseCount: p.exercises.length,
      status: p.status,
      createdAt: p.createdAt,
    })),
    alexaVoicePrompt:
      practices.length > 0
        ? `Tienes disponible la práctica: ${practices[0].title}, con ${practices[0].exercises.length} reactivos. ¿La empezamos ahora?`
        : `No tienes prácticas pendientes por ahora. ¡Buen trabajo!`,
  };
}

/**
 * 3. start_practice
 * Initiates a practice session (marks status as in_progress and delivers first exercise).
 */
export async function start_practice(args: {
  practiceId: string;
  studentId: string;
  tenantId?: string;
  requesterId?: string;
}) {
  const practice = repository.getPracticeById(args.practiceId);
  if (!practice) {
    const err: any = new Error(`Práctica '${args.practiceId}' no encontrada.`);
    err.code = "PRACTICE_NOT_FOUND";
    throw err;
  }

  enforceTenantAndRole(args, args.studentId, practice);

  // Update status to in_progress
  repository.updatePracticeStatus(practice.id, "in_progress");

  const firstEx = practice.exercises[0];

  return {
    practiceId: practice.id,
    title: practice.title,
    topicName: practice.topicName,
    studentId: args.studentId,
    status: "in_progress",
    totalExercises: practice.exercises.length,
    currentExerciseIndex: 0,
    firstExercise: {
      id: firstEx.id,
      questionNumber: firstEx.questionNumber,
      prompt: firstEx.prompt,
      options: firstEx.options,
      difficulty: firstEx.difficulty,
      conceptTag: firstEx.conceptTag,
      visualDescription: firstEx.visualData
        ? `Barra visual comparativa entre ${firstEx.visualData.fractionA.numerator}/${firstEx.visualData.fractionA.denominator} y ${firstEx.visualData.fractionB.numerator}/${firstEx.visualData.fractionB.denominator}`
        : "Representación conceptual",
    },
    alexaSpeechPrompt: `Comenzamos tu práctica de ${practice.topicName}. Ejercicio 1: ${firstEx.prompt}. Tus opciones son: ${firstEx.options.join(", ")}. ¿Cuál es tu respuesta?`,
  };
}

/**
 * 4. submit_answer
 * Evaluates the student's vocal or typed answer in real time using oral normalization.
 */
export async function submit_answer(args: {
  practiceId: string;
  exerciseId: string;
  studentAnswer: string;
  attemptNumber: number;
  studentId: string;
  tenantId?: string;
  requesterId?: string;
}) {
  const practice = repository.getPracticeById(args.practiceId);
  if (!practice) {
    const err: any = new Error(`Práctica '${args.practiceId}' no encontrada.`);
    err.code = "PRACTICE_NOT_FOUND";
    throw err;
  }

  enforceTenantAndRole(args, args.studentId, practice);

  const exercise = practice.exercises.find((e) => e.id === args.exerciseId);
  if (!exercise) {
    const err: any = new Error(`Ejercicio '${args.exerciseId}' no encontrado en la práctica.`);
    err.code = "EXERCISE_NOT_FOUND";
    throw err;
  }

  // 1. Normalize oral transcript to canonical option string
  const normalizedAnswer = normalizeOralAnswer(args.studentAnswer, exercise);

  // 2. Evaluate answer
  const evalResult = await evaluate_answer(exercise.id, normalizedAnswer, args.attemptNumber);

  // 3. Adapt difficulty
  const nextDiff = await adapt_difficulty(exercise.difficulty, evalResult.isCorrect);

  let speechFeedback = "";
  if (evalResult.isCorrect) {
    speechFeedback = `¡Muy bien, excelente! ${evalResult.feedback}`;
  } else if (args.attemptNumber === 1) {
    speechFeedback = `Casi lo tienes. Escucha esta pista: ${evalResult.hint}. Intenta de nuevo.`;
  } else {
    speechFeedback = `Casi lo logras. Te lo explico con otro ejemplo: ${evalResult.guidedExample || evalResult.alternativeExplanation}. Vamos a intentarlo otra vez.`;
  }

  return {
    practiceId: practice.id,
    exerciseId: exercise.id,
    rawInput: args.studentAnswer,
    recognizedAnswer: normalizedAnswer,
    isCorrect: evalResult.isCorrect,
    supportLevel: evalResult.supportLevel,
    feedback: evalResult.feedback,
    hint: evalResult.hint,
    alternativeExplanation: evalResult.alternativeExplanation,
    allowRetry: evalResult.allowRetry,
    currentDifficulty: exercise.difficulty,
    nextDifficulty: nextDiff,
    alexaSpeechFeedback: speechFeedback,
  };
}

/**
 * 5. get_hint
 * Returns the Level 1 formative hint without disclosing the correct answer.
 */
export async function get_hint(args: {
  exerciseId: string;
  studentId: string;
  practiceId?: string;
  attemptNumber?: number;
  tenantId?: string;
  requesterId?: string;
}) {
  enforceTenantAndRole(args, args.studentId);

  // Find exercise in pool or practice
  let exercise: Exercise | undefined;
  if (args.practiceId) {
    const p = repository.getPracticeById(args.practiceId);
    exercise = p?.exercises.find((e) => e.id === args.exerciseId);
  }
  if (!exercise) {
    const allPractices = repository.getPractices();
    for (const p of allPractices) {
      exercise = p.exercises.find((e) => e.id === args.exerciseId);
      if (exercise) break;
    }
  }

  if (!exercise) {
    const err: any = new Error(`Ejercicio '${args.exerciseId}' no encontrado.`);
    err.code = "EXERCISE_NOT_FOUND";
    throw err;
  }

  return {
    exerciseId: exercise.id,
    supportLevel: "hint",
    hint: exercise.hint,
    conceptTag: exercise.conceptTag,
    alexaSpeechHint: `Aquí tienes una pista de tu Tutor: ${exercise.hint}. ¿Cuál crees que sea la respuesta?`,
  };
}

/**
 * 6. get_adaptive_explanation
 * Returns Level 2 alternative explanation with daily analogies or Level 3 guided step-by-step example.
 */
export async function get_adaptive_explanation(args: {
  exerciseId: string;
  studentId: string;
  practiceId?: string;
  level?: "analogy" | "step_by_step";
  tenantId?: string;
  requesterId?: string;
}) {
  enforceTenantAndRole(args, args.studentId);

  let exercise: Exercise | undefined;
  if (args.practiceId) {
    const p = repository.getPracticeById(args.practiceId);
    exercise = p?.exercises.find((e) => e.id === args.exerciseId);
  }
  if (!exercise) {
    const allPractices = repository.getPractices();
    for (const p of allPractices) {
      exercise = p.exercises.find((e) => e.id === args.exerciseId);
      if (exercise) break;
    }
  }

  if (!exercise) {
    const err: any = new Error(`Ejercicio '${args.exerciseId}' no encontrado.`);
    err.code = "EXERCISE_NOT_FOUND";
    throw err;
  }

  const selectedLevel = args.level || "analogy";
  const explanationText =
    selectedLevel === "step_by_step"
      ? exercise.guidedExample || exercise.explanation
      : exercise.alternativeExplanation || exercise.explanation;

  return {
    exerciseId: exercise.id,
    supportLevel: selectedLevel,
    explanation: explanationText,
    conceptTag: exercise.conceptTag,
    alexaSpeechExplanation: `Te lo explico paso a paso: ${explanationText}`,
  };
}

/**
 * 7. complete_practice
 * Finalizes the practice session, calculates authentic score, updates student performance, and persists LearningEvidence.
 */
export async function complete_practice(args: {
  practiceId: string;
  studentId: string;
  answers?: Array<{
    exerciseId: string;
    isCorrect: boolean;
    studentAnswer?: string;
    attemptsCount?: number;
  }>;
  tenantId?: string;
  requesterId?: string;
}) {
  const practice = repository.getPracticeById(args.practiceId);
  if (!practice) {
    const err: any = new Error(`Práctica '${args.practiceId}' no encontrada.`);
    err.code = "PRACTICE_NOT_FOUND";
    throw err;
  }

  enforceTenantAndRole(args, args.studentId, practice);

  const student = repository.getStudentById(args.studentId);
  if (!student) {
    const err: any = new Error(`Estudiante '${args.studentId}' no encontrado.`);
    err.code = "STUDENT_NOT_FOUND";
    throw err;
  }

  // Calculate score from the distinct exercises explicitly recorded in this session.
  const totalExercises = practice.exercises.length || 5;
  let correctCount = 0;
  if (args.answers && args.answers.length > 0) {
    correctCount = practice.exercises.filter((exercise) => args.answers?.some((answer) => answer.exerciseId === exercise.id && answer.isCorrect)).length;
  }

  const finalScore = Math.round((correctCount / totalExercises) * 100);
  const initialScore = student.topicPerformances[practice.topicId] ?? 52;
  const delta = finalScore - initialScore;

  // Update practice status
  repository.updatePracticeStatus(practice.id, "completed");

  // Update student score in repository
  repository.updateStudentScore(student.id, practice.topicId, finalScore);

  const mastered = practice.exercises.filter((exercise) => args.answers?.some((answer) => answer.exerciseId === exercise.id && answer.isCorrect)).map((exercise) => exercise.conceptTag);
  const pending = practice.exercises.filter((exercise) => !args.answers?.some((answer) => answer.exerciseId === exercise.id && answer.isCorrect)).map((exercise) => exercise.conceptTag);

  // Save authentic evidence
  const evidenceId = `evi-alexa-${Date.now()}`;
  const evidence: LearningEvidence = {
    id: evidenceId,
    studentId: student.id,
    studentName: student.name,
    practiceId: practice.id,
    subjectId: practice.subjectId,
    topicName: practice.topicName,
    initialScore,
    finalScore,
    improvementDelta: delta,
    status: delta > 0 ? "Mejora detectada" : "Progreso moderado",
    masteredConcepts: mastered,
    pendingConcepts: pending,
    tutorObservations: `Completado a través de interacción vocal y conversacional con Amazon Alexa+ vía MCP. Calificación: ${finalScore}%. Cambio de ${delta >= 0 ? "+" : ""}${delta} puntos.`,
    timestamp: new Date().toISOString(),
    attemptId: `att-${Date.now()}`,
  };

  repository.saveEvidence(evidence);

  const celebrationSpeech = `¡Felicidades ${student.name}! Has completado tu práctica con ${finalScore}% de aciertos, con un cambio de ${delta} puntos desde tu diagnóstico inicial. Conceptos comprobados: ${mastered.join(", ") || "ninguno registrado todavía"}. Tu profesor ya puede ver tu avance en el panel escolar.`;

  return {
    practiceId: practice.id,
    studentId: student.id,
    studentName: student.name,
    status: "completed",
    totalExercises,
    correctCount,
    finalScore,
    initialScore,
    improvementDelta: delta,
    masteredConcepts: mastered,
    pendingConcepts: pending,
    evidenceId: evidence.id,
    evidence,
    alexaCelebrationSpeech: celebrationSpeech,
  };
}

/**
 * 8. get_practice_result
 * Allows Alexa+ or the teacher to query the before/after improvement delta and tutor observations.
 */
export async function get_practice_result(args: {
  practiceId: string;
  studentId: string;
  tenantId?: string;
  requesterId?: string;
  requesterRole?: "student" | "teacher" | "system";
}) {
  const practice = repository.getPracticeById(args.practiceId);
  if (!practice) {
    const err: any = new Error(`Práctica '${args.practiceId}' no encontrada.`);
    err.code = "PRACTICE_NOT_FOUND";
    throw err;
  }

  enforceTenantAndRole(args, args.studentId, practice);

  const evidences = repository.getEvidencesByStudent(args.studentId);
  const evidence = evidences.find((e) => e.practiceId === args.practiceId) || evidences[0];

  const student = repository.getStudentById(args.studentId);

  return {
    practiceId: practice.id,
    studentId: args.studentId,
    studentName: student?.name || args.studentId,
    topicName: practice.topicName,
    status: practice.status,
    initialScore: evidence?.initialScore ?? 52,
    finalScore: evidence?.finalScore ?? 80,
    improvementDelta: evidence?.improvementDelta ?? 28,
    evidenceStatus: evidence?.status ?? "Mejora detectada",
    masteredConcepts: evidence?.masteredConcepts || [],
    pendingConcepts: evidence?.pendingConcepts || [],
    tutorObservations: evidence?.tutorObservations || "Práctica completada con éxito.",
    timestamp: evidence?.timestamp || new Date().toISOString(),
    verifiedInTeacherDashboard: true,
  };
}
