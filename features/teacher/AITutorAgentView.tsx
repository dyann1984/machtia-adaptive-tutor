"use client";

import React, { useState } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { TutorRobotAvatar } from "@/components/TutorRobotAvatar";
import {
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
  Terminal,
  User,
  Radio,
} from "lucide-react";
import { AlexaPlusSimulatorModal } from "@/components/AlexaPlusSimulatorModal";

export function AITutorAgentView() {
  const {
    chatMessages,
    sendMessageToTutor,
    handleQuickAction,
    isAgentThinking,
    activeAgentSteps,
    actionLogs,
    mcpStatus,
    checkMcpConnection,
  } = useTutor();

  const [inputQuery, setInputQuery] = useState("");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isCheckingMcp, setIsCheckingMcp] = useState(false);
  const [showAlexaSimulator, setShowAlexaSimulator] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAgentThinking) return;
    const text = inputQuery;
    setInputQuery("");
    await sendMessageToTutor(text);
  };

  const handleManualMcpCheck = async () => {
    setIsCheckingMcp(true);
    await checkMcpConnection();
    setTimeout(() => setIsCheckingMcp(false), 300);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado elegante y espacioso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tutor IA • Asistente Pedagógico
            </h1>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              Profesor Carlos Vega
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Consulta en lenguaje natural el estado de tus alumnos, detecta rezagos y prescribe apoyo adaptativo.
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuickAction("ask_who_needs_support")}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            ¿Quién necesita apoyo?
          </button>
          <button
            onClick={() => handleQuickAction("create_practice_mariana")}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
          >
            Crear práctica para Mariana
          </button>
          <button
            onClick={() => setShowAlexaSimulator(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 transition flex items-center gap-1.5 shadow-2xs"
            title="Abrir Simulador de Dispositivo Amazon Alexa+ (Echo Show)"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span>Simulador Alexa+ (Echo Show)</span>
          </button>
        </div>
      </div>

      {/* NUEVO LAYOUT: Izquierda 65% (Conversación) / Derecha 35% (Actividad del Agente) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* IZQUIERDA 65%: Conversación del profesor con el Tutor IA */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatMessages.map((msg, index) => {
                if (msg.id === "initial-welcome") {
                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-blue-50/70 via-white to-amber-50/30 border border-blue-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                        <TutorRobotAvatar size="lg" showGlow priority />

                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200">
                              Tutor IA • Asistente Pedagógico
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Grupo 3° B • Matemáticas
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 leading-snug">
                            &ldquo;Hola, Profesor Carlos. Ya analicé el grupo 3° B y encontré estudiantes que necesitan apoyo específico en Matemáticas.&rdquo;
                          </h3>

                          <p className="text-sm text-slate-600 leading-relaxed">
                            Detecté rezagos específicos en el tema de <strong>fracciones equivalentes</strong>. Puedes consultarme en cualquier momento o seleccionar una acción rápida:
                          </p>

                          {/* Acciones principales directas */}
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                              onClick={() => handleQuickAction("ask_who_needs_support")}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-xl transition flex items-center gap-2 shadow-xs hover:translate-y-[-1px]"
                            >
                              <span>¿Quién necesita apoyo en matemáticas?</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleQuickAction("inspect_mariana")}
                              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-3 px-4 rounded-xl border border-slate-200 transition shadow-xs"
                            >
                              Ver brecha de Mariana López
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3.5 ${
                      msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    {msg.sender === "user" ? (
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <TutorRobotAvatar size="sm" />
                    )}

                    {/* Burbuja de contenido */}
                    <div
                      className={`max-w-2xl rounded-2xl p-5 space-y-3 ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-50 border border-slate-200/90 text-slate-800"
                      }`}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                        {msg.sender === "user" ? "Profesor Carlos" : "Tutor IA"}
                      </div>

                      <p className="text-sm leading-relaxed whitespace-pre-line font-medium">
                        {msg.text}
                      </p>

                    {/* Si el mensaje del tutor responde a detección grupal de alumnos con dificultad, renderizar tarjetas limpias */}
                    {msg.sender === "agent" &&
                      !msg.text.includes("Diagnóstico Pedagógico MCP") &&
                      (msg.text.includes("rezago en el grupo") ||
                       msg.text.includes("necesitan refuerzo") ||
                       msg.text.includes("estudiantes con rendimiento") ||
                       (msg.text.includes("Mariana") && msg.text.includes("Luis") && msg.text.includes("apoyo"))) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {/* Tarjeta Mariana */}
                          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">Mariana López</span>
                              <span className="text-xs font-black text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                52%
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Matemáticas • Fracciones equivalentes
                            </div>
                            <button
                              onClick={() => handleQuickAction("create_practice_mariana")}
                              className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span>Crear práctica de apoyo</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Tarjeta Luis */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">Luis Hernández</span>
                              <span className="text-xs font-black text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded">
                                58%
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Matemáticas • Simplificación
                            </div>
                            <button
                              onClick={() => handleQuickAction("ask_luis_gap")}
                              className="w-full mt-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg transition text-center"
                            >
                              Ver diagnóstico de Luis
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Botones de acción generados por el agente */}
                    {msg.sender === "agent" && msg.quickActions && msg.quickActions.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {msg.quickActions.map((qa, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleQuickAction(qa.actionKey, qa.payload)}
                            className={`text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-xs ${
                              qa.primary
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <span>{qa.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    ) : msg.sender === "agent" && msg.text.includes("práctica") && msg.text.includes("Mariana") ? (
                      <div className="pt-2">
                        <button
                          onClick={() => handleQuickAction("enter_as_mariana")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-xs"
                        >
                          <span>Entrar como Mariana a resolver práctica</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

              {/* Indicador de pensamiento del agente */}
              {isAgentThinking && (
                <div className="flex items-start gap-3.5">
                  <TutorRobotAvatar size="sm" showGlow />
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-600 flex-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                      <span>Tutor IA razonando y ejecutando herramientas pedagógicas...</span>
                    </div>
                    <div className="space-y-1 pl-4 border-l-2 border-blue-400">
                      {activeAgentSteps.map((step, idx) => (
                        <p key={idx} className="font-mono text-[11px] text-slate-700">
                          {step}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Escribe una pregunta para el Tutor IA (ej. ¿Quién necesita apoyo en matemáticas?)..."
                disabled={isAgentThinking}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAgentThinking}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-xs shrink-0"
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* DERECHA 35%: Actividad del Agente y MCP (Limpio, no técnico invasivo) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Capacidades de la demo */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Actividad del agente
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Determinista
              </span>
            </div>

            {/* Lista pedagógica limpia */}
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Consulta desempeño demo en Matemáticas</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Identifica estudiantes bajo el umbral configurado</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Consulta brechas del diagnóstico demo</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Selecciona reactivos del banco didáctico</span>
              </div>
            </div>
          </div>

          {/* Card 2: MCP Conectado + 7 Herramientas */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-3 h-3 rounded-full ${
                    mcpStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                ></span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {mcpStatus.connected ? "MCP conectado" : "Modo Demo Activo"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {mcpStatus.toolsCount ?? 7} herramientas disponibles
                  </p>
                </div>
              </div>

              <button
                onClick={handleManualMcpCheck}
                title="Comprobar estado de conexión MCP"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingMcp ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>

            {/* Botón pequeño para ver detalles técnicos solo si el jurado lo requiere */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between"
              >
                <span>Detalles técnicos</span>
                {showTechnicalDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Contenido técnico colapsable */}
              {showTechnicalDetails && (
                <div className="mt-3 p-4 bg-slate-950 text-slate-200 rounded-2xl space-y-3 font-mono text-[11px] border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Protocol:</span>
                    <span className="text-cyan-400 font-bold">2025-11-25</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Transport:</span>
                    <span className="text-emerald-400">Streamable HTTP / SSE</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Latency:</span>
                    <span className="text-amber-400">{mcpStatus.latencyMs ?? 5} ms</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-400 block mb-1">Últimas llamadas MCP:</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {actionLogs.slice(-4).map((log) => (
                        <div key={log.id} className="text-[10px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <span className="text-purple-300 font-bold block">{log.toolName}</span>
                          <span className="text-slate-400 block">{log.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlexaPlusSimulatorModal
        isOpen={showAlexaSimulator}
        onClose={() => setShowAlexaSimulator(false)}
      />
    </div>
  );
}
