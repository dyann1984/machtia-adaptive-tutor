"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { LandingView } from "@/components/LandingView";
import { TeacherDashboard } from "@/features/teacher/TeacherDashboard";
import { GroupView } from "@/features/teacher/GroupView";
import { AITutorAgentView } from "@/features/teacher/AITutorAgentView";
import { SupportNeededView } from "@/features/teacher/SupportNeededView";
import { PracticesListView } from "@/features/teacher/PracticesListView";
import { EvidencesView } from "@/features/teacher/EvidencesView";
import { TeacherProgressView } from "@/features/teacher/TeacherProgressView";

import { StudentHome } from "@/features/student/StudentHome";
import { StudentPracticesView } from "@/features/student/StudentPracticesView";
import { StudentTutorChat } from "@/features/student/StudentTutorChat";
import { StudentProgressView } from "@/features/student/StudentProgressView";

export default function Home() {
  const {
    dataError,
    role,
    setRole,
    activeTeacherTab,
    setActiveTeacherTab,
    activeStudentTab,
    setActiveStudentTab,
    selectedStudentId: _selectedStudentId,
    setSelectedStudentId,
    setCurrentPracticingId,
    showLanding,
    setShowLanding,
    resetDemo,
  } = useTutor();

  if (dataError) {
    const isWakingUp = dataError.includes("iniciando") || dataError.includes("spin-up");
    return (
      <section role="alert" className="theme-card p-6 sm:p-8 max-w-2xl mx-auto space-y-4 my-8 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          {isWakingUp ? "Iniciando servidor en la nube..." : "Conexión con el servidor"}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {isWakingUp
            ? "El servidor de MACHTIA en la nube está terminando de iniciar (Render cold-start). Esto toma unos segundos al activarse por primera vez."
            : "El servidor debe estar disponible para consultar prácticas y guardar evidencia del alumno. Una sesión demo expirada puede reiniciarse en un clic."}
        </p>
        <p className="text-xs bg-slate-100 text-slate-700 p-3 rounded-xl font-mono overflow-x-auto border border-slate-200">
          {dataError}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button className="theme-primary" onClick={resetDemo}>
            Reiniciar sesión demo
          </button>
        </div>
      </section>
    );
  }

  if (showLanding) {
    return (
      <LandingView
        onStartDemo={() => {
          resetDemo();
          setRole("teacher");
          setActiveTeacherTab("dashboard");
          setSelectedStudentId("mariana-lopez");
          setShowLanding(false);
        }}
      />
    );
  }

  if (role === "teacher") {
    switch (activeTeacherTab) {
      case "dashboard":
        return <TeacherDashboard />;
      case "group":
        return <GroupView />;
      case "tutor":
        return <AITutorAgentView />;
      case "support":
        return <SupportNeededView />;
      case "practices":
        return <PracticesListView />;
      case "evidences":
        return <EvidencesView />;
      case "progress":
        return <TeacherProgressView />;
      default:
        return <TeacherDashboard />;
    }
  }

  // Student Role
  switch (activeStudentTab) {
    case "home":
      return (
        <StudentHome
          onStartPractice={(practiceId) => {
            setCurrentPracticingId(practiceId);
            setActiveStudentTab("practices");
          }}
        />
      );
    case "practices":
      return <StudentPracticesView />;
    case "tutor":
      return <StudentTutorChat />;
    case "progress":
      return <StudentProgressView />;
    default:
      return <StudentHome onStartPractice={(id) => setCurrentPracticingId(id)} />;
  }
}
