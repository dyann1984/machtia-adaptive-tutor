"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  AlertTriangle,
  Bot,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export function SupportNeededView() {
  const { students, handleQuickAction, practices } = useTutor();

  const studentsNeedingSupport = students.filter(
    (s) => (s.topicPerformances["fracciones-equivalentes"] ?? 100) < 65
  );

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-950">
              Alumnos con Dificultades Específicas Detectadas
            </h1>
            <p className="text-xs text-amber-900/80">
              El Tutor IA identificó a 2 estudiantes cuyos aciertos en fracciones equivalentes están por debajo del umbral mínimo (65%).
            </p>
          </div>
        </div>

        <button
          onClick={() => handleQuickAction("ask_who_needs_support")}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 self-start shadow-sm"
        >
          <Bot className="w-4 h-4 text-amber-400" />
          <span>Ejecutar detección en vivo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studentsNeedingSupport.map((student) => {
          const fracScore = student.topicPerformances["fracciones-equivalentes"] ?? 0;
          const hasAssigned = practices.some((p) => p.studentId === student.id);

          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm border border-amber-200">
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{student.name}</h2>
                    <p className="text-xs text-slate-500">
                      Promedio general: <strong>{student.overallAverage}</strong> • Grupo 3° B
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-300">
                  {fracScore}% aciertos
                </span>
              </div>

              {/* Required fields from user specification */}
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Materia</span>
                    <span className="font-bold text-slate-800">Matemáticas</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Tema</span>
                    <span className="font-bold text-slate-800">Fracciones equivalentes</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Nivel de Dificultad Detectado</span>
                  <span className="font-bold text-amber-700">
                    Rezago conceptual alto (Confusión sistemática en denominadores)
                  </span>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-1">
                  <span className="text-amber-800 font-bold text-[11px] flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Evidencia que justificó la detección
                  </span>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    {student.learningGaps[0]?.detectionEvidence ||
                      "En el examen diagnóstico falló preguntas de amplificación de denominadores y selección gráfica."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                {hasAssigned ? (
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Práctica asignada: Pendiente</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Sin práctica activa</span>
                )}

                <button
                  onClick={() => handleQuickAction("generate_practice", { studentId: student.id })}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Crear práctica de apoyo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
