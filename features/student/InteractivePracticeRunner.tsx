"use client";

import React, { useState, useEffect } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { Practice } from "@/types";
import { FractionBarVisualizer } from "@/components/FractionBarVisualizer";
import { TutorRobotAvatar } from "@/components/TutorRobotAvatar";
import { SpeechAudioButton } from "@/components/SpeechAudioButton";
import { useSpeech } from "@/lib/hooks/use-speech";
import { adapt_difficulty } from "@/lib/tools/tutor-tools";
import confetti from "canvas-confetti";
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
} from "lucide-react";

export function InteractivePracticeRunner({
  practice,
  onFinish,
}: {
  practice: Practice;
  onFinish: () => void;
}) {
  const { submitAnswer, completePractice, setRole, setActiveTeacherTab, setActiveStudentTab } = useTutor();
  const speech = useSpeech();

  // Phase: 'explanation' | 'questions' | 'results'
  const [phase, setPhase] = useState<"explanation" | "questions" | "results">("explanation");
  const [currentStep, setCurrentStep] = useState(1);

  // Exercise runner state
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(1);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [, setLastAgentActivity] = useState<string[]>([]);
  const [showManualHint, setShowManualHint] = useState(false);

  // Answers tracker
  const [historyAnswers, setHistoryAnswers] = useState<
    { exerciseId: string; isCorrect: boolean; studentAnswer: string; attemptsUsed: number }[]
  >([]);

  // Final calculated score state
  const [finalCalculatedScore, setFinalCalculatedScore] = useState<number>(80);
  const [finalCorrectCount, setFinalCorrectCount] = useState<number>(4);

  const currentExercise = practice.exercises[exerciseIndex];

  // Stop speech synthesis when exercise, explanation step, or phase changes
  useEffect(() => {
    speech.stop();
  }, [exerciseIndex, currentStep, phase, speech]);

  // Pedagogical Progression Bar: 1. Explicación -> 2. Práctica -> 3. Pista -> 4. Re-explicación -> 5. Evidencia
  const renderPedagogicalProgression = () => {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 overflow-x-auto gap-1 sm:gap-2">
          {/* Step 1: Explicación */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              phase === "explanation"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-slate-600 bg-white border border-slate-200/80"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">1</span>
            <span>Explicación</span>
          </div>

          <span className="text-slate-300 font-bold">→</span>

          {/* Step 2: Práctica */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              phase === "questions" && (!isEvaluated || evaluationResult?.isCorrect)
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-slate-600 bg-white border border-slate-200/80"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">2</span>
            <span>Práctica</span>
          </div>

          <span className="text-slate-300 font-bold">→</span>

          {/* Step 3: Pista */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              phase === "questions" && isEvaluated && !evaluationResult?.isCorrect && attemptCount === 1
                ? "bg-amber-500 text-slate-950 shadow-xs font-bold"
                : "text-slate-400 bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/10 text-center text-[10px] leading-4 font-mono">3</span>
            <span>Pista</span>
          </div>

          <span className="text-slate-300 font-bold">→</span>

          {/* Step 4: Re-explicación */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              phase === "questions" && isEvaluated && !evaluationResult?.isCorrect && attemptCount >= 2
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-slate-400 bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">4</span>
            <span>Re-explicación</span>
          </div>

          <span className="text-slate-300 font-bold">→</span>

          {/* Step 5: Evidencia */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              phase === "results"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-slate-400 bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">5</span>
            <span>Evidencia</span>
          </div>
        </div>
      </div>
    );
  };

  // Explicaciones pedagógicas cortas y orales adaptadas para niños de primaria
  const explanationSteps = [
    {
      step: 1,
      title: "¿Por qué valen lo mismo 1/2 y 2/4?",
      speechText:
        "¡Hola Mariana! Vamos juntas paso a paso. Dos fracciones son equivalentes cuando valen lo mismo. Mira estas barras: un medio y dos cuartos ocupan exactamente el mismo espacio. ¡Por eso significan exactamente lo mismo!",
      dialogLines: [
        "¡Hola Mariana! Vamos juntas paso a paso.",
        "Dos fracciones son equivalentes cuando valen lo mismo.",
        "Mira: un medio y dos cuartos ocupan el mismo espacio en las barras.",
        "¡Por eso significan exactamente lo mismo!",
      ],
      fractionA: { numerator: 1, denominator: 2 },
      fractionB: { numerator: 2, denominator: 4 },
      labelA: "1 de 2 partes (1/2)",
      labelB: "2 de 4 partes (2/4)",
      tip: "💡 Observa con atención: las dos barras tienen el mismo largo coloreado.",
    },
    {
      step: 2,
      title: "El secreto del número de abajo",
      speechText:
        "¡Cuidado con esta trampa común! El número de abajo te dice en cuántas partes cortamos la barra. Cuantas más partes cortas, más pequeñita es cada rebanada. Por eso un cuarto es más chiquito que un medio. ¡Necesitas dos cuartos para igualarlo!",
      dialogLines: [
        "¡Cuidado con esta trampa común!",
        "El número de abajo te dice en cuántas partes cortamos la barra.",
        "Cuantas más partes cortas, ¡más pequeñita es cada rebanada!",
        "Por eso un cuarto es más chiquito que un medio. Necesitas 2 cuartos para igualarlo.",
      ],
      fractionA: { numerator: 1, denominator: 2 },
      fractionB: { numerator: 1, denominator: 4 },
      labelA: "1/2 (partes grandes)",
      labelB: "1/4 (partes más pequeñas)",
      tip: "💡 Más partes no significa más grande: significa pedacitos más pequeños.",
    },
    {
      step: 3,
      title: "La regla mágica de la multiplicación",
      speechText:
        "¡Aquí está la regla mágica! Si multiplicas el número de arriba y el número de abajo por el mismo número, la fracción sigue valiendo exactamente lo mismo. Mira: uno por dos es dos, y tres por dos es seis. ¡Un tercio y dos sextos son gemelas!",
      dialogLines: [
        "¡Aquí está la regla mágica de la multiplicación!",
        "Si multiplicas el número de arriba y el de abajo por el mismo número...",
        "¡La fracción sigue valiendo exactamente lo mismo!",
        "Uno por dos es dos, y tres por dos es seis. ¡Un tercio y dos sextos son gemelas!",
      ],
      fractionA: { numerator: 1, denominator: 3 },
      fractionB: { numerator: 2, denominator: 6 },
      labelA: "1/3 (multiplicado × 2)",
      labelB: "2/6 (resultado equivalente)",
      tip: "💡 Multiplicar arriba y abajo por 2 es como partir cada trozo a la mitad.",
    },
  ];

  const handleCheckAnswer = async () => {
    if (!selectedOption) return;
    speech.stop();
    const res = await submitAnswer(currentExercise.id, selectedOption, attemptCount);
    setIsEvaluated(true);
    setEvaluationResult(res);

    // Adapt difficulty dynamically based on answer
    const newDiff = await adapt_difficulty(currentDifficulty, res.isCorrect);
    setCurrentDifficulty(newDiff);

    // Log observable agent actions
    if (res.isCorrect) {
      setLastAgentActivity([
        "✓ Evaluó respuesta con evaluate_answer(): Correcta",
        `✓ Dificultad adaptada con adapt_difficulty(): ${newDiff.toUpperCase()}`,
      ]);
      setHistoryAnswers((prev) => [
        ...prev.filter((a) => a.exerciseId !== currentExercise.id),
        { exerciseId: currentExercise.id, isCorrect: true, studentAnswer: selectedOption, attemptsUsed: attemptCount },
      ]);
    } else {
      if (attemptCount === 1) {
        setLastAgentActivity([
          "✓ Error detectado en intento 1",
          "✓ Aplicó apoyo progresivo (Nivel 1: Pista formativa sin revelar respuesta)",
          `✓ Dificultad ajustada a nivel de refuerzo: ${newDiff.toUpperCase()}`,
        ]);
      } else if (attemptCount === 2) {
        setLastAgentActivity([
          "✓ Segundo intento fallido detectado",
          "✓ Aplicó apoyo progresivo (Nivel 2: Explicación alternativa con analogía)",
          "✓ Mantuvo oportunidad de resolución sin dar respuesta automática",
        ]);
      } else {
        setLastAgentActivity([
          "✓ Nivel 3 de apoyo guiado paso a paso activado",
          "✓ Guardó registro de retroalimentación",
        ]);
        setHistoryAnswers((prev) => [
          ...prev.filter((a) => a.exerciseId !== currentExercise.id),
          { exerciseId: currentExercise.id, isCorrect: false, studentAnswer: selectedOption, attemptsUsed: attemptCount },
        ]);
      }
    }
  };

  const handleNextAttempt = () => {
    speech.stop();
    setAttemptCount(attemptCount + 1);
    setIsEvaluated(false);
    setSelectedOption(null);
    setShowManualHint(false);
  };

  const handleNextExercise = () => {
    speech.stop();
    setIsEvaluated(false);
    setEvaluationResult(null);
    setSelectedOption(null);
    setAttemptCount(1);
    setShowManualHint(false);
    setLastAgentActivity([]);

    if (exerciseIndex + 1 < practice.exercises.length) {
      setExerciseIndex(exerciseIndex + 1);
    } else {
      finishAllExercises();
    }
  };

  const finishAllExercises = async () => {
    speech.stop();
    setPhase("results");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    // AUTHENTIC CALCULATION: Score is computed strictly from real student performance!
    const correctCount = historyAnswers.filter((a) => a.isCorrect).length;
    const totalExercises = practice.exercises.length;
    const calculatedScore = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;

    setFinalCalculatedScore(calculatedScore);
    setFinalCorrectCount(correctCount);

    const mastered = calculatedScore >= 60 ? [
      "Identificación de fracciones equivalentes",
      "Equivalencia visual de 1/2 y 2/4",
      "Amplificación por factor 2",
      "Comprobación por productos cruzados",
    ] : ["Comprensión visual básica de fracciones"];

    const pending = ["Simplificación de fracciones con factores mayores a 10"];

    await completePractice(practice.id, {
      score: calculatedScore,
      totalCorrect: correctCount,
      totalExercises,
      mastered,
      pending,
    });
  };

  const handleReturnToTeacher = () => {
    speech.stop();
    setRole("teacher");
    setActiveTeacherTab("progress");
    onFinish();
  };

  // 1. PHASE: EXPLANATION STEP-BY-STEP (MODO EXPLICACIÓN GUIADA CON EL ROBOT Y AUDIO)
  if (phase === "explanation") {
    const currentExpl = explanationSteps[currentStep - 1];

    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
        {renderPedagogicalProgression()}

        {/* Encabezado del paso */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Tutor IA • Explicación guiada
            </span>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Paso {currentStep} de 3
          </span>
        </div>

        {/* GLOBO DE DIÁLOGO DEL ROBOT CON AUDIO INTEGRADO */}
        <div className="bg-gradient-to-r from-blue-50/90 via-white to-amber-50/50 rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <TutorRobotAvatar
              size="lg"
              showGlow
              priority
              isSpeaking={speech.isSpeaking}
            />

            <div className="space-y-3 flex-1 text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                  Concepto #{currentStep}: {currentExpl.title}
                </span>

                {/* Botón de Escuchar explicación con Web Speech API */}
                <SpeechAudioButton
                  textToSpeak={currentExpl.speechText}
                  label="Escuchar explicación"
                  repeatLabel="Repetir"
                  variant="amber"
                  speech={speech}
                />
              </div>

              {/* Frases cortas y claras (sin párrafos densos) */}
              <div className="space-y-2 bg-white/80 p-4 rounded-xl border border-blue-100/80">
                {currentExpl.dialogLines.map((line, idx) => (
                  <p
                    key={idx}
                    className={`text-sm sm:text-base leading-relaxed ${
                      idx === 0
                        ? "font-bold text-slate-900"
                        : idx === currentExpl.dialogLines.length - 1
                        ? "font-extrabold text-blue-900"
                        : "text-slate-700"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* APOYO VISUAL DOMINANTE: Barras de fracciones */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block text-left">
            Mira la representación en las barras:
          </span>
          <FractionBarVisualizer
            fractionA={currentExpl.fractionA}
            fractionB={currentExpl.fractionB}
            labelA={currentExpl.labelA}
            labelB={currentExpl.labelB}
          />
        </div>

        {/* Tip rápido del Tutor */}
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 flex items-center gap-2.5 font-medium text-left">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{currentExpl.tip}</span>
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              speech.stop();
              setCurrentStep(Math.max(1, currentStep - 1));
            }}
            disabled={currentStep === 1}
            className="text-xs font-bold px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-30 transition"
          >
            ← Anterior
          </button>

          {currentStep < 3 ? (
            <button
              onClick={() => {
                speech.stop();
                setCurrentStep(currentStep + 1);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              <span>Siguiente explicación</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                speech.stop();
                setPhase("questions");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              <span>¡Entendido! Comenzar ejercicios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. PHASE: QUESTIONS RUNNER (ACOMPAÑAMIENTO CON VOZ Y PISTAS ORALES DEL ROBOT)
  if (phase === "questions") {
    const questionSpeech = `Pregunta número ${exerciseIndex + 1}: ${currentExercise.prompt}`;

    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
        {renderPedagogicalProgression()}

        {/* ENCABEZADO CON PASO Y DIFICULTAD */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Fracciones equivalentes
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              Ejercicio {exerciseIndex + 1} de {practice.exercises.length}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                currentDifficulty === "easy"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : currentDifficulty === "medium"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-purple-50 text-purple-800 border-purple-200"
              }`}
            >
              Dificultad: {currentDifficulty === "easy" ? "Fácil" : currentDifficulty === "medium" ? "Media" : "Desafío"}
            </span>

            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 font-medium">
              Intento {attemptCount}/3
            </span>
          </div>
        </div>

        {/* TARJETA DEL ROBOT ACOMPAÑANTE EN CADA PREGUNTA */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <TutorRobotAvatar
              size="sm"
              showGlow
              isSpeaking={speech.isSpeaking}
            />
            <div>
              <span className="font-extrabold text-blue-950 text-xs block">
                Tu Tutor IA dice:
              </span>
              <p className="text-xs sm:text-sm text-slate-700">
                &ldquo;¡Tú puedes, Mariana! Lee o escucha la pregunta con calma.&rdquo;
              </p>
            </div>
          </div>

          <SpeechAudioButton
            textToSpeak={questionSpeech}
            label="Escuchar pregunta"
            repeatLabel="Repetir"
            variant="compact"
            speech={speech}
          />
        </div>

        {/* PLANTEAMIENTO DE LA PREGUNTA */}
        <div className="space-y-4 text-left">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
            {currentExercise.prompt}
          </h3>

          {/* Visualizador de fracciones */}
          {currentExercise.visualData && (
            <FractionBarVisualizer
              fractionA={currentExercise.visualData.fractionA}
              fractionB={currentExercise.visualData.fractionB}
              labelA={currentExercise.visualData.labelA}
              labelB={currentExercise.visualData.labelB}
            />
          )}

          {/* Opciones de respuesta */}
          <div className="space-y-2.5 pt-1">
            {currentExercise.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              let optionStyle = "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/80";

              if (isEvaluated) {
                if (option === currentExercise.correctAnswer) {
                  optionStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400";
                } else if (isSelected && !evaluationResult?.isCorrect) {
                  optionStyle = "bg-rose-50 border-rose-300 text-rose-900 line-through";
                }
              } else if (isSelected) {
                optionStyle = "bg-blue-50 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500";
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isEvaluated && setSelectedOption(option)}
                  disabled={isEvaluated}
                  className={`w-full text-left p-4 rounded-2xl border text-sm transition flex items-center justify-between ${optionStyle}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-7 h-7 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-semibold text-sm">{option}</span>
                  </div>
                  {isEvaluated && option === currentExercise.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FEEDBACK AMIGABLE CUANDO EL ALUMNO FALLA O ACIERTA (CON AUDIO) */}
        {isEvaluated && (
          <div
            className={`p-5 rounded-2xl border text-sm space-y-3 text-left ${
              evaluationResult?.isCorrect
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-amber-50 border-amber-300 text-amber-950"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <TutorRobotAvatar
                  size="xs"
                  isSpeaking={speech.isSpeaking}
                />
                <span>
                  {evaluationResult?.isCorrect
                    ? "¡Muy bien, Mariana! 🎉 ¡Excelente trabajo!"
                    : attemptCount === 1
                    ? "Casi lo tienes. No pasa nada, Mariana."
                    : "¡Casi lo logras! Yo te ayudo con otra explicación."}
                </span>
              </div>

              {/* Botón para escuchar la pista o feedback en voz alta */}
              <SpeechAudioButton
                textToSpeak={
                  evaluationResult?.isCorrect
                    ? `¡Muy bien Mariana! ${evaluationResult?.feedback}`
                    : attemptCount === 1
                    ? `Casi lo tienes. Escucha esta pista: ${evaluationResult?.hint || currentExercise.hint}`
                    : `Casi lo logras. Yo te ayudo: ${evaluationResult?.alternativeExplanation || currentExercise.alternativeExplanation}`
                }
                label={evaluationResult?.isCorrect ? "Escuchar" : "Escuchar pista"}
                repeatLabel="Repetir"
                variant="amber"
                speech={speech}
              />
            </div>

            <p className="leading-relaxed text-sm bg-white/70 p-3.5 rounded-xl border border-amber-200/60">
              {!evaluationResult?.isCorrect
                ? attemptCount === 1
                  ? evaluationResult?.hint || "Observa qué ocurre cuando multiplicamos numerador y denominador por el mismo número."
                  : evaluationResult?.alternativeExplanation || "Piensa en partes iguales de una pizza: al duplicar las rebanadas, cada una es la mitad de grande."
                : evaluationResult?.feedback}
            </p>
          </div>
        )}

        {/* Pista manual solicitada con opción de audio */}
        {showManualHint && !isEvaluated && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs sm:text-sm text-blue-900 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-blue-800">
                <Sparkles className="w-3.5 h-3.5" />
                Pista orientadora de tu Tutor:
              </span>
              <SpeechAudioButton
                textToSpeak={`Pista de tu Tutor: ${currentExercise.hint}`}
                label="Escuchar pista"
                variant="compact"
                speech={speech}
              />
            </div>
            <p className="text-slate-700 leading-relaxed bg-white/70 p-2.5 rounded-xl">
              {currentExercise.hint}
            </p>
          </div>
        )}

        {/* PANEL INFERIOR Y ACCIONES */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Apoyo rápido */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TutorRobotAvatar size="xs" />
            <span>¿Tienes dudas?</span>
            {!isEvaluated && !showManualHint && (
              <button
                type="button"
                onClick={() => setShowManualHint(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline underline-offset-2 flex items-center gap-1"
              >
                <span>Dame una pista</span>
              </button>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                speech.stop();
                setPhase("explanation");
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              ← Repasar explicación
            </button>

            {!isEvaluated ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedOption}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-xs"
              >
                Comprobar respuesta
              </button>
            ) : !evaluationResult?.isCorrect && evaluationResult?.allowRetry ? (
              <button
                onClick={handleNextAttempt}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {attemptCount === 1
                    ? "Intentar de nuevo con la pista"
                    : "Intentar de nuevo con nueva explicación"}
                </span>
              </button>
            ) : (
              <button
                onClick={handleNextExercise}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                <span>
                  {exerciseIndex + 1 < practice.exercises.length
                    ? "Siguiente ejercicio"
                    : "Finalizar y ver progreso"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. PHASE: RESULTADO ALUMNO VISUAL Y ELEGANTE (CON ROBOT CELEBRANDO Y AUDIO)
  const initialScore = 52;
  const delta = finalCalculatedScore - initialScore;

  const celebrationSpeech = `¡Lo lograste Mariana! Muchas felicidades. Obtuviste una calificación de ${finalCalculatedScore} por ciento, subiendo ${delta} puntos desde tu inicio. Aprendiste a comparar fracciones equivalentes de forma visual. ¡Estoy muy orgulloso de ti! Seguiremos practicando juntos.`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-12 max-w-2xl mx-auto space-y-7 text-center">
      {renderPedagogicalProgression()}

      {/* Avatar del robot celebrando con halo y audio */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2">
        <TutorRobotAvatar
          size="xl"
          showGlow
          priority
          isSpeaking={speech.isSpeaking}
        />

        <SpeechAudioButton
          textToSpeak={celebrationSpeech}
          label="Escuchar mensaje del Tutor"
          repeatLabel="Repetir"
          variant="amber"
          speech={speech}
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          ¡Práctica completada con éxito!
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          ¡Lo lograste, Mariana! 🎉
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Aprendiste a comparar fracciones equivalentes. ¡Estoy muy orgulloso de ti! Seguiremos practicando juntos.
        </p>
      </div>

      {/* Puntuación destacada limpia */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Calificación Obtenida
        </span>
        <div className="text-5xl font-black text-emerald-600 font-mono">
          {finalCalculatedScore}%
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {finalCorrectCount} de {practice.exercises.length} correctos
        </p>
        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full inline-block border border-emerald-200 mt-1">
          +{delta >= 0 ? delta : 0} puntos desde tu diagnóstico inicial (52% → {finalCalculatedScore}%)
        </div>
      </div>

      {/* Tarjetas Aprendiste / Seguiremos practicando */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs">
        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-2.5">
          <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Aprendiste hoy:
          </span>
          <ul className="space-y-1.5 text-slate-700 text-xs font-medium">
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Identificar fracciones equivalentes</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Comparar barras visuales</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Amplificar fracciones por 2</span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-2.5">
          <span className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Seguiremos practicando:
          </span>
          <ul className="space-y-1.5 text-slate-700 text-xs font-medium">
            <li className="flex items-center gap-2">
              <span className="text-amber-600 font-bold">⏳</span>
              <span>Simplificación con números mayores</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-600 font-bold">⏳</span>
              <span>Divisores comunes</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleReturnToTeacher}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-4 px-6 rounded-2xl transition shadow-xs flex items-center justify-center gap-2"
        >
          <span>Guardar evidencia y regresar al Panel del Profesor</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            speech.stop();
            setActiveStudentTab("practices");
            onFinish();
          }}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2"
        >
          Volver a mis prácticas
        </button>
      </div>
    </div>
  );
}
