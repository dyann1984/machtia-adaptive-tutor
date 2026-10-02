"use client";

import React, { useState } from "react";
import { PracticeComposer } from "./PracticeComposer";
import { subjectName } from "@/lib/learning/catalog";
import { useTutor } from "@/lib/context/tutor-context";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function PracticesListView() {
  const [showComposer, setShowComposer] = useState(false);
  const { practices, handleQuickAction, setRole, setActiveStudentTab, setSelectedStudentId } = useTutor();

  if (showComposer) return <PracticeComposer onClose={() => setShowComposer(false)} />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Prácticas Asignadas
            </h1>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              Tutor IA
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Monitoreo en tiempo real del estado de resolución y ejercicios interactivos adaptativos.
          </p>
        </div>
      </div>

      <button className="subject-shell theme-primary" onClick={() => setShowComposer(true)}>Crear práctica</button>

      {practices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">No hay prácticas asignadas todavía</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Pide al Tutor IA que analice al grupo o presiona el botón para generar la primera práctica adaptativa para Mariana López.
            </p>
          </div>
          <button
            onClick={() => handleQuickAction("generate_practice", { studentId: "mariana-lopez" })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition inline-flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Crear práctica de apoyo para Mariana</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practices.map((practice) => {
            const isCompleted = practice.status === "completed";
            return (
              <div
                key={practice.id}
                data-subject={practice.subjectId}
                className="subject-shell theme-card rounded-3xl border shadow-xs p-5 sm:p-8 space-y-5 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-blue-700 tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {subjectName(practice.subjectId)} · {practice.topicName}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">{practice.title}</h2>
                    <p className="text-xs text-slate-500">
                      Asignada a: <strong className="text-slate-700">{practice.studentName}</strong>
                    </p>
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
                    Objetivo de Refuerzo Adaptativo:
                  </span>
                  <p className="text-slate-700 text-sm leading-relaxed">{practice.learningObjective || practice.targetGapDescription || practice.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="font-medium">{practice.exercises.length} ejercicios · aprox. {practice.estimatedMinutes || Math.ceil(practice.exercises.length * 1.5 + 2)} min</span>
                  <button
                    onClick={() => {
                      setSelectedStudentId(practice.studentId);
                      setRole("student");
                      setActiveStudentTab("practices");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5"
                  >
                    <span>{isCompleted ? "Ver en Alumno" : "Resolver como Alumno"}</span>
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
