"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";

interface RelationalComparisonInteractiveProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  isEvaluated: boolean;
  correctAnswer: string;
  evaluationResult?: { isCorrect: boolean } | null;
}

export function RelationalComparisonInteractive({
  options,
  selectedOption,
  onSelect,
  isEvaluated,
  correctAnswer,
  evaluationResult,
}: RelationalComparisonInteractiveProps) {
  const isCorrect = isEvaluated && evaluationResult?.isCorrect;

  return (
    <div className="space-y-6">
      {/* TABLERO DE COMPARACIÓN Y FACTOR COMÚN */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-emerald-50/40 rounded-2xl border-2 border-indigo-200 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Comprobación de Relación entre Fracciones
          </span>
          <span className="text-xs font-bold text-slate-700 bg-white/90 px-3 py-0.5 rounded-full border border-indigo-200">
            {isCorrect ? "✨ Proporción idéntica comprobada ✨" : "Compara las representaciones"}
          </span>
        </div>

        {/* Visualización en paralelo de ambas fracciones */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Fracción Izquierda: 2/5 */}
          <div className="sm:col-span-5 bg-white p-4 rounded-xl border border-indigo-200 space-y-2 text-center shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">Primera fracción</span>
            <div className="text-3xl font-black text-blue-700 font-mono">2 / 5</div>
            <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300 flex">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{ width: "20%" }}
                  className={`h-full border-r last:border-r-0 border-slate-300 ${
                    idx < 2 ? "bg-blue-600" : "bg-white"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-600">2 de 5 partes coloreadas</span>
          </div>

          {/* Factor Central de Relación */}
          <div className="sm:col-span-2 flex flex-col items-center justify-center gap-1 py-2 sm:py-0">
            <div className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-sm flex items-center gap-1">
              <span>{isCorrect ? "× 2" : "¿Factor?"}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 text-center">
              {isCorrect ? "arriba y abajo" : "numerador y denominador"}
            </span>
          </div>

          {/* Fracción Derecha: 4/10 */}
          <div className="sm:col-span-5 bg-white p-4 rounded-xl border border-emerald-200 space-y-2 text-center shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase">Segunda fracción</span>
            <div className="text-3xl font-black text-emerald-700 font-mono">4 / 10</div>
            <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300 flex">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{ width: "10%" }}
                  className={`h-full border-r last:border-r-0 border-slate-300 ${
                    idx < 4 ? "bg-emerald-600" : "bg-white"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-600">4 de 10 partes coloreadas</span>
          </div>
        </div>

        <div className="p-3 bg-white/90 rounded-xl border border-indigo-200/70 text-xs font-semibold text-slate-700 text-center">
          💡 <strong>Pista para reflexionar:</strong> Observa si existe un número entero que multiplique tanto al numerador como al denominador de la primera fracción para llegar a la segunda.
        </div>
      </div>

      {/* OPCIONES DE RESPUESTA */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Selecciona la afirmación con el argumento correcto:
        </span>

        <div className="grid grid-cols-1 gap-3">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            let cardStyle =
              "bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800 hover:border-indigo-300";

            if (isEvaluated) {
              if (evaluationResult?.isCorrect && option === correctAnswer) {
                cardStyle =
                  "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-300 shadow-md";
              } else if (isSelected && !evaluationResult?.isCorrect) {
                cardStyle = "bg-amber-50 border-amber-400 text-amber-950 font-bold ring-4 ring-amber-200 shadow-xs";
              }
            } else if (isSelected) {
              cardStyle =
                "bg-indigo-50 border-indigo-600 text-indigo-950 font-black ring-4 ring-indigo-300 shadow-md scale-[1.005]";
            }

            return (
              <button
                key={idx}
                type="button"
                data-testid={`exercise-option-${idx}`}
                onClick={() => !isEvaluated && onSelect(option)}
                disabled={isEvaluated}
                aria-pressed={isSelected}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-4 select-none focus:outline-hidden focus:ring-4 focus:ring-indigo-300 ${cardStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-800 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-bold text-sm sm:text-base leading-snug">{option}</span>
                </div>

                {isEvaluated && evaluationResult?.isCorrect && option === correctAnswer && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {isEvaluated && !evaluationResult?.isCorrect && isSelected && (
                  <div className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0">
                    Revisar con pista
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
