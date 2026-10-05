"use client";
import React, { useState } from "react";
import type { Exercise, SupportEvent, SupportKind } from "@/types";
import { supportDialogue, SUPPORT_LABELS } from "@/lib/learning/support";
import { SpeechAudioButton } from "./SpeechAudioButton";
import { useSpeech } from "@/lib/hooks/use-speech";
import { mcpClient } from "@/lib/mcp/client";
import { useTutor } from "@/lib/context/tutor-context";
import { activePracticeForExercise } from "@/lib/learning/active-practice";

export function AlternativeRepresentation({ exercise, representation }: { exercise: Exercise; representation: string }) {
  const fraction = exercise.prompt.match(/(\d+)\/(\d+)/);
  const numerator = fraction ? Math.min(Number(fraction[1]), 12) : 1;
  const denominator = fraction ? Math.min(Number(fraction[2]), 12) : 4;
  if (fraction) return <div className="space-y-3" aria-label={`Representación ${representation} de ${fraction[0]}; compara por tu cuenta`}>
    <p className="text-xs font-bold">La cantidad inicial, vista como {representation}. Compara con tus opciones.</p>
    {representation === "pizza" ? <div className="mx-auto w-28 h-28 rounded-full border-4 border-amber-700 relative overflow-hidden" style={{ background: `conic-gradient(#b45309 0 ${numerator / denominator * 360}deg, #fef3c7 0)` }}>
      {Array.from({length:denominator}, (_, i) => <span key={i} className="absolute left-1/2 top-0 h-1/2 w-0.5 bg-white origin-bottom" style={{transform:`rotate(${i * 360 / denominator}deg)`}} />)}
    </div> : <div className="flex flex-wrap justify-center gap-1">{Array.from({length:denominator}, (_, i) => <span key={i} className={`w-10 h-10 rounded-lg border-2 ${i < numerator ? "bg-amber-700 border-amber-900" : "bg-amber-50 border-amber-700"}`} />)}</div>}
    <p className="text-sm text-center">{fraction[0]} del entero. ¿Cómo conservarías esta cantidad con partes de otro tamaño?</p>
  </div>;
  return <div className="grid gap-2 sm:grid-cols-3" aria-label="Mapa de razonamiento alternativo">
    {["Lo que observo", "Lo que cambia o se relaciona", "Lo que debo decidir"].map((label, i) => <div key={label} className="bg-white border-2 border-dashed border-violet-300 rounded-xl p-3 text-sm"><strong>{i + 1}. {label}</strong><p className="mt-2">{i === 0 ? exercise.context || "Lee los datos de la pregunta." : i === 1 ? exercise.alternativeExplanation || "Relaciona las pistas del contexto." : "Compara tus opciones y elige tú."}</p></div>)}
  </div>;
}

