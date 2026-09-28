"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export function GroupView() {
  const { students, group, subject, handleQuickAction } = useTutor();

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Grupo {group.name} • {group.grade}
            </h1>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              5 alumnos registrados
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Materia: <strong className="text-slate-800">{subject.name}</strong> • Seguimiento continuo del desempeño pedagógico.
          </p>
        </div>

        <button
          onClick={() => handleQuickAction("ask_who_needs_support")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 self-start sm:self-center shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Consultar rezago con Tutor IA</span>
        </button>
      </div>

      {/* Students Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Expedientes de Alumnos y Diagnóstico de Desempeño</span>
          <span className="text-slate-500 font-medium">Tema activo: Fracciones equivalentes</span>
        </div>

        <div className="divide-y divide-slate-100">
          {students.map((student) => {
            const fracScore = student.topicPerformances["fracciones-equivalentes"] ?? 0;
            const needsSupport = fracScore < 65;

            return (
              <div
                key={student.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                      needsSupport
                        ? "bg-amber-50 text-amber-900 border border-amber-200"
                        : "bg-blue-50 text-blue-900 border border-blue-200"
                    }`}
                  >
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-base">{student.name}</h3>
                      {needsSupport ? (
                        <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Requiere apoyo
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Desempeño óptimo
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>Promedio General: <strong className="text-slate-700">{student.overallAverage}</strong></span>
                      <span>•</span>
                      <span>
                        Fracciones Equivalentes:{" "}
                        <strong className={needsSupport ? "text-amber-600 font-bold font-mono" : "text-emerald-700 font-mono"}>
                          {fracScore}%
                        </strong>
                      </span>
                    </div>

                    {needsSupport && (
                      <p className="text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 inline-block mt-1">
                        <strong>Error detectado:</strong> {student.recurringErrors["fracciones-equivalentes"]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  {needsSupport ? (
                    <>
                      <button
                        onClick={() => handleQuickAction("inspect_student", { studentId: student.id })}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition"
                      >
                        Ver brecha
                      </button>
                      <button
                        onClick={() => handleQuickAction("generate_practice", { studentId: student.id })}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Crear práctica</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium px-3 py-2">
                      Sin rezago crítico
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
