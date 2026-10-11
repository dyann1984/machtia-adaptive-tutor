"use client";

import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { TutorRobotAvatar } from "@/components/TutorRobotAvatar";
import { SpeechAudioButton } from "@/components/SpeechAudioButton";
import { useMiaVoice } from "@/lib/hooks/use-mia-voice";
import { subjectName } from "@/lib/learning/catalog";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Bot,
  Clock,
  CheckCircle2,
  User,
  Award,
  Volume2,
} from "lucide-react";

export function StudentHome({
  onStartPractice,
}: {
  onStartPractice: (practiceId: string) => void;
}) {
  const { practices, selectedStudentId, students, evidences, setActiveStudentTab } = useTutor();
  const speech = useMiaVoice();

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentPractices = practices.filter((p) => p.studentId === student.id);
  const pendingPractice = studentPractices.find((p) => p.status !== "completed");
  const completedPractice = studentPractices.find((p) => p.status === "completed");

  const latestEvidence = evidences.find((e) => e.studentId === student.id);
  const displayScore = latestEvidence ? latestEvidence.finalScore : (student.topicPerformances["fracciones-equivalentes"] ?? 80);
  const displayDelta = latestEvidence ? latestEvidence.improvementDelta : (displayScore - 52);

  const studentFirstName = student.name.split(" ")[0];

  const welcomeNarration = `¡Hola ${studentFirstName}! Hoy preparé una actividad especial para ti. Yo soy tu Tutor de inteligencia artificial y te voy a acompañar paso a paso. Si algo no entiendes, no te preocupes, toca el botón de escuchar y te lo explico con calma.`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* TARJETA DE ACOMPAÑAMIENTO CON EL ROBOT DEL TUTOR IA (ESTILO MAESTRO CÁLIDO) */}
      <div className="bg-gradient-to-r from-blue-50/95 via-white to-amber-50/60 rounded-3xl border border-blue-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <TutorRobotAvatar
            size="xl"
            showGlow
            priority
            isSpeaking={speech.isSpeaking}
          />

          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Tu Tutor Acompañante</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ¡Hola {studentFirstName}! 👋
            </h1>

            {/* Globo de diálogo cálido y breve */}
            <div className="relative bg-white/90 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs text-left">
              <p className="text-base sm:text-lg text-slate-800 font-medium leading-relaxed">
                &ldquo;Hoy preparé una actividad especial para ti. Yo te voy a acompañar paso a paso para aprender juntos. <strong>Si algo no entiendes, toca escuchar y te lo explico.</strong>&rdquo;
              </p>

              {/* Botón de Escuchar con Web Speech API */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <SpeechAudioButton
                  textToSpeak={welcomeNarration}
                  label="Escuchar bienvenida"
                  repeatLabel="Repetir"
                  variant="amber"
                  speech={speech}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETA CENTRAL PROTAGONISTA: Fracciones equivalentes */}
      {pendingPractice ? (
        <div data-subject={pendingPractice.subjectId} className="subject-shell theme-card rounded-3xl border shadow-sm p-5 sm:p-10 space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
                <BookOpen className="w-7 h-7 text-amber-700" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  Práctica Asignada
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {pendingPractice.topicName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <User className="w-4 h-4 text-slate-400" />
              <span>Profesor: <strong className="text-slate-800">Carlos Vega</strong></span>
            </div>
          </div>

          {/* 3 Pills de Metadatos con énfasis en apoyo oral */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Reactivos</span>
              <span className="text-lg font-extrabold text-blue-700">{pendingPractice.exercises.length} ejercicios</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tiempo estimado</span>
              <span className="text-lg font-extrabold text-slate-800">Aprox. {pendingPractice.estimatedMinutes || Math.ceil(pendingPractice.exercises.length * 1.5 + 2)} min</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 text-center space-y-1">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                Voz y Visual
              </span>
              <span className="text-lg font-extrabold text-amber-900">Con audio guiado</span>
            </div>
          </div>

          {/* Botón Grande: Comenzar conmigo */}
          <p className="text-sm text-slate-700"><strong>{subjectName(pendingPractice.subjectId)} · Objetivo:</strong> {pendingPractice.learningObjective || pendingPractice.description}</p>
          <div className="pt-2 space-y-3">
            <button
              onClick={() => {
                speech.stop();
                onStartPractice(pendingPractice.id);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg py-4 px-8 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              <TutorRobotAvatar size="xs" />
              <span>Comenzar conmigo</span>
              <ArrowRight className="w-5 h-5 text-amber-300" />
            </button>

            {/* Mensaje tranquilizador */}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 pt-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Primero veremos una explicación cortita con dibujos y voz.</span>
            </div>
          </div>
        </div>
      ) : completedPractice ? (
        /* Estado cuando ya completó la práctica */
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-8 sm:p-10 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ¡Completado con éxito!
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Has terminado tu práctica de {completedPractice.topicName}
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Obtuviste {displayScore}%. {latestEvidence?.baselineAvailable === false ? "Es tu primera medición de este tema." : `Cambio: ${displayDelta >= 0 ? "+" : ""}${displayDelta} puntos.`} Tu evidencia ya fue registrada para el profesor Carlos.
            </p>
          </div>

          <button
            onClick={() => setActiveStudentTab("progress")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition shadow-xs inline-flex items-center gap-2"
          >
            <span>Ver mi progreso y medallas</span>
            <Award className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Estado inicial sin prácticas creadas aún */
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">
              Esperando práctica del profesor
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              El Prof. Carlos está revisando el diagnóstico del grupo 3° B. En cuanto asigne tu práctica de apoyo adaptativa, aparecerá aquí.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
