"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface ChocolateBarInteractiveProps {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
  isEvaluated: boolean;
  correctAnswer: string;
  evaluationResult?: { isCorrect: boolean } | null;
}

export function ChocolateBarInteractive({
  options,
  selectedOption,
  onSelect,
  isEvaluated,
  correctAnswer,
  evaluationResult,
}: ChocolateBarInteractiveProps) {
  // Number of shaded pieces in the 6-piece chocolate bar (0 to 6)
  const [shadedPieces, setShadedPieces] = useState<number>(() => {
    if (!selectedOption) return 0;
    if (selectedOption.includes("1 parte")) return 1;
    if (selectedOption.includes("2 partes")) return 2;
    if (selectedOption.includes("3 partes")) return 3;
    if (selectedOption.includes("4 partes")) return 4;
    return 0;
  });

  // Keep pieces in sync if selectedOption is changed from outside
  useEffect(() => {
    if (!selectedOption) {
      setShadedPieces(0);
      return;
    }
    if (selectedOption.includes("1 parte")) setShadedPieces(1);
    else if (selectedOption.includes("2 partes")) setShadedPieces(2);
    else if (selectedOption.includes("3 partes")) setShadedPieces(3);
    else if (selectedOption.includes("4 partes")) setShadedPieces(4);
  }, [selectedOption]);

  const handlePieceClick = (pieceIndex: number) => {
    if (isEvaluated) return;
    const newCount = pieceIndex + 1; // 1-based count
    setShadedPieces(newCount);

    // Map to corresponding option text
    const matchedOption = options.find((opt) =>
      opt.startsWith(`${newCount} parte`) || opt.startsWith(`${newCount} partes`)
    );
    if (matchedOption) {
      onSelect(matchedOption);
    }
  };

  const isExactEquivalence = isEvaluated && evaluationResult?.isCorrect && shadedPieces === 2;

  return (
    <div className="space-y-6">
      {/* MANIPULADOR DIDÁCTICO: BARRAS DE CHOCOLATE */}
      <div className="bg-gradient-to-br from-amber-900/10 via-amber-800/5 to-amber-700/10 rounded-2xl border-2 border-amber-800/30 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-700 animate-pulse" />
            Manipulador Interactivo • Barras de Chocolate
          </span>
          <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            Toca los trozos para colorear
          </span>
        </div>

        {/* Barra 1: Barra de Mariana (dividida en 3 partes, come 1 parte = 1/3) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-amber-950">
            <span>Barra original de Mariana (3 partes iguales)</span>
            <span className="bg-amber-100 px-2 py-0.5 rounded text-amber-900 border border-amber-300 font-mono">
              Comió 1/3 (33%)
            </span>
          </div>

          <div className="h-10 w-full bg-amber-100/60 rounded-xl overflow-hidden border-2 border-amber-900/40 grid grid-cols-3 p-1 gap-1.5 shadow-inner">
            <div className="h-full rounded-lg bg-amber-900 text-amber-100 flex items-center justify-center text-xs font-black shadow-sm ring-1 ring-amber-700">
              1/3 comido
            </div>
            <div className="h-full rounded-lg bg-amber-200/50 border border-dashed border-amber-800/40 flex items-center justify-center text-xs text-amber-800/70 font-semibold">
              vacío
            </div>
            <div className="h-full rounded-lg bg-amber-200/50 border border-dashed border-amber-800/40 flex items-center justify-center text-xs text-amber-800/70 font-semibold">
              vacío
            </div>
          </div>
        </div>

        {/* Guía visual punteada de alineación */}
        <div className="relative flex justify-center">
          <div className="w-full border-t-2 border-dashed border-amber-400/80" />
          <span className="absolute -top-2.5 bg-white px-2.5 text-[11px] font-extrabold text-amber-800 rounded-full border border-amber-300">
            {isExactEquivalence ? "✨ ¡Mismo largo exacto coloreado! ✨" : "Compara la longitud de ambas barras"}
          </span>
        </div>

        {/* Barra 2: Barra interactiva dividida en 6 partes */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold text-amber-950">
            <span>Tu barra (dividida en 6 partes iguales)</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold border ${
              isExactEquivalence
                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                : "bg-amber-100 text-amber-900 border-amber-300"
            }`}>
              Has coloreado: {shadedPieces}/6 ({Math.round((shadedPieces / 6) * 100)}%)
            </span>
          </div>

          <div className="h-12 w-full bg-amber-100/60 rounded-xl overflow-hidden border-2 border-amber-900/50 grid grid-cols-6 p-1 gap-1.5 shadow-inner">
            {Array.from({ length: 6 }).map((_, idx) => {
              const isSelectedPiece = idx < shadedPieces;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePieceClick(idx)}
                  disabled={isEvaluated}
                  aria-label={`Trozos de chocolate: colorear hasta la pieza ${idx + 1}`}
                  className={`h-full rounded-lg transition-all duration-200 flex flex-col items-center justify-center text-xs font-black select-none ${
                    isSelectedPiece
                      ? isExactEquivalence
                        ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300 scale-[0.98]"
                        : "bg-amber-800 text-amber-100 shadow-md ring-1 ring-amber-700 scale-[0.98]"
                      : "bg-white/80 hover:bg-amber-100 text-amber-900/70 border border-dashed border-amber-700/40 hover:scale-[1.02]"
                  }`}
                >
                  <span>{idx + 1}</span>
                  <span className="text-[9px] font-normal opacity-80">1/6</span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-amber-900 font-medium text-center pt-1">
            👉 Haz clic en los trozos de tu barra para descubrir cuántos sextos coinciden con el tercio de Mariana.
          </p>
        </div>
      </div>

      {/* TARJETAS DE OPCIONES SINCRONIZADAS */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
          Confirma tu respuesta seleccionando una tarjeta:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            let cardStyle =
              "bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800 hover:border-amber-400";

            if (isEvaluated) {
              if (evaluationResult?.isCorrect && option === correctAnswer) {
                // Highlight only when correct
                cardStyle =
                  "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-300 shadow-md";
              } else if (isSelected && !evaluationResult?.isCorrect) {
                // Highlight incorrect choice gently without spoiling the answer
                cardStyle = "bg-amber-50 border-amber-400 text-amber-950 font-bold ring-4 ring-amber-200 shadow-xs";
              }
            } else if (isSelected) {
              cardStyle =
                "bg-amber-50 border-amber-500 text-amber-950 font-black ring-4 ring-amber-300 shadow-md scale-[1.01]";
            }

            return (
              <button
                key={idx}
                type="button"
                data-testid={`exercise-option-${idx}`}
                onClick={() => !isEvaluated && onSelect(option)}
                disabled={isEvaluated}
                aria-pressed={isSelected}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex flex-wrap items-center justify-between gap-2 select-none focus:outline-hidden focus:ring-4 focus:ring-amber-300 ${cardStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-8 h-8 rounded-xl bg-white border border-slate-300 text-slate-800 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-extrabold text-base sm:text-lg">{option}</span>
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
