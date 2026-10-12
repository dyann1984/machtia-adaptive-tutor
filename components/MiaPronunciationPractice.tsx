"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import {
  PRACTICE_PHRASES,
  PracticePhrase,
  EnglishLevel,
  evaluatePronunciation,
  PronunciationEvaluation,
} from "@/lib/english/english-curriculum";

interface MiaPronunciationPracticeProps {
  onSpeak: (text: string, lang: "es-MX" | "en-US", signature?: string, options?: { rate?: number }) => void;
  isSpeaking: boolean;
  onStop: () => void;
}

export function MiaPronunciationPractice({
  onSpeak,
  isSpeaking,
  onStop,
}: MiaPronunciationPracticeProps) {
  const [levelFilter, setLevelFilter] = useState<"all" | EnglishLevel>("all");
  const [selectedPhrase, setSelectedPhrase] = useState<PracticePhrase>(PRACTICE_PHRASES[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.8 | 1.0>(1.0);
  const [isRecording, setIsRecording] = useState(false);
  const [evaluation, setEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [micNotice, setMicNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition with en-US for authentic pronunciation capture
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.lang = "en-US";
        recog.continuous = false;
        recog.interimResults = false;

        recog.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript || "";
          setIsRecording(false);
          if (transcript) {
            const evalResult = evaluatePronunciation(transcript, selectedPhrase.english);
            setEvaluation(evalResult);
          } else {
            const emptyResult = evaluatePronunciation("", selectedPhrase.english);
            setEvaluation(emptyResult);
          }
        };

        recog.onerror = (e: any) => {
          setIsRecording(false);
          if (e?.error === "no-speech") {
            const emptyResult = evaluatePronunciation("", selectedPhrase.english);
            setEvaluation(emptyResult);
            setMicNotice("No se detectó audio. Habla claro cerca del micrófono.");
          } else if (e?.error === "not-allowed") {
            setMicNotice("Permiso de micrófono denegado en el navegador.");
          }
        };

        recog.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, [selectedPhrase]);

  const handleStartRecording = () => {
    if (isSpeaking) onStop();
    setMicNotice(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    } else {
      setMicNotice("Tu navegador no soporta reconocimiento de voz nativo en inglés.");
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const filteredPhrases = PRACTICE_PHRASES.filter((p) =>
    levelFilter === "all" ? true : p.level === levelFilter
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-xs">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Taller de Pronunciación en Inglés (en-US)</span>
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => setLevelFilter("all")}
            className={`px-2 py-0.5 rounded font-medium transition ${
              levelFilter === "all" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("beginner")}
            className={`px-2 py-0.5 rounded font-medium transition ${
              levelFilter === "beginner" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Básico
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("intermediate")}
            className={`px-2 py-0.5 rounded font-medium transition ${
              levelFilter === "intermediate" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Medio
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("advanced")}
            className={`px-2 py-0.5 rounded font-medium transition ${
              levelFilter === "advanced" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Avanzado
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Phrase Selector dropdown / carousel */}
        <div>
          <label htmlFor="phrase-select" className="text-[11px] font-semibold text-slate-500 block mb-1">
            Selecciona la frase que deseas practicar:
          </label>
          <select
            id="phrase-select"
            value={selectedPhrase.id}
            onChange={(e) => {
              const found = PRACTICE_PHRASES.find((p) => p.id === e.target.value);
              if (found) {
                setSelectedPhrase(found);
                setEvaluation(null);
                setMicNotice(null);
              }
            }}
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl p-2 font-medium shadow-2xs focus:border-blue-500 focus:outline-hidden"
          >
            {filteredPhrases.map((phrase) => (
              <option key={phrase.id} value={phrase.id}>
                {phrase.english} — ({phrase.spanish})
              </option>
            ))}
          </select>
        </div>

        {/* Target Phrase Display Card */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
              Frase Objetivo ({selectedPhrase.level.toUpperCase()})
            </span>

            {/* Speed Toggle: Normal vs Lento */}
            <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPlaybackSpeed(1.0)}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  playbackSpeed === 1.0 ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600"
                }`}
              >
                1.0x Normal
              </button>
              <button
                type="button"
                onClick={() => setPlaybackSpeed(0.8)}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  playbackSpeed === 0.8 ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600"
                }`}
              >
                0.8x Lento 🐢
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {selectedPhrase.english}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{selectedPhrase.spanish}</p>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2 text-[11px] text-indigo-700 space-y-1">
            <div className="flex items-center gap-1 font-mono">
              <span className="font-semibold text-indigo-900">Fonética:</span>
              <span>{selectedPhrase.phonetics}</span>
            </div>
            {selectedPhrase.tip && (
              <p className="text-[11px] text-indigo-800">
                💡 <strong>Tip:</strong> {selectedPhrase.tip}
              </p>
            )}
          </div>

          {/* Action buttons: Listen & Record */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  onStop();
                } else {
                  onSpeak(selectedPhrase.english, "en-US", undefined, { rate: playbackSpeed });
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs shadow-xs ${
                isSpeaking
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-600" />
                  <span>Detener Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Escuchar a MIA ({playbackSpeed}x)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs shadow-xs ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Escuchando... (Toca para evaluar)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Grabar mi voz</span>
                </>
              )}
            </button>
          </div>

          {micNotice && (
            <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              ⚠️ {micNotice}
            </div>
          )}
        </div>

        {/* Pronunciation Evaluation Results */}
        {evaluation && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Resultado de Pronunciación</span>
              </span>

              {evaluation.valid && (
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                    evaluation.accuracy >= 85
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : evaluation.accuracy >= 60
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {evaluation.accuracy}% Precisión Acústica
                </span>
              )}
            </div>

            {/* Word by word breakdown chips */}
            {evaluation.wordResults.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-500 block mb-1 font-semibold">
                  Palabra por palabra:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.wordResults.map((w, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 ${
                        w.status === "match"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : w.status === "near"
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-rose-50 text-rose-700 border-rose-300 line-through decoration-rose-400"
                      }`}
                    >
                      {w.status === "match" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {w.status === "near" && <AlertCircle className="w-3 h-3 text-amber-600" />}
                      {w.status === "missing" && <HelpCircle className="w-3 h-3 text-rose-500" />}
                      <span>{w.word}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Spoken transcription feedback */}
            {evaluation.spokenPhrase && (
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px]">
                <span className="text-slate-400 block font-semibold">Lo que escuchamos:</span>
                <p className="text-slate-700 italic">&ldquo;{evaluation.spokenPhrase}&rdquo;</p>
              </div>
            )}

            {/* Feedback & tips */}
            <div className="space-y-1.5 text-xs">
              {evaluation.praise && (
                <p className="font-bold text-slate-900">{evaluation.praise}</p>
              )}
              <p className="text-slate-700">{evaluation.feedback}</p>
              {evaluation.phoneticTip && (
                <div className="bg-blue-50 text-blue-900 p-2 rounded-lg border border-blue-100 text-[11px] font-medium">
                  {evaluation.phoneticTip}
                </div>
              )}
            </div>

            <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
              <span>Evaluación fonológica basada en audio real transcrito</span>
              <button
                type="button"
                onClick={() => {
                  setEvaluation(null);
                  handleStartRecording();
                }}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Intentar de nuevo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
