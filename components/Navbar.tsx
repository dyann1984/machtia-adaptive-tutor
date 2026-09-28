"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTutor } from "@/lib/context/tutor-context";
import { TutorRobotAvatar } from "./TutorRobotAvatar";
import {
  RotateCcw,
  Sparkles,
  GraduationCap,
  UserCheck,
  Bot,
  BarChart3,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  LayoutDashboard,
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
    mcpStatus,
    showLanding,
    setShowLanding,
  } = useTutor();

  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  const studentsNeedingSupportCount = students.filter(
    (s) => (s.topicPerformances["fracciones-equivalentes"] ?? 100) < 65
  ).length;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* IZQUIERDA: Logo MACHTIA + Adaptive Tutor + Badges discretos */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setShowLanding(true)}
              className="flex items-center gap-3 group text-left focus:outline-hidden py-1"
              title="Volver a la portada de MACHTIA Adaptive Tutor"
            >
              <TutorRobotAvatar size="sm" priority />

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-blue-900 font-sans leading-none group-hover:text-blue-700 transition">
                    MACHT<span className="text-amber-500">IA</span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                    Adaptive Tutor
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium tracking-normal mt-0.5">
                  Tutor Educativo Inteligente
                </span>
              </div>
            </button>

            {/* Badges discretos integrados con elegancia (sin segunda barra) */}
            <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                  mcpStatus.connected
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : "bg-amber-50 text-amber-700 border border-amber-200/80"
                }`}
                title={mcpStatus.connected ? `MCP Streamable HTTP conectado (${mcpStatus.latencyMs}ms)` : "Modo seguro autónomo activo"}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mcpStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                ></span>
                <span>{mcpStatus.connected ? "MCP Conectado" : "Modo Demo"}</span>
              </span>

              <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                Alexa+ Ready
              </span>
            </div>
          </div>

          {/* CENTRO: Navegación de pestañas clara y espaciosa */}
          {!showLanding && (
            <nav className="hidden lg:flex items-center gap-1.5">
              {role === "teacher" ? (
                <>
                  <button
                    onClick={() => setActiveTeacherTab("dashboard")}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeTeacherTab === "dashboard"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setActiveTeacherTab("group")}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeTeacherTab === "group"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Mi grupo</span>
                  </button>

                  <button
                    onClick={() => setActiveTeacherTab("tutor")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 relative ${
                      activeTeacherTab === "tutor"
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-blue-700 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/70 font-semibold"
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                    <span>Tutor IA</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </button>

                  <button
                    onClick={() => setActiveTeacherTab("support")}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeTeacherTab === "support"
                        ? "bg-amber-50 text-amber-900 font-bold border border-amber-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Apoyo</span>
                    {studentsNeedingSupportCount > 0 && (
                      <span className="bg-amber-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                        {studentsNeedingSupportCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTeacherTab("practices")}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeTeacherTab === "practices"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Prácticas</span>
                  </button>

                  <button
                    onClick={() => setActiveTeacherTab("evidences")}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeTeacherTab === "evidences"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Evidencias</span>
                  </button>

                  <button
                    onClick={() => setActiveTeacherTab("progress")}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeTeacherTab === "progress"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Progreso</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveStudentTab("home")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeStudentTab === "home"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Inicio Alumna</span>
                  </button>

                  <button
                    onClick={() => setActiveStudentTab("practices")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 relative ${
                      activeStudentTab === "practices"
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "text-blue-700 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/70 font-semibold"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Mis Prácticas</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  </button>

                  <button
                    onClick={() => setActiveStudentTab("tutor")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeStudentTab === "tutor"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                    <span>Mi Tutor IA</span>
                  </button>

                  <button
                    onClick={() => setActiveStudentTab("progress")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeStudentTab === "progress"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Mi Progreso</span>
                  </button>
                </>
              )}
            </nav>
          )}

          {/* DERECHA: Selector Profesor / Alumno + Avatar + Menú secundario */}
          <div className="flex items-center gap-3">
            {/* Segmented Role Switcher elegante */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80 shadow-xs">
              <button
                onClick={() => {
                  setShowLanding(false);
                  setRole("teacher");
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  !showLanding && role === "teacher"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Cambiar a vista de Profesor"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Profesor</span>
              </button>

              <button
                onClick={() => {
                  setShowLanding(false);
                  setRole("student");
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  !showLanding && role === "student"
                    ? "bg-white text-amber-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Cambiar a vista de Alumna"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Alumna</span>
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2.5 pl-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                  role === "teacher" ? "bg-blue-600" : "bg-amber-500"
                }`}
              >
                {role === "teacher" ? "CV" : "ML"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {role === "teacher" ? "Prof. Carlos Vega" : "Mariana López"}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {role === "teacher" ? "3° B • Primaria" : "Alumna • 3° B"}
                </span>
              </div>
            </div>

            {/* Secondary Actions / Options Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                title="Opciones de demostración"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {showSecondaryMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSecondaryMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                    <button
                      onClick={() => {
                        setShowLanding(!showLanding);
                        setShowSecondaryMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>{showLanding ? "Ir a la aplicación" : "Ver Landing de presentación"}</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        resetDemo();
                        setShowLanding(false);
                        setShowSecondaryMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-xl flex items-center gap-2 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reiniciar demostración</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
