export interface Teacher {
  id: string;
  name: string;
  email: string;
  school: string;
  groupIds: string[];
}

export interface Student {
  id: string;
  name: string;
  avatarUrl?: string;
  groupId: string;
  overallAverage: number;
  topicPerformances: Record<string, number>; // topicId -> percentage 0-100
  recurringErrors: Record<string, string>;
  learningGaps: LearningGap[];
  assignedPracticeIds: string[];
}

export interface Group {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
  subjectIds: string[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
}

export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

export interface LearningGap {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  errorPattern: string;
  severity: "high" | "medium" | "low";
  currentScore: number;
  detectionEvidence: string;
  detectedAt: string;
  resolved: boolean;
}

export interface Exercise {
  activityKind?: "choice" | "reading" | "classification" | "sequence";
  context?: string;
  visualCue?: string;
  id: string;
  questionNumber: number;
  prompt: string;
  visualData?: {
    type: "fractions-bars" | "fraction-circle" | "numeric";
    fractionA: { numerator: number; denominator: number };
    fractionB: { numerator: number; denominator: number };
    labelA?: string;
    labelB?: string;
  };
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string; // Nivel 1: Pista formativa sin dar respuesta
  alternativeExplanation?: string; // Nivel 2: Explicación alternativa con otra analogía
  guidedExample?: string; // Nivel 3: Ejemplo guiado paso a paso
  difficulty: "easy" | "medium" | "hard";
  conceptTag: string;
}

export interface Practice {
  learningObjective?: string;
  grade?: number;
  estimatedMinutes?: number;
  initialSupport?: "independent" | "verbal" | "visual";
  teacherCreated?: boolean;
  instructions?: string;
  id: string;
  title: string;
  description: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  studentId: string;
  studentName: string;
  targetGapId?: string;
  targetGapDescription?: string;
  exercises: Exercise[];
  status: "pending" | "in_progress" | "completed" | "assigned";
  createdAt: string;
  completedAt?: string;
}

export interface PracticeGenerationResult {
  practiceId: string;
  practiceTitle: string;
  studentName: string;
  exerciseCount: number;
  exercises: Exercise[];
  subject: string;
  targetTopic: string;
  status: "pending" | "in_progress" | "completed" | "assigned";
  targetGapDescription: string;
  summary: string;
}

export interface EvaluationFeedback {
  exerciseId: string;
  studentAnswer: string;
  isCorrect: boolean;
  attemptNumber: number;
  supportLevel: "none" | "hint" | "alternative_explanation" | "guided_example";
  feedback: string;
  hint?: string;
  alternativeExplanation?: string;
  guidedExample?: string;
  allowRetry: boolean;
  difficulty: "easy" | "medium" | "hard";
  agentObservableAction: string;
}

export interface ExerciseAnswer {
  exerciseId: string;
  studentAnswer: string;
  isCorrect: boolean;
  attemptsCount: number;
  hintsUsed: boolean;
  explanationGiven?: string;
}

export interface PracticeAttempt {
  id: string;
  practiceId: string;
  studentId: string;
  answers: ExerciseAnswer[];
  score: number;
  totalCorrect: number;
  totalExercises: number;
  startedAt: string;
  completedAt: string;
  feedback: string;
  masteredConcepts: string[];
  pendingConcepts: string[];
}

export interface LearningEvidence {
  baselineAvailable?: boolean;
  totalCorrect?: number;
  totalExercises?: number;
  supportEvents?: SupportEvent[];
  totalAttempts?: number;
  hintsUsed?: number;
  reexplanationsUsed?: number;
  id: string;
  studentId: string;
  studentName: string;
  practiceId: string;
  subjectId: string;
  topicName: string;
  initialScore: number;
  finalScore: number;
  improvementDelta: number;
  status: "Mejora detectada" | "Progreso moderado" | "Requiere refuerzo adicional" | "Primera medición" | "Resultado estable";
  masteredConcepts: string[];
  pendingConcepts: string[];
  tutorObservations: string;
  timestamp: string;
  attemptId: string;
}

export type SupportKind = "verbal_hint" | "visual_hint" | "alternative_representation" | "guided_steps";
export interface SupportEvent {
  exerciseId: string;
  kind: SupportKind;
  representation?: string;
  source: "requested" | "teacher" | "automatic";
  timestamp: string;
}

export interface TutorAction {
  id: string;
  toolName: string;
  displayName: string;
  description: string;
  input: Record<string, any>;
  output: Record<string, any>;
  timestamp: string;
  status: "running" | "success" | "error";
  durationMs?: number;
  source?: "mcp" | "local-fallback";
  mcpProtocol?: string;
}

export interface ProgressSnapshot {
  studentId: string;
  studentName: string;
  subject: string;
  topic: string;
  scoreBefore: number;
  scoreAfter: number;
  improvementDelta: number;
  status: string;
  detail: string;
  date: string;
}

export interface AgentChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  timestamp: string;
  agentActions?: TutorAction[];
  quickActions?: {
    label: string;
    actionKey: string;
    payload?: any;
    primary?: boolean;
  }[];
  dataPayload?: any;
}
