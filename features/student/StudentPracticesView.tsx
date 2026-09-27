"use client";

import React, { useState } from "react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mis Prácticas de Matemáticas</h1>
        <p className="text-xs text-slate-500">
          Actividades adaptativas personalizadas creadas por tu Tutor IA para reforzar tus temas
        </p>
      </div>

      {studentPractices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">
            Aún no tienes prácticas asignadas
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cambia a la vista del <strong>Profesor</strong> en la barra superior para pedirle al Tutor IA que analice al grupo y genere tu práctica personalizada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {studentPractices.map((practice) => {
            const isCompleted = practice.status === "completed";
            return (
              <div
                key={practice.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {practice.topicName}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{practice.title}</h2>
                    <p className="text-xs text-slate-500">{practice.description}</p>
                  </div>

                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completada
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Pendiente
                    </span>
                  )}
                </div>

                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-xs space-y-1">
                  <span className="text-blue-900 font-bold block text-[10px] uppercase">
                    Estructura:
                  </span>
                  <p className="text-slate-700">
                    Explicación guiada paso a paso + 5 reactivos adaptativos con pistas dinámicas.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-500">5 ejercicios</span>
                  <button
                    onClick={() => setCurrentPracticingId(practice.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{isCompleted ? "Repasar práctica" : "Resolver práctica"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
