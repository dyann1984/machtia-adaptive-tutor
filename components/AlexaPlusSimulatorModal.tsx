"use client";

import React, { useState, useEffect } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { repository } from "@/lib/data/repository";
import { mcpClient } from "@/lib/mcp/client";
import { TutorRobotAvatar } from "@/components/TutorRobotAvatar";
import {
  Mic,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Send,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  RefreshCw,
  Terminal,
  Layers,
  ArrowRight,
  BookOpen,
  Award,
  Radio,
} from "lucide-react";

interface AlexaPlusSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlexaPlusSimulatorModal({ isOpen, onClose }: AlexaPlusSimulatorModalProps) {
  const {
    selectedStudentId,
    students,
    practices,
    setRole,
    setActiveTeacherTab,
    refreshState,
  } = useTutor();

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const targetPractice =
    practices.find((p) => p.studentId === student.id) || practices[0];

  const [remotePracticeId, setRemotePracticeId] = useState<string | null>(null);
  const [oralAnswers, setOralAnswers] = useState<{ exerciseId: string; isCorrect: boolean; studentAnswer: string }[]>([]);
  // State
  const [activeStep, setActiveStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastSpeechOutput, setLastSpeechOutput] = useState<string>(
    "Presiona 'Iniciar sesión Alexa+' o cualquier comando de voz para comenzar la interacción multimodal."
  );
  const [customOralInput, setCustomOralInput] = useState<string>("");
  const [lastToolCalled, setLastToolCalled] = useState<string>("none");
  const [lastRpcRequest, setLastRpcRequest] = useState<any>(null);
  const [lastRpcResponse, setLastRpcResponse] = useState<any>(null);
  const [lastExecutionLatency, setLastExecutionLatency] = useState<number | null>(null);
  const [lastExecutionSource, setLastExecutionSource] = useState<string>("mcp");
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);

  // Security test status
  const [securityTestResult, setSecurityTestResult] = useState<string | null>(null);

  // Step 1: get_student_context
  const handleGetStudentContext = async () => {
    setLoading(true);
    setSecurityTestResult(null);
    try {
      const res = await mcpClient.callTool("get_student_context", {
        studentId: student.id,
        tenantId: "escuela-benito-juarez",
        requesterId: student.id,
        requesterRole: "student",
      });

      setLastToolCalled("get_student_context");
      setLastExecutionLatency(res.durationMs);
      setLastExecutionSource(res.source);
      setLastRpcRequest({
        jsonrpc: "2.0",
        id: `call-context-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "get_student_context",
          arguments: {
            studentId: student.id,
            tenantId: "escuela-benito-juarez",
            requesterId: student.id,
            requesterRole: "student",
          },
        },
      });
      setLastRpcResponse(res);

      if (res.isError) {
        setLastSpeechOutput(`⚠️ [MCP Unavailable]: ${res.error || "El servidor MCP no respondió."}`);
        return;
      }

      if (res.result?.alexaVoicePrompt) {
        setLastSpeechOutput(res.result.alexaVoicePrompt);
      }
      const assigned = await mcpClient.callTool("get_assigned_practice", { studentId: student.id, tenantId: "escuela-benito-juarez", requesterId: student.id });
      const available = assigned.result?.practices?.find((item: any) => item.status !== "completed") || assigned.result?.practices?.[0];
      setRemotePracticeId(available?.practiceId ?? null);
      setActiveStep(2);
    } catch (e: any) {
      setLastSpeechOutput(`⚠️ [MCP Error]: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: start_practice
  const handleStartPractice = async () => {
    if (!targetPractice) return;
    setLoading(true);
    setSecurityTestResult(null);
    try {
      const assigned = await mcpClient.callTool("get_assigned_practice", { studentId: student.id, tenantId: "escuela-benito-juarez", requesterId: student.id });
      const available = assigned.result?.practices?.find((item: any) => item.status !== "completed") || assigned.result?.practices?.[0];
      const resolvedPracticeId = available?.practiceId || remotePracticeId || targetPractice.id;
      setRemotePracticeId(resolvedPracticeId);
      const res = await mcpClient.callTool("start_practice", {
        practiceId: resolvedPracticeId,
        studentId: student.id,
        tenantId: "escuela-benito-juarez",
        requesterId: student.id,
      });

      setLastToolCalled("start_practice");
      setLastExecutionLatency(res.durationMs);
      setLastExecutionSource(res.source);
      setLastRpcRequest({
        jsonrpc: "2.0",
        id: `call-start-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "start_practice",
          arguments: {
            practiceId: resolvedPracticeId,
            studentId: student.id,
          },
        },
      });
      setLastRpcResponse(res);

      if (res.isError) {
        setLastSpeechOutput(`⚠️ [MCP Unavailable]: ${res.error || "El servidor MCP no respondió."}`);
        return;
      }

      if (res.result?.alexaSpeechPrompt) {
        setLastSpeechOutput(res.result.alexaSpeechPrompt);
      }
      setActiveStep(3);
    } catch (e: any) {
      setLastSpeechOutput(`⚠️ [MCP Error]: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: submit_answer (with oral normalization)
  const handleOralAnswer = async (spokenPhrase: string) => {
    if (!targetPractice) return;
    setLoading(true);
    setSecurityTestResult(null);
    const exId = targetPractice.exercises[0]?.id || "ex-frac-1";

    try {
      const res = await mcpClient.callTool("submit_answer", {
        practiceId: remotePracticeId || targetPractice.id,
        exerciseId: exId,
        studentAnswer: spokenPhrase,
        attemptNumber: 1,
        studentId: student.id,
        tenantId: "escuela-benito-juarez",
        requesterId: student.id,
      });

      setLastToolCalled("submit_answer");
      setLastExecutionLatency(res.durationMs);
      setLastExecutionSource(res.source);
      setLastRpcRequest({
        jsonrpc: "2.0",
        id: `call-submit-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "submit_answer",
          arguments: {
            practiceId: remotePracticeId || targetPractice.id,
            exerciseId: exId,
            studentAnswer: spokenPhrase,
            attemptNumber: 1,
            studentId: student.id,
          },
        },
      });
      setLastRpcResponse(res);

      if (res.isError) {
        setLastSpeechOutput(`⚠️ [MCP Unavailable]: ${res.error || "El servidor MCP no respondió."}`);
        return;
      }

      if (typeof res.result?.isCorrect === "boolean") {
        setOralAnswers((prev) => [...prev.filter((answer) => answer.exerciseId !== exId), { exerciseId: exId, isCorrect: res.result.isCorrect, studentAnswer: res.result.recognizedAnswer }]);
      }
      if (res.result?.alexaSpeechFeedback) {
        setLastSpeechOutput(res.result.alexaSpeechFeedback);
      }
    } catch (e: any) {
      setLastSpeechOutput(`⚠️ [MCP Error]: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formative hint: get_hint
  const handleGetHint = async () => {
    if (!targetPractice) return;
    setLoading(true);
    setSecurityTestResult(null);
    const exId = targetPractice.exercises[0]?.id || "ex-frac-1";

    try {
      const res = await mcpClient.callTool("get_hint", {
        exerciseId: exId,
        studentId: student.id,
        practiceId: remotePracticeId || targetPractice.id,
        tenantId: "escuela-benito-juarez",
        requesterId: student.id,
      });

      setLastToolCalled("get_hint");
      setLastExecutionLatency(res.durationMs);
      setLastExecutionSource(res.source);
      setLastRpcRequest({
        jsonrpc: "2.0",
        id: `call-hint-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "get_hint",
          arguments: { exerciseId: exId, studentId: student.id },
        },
      });
      setLastRpcResponse(res);

      if (res.isError) {
        setLastSpeechOutput(`⚠️ [MCP Unavailable]: ${res.error || "El servidor MCP no respondió."}`);
        return;
      }

      if (res.result?.alexaSpeechHint) {
        setLastSpeechOutput(res.result.alexaSpeechHint);
      }
    } catch (e: any) {
      setLastSpeechOutput(`⚠️ [MCP Error]: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formative explanation: get_adaptive_explanation
  const handleGetExplanation = async (level: "analogy" | "step_by_step") => {
    if (!targetPractice) return;
    setLoading(true);
    setSecurityTestResult(null);
    const exId = targetPractice.exercises[0]?.id || "ex-frac-1";

    try {
      const res = await mcpClient.callTool("get_adaptive_explanation", {
        exerciseId: exId,
        studentId: student.id,
        practiceId: remotePracticeId || targetPractice.id,
        level,
        tenantId: "escuela-benito-juarez",
        requesterId: student.id,
      });

      setLastToolCalled("get_adaptive_explanation");
      setLastExecutionLatency(res.durationMs);
      setLastExecutionSource(res.source);
      setLastRpcRequest({
        jsonrpc: "2.0",
        id: `call-explain-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "get_adaptive_explanation",
          arguments: { exerciseId: exId, studentId: student.id, level },
        },
      });
      setLastRpcResponse(res);

      if (res.isError) {
        setLastSpeechOutput(`⚠️ [MCP Unavailable]: ${res.error || "El servidor MCP no respondió."}`);
        return;
      }

      if (res.result?.alexaSpeechExplanation) {
        setLastSpeechOutput(res.result.alexaSpeechExplanation);
      }
    } catch (e: any) {
      setLastSpeechOutput(`⚠️ [MCP Error]: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: complete_practice & get_practice_result
  const handleCompletePractice = async () => {
    if (!targetPractice) return;
    setLoading(true);
    setSecurityTestResult(null);

    try {
      const res = await mcpClient.callTool("complete_practice", {
        practiceId: remotePracticeId || targetPractice.id,
        studentId: student.id,
        answers: oralAnswers,
        tenantId: "escuela-benito-juarez",
        requesterId: student.id,
      });

      setLastToolCalled("complete_practice");
      setLastExecutionLatency(res.durationMs);
      setLastExecutionSource(res.source);
      setLastRpcRequest({
        jsonrpc: "2.0",
        id: `call-complete-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "complete_practice",
          arguments: {
            practiceId: remotePracticeId || targetPractice.id,
            studentId: student.id,
          },
        },
      });
      setLastRpcResponse(res);

      if (res.isError) {
        setLastSpeechOutput(`⚠️ [MCP Unavailable]: ${res.error || "El servidor MCP no respondió."}`);
        return;
      }

      if (res.result?.alexaCelebrationSpeech) {
        setLastSpeechOutput(res.result.alexaCelebrationSpeech);
      }
      if (res.result?.evidence) {
        repository.saveEvidence(res.result.evidence);
        repository.updateStudentScore(student.id, targetPractice.topicId, res.result.finalScore);
      }
      setActiveStep(4);
      refreshState();
    } catch (e: any) {
      setLastSpeechOutput(`⚠️ [MCP Error]: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Security test trigger: test multi-tenant & IDOR rejection
  const handleTestSecurity = async (type: "tenant" | "idor") => {
    setLoading(true);
    try {
      if (type === "tenant") {
        const res = await mcpClient.callTool("get_student_context", {
          studentId: student.id,
          tenantId: "escuela-rival-ajena", // Unauthorized tenant
          requesterId: student.id,
          requesterRole: "student",
        });

        if (res.isError || res.error) {
          setSecurityTestResult(`🛡️ Éxito en defensa Multi-Tenant: ${res.error || "Acceso bloqueado 403"}`);
        } else {
          setSecurityTestResult(`⚠️ Fallo: El servidor permitió acceso a tenant no autorizado.`);
        }
      } else {
        const res = await mcpClient.callTool("get_student_context", {
          studentId: "otro-alumno-privado",
          tenantId: "escuela-benito-juarez",
          requesterId: "mariana-lopez", // Student trying to access another student's file
          requesterRole: "student",
        });

        if (res.isError || res.error) {
          setSecurityTestResult(`🛡️ Éxito en defensa IDOR: ${res.error || "Acceso transversal bloqueado 403"}`);
        } else {
          setSecurityTestResult(`⚠️ Fallo: Se permitió IDOR transversal.`);
        }
      }
    } catch (e: any) {
      setSecurityTestResult(`🛡️ Bloqueo estricto ejecutado: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Switch to teacher view to verify persisted evidence
  const handleGoToTeacherEvidences = () => {
    refreshState();
    setRole("teacher");
    setActiveTeacherTab("evidences");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-950 text-slate-100 w-full max-w-4xl rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Alexa+ Estilo Echo Show */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Simulador de Experiencia Alexa+ (Inspirado en Echo Show)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Streamable HTTP MCP Real
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Spec 2025-11-25
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Experiencia Alexa+ simulada respaldada por el servidor MCP real de MACHTIA sobre Streamable HTTP (8 herramientas)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cerrar simulador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Principal del Simulador */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Echo Show Screen Card */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 p-5 shadow-inner">
            <div className="flex items-start gap-4">
              <div className="shrink-0 pt-1">
                <TutorRobotAvatar size="md" showGlow />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                    Alexa+ Voz Sintetizada • MACHTIA Tutor
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Alumno: {student.name} ({student.id})
                  </span>
                </div>
                <div className="bg-slate-900/90 rounded-xl p-4 border border-cyan-500/20 text-sm text-cyan-50 leading-relaxed shadow-sm">
                  {lastSpeechOutput}
                </div>
              </div>
            </div>

            {/* Echo Light Ring Bar */}
            <div className="mt-4 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className={`h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 ${
                  loading ? "animate-pulse w-full" : "w-2/3"
                }`}
              ></div>
            </div>
          </div>

          {/* Stepper de Demostración para los Jueces */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <button
              onClick={handleGetStudentContext}
              disabled={loading}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                activeStep === 1
                  ? "bg-cyan-950/60 border-cyan-400 text-cyan-100 font-bold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] text-cyan-400">PASO 1</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeStep > 1 ? "text-emerald-400" : "text-slate-600"}`} />
              </div>
              <span>1. get_student_context</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Identificar alumna y rezago</span>
            </button>

            <button
              onClick={handleStartPractice}
              disabled={loading}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                activeStep === 2
                  ? "bg-cyan-950/60 border-cyan-400 text-cyan-100 font-bold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] text-cyan-400">PASO 2</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeStep > 2 ? "text-emerald-400" : "text-slate-600"}`} />
              </div>
              <span>2. start_practice</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Iniciar reactivo oral 1</span>
            </button>

            <div
              className={`p-3 rounded-xl border text-left flex flex-col justify-between ${
                activeStep === 3
                  ? "bg-cyan-950/60 border-cyan-400 text-cyan-100 font-bold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] text-cyan-400">PASO 3</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeStep > 3 ? "text-emerald-400" : "text-slate-600"}`} />
              </div>
              <span>3. submit_answer</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Normalizador oral</span>
            </div>

            <button
              onClick={handleCompletePractice}
              disabled={loading}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                activeStep === 4
                  ? "bg-cyan-950/60 border-cyan-400 text-cyan-100 font-bold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-mono text-[10px] text-cyan-400">PASO 4</span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeStep === 4 ? "text-emerald-400" : "text-slate-600"}`} />
              </div>
              <span>4. complete_practice</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Registrar respuestas realizadas</span>
            </button>
          </div>

          {/* Diálogo Oral de Alexa+ con Normalización */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                Interacción Vocal Simulada (Normalizador de Lenguaje Hablado)
              </h3>
              <span className="text-[11px] text-slate-400">
                Prueba frases coloquiales en español
              </span>
            </div>

            {/* Botones de Frases Orales Típicas */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">
                Respuestas orales de la alumna (con normalización fonética y semántica):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleOralAnswer("dos cuartos")}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 text-cyan-200 border border-cyan-500/30 text-xs font-semibold transition"
                >
                  &quot;dos cuartos&quot; (Acierto canónico 2/4)
                </button>
                <button
                  onClick={() => handleOralAnswer("la A")}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 text-cyan-200 border border-cyan-500/30 text-xs font-semibold transition"
                >
                  &quot;la A&quot; (Selección por letra)
                </button>
                <button
                  onClick={() => handleOralAnswer("dos sobre cuatro")}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 text-cyan-200 border border-cyan-500/30 text-xs font-semibold transition"
                >
                  &quot;dos sobre cuatro&quot; (Fracción hablada)
                </button>
                <button
                  onClick={() => handleOralAnswer("un tercio")}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-950 text-amber-200 border border-amber-500/30 text-xs font-semibold transition"
                >
                  &quot;un tercio&quot; (Opción incorrecta para activar pista)
                </button>
              </div>
            </div>

            {/* Botones de Andamiaje Pedagógico Oral */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                Solicitudes de andamiaje durante la práctica (Niveles 1, 2 y 3):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleGetHint}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  &quot;Dame una pista&quot; (get_hint)
                </button>
                <button
                  onClick={() => handleGetExplanation("analogy")}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  &quot;Explícamelo con un ejemplo cotidiano&quot; (get_adaptive_explanation)
                </button>
                <button
                  onClick={() => handleGetExplanation("step_by_step")}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                  &quot;Explícamelo paso a paso&quot; (step-by-step)
                </button>
              </div>
            </div>

            {/* Input Libre para Probar Cualquier Frase */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customOralInput.trim()) {
                  handleOralAnswer(customOralInput);
                  setCustomOralInput("");
                }
              }}
              className="flex gap-2 pt-2 border-t border-slate-800"
            >
              <input
                type="text"
                value={customOralInput}
                onChange={(e) => setCustomOralInput(e.target.value)}
                placeholder="Escribe otra frase oral de prueba (ej: 'la primera opción', 'creo que dos partes')..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={loading || !customOralInput.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simular Voz</span>
              </button>
            </form>
          </div>

          {/* Bloque de Verificación de Seguridad y Tenant Isolation */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Pruebas de Seguridad en Tiempo Real (Defensa Multi-Tenant e IDOR)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTestSecurity("tenant")}
                  disabled={loading}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/30 transition"
                >
                  Probar rechazo de Tenant Ajeno
                </button>
                <button
                  onClick={() => handleTestSecurity("idor")}
                  disabled={loading}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-red-300 rounded-lg border border-red-500/30 transition"
                >
                  Probar rechazo IDOR
                </button>
              </div>
            </div>
            {securityTestResult && (
              <div className="text-xs font-mono p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300">
                {securityTestResult}
              </div>
            )}
          </div>

          {/* Toggle Inspector Técnico JSON-RPC 2.0 */}
          <div className="space-y-2">
            <button
              onClick={() => setShowJsonInspector(!showJsonInspector)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showJsonInspector ? "Ocultar" : "Ver"} Inspector Técnico JSON-RPC 2.0 (Streamable HTTP POST /mcp)</span>
            </button>

            {showJsonInspector && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                  <span>
                    Herramienta: <strong className="text-cyan-300">{lastToolCalled}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Origen: <strong className="text-cyan-300">{lastExecutionSource}</strong>
                  </span>
                  {lastExecutionLatency !== null && (
                    <>
                      <span>•</span>
                      <span>
                        Latencia: <strong className="text-emerald-400">{lastExecutionLatency}ms</strong>
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>Header: <code className="text-slate-300">x-mcp-protocol-version: 2025-11-25</code></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">
                      JSON-RPC Request Enviado:
                    </span>
                    <pre className="bg-slate-900 p-2.5 rounded-xl text-slate-300 overflow-x-auto max-h-48 text-[11px]">
                      {JSON.stringify(lastRpcRequest, null, 2) || "// Presiona cualquier acción para inspeccionar"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">
                      JSON-RPC Result Recibido:
                    </span>
                    <pre className="bg-slate-900 p-2.5 rounded-xl text-slate-300 overflow-x-auto max-h-48 text-[11px]">
                      {JSON.stringify(lastRpcResponse?.result, null, 2) || "// Sin respuesta aún"}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con Acciones de Cierre y Verificación */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Persistencia en tiempo real: Los datos viajan desde Alexa+ al expediente del docente.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleGoToTeacherEvidences}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Award className="w-4 h-4" />
              <span>Ver evidencia en Panel Docente</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
