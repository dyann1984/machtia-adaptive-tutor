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
  TrendingUp,
} from "lucide-react";

export function GroupView() {
  const { students, group, subject, handleQuickAction } = useTutor();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Grupo {group.name} • {group.grade}
          </h1>
          <p className="text-xs text-slate-500">
            Materia: <strong>{subject.name}</strong> • 5 alumnos registrados • Seguimiento adaptativo continuo
          </p>
        </div>
        <button
          onClick={() => handleQuickAction("ask_who_needs_support")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 self-start shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Consultar rezago con Tutor IA</span>
        </button>
      </div>

      {/* Students Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Listado de Alumnos y Diagnóstico de Desempeño</span>
          <span className="font-mono text-slate-500">Tema activo: Fracciones equivalentes</span>
        </div>

        <div className="divide-y divide-slate-100">
          {students.map((student) => {
            const fracScore = student.topicPerformances["fracciones-equivalentes"] ?? 0;
            const needsSupport = fracScore < 65;

            return (
              <div
                key={student.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                      needsSupport
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-blue-100 text-blue-900 border border-blue-200"
                    }`}
                  >
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{student.name}</h3>
                      {needsSupport ? (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Requiere apoyo
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Desempeño óptimo
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Promedio General: <strong>{student.overallAverage}</strong></span>
                      <span>•</span>
                      <span>
                        Fracciones Equivalentes:{" "}
                        <strong className={needsSupport ? "text-amber-600 font-bold" : "text-emerald-700"}>
                          {fracScore}%
                        </strong>
                      </span>
                    </div>

                    {needsSupport && (
                      <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/80 inline-block mt-1">
                        <strong>Error detectado:</strong> {student.recurringErrors["fracciones-equivalentes"]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {needsSupport ? (
                    <>
                      <button
                        onClick={() => handleQuickAction("inspect_student", { studentId: student.id })}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-3 py-2 rounded-xl transition"
                      >
                        Ver brecha
                      </button>
                      <button
                        onClick={() => handleQuickAction("generate_practice", { studentId: student.id })}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Crear práctica de apoyo</span>
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
