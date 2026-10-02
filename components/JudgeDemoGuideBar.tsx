"use client";

import React, { useState } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  Sparkles,
  Bot,
  UserCheck,
  GraduationCap,
  Award,
} from "lucide-react";

interface GuideStep {
  step: number;
  title: string;
  badge: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  targetRole: "teacher" | "student";
}

export function JudgeDemoGuideBar({
  onOpenAlexaSimulator,
}: {
  onOpenAlexaSimulator: () => void;
}) {
  const {
    role,
    setRole,
    activeTeacherTab,
    setActiveTeacherTab,
    activeStudentTab,
    setActiveStudentTab,
    selectedStudentId,
    setSelectedStudentId,
    setCurrentPracticingId,
    students,
    practices,
    evidences,
    isJudgeDemo,
    showJudgeGuide,
    setShowJudgeGuide,
    judgeGuideStep,
    setJudgeGuideStep,
    resetDemo,
    showLanding,
  } = useTutor();

  const [isMinimized, setIsMinimized] = useState(false);

  if (!isJudgeDemo || !showJudgeGuide || showLanding) {
    return null;
  }

  const mariana = students.find((s) => s.id === "mariana-lopez");
  const marianaScore = mariana?.topicPerformances["fracciones-equivalentes"] ?? 52;
  const isMarianaImproved = marianaScore > 65;

  const steps: GuideStep[] = [
    {
      step: 1,
      badge: "Paso 1 • Detección en el Aula",
      title: "Identifica el rezago de Mariana López (52%)",
      description:
        "En el Dashboard docente, observa la alerta en Mariana López (52% en fracciones equivalentes). Pulsa 'Mi Tutor IA' para diagnosticar la causa raíz del error.",
      actionLabel: "Abrir Tutor IA para Diagnóstico",
      targetRole: "teacher",
      onAction: () => {
        setRole("teacher");
        setActiveTeacherTab("tutor");
        setJudgeGuideStep(2);
      },
    },
    {
      step: 2,
      badge: "Paso 2 • Diagnóstico & Prescripción",
      title: "Diagnostica la brecha y prescribe práctica adaptativa",
      description:
        "En el Tutor IA, haz clic en '¿Quién necesita apoyo en matemáticas?' o 'Ver brecha de Mariana López', y luego pulsa 'Generar Práctica Adaptativa'.",
      actionLabel: "Ir a la experiencia de Mariana",
      targetRole: "student",
      onAction: () => {
        setSelectedStudentId("mariana-lopez");
        setRole("student");
        setActiveStudentTab("practices");
        const studentPractices = practices.filter((p) => p.studentId === "mariana-lopez");
        const pending = studentPractices.find((p) => p.status !== "completed") || studentPractices[0];
        if (pending) {
          setCurrentPracticingId(pending.id);
        }
        setJudgeGuideStep(3);
      },
    },
    {
      step: 3,
      badge: "Paso 3 • Práctica de la Alumna",
      title: "Acompañamiento didáctico con Tutor Robot",
      description:
        "Como Mariana, resuelve los ejercicios interactivos. Observa la explicación visual previa, prueba pedir pistas o equivocarte para recibir andamiaje, y finaliza.",
      actionLabel: "Ver Evidencia Docente (+28 pts)",
      targetRole: "teacher",
      onAction: () => {
        setRole("teacher");
        setActiveTeacherTab("evidences");
        setJudgeGuideStep(4);
      },
    },
    {
      step: 4,
      badge: "Paso 4 • Evidencia Verificable",
      title: "Comprueba el avance cuantitativo y cualitativo",
      description:
        "Observa la nueva tarjeta de LearningEvidence de Mariana López: calificación 80% (+28 puntos delta), conceptos dominados y pendientes calculados en tiempo real.",
      actionLabel: "Abrir Simulador Alexa+ (MCP Real)",
      targetRole: "teacher",
      onAction: () => {
        onOpenAlexaSimulator();
        setJudgeGuideStep(5);
      },
    },
    {
      step: 5,
      badge: "Paso 5 • Alexa+ & Streamable HTTP",
      title: "Prueba la orquestación vocal sobre MCP real",
      description:
        "En el simulador interactivo de Alexa+, interactúa con voz o respuestas rápidas ('dos cuartos'). Revisa el Inspector JSON-RPC con llamadas reales al puerto 3100.",
      actionLabel: "Reiniciar Escenario Oficial",
      targetRole: "teacher",
      onAction: () => {
        resetDemo();
        setJudgeGuideStep(1);
      },
    },
  ];

  const currentStep = steps[judgeGuideStep - 1] || steps[0];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg border border-blue-400/40 flex items-center gap-2 hover:bg-blue-800 transition"
        >
          <Compass className="w-4 h-4 text-cyan-300 animate-spin-slow" />
          <span>Guía Demo Juez (Paso {judgeGuideStep}/5)</span>
          <ChevronUp className="w-3.5 h-3.5 text-blue-200" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white border-b border-blue-500/30 px-4 py-3 shadow-md relative z-30 transition-all">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Izquierda: Indicador de paso y descripción */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-4 h-4" />
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {currentStep.badge}
              </span>
              <span className="text-xs font-bold text-white">
                {currentStep.title}
              </span>
              {isMarianaImproved && judgeGuideStep >= 3 && (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  ✓ Mariana: 80% (+28 pts)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Derecha: Botón de acción rápida + Controles */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={currentStep.onAction}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm hover:translate-y-[-1px]"
          >
            <span>{currentStep.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Stepper numérico rápido */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700">
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => setJudgeGuideStep(s.step)}
                title={s.title}
                className={`w-6 h-6 rounded-lg text-[11px] font-bold transition flex items-center justify-center ${
                  judgeGuideStep === s.step
                    ? "bg-cyan-500 text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s.step}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              resetDemo();
              setJudgeGuideStep(1);
            }}
            title="Reiniciar escenario oficial"
            className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            title="Minimizar barra de guía"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowJudgeGuide(false)}
            title="Cerrar guía (Modo libre)"
            className="p-2 text-slate-400 hover:text-rose-300 hover:bg-slate-800/60 rounded-xl transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
