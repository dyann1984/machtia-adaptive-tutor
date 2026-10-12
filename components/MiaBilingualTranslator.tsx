"use client";

import React, { useState } from "react";
import {
  Languages,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  Copy,
  RotateCcw,
} from "lucide-react";

interface TranslationData {
  originalText: string;
  translatedText: string;
  sourceLang: "es" | "en";
  targetLang: "es" | "en";
  engine: string;
  confidence: number;
  phonetics?: string;
  ttsSignature?: string;
  sourceTtsSignature?: string;
  notes?: string;
}

interface MiaBilingualTranslatorProps {
  onSpeak: (text: string, lang: "es-MX" | "en-US", signature?: string) => void;
  isSpeaking: boolean;
  onStop: () => void;
}

const QUICK_PHRASES = [
  { text: "Hola", label: "Hola 👋" },
  { text: "Good morning", label: "Good morning ☀️" },
  { text: "¿Cuál es tu nombre?", label: "¿Cuál es tu nombre? 👤" },
  { text: "The cat is blue", label: "The cat is blue 🐱" },
  { text: "Explícame las fracciones", label: "Explícame las fracciones 🍕" },
  { text: "Thank you very much", label: "Thank you very much 🙏" },
];

export function MiaBilingualTranslator({ onSpeak, isSpeaking, onStop }: MiaBilingualTranslatorProps) {
  const [inputText, setInputText] = useState("");
  const [direction, setDirection] = useState<"auto" | "es_en" | "en_es">("auto");
  const [result, setResult] = useState<TranslationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate ?? inputText).trim();
    if (!text) return;

    setIsLoading(true);
    setError(null);

    let sourceLang = "auto";
    let targetLang: "es" | "en" | undefined;

    if (direction === "es_en") {
      sourceLang = "es";
      targetLang = "en";
    } else if (direction === "en_es") {
      sourceLang = "en";
      targetLang = "es";
    }

    try {
      let token = "";
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(sessionStorage.getItem("machtia_demo_capability") || "null");
          token = stored?.actorToken || stored?.judgeToken || "";
        } catch {}
      }
      if (!token) token = "machtia-active-session-demo-token-client";

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo completar la traducción.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Error al conectar con el traductor neuronal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    if (direction === "auto") {
      setDirection("en_es");
    } else if (direction === "es_en") {
      setDirection("en_es");
    } else {
      setDirection("es_en");
    }

    if (result) {
      setInputText(result.translatedText);
      setResult({
        ...result,
        originalText: result.translatedText,
        translatedText: result.originalText,
        sourceLang: result.targetLang,
        targetLang: result.sourceLang,
      });
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-xs">
      {/* Header bar / Mode selector */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Languages className="w-4 h-4 text-blue-600" />
          <span>Traductor IA Bilingüe (Español ⇄ Inglés)</span>
        </div>

        {/* Direction toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => setDirection("auto")}
            className={`px-2 py-1 rounded font-medium transition ${
              direction === "auto" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => setDirection("es_en")}
            className={`px-2 py-1 rounded font-medium transition ${
              direction === "es_en" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ES → EN
          </button>
          <button
            type="button"
            onClick={() => setDirection("en_es")}
            className={`px-2 py-1 rounded font-medium transition ${
              direction === "en_es" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            EN → ES
          </button>
          <button
            type="button"
            onClick={handleSwap}
            title="Intercambiar idiomas"
            aria-label="Intercambiar idiomas"
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Quick phrase chips */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Frases sugeridas para practicar:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PHRASES.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(chip.text);
                  void handleTranslate(chip.text);
                }}
                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 text-[11px] px-2 py-1 rounded-full transition shadow-2xs font-medium"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
          <label htmlFor="translator-input" className="sr-only">
            Texto para traducir
          </label>
          <textarea
            id="translator-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleTranslate();
              }
            }}
            placeholder="Escribe una palabra u oración en español o inglés..."
            rows={3}
            maxLength={450}
            className="w-full resize-none text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
            <span>{inputText.length} / 450 caracteres</span>
            <div className="flex items-center gap-1.5">
              {inputText && (
                <button
                  type="button"
                  onClick={() => {
                    setInputText("");
                    setResult(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title="Limpiar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleTranslate()}
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? "Traduciendo..." : "Traducir"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-[11px]">
            ⚠️ {error}
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-3 space-y-3">
            {/* Target Translation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
                  {result.targetLang === "en" ? "🇺🇸 Inglés (Traducción)" : "🇲🇽 Español (Traducción)"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(result.translatedText)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                    title="Copiar texto"
                    aria-label="Copiar traducción"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) {
                        onStop();
                      } else {
                        const targetLangCode = result.targetLang === "en" ? "en-US" : "es-MX";
                        onSpeak(result.translatedText, targetLangCode, result.ttsSignature);
                      }
                    }}
                    className={`p-1 rounded transition flex items-center gap-1 text-[11px] font-semibold px-2 ${
                      isSpeaking
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                    title="Escuchar pronunciación"
                    aria-label="Escuchar pronunciación en voz alta"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-600" />
                        <span>Detener</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Escuchar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {result.translatedText}
              </p>

              {result.phonetics && (
                <div className="mt-1 text-[11px] text-indigo-600 font-mono flex items-center gap-1">
                  <span>Guía fonética:</span>
                  <span className="bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {result.phonetics}
                  </span>
                </div>
              )}
            </div>

            {/* Source Text Verification */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                <span>
                  Texto original ({result.sourceLang === "es" ? "🇲🇽 Español" : "🇺🇸 Inglés"}):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const srcLangCode = result.sourceLang === "en" ? "en-US" : "es-MX";
                    onSpeak(result.originalText, srcLangCode, result.sourceTtsSignature);
                  }}
                  className="hover:text-blue-600 flex items-center gap-1 text-[10px]"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Escuchar original</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 italic">{result.originalText}</p>
            </div>

            {/* Engine transparency badge */}
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                Motor:{" "}
                {result.engine === "google_gtx"
                  ? "Red Neuronal Multilingüe"
                  : result.engine === "mymemory"
                  ? "MyMemory Translation"
                  : "Léxico Curricular MACHTIA"}
              </span>
              <span className="text-emerald-600 font-semibold">● Audio disponible en ambos idiomas</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
