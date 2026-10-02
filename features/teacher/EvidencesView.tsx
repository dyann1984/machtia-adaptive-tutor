"use client";

import React from "react";
import { SupportLedger } from "@/components/SupportLedger";
import { subjectName } from "@/lib/learning/catalog";
import { useTutor } from "@/lib/context/tutor-context";
import {
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  FileCheck,
} from "lucide-react";

export function EvidencesView() {
  const { evidences, handleQuickAction } = useTutor();

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Registro de Evidencias de Aprendizaje
            </h1>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              Auditoría Docente
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Métricas comparativas cuantitativas y cualitativas de asimilación conceptual Antes vs. Después.
          </p>
        </div>
        <button
          onClick={() => handleQuickAction("ask_mariana_improvement")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 self-start shadow-xs"
        >
          <Bot className="w-3.5 h-3.5 text-amber-300" />
          <span>Consultar progreso con Tutor IA</span>
        </button>
      </div>

      <div className="space-y-6">
        {evidences.map((ev) => (
          <div
            key={ev.id}
            data-subject={ev.subjectId}
            className="subject-shell theme-card rounded-3xl border shadow-sm p-5 sm:p-10 space-y-6 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm shadow-xs">
                  {ev.studentName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{ev.studentName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tema: <strong className="text-slate-700">{ev.topicName}</strong> • {new Date(ev.timestamp).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                  <span className="text-slate-500">Antes:</span>
                  <span className="font-extrabold text-amber-700">{ev.baselineAvailable === false ? "Sin diagnóstico" : `${ev.initialScore}%`}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-slate-500">Después:</span>
                  <span className="font-extrabold text-blue-700">{ev.finalScore}%</span>
                </div>

                <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{ev.baselineAvailable === false ? "Primera medición" : `${ev.improvementDelta >= 0 ? "+" : ""}${ev.improvementDelta} pts`} • {ev.status}</span>
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 font-medium">
              {subjectName(ev.subjectId)} · Resultado generado a partir de la práctica realizada
            </div>

            {/* Observations from AI Tutor */}
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-xs space-y-1.5">
              <span className="text-blue-900 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                Dictamen Pedagógico del Tutor IA
              </span>
              <p className="text-slate-700 leading-relaxed text-sm">
                {ev.tutorObservations}
              </p>
            </div>

            {/* Mastered vs Pending concepts */}
            <SupportLedger evidence={ev} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="font-bold text-emerald-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Conceptos Dominados en la Práctica
                </span>
                <ul className="space-y-1.5 text-slate-700 font-medium text-xs">
                  {ev.masteredConcepts.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="font-bold text-amber-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Conceptos Pendientes para Siguiente Sesión
                </span>
                <ul className="space-y-1.5 text-slate-700 font-medium text-xs">
                  {ev.pendingConcepts.length > 0 ? (
                    ev.pendingConcepts.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">⏳</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No hay pendientes críticos</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
