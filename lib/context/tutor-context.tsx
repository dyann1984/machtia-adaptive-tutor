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
  dataError: string | null;
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
  completePractice: (practiceId: string, results: { score: number; totalCorrect: number; totalExercises: number; mastered: string[]; pending: string[]; totalAttempts?: number; hintsUsed?: number; reexplanationsUsed?: number; supportEvents?: SupportEvent[] }) => Promise<LearningEvidence>;
  resetDemo: () => void;
  refreshState: () => void;
  retryConnection: () => Promise<void>;
  useLocalOfflineMode: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const [dataError, setDataError] = useState<string | null>(null);
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
      text: "👋 ¡Hola, Profesor Carlos! Soy **MACHTIA Adaptive Tutor**. Puedo consultar el diagnóstico demo del grupo **3° B** en **Matemáticas**. Puedes consultarme quién necesita apoyo o pedirme diagnósticos específicos.",
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

  const refreshState = async () => {
    try { repository.hydrate(await mcpClient.snapshot()); setDataError(null); } catch (error) { setDataError(String(error));setMcpStatus(prev => ({ ...prev, connected: false, error: String(error) })); return; }
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
    void mcpClient.initializeDemo(true).then(() => refreshState());
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

    void (async () => {
      await mcpClient.initializeDemo();
      await mcpClient.selectRole("teacher", "mariana-lopez");
      if (shouldActivateJudge) { setShowLanding(false);setShowJudgeGuide(true);setIsJudgeDemo(true); }
      else if (teacherWorkspace) { setShowLanding(false);setIsJudgeDemo(false); }
      await refreshState(); await checkMcpConnection();
    })().catch(error => { setDataError(String(error));setMcpStatus(prev => ({ ...prev, connected: false, error: String(error) })); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessageToTutor = async (query: string) => {
    // Add user message
    const userMsg: AgentChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    setIsAgentThinking(true);setActiveAgentSteps(["Consultando herramientas MCP del servidor"]);
    const result = await tutorAgent.processTeacherQuery(query, {
      selectedStudentId,
    });

    setChatMessages((prev) => [...prev, result.message]);
    await refreshState();setIsAgentThinking(false);setActiveAgentSteps([]);
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
      handleSetRole("student", studentId);
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
        throw new Error("No se pudo asignar la práctica en el servidor");
      }
      refreshState();
      return pId;
    }

    throw new Error("El servidor no generó la práctica.");
  };

  const submitAnswer = async (exerciseId: string, answer: string, attemptNumber: number) => {
    const practice = repository.getPractices().find(p => p.id === currentPracticingId && p.exercises.some(e => e.id === exerciseId)) || repository.getPractices().find(p => p.studentId === selectedStudentId && p.exercises.some(e => e.id === exerciseId));
    if (!practice) throw new Error("Práctica no encontrada");
    await mcpClient.selectRole("student", practice.studentId);
    const result = await mcpClient.submitAnswer(practice.id, exerciseId, answer, attemptNumber, practice.studentId);
    return result.result;
  };
  const completePractice = async (practiceId: string, _results: any) => {
    const practice = repository.getPracticeById(practiceId);
    if (!practice) throw new Error("Práctica no encontrada");
    await mcpClient.selectRole("student", practice.studentId);
    const result = await mcpClient.completePractice(practiceId, practice.studentId);
    await refreshState();
    return result.result.evidence as LearningEvidence;
  };

  const handleSetRole = (newRole: "teacher" | "student", studentId = selectedStudentId) => {
    cancelGlobalSpeech();
    void mcpClient.selectRole(newRole, studentId).then(() => { setRole(newRole); void refreshState(); }).catch(error => { setDataError(String(error));setMcpStatus(prev => ({ ...prev, connected: false, error: String(error) })); });
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
    void mcpClient.initializeDemo(true).then(() => refreshState());
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
        text: "👋 ¡Hola, Profesor Carlos! Soy **MACHTIA Adaptive Tutor**. Puedo consultar el diagnóstico demo del grupo **3° B** en **Matemáticas**. Puedes consultarme quién necesita apoyo o pedirme diagnósticos específicos.",
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

  const retryConnection = async () => {
    setDataError(null);
    try {
      await mcpClient.initializeDemo();
      await mcpClient.selectRole(role, selectedStudentId);
      await refreshState();
      await checkMcpConnection();
    } catch (err: any) {
      setDataError(String(err?.message || err));
      setMcpStatus((prev) => ({ ...prev, connected: false, error: String(err?.message || err) }));
    }
  };

  const useLocalOfflineMode = () => {
    cancelGlobalSpeech();
    repository.resetOfficialDemoScenario();
    setDataError(null);
    setTeacher(repository.getTeacher());
    setGroup(repository.getGroup());
    setSubject(repository.getSubject());
    setStudents(repository.getStudents());
    setPractices(repository.getPractices());
    setEvidences(repository.getEvidences());
    setActionLogs(repository.getActionLogs());
    setMcpStatus({
      connected: true,
      protocolVersion: "2025-11-25",
      transport: "Modo Local Autónomo",
      serverName: "machtia-local-sandbox",
      toolsCount: 15,
      error: undefined,
    });
  };

  return (
    <TutorContext.Provider
      value={{
        dataError,
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
        retryConnection,
        useLocalOfflineMode,
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
