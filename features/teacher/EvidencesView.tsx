"use client";

import React from "react";
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Registro de Evidencias de Aprendizaje
          </h1>
          <p className="text-xs text-slate-500">
            Auditoría pedagógica automatizada con métricas comparativas Antes / Después
          </p>
        </div>
        <button
          onClick={() => handleQuickAction("ask_mariana_improvement")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 self-start shadow-sm"
        >
          <Bot className="w-3.5 h-3.5 text-amber-300" />
          <span>Consultar progreso con Tutor IA</span>
        </button>
      </div>

      <div className="space-y-4">
        {evidences.map((ev) => (
          <div
            key={ev.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                  {ev.studentName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{ev.studentName}</h2>
                  <p className="text-xs text-slate-500">
                    Tema: <strong>{ev.topicName}</strong> • {new Date(ev.timestamp).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                  <span className="text-slate-500">Antes:</span>
                  <span className="font-extrabold text-slate-700">{ev.initialScore}%</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-slate-500">Después:</span>
                  <span className="font-extrabold text-blue-700">{ev.finalScore}%</span>
                </div>

                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{ev.improvementDelta}% • {ev.status}
                </span>
              </div>
            </div>

            {/* Observations from AI Tutor */}
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-xs space-y-1">
              <span className="text-blue-900 font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-blue-700" />
                Dictamen Pedagógico del Tutor IA
              </span>
              <p className="text-slate-700 leading-relaxed text-xs">
                {ev.tutorObservations}
              </p>
            </div>

            {/* Mastered vs Pending concepts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Conceptos Dominados en la Práctica
                </span>
                <ul className="space-y-1 text-slate-700">
                  {ev.masteredConcepts.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-amber-800 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Conceptos Pendientes para Siguiente Sesión
                </span>
                <ul className="space-y-1 text-slate-700">
                  {ev.pendingConcepts.length > 0 ? (
                    ev.pendingConcepts.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-amber-500 font-bold">⏳</span>
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
