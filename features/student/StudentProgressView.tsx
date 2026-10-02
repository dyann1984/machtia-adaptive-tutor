"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { Award, CheckCircle2, TrendingUp, Sparkles, BookOpen } from "lucide-react";

export function StudentProgressView() {
  const { selectedStudentId, students } = useTutor();
  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const fracScore = student.topicPerformances["fracciones-equivalentes"] ?? 52;
  const isImproved = fracScore > 65;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mi Progreso de Aprendizaje
          </h1>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
            {student.name}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Revisa cuánto has avanzado y los conceptos que has dominado con tu Tutor IA.
        </p>
      </div>

      {/* Hero Achievement Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
            Nivel de Dominio
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Fracciones Equivalentes: {fracScore}%
          </h2>
          <p className="text-sm text-slate-600 max-w-md">
            {isImproved
              ? "¡Excelente avance! Has superado tu diagnóstico inicial con éxito."
              : "Continúa practicando con tu Tutor IA para subir tu puntaje."}
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs shrink-0">
          <Award className="w-9 h-9" />
        </div>
      </div>

      {/* Before vs After student perspective */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-6">
        <h3 className="font-bold text-slate-900 text-lg">Tu Camino de Mejora</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Al inicio</span>
            <div className="text-3xl font-black text-amber-600 font-mono">52%</div>
            <span className="text-xs text-slate-500 block">Examen diagnóstico</span>
          </div>

          <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Ahora</span>
            <div className="text-3xl font-black text-emerald-600 font-mono">{fracScore}%</div>
            <span className="text-xs text-emerald-700 font-bold block">
              {isImproved ? `+${fracScore - 52}% ¡Mejora detectada!` : "En práctica"}
            </span>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-sm">
          <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
            Tus logros recientes:
          </span>
          <div className="space-y-2 text-slate-700 font-medium">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Aprendiste que 1/2 y 2/4 cubren la misma porción de la barra visual</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Multiplicas numerador y denominador por el mismo número para comprobar equivalencias</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Completaste 5 ejercicios adaptativos con apoyo guiado del Tutor IA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
