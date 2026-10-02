"use client";

import React from "react";
import { SupportLedger } from "@/components/SupportLedger";
import { useTutor } from "@/lib/context/tutor-context";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  ArrowRight,
  User,
} from "lucide-react";

export function TeacherProgressView() {
  const { students, evidences, handleQuickAction } = useTutor();

  const mariana = students.find((s) => s.id === "mariana-lopez");
  const marianaCurrent = mariana?.topicPerformances["fracciones-equivalentes"] ?? 52;
  const evidence = evidences.find((item) => item.studentId === "mariana-lopez" && item.topicName === "Fracciones equivalentes");
  const initial = evidence?.initialScore ?? 52;
  const delta = marianaCurrent - initial;
  const isImproved = delta > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Encabezado limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Progreso y Evidencias
            </h1>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              Grupo 3° B
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Auditoría pedagógica que demuestra la asimilación conceptual tras la intervención del Tutor IA.
          </p>
        </div>

        <button
          onClick={() => handleQuickAction("ask_mariana_improvement")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs self-start sm:self-center"
        >
          <Bot className="w-4 h-4 text-amber-300" />
          <span>Consultar al Tutor: &quot;¿Mejoró Mariana?&quot;</span>
        </button>
      </div>

      {/* TARJETA ANTES / DESPUÉS FOTOGÉNICA PARA EL VIDEO */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-8">
        {/* Cabecera del alumno */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg shadow-xs">
              ML
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Mariana López
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  {isImproved ? "Estado: Mejora detectada" : "En diagnóstico activo"}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Materia: <strong className="text-slate-800">Matemáticas</strong> • Tema: <strong className="text-slate-800">Fracciones equivalentes</strong>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-center font-medium">
            Resultado generado a partir de la práctica realizada
          </div>
        </div>

        {/* COMPARATIVA GRÁFICA: ANTES 52% → DESPUÉS 80% • +28 pts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* ANTES */}
          <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80 text-center space-y-1">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              ANTES
            </span>
            <div className="text-4xl font-black text-amber-600 font-mono">
              {initial}%
            </div>
            <span className="text-xs text-amber-700 block font-medium">
              Diagnóstico inicial
            </span>
          </div>

          {/* FLECHA Y MEJORA */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-2">
            <div className="text-slate-400 font-bold text-2xl">→</div>
            <div className="text-3xl font-black text-emerald-600 font-mono">
              {delta >= 0 ? "+" : ""}{delta} pts
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full inline-block">
              Puntos porcentuales
            </span>
          </div>

          {/* DESPUÉS */}
          <div className="bg-blue-50/60 p-6 rounded-2xl border border-blue-200/80 text-center space-y-1">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
              DESPUÉS
            </span>
            <div className="text-4xl font-black text-blue-700 font-mono">
              {marianaCurrent}%
            </div>
            <span className="text-xs text-blue-700 block font-medium">
              Práctica con Tutor IA
            </span>
          </div>
        </div>

        {/* CONCEPTOS CONSOLIDADOS VS. CONCEPTOS POR REFORZAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Conceptos consolidados */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Conceptos consolidados</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-700 font-medium">{(evidence?.masteredConcepts ?? []).map((concept) => <li key={concept}>✓ {concept}</li>)}</ul>
          </div>

          {/* Conceptos por reforzar */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Conceptos por reforzar</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-700 font-medium">{(evidence?.pendingConcepts ?? []).map((concept) => <li key={concept}>⏳ {concept}</li>)}</ul>
          </div>
        </div>

        {evidence && <SupportLedger evidence={evidence} />}
        {/* Dictamen Pedagógico */}
        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
          <Bot className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
              Observación del Tutor IA
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">
              {evidence?.tutorObservations ?? "Completa una práctica para registrar el recorrido y sus resultados."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
