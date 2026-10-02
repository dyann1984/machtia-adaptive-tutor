"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Check, ArrowRight, RotateCcw, Lightbulb, CheckCircle2, HelpCircle, BookOpen, Star } from "lucide-react";
import confetti from "canvas-confetti";
import { TutorEmotion } from "@/components/TutorRobotAvatar";

interface InteractiveFractionDiscoveryProps {
  onComplete: () => void;
  onTutorUpdate?: (data: {
    speechText: string;
    dialogText: string;
    emotion: TutorEmotion;
  }) => void;
}

export function InteractiveFractionDiscovery({
  onComplete,
  onTutorUpdate,
}: InteractiveFractionDiscoveryProps) {
  // Discovery Steps: 1: Observa | 2: Pinta 1/2 | 3: Descubre 2/4 | 4: Compara
  const [subStep, setSubStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 interactive challenge: "¿Cuál está dividida en más partes?"
  const [step1Answer, setStep1Answer] = useState<"A" | "B" | null>(null);

  // User interactive selections
  const [selectedPartsA, setSelectedPartsA] = useState<number[]>([]);
  const [selectedPartsB, setSelectedPartsB] = useState<number[]>([]);

  // Step 4 Conceptual Question states
  const [selectedConceptOption, setSelectedConceptOption] = useState<"A" | "B" | "C" | null>(null);
  const [conceptFeedback, setConceptFeedback] = useState<string | null>(null);

  const onTutorUpdateRef = useRef(onTutorUpdate);
  useEffect(() => {
    onTutorUpdateRef.current = onTutorUpdate;
  });

  // Dynamic pedagogical micro-lesson messages for each step & interaction
  useEffect(() => {
    if (!onTutorUpdateRef.current) return;

    if (subStep === 1) {
      if (step1Answer === null) {
        onTutorUpdateRef.current({
          dialogText:
            "¡Hola Mariana! 👋 Tengo un reto para ti.\n\nMira estas dos barras:\n\n¿Cuál está dividida en más partes? Toca la opción que creas correcta.",
          speechText:
            "Hola, Mariana. Tengo un reto para ti. Mira estas dos barras. ¿Cuál de las dos está dividida en más partes? Toca la opción que creas correcta.",
          emotion: "explaining",
        });
      } else if (step1Answer === "A") {
        onTutorUpdateRef.current({
          dialogText:
            "Mira las líneas que separan cada barra. Cuenta sus partes. ¿Cuál tiene más divisiones?",
          speechText:
            "Mira las líneas que separan cada barra. Cuenta sus partes. ¿Cuál tiene más divisiones?",
          emotion: "hint",
        });
      } else {
        // step1Answer === "B"
        onTutorUpdateRef.current({
          dialogText:
            "¡Exacto! 🎉\n\nEsta tiene cuatro partes y la otra solamente dos.\n\nAunque están divididas de manera diferente, las dos barras representan el mismo entero.\n\nAhora vamos a ver qué sucede cuando pintamos la misma cantidad.",
          speechText:
            "¡Exacto! Esta tiene cuatro partes y la otra solamente dos. Aunque están divididas de manera diferente, las dos barras representan el mismo entero. Ahora vamos a ver qué sucede cuando pintamos la misma cantidad.",
          emotion: "success",
        });
      }
    } else if (subStep === 2) {
      if (selectedPartsA.length === 0) {
        onTutorUpdateRef.current({
          dialogText:
            "Ahora quiero que pintes la mitad de esta barra.\n\nToca una de sus dos partes.",
          speechText:
            "Ahora quiero que pintes la mitad de esta barra. Toca una de sus dos partes.",
          emotion: "normal",
        });
      } else {
        onTutorUpdateRef.current({
          dialogText:
            "¡Eso es! 🎉 Pintaste 1 de 2 partes.\n\nEso se escribe:\n1/2\n\ny se llama un medio.\n\nFíjate bien en cuánto espacio ocupa la parte pintada antes de pasar a la siguiente barra.",
          speechText:
            "¡Eso es! Pintaste una de dos partes. Eso se escribe un medio y se llama un medio. Fíjate bien en cuánto espacio ocupa la parte pintada.",
          emotion: "success",
        });
      }
    } else if (subStep === 3) {
      if (selectedPartsB.length === 0) {
        onTutorUpdateRef.current({
          dialogText:
            "Ahora viene el reto.\n\nEsta barra tiene cuatro partes.\n\nQuiero que pintes exactamente la misma cantidad que arriba.\n\n¿Cuántas partes necesitarás?",
          speechText:
            "Ahora viene el reto. Esta barra tiene cuatro partes. Quiero que pintes exactamente la misma cantidad que arriba. ¿Cuántas partes crees que necesitaremos?",
          emotion: "thinking",
        });
      } else if (selectedPartsB.length === 1) {
        onTutorUpdateRef.current({
          dialogText:
            "Compáralas:\n\n¿La parte pintada ocupa el mismo espacio que arriba?\n\nObserva dónde termina la zona pintada de cada barra.",
          speechText:
            "Compáralas. ¿La parte pintada ocupa el mismo espacio que arriba? Observa dónde termina la zona pintada de cada barra.",
          emotion: "hint",
        });
      } else if (selectedPartsB.length > 2) {
        onTutorUpdateRef.current({
          dialogText:
            "Te pasaste de la mitad.\n\nPrueba quitando partes para que ocupe exactamente la misma longitud que el medio azul.",
          speechText:
            "Te pasaste de la mitad. Quita algún trozo para que coincida exactamente con la longitud de un medio.",
          emotion: "hint",
        });
      } else {
        // selectedPartsB.length === 2
        onTutorUpdateRef.current({
          dialogText:
            "¡Lo descubriste! 🎉\n\nAunque esta barra tiene más divisiones, la zona pintada ocupa exactamente el mismo espacio.\n\nArriba: 1 de 2 partes (1/2).\nAbajo: 2 de 4 partes (2/4).",
          speechText:
            "¡Lo descubriste! Aunque esta barra tiene más divisiones, la zona pintada ocupa exactamente el mismo espacio. Arriba tenemos una de dos partes, y abajo dos de cuatro partes.",
          emotion: "success",
        });
      }
    } else if (subStep === 4) {
      if (selectedConceptOption === null) {
        onTutorUpdateRef.current({
          dialogText:
            "Los números son diferentes...\n\npero la cantidad representada es la misma.\n\nEso significa que son fracciones equivalentes.",
          speechText:
            "Los números son diferentes, pero la cantidad representada es la misma. Eso significa que son fracciones equivalentes.",
          emotion: "explaining",
        });
      } else if (selectedConceptOption !== "B") {
        onTutorUpdateRef.current({
          dialogText:
            "Recuerda lo que vimos en las barras: los números 1/2 y 2/4 no son idénticos, pero el espacio pintado sí.\n\n¿Cuál opción explica mejor esa idea?",
          speechText:
            "Recuerda lo que vimos en las barras: los números un medio y dos cuartos no son idénticos, pero el espacio pintado sí. ¿Cuál opción explica mejor esa idea?",
          emotion: "hint",
        });
      } else {
        onTutorUpdateRef.current({
          dialogText:
            "¡Exacto, Mariana! 🎉\n\nPueden verse diferentes, pero representan la misma cantidad.\n\nAcabas de descubrir qué es una fracción equivalente.\n\nAhora vamos a probar lo que descubriste. Yo estaré contigo. Si te equivocas, no te daré la respuesta: te daré una pista para que puedas descubrirla.",
          speechText:
            "¡Exacto, Mariana! Pueden verse diferentes, pero representan la misma cantidad. Acabas de descubrir qué es una fracción equivalente. Ahora vamos a probar lo que descubriste. Yo estaré contigo. Si te equivocas, no te daré la respuesta: te daré una pista para que puedas descubrirla.",
          emotion: "celebrating",
        });
      }
    }
  }, [subStep, step1Answer, selectedPartsA.length, selectedPartsB.length, selectedConceptOption]);

  const handleSelectStep1 = (ans: "A" | "B") => {
    setStep1Answer(ans);
    if (ans === "B") {
      try {
        confetti({ disableForReducedMotion: true,
          particleCount: 25,
          spread: 45,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  const handleTogglePartA = (idx: number) => {
    if (subStep !== 2) return;
    if (selectedPartsA.includes(idx)) {
      setSelectedPartsA(selectedPartsA.filter((i) => i !== idx));
    } else {
      setSelectedPartsA([idx]);
      try {
        confetti({ disableForReducedMotion: true,
          particleCount: 20,
          spread: 40,
          origin: { y: 0.65 },
        });
      } catch (e) {}
    }
  };

  const handleTogglePartB = (idx: number) => {
    if (subStep !== 3) return;
    if (selectedPartsB.includes(idx)) {
      setSelectedPartsB(selectedPartsB.filter((i) => i !== idx));
    } else {
      const next = [...selectedPartsB, idx];
      setSelectedPartsB(next);
      if (next.length === 2) {
        try {
          confetti({ disableForReducedMotion: true,
            particleCount: 35,
            spread: 50,
            origin: { y: 0.65 },
          });
        } catch (e) {}
      }
    }
  };

  const handleSelectConceptOption = (opt: "A" | "B" | "C") => {
    setSelectedConceptOption(opt);
    if (opt === "B") {
      setConceptFeedback("¡Excelente! Representan la misma cantidad aunque estén escritas de forma diferente.");
      try {
        confetti({ disableForReducedMotion: true,
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } else if (opt === "A") {
      setConceptFeedback("Pista: Fíjate en los números 1/2 y 2/4: el 1 y el 2 no son iguales al 2 y al 4. Lo que es igual es el espacio que llenan.");
    } else {
      setConceptFeedback("Pista: El denominador puede ser cualquier número (tercios, sextos, octavos). Lo importante es que representen la misma cantidad.");
    }
  };

  const handleAdvanceToComparison = () => {
    setSubStep(4);
    try {
      confetti({ disableForReducedMotion: true,
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (e) {}
  };

  const handleReset = () => {
    setSubStep(1);
    setStep1Answer(null);
    setSelectedPartsA([]);
    setSelectedPartsB([]);
    setSelectedConceptOption(null);
    setConceptFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* CABECERA DE LA MICRO-LECCIÓN INTERACTIVA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-100/90 text-blue-900 text-xs font-black px-3 py-0.5 rounded-full mb-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-700" />
            <span>Microlección Interactiva de Fracciones</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Descubrimiento Guiado con tu Tutor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Manipula las barras y aprende descubriendo junto a tu robot tutor.
          </p>
        </div>

        {/* Stepper de micro-pasos */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { step: 1, label: "1. Observa" },
            { step: 2, label: "2. Pinta 1/2" },
            { step: 3, label: "3. Descubre" },
            { step: 4, label: "4. Compara" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                if (s.step === 1) setSubStep(1);
                if (s.step === 2 && step1Answer === "B") setSubStep(2);
                if (s.step === 3 && selectedPartsA.length > 0) setSubStep(3);
                if (s.step === 4 && selectedPartsB.length === 2) setSubStep(4);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                subStep === s.step
                  ? "bg-blue-600 text-white shadow-xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA INTERACTIVA DE LAS BARRAS */}
      <div className="space-y-6 pt-2">
        {/* BARRA A (Dividida en 2 partes) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-blue-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shadow-2xs">
                A
              </span>
              <span>Barra dividida en 2 partes iguales (medios)</span>
            </span>

            {selectedPartsA.length > 0 && (
              <span className="font-mono bg-blue-100 text-blue-900 font-black px-3 py-1 rounded-full border border-blue-300 text-xs sm:text-sm animate-fade-in shadow-2xs">
                1/2 {subStep === 4 && "= 50%"}
              </span>
            )}
          </div>

          {/* Barra táctil manipulable A */}
          <div className="h-16 w-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-300 flex shadow-inner relative">
            {[0, 1].map((idx) => {
              const isSelected = selectedPartsA.includes(idx);
              const isClickable = subStep === 2;

              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`bar-a-segment-${idx}`}
                  onClick={() => handleTogglePartA(idx)}
                  disabled={!isClickable}
                  aria-label={`Barra A, parte ${idx + 1} de 2: ${isSelected ? "coloreada" : "sin colorear"}`}
                  className={`h-full flex-1 border-r last:border-r-0 border-slate-300 flex flex-col items-center justify-center font-extrabold text-sm sm:text-base transition-all duration-200 select-none relative ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-inner scale-[0.99] rounded-xl font-black"
                      : isClickable
                      ? "bg-blue-50/70 hover:bg-blue-100 text-blue-800 cursor-pointer motion-safe:animate-pulse"
                      : "bg-white text-slate-400"
                  }`}
                >
                  {isSelected ? (
                    <div className="flex items-center gap-1.5">
                      <Check className="w-5 h-5 text-amber-300 stroke-[3]" />
                      <span>1/2</span>
                    </div>
                  ) : isClickable ? (
                    <span className="text-xs font-bold text-blue-700 underline underline-offset-4">
                      Toca para pintar
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">1/2</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* GUÍA VISUAL VERTICAL EN PASO 4 (ALINEACIÓN EXACTA DEL 50%) */}
        {subStep === 4 && (
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t border-dashed border-emerald-400 relative">
              <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                Misma longitud exacta • 50%
              </span>
            </div>
          </div>
        )}

        {/* BARRA B (Dividida en 4 partes) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-amber-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black shadow-2xs">
                B
              </span>
              <span>Barra dividida en 4 partes iguales (cuartos)</span>
            </span>

            {selectedPartsB.length > 0 && (
              <span className="font-mono bg-amber-100 text-amber-950 font-black px-3 py-1 rounded-full border border-amber-300 text-xs sm:text-sm animate-fade-in shadow-2xs">
                {selectedPartsB.length}/4 {subStep === 4 && "= 50%"}
              </span>
            )}
          </div>

          {/* Barra táctil manipulable B */}
          <div className="h-16 w-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-300 flex shadow-inner relative">
            {[0, 1, 2, 3].map((idx) => {
              const isSelected = selectedPartsB.includes(idx);
              const isClickable = subStep === 3;

              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`bar-b-segment-${idx}`}
                  onClick={() => handleTogglePartB(idx)}
                  disabled={!isClickable}
                  aria-label={`Barra B, parte ${idx + 1} de 4: ${isSelected ? "coloreada" : "sin colorear"}`}
                  className={`h-full flex-1 border-r last:border-r-0 border-slate-300 flex flex-col items-center justify-center font-extrabold text-sm sm:text-base transition-all duration-200 select-none relative ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 shadow-inner scale-[0.99] rounded-xl font-black"
                      : isClickable
                      ? "bg-amber-50/70 hover:bg-amber-100 text-amber-800 cursor-pointer motion-safe:animate-pulse"
                      : "bg-white text-slate-400"
                  }`}
                >
                  {isSelected ? (
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      <span>1/4</span>
                    </div>
                  ) : isClickable ? (
                    <span className="text-xs font-bold text-amber-800">
                      Toca aquí
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">1/4</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FEEDBACK Y RETO INTERACTIVO DEL PASO 1 (OBSERVA) */}
        {subStep === 1 && (
          <div className="space-y-4 pt-1">
            <div className="bg-slate-50 border-2 border-blue-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Reto del Tutor: ¿Cuál está dividida en más partes?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opción Barra A */}
                <button
                  type="button"
                  data-testid="step1-option-a"
                  onClick={() => handleSelectStep1("A")}
                  className={`p-3.5 rounded-xl border-2 transition text-left text-xs sm:text-sm font-bold flex items-center justify-between ${
                    step1Answer === "A"
                      ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-200"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>Barra A: dividida en 2 partes</span>
                </button>

                {/* Opción Barra B (Correcta) */}
                <button
                  type="button"
                  data-testid="step1-option-b"
                  onClick={() => handleSelectStep1("B")}
                  className={`p-3.5 rounded-xl border-2 transition text-left text-xs sm:text-sm font-bold flex items-center justify-between ${
                    step1Answer === "B"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-300 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>Barra B: dividida en 4 partes</span>
                  {step1Answer === "B" && (
                    <Check className="w-5 h-5 text-emerald-600 stroke-[3] shrink-0" />
                  )}
                </button>
              </div>

              {step1Answer === "A" && (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-950 border border-amber-300 text-xs font-medium">
                  💡 Mira las líneas de división y cuenta las partes de cada barra. ¿Cuál tiene más?
                </div>
              )}

              {step1Answer === "B" && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Exacto! La Barra B tiene 4 divisiones. Ahora pulsa el botón del Paso 2 para pintar la mitad.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200 text-xs space-y-1">
                <span className="font-extrabold text-blue-900 block">1 Entero Completo</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Ambas barras miden lo mismo de extremo a extremo.
                </p>
              </div>
              <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-200 text-xs space-y-1">
                <span className="font-extrabold text-sky-900 block">Barra A: 2 partes</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Cada parte es <strong>1/2 (un medio)</strong>.
                </p>
              </div>
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
                <span className="font-extrabold text-amber-900 block">Barra B: 4 partes</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Cada parte es <strong>1/4 (un cuarto)</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK DEL PASO 3 (DESCUBRE 2/4) */}
        {subStep === 3 && (
          <div className="p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all">
            {selectedPartsB.length === 0 && (
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                👉 Esta barra tiene cuatro partes. Toca las que creas necesarias para pintar exactamente la misma cantidad que arriba.
              </p>
            )}
            {selectedPartsB.length === 1 && (
              <div className="flex items-center gap-2 text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pista: Pintaste 1/4. ¿Ocupa el mismo espacio que arriba? Observa dónde termina la zona pintada de cada barra.</span>
              </div>
            )}
            {selectedPartsB.length > 2 && (
              <div className="flex items-center gap-2 text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pista: Te pasaste de la mitad. Quita algún trozo para que ocupe exactamente la misma longitud.</span>
              </div>
            )}
            {selectedPartsB.length === 2 && (
              <div className="flex items-center gap-2 text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Lo descubriste! Dos partes de un cuarto (2/4) ocupan exactamente la misma cantidad que un medio (1/2).</span>
              </div>
            )}
          </div>
        )}

        {/* TARJETA DE REVELACIÓN Y PREGUNTA CONCEPTUAL EN PASO 4 (COMPARA) */}
        {subStep === 4 && (
          <div className="space-y-5 pt-2 animate-fade-in">
            {/* Fórmula visual */}
            <div className="bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-2 shadow-xs">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 font-black text-xs px-3.5 py-1 rounded-full border border-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>¡Descubrimiento logrado!</span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                1/2  =  2/4
              </div>

              <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto font-medium">
                Los números son diferentes... pero la cantidad representada es la misma. Eso significa que son <strong>fracciones equivalentes</strong>.
              </p>
            </div>

            {/* Pregunta conceptual orientadora */}
            <div className="bg-slate-50 border-2 border-blue-200/90 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                  Pregunta de comprensión con tu Tutor:
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                ¿Qué significa que dos fracciones sean equivalentes?
              </p>

              <div className="space-y-2 pt-1">
                {/* Opción A */}
                <button
                  type="button"
                  data-testid="concept-option-a"
                  onClick={() => handleSelectConceptOption("A")}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition text-xs sm:text-sm font-bold flex items-center justify-between ${
                    selectedConceptOption === "A"
                      ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-200"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>A. Tienen exactamente los mismos números.</span>
                </button>

                {/* Opción B (Correcta) */}
                <button
                  type="button"
                  data-testid="concept-option-b"
                  onClick={() => handleSelectConceptOption("B")}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition text-xs sm:text-sm font-bold flex items-center justify-between ${
                    selectedConceptOption === "B"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-300 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>B. Representan la misma cantidad aunque estén escritas diferente.</span>
                  {selectedConceptOption === "B" && (
                    <Check className="w-5 h-5 text-emerald-600 stroke-[3] shrink-0" />
                  )}
                </button>

                {/* Opción C */}
                <button
                  type="button"
                  data-testid="concept-option-c"
                  onClick={() => handleSelectConceptOption("C")}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition text-xs sm:text-sm font-bold flex items-center justify-between ${
                    selectedConceptOption === "C"
                      ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-200"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>C. Siempre tienen denominador 4.</span>
                </button>
              </div>

              {conceptFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium border ${
                    selectedConceptOption === "B"
                      ? "bg-emerald-100/80 text-emerald-950 border-emerald-300"
                      : "bg-amber-100/80 text-amber-950 border-amber-300"
                  }`}
                >
                  {conceptFeedback}
                </div>
              )}

              {/* Mensaje de acompañamiento del Tutor antes de los retos */}
              {selectedConceptOption === "B" && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm text-blue-950 font-semibold space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Compromiso del Tutor:</span>
                  </div>
                  <p>
                    &ldquo;Ahora vamos a probar lo que descubriste. Yo estaré contigo. Si te equivocas, no te daré la respuesta: te daré una pista para que puedas descubrirla.&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTONES DE ACCIÓN PARA AVANZAR EL DESCUBRIMIENTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-slate-100 transition self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar lección</span>
        </button>

        <div className="flex items-center gap-3">
          {subStep === 1 && (
            <button
              type="button"
              data-testid="btn-step-2"
              onClick={() => setSubStep(2)}
              disabled={step1Answer !== "B"}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-6 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Paso 2: Tocar la barra azul</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {subStep === 2 && (
            <button
              type="button"
              data-testid="btn-step-3"
              onClick={() => setSubStep(3)}
              disabled={selectedPartsA.length === 0}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm px-6 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Paso 3: Ahora pintar la barra naranja</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {subStep === 3 && (
            <button
              type="button"
              data-testid="btn-step-4"
              onClick={handleAdvanceToComparison}
              disabled={selectedPartsB.length !== 2}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm px-6 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Paso 4: ¡Comparar longitudes!</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {subStep === 4 && (
            <button
              type="button"
              data-testid="btn-start-exercises"
              onClick={onComplete}
              disabled={selectedConceptOption !== "B"}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm px-7 py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-md motion-safe:animate-pulse"
            >
              <span>¡Entendido! Comenzar retos con mi Tutor</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
