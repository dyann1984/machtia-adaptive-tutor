"use client";

import React from "react";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";
import { UseSpeechReturn, useSpeech, normalizeOralMathText } from "@/lib/hooks/use-speech";

interface SpeechAudioButtonProps {
  textToSpeak: string;
  label?: string;
  repeatLabel?: string;
  variant?: "primary" | "amber" | "subtle" | "compact";
  speech?: UseSpeechReturn;
  className?: string;
}

export function SpeechAudioButton({
  textToSpeak,
  label = "Escuchar",
  repeatLabel = "Repetir",
  variant = "primary",
  speech: externalSpeech,
  className = "",
}: SpeechAudioButtonProps) {
  const internalSpeech = useSpeech();
  const speech = externalSpeech || internalSpeech;
  const { speak, stop, isSpeaking, activeText, activeRawText } = speech;

  // Accurately determine if THIS button's content is the one currently speaking
  const normalizedTarget = normalizeOralMathText(textToSpeak);
  const isCurrentSpeaking =
    isSpeaking &&
    Boolean(textToSpeak) &&
    (activeRawText === textToSpeak ||
      (activeText !== null && activeText === normalizedTarget) ||
      (activeText !== null &&
        activeText.length > 8 &&
        normalizedTarget.startsWith(activeText.slice(0, 20))));

  const handleToggle = () => {
    if (isCurrentSpeaking) {
      stop();
    } else {
      speak(textToSpeak);
    }
  };

  const handleRepeat = () => {
    stop();
    setTimeout(() => {
      speak(textToSpeak);
    }, 100);
  };

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={handleToggle}
          title={isCurrentSpeaking ? "Detener audio del Tutor" : label}
          aria-label={isCurrentSpeaking ? "Detener audio del Tutor" : label}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs select-none focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${
            isCurrentSpeaking
              ? "bg-amber-500 text-slate-950 animate-pulse border border-amber-600 ring-2 ring-amber-300"
              : "bg-blue-100/90 hover:bg-blue-200 text-blue-900 border border-blue-200"
          }`}
        >
          {isCurrentSpeaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5 shrink-0" />
              <span>Detener</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 shrink-0 text-blue-700" />
              <span>{label}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (variant === "amber") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isCurrentSpeaking ? "Detener voz del Tutor" : label}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-xs select-none focus:outline-hidden focus:ring-2 focus:ring-amber-400 ${
            isCurrentSpeaking
              ? "bg-amber-600 text-white animate-pulse border border-amber-700 ring-2 ring-amber-300"
              : "bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 hover:scale-[1.01]"
          }`}
        >
          {isCurrentSpeaking ? (
            <>
              <VolumeX className="w-4 h-4 shrink-0" />
              <span>■ Detener audio</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 shrink-0 text-slate-950" />
              <span>▶ {label}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleRepeat}
          title="Escuchar de nuevo desde el inicio"
          aria-label="Repetir explicación en voz alta"
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition select-none focus:outline-hidden focus:ring-2 focus:ring-amber-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{repeatLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isCurrentSpeaking ? "Detener voz del Tutor" : label}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-xs select-none focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${
          isCurrentSpeaking
            ? "bg-blue-700 text-white animate-pulse border border-blue-800 ring-2 ring-blue-300"
            : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 hover:scale-[1.01]"
        }`}
      >
        {isCurrentSpeaking ? (
          <>
            <VolumeX className="w-4 h-4 shrink-0" />
            <span>■ Detener voz</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 shrink-0 text-amber-300" />
            <span>▶ {label}</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleRepeat}
        title="Repetir explicación"
        aria-label="Repetir explicación en voz alta"
        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition select-none focus:outline-hidden focus:ring-2 focus:ring-slate-300"
      >
        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
        <span>{repeatLabel}</span>
      </button>
    </div>
  );
}
