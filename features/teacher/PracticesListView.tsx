"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";

export function PracticesListView() {
  const { practices, handleQuickAction, setRole, setActiveStudentTab, setSelectedStudentId } = useTutor();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Prácticas Asignadas por el Tutor IA</h1>
          <p className="text-xs text-slate-500">
            Monitoreo en tiempo real del estado de resolución y ejercicios interactivos adaptativos
          </p>
        </div>
      </div>

      {practices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">No hay prácticas asignadas todavía</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Pide al Tutor IA que analice al grupo o presiona el botón para generar la primera práctica adaptativa para Mariana López.
            </p>
          </div>
          <button
            onClick={() => handleQuickAction("generate_practice", { studentId: "mariana-lopez" })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition inline-flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Crear práctica de apoyo para Mariana</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {practices.map((practice) => {
            const isCompleted = practice.status === "completed";
            return (
              <div
                key={practice.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {practice.topicName}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{practice.title}</h2>
                    <p className="text-xs text-slate-500">
                      Asignada a: <strong>{practice.studentName}</strong>
                    </p>
                  </div>

                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
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

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                    Objetivo de Refuerzo Adaptativo:
                  </span>
                  <p className="text-slate-700">{practice.targetGapDescription}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>5 ejercicios interactivos</span>
                  <button
                    onClick={() => {
                      setSelectedStudentId(practice.studentId);
                      setRole("student");
                      setActiveStudentTab("practices");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <span>{isCompleted ? "Ver en Alumno" : "Resolver como Alumno"}</span>
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