export function SupportCoach({ exercise, onSupport, initialSupport = "independent", onDialogue }: {
  exercise: Exercise; onSupport: (event: SupportEvent) => void;
  initialSupport?: "independent" | "verbal" | "visual";
  onDialogue?: (text: string) => void;
}) {
  const speech = useSpeech();
  const { practices, selectedStudentId, currentPracticingId } = useTutor();
  const [serverError, setServerError] = useState("");
  const [hintLevel, setHintLevel] = useState(initialSupport === "visual" ? 2 : initialSupport === "verbal" ? 1 : 0);
  const [kind, setKind] = useState<SupportKind | null>(initialSupport === "visual" ? "visual_hint" : initialSupport === "verbal" ? "verbal_hint" : null);
  const [representation, setRepresentation] = useState("pizza");
  const [guideStep, setGuideStep] = useState(0);
  const steps = ["Lee la pregunta y señala los datos que tienes.", "Representa esos datos y compara una opción cada vez.", "Explica por qué tu elección tiene sentido y compruébala."];
  const text = kind === "guided_steps" ? `Paso ${guideStep + 1}. ${steps[guideStep]}` : kind ? supportDialogue(exercise, kind) : "Puedes intentar por tu cuenta o pedir apoyo. Tú eliges la respuesta.";
  async function request(next: SupportKind) {
    speech.stop();
    const practice = activePracticeForExercise(practices, selectedStudentId, currentPracticingId, exercise.id);
    if (practice) {
      try { await mcpClient.selectRole("student", practice.studentId); await mcpClient.demoApi("/api/support", { practiceId: practice.id, exerciseId: exercise.id, kind: next }); setServerError(""); }
      catch (error) { setServerError(String(error)); return; }
    }
    const nextRepresentation = next === "alternative_representation" ? (kind === next && representation === "pizza" ? "bloques" : "pizza") : representation;
    setRepresentation(nextRepresentation); setKind(next); setGuideStep(0);
    onSupport({ exerciseId: exercise.id, kind: next, representation: next === "alternative_representation" ? (exercise.prompt.match(/\d+\/\d+/) ? nextRepresentation : "mapa de ideas") : undefined, source: "requested", timestamp: new Date().toISOString() });
    onDialogue?.(next === "guided_steps" ? `Paso 1. ${steps[0]}` : supportDialogue(exercise, next));
  }
  return <section className="support-coach rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-4 space-y-3" aria-label="Apoyos del Tutor">
    {serverError && <p role="alert">{serverError}</p>}
    <div className="flex flex-wrap gap-2">
      <button className="support-button" onClick={() => { const next = hintLevel === 0 ? 1 : 2; setHintLevel(next); request(next === 1 ? "verbal_hint" : "visual_hint"); }}>💡 {hintLevel === 0 ? "Necesito una pista" : "Necesito otra pista"}</button>
      <button className="support-button" onClick={() => request("alternative_representation")}>🔄 Explícamelo de otra forma</button>
      <button className="support-button" onClick={() => request("guided_steps")}>🤝 Hazlo conmigo</button>
    </div>
    {kind && <div role="status" className="space-y-3">
      <p className="text-xs font-bold text-amber-900">{SUPPORT_LABELS[kind]}{kind === "visual_hint" ? " · Pista 2" : kind === "verbal_hint" ? " · Pista 1" : ""}</p>
      <p className="text-sm text-slate-800">{text}</p>
      {kind === "visual_hint" && <div className="rounded-xl border-2 border-dashed border-amber-500 p-3 bg-white"><span className="text-xs font-bold">Zona de observación</span><p className="text-sm mt-1">{exercise.context || "Fíjate en las líneas que dividen cada entero. Compara las partes que se señalan."}</p>{exercise.id === "discovery-1" ? <div className="space-y-2 mt-3">{[2,4].map((count)=><div key={count} className="flex gap-1" aria-label={`Entero con ${count} divisiones resaltadas`}>{Array.from({length:count},(_,i)=><span key={i} className="flex-1 h-8 border-2 border-amber-600 rounded bg-amber-100"/>)}</div>)}</div> : exercise.prompt.match(/\d+\/\d+/) ? <AlternativeRepresentation exercise={exercise} representation="bloques"/> : <div className="border-l-4 border-amber-500 p-3 mt-2 bg-amber-50 text-sm">Vuelve al contexto: señala quién participa, qué ocurre y qué te pide la pregunta.</div>}</div>}
      {kind === "alternative_representation" && <AlternativeRepresentation exercise={exercise} representation={representation} />}
      {kind === "guided_steps" && <div className="space-y-2"><ol className="text-sm list-decimal ml-5 space-y-1">{steps.slice(0,guideStep + 1).map(t=><li key={t}>{t}</li>)}</ol>{guideStep < 2 && <button className="support-button" onClick={()=>{speech.stop();setGuideStep(guideStep+1);onDialogue?.(`Paso ${guideStep + 2}. ${steps[guideStep+1]}`);}}>Siguiente micro-paso</button>}</div>}
      <SpeechAudioButton textToSpeak={text} label="Escuchar apoyo" speech={speech} />
    </div>}
  </section>;
}
