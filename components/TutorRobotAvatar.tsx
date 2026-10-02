"use client";

import React from "react";
import Image from "next/image";
import { Volume2, Sparkles, Lightbulb, PartyPopper, BookOpen, BrainCircuit } from "lucide-react";

export type TutorEmotion = "idle" | "normal" | "thinking" | "speaking" | "explaining" | "success" | "hint" | "celebrating" | "encouraging";

interface TutorRobotAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showGlow?: boolean;
  priority?: boolean;
  isSpeaking?: boolean;
  emotion?: TutorEmotion;
}

const SIZE_MAP = {
  xs: { w: 36, h: 36, class: "w-9 h-9" },
  sm: { w: 48, h: 48, class: "w-12 h-12" },
  md: { w: 64, h: 64, class: "w-16 h-16" },
  lg: { w: 96, h: 96, class: "w-24 h-24" },
  xl: { w: 128, h: 128, class: "w-32 h-32" },
  "2xl": { w: 200, h: 200, class: "w-44 h-44 sm:w-52 sm:h-52" },
};

export function TutorRobotAvatar({
  size = "md",
  className = "",
  showGlow = false,
  priority = false,
  isSpeaking = false,
  emotion = "normal",
}: TutorRobotAvatarProps) {
  const conf = SIZE_MAP[size] || SIZE_MAP.md;

  // Resolve effective emotional state (speaking takes animated priority)
  const effectiveEmotion: TutorEmotion = isSpeaking ? "speaking" : emotion;

  return (
    <div
      data-tutor-state={effectiveEmotion}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.class} ${className} transition-all duration-300 ${
        effectiveEmotion === "speaking"
          ? "motion-safe:animate-pulse motion-safe:scale-105"
          : effectiveEmotion === "thinking"
          ? "motion-safe:scale-102"
          : effectiveEmotion === "explaining"
          ? "motion-safe:scale-103"
          : effectiveEmotion === "success"
          ? "motion-safe:animate-[tutor-success_450ms_ease-out_1] motion-safe:scale-105"
          : effectiveEmotion === "hint"
          ? "motion-safe:animate-pulse"
          : effectiveEmotion === "celebrating"
          ? "motion-safe:animate-[tutor-success_450ms_ease-out_1] motion-safe:scale-110"
          : effectiveEmotion === "encouraging"
          ? "motion-safe:animate-[tutor-success_450ms_ease-out_1]"
          : "motion-safe:hover:scale-102"
      }`}
    >
      {/* Dynamic ambient halo based on emotional state */}
      {(showGlow || effectiveEmotion !== "normal") && (
        <div
          className={`absolute -inset-2 rounded-3xl blur-xl pointer-events-none transition-all duration-500 ${
            effectiveEmotion === "speaking"
              ? "bg-blue-500/40 motion-safe:animate-pulse"
              : effectiveEmotion === "thinking"
              ? "bg-purple-500/35 motion-safe:animate-pulse"
              : effectiveEmotion === "explaining"
              ? "bg-sky-400/35 ring-4 ring-sky-300/40"
              : effectiveEmotion === "success"
              ? "bg-emerald-400/45 ring-4 ring-emerald-300/50"
              : effectiveEmotion === "hint"
              ? "bg-amber-400/45 ring-4 ring-amber-300/50"
              : effectiveEmotion === "celebrating"
              ? "bg-gradient-to-r from-amber-400/50 via-emerald-400/40 to-blue-400/50 motion-safe:animate-pulse"
              : "bg-blue-400/20"
          }`}
        />
      )}

      {/* Official Robot Image Container: Clean rounded aspect-square frame */}
      <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border-2 border-blue-400/40 relative z-10 shadow-lg flex items-center justify-center">
        <Image
          src="/machtia-tutor-official.png"
          alt="MACHTIA Tutor IA Robot Oficial"
          width={conf.w}
          height={conf.h}
          className="w-full h-full object-contain relative z-10 select-none pointer-events-none"
          priority={priority}
        />
      </div>

      {/* Emotional State Badges */}
      {effectiveEmotion === "speaking" && (
        <span className="absolute -top-1 -right-1 z-20 flex h-6 w-6">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-600 text-white items-center justify-center shadow-md ring-2 ring-white">
            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
          </span>
        </span>
      )}

      {effectiveEmotion === "thinking" && (
        <span className="absolute -top-1 -right-1 z-20 flex h-6 w-6">
          <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-600 text-white items-center justify-center shadow-md ring-2 ring-white">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-200" />
          </span>
        </span>
      )}

      {effectiveEmotion === "explaining" && (
        <span className="absolute -top-1 -right-1 z-20 flex h-6 w-6">
          <span className="relative inline-flex rounded-full h-6 w-6 bg-sky-500 text-white items-center justify-center shadow-md ring-2 ring-white">
            <BookOpen className="w-3.5 h-3.5 text-sky-100" />
          </span>
        </span>
      )}

      {effectiveEmotion === "success" && (
        <span className="absolute -top-1 -right-1 z-20 flex h-6 w-6">
          <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 text-white items-center justify-center shadow-md ring-2 ring-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </span>
        </span>
      )}

      {effectiveEmotion === "hint" && (
        <span className="absolute -top-1 -right-1 z-20 flex h-6 w-6">
          <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500 text-slate-950 items-center justify-center shadow-md ring-2 ring-white">
            <Lightbulb className="w-3.5 h-3.5 text-slate-950" />
          </span>
        </span>
      )}

      {effectiveEmotion === "celebrating" && (
        <span className="absolute -top-1 -right-1 z-20 flex h-7 w-7">
          <span className="motion-safe:animate-[tutor-success_450ms_ease-out_1] relative inline-flex rounded-full h-7 w-7 bg-amber-400 text-slate-950 items-center justify-center shadow-md ring-2 ring-white">
            <PartyPopper className="w-4 h-4 text-amber-950" />
          </span>
        </span>
      )}
    </div>
  );
}
