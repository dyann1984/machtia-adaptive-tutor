"use client";

import React, { useState, useEffect } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { Practice, SupportEvent } from "@/types";
import { SupportCoach } from "@/components/SupportCoach";
import { repository } from "@/lib/data/repository";
import { FractionBarVisualizer } from "@/components/FractionBarVisualizer";
import { TutorRobotAvatar, TutorEmotion } from "@/components/TutorRobotAvatar";
import { SpeechAudioButton } from "@/components/SpeechAudioButton";
import { InteractiveFractionDiscovery } from "@/components/InteractiveFractionDiscovery";
import { FractionCardInteractive } from "@/components/exercises/FractionCardInteractive";
import { ChocolateBarInteractive } from "@/components/exercises/ChocolateBarInteractive";
import { RelationalComparisonInteractive } from "@/components/exercises/RelationalComparisonInteractive";
import { CrossProductInteractive } from "@/components/exercises/CrossProductInteractive";
import { SimplificationInteractive } from "@/components/exercises/SimplificationInteractive";
import { useMiaVoice } from "@/lib/hooks/use-mia-voice";
import { adapt_difficulty } from "@/lib/tools/tutor-tools";
import confetti from "canvas-confetti";
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Lightbulb,
} from "lucide-react";

export function InteractivePracticeRunner({
  practice,
  onFinish,
}: {
  practice: Practice;
  onFinish: () => void;
}) {
  const { submitAnswer, completePractice, setRole, setActiveTeacherTab, setActiveStudentTab, setActiveExerciseContext } = useTutor();
  const speech = useMiaVoice();

  // Phase: 'explanation' | 'questions' | 'results'
  const [phase, setPhase] = useState<"explanation" | "questions" | "results">("explanation");

  // Discovery tutor state
  const [discoveryTutorData, setDiscoveryTutorData] = useState<{
    speechText: string;
    dialogText: string;
    emotion: TutorEmotion;
  }>({
    speechText:
      "¡Hola Mariana! Mira conmigo estas dos barras del mismo tamaño. La de arriba está cortada en dos partes, y la de abajo en cuatro partes. Vamos a descubrir qué tienen en común.",
    dialogText:
      "¡Hola Mariana! 👋 Mira conmigo estas dos barras. Una está cortada en 2 partes y la otra en 4 partes. ¡Vamos a explorarlas juntas!",
    emotion: "normal",
  });

  const handleTutorUpdate = React.useCallback((data: any) => {
    speech.stop();
    setDiscoveryTutorData(data);
  }, [speech]);

  // Exercise runner state
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(1);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [serverError, setServerError] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [, setLastAgentActivity] = useState<string[]>([]);
  const [showManualHint, setShowManualHint] = useState(false);
  const [supportCounts, setSupportCounts] = useState({ hints: 0, reexplanations: 0 });
  const [supportEvents, setSupportEvents] = useState<SupportEvent[]>([]);
  const [supportDialogue, setSupportDialogue] = useState<string | null>(null);
  const [baselineScore] = useState(() => repository.getStudentById(practice.studentId)?.topicPerformances[practice.topicId] ?? 0);
  const recordSupport = (event: SupportEvent) => {
    speech.stop();
    setSupportEvents(prev => [...prev, event]);
    setSupportCounts(prev => ({ hints: prev.hints + (event.kind === "verbal_hint" || event.kind === "visual_hint" ? 1 : 0), reexplanations: prev.reexplanations + (event.kind === "alternative_representation" || event.kind === "guided_steps" ? 1 : 0) }));
  };

  // Answers tracker
  const [historyAnswers, setHistoryAnswers] = useState<
    { exerciseId: string; isCorrect: boolean; studentAnswer: string; attemptsUsed: number }[]
  >([]);

  // Final calculated score state
  const [finalCalculatedScore, setFinalCalculatedScore] = useState<number>(0);
  const [finalCorrectCount, setFinalCorrectCount] = useState<number>(0);
  const [masteredSkills, setMasteredSkills] = useState<string[]>([]);
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);

  const currentExercise = practice.exercises[exerciseIndex];
  const selectOption = (option: string) => {
    speech.stop();
    setSelectedOption(option);
    setSupportDialogue(`Elegiste «${option}». ¿Qué observas en el reto que sostiene tu elección? Comprueba cuando estés listo.`);
  };

  // Stop speech synthesis when exercise or phase changes
  const stopSpeech = speech.stop;
  useEffect(() => {
    stopSpeech();
  }, [exerciseIndex, phase, stopSpeech]);

  // Synchronize active exercise details for MIA pedagogical companion
  useEffect(() => {
    if (currentExercise && phase === "questions") {
      setActiveExerciseContext({
        exerciseId: currentExercise.id,
        exercisePrompt: currentExercise.prompt,
        topicName: practice.topicName,
        options: currentExercise.options,
        attemptCount,
        lastError: evaluationResult && !evaluationResult.isCorrect ? `El alumno seleccionó «${selectedOption || "una opción incorrecta"}»` : undefined,
      });
    } else {
      setActiveExerciseContext(null);
    }
    return () => {
      setActiveExerciseContext(null);
    };
  }, [currentExercise, phase, attemptCount, evaluationResult, selectedOption, practice.topicName, setActiveExerciseContext]);

  // Pedagogical Progression Bar: 1. Explicación -> 2. Práctica -> 3. Pista -> 4. Re-explicación -> 5. Evidencia
  const renderPedagogicalProgression = () => {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 mb-6 shadow-2xs">
        <div className="flex flex-wrap items-center text-xs font-bold text-slate-600 gap-1 sm:gap-2">
          {/* Step 1: Explicación */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              phase === "explanation"
                ? "bg-blue-600 text-white shadow-xs"
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
                ? "bg-blue-600 text-white shadow-xs"
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
                ? "bg-amber-500 text-slate-950 shadow-xs"
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
                ? "bg-indigo-600 text-white shadow-xs"
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
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-mono">5</span>
            <span>Evidencia</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Estados del proceso adaptativo</span>
          <span className="hidden sm:inline">El Tutor adapta estos pasos según tus respuestas</span>
        </div>
      </div>
    );
  };

  const handleCheckAnswer = async () => {
    if (!selectedOption) return;
    speech.stop();
    let res;
    try { res = await submitAnswer(currentExercise.id, selectedOption, attemptCount);setServerError(""); }
    catch (error) { setServerError(String(error));return; }
    setIsEvaluated(true);
    setEvaluationResult(res);
    if (!res.isCorrect) {
      setSupportEvents(prev => [...prev, { exerciseId: currentExercise.id, kind: res.supportLevel === "hint" ? "verbal_hint" : res.supportLevel === "alternative_explanation" ? "alternative_representation" : "guided_steps", source: "automatic", timestamp: new Date().toISOString() }]);
      setSupportCounts((prev) => ({
        hints: prev.hints + (res.supportLevel === "hint" ? 1 : 0),
        reexplanations: prev.reexplanations + (res.supportLevel !== "hint" ? 1 : 0),
      }));
    }

    // Adapt difficulty dynamically based on answer
    const newDiff = res.nextDifficulty;
    setCurrentDifficulty(newDiff);

    if (res.isCorrect) {
      try {
        confetti({ disableForReducedMotion: true,
          particleCount: 12,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      setLastAgentActivity([
        "✓ Evaluó respuesta con evaluate_answer(): Correcta",
        `✓ Nivel del ejercicio registrado por el servidor: ${newDiff.toUpperCase()}`,
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
    setSupportDialogue(null);
    setAttemptCount(attemptCount + 1);
    setIsEvaluated(false);
    setSelectedOption(null);
    setShowManualHint(false);
  };

  const handleNextExercise = () => {
    speech.stop();
    if (exerciseIndex + 1 >= practice.exercises.length) {
      void finishAllExercises(historyAnswers).catch(error => setServerError(String(error)));
      return;
    }
    setSupportDialogue(null);
    setIsEvaluated(false);
    setEvaluationResult(null);
    setSelectedOption(null);
    setAttemptCount(1);
    setShowManualHint(false);
    setLastAgentActivity([]);

    if (exerciseIndex + 1 < practice.exercises.length) {
      setExerciseIndex(exerciseIndex + 1);
    } else {
      finishAllExercises(historyAnswers);
    }
  };

  const finishAllExercises = async (overrideHistory?: typeof historyAnswers) => {
    speech.stop();

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    try {
      confetti({ disableForReducedMotion: true,
        particleCount: 25,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    const answersList = overrideHistory && overrideHistory.length > 0 ? overrideHistory : historyAnswers;
    const correctCount = answersList.filter((a) => a.isCorrect).length;
    const totalExercises = practice.exercises.length;
    const calculatedScore = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;

    setFinalCalculatedScore(calculatedScore);
    setFinalCorrectCount(correctCount);

    const mastered = practice.exercises.filter((exercise) => answersList.some((answer) => answer.exerciseId === exercise.id && answer.isCorrect)).map((exercise) => exercise.conceptTag);
    const pending = practice.exercises.filter((exercise) => !answersList.some((answer) => answer.exerciseId === exercise.id && answer.isCorrect)).map((exercise) => exercise.conceptTag);

    setMasteredSkills(mastered);
    setPendingSkills(pending);

    const evidence = await completePractice(practice.id, {
      score: calculatedScore,
      totalCorrect: correctCount,
      totalExercises,
      mastered,
      pending,
      totalAttempts: answersList.reduce((sum, answer) => sum + answer.attemptsUsed, 0),
      hintsUsed: supportCounts.hints,
      reexplanationsUsed: supportCounts.reexplanations,
      supportEvents,
    });
    setFinalCalculatedScore(evidence.finalScore);setFinalCorrectCount(evidence.totalCorrect ?? 0);
    setMasteredSkills(evidence.masteredConcepts);setPendingSkills(evidence.pendingConcepts);
    setSupportCounts({ hints: evidence.hintsUsed ?? 0, reexplanations: evidence.reexplanationsUsed ?? 0 });
    setPhase("results");
  };

  const handleReturnToTeacher = () => {
    speech.stop();
    setRole("teacher");
    setActiveTeacherTab("progress");
    onFinish();
  };

  // Pedagogical guidance tailored to each interactive exercise with encouraging transitions
  const EXERCISE_TUTOR_GUIDES = [
    {
      dialogue: "Compara el largo de las barras. ¿Cuál de las opciones llena exactamente el mismo espacio que 1/2?",
      speech: "Compara el largo de las barras. ¿Cuál de las opciones llena exactamente el mismo espacio que un medio?",
    },
    {
      dialogue: "¡Muy bien! Ya descubriste cómo comparar con barras. Ahora probemos con una barra de chocolate: ¿cuántos sextos equivalen al tercio de Mariana?",
      speech: "Ya descubriste cómo comparar con barras. Ahora probemos con una barra de chocolate: toca los trozos para descubrir cuántas partes de seis equivalen a un tercio.",
    },
    {
      dialogue: "Bien. Ahora subimos un poquito el reto sin dibujos: ¿por qué número multiplicamos arriba y abajo para que 2/5 sea equivalente a 4/10?",
      speech: "Bien. Ahora subimos un poquito el reto sin dibujos: recuerda la regla de oro, observa qué factor multiplica tanto al numerador como al denominador.",
    },
    {
      dialogue: "¡Excelente avance! Ahora usemos una técnica poderosa: la regla de productos cruzados. ¿3 por 8 da lo mismo que 4 por 6?",
      speech: "Excelente avance. Ahora usemos la técnica de multiplicación cruzada: tres por ocho y cuatro por seis. Si ambos productos son iguales, demuestran la equivalencia.",
    },
    {
      dialogue: "¡Último reto de la misión! En lugar de multiplicar, vamos a simplificar: ¿qué obtenemos si dividimos 6 y 9 entre 3?",
      speech: "Último reto de la misión. En lugar de multiplicar, vamos a simplificar: dividamos entre tres arriba y abajo para encontrar la fracción más simple.",
    },
  ];

  // Determine current robot emotional state and spoken prompt for questions phase
  let questionEmotion: TutorEmotion = "explaining";
  const defaultGuide = EXERCISE_TUTOR_GUIDES[exerciseIndex] || {
    dialogue: "¡Tú puedes, Mariana! Lee la pregunta con calma o toca 'Escuchar' y te la leo en voz alta.",
    speech: `Pregunta número ${exerciseIndex + 1}: ${currentExercise.prompt}`,
  };

  let questionDialogue = defaultGuide.dialogue;
  let questionSpeech = `Pregunta ${exerciseIndex + 1}: ${currentExercise.prompt}. ${defaultGuide.speech}`;

  const POSITIVE_PRAISES = [
    "¡Muy bien! Notaste la relación entre las partes.",
    "¡Exacto! Buen razonamiento.",
    "¡Lo lograste! Excelente observación visual.",
    "¡Correcto! Observaste el paso importante.",
    "¡Excelente! Aplicaste la regla con precisión.",
  ];

  if (isEvaluated) {
    if (evaluationResult?.isCorrect) {
      questionEmotion = "success";
      const praise = POSITIVE_PRAISES[exerciseIndex % POSITIVE_PRAISES.length];
      questionDialogue = `${praise} 🎉 Elegiste la respuesta correcta.`;
      questionSpeech = `${praise} ${evaluationResult?.feedback || "Has respondido correctamente."}`;
    } else {
      if (attemptCount === 1) {
        questionEmotion = "hint";
        questionDialogue = "Casi lo tienes. No pasa nada, Mariana. Observa el recurso interactivo y escucha esta pista:";
        questionSpeech = `Casi lo tienes. No pasa nada, Mariana. Escucha esta pista: ${evaluationResult?.hint || currentExercise.hint}`;
      } else {
        questionEmotion = "explaining";
        questionDialogue = "¡Casi lo logras! Yo te ayudo con otro enfoque para entenderlo:";
        questionSpeech = `¡Casi lo logras! Yo te ayudo con otra explicación: ${evaluationResult?.guidedExample || evaluationResult?.alternativeExplanation || currentExercise.alternativeExplanation}`;
      }
    }
  } else if (showManualHint) {
    questionEmotion = "hint";
    questionDialogue = "Aquí tienes una pista de tu Tutor para orientarte con la respuesta:";
    questionSpeech = `Pista orientadora: ${currentExercise.hint}`;
  }

  // =========================================================================
  // 1. FASE DE EXPLICACIÓN: DESCUBRIMIENTO GUIADO (LAYOUT 2 COLUMNAS)
  // =========================================================================
  if (supportDialogue && !isEvaluated) {
    questionEmotion = "hint";
    questionDialogue = supportDialogue;
    questionSpeech = supportDialogue;
  }

  if (phase === "explanation") {
    return (
      <div className="subject-shell max-w-6xl mx-auto space-y-6" data-subject="matematicas">
        {renderPedagogicalProgression()}

        {/* CONTENEDOR 2 COLUMNAS: IZQUIERDA ACTIVIDAD, DERECHA TUTOR ROBOT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA (7 cols): ZONA INTERACTIVA MANIPULABLE */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <InteractiveFractionDiscovery
              onSupport={recordSupport}
              onComplete={() => setPhase("questions")}
              onTutorUpdate={handleTutorUpdate}
            />
          </div>

          {/* COLUMNA DERECHA (5 cols): ROBOT OFICIAL ACOMPAÑANTE */}
          <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-b from-blue-50/90 via-white to-amber-50/50 rounded-3xl border-2 border-blue-200/90 p-6 sm:p-8 space-y-6 shadow-sm sticky top-6 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 font-extrabold text-xs px-3.5 py-1 rounded-full border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Tu Maestro Tutor IA</span>
            </div>

            {/* Robot Oficial Grande */}
            <div className="flex justify-center py-2">
              <TutorRobotAvatar
                size="2xl"
                showGlow
                priority
                isSpeaking={speech.isSpeaking}
                emotion={discoveryTutorData.emotion}
              />
            </div>

            {/* Globo de Diálogo Activo */}
            <div className="relative bg-white border-2 border-blue-200/80 rounded-2xl p-5 shadow-xs text-left space-y-3">
              <div className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed space-y-2.5">
                {discoveryTutorData.dialogText.split("\n\n").map((para, idx) => (
                  <p key={idx} className={idx === 0 ? "font-bold text-slate-900 text-base sm:text-lg" : ""}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Estado audible del robot */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                {speech.isSpeaking ? (
                  <span className="text-amber-800 font-extrabold flex items-center gap-1.5 animate-pulse">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>Estoy hablando contigo...</span>
                  </span>
                ) : (
                  <span>Toca escuchar para que te lo lea en voz alta:</span>
                )}
              </div>

              {/* Botón de Escuchar Explicación */}
              <div className="pt-1 flex justify-start">
                <SpeechAudioButton
                  textToSpeak={discoveryTutorData.speechText}
                  label="Escuchar al Tutor"
                  repeatLabel="Repetir"
                  variant="amber"
                  speech={speech}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. FASE DE PREGUNTAS: PRÁCTICA ADAPTATIVA (LAYOUT 2 COLUMNAS)
  // =========================================================================
  if (phase === "questions") {
    return (
      <div className="subject-shell max-w-6xl mx-auto space-y-6" data-subject="matematicas">
        {renderPedagogicalProgression()}

        {/* CONTENEDOR 2 COLUMNAS: IZQUIERDA PREGUNTA Y OPCIONES, DERECHA ROBOT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA (7 cols): PREGUNTA, BARRAS Y TARJETAS GRANDES */}
          <div className="lg:col-span-7 xl:col-span-8 theme-card rounded-3xl border shadow-sm p-5 sm:p-8 space-y-6 text-left">
            {/* Encabezado del Ejercicio */}
            <div className="theme-banner flex flex-wrap items-center justify-between gap-3 pb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Fracciones equivalentes
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Ejercicio {exerciseIndex + 1} de {practice.exercises.length}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-lg border ${
                    currentDifficulty === "easy"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : currentDifficulty === "medium"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-purple-50 text-purple-800 border-purple-200"
                  }`}
                >
                  {currentDifficulty === "easy" ? "Fácil" : currentDifficulty === "medium" ? "Media" : "Desafío"}
                </span>

                <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
                  Intento {attemptCount}
                </span>
              </div>
            </div>

            {/* Planteamiento de la pregunta en tipografía grande */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {currentExercise.prompt}
              </h3>

              {/* RENDERIZADO DIDÁCTICO SEGÚN EL TIPO DE REACTIVO */}
              {exerciseIndex === 0 && (
                <>
                  {currentExercise.visualData && (
                    <div className="pt-1">
                      <FractionBarVisualizer
                        showEquivalence={Boolean(evaluationResult?.isCorrect)}
                        fractionA={currentExercise.visualData.fractionA}
                        fractionB={currentExercise.visualData.fractionB}
                        labelA={currentExercise.visualData.labelA}
                        labelB={currentExercise.visualData.labelB}
                      />
                    </div>
                  )}
                  <FractionCardInteractive
                    options={currentExercise.options}
                    selectedOption={selectedOption}
                    onSelect={selectOption}
                    isEvaluated={isEvaluated}
                    correctAnswer={currentExercise.correctAnswer}
                    evaluationResult={evaluationResult}
                  />
                </>
              )}

              {exerciseIndex === 1 && (
                <ChocolateBarInteractive
                  options={currentExercise.options}
                  selectedOption={selectedOption}
                  onSelect={selectOption}
                  isEvaluated={isEvaluated}
                  correctAnswer={currentExercise.correctAnswer}
                  evaluationResult={evaluationResult}
                />
              )}

              {exerciseIndex === 2 && (
                <RelationalComparisonInteractive
                  options={currentExercise.options}
                  selectedOption={selectedOption}
                  onSelect={selectOption}
                  isEvaluated={isEvaluated}
                  correctAnswer={currentExercise.correctAnswer}
                  evaluationResult={evaluationResult}
                />
              )}

              {exerciseIndex === 3 && (
                <CrossProductInteractive
                  options={currentExercise.options}
                  selectedOption={selectedOption}
                  onSelect={selectOption}
                  isEvaluated={isEvaluated}
                  correctAnswer={currentExercise.correctAnswer}
                  evaluationResult={evaluationResult}
                />
              )}

              {exerciseIndex === 4 && (
                <SimplificationInteractive
                  options={currentExercise.options}
                  selectedOption={selectedOption}
                  onSelect={selectOption}
                  isEvaluated={isEvaluated}
                  correctAnswer={currentExercise.correctAnswer}
                  evaluationResult={evaluationResult}
                />
              )}

              {exerciseIndex > 4 && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentExercise.options.map((option, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !isEvaluated && setSelectedOption(option)}
                        disabled={isEvaluated}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between select-none ${
                          selectedOption === option
                            ? "bg-blue-50 border-blue-600 text-blue-950 font-black ring-4 ring-blue-300"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                        }`}
                      >
                        <span className="font-extrabold text-base">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

              {serverError && <p role="alert" className="bg-amber-50 border border-amber-300 rounded-xl p-4">No se pudo completar la operación en el servidor: {serverError}. Vuelve a intentar.</p>}
              {/* FEEDBACK AMIGABLE INMEDIATO (SIN TACHAS AGRESIVAS) */}
            {(!isEvaluated || !evaluationResult?.isCorrect) && <SupportCoach key={currentExercise.id} exercise={currentExercise} onSupport={recordSupport} onDialogue={text => {speech.stop();setSupportDialogue(text);}} />}
            {isEvaluated && (
              <div
                className={`p-5 rounded-2xl border-2 text-sm space-y-2.5 transition-all ${
                  evaluationResult?.isCorrect
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
                    : "bg-amber-50 border-amber-300 text-amber-950 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-2 font-black text-base">
                  <TutorRobotAvatar size="xs" emotion={evaluationResult?.isCorrect ? "success" : "hint"} />
                  <span>
                    {evaluationResult?.isCorrect
                      ? "¡Muy bien! 🎉 ¡Lo descubriste!"
                      : attemptCount === 1
                      ? "Casi lo tienes. Mira la pista que preparé:"
                      : "¡Casi lo logras! Yo te ayudo con otro enfoque:"}
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed bg-white/80 p-3.5 rounded-xl border border-slate-200/60">
                  {!evaluationResult?.isCorrect
                    ? attemptCount === 1
                      ? evaluationResult?.hint || "Observa qué ocurre cuando multiplicamos numerador y denominador por el mismo número."
                      : evaluationResult?.guidedExample || evaluationResult?.alternativeExplanation || "Piensa en partes iguales de una pizza: al duplicar las rebanadas, cada una es la mitad de grande."
                    : evaluationResult?.feedback}
                </p>
                {!evaluationResult?.isCorrect && (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100/90 px-3.5 py-2 rounded-xl border border-amber-300 shadow-xs">
                    <span className="text-base">🌟</span>
                    <span>¡Reconocimiento por esfuerzo! Equivocarse es la forma número uno en que aprende el cerebro. ¡Sigue adelante!</span>
                  </div>
                )}
              </div>
            )}

            {/* Pista manual orientadora */}
            {showManualHint && !isEvaluated && (
              <div className="p-4 bg-amber-50/90 rounded-2xl border-2 border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Pista orientadora de tu Tutor:</span>
                </div>
                <p className="bg-white/80 p-3 rounded-xl border border-amber-200 font-medium">
                  {currentExercise.hint}
                </p>
              </div>
            )}

            {/* PANEL INFERIOR Y ACCIONES */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    speech.stop();
                    setPhase("explanation");
                  }}
                  className="font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2"
                >
                  ← Repasar dibujo guiado
                </button>

              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-3">
                {!isEvaluated ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedOption}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm px-7 py-3.5 rounded-2xl transition shadow-xs"
                  >
                    Comprobar respuesta
                  </button>
                ) : !evaluationResult?.isCorrect && evaluationResult?.allowRetry ? (
                  <button
                    onClick={handleNextAttempt}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-6 py-3.5 rounded-2xl transition flex items-center gap-2 shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {attemptCount === 1
                        ? "Intentar de nuevo con la pista"
                        : "Intentar de nuevo con nueva explicación"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleNextExercise}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-7 py-3.5 rounded-2xl transition flex items-center gap-2 shadow-xs"
                  >
                    <span>
                      {exerciseIndex + 1 < practice.exercises.length
                        ? "Siguiente ejercicio"
                        : "Finalizar y ver progreso"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (5 cols): ROBOT TUTOR ACOMPAÑANTE */}
          <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-b from-blue-50/90 via-white to-amber-50/50 rounded-3xl border-2 border-blue-200/90 p-6 sm:p-8 space-y-6 shadow-sm sticky top-6 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 font-extrabold text-xs px-3.5 py-1 rounded-full border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Tu Maestro Tutor IA</span>
            </div>

            {/* Robot Oficial Grande con expresión emocional */}
            <div className="flex justify-center py-2">
              <TutorRobotAvatar
                size="2xl"
                showGlow
                priority
                isSpeaking={speech.isSpeaking}
                emotion={questionEmotion}
              />
            </div>

            {/* Globo de Diálogo del Robot */}
            <div className="relative bg-white border-2 border-blue-200/80 rounded-2xl p-5 shadow-xs text-left space-y-3">
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                &ldquo;{questionDialogue}&rdquo;
              </p>

              {/* Estado audible del robot */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                {speech.isSpeaking ? (
                  <span className="text-amber-800 font-extrabold flex items-center gap-1.5 animate-pulse">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>Estoy hablando contigo...</span>
                  </span>
                ) : (
                  <span>Toca escuchar para que te lo lea en voz alta:</span>
                )}
              </div>

              {/* Botón de Escuchar Pregunta / Pista */}
              <div className="pt-1 flex justify-start">
                <SpeechAudioButton
                  textToSpeak={questionSpeech}
                  label={isEvaluated && !evaluationResult?.isCorrect ? "Escuchar pista" : "Escuchar al Tutor"}
                  repeatLabel="Repetir"
                  variant="amber"
                  speech={speech}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. FASE DE RESULTADOS: CELEBRACIÓN CON ROBOT GRANDE (ETAPA 6: EVIDENCIA)
  // =========================================================================
  const initialScore = baselineScore;
  const delta = finalCalculatedScore - initialScore;

  const totalAttemptsUsed = historyAnswers.reduce((sum, a) => sum + (a.attemptsUsed || 1), 0);
  const totalHintsUsed = supportCounts.hints;

  const celebrationSpeech = `¡Excelente trabajo, Mariana! Has completado tu práctica con ${finalCalculatedScore} por ciento${
    delta > 0 ? `, mejorando ${delta} puntos desde tu diagnóstico inicial` : ""
  }. Hoy aprendiste fracciones equivalentes, comparación visual y amplificación. ¡Estoy muy orgulloso de ti! Seguiremos practicando juntos.`;

  return (
    <div data-subject="matematicas" className="subject-shell theme-card rounded-3xl border-2 shadow-md p-5 sm:p-12 max-w-3xl mx-auto space-y-8 text-center">
      {renderPedagogicalProgression()}

      {/* Robot Oficial Grande Celebrando con Aura Dorada */}
      <div className="flex flex-col items-center justify-center gap-4 pt-2">
        <TutorRobotAvatar
          size="2xl"
          showGlow
          priority
          isSpeaking={speech.isSpeaking}
          emotion="celebrating"
        />

        <SpeechAudioButton
          textToSpeak={celebrationSpeech}
          label="Escuchar a mi Tutor"
          repeatLabel="Repetir"
          variant="amber"
          speech={speech}
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-300">
          ¡Práctica completada con éxito!
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          ¡Excelente trabajo, Mariana! 🎉
        </h2>
        <p className="text-base text-slate-600 max-w-lg mx-auto font-medium">
          Hoy descubriste cómo funcionan las fracciones equivalentes paso a paso con tu Tutor IA.
        </p>
      </div>

      {/* Puntuación Auténtica Calculada */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-blue-50 rounded-3xl border-2 border-emerald-200 p-6 space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Calificación Obtenida
        </span>
        <div className="text-5xl sm:text-6xl font-black text-emerald-600 font-mono">
          {finalCalculatedScore}%
        </div>
        <p className="text-base font-extrabold text-slate-800">
          {finalCorrectCount} de {practice.exercises.length} reactivos correctos
        </p>
        <div className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-100 py-1.5 px-4 rounded-full inline-block border border-emerald-300 mt-1">
          {delta >= 0
            ? `+${delta} puntos ganados desde tu diagnóstico (${initialScore}% → ${finalCalculatedScore}%)`
            : `Puntaje obtenido: ${finalCalculatedScore}%`}
        </div>
      </div>

      {/* Resumen pedagógico de andamiaje e intentos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Tema</span>
          <span className="text-xs font-black text-slate-900">Fracciones</span>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Aciertos</span>
          <span className="text-xs font-black text-blue-700">{finalCorrectCount} / {practice.exercises.length}</span>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Intentos</span>
          <span className="text-xs font-black text-slate-800">{totalAttemptsUsed} intentos</span>
        </div>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Pistas usadas</span>
          <span className="text-xs font-black text-amber-700">{totalHintsUsed} pistas</span>
        </div>
      </div>

      {/* Tarjetas Visuales: Aprendiste Hoy vs Seguiremos Practicando */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        <div className="bg-emerald-50/70 p-5 rounded-2xl border-2 border-emerald-200 space-y-3">
          <span className="font-black text-emerald-950 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Hoy aprendiste:
          </span>
          <ul className="space-y-2 text-slate-800 text-xs sm:text-sm font-bold">
            {masteredSkills.map((skill, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border-2 border-amber-200 space-y-3">
          <span className="font-black text-amber-950 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            Esto lo practicaremos juntos después:
          </span>
          <ul className="space-y-2 text-slate-800 text-xs sm:text-sm font-bold">
            {pendingSkills.map((skill, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs">⏳</span>
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botones de Navegación Final */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleReturnToTeacher}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-base py-4 px-6 rounded-2xl transition shadow-sm flex items-center justify-center gap-2"
        >
          <span>Guardar evidencia y regresar al Panel del Profesor</span>
          <ArrowRight className="w-5 h-5 text-amber-300" />
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
