"use client";

import React from "react";
import { Check } from "lucide-react";

interface FractionCardInteractiveProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  isEvaluated: boolean;
  correctAnswer: string;
  evaluationResult?: { isCorrect: boolean } | null;
}

/**
 * Parses fraction strings like "2/4", "1/2", "2 partes (2/6)" into numerator and denominator.
 */
function parseFraction(opt: string): { num: number; den: number } | null {
  const match = opt.match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    return { num: parseInt(match[1], 10), den: parseInt(match[2], 10) };
  }
  return null;
}

export function FractionCardInteractive({
  options,
  selectedOption,
  onSelect,
  isEvaluated,
  correctAnswer,
  evaluationResult,
}: FractionCardInteractiveProps) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
        Elige tu respuesta observando las barras visuales:
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const parsed = parseFraction(option);

          let cardStyle =
            "bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800 hover:border-blue-300";

          if (isEvaluated) {
            if (evaluationResult?.isCorrect && option === correctAnswer) {
              // Highlight only when correct
              cardStyle =
                "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-300 shadow-md";
            } else if (isSelected && !evaluationResult?.isCorrect) {
              // Highlight selected incorrect attempt gently without revealing the right answer
              cardStyle =
                "bg-amber-50 border-amber-400 text-amber-950 font-bold ring-4 ring-amber-200 shadow-xs";
            }
          } else if (isSelected) {
            cardStyle =
              "bg-blue-50 border-blue-600 text-blue-950 font-black ring-4 ring-blue-300 shadow-md scale-[1.01]";
          }

          return (
            <button
              key={idx}
              type="button"
              data-testid={`exercise-option-${idx}`}
              onClick={() => !isEvaluated && onSelect(option)}
              disabled={isEvaluated}
              aria-pressed={isSelected}
              aria-label={`Opción ${String.fromCharCode(65 + idx)}: ${option}`}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between gap-3 select-none focus:outline-hidden focus:ring-4 focus:ring-blue-300 ${cardStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-800 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-black text-xl sm:text-2xl text-slate-900 font-mono">
                    {option}
                  </span>
                </div>

                {isEvaluated && evaluationResult?.isCorrect && option === correctAnswer && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {isEvaluated && !evaluationResult?.isCorrect && isSelected && (
                  <div className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
                    Revisar con pista
                  </div>
                )}
              </div>

              {/* Visual fraction bar preview for this option */}
              {parsed && parsed.den > 0 && (
                <div className="w-full space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>
                      {parsed.num} de {parsed.den} partes
                    </span>
                    <span>{Math.round((parsed.num / parsed.den) * 100)}%</span>
                  </div>
                  <div className="h-4 w-full bg-white rounded-md overflow-hidden border border-slate-200 flex shadow-inner">
                    {Array.from({ length: parsed.den }).map((_, segmentIdx) => {
                      const isFilled = segmentIdx < parsed.num;
                      return (
                        <div
                          key={segmentIdx}
                          style={{ width: `${100 / parsed.den}%` }}
                          className={`h-full border-r last:border-r-0 border-slate-200 transition-colors ${
                            isFilled
                              ? isSelected
                                ? evaluationResult?.isCorrect
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                                : "bg-blue-600"
                              : "bg-slate-50"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
