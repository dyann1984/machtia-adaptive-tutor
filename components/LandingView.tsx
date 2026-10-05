"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Bot,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Brain,
  Layers,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import { TutorRobotAvatar } from "./TutorRobotAvatar";

export function LandingView({ onStartDemo }: { onStartDemo: () => void }) {
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-16 py-6 sm:py-12 max-w-6xl mx-auto">
      {/* Hero Section: Clean, bright, high-end EdTech SaaS */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-14 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-50/60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Columna Izquierda (60%): Identidad, Propuesta y Acciones */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <TutorRobotAvatar size="lg" showGlow priority />
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200/80 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Agente Pedagógico Inteligente</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  MACHT<span className="text-amber-500">IA</span> Adaptive Tutor
                </h1>
              </div>
            </div>

            <p className="text-xl sm:text-2xl font-bold text-blue-700">
              &ldquo;Del diagnóstico a la intervención personalizada.&rdquo;
            </p>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Detecta quién necesita ayuda, genera una práctica adaptada y acompaña al alumno hasta demostrar aprendizaje.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onStartDemo}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                <span>Ver demostración</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={scrollToHowItWorks}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-base px-6 py-4 rounded-2xl border border-slate-200 transition text-center"
              >
                Cómo funciona
              </button>
            </div>

            {/* Badges secundarios técnicos (sutiles para jurado) */}
            <div className="pt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Construido para:</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium border border-slate-200/60">
                Amazon Alexa+ Developer Hackathon
              </span>
              <span className="text-slate-300">•</span>
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium border border-slate-200/60">
                Model Context Protocol (MCP)
              </span>
            </div>
          </div>

          {/* Columna Derecha (40%): Mockup visual del flujo (Detecta -> Adapta -> Acompaña -> Demuestra) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Flujo del Tutor Adaptativo
                </span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  Ciclo continuo
                </span>
              </div>

              {/* Paso 1: Detecta */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Detecta</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Identifica qué alumno requiere refuerzo específico (ej. Mariana 52% en denominadores).
                  </p>
                </div>
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Paso 2: Adapta */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Adapta</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Prescribe 5 ejercicios calibrados con representaciones visuales interactivas.
                  </p>
                </div>
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Paso 3: Acompaña */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Acompaña</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Enseña antes de preguntar y da pistas orientadoras sin regalar respuestas.
                  </p>
                </div>
              </div>

              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Paso 4: Demuestra */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-start gap-3 bg-emerald-50/20">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Demuestra</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Registra evidencia Antes vs. Después a partir de los intentos de la sesión demo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pilares Fundamentales: Profesor • Tutor IA • Alumno • Evidencia */}
      <div ref={howItWorksRef} className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Diseñado para transformar el aula
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Cuatro componentes coordinados para cerrar la brecha entre el diagnóstico y el aprendizaje real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pilar 1: Profesor */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Profesor</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Supervisa su grupo en tiempo real, consulta al tutor en lenguaje natural y prescribe apoyo específico sin tareas manuales repetitivas.
            </p>
          </div>

          {/* Pilar 2: Tutor IA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tutor IA</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ejecuta herramientas pedagógicas autónomas (MCP), analiza causas raíz de error y calibra reactivos visuales con andamiaje progresivo.
            </p>
          </div>

          {/* Pilar 3: Alumno */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Alumno</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aprende en un entorno interactivo y comprensivo donde se le explica visualmente antes de evaluar y recibe pistas formativas si tropieza.
            </p>
          </div>

          {/* Pilar 4: Evidencia */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3 shadow-xs hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Evidencia</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Proporciona una comparativa auditable Antes vs. Después calculada estrictamente con las respuestas auténticas del estudiante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
