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
