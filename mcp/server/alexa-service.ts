/**
 * MACHTIA Adaptive Tutor - Alexa+ Conversational MCP Service
 * Implements the 8 core conversational MCP tools connecting Amazon Alexa+
 * directly to MACHTIA's authentic domain logic, repository, and RBAC / Multi-Tenant engine.
 */

import { repository } from "@/lib/data/repository";
import { authorizeTool } from "./session";
import { ledger, safeSupport } from "./learning-ledger";
import { normalizeOralAnswer } from "@/lib/tools/oral-normalizer";
import { Practice, LearningEvidence } from "@/types";

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
  authorizeTool("get_student_context", { ...context, studentId: targetStudentId, practiceId: targetPractice?.id });

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

  if (practice.status === "completed") throw new Error("Practice already completed");
  ledger(practice.id);
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
    alexaSpeechPrompt: `Antes de comenzar: ${safeSupport(practice.topicName, 1)}. Practicaremos con apoyo progresivo. Ejercicio 1: ${firstEx.prompt}. Tus opciones son: ${firstEx.options.join(", ")}. ¿Cuál es tu respuesta?`,
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

  if (practice.status === "completed") throw new Error("Practice already completed");
  const record = ledger(practice.id);
  const previous = record.answers.filter(a => a.exerciseId === exercise.id);
  if (previous.some(a => a.isCorrect) || previous.length >= 3) throw new Error("Exercise already resolved");
  const current = practice.exercises.find(e => !record.answers.some(a => a.exerciseId === e.id && a.isCorrect) && record.answers.filter(a => a.exerciseId === e.id).length < 3);
  if (current?.id !== exercise.id) throw new Error("Answer the current exercise first");
  repository.updatePracticeStatus(practice.id, "in_progress");
  const normalizedAnswer = normalizeOralAnswer(args.studentAnswer, exercise);
  const isCorrect = normalizedAnswer.trim().toLocaleLowerCase() === exercise.correctAnswer.trim().toLocaleLowerCase();
  const attemptNumber = previous.length + 1;
  record.answers.push({ exerciseId: exercise.id, studentAnswer: normalizedAnswer, isCorrect, attemptsCount: attemptNumber, hintsUsed: !isCorrect });
  if (!isCorrect) record.supports.push({ exerciseId: exercise.id, kind: attemptNumber === 1 ? "verbal_hint" : attemptNumber === 2 ? "alternative_representation" : "guided_steps", source: "automatic", timestamp: new Date().toISOString() });
  const support = safeSupport(practice.topicName, attemptNumber);
  return { practiceId: practice.id, exerciseId: exercise.id, rawInput: args.studentAnswer, recognizedAnswer: normalizedAnswer, isCorrect, attemptNumber,
    supportLevel: isCorrect ? "none" : attemptNumber === 1 ? "hint" : attemptNumber === 2 ? "alternative" : "guided",
    feedback: isCorrect ? "Correcto. Tu respuesta quedó registrada." : "Aún no coincide. Revisa la estrategia antes de elegir.",
    hint: support, alternativeExplanation: support, guidedExample: support, allowRetry: !isCorrect && attemptNumber < 3,
    currentDifficulty: exercise.difficulty, nextDifficulty: exercise.difficulty,
    alexaSpeechFeedback: isCorrect ? "Correcto. Tu respuesta quedó registrada." : support };

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

  const practice = ownedExercise(args);
  const hint = safeSupport(practice.topicName, 1);
  ledger(practice.id).supports.push({ exerciseId: args.exerciseId, kind: "verbal_hint", source: "requested", timestamp: new Date().toISOString() });
  return { exerciseId: args.exerciseId, supportLevel: "hint", hint, alexaSpeechHint: hint };

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

  const practice = ownedExercise(args);
  const selectedLevel = args.level || "analogy";
  const explanation = safeSupport(practice.topicName, selectedLevel === "analogy" ? 2 : 3);
  ledger(practice.id).supports.push({ exerciseId: args.exerciseId, kind: selectedLevel === "analogy" ? "alternative_representation" : "guided_steps", source: "requested", timestamp: new Date().toISOString() });
  return { exerciseId: args.exerciseId, supportLevel: selectedLevel, explanation, alexaSpeechExplanation: explanation };

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

  const existing = repository.getEvidences().find(e => e.practiceId === practice.id);
  if (practice.status === "completed" && existing) return resultFor(practice, existing);
  const record = ledger(practice.id);
  if (!practice.exercises.length || practice.exercises.some(e => !record.answers.some(a => a.exerciseId === e.id && a.isCorrect) && record.answers.filter(a => a.exerciseId === e.id).length < 3)) throw new Error("Practice incomplete: each exercise requires a correct answer or three recorded attempts");
  const totalExercises = practice.exercises.length;
  const mastered = [...new Set(practice.exercises.filter(e => record.answers.some(a => a.exerciseId === e.id && a.isCorrect)).map(e => e.conceptTag))];
  const pending = [...new Set(practice.exercises.filter(e => !record.answers.some(a => a.exerciseId === e.id && a.isCorrect)).map(e => e.conceptTag))];
  const correctCount = practice.exercises.filter(e => record.answers.some(a => a.exerciseId === e.id && a.isCorrect)).length;
  const finalScore = Math.round(correctCount / totalExercises * 100);
  const baselineAvailable = record.baseline !== undefined;
  const initialScore = record.baseline ?? 0;
  const delta = baselineAvailable ? finalScore - initialScore : 0;
  const evidence: LearningEvidence = { id: "evi-" + crypto.randomUUID(), studentId: student.id, studentName: student.name, practiceId: practice.id, subjectId: practice.subjectId, topicName: practice.topicName,
    initialScore, baselineAvailable, finalScore, improvementDelta: delta,
    status: !baselineAvailable ? "Primera medición" : delta > 0 ? "Mejora detectada" : delta < 0 ? "Requiere refuerzo adicional" : "Resultado estable",
    masteredConcepts: mastered, pendingConcepts: pending, timestamp: new Date().toISOString(), attemptId: "att-" + crypto.randomUUID(),
    totalCorrect: correctCount, totalExercises, totalAttempts: record.answers.length, supportEvents: record.supports,
    hintsUsed: record.supports.filter(s => s.kind === "verbal_hint" || s.kind === "visual_hint").length,
    reexplanationsUsed: record.supports.filter(s => s.kind === "alternative_representation" || s.kind === "guided_steps").length,
    tutorObservations: "Resultado calculado por el servidor a partir de intentos registrados en una sesión demo. No acredita una integración desplegada con Alexa+." };
  repository.saveAttempt({ id: evidence.attemptId, practiceId: practice.id, studentId: student.id, answers: record.answers, score: finalScore, totalCorrect: correctCount, totalExercises,
    startedAt: record.startedAt, completedAt: evidence.timestamp, feedback: evidence.tutorObservations, masteredConcepts: mastered, pendingConcepts: pending });
  repository.saveEvidence(evidence);
  repository.updateStudentScore(student.id, practice.topicId, finalScore);
  repository.updatePracticeStatus(practice.id, "completed");
  return resultFor(practice, evidence);

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

  const evidence = repository.getEvidencesByStudent(args.studentId).find(e => e.practiceId === args.practiceId);
  if (!evidence) return { practiceId: practice.id, studentId: args.studentId, status: practice.status, finalScore: null, improvementDelta: null, evidenceStatus: "Sin evidencia todavía", verifiedInTeacherDashboard: false };
  return resultFor(practice, evidence);
}
function ownedExercise(args: { practiceId?: string; exerciseId: string; studentId: string }) {
  const practice = args.practiceId ? repository.getPracticeById(args.practiceId) : repository.getPracticesByStudent(args.studentId).find(p => p.exercises.some(e => e.id === args.exerciseId));
  if (!practice || !practice.exercises.some(e => e.id === args.exerciseId)) throw new Error("Exercise not found in assigned practice");
  enforceTenantAndRole({}, args.studentId, practice);
  if (practice.status === "completed") throw new Error("Practice already completed");
  return practice;
}
function resultFor(practice: Practice, evidence: LearningEvidence) {
  return { ...evidence, status: practice.status,
    correctCount: evidence.totalCorrect, evidenceId: evidence.id, evidence, verifiedInTeacherDashboard: true,
    alexaCelebrationSpeech: "Práctica completada: " + evidence.finalScore + "%. Tu docente puede consultar esta evidencia." };
}
