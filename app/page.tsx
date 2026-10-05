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

  if (dataError) return <section role="alert" className="theme-card p-6 max-w-3xl mx-auto space-y-4"><h1 className="text-xl font-bold">No se pudieron recuperar los datos de la sesión</h1><p>El servidor debe estar disponible para consultar prácticas y guardar evidencia. Una sesión demo expirada puede reiniciarse.</p><p className="text-sm">{dataError}</p><button className="theme-primary" onClick={resetDemo}>Reiniciar sesión demo</button></section>;

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
