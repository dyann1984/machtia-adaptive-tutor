"use client";

import React, { useState, useEffect, useRef } from "react";

export type MiaAvatarEmotion =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "success"
  | "curiosity"
  | "encouraging";

interface MiaLivingAvatarProps {
  emotion?: MiaAvatarEmotion;
  isSpeaking?: boolean;
  isListening?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showHalo?: boolean;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  xs: "w-8 h-8",
  sm: "w-11 h-11",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
  "2xl": "w-44 h-44",
};

export function MiaLivingAvatar({
  emotion = "idle",
  isSpeaking = false,
  isListening = false,
  size = "md",
  className = "",
  showHalo = true,
  onClick,
}: MiaLivingAvatarProps) {
  // 1. Organic natural blinking state
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160); // fast natural blink

      // Next blink in 3.2 to 5.5 seconds
      const nextDelay = 3200 + Math.random() * 2300;
      blinkTimeoutRef.current = setTimeout(triggerBlink, nextDelay);
    };

    const initialDelay = 2000 + Math.random() * 2000;
    blinkTimeoutRef.current = setTimeout(triggerBlink, initialDelay);

    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  // 2. Micro-glance eye gaze direction (idle looking around gently)
  const [gazeOffset, setGazeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (isSpeaking || isListening) {
      setGazeOffset({ x: 0, y: 0 });
      return;
    }
    if (emotion === "thinking") {
      setGazeOffset({ x: 2, y: -3 }); // Look up and right when thinking
      return;
    }

    const interval = setInterval(() => {
      // Subtle gaze shift (-2 to +2 pixels)
      const glances = [
        { x: 0, y: 0 },
        { x: 2, y: -1 },
        { x: -2, y: 0 },
        { x: 0, y: 1 },
      ];
      const randomGlance = glances[Math.floor(Math.random() * glances.length)];
      setGazeOffset(randomGlance);
    }, 4000);

    return () => clearInterval(interval);
  }, [emotion, isSpeaking, isListening]);

  // Resolve active effective emotion
  const activeEmotion: MiaAvatarEmotion = isSpeaking
    ? "speaking"
    : isListening
    ? "listening"
    : emotion;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // Emotional themes (glow colors)
  const haloColor =
    activeEmotion === "speaking"
      ? "bg-amber-400/40 ring-amber-300"
      : activeEmotion === "listening"
      ? "bg-red-500/40 ring-red-400 animate-pulse"
      : activeEmotion === "thinking"
      ? "bg-sky-400/40 ring-sky-300 animate-pulse"
      : activeEmotion === "success"
      ? "bg-emerald-400/45 ring-emerald-300 animate-bounce"
      : activeEmotion === "curiosity"
      ? "bg-indigo-400/40 ring-indigo-300"
      : "bg-blue-400/30 ring-blue-300";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={`MIA Avatar - Estado: ${activeEmotion}`}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClass} ${className} ${
        onClick ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      }`}
    >
      {/* Dynamic ambient halo */}
      {showHalo && (
        <div
          className={`absolute -inset-1.5 rounded-full blur-md transition-all duration-500 pointer-events-none ${haloColor}`}
        />
      )}

      {/* SVG Living Robot Face */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 drop-shadow-md overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Chassis Linear Gradient */}
          <linearGradient id="miaChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Visor Glass Gradient */}
          <linearGradient id="miaVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Eye Glow Cyan Filter */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Eye Glow Amber Filter for Speaking */}
          <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Antenna */}
        <g className="transition-transform duration-300">
          <line x1="50" y1="14" x2="50" y2="6" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
          <circle
            cx="50"
            cy="5"
            r={activeEmotion === "listening" ? "4.5" : "3.5"}
            fill={
              activeEmotion === "listening"
                ? "#EF4444"
                : activeEmotion === "thinking"
                ? "#38BDF8"
                : activeEmotion === "speaking"
                ? "#F59E0B"
                : "#10B981"
            }
            className={activeEmotion === "listening" ? "animate-ping" : ""}
          />
          <circle
            cx="50"
            cy="5"
            r="3.5"
            fill={
              activeEmotion === "listening"
                ? "#EF4444"
                : activeEmotion === "thinking"
                ? "#38BDF8"
                : activeEmotion === "speaking"
                ? "#F59E0B"
                : "#10B981"
            }
          />
        </g>

        {/* 2. Ear Headphone Caps */}
        {/* Left Ear */}
        <rect x="8" y="38" width="7" height="24" rx="3.5" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1" />
        <circle
          cx="11.5"
          cy="50"
          r="2"
          fill={activeEmotion === "listening" ? "#EF4444" : "#38BDF8"}
          className={activeEmotion === "listening" ? "animate-pulse" : ""}
        />
        {/* Right Ear */}
        <rect x="85" y="38" width="7" height="24" rx="3.5" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1" />
        <circle
          cx="88.5"
          cy="50"
          r="2"
          fill={activeEmotion === "listening" ? "#EF4444" : "#38BDF8"}
          className={activeEmotion === "listening" ? "animate-pulse" : ""}
        />

        {/* 3. Outer Robot Chassis Head */}
        <rect
          x="14"
          y="14"
          width="72"
          height="72"
          rx="22"
          fill="url(#miaChassisGrad)"
          stroke="#60A5FA"
          strokeWidth="2"
        />

        {/* 4. Glossy Visor Screen */}
        <rect
          x="20"
          y="22"
          width="60"
          height="56"
          rx="16"
          fill="url(#miaVisorGrad)"
          stroke="#1E293B"
          strokeWidth="1.5"
        />

        {/* Visor Glare Glass Reflection */}
        <path
          d="M 23 25 C 40 25, 60 27, 75 34 C 70 36, 50 33, 23 37 Z"
          fill="#FFFFFF"
          opacity="0.12"
        />

        {/* 5. Animated Eyes with Expressions */}
        <g
          transform={`translate(${gazeOffset.x}, ${gazeOffset.y})`}
          className="transition-transform duration-300"
        >
          {/* SUCCESS / CELEBRATING: Smiling crescent eyes (⌒ ⌒) */}
          {activeEmotion === "success" ? (
            <g stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#cyanGlow)">
              <path d="M 32 46 Q 38 38 44 46" />
              <path d="M 56 46 Q 62 38 68 46" />
            </g>
          ) : isBlinking ? (
            /* BLINKING: Thin closed eye slits */
            <g stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round">
              <line x1="32" y1="46" x2="44" y2="46" />
              <line x1="56" y1="46" x2="68" y2="46" />
            </g>
          ) : activeEmotion === "thinking" ? (
            /* THINKING: Curious gaze up and right with soft spark */
            <g filter="url(#cyanGlow)">
              <circle cx="39" cy="42" r="5" fill="#38BDF8" />
              <circle cx="41" cy="40" r="1.8" fill="#FFFFFF" />
              <circle cx="63" cy="42" r="5" fill="#38BDF8" />
              <circle cx="65" cy="40" r="1.8" fill="#FFFFFF" />
              {/* Thinking spark above visor */}
              <circle cx="73" cy="28" r="2.5" fill="#FDE047" className="animate-ping" />
            </g>
          ) : activeEmotion === "listening" ? (
            /* LISTENING: Wide attentive cyan eyes with outer pulse ring */
            <g filter="url(#cyanGlow)">
              <circle cx="38" cy="46" r="6.5" fill="#06B6D4" />
              <circle cx="36.5" cy="44.5" r="2.2" fill="#FFFFFF" />
              <circle cx="62" cy="46" r="6.5" fill="#06B6D4" />
              <circle cx="60.5" cy="44.5" r="2.2" fill="#FFFFFF" />
            </g>
          ) : activeEmotion === "speaking" ? (
            /* SPEAKING: Warm energetic amber/cyan eyes */
            <g filter="url(#amberGlow)">
              <circle cx="38" cy="45" r="5.5" fill="#F59E0B" />
              <circle cx="36.5" cy="43.5" r="2" fill="#FFFFFF" />
              <circle cx="62" cy="45" r="5.5" fill="#F59E0B" />
              <circle cx="60.5" cy="43.5" r="2" fill="#FFFFFF" />
            </g>
          ) : activeEmotion === "curiosity" ? (
            /* CURIOSITY: Tilted inquisitive eyes */
            <g filter="url(#cyanGlow)">
              <circle cx="38" cy="44" r="6" fill="#38BDF8" />
              <circle cx="36.5" cy="42.5" r="2" fill="#FFFFFF" />
              <circle cx="62" cy="47" r="5" fill="#38BDF8" />
              <circle cx="60.5" cy="45.5" r="1.6" fill="#FFFFFF" />
            </g>
          ) : (
            /* NORMAL IDLE: Friendly glowing round eyes with cute catchlights */
            <g filter="url(#cyanGlow)">
              <circle cx="38" cy="46" r="5.5" fill="#38BDF8" />
              <circle cx="36.5" cy="44.5" r="2" fill="#FFFFFF" />
              <circle cx="62" cy="46" r="5.5" fill="#38BDF8" />
              <circle cx="60.5" cy="44.5" r="2" fill="#FFFFFF" />
            </g>
          )}
        </g>

        {/* 6. Dynamic Holographic Mouth / Soundwave Equalizer */}
        {activeEmotion === "speaking" ? (
          /* Live animated soundwave mouth bars */
          <g fill="#F59E0B" opacity="0.95">
            <rect x="36" y="60" width="3" height="6" rx="1.5" className="animate-[pulse_400ms_ease-in-out_infinite]" />
            <rect x="42" y="58" width="3" height="10" rx="1.5" className="animate-[pulse_300ms_ease-in-out_infinite_100ms]" />
            <rect x="48" y="56" width="4" height="13" rx="2" className="animate-[pulse_250ms_ease-in-out_infinite_50ms]" />
            <rect x="55" y="58" width="3" height="10" rx="1.5" className="animate-[pulse_300ms_ease-in-out_infinite_150ms]" />
            <rect x="61" y="60" width="3" height="6" rx="1.5" className="animate-[pulse_400ms_ease-in-out_infinite_200ms]" />
          </g>
        ) : activeEmotion === "listening" ? (
          /* Attentive radar wave mouth */
          <g stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 42 62 Q 50 66 58 62" />
          </g>
        ) : activeEmotion === "thinking" ? (
          /* Thoughtful wavy digital line */
          <g stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,3" fill="none">
            <line x1="42" y1="63" x2="58" y2="63" />
          </g>
        ) : activeEmotion === "success" ? (
          /* Big joyful open smile */
          <path d="M 40 60 Q 50 70 60 60 Z" fill="#34D399" opacity="0.9" />
        ) : (
          /* Cute friendly soft smile */
          <g stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M 42 61 Q 50 67 58 61" />
          </g>
        )}

        {/* 7. Cute Cheeks (Blush) */}
        {(activeEmotion === "success" || activeEmotion === "encouraging" || activeEmotion === "speaking") && (
          <g fill="#F472B6" opacity="0.35">
            <circle cx="28" cy="53" r="3.5" />
            <circle cx="72" cy="53" r="3.5" />
          </g>
        )}
      </svg>
    </div>
  );
}
