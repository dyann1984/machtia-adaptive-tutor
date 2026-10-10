"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Lightbulb,
  Rocket,
  Compass,
  RefreshCw,
  MessageCircle,
  BookOpen,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useTutor } from "@/lib/context/tutor-context";
import { useMiaVoice } from "@/lib/hooks/use-mia-voice";
import { MiaMode, MiaResponse } from "@/lib/ai/mia-agent";

interface ChatEntry {
  id: string;
  sender: "user" | "mia";
  text: string;
  timestamp: string;
  topic?: string;
  mode?: MiaMode;
  funFact?: string;
  challenge?: string;
  aiProvider?: string;
  ttsSignature?: string;
}

const PRACTICE_SUGGESTIONS = [
  { text: "¿Me das una pista para mi ejercicio? 💡", mode: "practice" as const },
  { text: "¿Cómo sé si dos fracciones son equivalentes? 🍰", mode: "practice" as const },
  { text: "¿Qué es el numerador y el denominador? 🔢", mode: "practice" as const },
  { text: "¿Cuál es mi diagnóstico en matemáticas? 📊", mode: "practice" as const },
  { text: "Explícamelo paso a paso 🪜", mode: "practice" as const },
];

const FREE_SUGGESTIONS = [
  { text: "¿Por qué el cielo es azul? 🌌", mode: "free" as const },
  { text: "Enséñame las tablas de multiplicar ✖️", mode: "free" as const },
  { text: "¿Qué es un agujero negro? 🚀", mode: "free" as const },
  { text: "¿Cómo se dice perro en inglés? 🐶", mode: "free" as const },
  { text: "Explícame los dinosaurios 🦖", mode: "free" as const },
  { text: "¿Qué es una fracción? 🍰", mode: "free" as const },
  { text: "Quiero aprender programación 💻", mode: "free" as const },
  { text: "¿Por qué llueve? 💧", mode: "free" as const },
  { text: "No entendí mi tarea escolar 📝", mode: "free" as const },
];

const CURIOSITY_SUGGESTIONS = [
  { text: "Cuéntame sobre los planetas 🪐", mode: "curiosity" as const },
  { text: "¿Los dinosaurios siguen vivos? 🦖", mode: "curiosity" as const },
  { text: "¿Cómo funciona un volcán? 🌋", mode: "curiosity" as const },
  { text: "La historia mágica del chocolate 🍫", mode: "curiosity" as const },
  { text: "¿Por qué la Luna cambia de forma? 🌙", mode: "curiosity" as const },
];

