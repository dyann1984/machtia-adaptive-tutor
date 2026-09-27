"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Bot,
  Award,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function StudentHome({
  onStartPractice,
}: {
  onStartPractice: (practiceId: string) => void;
}) {
  const { practices, selectedStudentId, students, setActiveStudentTab } = useTutor();

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentPractices = practices.filter((p) => p.studentId === student.id);
  const pendingPractice = studentPractices.find((p) => p.status !== "completed");
  const completedPractice = studentPractices.find((p) => p.status === "completed");

  return (
    <div className="space-y-6">
      {/* Student Welcome Hero */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-2xl p-6 text-slate-900 shadow-md relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-slate-900/10 text-slate-900 text-xs px-2.5 py-1 rounded-full font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-900" />
            <span>Portal de Alumno • 3° B Primaria</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            ¡Hola, {student.name.split(" ")[0]}! 🎒✨
          </h1>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            Tu Tutor IA ha preparado actividades interactivas para que domines las matemáticas jugando y entendiendo cada paso.
          </p>
        </div>
      </div>

      {/* Main Focus: Pending Practice Card */}
      {pendingPractice ? (
        <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 inline-block mb-1">
                  Nueva práctica asignada por tu profesor
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Fracciones equivalentes
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-200">
                    5 ejercicios
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    Nivel adaptado
                  </span>
                  <span className="bg-purple-50 text-purple-800 font-semibold px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-purple-600" />
                    Tutor disponible
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onStartPractice(pendingPractice.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2 self-start sm:self-center"
            >
              <span>Comenzar práctica ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 text-xs space-y-1">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-700" />
              Mensaje de tu Tutor IA:
            </span>
            <p className="text-slate-700 leading-relaxed">
              &quot;¡Hola {student.name.split(" ")[0]}! Antes de comenzar los ejercicios, te mostraré una forma súper sencilla y visual con barras de chocolate para identificar fracciones equivalentes. ¡Vamos a divertirnos!&quot;
            </p>
          </div>
        </div>
      ) : completedPractice ? (
        <div className="bg-white rounded-2xl border border-emerald-300 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Práctica completada
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {completedPractice.title}
              </h2>
              <p className="text-xs text-slate-500">Calificación obtenida: 80% • ¡Mejora registrada!</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-3">
          <Bot className="w-8 h-8 text-blue-600 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No tienes prácticas pendientes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            El profesor Carlos asignará tu práctica adaptativa en cuanto finalice el diagnóstico del grupo.
          </p>
        </div>
      )}

      {/* Topics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-1">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Materia</span>
          <p className="font-bold text-slate-800 text-sm">Matemáticas</p>
          <span className="text-slate-500">Prof. Carlos Vega</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-1">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Tema Actual</span>
          <p className="font-bold text-slate-800 text-sm">Fracciones equivalentes</p>
          <span className="text-emerald-700 font-medium">Nivel: Refuerzo guiado</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-1">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Tutor Activo</span>
          <p className="font-bold text-blue-700 text-sm">MACHTIA Tutor IA</p>
          <span className="text-slate-500">Explicaciones paso a paso</span>
        </div>
      </div>
    </div>
  );
}
