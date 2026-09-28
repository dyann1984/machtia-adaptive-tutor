"use client";

import React from "react";
import Image from "next/image";
import { Volume2 } from "lucide-react";

interface TutorRobotAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showGlow?: boolean;
  priority?: boolean;
  isSpeaking?: boolean;
}

const SIZE_MAP = {
  xs: { w: 32, h: 40, class: "w-8 h-10" },
  sm: { w: 42, h: 52, class: "w-11 h-13" },
  md: { w: 56, h: 70, class: "w-14 h-17" },
  lg: { w: 76, h: 94, class: "w-20 h-24" },
  xl: { w: 104, h: 128, class: "w-26 h-32" },
};

export function TutorRobotAvatar({
  size = "md",
  className = "",
  showGlow = false,
  priority = false,
  isSpeaking = false,
}: TutorRobotAvatarProps) {
  const conf = SIZE_MAP[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.class} ${className} ${
        isSpeaking ? "animate-pulse" : ""
      }`}
    >
      {/* Background glow */}
      {(showGlow || isSpeaking) && (
        <div
          className={`absolute inset-0 rounded-full blur-md pointer-events-none transition-all ${
            isSpeaking
              ? "bg-amber-400/40 animate-ping duration-1000"
              : "bg-blue-400/25 animate-pulse"
          }`}
        />
      )}

      {/* Robot Image */}
      <Image
        src="/machtia-tutor-robot.png"
        alt="MACHTIA Tutor IA Robot"
        width={conf.w}
        height={conf.h}
        className={`w-full h-full object-contain filter drop-shadow-xs transition-transform duration-300 ${
          isSpeaking ? "scale-105" : "hover:scale-102"
        }`}
        priority={priority}
      />

      {/* Speaking badge indicator */}
      {isSpeaking && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-slate-950 items-center justify-center shadow-xs">
            <Volume2 className="w-2.5 h-2.5" />
          </span>
        </span>
      )}
    </div>
  );
}
