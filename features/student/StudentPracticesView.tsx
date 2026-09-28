"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { InteractivePracticeRunner } from "./InteractivePracticeRunner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Bot,
} from "lucide-react";

export function StudentPracticesView() {
  const {
    practices,
    selectedStudentId,
    students,
    currentPracticingId,
    setCurrentPracticingId,
  } = useTutor();

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentPractices = practices.filter((p) => p.studentId === student.id);

  // If a practice is currently selected for solving
  const activePractice = currentPracticingId
    ? practices.find((p) => p.id === currentPracticingId)
    : null;

  if (activePractice) {
    return (
      <InteractivePracticeRunner
        practice={activePractice}
        onFinish={() => setCurrentPracticingId(null)}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mis Prácticas de Matemáticas
          </h1>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
            {student.name}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Actividades adaptativas preparadas por tu Tutor IA para reforzar y comprender cada concepto.
        </p>
      </div>

      {studentPractices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">
              Aún no tienes prácticas asignadas
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Cambia a la vista del <strong>Profesor</strong> en el menú superior para pedirle al Tutor IA que analice al grupo y genere tu práctica personalizada.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studentPractices.map((practice) => {
            const isCompleted = practice.status === "completed";
            return (
              <div
                key={practice.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-8 space-y-5 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-blue-700 tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {practice.topicName}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">{practice.title}</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">{practice.description}</p>
                  </div>

                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Completada
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 shrink-0">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Pendiente
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">
                    Estructura:
                  </span>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Explicación previa visual con barras + 5 reactivos adaptativos con pistas dinámicas.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">5 ejercicios</span>
                  <button
                    onClick={() => setCurrentPracticingId(practice.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs"
                  >
                    <span>{isCompleted ? "Repasar práctica" : "Resolver práctica"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
