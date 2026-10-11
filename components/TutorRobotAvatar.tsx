"use client";

import React from "react";
import { MiaLivingAvatar, MiaAvatarEmotion } from "./MiaLivingAvatar";

export type TutorEmotion =
  | "idle"
  | "normal"
  | "thinking"
  | "speaking"
  | "explaining"
  | "success"
  | "hint"
  | "celebrating"
  | "encouraging"
  | "curiosity"
  | "listening";

interface TutorRobotAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showGlow?: boolean;
  priority?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  emotion?: TutorEmotion;
  onClick?: () => void;
}

export function TutorRobotAvatar({
  size = "md",
  className = "",
  showGlow = false,
  isSpeaking = false,
  isListening = false,
  emotion = "normal",
  onClick,
}: TutorRobotAvatarProps) {
  // Map legacy tutor emotions to living avatar state
  let avatarEmotion: MiaAvatarEmotion = "idle";
  if (emotion === "thinking") avatarEmotion = "thinking";
  else if (emotion === "speaking" || emotion === "explaining" || isSpeaking) avatarEmotion = "speaking";
  else if (emotion === "success" || emotion === "celebrating") avatarEmotion = "success";
  else if (emotion === "hint" || emotion === "encouraging" || emotion === "curiosity") avatarEmotion = "curiosity";
  else if (emotion === "listening" || isListening) avatarEmotion = "listening";

  return (
    <MiaLivingAvatar
      size={size}
      emotion={avatarEmotion}
      isSpeaking={isSpeaking || emotion === "speaking" || emotion === "explaining"}
      isListening={isListening || emotion === "listening"}
      showHalo={showGlow || emotion !== "normal" && emotion !== "idle"}
      className={className}
      onClick={onClick}
    />
  );
}
