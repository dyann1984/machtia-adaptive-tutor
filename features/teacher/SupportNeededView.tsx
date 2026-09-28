"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  AlertTriangle,
  Bot,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export function SupportNeededView() {
  const { students, handleQuickAction, practices } = useTutor();

  const studentsNeedingSupport = students.filter(
    (s) => (s.topicPerformances["fracciones-equivalentes"] ?? 100) < 65
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Alumnos con Dificultades Específicas
            </h1>
            <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
              {studentsNeedingSupport.length} alumnos
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Estudiantes identificados bajo el umbral mínimo (65%) que requieren intervención pedagógica focalizada.
          </p>
        </div>

        <button
          onClick={() => handleQuickAction("ask_who_needs_support")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 self-start sm:self-center shadow-xs"
        >
          <Bot className="w-4 h-4 text-amber-300" />
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
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-8 space-y-5 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 font-bold flex items-center justify-center text-sm shadow-xs border border-amber-100">
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
                    <p className="text-xs text-slate-500">
                      Promedio general: <strong>{student.overallAverage}</strong> • Grupo 3° B
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200 font-mono">
                  {fracScore}%
                </span>
              </div>

              {/* Materia y tema */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Materia</span>
                    <span className="font-bold text-slate-800 text-xs">Matemáticas</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Tema</span>
                    <span className="font-bold text-slate-800 text-xs">Fracciones equivalentes</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Dificultad detectada</span>
                  <span className="font-bold text-amber-800 text-xs">
                    Rezago conceptual en comparación de denominadores
                  </span>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1">
                  <span className="text-amber-800 font-bold text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Evidencia del diagnóstico
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    {student.learningGaps[0]?.detectionEvidence ||
                      "En el examen diagnóstico falló preguntas de amplificación de denominadores y selección gráfica."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                {hasAssigned ? (
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Práctica asignada</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Sin práctica activa</span>
                )}

                <button
                  onClick={() => handleQuickAction("generate_practice", { studentId: student.id })}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Crear práctica</span>
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
