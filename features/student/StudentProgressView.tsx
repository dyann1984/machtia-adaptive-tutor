"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { Award, CheckCircle2, TrendingUp, Sparkles, BookOpen } from "lucide-react";

export function StudentProgressView() {
  const { selectedStudentId, students, evidences } = useTutor();
  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const fracScore = student.topicPerformances["fracciones-equivalentes"] ?? 52;
  const isImproved = fracScore > 65;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mi Progreso de Aprendizaje</h1>
        <p className="text-xs text-slate-500">
          Revisa cuánto has avanzado y qué medallas has ganado con tu Tutor IA
        </p>
      </div>

      {/* Hero Achievement Card */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-2xl p-6 text-slate-950 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-900/10 px-2 py-0.5 rounded">
            Nivel de Dominio
          </span>
          <h2 className="text-xl font-black">
            Fracciones Equivalentes: {fracScore}%
          </h2>
          <p className="text-xs text-slate-800">
            {isImproved
              ? "¡Excelente avance! Has superado tu diagnóstico inicial con éxito."
              : "Continúa practicando con tu Tutor IA para subir tu puntaje."}
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/80 shadow-md flex items-center justify-center">
          <Award className="w-8 h-8 text-amber-600" />
        </div>
      </div>

      {/* Before vs After student perspective */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Tu Camino de Mejora</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Al inicio</span>
            <span className="text-2xl font-black text-amber-600 font-mono">52%</span>
            <span className="text-[11px] text-slate-500 block mt-1">Examen diagnóstico</span>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Ahora</span>
            <span className="text-2xl font-black text-emerald-700 font-mono">{fracScore}%</span>
            <span className="text-[11px] text-emerald-700 font-bold block mt-1">
              {isImproved ? "+28% ¡Mejora detectada!" : "En práctica"}
            </span>
          </div>
        </div>

        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2 text-xs">
          <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wide">
            Tus logros recientes:
          </span>
          <div className="space-y-1.5 text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Aprendiste que 1/2 y 2/4 cubren la misma mitad de chocolate 🍫</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Multiplicas numerador y denominador para comprobar equivalencias ✨</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Completaste 5 ejercicios adaptativos con apoyo del Tutor 🤖</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
