"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { findPreferredSpanishVoice, cancelGlobalSpeech, stopAllGlobalAudio, registerGlobalAudioSource } from "./use-speech";
import { normalizeOralMathText } from "@/lib/tts/normalization";

export interface UseMiaVoiceReturn {
  speak: (text: string, signature?: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  isSupported: boolean;
  activeText: string | null;
  activeRawText: string | null;
  voiceSource: "elevenlabs" | "webspeech" | null;
}

export function useMiaVoice(): UseMiaVoiceReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [activeText, setActiveText] = useState<string | null>(null);
  const [activeRawText, setActiveRawText] = useState<string | null>(null);
  const [voiceSource, setVoiceSource] = useState<"elevenlabs" | "webspeech" | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * Complete teardown and cancellation of all active audio sources:
   * HTMLAudioElement (ElevenLabs MP3) AND Web Speech API synthesis.
   */
  const stop = useCallback(() => {
    // 1. Abort in-flight network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Stop HTML5 Audio Element
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onplay = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      } catch {
        // safe ignore
      }
      audioRef.current = null;
    }

    // 3. Revoke Blob Object URL to prevent memory leaks
    if (blobUrlRef.current) {
      try {
        URL.revokeObjectURL(blobUrlRef.current);
      } catch {
        // safe ignore
      }
      blobUrlRef.current = null;
    }

    // 4. Cancel Web Speech API utterance
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    cancelGlobalSpeech();

    setIsSpeaking(false);
    setIsLoading(false);
    setActiveText(null);
    setActiveRawText(null);
    setVoiceSource(null);
  }, []);

  // Register with global audio registry so all audio sources coordinate across the application
  useEffect(() => {
    return registerGlobalAudioSource(stop);
  }, [stop]);

  /**
   * Fallback synthesis using local browser Web Speech API.
   */
  const speakWebSpeech = useCallback(
    (rawText: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        stop();
        return;
      }

      try {
        // Chromium autoplay policy resume
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const cleanText = normalizeOralMathText(rawText);
        if (!cleanText) {
          stop();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "es-MX";
        utterance.rate = 0.92;
        utterance.pitch = 1.05;

        const voices = window.speechSynthesis.getVoices();
        const preferred = findPreferredSpanishVoice(voices);
        if (preferred) {
          utterance.voice = preferred;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsLoading(false);
          setActiveText(cleanText);
          setActiveRawText(rawText);
          setVoiceSource("webspeech");
        };

        utterance.onend = () => {
          stop();
        };

        utterance.onerror = (e) => {
          if (e.error !== "canceled" && e.error !== "interrupted") {
            console.warn("[useMiaVoice] WebSpeech error:", e.error);
          }
          stop();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[useMiaVoice] WebSpeech execution failed:", err);
        stop();
      }
    },
    [stop]
  );

  /**
   * Main speak function:
   * Tries ElevenLabs via /api/tts with session auth.
   * If unconfigured, quota-limited, or failed, falls back seamlessly to Web Speech.
   */
  const speak = useCallback(
    async (rawText: string, signature?: string) => {
      const trimmed = (rawText || "").trim();
      if (!trimmed) return;

      // Stop any ongoing speech across the entire app immediately before starting new phrase
      stopAllGlobalAudio();

      setIsLoading(true);
      setActiveRawText(trimmed);

      // Retrieve current session token from sessionStorage if present
      let token = "";
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(sessionStorage.getItem("machtia_demo_capability") || "null");
          token = stored?.actorToken || stored?.judgeToken || "";
        } catch {
          // ignore parsing error
        }
      }

      // If no token in sessionStorage, use standard demo actor capability header
      if (!token) {
        token = "machtia-active-session-demo-token-client";
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: trimmed, signature }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const contentType = response.headers.get("content-type") || "";
        const fallbackHeader = response.headers.get("X-TTS-Fallback");

        // If server signals fallback or returned JSON instead of audio
        if (fallbackHeader === "true" || contentType.includes("application/json") || !response.ok) {
          speakWebSpeech(trimmed);
          return;
        }

        // Server returned MP3 audio
        const blob = await response.blob();
        if (controller.signal.aborted) return;

        const audioUrl = URL.createObjectURL(blob);
        blobUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setIsLoading(false);
          setActiveText(normalizeOralMathText(trimmed));
          setVoiceSource("elevenlabs");
        };

        audio.onended = () => {
          stop();
        };

        audio.onerror = () => {
          console.warn("[useMiaVoice] HTMLAudioElement playback error. Falling back to Web Speech.");
          stop();
          speakWebSpeech(trimmed);
        };

        // Attempt playback (respecting browser autoplay policies)
        try {
          await audio.play();
        } catch (playErr: any) {
          if (playErr?.name === "NotAllowedError") {
            console.warn("[useMiaVoice] Autoplay blocked by browser policy. Interaction required.");
            stop();
          } else {
            console.warn("[useMiaVoice] Audio play error:", playErr);
            stop();
            speakWebSpeech(trimmed);
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // Request was deliberately canceled
          return;
        }
        console.warn("[useMiaVoice] /api/tts request failed. Falling back to Web Speech:", err);
        speakWebSpeech(trimmed);
      }
    },
    [stop, speakWebSpeech]
  );

  // Stop speech if page is hidden, tab switched, or unmounted
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
      isLoading,
      isSupported,
      activeText,
      activeRawText,
      voiceSource,
    }),
    [speak, stop, isSpeaking, isLoading, isSupported, activeText, activeRawText, voiceSource]
  );
}
