"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  Users,
  AlertTriangle,
  BookOpen,
  Award,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Bot,
  CheckCircle2,
} from "lucide-react";

export function TeacherDashboard() {
  const {
    students,
    practices,
    evidences,
    setActiveTeacherTab,
    handleQuickAction,
  } = useTutor();

  const studentsNeedingSupport = students.filter(
    (s) => (s.topicPerformances["fracciones-equivalentes"] ?? 100) < 65
  );

  const mariana = students.find((s) => s.id === "mariana-lopez");
  const marianaScore = mariana?.topicPerformances["fracciones-equivalentes"] ?? 52;
  const latestEvidence = evidences.find(e => e.studentId === mariana?.id && e.subjectId === "matematicas" && e.topicName.toLowerCase().includes("equivalentes"));
  const isMarianaImproved = !!latestEvidence && latestEvidence.improvementDelta > 0;

  // Real counts derived from state
  const activePracticesCount = practices.filter((p) => p.status === "pending" || p.status === "assigned" || p.status === "in_progress").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* SECCIÓN SUPERIOR: Saludo limpio sin bloques azules gigantes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Buenos días, Prof. Carlos
            </h1>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              3° B • Matemáticas
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-600">
            Tu grupo 3° B tiene {studentsNeedingSupport.length} estudiantes que necesitan apoyo esta semana.
          </p>
        </div>

        <button
          onClick={() => setActiveTeacherTab("support")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-xs flex items-center gap-2 self-start sm:self-center"
        >
          <span>Revisar alumnos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 KPI CARDS ELEGANTES: Mucho más limpio y espacioso */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Alumnos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Alumnos</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {students.length}
          </div>
          <p className="text-xs text-slate-500">Grupo 3° B Primaria</p>
        </div>

        {/* KPI 2: Necesitan apoyo */}
        <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-xs space-y-2 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Necesitan apoyo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {studentsNeedingSupport.length}
          </div>
          <p className="text-xs text-amber-800 font-medium">{studentsNeedingSupport.map(s=>`${s.name.split(" ")[0]} (${s.topicPerformances["fracciones-equivalentes"]}%)`).join(" · ") || "Sin alumnos bajo el umbral de apoyo"}</p>
        </div>

        {/* KPI 3: Prácticas activas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Prácticas activas</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {activePracticesCount}
          </div>
          <p className="text-xs text-slate-500">En progreso o por iniciar</p>
        </div>

        {/* KPI 4: Evidencias */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-2 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Evidencias</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {evidences.length}
          </div>
          <p className="text-xs text-emerald-800 font-medium">
            {isMarianaImproved ? "¡Mejora comprobada!" : "Registro auditable"}
          </p>
        </div>
      </div>

      {/* DETECCIÓN PRIORITARIA: Mariana López como elemento protagonista */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h2 className="text-lg font-bold text-slate-900">
              Atención prioritaria del grupo
            </h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recomendación del Tutor IA
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Datos del Alumno y Diagnóstico */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-base shadow-xs">
                ML
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl font-bold text-slate-900">
                    Mariana López
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    • Matemáticas • Fracciones equivalentes
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {isMarianaImproved ? (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      {marianaScore}% • ¡Mejora detectada (+{latestEvidence?.improvementDelta} pts)!
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {marianaScore}% • {marianaScore < 65 ? "Necesita refuerzo" : "Resultado actual"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pl-1 text-slate-700">
              <div className="text-sm font-semibold text-slate-900">
                Dificultad detectada: <span className="text-amber-800 font-bold">Comparación de denominadores</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Asume erróneamente que a mayor denominador mayor es la fracción, sin comprobar amplificación. Falló reactivos de comparación visual en la última evaluación.
              </p>
            </div>
          </div>

          {/* Acciones principales claras (jerarquía limpia) */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {isMarianaImproved ? (
              <button
                onClick={() => setActiveTeacherTab("progress")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
              >
                <span>Ver evidencia de avance ({marianaScore}%)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleQuickAction("create_practice_mariana")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
              >
                <span>Crear práctica personalizada</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => handleQuickAction("ask_mariana_gap")}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-6 py-3 rounded-xl border border-slate-200 transition text-center"
            >
              Ver diagnóstico detallado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
