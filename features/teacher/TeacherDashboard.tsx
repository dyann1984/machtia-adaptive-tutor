"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  Users,
  AlertTriangle,
  BookOpen,
  Award,
  Bot,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export function TeacherDashboard() {
  const {
    group,
    subject,
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
  const isMarianaImproved = marianaScore > 65;

  return (
    <div className="space-y-6">
      {/* Hero Welcome with Quick Prompt Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 text-xs px-2.5 py-1 rounded-full border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ciclo Escolar 2026-2027 • Grupo {group.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bienvenido al Panel Pedagógico, Prof. Carlos Vega
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Tu Tutor IA analiza de forma continua el desempeño curricular en <strong>{subject.name}</strong>,
            detectando brechas conceptuales tempranas y prescribiendo prácticas adaptativas individuales.
          </p>

          <div className="pt-3 flex flex-wrap gap-2.5">
            <button
              onClick={() => handleQuickAction("ask_who_needs_support")}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Bot className="w-4 h-4 text-slate-950" />
              <span>Preguntar: &quot;¿Quién necesita apoyo en matemáticas?&quot;</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTeacherTab("tutor")}
              className="bg-blue-800/80 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition border border-blue-600"
            >
              Abrir Consola del Agente IA
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Alumnos Totales</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{students.length} alumnos</div>
          <div className="text-xs text-slate-500">Grupo 3° B Primaria</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-1 bg-amber-50/30">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold">
            <span>Requieren Refuerzo</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {studentsNeedingSupport.length} alumnos
          </div>
          <div className="text-xs text-amber-800">Mariana (52%) y Luis (58%)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Prácticas Asignadas</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{practices.length} prácticas</div>
          <div className="text-xs text-slate-500">
            {practices.filter((p) => p.status === "completed").length} completadas
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-1 bg-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
            <span>Evidencias Registradas</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{evidences.length} evidencias</div>
          <div className="text-xs text-emerald-800">
            {isMarianaImproved ? "¡Mejora detectada en Mariana!" : "En diagnóstico activo"}
          </div>
        </div>
      </div>

      {/* Main Action Callout: Mariana López Attention */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              ML
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Detección prioritaria: Mariana López
                </h2>
                {isMarianaImproved ? (
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    ¡Progreso: {marianaScore}% (+28%)!
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                    Rezago: 52% en Fracciones equivalentes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Error recurrente detectado: <strong>Comparación de denominadores</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickAction("inspect_mariana")}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl font-medium transition"
            >
              Ver brecha y evidencia
            </button>
            <button
              onClick={() => handleQuickAction("generate_practice", { studentId: "mariana-lopez" })}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <span>Generar práctica adaptativa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Snapshot Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">
              Evidencia que justificó la detección
            </span>
            <p className="text-slate-700 leading-snug">
              Falló 4 de 7 reactivos de comparación en el último examen diagnóstico. Confunde 1/2 con 1/4 y afirma que 2/6 es menor que 1/6.
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">
              Prescripción Pedagógica
            </span>
            <p className="text-slate-700 leading-snug">
              Explicación gráfica paso a paso con barras de chocolate + 5 ejercicios adaptativos con feedback inmediato y pistas dinámicas.
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">
              Estado del Flujo
            </span>
            <p className="text-slate-700 font-medium">
              {practices.some((p) => p.studentId === "mariana-lopez") ? (
                <span className="text-blue-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Práctica creada y asignada en portal del alumno
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  Pendiente de generar práctica adaptativa
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access to Group and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Resumen del Grupo 3° B</h3>
            <button
              onClick={() => setActiveTeacherTab("group")}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Ver todos (5) →
            </button>
          </div>
          <div className="space-y-2 text-xs">
            {students.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center">
                    {st.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-800">{st.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Fracciones:</span>
                  <span
                    className={`font-bold ${
                      (st.topicPerformances["fracciones-equivalentes"] ?? 0) < 65
                        ? "text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                        : "text-emerald-700"
                    }`}
                  >
                    {st.topicPerformances["fracciones-equivalentes"]}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Evidencias Recientes</h3>
            <button
              onClick={() => setActiveTeacherTab("evidences")}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Ver reporte completo →
            </button>
          </div>
          {evidences.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No hay evidencias registradas aún.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {evidences.slice(0, 2).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{ev.studentName}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {ev.status} (+{ev.improvementDelta}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                    <span>Antes: <strong>{ev.initialScore}%</strong></span>
                    <span>→</span>
                    <span>Después: <strong>{ev.finalScore}%</strong></span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic line-clamp-1">
                    {ev.tutorObservations}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
