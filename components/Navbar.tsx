"use client";

import React from "react";
import Image from "next/image";
import { useTutor } from "@/lib/context/tutor-context";
import {
  RotateCcw,
  Sparkles,
  GraduationCap,
  UserCheck,
  Bot,
  BarChart3,
  Layers,
  BookOpen,
  Award,
  AlertTriangle,
} from "lucide-react";

export function Navbar() {
  const {
    role,
    setRole,
    activeTeacherTab,
    setActiveTeacherTab,
    activeStudentTab,
    setActiveStudentTab,
    resetDemo,
    students,
  } = useTutor();

  const studentsNeedingSupportCount = students.filter(
    (s) => (s.topicPerformances["fracciones-equivalentes"] ?? 100) < 65
  ).length;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Top Banner: Hackathon info & Role Switcher */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            Hackathon Amazon / Alexa+ & Nebius Ready
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300 font-mono text-[11px]">
            MCP Tool Protocol: 12 Tools Activas
          </span>
        </div>

        {/* Global Demo Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setRole("teacher")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                role === "teacher"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Rol: Profesor (Prof. Vega)</span>
            </button>
            <button
              onClick={() => setRole("student")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                role === "student"
                  ? "bg-amber-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Rol: Alumna (Mariana)</span>
            </button>
          </div>

          <button
            onClick={resetDemo}
            title="Reiniciar datos para nuevo pitch de demostración"
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700 transition"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Reiniciar Demo</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* MACHTIA Brand + Logo + "Adaptive Tutor" descriptor */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 p-0.5 shadow-md flex items-center justify-center overflow-hidden border border-blue-300">
                <Image
                  src="/machtia-logo.jpg"
                  alt="MACHTIA Logo"
                  width={44}
                  height={44}
                  className="object-cover w-full h-full rounded-lg"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-blue-900 font-sans">
                  MACHT<span className="text-amber-500">IA</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                  Adaptive Tutor
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium -mt-0.5">
                Tutor Inteligente de Aprendizaje Personalizado
              </span>
            </div>
          </div>

          {/* Navigation Tabs depending on active Role */}
          <nav className="hidden lg:flex items-center gap-1">
            {role === "teacher" ? (
              <>
                <button
                  onClick={() => setActiveTeacherTab("dashboard")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTeacherTab === "dashboard"
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTeacherTab("group")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTeacherTab === "group"
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Mi Grupo (3° B)
                </button>
                <button
                  onClick={() => setActiveTeacherTab("tutor")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 relative ${
                    activeTeacherTab === "tutor"
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "text-blue-700 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 font-semibold"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-amber-300" />
                  Tutor IA (Agente)
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>
                <button
                  onClick={() => setActiveTeacherTab("support")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTeacherTab === "support"
                      ? "bg-amber-50 text-amber-800 font-semibold border border-amber-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Alumnos con rezago
                  {studentsNeedingSupportCount > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {studentsNeedingSupportCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTeacherTab("practices")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTeacherTab === "practices"
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Prácticas
                </button>
                <button
                  onClick={() => setActiveTeacherTab("evidences")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTeacherTab === "evidences"
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Evidencias
                </button>
                <button
                  onClick={() => setActiveTeacherTab("progress")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeTeacherTab === "progress"
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Progreso Antes/Después
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveStudentTab("home")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeStudentTab === "home"
                      ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Inicio Alumna
                </button>
                <button
                  onClick={() => setActiveStudentTab("practices")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 relative ${
                    activeStudentTab === "practices"
                      ? "bg-amber-500 text-white font-semibold shadow-sm"
                      : "text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-semibold"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mis Prácticas
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                </button>
                <button
                  onClick={() => setActiveStudentTab("tutor")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeStudentTab === "tutor"
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  Mi Tutor IA
                </button>
                <button
                  onClick={() => setActiveStudentTab("progress")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeStudentTab === "progress"
                      ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Mi Progreso
                </button>
              </>
            )}
          </nav>

          {/* Current Profile Badge */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">
                {role === "teacher" ? "Prof. Carlos Vega" : "Mariana López"}
              </p>
              <p className="text-[10px] text-slate-500">
                {role === "teacher" ? "3° B • Matemáticas" : "Alumna • 3° B"}
              </p>
            </div>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner ${
                role === "teacher" ? "bg-blue-700" : "bg-amber-500"
              }`}
            >
              {role === "teacher" ? "CV" : "ML"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
