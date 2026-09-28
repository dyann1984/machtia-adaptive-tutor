"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  ArrowRight,
  BarChart3,
  Calendar,
} from "lucide-react";

export function TeacherProgressView() {
  const { students, evidences, handleQuickAction } = useTutor();

  const mariana = students.find((s) => s.id === "mariana-lopez");
  const marianaCurrent = mariana?.topicPerformances["fracciones-equivalentes"] ?? 52;
  const initial = 52;
  const delta = marianaCurrent - initial;
  const isImproved = delta > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Comparativa de Progreso: Antes vs. Después
          </h1>
          <p className="text-xs text-slate-500">
            Impacto pedagógico cuantificable de la intervención guiada por el Tutor IA
          </p>
        </div>
        <button
          onClick={() => handleQuickAction("ask_mariana_improvement")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 self-start shadow-sm"
        >
          <Bot className="w-3.5 h-3.5 text-amber-300" />
          <span>Consultar al Tutor: &quot;¿Mejoró Mariana?&quot;</span>
        </button>
      </div>

      {/* Required Judge Comparison Card */}
      <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-md p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Auditoría Pedagógica Docente • Evaluación
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-1">Mariana López</h2>
            <p className="text-xs text-slate-500">
              Materia: <strong className="text-slate-700">Matemáticas</strong> • Tema: <strong className="text-slate-700">Fracciones equivalentes</strong>
            </p>
          </div>
          <div className="text-xs text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start">
            &ldquo;Resultado generado a partir de la práctica realizada.&rdquo;
          </div>
        </div>

        {/* ANTES / DESPUÉS / MEJORA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">ANTES</span>
            <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">{initial}%</span>
            <span className="text-[11px] text-amber-700 block mt-0.5">Diagnóstico Inicial</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">DESPUÉS</span>
            <span className="text-3xl font-black text-blue-700 font-mono mt-1 block">{marianaCurrent}%</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">Práctica con Tutor IA</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">MEJORA</span>
            <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">+{delta}</span>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">puntos porcentuales</span>
          </div>
        </div>

        {/* DOMINADO / PENDIENTE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1.5">
            <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Dominado:
            </span>
            <p className="text-slate-800 font-bold text-sm">Identificación de equivalencias</p>
            <p className="text-slate-500 text-[11px]">Equivalencia visual de 1/2 y 2/4, amplificación por factor común y comprobación por productos cruzados.</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-1.5">
            <span className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Pendiente:
            </span>
            <p className="text-slate-800 font-bold text-sm">Simplificación</p>
            <p className="text-slate-500 text-[11px]">Reducción de fracciones con máximo común divisor mayor a 10 para la siguiente sesión de refuerzo.</p>
          </div>
        </div>
      </div>

      {/* Hero Before vs After Metric Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-blue-900/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-xs px-3 py-1 rounded-full border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Estudiante evaluada: Mariana López (3° B)</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Tema: Fracciones Equivalentes
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Intervención mediante modelo adaptativo: diagnóstico de rezago en comparación de denominadores → práctica interactiva con barras gráficas → retroalimentación formativa y ajuste de dificultad.
            </p>
          </div>

          {/* Large Before / After Display */}
          <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 shadow-inner">
            <div className="text-center px-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Diagnóstico Inicial
              </span>
              <span className="text-3xl font-extrabold text-amber-400 font-mono">
                {initial}%
              </span>
              <span className="text-[10px] text-amber-300/80 block mt-0.5">Rezago crítico</span>
            </div>

            <div className="text-slate-500 font-bold text-xl">→</div>

            <div className="text-center px-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Resultado Actual
              </span>
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                {marianaCurrent}%
              </span>
              <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                {isImproved ? `+${delta}% aumento` : "Sin cambio"}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Visualization */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Progreso hacia el dominio curricular (Meta: 80%+)</span>
            <span className="font-mono text-emerald-400 font-bold">{marianaCurrent} / 100</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-1000 rounded-full"
              style={{ width: `${marianaCurrent}%` }}
            ></div>
            <div
              className="absolute top-0 bottom-0 border-r-2 border-white/60"
              style={{ left: `${initial}%` }}
              title="Punto inicial: 52%"
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Inicio: 52% (Línea blanca)</span>
            <span>Meta recomendada: 80%</span>
            <span>Dominio total: 100%</span>
          </div>
        </div>
      </div>

      {/* Qualitative Evidence breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Conceptos que Mariana dominó con el Tutor
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong>Equivalencia visual de 1/2 con 2/4:</strong>
                <p className="text-slate-500 text-[11px]">Comprende que cubrir la misma proporción geométrica mantiene el valor numérico idéntico.</p>
              </div>
            </li>
            <li className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong>Amplificación por factor 2:</strong>
                <p className="text-slate-500 text-[11px]">Aplica la regla de multiplicar numerador y denominador por el mismo factor sin alterar la proporción.</p>
              </div>
            </li>
            <li className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong>Comprobación por productos cruzados:</strong>
                <p className="text-slate-500 text-[11px]">Identificó con éxito que 3/4 = 6/8 porque 3×8 = 24 y 4×6 = 24.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Siguientes pasos recomendados para Mariana
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
              <span className="text-amber-600 font-bold">⏳</span>
              <div>
                <strong>Simplificación con números mayores:</strong>
                <p className="text-slate-500 text-[11px]">Reforzar la división del máximo común divisor en fracciones como 12/18 o 15/25.</p>
              </div>
            </li>
            <li className="flex items-start gap-2 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-bold">💡</span>
              <div>
                <strong>Recomendación del Tutor IA:</strong>
                <p className="text-slate-500 text-[11px]">Programar un repaso de 3 ejercicios de simplificación en la próxima sesión.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
