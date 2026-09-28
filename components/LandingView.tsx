"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Bot,
  Layers,
  Award,
  CheckCircle2,
  Cpu,
  BarChart3,
  HelpCircle,
  BookOpen,
} from "lucide-react";

export function LandingView({ onStartDemo }: { onStartDemo: () => void }) {
  return (
    <div className="space-y-12 py-4 sm:py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-blue-900/60 text-center max-w-5xl mx-auto">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 translate-y-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          {/* Discreet badges without unofficial logos */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-xs font-semibold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Built for Amazon Alexa+ Developer Hackathon
            </span>
            <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-400/30 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Powered by Model Context Protocol
            </span>
          </div>

          {/* Logo & Main Title */}
          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 p-1 shadow-xl flex items-center justify-center border border-blue-300/40">
              <Image
                src="/machtia-logo.jpg"
                alt="MACHTIA Logo"
                width={60}
                height={60}
                className="object-cover w-full h-full rounded-xl"
                priority
              />
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans">
                MACHT<span className="text-amber-400">IA</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-300">
                  Adaptive Tutor
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-300">
                Agente Tutor Educativo Inteligente
              </p>
            </div>
          </div>

          {/* Tagline & Subtext strictly required */}
          <div className="space-y-3 pt-2">
            <p className="text-lg sm:text-2xl font-bold text-white leading-snug">
              &ldquo;Detecta quién necesita ayuda, crea la práctica adecuada y acompaña al alumno hasta comprobar si aprendió.&rdquo;
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Un agente educativo que transforma evidencia de desempeño en apoyo personalizado para cada estudiante.
            </p>
          </div>

          {/* Main CTA Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartDemo}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 border border-blue-400/40 hover:scale-[1.02] active:scale-[0.99]"
            >
              <span>Iniciar demostración</span>
              <ArrowRight className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </div>
      </div>

      {/* 5-Step Pedagogical Loop Card */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Flujo Pedagógico Completo
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Cómo el Agente Transforma la Evidencia en Aprendizaje Real
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Sin respuestas directas automáticas: un ciclo de andamiaje cognitivo basado en herramientas MCP.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Detección</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El profesor consulta al agente y detecta quién tiene rezago y en qué materia específica.
            </p>
            <div className="text-[10px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
              find_students_needing_support
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Prescripción</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Genera una práctica adaptativa dirigida a la brecha conceptual del alumno.
            </p>
            <div className="text-[10px] font-mono text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
              generate_adaptive_practice
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Tutor Enseña</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El tutor explica con barras visuales antes del primer ejercicio para construir comprensión.
            </p>
            <div className="text-[10px] font-mono text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
              FractionBarVisualizer
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Pistas y Apoyo</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si hay error: pista sin respuesta; si persiste: explicación con ejemplo cotidiano.
            </p>
            <div className="text-[10px] font-mono text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
              evaluate_answer & adapt
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              5
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Evidencia</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calcula resultado real y entrega comparativa Antes (52%) vs Después (80%) al profesor.
            </p>
            <div className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
              report_progress_to_teacher
            </div>
          </div>
        </div>

        {/* Demo Fast Start Button */}
        <div className="pt-4 text-center">
          <button
            onClick={onStartDemo}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md"
          >
            <span>Iniciar demostración guiada del jurado</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
