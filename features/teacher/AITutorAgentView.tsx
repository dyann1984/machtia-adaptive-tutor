"use client";

import React, { useState } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import {
  Bot,
  Send,
  Sparkles,
  Terminal,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  RefreshCw,
  Radio,
  ExternalLink,
} from "lucide-react";

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
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [isCheckingMcp, setIsCheckingMcp] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAgentThinking) return;
    const text = inputQuery;
    setInputQuery("");
    await sendMessageToTutor(text);
  };

  const toggleExpand = (id: string) => {
    setExpandedActionId(expandedActionId === id ? null : id);
  };

  const handleManualMcpCheck = async () => {
    setIsCheckingMcp(true);
    await checkMcpConnection();
    setTimeout(() => setIsCheckingMcp(false), 300);
  };

  const renderStepBadge = (stepText: string) => {
    if (stepText.includes(" | ")) {
      const [type, ...rest] = stepText.split(" | ");
      const text = rest.join(" | ");

      let badgeClasses = "bg-slate-700 text-slate-200 border-slate-600";
      if (type === "AGENT") badgeClasses = "bg-purple-900/60 text-purple-200 border-purple-600/60";
      if (type === "MCP") badgeClasses = "bg-cyan-900/60 text-cyan-200 border-cyan-600/60";
      if (type === "TOOL") badgeClasses = "bg-amber-900/60 text-amber-200 border-amber-600/60";
      if (type === "RESULT") badgeClasses = "bg-emerald-900/60 text-emerald-200 border-emerald-600/60";

      return (
        <div className="flex items-start gap-2 text-[11px] leading-tight">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${badgeClasses}`}>
            {type}
          </span>
          <span className="text-slate-200 pt-0.5">{text}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-emerald-300 text-[11px]">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{stepText}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Agent Header / MCP Status / Alexa+ Simulation Indicator */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-blue-900/70 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/80 border border-blue-400/50 flex items-center justify-center shadow-lg relative">
              <Bot className="w-7 h-7 text-amber-300" />
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                mcpStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}></span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">
                  Agente Orquestador MACHTIA
                </h1>
                {/* Alexa+ Discreet Experience Indicator */}
                <span className="text-[10px] font-semibold bg-violet-500/20 text-violet-200 px-2.5 py-0.5 rounded-full border border-violet-400/40 flex items-center gap-1 shadow-sm">
                  <Radio className="w-3 h-3 text-violet-300 animate-pulse" />
                  Alexa+ Experience Simulation
                </span>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded border border-cyan-400/30">
                  MCP 2025-11-25
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Actividad del agente • Ejecución de herramientas pedagógicas • Detección y prescripción curricular
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live MCP Status Pill with Connection Ping */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition ${
                mcpStatus.connected
                  ? "bg-emerald-950/80 border-emerald-700/60 text-emerald-300"
                  : "bg-amber-950/80 border-amber-700/60 text-amber-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  mcpStatus.connected ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                }`}
              ></span>
              <span className="font-bold">
                {mcpStatus.connected ? "MCP: Connected" : "MCP: Offline"}
              </span>
              <span className="text-[10px] opacity-75 font-mono">
                {mcpStatus.connected ? `(${mcpStatus.latencyMs}ms)` : "(Modo Demo activo)"}
              </span>
              <button
                onClick={handleManualMcpCheck}
                title="Verificar conexión con el servidor MCP"
                className="hover:text-white p-0.5 rounded transition"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingMcp ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-mono">Transport:</span>
              <span className="font-semibold text-cyan-300">Streamable HTTP</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Prompts */}
        <div className="mt-5 pt-4 border-t border-blue-900/60 flex flex-wrap items-center gap-2">
          <span className="text-xs text-blue-200 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Flujo clave Amazon / Alexa+:
          </span>
          <button
            onClick={() => handleQuickAction("ask_who_needs_support")}
            className="text-xs bg-blue-700/80 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg border border-blue-500/40 transition shadow-sm"
          >
            1. ¿Quién necesita apoyo en matemáticas?
          </button>
          <button
            onClick={() => handleQuickAction("inspect_mariana")}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-100 font-medium px-3 py-1.5 rounded-lg border border-slate-600 transition"
          >
            2. Ver brecha de Mariana López
          </button>
          <button
            onClick={() => handleQuickAction("generate_practice", { studentId: "mariana-lopez" })}
            className="text-xs bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg border border-amber-400 transition shadow-sm"
          >
            3. Crear práctica de apoyo (5 reactivos)
          </button>
          <button
            onClick={() => handleQuickAction("ask_mariana_improvement")}
            className="text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg border border-emerald-400/40 transition"
          >
            4. ¿Mariana mejoró? (Antes/Después)
          </button>
        </div>
      </div>

      {/* Main Grid: Chat / Telemetry split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Agent Conversation */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Conversation Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {chatMessages.map((msg) => {
              const isAgent = msg.sender === "agent";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isAgent ? "items-start" : "items-end justify-end"}`}
                >
                  {isAgent && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-5 h-5 text-amber-300" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-3 ${isAgent ? "text-slate-800" : "text-right"}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isAgent
                          ? "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm"
                          : "bg-blue-600 text-white rounded-br-sm ml-auto text-left"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>

                    {/* Agent tool execution card embedded in message */}
                    {isAgent && msg.agentActions && msg.agentActions.length > 0 && (
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs font-mono space-y-2 text-slate-200">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span className="flex items-center gap-1.5 font-sans font-semibold text-emerald-400">
                            <Terminal className="w-3.5 h-3.5" />
                            Herramientas MCP ejecutadas ({msg.agentActions.length})
                          </span>
                          <span className="text-[10px] text-cyan-300">MCP Streamable HTTP 2025-11-25</span>
                        </div>
                        <div className="space-y-1.5 pt-0.5">
                          {msg.agentActions.map((act) => (
                            <div
                              key={act.id}
                              className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700/60"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`px-1 py-0.5 text-[9px] font-bold rounded ${
                                  act.source === "mcp"
                                    ? "bg-cyan-900 text-cyan-300 border border-cyan-700"
                                    : "bg-amber-900 text-amber-300 border border-amber-700"
                                }`}>
                                  {act.source === "mcp" ? "MCP" : "DEMO"}
                                </span>
                                <span className="font-bold text-amber-300">{act.toolName}()</span>
                                <span className="text-slate-300 font-sans text-[11px] truncate max-w-xs">
                                  — {act.displayName}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{act.durationMs}ms</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick action buttons */}
                    {isAgent && msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.quickActions.map((qa, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickAction(qa.actionKey, qa.payload)}
                            className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 font-medium shadow-sm ${
                              qa.primary
                                ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                            }`}
                          >
                            <span>{qa.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isAgent && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 mb-0.5 font-bold text-xs">
                      T
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Agent Execution Card with AGENT / MCP / TOOL / RESULT badges */}
            {isAgentThinking && (
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 animate-pulse">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div className="bg-slate-900 text-white rounded-2xl rounded-tl-sm p-4 border border-blue-500/40 shadow-lg max-w-[85%] space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-[13px] font-sans">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    Actividad del agente • Ejecutando herramientas MCP...
                  </div>
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    {activeAgentSteps.map((step, idx) => (
                      <div key={idx}>
                        {renderStepBadge(step)}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-blue-300 text-[11px] animate-pulse pt-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Procesando ciclo adaptativo con Streamable HTTP...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Pregunta al Tutor (ej. ¿Quién necesita apoyo en matemáticas?)..."
              disabled={isAgentThinking}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isAgentThinking || !inputQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition shadow-sm"
            >
              <span>Enviar</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Agent Activity & Tool Execution with AGENT / MCP / TOOL / RESULT structure */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-[650px] overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Actividad del agente • MCP
                </h2>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                mcpStatus.connected
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : "bg-amber-950 text-amber-400 border-amber-800"
              }`}>
                {mcpStatus.connected ? "MCP: CONNECTED" : "MCP: OFFLINE (DEMO)"}
              </span>
            </div>

            {/* Ver detalles técnicos Toggle Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition flex items-center gap-1.5 ${
                  showTechnicalDetails
                    ? "bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
                }`}
              >
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>{showTechnicalDetails ? "Ocultar detalles técnicos" : "Ver detalles técnicos"}</span>
              </button>

              <span className="text-[10px] text-slate-400 font-sans">
                {showTechnicalDetails ? "Vista avanzada" : "Vista no técnica"}
              </span>
            </div>
          </div>

          {/* Technical Health details panel (only in technical mode) */}
          {showTechnicalDetails && (
            <div className="bg-slate-950/90 rounded-xl p-3 border border-cyan-900/60 text-xs font-mono space-y-1.5 mb-3 shrink-0">
              <div className="flex items-center justify-between text-cyan-400 font-bold text-[11px] pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Salud y Protocolo MCP (/health)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {mcpStatus.connected ? "STATUS: 200 OK" : "MODO DEMO ACTIVO"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 pt-0.5">
                <div>Protocolo: <span className="text-cyan-300 font-bold">{mcpStatus.protocolVersion || "2025-11-25"}</span></div>
                <div>Transporte: <span className="text-cyan-300 font-bold">{mcpStatus.transport || "Streamable HTTP"}</span></div>
                <div>Tools registradas: <span className="text-amber-300 font-bold">{mcpStatus.toolsCount ?? 7} herramientas</span></div>
                <div>Latencia: <span className="text-emerald-300 font-bold">{mcpStatus.latencyMs ?? 5}ms</span></div>
                <div>Endpoint: <span className="text-slate-400">POST /mcp</span></div>
                <div>Health Check: <span className="text-slate-400">GET /health</span></div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {actionLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No hay ejecuciones recientes. Consulta al tutor para ver las llamadas a herramientas en tiempo real.
              </div>
            ) : (
              actionLogs.map((log) => {
                const isExpanded = showTechnicalDetails || expandedActionId === log.id;
                const isMcpSource = log.source === "mcp";

                return (
                  <div
                    key={log.id}
                    className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-3 text-xs space-y-2 transition hover:border-slate-600"
                  >
                    <div
                      onClick={() => toggleExpand(log.id)}
                      className="flex items-start justify-between cursor-pointer gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-900/60 text-amber-200 border border-amber-600/60">
                            TOOL
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                            isMcpSource
                              ? "bg-cyan-900/60 text-cyan-200 border-cyan-600/60"
                              : "bg-slate-800 text-slate-300 border-slate-600"
                          }`}>
                            {isMcpSource ? "MCP 2025-11-25" : "FALLBACK"}
                          </span>
                          <span className="font-mono font-bold text-amber-300 text-[11px]">
                            {log.toolName}
                          </span>
                        </div>
                        <p className="text-slate-200 font-sans text-[11px] leading-tight font-medium">
                          {log.displayName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-slate-400">
                        <span className="text-[10px] font-mono">{log.durationMs}ms</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans">{log.description}</p>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-700/80 space-y-2 font-mono text-[10px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                          <span>Endpoint: {isMcpSource ? "POST /mcp" : "local-fallback"}</span>
                          <span>Protocolo: {log.mcpProtocol || "2025-11-25"}</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="font-semibold text-[9px] uppercase flex items-center gap-1 text-cyan-400">
                              <span className="px-1 py-0.2 bg-cyan-900/60 rounded text-[8px]">INPUT</span>
                              Parámetros:
                            </span>
                          </div>
                          <pre className="bg-slate-950 p-2 rounded text-cyan-300 overflow-x-auto text-[10px]">
                            {JSON.stringify(log.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="font-semibold text-[9px] uppercase flex items-center gap-1 text-emerald-400">
                              <span className="px-1 py-0.2 bg-emerald-900/60 rounded text-[8px]">RESULT</span>
                              Resultado estructurado:
                            </span>
                          </div>
                          <pre className="bg-slate-950 p-2 rounded text-emerald-300 overflow-x-auto text-[10px]">
                            {JSON.stringify(log.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
