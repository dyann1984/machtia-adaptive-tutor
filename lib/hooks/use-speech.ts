"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  activeText: string | null;
}

/**
 * Cancels any active speech synthesis globally.
 * Safe to invoke anywhere on the client.
 */
export function cancelGlobalSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // safe fallback
    }
  }
}

export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [activeText, setActiveText] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
    ) {
      setIsSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (utteranceRef.current) {
          utteranceRef.current.onstart = null;
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
          utteranceRef.current = null;
        }
        window.speechSynthesis.cancel();
      } catch (e) {
        // safe ignore
      }
    }
    setIsSpeaking(false);
    setActiveText(null);
  }, []);

  const speak = useCallback(
    (rawText: string) => {
      // Graceful fallback if Web Speech API is not supported in the environment
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
      ) {
        return;
      }

      // Stop and cancel any existing audio or queued playbacks immediately
      stop();

      try {
        // Clean special characters and phonetically normalize mathematical fractions
        const cleanText = rawText
          .replace(/[*_#`~>]/g, "")
          .replace(/\b1\/2\b/g, "un medio")
          .replace(/\b2\/4\b/g, "dos cuartos")
          .replace(/\b1\/3\b/g, "un tercio")
          .replace(/\b2\/6\b/g, "dos sextos")
          .replace(/\b1\/4\b/g, "un cuarto")
          .replace(/\b3\/6\b/g, "tres sextos")
          .replace(/\b4\/6\b/g, "cuatro sextos")
          .replace(/\b2\/5\b/g, "dos quintos")
          .replace(/\b4\/10\b/g, "cuatro décimos")
          .replace(/\b3\/4\b/g, "tres cuartos")
          .replace(/\b6\/8\b/g, "seis octavos")
          .replace(/\b3\/3\b/g, "tres tercios")
          .replace(/\s+/g, " ")
          .trim();

        // Small timeout ensures speechSynthesis buffer is totally clear (prevents overlapping voices on rapid clicks)
        playTimeoutRef.current = setTimeout(() => {
          try {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = "es-MX";
            utterance.rate = 0.92; // Calm, clear tempo for primary school learners
            utterance.pitch = 1.05; // Warm, friendly tone

            // Select natural Spanish voice if available in the browser
            const voices = window.speechSynthesis.getVoices();
            const spanishVoice =
              voices.find(
                (v) =>
                  v.lang.toLowerCase().startsWith("es-mx") ||
                  v.lang.toLowerCase().startsWith("es_mx")
              ) ||
              voices.find((v) => v.lang.toLowerCase().startsWith("es")) ||
              voices[0];

            if (spanishVoice) {
              utterance.voice = spanishVoice;
            }

            utterance.onstart = () => {
              setIsSpeaking(true);
              setActiveText(cleanText);
            };

            utterance.onend = () => {
              setIsSpeaking(false);
              setActiveText(null);
            };

            utterance.onerror = () => {
              setIsSpeaking(false);
              setActiveText(null);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
          } catch (innerErr) {
            console.warn("SpeechSynthesis playback skipped:", innerErr);
            setIsSpeaking(false);
            setActiveText(null);
          }
        }, 50);
      } catch (err) {
        console.warn("SpeechSynthesis error:", err);
        setIsSpeaking(false);
        setActiveText(null);
      }
    },
    [stop]
  );

  // Stop speech if page is hidden, blurred, or unmounted
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      stop();
    };
  }, [stop]);

  return { speak, stop, isSpeaking, isSupported, activeText };
}
