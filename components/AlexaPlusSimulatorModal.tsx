"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { mcpClient } from "@/lib/mcp/client";
import { MiaLivingAvatar, MiaAvatarEmotion } from "./MiaLivingAvatar";
import { useMiaVoice } from "@/lib/hooks/use-mia-voice";
import confetti from "canvas-confetti";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  X,
  Send,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  GraduationCap,
  Play,
  Mic,
  MicOff,
  Radio,
} from "lucide-react";

interface McpToolTrace {
  id: string;
  tool: string;
  status: "success" | "pending" | "error";
  durationMs: number;
  description: string;
  timestamp: string;
}

export function AlexaPlusSimulatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    selectedStudentId,
    practices,
    refreshState,
    setRole,
    setActiveTeacherTab,
  } = useTutor();

  const [practiceId, setPracticeId] = useState("");
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [input, setInput] = useState("");
  const [speechText, setSpeechText] = useState(
    "¡Hola! Soy la simulación de Alexa+ integrada con MACHTIA. Utilizo el protocolo MCP real y el motor pedagógico para acompañarte en tu práctica."
  );
  const [resolved, setResolved] = useState(false);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toolTraces, setToolTraces] = useState<McpToolTrace[]>([]);
  const [isMicListening, setIsMicListening] = useState(false);

  const miaVoice = useMiaVoice();
  const {
    speak,
    stop,
    replay,
    isSpeaking,
    isLoading: isLoadingVoice,
    voiceSource,
    provider: voiceProvider,
    latencyMs: voiceLatency,
  } = miaVoice;

  const recognitionRef = useRef<any>(null);

  // Setup speech recognition for simulated voice input
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.lang = "es-MX";
        recog.continuous = false;
        recog.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript || "";
          if (transcript) {
            setInput(transcript);
          }
          setIsMicListening(false);
        };
        recog.onerror = () => setIsMicListening(false);
        recog.onend = () => setIsMicListening(false);
        recognitionRef.current = recog;
      }
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isMicListening) {
      recognitionRef.current.stop();
      setIsMicListening(false);
    } else {
      stop();
      try {
        recognitionRef.current.start();
        setIsMicListening(true);
      } catch {}
    }
  };

  const practice = practices.find((p) => p.id === practiceId);
  const exercise = practice?.exercises[index];

  // Stop speech on close
  useEffect(() => {
    if (!isOpen) stop();
  }, [isOpen, stop]);

  async function perform(
    toolName: string,
    description: string,
    task: () => Promise<void>
  ) {
    if (busy) return;
    setBusy(true);
    setError("");
    stop();

    const startTs = Date.now();
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      await task();
      const elapsed = Date.now() - startTs;
      setToolTraces((prev) => [
        {
          id: traceId,
          tool: toolName,
          status: "success",
          durationMs: elapsed,
          description,
          timestamp: new Date().toLocaleTimeString("es-MX", { hour12: false }),
        },
        ...prev.slice(0, 7),
      ]);
    } catch (e: any) {
      const elapsed = Date.now() - startTs;
      const errorMsg = e?.message || String(e);
      setError(errorMsg);
      setToolTraces((prev) => [
        {
          id: traceId,
          tool: toolName,
          status: "error",
          durationMs: elapsed,
          description: `Fallo: ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString("es-MX", { hour12: false }),
        },
        ...prev.slice(0, 7),
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    await perform("start_practice", "Inicialización de sesión y asignación curricular", async () => {
      await mcpClient.selectRole("student", selectedStudentId);
      const context = await mcpClient.getStudentContext(selectedStudentId);
      const assigned = await mcpClient.getAssignedPractice(selectedStudentId);
      const target = assigned.result.practices.find((p: any) => p.status !== "completed");
      if (!target) throw new Error("No hay práctica pendiente. Asigna una desde el panel docente.");

      const begun = await mcpClient.startPractice(target.practiceId, selectedStudentId);
      setRole("student");
      await refreshState();
      setPracticeId(target.practiceId);
      setIndex(0);
      setAttempt(1);
      setResolved(false);
      setFinished(false);

      const promptToSay = context.result.alexaVoicePrompt + " " + begun.result.alexaSpeechPrompt;
      setSpeechText(promptToSay);
      void speak(promptToSay);
    });
  }

  async function answer() {
    if (!practice || !exercise || !input.trim()) return;
    const submittedVal = input.trim();
    setInput("");

    await perform("submit_answer", `Evaluación formativa de respuesta: "${submittedVal}"`, async () => {
      await mcpClient.selectRole("student", practice.studentId);
      const result = await mcpClient.submitAnswer(
        practice.id,
        exercise.id,
        submittedVal,
        attempt,
        practice.studentId
      );

      const feedback = result.result.alexaSpeechFeedback;
      setSpeechText(feedback);
      const isCorrect = result.result.isCorrect;
      setResolved(isCorrect || !result.result.allowRetry);
      setAttempt(result.result.attemptNumber + 1);

      if (isCorrect) {
        try {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }

      void speak(feedback);
    });
  }

  async function next() {
    if (!practice) return;
    if (index + 1 < practice.exercises.length) {
      setIndex((i) => i + 1);
      setAttempt(1);
      setResolved(false);
      const nextPrompt = `Siguiente ejercicio: ${practice.exercises[index + 1].prompt}`;
      setSpeechText(nextPrompt);
      void speak(nextPrompt);
      return;
    }

    await perform("complete_practice", "Cierre de práctica y generación de evidencia MCP", async () => {
      const result = await mcpClient.completePractice(practice.id, practice.studentId);
      setSpeechText(result.result.alexaCelebrationSpeech);
      setFinished(true);
      await refreshState();
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      } catch {}
      void speak(result.result.alexaCelebrationSpeech);
    });
  }

  async function support(level: "hint" | "analogy" | "step_by_step") {
    if (!exercise || !practice) return;
    const label =
      level === "hint"
        ? "Pista didáctica"
        : level === "analogy"
        ? "Explicación por analogía"
        : "Guía paso a paso";

    await perform(
      level === "hint" ? "get_hint" : "get_adaptive_explanation",
      `Solicitud de andamiaje pedagógico (${label})`,
      async () => {
        const result =
          level === "hint"
            ? await mcpClient.getHint(exercise.id, practice.studentId, { practiceId: practice.id })
            : await mcpClient.getAdaptiveExplanation(exercise.id, practice.studentId, {
                practiceId: practice.id,
                level,
              });

        const textResult = result.result.hint || result.result.explanation;
        setSpeechText(textResult);
        void speak(textResult);
      }
    );
  }

  async function report() {
    if (!practice) return;
    await perform("get_practice_result", "Transferencia de evidencia diagnóstica a vista docente", async () => {
      await mcpClient.selectRole("teacher", practice.studentId);
      const result = await mcpClient.getPracticeResult(practice.id, practice.studentId);
      setSpeechText(
        `Diagnóstico registrado para ${practice.studentName}: Dominio alcanzado ${result.result.finalScore}% con evidencia ${result.result.evidenceId}.`
      );
      setRole("teacher");
      setActiveTeacherTab("evidences");
      await refreshState();
      onClose();
    });
  }

  if (!isOpen) return null;

  // Resolve living avatar emotion state
  const avatarEmotion: MiaAvatarEmotion = finished
    ? "success"
    : isSpeaking
    ? "speaking"
    : busy
    ? "thinking"
    : isMicListening
    ? "listening"
    : "idle";

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alexa-simulator-title"
    >
      <div className="w-full max-w-3xl bg-slate-900 text-white rounded-3xl border border-sky-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-4 sm:p-5 border-b border-sky-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="alexa-simulator-title" className="text-base sm:text-lg font-black tracking-tight">
                  Simulador Conversacional Alexa+
                </h2>
                <span className="text-[10px] font-bold bg-sky-400/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  MCP Real
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                Experiencia multimodal demostrativa · Voz natural ElevenLabs · Andamiaje adaptativo
              </p>
            </div>
          </div>

          <button
            aria-label="Cerrar simulador"
            onClick={() => {
              stop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Disclaimer Banner */}
        <div className="bg-sky-950/40 border-b border-sky-500/20 px-5 py-2 text-[11px] text-sky-200 flex items-center justify-between">
          <span>
            ℹ️ <strong>Simulación Didáctica:</strong> Conecta directamente con herramientas MCP sin requerir hardware físico Echo.
          </span>
          <span className="font-semibold text-amber-300">
            {voiceSource === "elevenlabs" ? "🎙️ ElevenLabs HD" : "🗣️ Voz de Respaldo"}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Central Audiovisual Stage with Living Avatar */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-b from-slate-800/80 to-slate-950/80 rounded-3xl p-5 border border-sky-500/20 shadow-inner">
            <div className="shrink-0 flex flex-col items-center">
              <MiaLivingAvatar
                size="lg"
                emotion={avatarEmotion}
                isSpeaking={isSpeaking}
                isListening={isMicListening}
                showHalo={true}
              />
              <span className="mt-2 text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                {isSpeaking ? "Hablando..." : busy ? "Pensando MCP..." : isMicListening ? "Escuchando..." : "Listo"}
              </span>
            </div>

            <div className="flex-1 space-y-3 w-full">
              {/* Alexa Speech Bubble */}
              <div
                role="status"
                aria-live="polite"
                className="bg-slate-900/90 rounded-2xl p-4 border border-sky-400/30 text-xs sm:text-sm text-slate-100 leading-relaxed shadow-sm min-h-[72px] flex items-center"
              >
                <p className="whitespace-pre-line">{speechText}</p>
              </div>

              {/* Audio Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) stop();
                      else void speak(speechText);
                    }}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition shadow-xs cursor-pointer ${
                      isSpeaking
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse"
                        : "bg-sky-600 hover:bg-sky-500 text-white"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>Detener</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Escuchar respuesta</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => replay()}
                    title="Repetir explicación en voz alta"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sky-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {voiceSource === "elevenlabs" ? "ElevenLabs HD (Paulina)" : "Voz Didáctica"}
                  </span>
                  {voiceLatency !== null && voiceLatency > 0 && (
                    <span className="text-slate-500">· {voiceLatency}ms</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Practice Flow Actions */}
          {!practiceId ? (
            <div className="text-center py-6 space-y-4 bg-slate-950/40 rounded-3xl border border-dashed border-sky-500/30 p-6">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
              <div>
                <h3 className="text-base font-bold text-white">Comienza la Práctica Adaptativa</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Alexa+ cargará el contexto formativo del alumno seleccionado a través de las herramientas oficiales MCP.
                </p>
              </div>

              <button
                disabled={busy}
                onClick={start}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold shadow-lg transition transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Comenzar práctica asignada</span>
              </button>
            </div>
          ) : exercise && !finished ? (
            /* Active Exercise Interaction */
            <div className="space-y-4 bg-slate-950/60 rounded-3xl p-5 border border-sky-500/30">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-amber-400">
                  Ejercicio {index + 1} de {practice!.exercises.length}
                </span>
                <span className="text-xs text-slate-400">
                  Intento {attempt}
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-white">
                {exercise.prompt}
              </p>

              {/* Clickable answer choices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {exercise.options.map((option) => (
                  <button
                    key={option}
                    disabled={busy || resolved}
                    onClick={() => setInput(option)}
                    className={`rounded-2xl border p-3 text-sm font-bold transition cursor-pointer ${
                      input === option
                        ? "bg-sky-600 border-sky-400 text-white shadow-md scale-102"
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Input field with microphone */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  aria-label="Respuesta del simulador"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Escribe tu respuesta o elige una opción arriba..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy || resolved}
                />

                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    isMicListening
                      ? "bg-red-500 text-white border-red-600 animate-pulse"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  }`}
                  title="Hablar respuesta por voz"
                >
                  {isMicListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  {!resolved ? (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => support("hint")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Pista MCP</span>
                      </button>

                      <button
                        disabled={busy}
                        onClick={() => support("analogy")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-sky-500/30 transition cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Analogía</span>
                      </button>

                      <button
                        disabled={busy}
                        onClick={() => support("step_by_step")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition cursor-pointer"
                      >
                        <span>Paso a paso</span>
                      </button>
                    </>
                  ) : null}
                </div>

                <div>
                  {!resolved ? (
                    <button
                      disabled={busy || !input.trim()}
                      onClick={answer}
                      className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-40 cursor-pointer"
                    >
                      Enviar respuesta
                    </button>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={next}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>{index + 1 === practice!.exercises.length ? "Finalizar práctica" : "Siguiente ejercicio"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : finished ? (
            /* Completion & Teacher Evidence Transfer */
            <div className="text-center py-6 space-y-4 bg-emerald-950/30 rounded-3xl border border-emerald-500/40 p-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
              <div>
                <h3 className="text-lg font-black text-white">¡Práctica Completada con Éxito!</h3>
                <p className="text-xs text-emerald-200/90 max-w-md mx-auto mt-1">
                  La evidencia diagnóstica formativa ha sido generada por el servidor MCP.
                </p>
              </div>

              <button
                disabled={busy}
                onClick={report}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg transition transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <GraduationCap className="w-5 h-5" />
                <span>How did Mariana do? · Ver evidencia docente</span>
              </button>
            </div>
          ) : null}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive MCP Tool Exchange Visualizer */}
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Intercambio de Herramientas MCP ({toolTraces.length})</span>
              </div>
              <span className="text-[10px] text-slate-500">Streaming JSON-RPC 2.0</span>
            </div>

            {toolTraces.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Las llamadas a herramientas del servidor MCP se mostrarán aquí en tiempo real.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {toolTraces.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="font-mono font-bold text-sky-300">{t.tool}</span>
                      <span className="text-slate-400 text-[10px] hidden sm:inline">· {t.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {t.durationMs}ms · {t.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
