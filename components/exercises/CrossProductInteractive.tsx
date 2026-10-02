"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

interface CrossProductInteractiveProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  isEvaluated: boolean;
  correctAnswer: string;
  evaluationResult?: { isCorrect: boolean } | null;
}

export function CrossProductInteractive({
  options,
  selectedOption,
  onSelect,
  isEvaluated,
  correctAnswer,
  evaluationResult,
}: CrossProductInteractiveProps) {
  const [firstProduct, setFirstProduct] = useState("");
  const [secondProduct, setSecondProduct] = useState("");
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 space-y-3">
        <p className="font-bold">Compara 3/4 y 6/8 calculando los productos cruzados:</p>
        <label className="flex flex-wrap items-center gap-3">3 × 8 =
          <input aria-label="Resultado de 3 por 8" inputMode="numeric" value={firstProduct} onChange={(event) => setFirstProduct(event.target.value)} disabled={isEvaluated} className="w-20 p-2 rounded-lg border border-slate-300" />
        </label>
        <label className="flex flex-wrap items-center gap-3">4 × 6 =
          <input aria-label="Resultado de 4 por 6" inputMode="numeric" value={secondProduct} onChange={(event) => setSecondProduct(event.target.value)} disabled={isEvaluated} className="w-20 p-2 rounded-lg border border-slate-300" />
        </label>
        {firstProduct && secondProduct && <p aria-live="polite">{firstProduct === "24" && secondProduct === "24" ? "¡Bien calculado! Compara tus resultados y elige tu conclusión." : "Revisa cada multiplicación contando grupos iguales. Inténtalo otra vez."}</p>}
      </div>
      {/* TARJETAS DE OPCIONES */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Selecciona la afirmación correcta:
        </span>

        <div className="grid grid-cols-1 gap-3">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            let cardStyle =
              "bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800 hover:border-purple-300";

            if (isEvaluated) {
              if (evaluationResult?.isCorrect && option === correctAnswer) {
                cardStyle =
                  "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-300 shadow-md";
              } else if (isSelected && !evaluationResult?.isCorrect) {
                cardStyle = "bg-amber-50 border-amber-400 text-amber-950 font-bold ring-4 ring-amber-200 shadow-xs";
              }
            } else if (isSelected) {
              cardStyle =
                "bg-purple-50 border-purple-600 text-purple-950 font-black ring-4 ring-purple-300 shadow-md scale-[1.005]";
            }

            return (
              <button
                key={idx}
                type="button"
                data-testid={`exercise-option-${idx}`}
                onClick={() => !isEvaluated && onSelect(option)}
                disabled={isEvaluated}
                aria-pressed={isSelected}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-4 select-none focus:outline-hidden focus:ring-4 focus:ring-purple-300 ${cardStyle}`}
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
