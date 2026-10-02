"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Student,
  Teacher,
  Group,
  Subject,
  Practice,
  PracticeAttempt,
  LearningEvidence,
  TutorAction,
  AgentChatMessage,
  SupportEvent,
} from "@/types";
import { repository } from "@/lib/data/repository";
import { tutorAgent } from "@/lib/ai/tutor-agent";
import { mcpClient } from "@/lib/mcp/client";
import {
  evaluate_answer,
  adapt_difficulty,
  save_learning_evidence,
  explain_concept,
  generate_adaptive_practice,
} from "@/lib/tools/tutor-tools";
import { cancelGlobalSpeech } from "@/lib/hooks/use-speech";

export interface McpStatusInfo {
  connected: boolean;
  latencyMs?: number;
  protocolVersion?: string;
  transport?: string;
  serverName?: string;
  toolsCount?: number;
  error?: string;
}

interface TutorContextType {
  role: "teacher" | "student";
  setRole: (role: "teacher" | "student") => void;
  activeTeacherTab: "dashboard" | "group" | "tutor" | "support" | "practices" | "evidences" | "progress";
  setActiveTeacherTab: (tab: "dashboard" | "group" | "tutor" | "support" | "practices" | "evidences" | "progress") => void;
  activeStudentTab: "home" | "practices" | "tutor" | "progress";
  setActiveStudentTab: (tab: "home" | "practices" | "tutor" | "progress") => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  showLanding: boolean;
  setShowLanding: (val: boolean) => void;
  isJudgeDemo: boolean;
  setIsJudgeDemo: (val: boolean) => void;
  showJudgeGuide: boolean;
  setShowJudgeGuide: (val: boolean) => void;
  judgeGuideStep: number;
  setJudgeGuideStep: (val: number) => void;
  startJudgeDemoTour: () => void;
  teacher: Teacher;
  group: Group;
  subject: Subject;
  students: Student[];
  practices: Practice[];
  evidences: LearningEvidence[];
  actionLogs: TutorAction[];
  chatMessages: AgentChatMessage[];
  isAgentThinking: boolean;
  activeAgentSteps: string[];
  currentPracticingId: string | null;
  setCurrentPracticingId: (id: string | null) => void;
  mcpStatus: McpStatusInfo;
  checkMcpConnection: () => Promise<void>;
  // Actions
  sendMessageToTutor: (query: string) => Promise<void>;
  handleQuickAction: (actionKey: string, payload?: any) => Promise<void>;
  generatePracticeForStudent: (studentId: string) => Promise<string>;
  submitAnswer: (exerciseId: string, answer: string, attemptNumber: number) => Promise<any>;
  completePractice: (practiceId: string, results: { score: number; totalCorrect: number; totalExercises: number; mastered: string[]; pending: string[]; totalAttempts?: number; hintsUsed?: number; reexplanationsUsed?: number; supportEvents?: SupportEvent[] }) => Promise<void>;
  resetDemo: () => void;
  refreshState: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const initialJudgeDemo = Boolean(
    process.env.NEXT_PUBLIC_JUDGE_DEMO === "true" ||
    process.env.JUDGE_DEMO === "true"
  );
  const [isJudgeDemo, setIsJudgeDemo] = useState<boolean>(initialJudgeDemo);
  const [showJudgeGuide, setShowJudgeGuide] = useState<boolean>(true);
  const [judgeGuideStep, setJudgeGuideStep] = useState<number>(1);

  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [activeTeacherTab, setActiveTeacherTab] = useState<"dashboard" | "group" | "tutor" | "support" | "practices" | "evidences" | "progress">("dashboard");
  const [activeStudentTab, setActiveStudentTab] = useState<"home" | "practices" | "tutor" | "progress">("home");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("mariana-lopez");
  const [currentPracticingId, setCurrentPracticingId] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState<boolean>(!initialJudgeDemo);