export function MiaFloatingCompanion() {
  const {
    role,
    currentPracticingId,
    practices,
    selectedStudentId,
    students,
    activeExerciseContext,
  } = useTutor();

  const [isOpen, setIsOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<MiaMode>("free");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);

  const {
    speak,
    stop,
    isSpeaking,
    isLoading: isLoadingVoice,
    activeRawText,
    voiceSource,
  } = useMiaVoice();

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendMessageRef = useRef<((text?: string) => Promise<void>) | null>(null);

  // Stop audio immediately when student changes activity or practice context
  useEffect(() => {
    stop();
  }, [currentPracticingId, selectedStudentId, stop]);

  // Active student and practice context
  const student = students.find((s) => s.id === selectedStudentId);
  const activePractice = currentPracticingId
    ? practices.find((p) => p.id === currentPracticingId)
    : null;

  // Session storage message persistence (preserves multi-turn conversation)
  const [messages, setMessages] = useState<ChatEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("machtia_mia_chat_history");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [
      {
        id: "welcome-mia",
        sender: "mia",
        text: "Hola, soy MIA 👋\nTu compañera de aprendizaje.\nPregúntame lo que quieras aprender.\nAquí puedes preguntar, equivocarte y volver a intentar.",
        timestamp: new Date().toISOString(),
        mode: "free",
        topic: "Bienvenida",
      },
    ];
  });

  // Save conversation to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        sessionStorage.setItem("machtia_mia_chat_history", JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // Check speech recognition support in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechRecognitionSupported(true);
        const recog = new SpeechRecognition();
        recog.lang = "es-MX";
        recog.continuous = false;
        recog.interimResults = false;

        recog.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript || "";
          if (transcript) {
            setInputText(transcript);
            void handleSendMessageRef.current?.(transcript);
          }
          setIsListeningVoice(false);
        };

        recog.onerror = (e: any) => {
          console.warn("[MIA] Speech recognition error:", e);
          setIsListeningVoice(false);
          if (e?.error === "not-allowed") {
            setMicNotice("Permiso de micrófono no otorgado. Puedes escribir tu pregunta.");
            setTimeout(() => setMicNotice(null), 5000);
          }
        };

        recog.onend = () => {
          setIsListeningVoice(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Switch to practice mode automatically if student enters a practice
  useEffect(() => {
    if (activePractice || activeExerciseContext) {
      setCurrentMode("practice");
    }
  }, [activePractice, activeExerciseContext]);

  const toggleVoiceInput = () => {
    if (!speechRecognitionSupported) {
      setMicNotice("El reconocimiento de voz por micrófono está optimizado para Chrome y Edge. Escribe tu pregunta con confianza.");
      setTimeout(() => setMicNotice(null), 5000);
      return;
    }
    if (!recognitionRef.current) return;

    if (isListeningVoice) {
      recognitionRef.current.stop();
      setIsListeningVoice(false);
    } else {
      stop();
      try {
        recognitionRef.current.start();
        setIsListeningVoice(true);
      } catch (e) {
        console.warn("Speech recognition start error:", e);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Interrupt any active voice playback before user asks new question
    stop();
    setInputText("");

    const userEntry: ChatEntry = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
      mode: currentMode,
    };

    const updatedMessages = [...messages, userEntry];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let token = "";
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(sessionStorage.getItem("machtia_demo_capability") || "null");
          token = stored?.actorToken || stored?.judgeToken || "";
        } catch {}
      }
      if (!token) {
        token = "machtia-active-session-demo-token-client";
      }

      const fetchHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Prepare multi-turn history payload for contextual memory
      const historyPayload = updatedMessages.slice(-10).map((m) => ({
        sender: m.sender,
        text: m.text,
        topic: m.topic,
        mode: m.mode,
      }));

      // Rich educational context
      const practiceContext = {
        practiceId: activePractice?.id,
        exerciseId: activeExerciseContext?.exerciseId,
        topic: activePractice?.topicId,
        topicName: activeExerciseContext?.topicName || activePractice?.topicName || "Fracciones Equivalentes",
        subject: activePractice?.subjectId || "Matemáticas",
        exercisePrompt: activeExerciseContext?.exercisePrompt,
        options: activeExerciseContext?.options,
        attemptNumber: activeExerciseContext?.attemptCount,
        studentName: student?.name || "Mariana López",
        studentId: selectedStudentId || "student-mariana-1",
        grade: 3,
        diagnosticScore: student?.topicPerformances?.["fracciones-equivalentes"] ?? 52,
        diagnosticGap: "Comparación de fracciones con distinto denominador",
      };

      const res = await fetch("/api/mia", {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify({
          message: text,
          mode: currentMode,
          practiceContext,
          history: historyPayload,
        }),
      });

      let data: MiaResponse;
      if (res.ok) {
        data = await res.json();
      } else {
        throw new Error("Servidor no disponible");
      }

      const miaEntry: ChatEntry = {
        id: `mia-${Date.now()}`,
        sender: "mia",
        text: data.reply,
        timestamp: new Date().toISOString(),
        topic: data.topic,
        mode: data.mode,
        funFact: data.funFact,
        challenge: data.challenge,
        aiProvider: data.aiProvider,
        ttsSignature: data.ttsSignature,
      };

      setMessages((prev) => [...prev, miaEntry]);

      if (autoSpeak) {
        speak(data.reply, data.ttsSignature);
      }
    } catch {
      // Graceful offline fallback with socratic encouragement
      const fallbackEntry: ChatEntry = {
        id: `mia-${Date.now()}`,
        sender: "mia",
        text: `¡Qué gran pregunta, Mariana! 🌟 Sobre "${text}": en la escuela aprendemos pasito a pasito. Recuerda que no hay dudas pequeñas y preguntar es lo que nos hace más inteligentes. ¿Quieres que lo comparemos con un ejemplo de chocolate o de pizzas?`,
        timestamp: new Date().toISOString(),
        mode: currentMode,
        topic: "Aprendizaje Adaptativo",
      };
      setMessages((prev) => [...prev, fallbackEntry]);
    } finally {
      setIsLoading(false);
    }
  };
  handleSendMessageRef.current = handleSendMessage;

  const handleClearChat = () => {
    stop();
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("machtia_mia_chat_history");
      } catch {}
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "mia",
        text: "Hola, soy MIA 👋\nTu compañera de aprendizaje.\nPregúntame lo que quieras aprender.\nAquí puedes preguntar, equivocarte y volver a intentar.",
        timestamp: new Date().toISOString(),
        mode: currentMode,
        topic: "Bienvenida",
      },
    ]);
  };

  // Select dynamic suggestion list based on current active mode
  const currentSuggestions =
    currentMode === "practice"
      ? PRACTICE_SUGGESTIONS
      : currentMode === "curiosity"
      ? CURIOSITY_SUGGESTIONS
      : FREE_SUGGESTIONS;

  return (
    <>
      {/* ============================================================== */}
      {/* 1. BURBUJA FLOTANTE CERRADA (No estorba la actividad del alumno) */}
      {/* ============================================================== */}
      {!isOpen && (
        <div
          data-testid="mia-floating-bubble"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Pill / Tooltip badge */}
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 bg-white/95 hover:bg-white text-slate-800 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-lg border border-blue-200/90 transition hover:shadow-xl hover:scale-105 active:scale-95"
            aria-label="Abrir compañera educativa MIA"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
            <span>Pregúntale a MIA</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
              {currentMode === "practice"
                ? "🎯 Práctica"
                : currentMode === "curiosity"
                ? "🚀 Curiosidad"
                : "💡 Libre"}
            </span>
          </button>

          {/* Avatar button with official character asset */}
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-sky-400 to-amber-400 shadow-xl hover:shadow-2xl transition transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300"
            title="Abrir chat con MIA, tu compañera de aprendizaje"
          >
            {/* Ambient breathing glow */}
            <span className="absolute -inset-1 rounded-full bg-blue-400/40 blur-md group-hover:bg-blue-400/60 animate-pulse pointer-events-none" />

            {/* Container for the official transparent asset */}
            <div className="relative w-full h-full rounded-full bg-slate-950 overflow-hidden flex items-center justify-center border-2 border-white">
              <Image
                src="/mia-thumb.png"
                alt="MIA - Compañera Educativa MACHTIA"
                width={72}
                height={72}
                className="w-full h-full object-contain pointer-events-none select-none transition group-hover:scale-105"
                priority
              />
            </div>

            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. VENTANA DE CONVERSACIÓN ABIERTA                            */}
      {/* ============================================================== */}
      {isOpen && (
        <section
          data-testid="mia-chat-window"
          role="dialog"
          aria-label="Conversación con MIA"
          className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 w-[95vw] sm:w-[440px] max-w-[450px] h-[620px] max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              {/* Avatar with visual status glow */}
              <div
                className={`relative w-11 h-11 rounded-2xl bg-slate-950 border-2 overflow-hidden shrink-0 shadow-sm transition-all duration-300 ${
                  isSpeaking
                    ? "border-amber-400 ring-4 ring-amber-300/40 scale-105"
                    : isListeningVoice
                    ? "border-red-400 ring-4 ring-red-400/40 animate-pulse"
                    : isLoading
                    ? "border-sky-400 ring-4 ring-sky-300/40"
                    : "border-amber-300/80"
                }`}
              >
                <Image
                  src="/mia-thumb.png"
                  alt="MIA Robot"
                  width={44}
                  height={44}
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight flex items-center gap-1.5">
                    MIA
                    <span className="text-amber-300 text-xs font-bold bg-amber-400/20 px-1.5 py-0.5 rounded">
                      Compañera IA
                    </span>
                  </h2>
                </div>

                {/* Real-time Dynamic Visual Status Indicator */}
                <p className="text-[11px] text-blue-100 flex items-center gap-1.5">
                  {isListeningVoice ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
                      <span className="font-bold text-red-200">🎙️ Escuchando tu voz...</span>
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 text-sky-200 animate-spin inline-block" />
                      <span className="font-semibold text-sky-100">Pensando explicación...</span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce inline-block" />
                      <span className="font-bold text-amber-200">
                        {voiceSource === "elevenlabs"
                          ? "🎙️ ElevenLabs HD (Paulina · es-MX)"
                          : "🗣️ Voz Didáctica (es-MX)"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      <span className="opacity-95">
                        Lista para resolver tus dudas · <span className="text-amber-200 font-semibold">Voz didáctica activa</span>
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* TTS Voice Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (autoSpeak) stop();
                  setAutoSpeak(!autoSpeak);
                }}
                className={`p-2 rounded-xl transition ${
                  autoSpeak
                    ? "bg-amber-400 text-slate-900 font-bold shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
                title={autoSpeak ? "Voz automática activada" : "Activar voz automática"}
                aria-label="Voz automática"
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Stop ongoing speech immediately */}
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stop}
                  className="p-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white font-bold transition shadow-xs"
                  title="Detener reproducción de audio"
                  aria-label="Detener audio"
                >
                  <VolumeX className="w-4 h-4 animate-bounce" />
                </button>
              )}

              {/* Clear chat */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition"
                title="Reiniciar conversación"
                aria-label="Reiniciar conversación"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Minimize / Close */}
              <button
                type="button"
                onClick={() => {
                  stop();
                  setIsOpen(false);
                }}
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition"
                title="Minimizar MIA"
                aria-label="Cerrar ventana de MIA"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Mode Switcher Tabs */}
          <div className="bg-slate-100/90 border-b border-slate-200 p-1.5 flex gap-1">
            <button
              type="button"
              onClick={() => setCurrentMode("practice")}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                currentMode === "practice"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Modo Práctica</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentMode("free")}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                currentMode === "free"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Pregunta Libre</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentMode("curiosity")}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                currentMode === "curiosity"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-indigo-600" />
              <span>Curiosidad</span>
            </button>
          </div>

          {/* Subtitle / Mode guidance */}
          <div className="bg-blue-50/70 px-4 py-1.5 border-b border-blue-100/80 text-[11px] text-blue-900 flex items-center justify-between">
            <span>
              {currentMode === "practice" && (
                <>🎯 <strong>Modo Práctica:</strong> Te guío con pistas socráticas sin darte la respuesta de inmediato.</>
              )}
              {currentMode === "free" && (
                <>💡 <strong>Pregunta Libre:</strong> Aprende de ciencias, matemáticas, inglés, espacio o dudas de clase.</>
              )}
              {currentMode === "curiosity" && (
                <>🚀 <strong>Modo Curiosidad:</strong> Historias cortas, analogías y pequeños retos divertidos.</>
              )}
            </span>
          </div>

          {/* Conversation Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
          >
            {messages.map((m) => {
              const isMia = m.sender === "mia";
              const isSpeakingThisMessage = isSpeaking && activeRawText === m.text;

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isMia ? "items-start" : "items-end justify-end"}`}
                >
                  {isMia && (
                    <div
                      className={`w-8 h-8 rounded-xl bg-slate-950 border overflow-hidden shrink-0 mt-0.5 transition ${
                        isSpeakingThisMessage
                          ? "border-amber-400 ring-2 ring-amber-300"
                          : "border-blue-300"
                      }`}
                    >
                      <Image
                        src="/mia-thumb.png"
                        alt="MIA"
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                      isMia
                        ? isSpeakingThisMessage
                          ? "bg-amber-50/70 border-2 border-amber-300 text-slate-900 rounded-tl-sm space-y-2 ring-2 ring-amber-200/50"
                          : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm space-y-2"
                        : "bg-blue-600 text-white rounded-br-sm"
                    }`}
                  >
                    {isMia && m.topic && (
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {m.topic}
                        </span>

                        {/* Audio Speak button with synchronized states */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isSpeaking && activeRawText === m.text) {
                              stop();
                            } else {
                              void speak(m.text, m.ttsSignature);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 transition text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                            isSpeakingThisMessage
                              ? "bg-amber-100 text-amber-800 font-bold"
                              : isLoadingVoice && activeRawText === m.text
                              ? "bg-amber-50 text-amber-600 animate-pulse"
                              : "text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                          }`}
                          title={
                            isSpeakingThisMessage
                              ? "Detener audio de MIA"
                              : "Escuchar explicación de MIA"
                          }
                          aria-label={
                            isSpeakingThisMessage ? "Detener voz de MIA" : "Escuchar a MIA"
                          }
                        >
                          {isLoadingVoice && activeRawText === m.text ? (
                            <>
                              <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                              <span>Generando voz...</span>
                            </>
                          ) : isSpeakingThisMessage ? (
                            <>
                              {/* Animated equalizing bars */}
                              <div className="flex items-center gap-0.5">
                                <span className="w-0.5 h-3 bg-amber-600 rounded-full animate-bounce" />
                                <span className="w-0.5 h-4 bg-amber-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                                <span className="w-0.5 h-2.5 bg-amber-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                              </div>
                              <VolumeX className="w-3 h-3 text-amber-700 ml-0.5" />
                              <span>Detener</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-blue-600" />
                              <span>Escuchar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="whitespace-pre-line">{m.text}</div>

                    {isMia && m.challenge && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-amber-950 text-[11px] space-y-1">
                        <div className="font-bold flex items-center gap-1 text-amber-800">
                          <Rocket className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mini-Reto de MIA:</span>
                        </div>
                        <p>{m.challenge}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking Visual Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-start animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-slate-950 border border-sky-400 ring-2 ring-sky-300/40 overflow-hidden shrink-0 animate-pulse">
                  <Image
                    src="/mia-thumb.png"
                    alt="MIA"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 text-xs text-slate-700 flex items-center gap-2 shadow-xs">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="font-medium">MIA está pensando la mejor explicación paso a paso...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips Carousel */}
          <div className="bg-white border-t border-slate-100 px-3 py-2 overflow-x-auto no-scrollbar flex gap-2">
            {currentSuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentMode(s.mode);
                  void handleSendMessage(s.text);
                }}
                className="shrink-0 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 hover:border-blue-300 transition"
              >
                {s.text}
              </button>
            ))}
          </div>

          {/* Input Bar with Text and Voice */}
          <footer className="p-3 bg-white border-t border-slate-200">
            {/* Listening Visual Banner */}
            {isListeningVoice && (
              <div className="mb-2 p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>MIA te está escuchando... ¡Habla ahora con tu micrófono!</span>
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className="text-xs text-red-800 underline hover:text-red-950"
                >
                  Detener
                </button>
              </div>
            )}

            {/* Mic Notice (permission/unsupported) */}
            {micNotice && (
              <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center justify-between">
                <span>{micNotice}</span>
                <button
                  type="button"
                  onClick={() => setMicNotice(null)}
                  className="text-amber-900 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  currentMode === "practice"
                    ? "Pide una pista o pregunta sobre tu ejercicio..."
                    : "Pregúntale a MIA lo que quieras saber..."
                }
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                disabled={isLoading}
              />

              {/* Microphone Voice Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-2xl border transition ${
                  isListeningVoice
                    ? "bg-red-500 text-white border-red-600 animate-pulse shadow-md"
                    : "bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                }`}
                title={
                  isListeningVoice
                    ? "Detener micrófono"
                    : speechRecognitionSupported
                    ? "Hablar por micrófono con MIA"
                    : "Reconocimiento por micrófono"
                }
                aria-label="Hablar por voz"
              >
                {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-2xl shadow-xs transition hover:scale-105 active:scale-95"
                title="Enviar pregunta a MIA"
                aria-label="Enviar pregunta"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>MACHTIA Adaptive Companion · Primaria 3° B</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Seguro para niños
              </span>
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
