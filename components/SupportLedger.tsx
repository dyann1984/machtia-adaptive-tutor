import React from "react";
import type { LearningEvidence } from "@/types";
import { SUPPORT_LABELS } from "@/lib/learning/support";
import { repository } from "@/lib/data/repository";

export function SupportLedger({ evidence }: { evidence: LearningEvidence }) {
  if (!evidence.supportEvents?.length) return null;
  const practice = repository.getPracticeById(evidence.practiceId);
  return <details className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-sm">
    <summary className="font-bold cursor-pointer text-amber-950">Qué apoyo recibió · {evidence.supportEvents.length} intervenciones</summary>
    <ul className="space-y-3 mt-3">{evidence.supportEvents.map((event,i)=>{
      const exercise = practice?.exercises.find(e=>e.id===event.exerciseId);
      return <li key={`${event.timestamp}-${i}`} className="bg-white border rounded-xl p-3"><strong>{exercise ? `Ejercicio ${exercise.questionNumber} · ${exercise.conceptTag}` : "Descubrimiento guiado"}</strong><p>{SUPPORT_LABELS[event.kind]}{event.representation?` · ${event.representation}`:""} · {event.source==="requested"?"Solicitado por el alumno":event.source==="teacher"?"Apoyo inicial del profesor":"Apoyo tras un error"}</p><p className="text-xs text-slate-600 mt-1">Resultado: {exercise && evidence.masteredConcepts.includes(exercise.conceptTag)?"Resolvió el reto después del apoyo":exercise && evidence.pendingConcepts.includes(exercise.conceptTag)?"Concepto pendiente de reforzar":"Actividad de preparación"}</p></li>;
    })}</ul>
  </details>;
}