  const [teacher, setTeacher] = useState<Teacher>(repository.getTeacher());
  const [group, setGroup] = useState<Group>(repository.getGroup());
  const [subject, setSubject] = useState<Subject>(repository.getSubject());
  const [students, setStudents] = useState<Student[]>(repository.getStudents());
  const [practices, setPractices] = useState<Practice[]>(repository.getPractices());
  const [evidences, setEvidences] = useState<LearningEvidence[]>(repository.getEvidences());
  const [actionLogs, setActionLogs] = useState<TutorAction[]>(repository.getActionLogs());

  const [mcpStatus, setMcpStatus] = useState<McpStatusInfo>({
    connected: false,
    protocolVersion: "2025-11-25",
    transport: "Streamable HTTP",
  });

  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>([
    {
      id: "initial-welcome",
      sender: "agent",
      text: "👋 ¡Hola, Profesor Carlos! Soy **MACHTIA Adaptive Tutor**. He analizado el grupo **3° B** en la materia de **Matemáticas**. Puedes consultarme quién necesita apoyo o pedirme diagnósticos específicos.",
      timestamp: "2026-09-28T09:00:00.000Z",
      quickActions: [
        {
          label: "¿Quién necesita apoyo en matemáticas?",
          actionKey: "ask_who_needs_support",
          primary: true,
        },
        {
          label: "Ver brecha de Mariana López",
          actionKey: "inspect_mariana",
          payload: { studentId: "mariana-lopez" },
        },
      ],
    },
  ]);

  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [activeAgentSteps, setActiveAgentSteps] = useState<string[]>([]);

  const refreshState = () => {
    setTeacher(repository.getTeacher());
    setGroup(repository.getGroup());
    setSubject(repository.getSubject());
    setStudents(repository.getStudents());
    setPractices(repository.getPractices());
    setEvidences(repository.getEvidences());
    setActionLogs(repository.getActionLogs());
  };

  const checkMcpConnection = async () => {
    try {
      const status = await mcpClient.checkConnection();
      setMcpStatus({
        connected: status.connected,
        latencyMs: status.latencyMs,
        protocolVersion: status.protocolVersion || "2025-11-25",
        transport: status.transport || "Streamable HTTP",
        serverName: status.serverName,
        toolsCount: status.toolsCount,
        error: status.error,
      });
    } catch (e: any) {
      setMcpStatus({
        connected: false,
        protocolVersion: "2025-11-25",
        transport: "Streamable HTTP",
        error: e?.message,
      });
    }
  };

  const startJudgeDemoTour = () => {
    cancelGlobalSpeech();
    mcpClient.setForceRealMcp(true);
    repository.resetOfficialDemoScenario();
    refreshState();
    checkMcpConnection();
    setIsJudgeDemo(true);
    setShowJudgeGuide(true);
    setJudgeGuideStep(1);
    setRole("teacher");
    setActiveTeacherTab("dashboard");
    setActiveStudentTab("home");
    setSelectedStudentId("mariana-lopez");
    setCurrentPracticingId(null);
    setShowLanding(false);
  };

