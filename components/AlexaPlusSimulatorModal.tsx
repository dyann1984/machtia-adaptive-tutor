"use client";
import React, { useState } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { mcpClient } from "@/lib/mcp/client";
import { TutorRobotAvatar } from "./TutorRobotAvatar";
import { useSpeech } from "@/lib/hooks/use-speech";
import { SpeechAudioButton } from "./SpeechAudioButton";
export function AlexaPlusSimulatorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { selectedStudentId, practices, refreshState, setRole, setActiveTeacherTab } = useTutor();
  const [practiceId, setPracticeId] = useState("");
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [input, setInput] = useState("");
  const [speechText, setSpeechText] = useState("Simulación conversacional Alexa+ · MCP real · motor pedagógico determinista. Comienza una práctica asignada.");
  const [resolved, setResolved] = useState(false);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [trace, setTrace] = useState<string[]>([]);
  const speech = useSpeech();
  const practice = practices.find(p => p.id === practiceId);
  const exercise = practice?.exercises[index];
  async function perform(name: string, task: () => Promise<void>) {
    if (busy) return; setBusy(true); setError(""); speech.stop();
    try { await task(); setTrace(t => [...t, name + (name === "next exercise" ? " · Transición del simulador" : " · MCP real")]); }
    catch (e) { setError(String(e)); } finally { setBusy(false); }
  }
  async function start() {
    await mcpClient.selectRole("student", selectedStudentId);
    const context = await mcpClient.getStudentContext(selectedStudentId);
    const assigned = await mcpClient.getAssignedPractice(selectedStudentId);
    const target = assigned.result.practices.find((p: any) => p.status !== "completed");
    if (!target) throw new Error("No hay práctica pendiente. Asigna una desde el panel docente.");
    const begun = await mcpClient.startPractice(target.practiceId, selectedStudentId);
    setRole("student"); await refreshState(); setPracticeId(target.practiceId);setIndex(0);setAttempt(1);setResolved(false);setFinished(false);
    setSpeechText(context.result.alexaVoicePrompt + " " + begun.result.alexaSpeechPrompt);
  }
  async function answer() {
    if (!practice || !exercise || !input.trim()) return;
    await mcpClient.selectRole("student", practice.studentId);
    const result = await mcpClient.submitAnswer(practice.id, exercise.id, input, attempt, practice.studentId);
    setSpeechText(result.result.alexaSpeechFeedback); setResolved(result.result.isCorrect || !result.result.allowRetry);
    setAttempt(result.result.attemptNumber + 1); setInput("");
  }
  async function next() {
    if (!practice) return;
    if (index + 1 < practice.exercises.length) { setIndex(i => i + 1); setAttempt(1);setResolved(false);setSpeechText("Siguiente ejercicio: " + practice.exercises[index + 1].prompt);return; }
    const result = await mcpClient.completePractice(practice.id, practice.studentId);
    setSpeechText(result.result.alexaCelebrationSpeech);setFinished(true); await refreshState();
  }
  async function support(level: "hint" | "analogy" | "step_by_step") {
    if (!exercise || !practice) return;
    const result = level === "hint" ? await mcpClient.getHint(exercise.id, practice.studentId, { practiceId: practice.id }) : await mcpClient.getAdaptiveExplanation(exercise.id, practice.studentId, { practiceId: practice.id, level });
    setSpeechText(result.result.hint || result.result.explanation);
  }
  async function report() {
    if (!practice) return;
    await mcpClient.selectRole("teacher", practice.studentId);
    const result = await mcpClient.getPracticeResult(practice.id, practice.studentId);
    setSpeechText("How did " + practice.studentName + " do? " + result.result.finalScore + "% · " + result.result.evidenceId + " · " + result.result.evidence.tutorObservations);
    setRole("teacher");setActiveTeacherTab("evidences");await refreshState();
  }
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] bg-slate-950/80 p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="alexa-simulator-title">
    <div className="max-w-3xl mx-auto bg-slate-900 text-white rounded-3xl border border-cyan-700 p-5 sm:p-8 space-y-5">
      <div className="flex justify-between gap-4"><h2 id="alexa-simulator-title" className="text-xl font-bold">Simulador Alexa+ · MACHTIA</h2><button aria-label="Cerrar simulador" onClick={()=>{speech.stop();onClose();}} className="border rounded-lg px-3">Cerrar</button></div>
      <p className="text-sm text-cyan-200">Cliente conversacional simulado. No requiere cuenta Amazon ni dispositivo Echo. La voz utiliza síntesis del navegador cuando está disponible.</p>
      <TutorRobotAvatar size="lg" emotion={finished?"celebrating":"explaining"}/>
      <p role="status" aria-live="polite" className="bg-slate-800 rounded-xl p-4">{speechText}</p>
      <SpeechAudioButton textToSpeak={speechText} label="Escuchar simulación" speech={speech}/>
      <label className="block text-sm">Consultar una práctica completada
        <select aria-label="Evidencia en el simulador" className="block w-full mt-2 p-2 rounded-lg text-slate-950" value={finished ? practiceId : ""} onChange={e => { setPracticeId(e.target.value);setFinished(Boolean(e.target.value)); }}>
          <option value="">Selecciona una evidencia</option>
          {practices.filter(p => p.studentId === selectedStudentId && p.status === "completed").map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </label>
      {!practiceId && <button disabled={busy} onClick={()=>perform("context / assigned / start",start)} className="theme-primary">Comenzar práctica asignada</button>}
      {exercise && !finished && <><p className="font-bold">Ejercicio {index+1} de {practice!.exercises.length}: {exercise.prompt}</p>
        <div className="flex flex-wrap gap-2">{exercise.options.map(option=><button key={option} disabled={busy||resolved} onClick={()=>setInput(option)} className={`rounded-xl border p-3 ${input===option?"bg-cyan-700":"bg-slate-800"}`}>{option}</button>)}</div>
        <label className="block">Respuesta escrita u oral transcrita<input aria-label="Respuesta del simulador" className="w-full text-slate-950 rounded-lg p-3 mt-2" value={input} onChange={e=>setInput(e.target.value)} disabled={busy||resolved}/></label>
        <div className="flex flex-wrap gap-2"><button disabled={busy||resolved||!input.trim()} onClick={()=>perform("submit_answer",answer)} className="theme-primary">Enviar respuesta</button>
          {!resolved && <><button disabled={busy} onClick={()=>perform("get_hint",()=>support("hint"))} className="border rounded-lg p-2">Pista</button><button disabled={busy} onClick={()=>perform("get_adaptive_explanation",()=>support("analogy"))} className="border rounded-lg p-2">Otra explicación</button><button disabled={busy} onClick={()=>perform("get_adaptive_explanation",()=>support("step_by_step"))} className="border rounded-lg p-2">Paso a paso</button></>}
          {resolved && <button disabled={busy} onClick={()=>perform(index+1===practice!.exercises.length?"complete_practice":"next exercise",next)} className="theme-primary">{index+1===practice!.exercises.length?"Finalizar práctica":"Siguiente ejercicio"}</button>}</div></>}
      {finished && <button disabled={busy} onClick={()=>perform("get_practice_result",report)} className="theme-primary">How did Mariana do? · Ver evidencia docente</button>}
      {error && <p role="alert" className="text-amber-200">{error}</p>}
      <details><summary>Traza de herramientas ({trace.length})</summary><ol className="text-xs space-y-2 mt-3">{trace.map((t,i)=><li key={i}>{t}</li>)}</ol></details>
    </div>
  </div>;
}
