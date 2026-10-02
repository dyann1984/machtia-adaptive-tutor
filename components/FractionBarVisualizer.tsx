"use client";

import React from "react";

interface FractionBarProps {
  numerator: number;
  denominator: number;
  label?: string;
  color?: string;
}

export function FractionBarVisualizer({
  fractionA,
  fractionB,
  labelA,
  labelB,
  showEquivalence = true,
}: {
  fractionA: { numerator: number; denominator: number };
  fractionB: { numerator: number; denominator: number };
  labelA?: string;
  labelB?: string;
  showEquivalence?: boolean;
}) {
  const renderBar = (num: number, den: number, label?: string, fillColor = "bg-blue-600") => {
    const segments = Array.from({ length: den }, (_, i) => i);
    return (
      <div className="w-full space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          <span>{label || `${num}/${den}`}</span>
          <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
            {num}/{den} ({Math.round((num / den) * 100)}%)
          </span>
        </div>
        <div className="h-8 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300 flex shadow-inner">
          {segments.map((idx) => {
            const isFilled = idx < num;
            return (
              <div
                key={idx}
                className={`h-full border-r last:border-r-0 border-slate-300 transition-all duration-500 flex items-center justify-center text-[10px] font-bold ${
                  isFilled ? `${fillColor} text-white` : "bg-white text-slate-300"
                }`}
                style={{ width: `${100 / den}%` }}
              >
                {isFilled ? "✓" : ""}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isEquiv =
    fractionA.numerator * fractionB.denominator ===
    fractionA.denominator * fractionB.numerator;

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50/70 to-amber-50/50 rounded-xl border border-blue-200/80 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Representación gráfica interactiva
        </span>
        {isEquiv && showEquivalence ? (
          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
            ¡Mismo valor exacto ({Math.round((fractionA.numerator / fractionA.denominator) * 100)}%)!
          </span>
        ) : (
          <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
            Comparativa
          </span>
        )}
      </div>

      <div className="space-y-3 pt-1">
        {renderBar(fractionA.numerator, fractionA.denominator, labelA, "bg-blue-600")}
        {renderBar(fractionB.numerator, fractionB.denominator, labelB, "bg-amber-500")}
      </div>

      <p className="text-[11px] text-slate-600 italic text-center pt-1 border-t border-slate-200/60">
        💡 Nota cómo ambas barras tienen el mismo largo total, pero están divididas en cantidades de partes distintas.
      </p>
    </div>
  );
}