  useEffect(() => {
    let shouldActivateJudge = isJudgeDemo;
    let teacherWorkspace = false;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      teacherWorkspace = urlParams.get("mode") === "teacher";
      if (teacherWorkspace) shouldActivateJudge = false;
      if (urlParams.get("demo") === "judge" || urlParams.get("judge") === "true") {
        shouldActivateJudge = true;
      }
    }

    if (shouldActivateJudge) {
      mcpClient.setForceRealMcp(true);
      repository.resetOfficialDemoScenario();
      setRole("teacher");
      setActiveTeacherTab("dashboard");
      setActiveStudentTab("home");
      setSelectedStudentId("mariana-lopez");
      setCurrentPracticingId(null);
      setShowLanding(false);
      setShowJudgeGuide(true);
      setJudgeGuideStep(1);
      setIsJudgeDemo(true);
    } else {
      repository.loadFromStorage();
      if (teacherWorkspace) { setShowLanding(false); setIsJudgeDemo(false); }
    }
    refreshState();
    checkMcpConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simulateAgentSteps = async (steps: string[]) => {
    setIsAgentThinking(true);
    setActiveAgentSteps([]);
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 380));
      setActiveAgentSteps((prev) => [...prev, steps[i]]);
    }
    await new Promise((r) => setTimeout(r, 260));
    setIsAgentThinking(false);
  };

  const sendMessageToTutor = async (query: string) => {
    // Add user message
    const userMsg: AgentChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    const q = query.toLowerCase();
    const isMcpOnline = mcpStatus.connected;
    const mcpNote = isMcpOnline
      ? "Conectado a MACHTIA Tutor Server"
      : "MCP Offline (Modo Demo Activo)";

    let steps: string[] = [
      "AGENT | Analizando solicitud del profesor",
      `MCP | ${mcpNote}`,
    ];

    if (!q.includes("práctica") && (q.includes("apoyo") || q.includes("quién") || q.includes("quien") || q.includes("rezago"))) {
      steps = [
        "AGENT | Analizando solicitud del profesor",
        `MCP | ${mcpNote}`,
        "TOOL | analyze_student_performance",
        "RESULT | Tema con menor desempeño: Fracciones equivalentes",
        "TOOL | find_students_needing_support",
        "RESULT | 2 alumnos necesitan apoyo",
        "TOOL | get_student_learning_gap",
        "RESULT | Mariana López — Matemáticas — Fracciones equivalentes — 52%",
      ];
    } else if (!q.includes("práctica") && (q.includes("mariana") || q.includes("diagnóstico") || q.includes("brecha"))) {
      steps = [
        "AGENT | Analizando solicitud del profesor",
        `MCP | ${mcpNote}`,
        "TOOL | get_student_learning_gap",
        "RESULT | Mariana López — Matemáticas — Fracciones equivalentes — 52%",
        "TOOL | analyze_student_performance",
        "RESULT | Error recurrente: Comparación errónea de denominadores (52% aciertos)",
      ];
    } else if (q.includes("generar práctica") || q.includes("crear práctica") || q.includes("práctica de apoyo")) {
      steps = [
        "AGENT | Analizando solicitud del profesor",
        `MCP | ${mcpNote}`,
        "TOOL | generate_adaptive_practice",
        "RESULT | Práctica de apoyo generada con 5 ejercicios y 3 niveles de andamiaje",
        "TOOL | assign_practice_to_student",
        "RESULT | Mariana López — Práctica asignada con éxito (estado: pending)",
      ];
    } else if (q.includes("mejoró") || q.includes("mejora") || q.includes("progreso")) {
      steps = [
        "AGENT | Analizando solicitud del profesor",
        `MCP | ${mcpNote}`,
        "TOOL | get_student_progress",
        "RESULT | Diagnóstico inicial: 52% → Práctica completada: 80%",
        "TOOL | report_progress_to_teacher",
        "RESULT | Mariana López: +28 puntos porcentuales (Mejora detectada)",
      ];
    }

    await simulateAgentSteps(steps);

    const result = await tutorAgent.processTeacherQuery(query, {
      selectedStudentId,
    });

    setChatMessages((prev) => [...prev, result.message]);
    refreshState();
  };

  const handleQuickAction = async (actionKey: string, payload?: any) => {
    if (actionKey === "ask_who_needs_support") {
      setActiveTeacherTab("tutor");
      await sendMessageToTutor("¿Quién necesita apoyo en matemáticas?");
    } else if (
      actionKey === "ask_mariana_gap" ||
      actionKey === "inspect_mariana" ||
      (actionKey === "inspect_student" && payload?.studentId === "mariana-lopez")
    ) {
      setSelectedStudentId("mariana-lopez");
      setActiveTeacherTab("tutor");
      await sendMessageToTutor("Ver diagnóstico de Mariana López");
    } else if (
      actionKey === "ask_luis_gap" ||
      actionKey === "inspect_luis" ||
      (actionKey === "inspect_student" && payload?.studentId === "luis-hernandez")
    ) {
      setSelectedStudentId("luis-hernandez");
      setActiveTeacherTab("tutor");
      await sendMessageToTutor("Ver diagnóstico de Luis Hernández");
    } else if (
      actionKey === "create_practice_mariana" ||
      actionKey === "generate_practice"
    ) {
      const studentId = payload?.studentId || "mariana-lopez";
      setSelectedStudentId(studentId);
      setActiveTeacherTab("tutor");
      await sendMessageToTutor(
        `Crear práctica de apoyo para ${studentId === "luis-hernandez" ? "Luis Hernández" : "Mariana López"}`
      );
    } else if (
      actionKey === "enter_as_mariana" ||
      actionKey === "switch_student_role"
    ) {
      const studentId = payload?.studentId || "mariana-lopez";
      setSelectedStudentId(studentId);
      setRole("student");
      setActiveStudentTab("practices");
      const currentList = repository.getPracticesByStudent(studentId);
      const pendingPractice = currentList.find((p: Practice) => p.status !== "completed");
      if (payload?.practiceId) {
        setCurrentPracticingId(payload.practiceId);
      } else if (pendingPractice) {
        setCurrentPracticingId(pendingPractice.id);
      }
    } else if (actionKey === "view_evidences_tab") {
      setActiveTeacherTab("evidences");
    } else if (actionKey === "ask_mariana_improvement") {
      setActiveTeacherTab("tutor");
      await sendMessageToTutor("¿Mejoró Mariana López después de la práctica?");
    }
  };

  const generatePracticeForStudent = async (studentId: string): Promise<string> => {
    const student = repository.getStudentById(studentId);
    if (!student) throw new Error("Student not found");

    // D) Comprobar si ya existe una práctica pendiente para este alumno
    const existing = repository.getPracticesByStudent(student.id).find((p) => p.status === "pending");
    if (existing) {
      if (!student.assignedPracticeIds.includes(existing.id)) {
        student.assignedPracticeIds.push(existing.id);
        refreshState();
      }
      return existing.id;
    }

    const practiceCall = await mcpClient.generateAdaptivePractice(
      student.id,
      "fracciones-equivalentes",
      "easy",
      5
    );

    if (practiceCall.result?.practiceId) {
      const pId = practiceCall.result.practiceId;
      try {
        await mcpClient.assignPracticeToStudent(pId, student.id);
      } catch {
        // Fallback local
      }
      refreshState();
      return pId;
    }

    // Resilient fallback
    const fallbackPractice = await generate_adaptive_practice(student.id, "fracciones-equivalentes", "easy", 5);
    refreshState();
    return fallbackPractice.practiceId;
  };

  const submitAnswer = async (exerciseId: string, answer: string, attemptNumber: number) => {
    return evaluate_answer(exerciseId, answer, attemptNumber);
  };

  const completePractice = async (
    practiceId: string,
    results: { score: number; totalCorrect: number; totalExercises: number; mastered: string[]; pending: string[]; totalAttempts?: number; hintsUsed?: number; reexplanationsUsed?: number; supportEvents?: SupportEvent[] }
  ) => {
    repository.updatePracticeStatus(practiceId, "completed");

    const practice = repository.getPracticeById(practiceId);
    if (!practice) return;

    const student = repository.getStudentById(practice.studentId);
    if (!student) return;

    const baselineAvailable = student.topicPerformances[practice.topicId] !== undefined;
    const initialScore = student.topicPerformances[practice.topicId] ?? 0;
    repository.updateStudentScore(student.id, practice.topicId, results.score);


    const delta = results.score - initialScore;

    repository.saveEvidence({
      id: `evi-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      practiceId: practice.id,
      subjectId: practice.subjectId,
      topicName: practice.topicName,
      initialScore: initialScore,
      baselineAvailable,
      totalCorrect: results.totalCorrect,
      totalExercises: results.totalExercises,
      supportEvents: results.supportEvents,
      finalScore: results.score,
      totalAttempts: results.totalAttempts,
      hintsUsed: results.hintsUsed,
      reexplanationsUsed: results.reexplanationsUsed,
      improvementDelta: baselineAvailable ? delta : 0,
      status: !baselineAvailable ? "Primera medición" : delta > 0 ? "Mejora detectada" : delta < 0 ? "Requiere refuerzo adicional" : "Resultado estable",
      masteredConcepts: results.mastered,
      pendingConcepts: results.pending,
      tutorObservations: `${student.name} completó la práctica guiada por el Tutor IA. Resolvió correctamente ${results.totalCorrect} de ${results.totalExercises} reactivos obteniendo un puntaje de ${results.score}%. ${baselineAvailable ? `Diagnóstico inicial: ${initialScore}%.` : "Sin diagnóstico inicial comparable; este resultado establece su primera medición."} Intentos: ${results.totalAttempts ?? "sin registro"}. Pistas: ${results.hintsUsed ?? "sin registro"}. Re-explicaciones: ${results.reexplanationsUsed ?? "sin registro"}.`,
      timestamp: new Date().toISOString(),
      attemptId: `att-${Date.now()}`,
    });

    repository.logAction({
      toolName: "save_learning_evidence",
      displayName: "Guardó evidencia de aprendizaje",
      description: `${student.name}: resultado ${results.score}%. ${baselineAvailable ? `Cambio ${delta} puntos desde ${initialScore}%.` : "Primera medición, sin delta comparable."}`,
      input: { studentId: student.id, practiceId: practice.id, score: results.score },
      output: { status: "saved", delta },
      status: "success",
      durationMs: 140,
      source: "local-fallback",
      mcpProtocol: "2025-11-25",
    });

    refreshState();
  };

  const handleSetRole = (newRole: "teacher" | "student") => {
    cancelGlobalSpeech();
    setRole(newRole);
  };

  const handleSetActiveTeacherTab = (tab: "dashboard" | "group" | "tutor" | "support" | "practices" | "evidences" | "progress") => {
    cancelGlobalSpeech();
    setActiveTeacherTab(tab);
  };

  const handleSetActiveStudentTab = (tab: "home" | "practices" | "tutor" | "progress") => {
    cancelGlobalSpeech();
    setActiveStudentTab(tab);
  };

  const handleSetCurrentPracticingId = (id: string | null) => {
    cancelGlobalSpeech();
    setCurrentPracticingId(id);
  };

  const resetDemo = () => {
    cancelGlobalSpeech();
    repository.resetOfficialDemoScenario();
    refreshState();
    checkMcpConnection();
    setRole("teacher");
    setActiveTeacherTab("dashboard");
    setActiveStudentTab("home");
    setSelectedStudentId("mariana-lopez");
    setCurrentPracticingId(null);
    setIsAgentThinking(false);
    setActiveAgentSteps([]);
    setChatMessages([
      {
        id: "initial-welcome",
        sender: "agent",
        text: "👋 ¡Hola, Profesor Carlos! Soy **MACHTIA Adaptive Tutor**. He analizado el grupo **3° B** en la materia de **Matemáticas**. Puedes consultarme quién necesita apoyo o pedirme diagnósticos específicos.",
        timestamp: new Date().toISOString(),
        quickActions: [
          {
            label: "¿Quién necesita apoyo en matemáticas?",
            actionKey: "ask_who_needs_support",
            primary: true,
          },
          {
            label: "Ver brecha de Mariana López",
            actionKey: "inspect_mariana",
            payload: { studentId: "mariana-lopez" },
          },
        ],
      },
    ]);
  };

  return (
    <TutorContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        activeTeacherTab,
        setActiveTeacherTab: handleSetActiveTeacherTab,
        activeStudentTab,
        setActiveStudentTab: handleSetActiveStudentTab,
        selectedStudentId,
        setSelectedStudentId,
        showLanding,
        setShowLanding,
        isJudgeDemo,
        setIsJudgeDemo,
        showJudgeGuide,
        setShowJudgeGuide,
        judgeGuideStep,
        setJudgeGuideStep,
        startJudgeDemoTour,
        teacher,
        group,
        subject,
        students,
        practices,
        evidences,
        actionLogs,
        chatMessages,
        isAgentThinking,
        activeAgentSteps,
        currentPracticingId,
        setCurrentPracticingId: handleSetCurrentPracticingId,
        mcpStatus,
        checkMcpConnection,
        sendMessageToTutor,
        handleQuickAction,
        generatePracticeForStudent,
        submitAnswer,
        completePractice,
        resetDemo,
        refreshState,
      }}
    >
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor() {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error("useTutor must be used within a TutorProvider");
  }
  return context;
}
