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
    role,
    setRole,
    activeTeacherTab,
    setActiveTeacherTab,
    activeStudentTab,
    setActiveStudentTab,
    setCurrentPracticingId,
    showLanding,
    setShowLanding,
    resetDemo,
  } = useTutor();

  if (showLanding) {
    return (
      <LandingView
        onStartDemo={() => {
          resetDemo();
          setRole("teacher");
          setActiveTeacherTab("dashboard");
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
