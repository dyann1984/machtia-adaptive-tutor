"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

export interface UseSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  activeText: string | null;
  activeRawText: string | null;
  selectedVoiceName: string | null;
}

import { normalizeOralMathText } from "@/lib/tts/normalization";
export { normalizeOralMathText };

export type AudioInterrupter = () => void;
const activeInterrupters = new Set<AudioInterrupter>();

export function registerGlobalAudioSource(stopFn: AudioInterrupter): () => void {
  activeInterrupters.add(stopFn);
  return () => {
    activeInterrupters.delete(stopFn);
  };
}

export function stopAllGlobalAudio() {
  activeInterrupters.forEach((stopFn) => {
    try {
      stopFn();
    } catch {}
  });
  cancelGlobalSpeech();
}

/**
 * Priority-based Spanish voice finder:
 * 1. es-MX female natural / online voice (e.g. Microsoft Dalia Online Natural es-MX)
 * 2. es-MX female voice
 * 3. Any es-MX voice
 * 4. Any Spanish female voice across any dialect (es-*)
 * 5. Any Spanish voice (es-*)
 * 6. First available voice fallback
 */
export function findPreferredSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  const femaleKeywords = /dalia|camila|paulina|mia|mía|sabina|monica|mónica|hilda|sofia|sofía|lucia|lucía|elena|paloma|conchita|laura|helena|jimena|renata|estrella|valeria|andrea|paola|female|mujer/i;
  const naturalKeywords = /natural|neural|online/i;

  // 1. es-MX female with Natural/Online priority (warmest, most human intonation)
  const esMxNaturalFemale = voices.find((v) => {
    const lang = v.lang.toLowerCase().replace(/_/g, "-");
    return lang === "es-mx" && femaleKeywords.test(v.name) && naturalKeywords.test(v.name);
  });
  if (esMxNaturalFemale) return esMxNaturalFemale;

  // 2. es-MX female voice
  const esMxFemale = voices.find((v) => {
    const lang = v.lang.toLowerCase().replace(/_/g, "-");
    const isEsMx = lang === "es-mx";
    return isEsMx && femaleKeywords.test(v.name);
  });
  if (esMxFemale) return esMxFemale;

  // 3. Any es-MX natural/neural voice
  const esMxNatural = voices.find((v) => {
    const lang = v.lang.toLowerCase().replace(/_/g, "-");
    return lang === "es-mx" && naturalKeywords.test(v.name);
  });
  if (esMxNatural) return esMxNatural;

  // 4. Any es-MX voice
  const esMxAny = voices.find((v) => {
    const lang = v.lang.toLowerCase().replace(/_/g, "-");
    return lang === "es-mx";
  });
  if (esMxAny) return esMxAny;

  // 5. Any Spanish female voice (es-*)
  const esFemaleAny = voices.find((v) => {
    const lang = v.lang.toLowerCase().replace(/_/g, "-");
    const isEs = lang.startsWith("es");
    return isEs && femaleKeywords.test(v.name);
  });
  if (esFemaleAny) return esFemaleAny;

  // 6. Any Spanish voice
  const esAny = voices.find((v) => v.lang.toLowerCase().startsWith("es"));
  if (esAny) return esAny;

  // 7. Fallback default
  return voices[0];
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
  const [activeRawText, setActiveRawText] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Initialize speech support and listen to async voice loading
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
    ) {
      setIsSupported(true);

      const updateVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        voicesRef.current = vList;
        const best = findPreferredSpanishVoice(vList);
        if (best) {
          setSelectedVoiceName(best.name);
        }
      };

      updateVoices();

      if ("onvoiceschanged" in window.speechSynthesis) {
        window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
      }

      return () => {
        if ("onvoiceschanged" in window.speechSynthesis) {
          window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
        }
      };
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
    setActiveRawText(null);
  }, []);

  // Register with global audio registry so all audio sources coordinate
  useEffect(() => {
    return registerGlobalAudioSource(stop);
  }, [stop]);

  const speak = useCallback(
    (rawText: string) => {
      // Graceful fallback if Web Speech API is not supported in the environment
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window) ||
        !rawText.trim()
      ) {
        return;
      }

      // Stop any ongoing speech across the entire app immediately
      stopAllGlobalAudio();

      try {
        // Resume synthesis if browser suspended it (Chromium autoplay policy)
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const cleanText = normalizeOralMathText(rawText);
        if (!cleanText) return;

        // Small timeout ensures speechSynthesis buffer is totally clear (prevents overlapping voices on rapid clicks)
        playTimeoutRef.current = setTimeout(() => {
          try {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = "es-MX";
            utterance.rate = 0.92; // Calm, clear tempo for primary school learners
            utterance.pitch = 1.05; // Warm, friendly tone

            // Fetch latest voices
            const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
            const preferredVoice = findPreferredSpanishVoice(voices);

            if (preferredVoice) {
              utterance.voice = preferredVoice;
              setSelectedVoiceName(preferredVoice.name);
            }

            utterance.onstart = () => {
              setIsSpeaking(true);
              setActiveText(cleanText);
              setActiveRawText(rawText);
            };

            utterance.onend = () => {
              setIsSpeaking(false);
              setActiveText(null);
              setActiveRawText(null);
            };

            utterance.onerror = (e) => {
              // Ignore synthetic cancellations (error === 'canceled' or 'interrupted')
              if (e.error !== "canceled" && e.error !== "interrupted") {
                console.warn("SpeechSynthesis error:", e.error);
              }
              setIsSpeaking(false);
              setActiveText(null);
              setActiveRawText(null);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
          } catch (innerErr) {
            console.warn("SpeechSynthesis playback skipped:", innerErr);
            setIsSpeaking(false);
            setActiveText(null);
            setActiveRawText(null);
          }
        }, 40);
      } catch (err) {
        console.warn("SpeechSynthesis error:", err);
        setIsSpeaking(false);
        setActiveText(null);
        setActiveRawText(null);
      }
    },
    []
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

  return useMemo(
    () => ({
      speak,
      stop,
      isSpeaking,
      isSupported,
      activeText,
      activeRawText,
      selectedVoiceName,
    }),
    [speak, stop, isSpeaking, isSupported, activeText, activeRawText, selectedVoiceName]
  );
}
