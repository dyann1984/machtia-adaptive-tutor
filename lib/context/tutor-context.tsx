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
} from "@/types";
import { repository } from "@/lib/data/repository";
import { tutorAgent } from "@/lib/ai/tutor-agent";
import {
  evaluate_answer,
  adapt_difficulty,
  save_learning_evidence,
  explain_concept,
} from "@/lib/tools/tutor-tools";

interface TutorContextType {
  role: "teacher" | "student";
  setRole: (role: "teacher" | "student") => void;
  activeTeacherTab: "dashboard" | "group" | "tutor" | "support" | "practices" | "evidences" | "progress";
  setActiveTeacherTab: (tab: "dashboard" | "group" | "tutor" | "support" | "practices" | "evidences" | "progress") => void;
  activeStudentTab: "home" | "practices" | "tutor" | "progress";
  setActiveStudentTab: (tab: "home" | "practices" | "tutor" | "progress") => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
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
  // Actions
  sendMessageToTutor: (query: string) => Promise<void>;
  handleQuickAction: (actionKey: string, payload?: any) => Promise<void>;
  generatePracticeForStudent: (studentId: string) => Promise<string>;
  submitAnswer: (exerciseId: string, answer: string, attemptNumber: number) => Promise<any>;
  completePractice: (practiceId: string, results: { score: number; totalCorrect: number; totalExercises: number; mastered: string[]; pending: string[] }) => Promise<void>;
  resetDemo: () => void;
  refreshState: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [activeTeacherTab, setActiveTeacherTab] = useState<"dashboard" | "group" | "tutor" | "support" | "practices" | "evidences" | "progress">("dashboard");
  const [activeStudentTab, setActiveStudentTab] = useState<"home" | "practices" | "tutor" | "progress">("home");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("mariana-lopez");
  const [currentPracticingId, setCurrentPracticingId] = useState<string | null>(null);

  const [teacher, setTeacher] = useState<Teacher>(repository.getTeacher());
  const [group, setGroup] = useState<Group>(repository.getGroup());
  const [subject, setSubject] = useState<Subject>(repository.getSubject());
  const [students, setStudents] = useState<Student[]>(repository.getStudents());
  const [practices, setPractices] = useState<Practice[]>(repository.getPractices());
  const [evidences, setEvidences] = useState<LearningEvidence[]>(repository.getEvidences());
  const [actionLogs, setActionLogs] = useState<TutorAction[]>(repository.getActionLogs());

  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>([
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

  useEffect(() => {
    refreshState();
  }, []);

  const simulateAgentSteps = async (steps: string[]) => {
    setIsAgentThinking(true);
    setActiveAgentSteps([]);
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      setActiveAgentSteps((prev) => [...prev, steps[i]]);
    }
    await new Promise((r) => setTimeout(r, 350));
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
    let steps: string[] = ["Iniciando razonamiento pedagógico..."];

    if (q.includes("apoyo") || q.includes("quién") || q.includes("quien") || q.includes("rezago")) {
      steps = [
        "Consultando calificaciones del grupo 3° B...",
        "Detectando patrones de error por reactivo...",
        "Identificando brechas cognitivas individuales...",
        "Generando recomendación pedagógica prioritaria...",
      ];
    } else if (q.includes("mariana") || q.includes("diagnóstico")) {
      steps = [
        "Extrayendo historial de evaluación de Mariana López...",
        "Analizando patrón de fallo en denominadores...",
        "Generando perfil de brecha conceptual...",
      ];
    } else if (q.includes("generar práctica") || q.includes("crear práctica")) {
      steps = [
        "Calibrando banco de reactivos para denominadores...",
        "Configurando progresión de dificultad adaptativa...",
        "Asignando práctica al aula virtual de Mariana...",
      ];
    } else if (q.includes("mejoró") || q.includes("mejora") || q.includes("progreso")) {
      steps = [
        "Recuperando evaluación diagnóstica inicial (52%)...",
        "Analizando resultados de práctica guiada...",
        "Calculando delta de progreso y conceptos dominados...",
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
    } else if (actionKey === "inspect_mariana" || (actionKey === "inspect_student" && payload?.studentId === "mariana-lopez")) {
      setSelectedStudentId("mariana-lopez");
      setActiveTeacherTab("tutor");
      await sendMessageToTutor("Ver diagnóstico de Mariana López");
    } else if (actionKey === "inspect_luis" || (actionKey === "inspect_student" && payload?.studentId === "luis-hernandez")) {
      setSelectedStudentId("luis-hernandez");
      setActiveTeacherTab("tutor");
      await sendMessageToTutor("Ver diagnóstico de Luis Hernández");
    } else if (actionKey === "generate_practice") {
      const studentId = payload?.studentId || selectedStudentId;
      setSelectedStudentId(studentId);
      setActiveTeacherTab("tutor");
      await sendMessageToTutor(`Generar práctica personalizada para ${studentId === "luis-hernandez" ? "Luis Hernández" : "Mariana López"}`);
    } else if (actionKey === "switch_student_role") {
      const studentId = payload?.studentId || "mariana-lopez";
      const practiceId = payload?.practiceId;
      setSelectedStudentId(studentId);
      setRole("student");
      setActiveStudentTab("practices");
      if (practiceId) {
        setCurrentPracticingId(practiceId);
      }
    } else if (actionKey === "view_evidences_tab") {
      setActiveTeacherTab("evidences");
    } else if (actionKey === "ask_mariana_improvement") {
      setActiveTeacherTab("tutor");
      await sendMessageToTutor("¿Mejoró Mariana López?");
    }
  };

  const generatePracticeForStudent = async (studentId: string): Promise<string> => {
    setSelectedStudentId(studentId);
    setActiveTeacherTab("tutor");
    await sendMessageToTutor(`Generar práctica personalizada para ${studentId === "luis-hernandez" ? "Luis Hernández" : "Mariana López"}`);
    const updatedPractices = repository.getPracticesByStudent(studentId);
    const newest = updatedPractices[updatedPractices.length - 1];
    return newest ? newest.id : "";
  };

  const submitAnswer = async (exerciseId: string, answer: string, attemptNumber: number) => {
    return await evaluate_answer(exerciseId, answer, attemptNumber);
  };

  const completePractice = async (
    practiceId: string,
    results: {
      score: number;
      totalCorrect: number;
      totalExercises: number;
      mastered: string[];
      pending: string[];
    }
  ) => {
    repository.updatePracticeStatus(practiceId, "completed");
    await save_learning_evidence(selectedStudentId, practiceId, {
      score: results.score,
      totalCorrect: results.totalCorrect,
      totalExercises: results.totalExercises,
      masteredConcepts: results.mastered,
      pendingConcepts: results.pending,
    });
    refreshState();
  };

  const resetDemo = () => {
    repository.resetDemoData();
    refreshState();
    setRole("teacher");
    setActiveTeacherTab("dashboard");
    setActiveStudentTab("home");
    setSelectedStudentId("mariana-lopez");
    setCurrentPracticingId(null);
    setChatMessages([
      {
        id: "initial-welcome-reset",
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
        setRole,
        activeTeacherTab,
        setActiveTeacherTab,
        activeStudentTab,
        setActiveStudentTab,
        selectedStudentId,
        setSelectedStudentId,
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
        setCurrentPracticingId,
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
