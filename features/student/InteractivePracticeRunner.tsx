"use client";

import React, { useState } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { Practice, Exercise } from "@/types";
import { FractionBarVisualizer } from "@/components/FractionBarVisualizer";
import { adapt_difficulty } from "@/lib/tools/tutor-tools";
import confetti from "canvas-confetti";
import {
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Award,
  BookOpen,
  Check,
  Terminal,
  Activity,
} from "lucide-react";

export function InteractivePracticeRunner({
  practice,
  onFinish,
}: {
  practice: Practice;
  onFinish: () => void;
}) {
  const { submitAnswer, completePractice, setRole, setActiveTeacherTab } = useTutor();

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
  const [lastAgentActivity, setLastAgentActivity] = useState<string[]>([]);

  // Answers tracker
  const [historyAnswers, setHistoryAnswers] = useState<
    { exerciseId: string; isCorrect: boolean; studentAnswer: string; attemptsUsed: number }[]
  >([]);

  // Final calculated score state
  const [finalCalculatedScore, setFinalCalculatedScore] = useState<number>(80);
  const [finalCorrectCount, setFinalCorrectCount] = useState<number>(4);

  const currentExercise = practice.exercises[exerciseIndex];

  // Explanatory steps
  const explanationSteps = [
    {
      step: 1,
      title: "¿Por qué 1/2 y 2/4 representan la misma cantidad?",
      text: "Dos fracciones son equivalentes cuando representan exactamente la misma porción del entero, ¡aunque sus números se vean diferentes! Ambas cubren exactamente la misma mitad.",
      fractionA: { numerator: 1, denominator: 2 },
      fractionB: { numerator: 2, denominator: 4 },
      labelA: "1 de 2 partes (1/2)",
      labelB: "2 de 4 partes (2/4)",
      tip: "Mira cómo 1/2 y 2/4 ocupan exactamente la misma cantidad en la barra visual.",
    },
    {
      step: 2,
      title: "El secreto del denominador",
      text: "Cuidado con la trampa común: ¡un denominador más grande NO significa que la fracción sea mayor! Solo significa que el entero se dividió en más pedacitos pequeños.",
      fractionA: { numerator: 1, denominator: 2 },
      fractionB: { numerator: 1, denominator: 4 },
      labelA: "1/2 (partes grandes)",
      labelB: "1/4 (partes pequeñas)",
      tip: "1/4 es más pequeño que 1/2. Para igualarlo, necesitas 2 partes: 2/4 = 1/2.",
    },
    {
      step: 3,
      title: "La regla de oro de la multiplicación",
      text: "Si multiplicas el numerador (arriba) y el denominador (abajo) por el MISMO número, ¡la fracción mantiene su valor idéntico!",
      fractionA: { numerator: 1, denominator: 3 },
      fractionB: { numerator: 2, denominator: 6 },
      labelA: "1/3 (multiplicado × 2)",
      labelB: "2/6 (resultado equivalente)",
      tip: "(1 × 2) / (3 × 2) = 2/6. ¡Es la misma proporción geométrica!",
    },
  ];

  const handleCheckAnswer = async () => {
    if (!selectedOption) return;
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
          "✓ Nivel 3 de apoyo guiado paso a paso con representación visual activado",
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
    setAttemptCount(attemptCount + 1);
    setIsEvaluated(false);
    setSelectedOption(null);
  };

  const handleNextExercise = () => {
    setIsEvaluated(false);
    setEvaluationResult(null);
    setSelectedOption(null);
    setAttemptCount(1);
    setLastAgentActivity([]);

    if (exerciseIndex + 1 < practice.exercises.length) {
      setExerciseIndex(exerciseIndex + 1);
    } else {
      finishAllExercises();
    }
  };

  const finishAllExercises = async () => {
    setPhase("results");

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore in tests/node
    }

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
    setRole("teacher");
    setActiveTeacherTab("progress");
    onFinish();
  };

  // 1. PHASE: EXPLANATION STEP-BY-STEP (TUTOR ENSEÑA ANTES DE PREGUNTAR)
  if (phase === "explanation") {
    const currentExpl = explanationSteps[currentStep - 1];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Tutor IA • Enseñanza interactiva
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                &quot;Antes de empezar, vamos a entender por qué 1/2 y 2/4 representan la misma cantidad.&quot;
              </h2>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Paso {currentStep} de 3
          </span>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Concepto Clave #{currentStep}
            </span>
            <h3 className="text-lg font-bold text-slate-900">{currentExpl.title}</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{currentExpl.text}</p>
          </div>

          <FractionBarVisualizer
            fractionA={currentExpl.fractionA}
            fractionB={currentExpl.fractionB}
            labelA={currentExpl.labelA}
            labelB={currentExpl.labelB}
          />

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{currentExpl.tip}</span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-30"
          >
            ← Anterior
          </button>

          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <span>Siguiente explicación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setPhase("questions")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <span>¡Entendido! Comenzar ejercicios adaptativos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. PHASE: QUESTIONS RUNNER (1 to 5) CON APOYO PROGRESIVO EN 3 NIVELES
  if (phase === "questions") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 max-w-3xl mx-auto space-y-6">
        {/* Header: Progress & Adaptive Difficulty */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg">
              Ejercicio {exerciseIndex + 1} de {practice.exercises.length}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Dificultad adaptativa:
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded border ${
                currentDifficulty === "easy"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : currentDifficulty === "medium"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-purple-50 text-purple-800 border-purple-200"
              }`}
            >
              {currentDifficulty === "easy" ? "FÁCIL" : currentDifficulty === "medium" ? "MEDIA" : "DESAFÍO"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Intento:</span>
            <span className="font-bold text-slate-800">{attemptCount} / 3</span>
          </div>
        </div>

        {/* Observable Agent Activity Banner */}
        {lastAgentActivity.length > 0 && (
          <div className="bg-slate-900 text-emerald-300 p-3 rounded-xl text-xs font-mono border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-sans border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
                Actividad del agente (Ejecución en tiempo real)
              </span>
              <span>Adaptación pedagógica</span>
            </div>
            {lastAgentActivity.map((act, i) => (
              <div key={i} className="flex items-center gap-1.5 pt-0.5 text-[11px]">
                <span>{act}</span>
              </div>
            ))}
          </div>
        )}

        {/* Question Prompt */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {currentExercise.prompt}
          </h3>

          {/* Optional visual fraction bar */}
          {currentExercise.visualData && (
            <FractionBarVisualizer
              fractionA={currentExercise.visualData.fractionA}
              fractionB={currentExercise.visualData.fractionB}
              labelA={currentExercise.visualData.labelA}
              labelB={currentExercise.visualData.labelB}
            />
          )}

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {currentExercise.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              let optionStyle = "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100";

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
                  className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>
                  {isEvaluated && option === currentExercise.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback / Progressive Support Box from AI Tutor */}
        {isEvaluated && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2.5 ${
              evaluationResult?.isCorrect
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-[13px]">
              <Bot className="w-4 h-4" />
              <span>
                {evaluationResult?.isCorrect
                  ? "¡Excelente trabajo!"
                  : attemptCount === 1
                  ? "Pista de apoyo (Nivel 1)"
                  : attemptCount === 2
                  ? "Explicación alternativa (Nivel 2)"
                  : "Ejemplo guiado paso a paso (Nivel 3)"}
              </span>
            </div>

            <p className="leading-relaxed">{evaluationResult?.feedback}</p>

            {/* Support Level 1: Hint */}
            {evaluationResult?.hint && (
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-300 text-amber-900 font-medium flex items-center gap-2 mt-1">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pista del Tutor: {evaluationResult.hint}</span>
              </div>
            )}

            {/* Support Level 2: Alternative Explanation */}
            {evaluationResult?.alternativeExplanation && (
              <div className="bg-white/90 p-3 rounded-lg border border-blue-300 text-blue-950 font-medium flex items-start gap-2 mt-1">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-blue-900">Explicación alternativa:</span>
                  <span>{evaluationResult.alternativeExplanation}</span>
                </div>
              </div>
            )}

            {/* Support Level 3: Guided Example */}
            {evaluationResult?.guidedExample && (
              <div className="bg-white p-3 rounded-lg border border-purple-300 text-purple-950 font-medium flex items-start gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-purple-900">Ejemplo guiado:</span>
                  <span>{evaluationResult.guidedExample}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setPhase("explanation")}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
          >
            ← Repasar explicación inicial
          </button>

          {!isEvaluated ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-sm"
            >
              Comprobar respuesta
            </button>
          ) : !evaluationResult?.isCorrect && evaluationResult?.allowRetry ? (
            <button
              onClick={handleNextAttempt}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
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
    );
  }

  // 3. PHASE: RESULTS & LEARNING EVIDENCE (ENFOCADO EN APRENDIZAJE)
  const initialScore = 52;
  const delta = finalCalculatedScore - initialScore;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-2xl mx-auto space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg">
        <Award className="w-10 h-10" />
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          ¡Práctica completada con éxito!
        </span>
        <h2 className="text-2xl font-black text-slate-900">
          ¡Gran avance, Mariana! 🎉
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Mejoraste en identificación de fracciones equivalentes.
        </p>
      </div>

      {/* Score Comparison Badge computed from actual responses */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-around">
        <div>
          <span className="text-[10px] text-blue-200 uppercase font-bold block">
            Diagnóstico Inicial
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono">{initialScore}%</span>
        </div>
        <div className="text-2xl font-bold text-blue-300">→</div>
        <div>
          <span className="text-[10px] text-blue-200 uppercase font-bold block">
            Resultado en Práctica ({finalCorrectCount}/{practice.exercises.length})
          </span>
          <span className="text-3xl font-black text-emerald-400 font-mono">
            {finalCalculatedScore}%
          </span>
        </div>
        <div className="border-l border-blue-700/80 pl-4 text-left">
          <span className="text-[10px] text-blue-200 uppercase font-bold block">
            Progreso
          </span>
          <span className="text-sm font-bold text-emerald-300">
            {delta >= 0 ? `+${delta}% Mejora` : `${delta}%`}
          </span>
        </div>
      </div>

      {/* Concept Mastery List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs">
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2">
          <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Conceptos Dominados
          </span>
          <ul className="space-y-1.5 text-slate-700 pt-1">
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Identificación de fracciones equivalentes</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Equivalencia visual de 1/2 y 2/4</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Amplificación por factor común</span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2">
          <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Por Reforzar en Próxima Sesión
          </span>
          <ul className="space-y-1.5 text-slate-700 pt-1">
            <li className="flex items-center gap-2">
              <span className="text-amber-600 font-bold">⏳</span>
              <span>Simplificación de fracciones</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-600 font-bold">⏳</span>
              <span>Divisores comunes mayores a 10</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleReturnToTeacher}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
        >
          <Bot className="w-5 h-5 text-amber-300" />
          <span>Guardar evidencia y regresar al Panel del Profesor</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
