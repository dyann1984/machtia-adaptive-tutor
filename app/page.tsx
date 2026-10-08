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
    retryConnection,
    useLocalOfflineMode,
  } = useTutor();

  if (dataError) {
    const isWakingUp = dataError.includes("iniciando") || dataError.includes("spin-up") || dataError.includes("502") || dataError.includes("503") || dataError.includes("504");
    const isNotFound = dataError.includes("404") || dataError.includes("no encontrada");
    const isUnauthorized = dataError.includes("401") || dataError.includes("no autorizada");
    const isForbidden = dataError.includes("403") || dataError.includes("denegado") || dataError.includes("prohibido");
    const isTimeout = dataError.includes("agotado") || dataError.includes("timeout") || dataError.includes("Timeout");

    let title = "Conexión con el servidor";
    let explanation = "El servidor debe estar disponible para consultar prácticas y guardar evidencia del alumno. Una sesión demo expirada puede reiniciarse en un clic.";

    if (isWakingUp) {
      title = "Iniciando servidor en la nube...";
      explanation = "El servidor backend de MACHTIA (Render free-tier) está despertando de su modo de reposo. Esto puede tomar entre 30 y 60 segundos.";
    } else if (isNotFound) {
      title = "Ruta del servidor no encontrada (HTTP 404)";
      explanation = "No se localizó el endpoint solicitado en el servidor. Verifica que el proxy o la ruta hacia el servicio MCP apunten correctamente.";
    } else if (isUnauthorized) {
      title = "Sesión demo no autorizada o expirada (HTTP 401)";
      explanation = "El token de sesión demo ha caducado o no es válido. Haz clic en 'Reiniciar sesión demo' para generar un entorno limpio.";
    } else if (isForbidden) {
      title = "Acceso denegado u origen no permitido (HTTP 403)";
      explanation = "La solicitud fue rechazada por permisos o política CORS del servidor backend.";
    } else if (isTimeout) {
      title = "Tiempo de espera agotado";
      explanation = "El servidor tardó demasiado tiempo en responder. Puede estar saturado o iniciando servicios.";
    }

    return (
      <section role="alert" className="theme-card p-6 sm:p-8 max-w-2xl mx-auto space-y-4 my-8 text-center sm:text-left shadow-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${isWakingUp ? "bg-amber-500 animate-ping" : isNotFound ? "bg-rose-500" : isUnauthorized ? "bg-amber-600" : "bg-indigo-600"}`} />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {title}
          </h1>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          {explanation}
        </p>
        <p className="text-xs bg-slate-100 text-slate-700 p-3 rounded-xl font-mono overflow-x-auto border border-slate-200">
          {dataError}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button className="theme-primary" onClick={retryConnection}>
            Reintentar conexión
          </button>
          <button className="theme-secondary" onClick={resetDemo}>
            Reiniciar sesión demo
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-300"
            onClick={useLocalOfflineMode}
          >
            Continuar en modo evaluación (local)
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
