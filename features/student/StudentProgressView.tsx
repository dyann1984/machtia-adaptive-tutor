"use client";
import React from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { subjectName } from "@/lib/learning/catalog";
import { SupportLedger } from "@/components/SupportLedger";

export function StudentProgressView() {
  const { selectedStudentId, students, evidences } = useTutor();
  const student = students.find(s=>s.id===selectedStudentId) || students[0];
  const records = evidences.filter(e=>e.studentId===student.id);
  return <div className="space-y-6 max-w-4xl mx-auto">
    <header><h1 className="text-2xl font-black">Mi Progreso de Aprendizaje</h1><p className="text-sm mt-2">{student.name} · Tus descubrimientos se registran al completar cada práctica.</p></header>
    {!records.length && <div className="rounded-2xl bg-white border p-6"><h2 className="font-bold">Tu punto de partida</h2><p className="mt-2">Diagnóstico de fracciones: {student.topicPerformances["fracciones-equivalentes"] !== undefined ? `${student.topicPerformances["fracciones-equivalentes"]}%` : "Sin registro"}.</p><p className="text-sm mt-2">Completa un reto para ver tu resultado, tus apoyos y los conceptos comprobados.</p></div>}
    {records.map(record=><article key={record.id} className="subject-shell theme-card border-2 rounded-3xl p-5 space-y-4" data-subject={record.subjectId}>
      <p className="text-xs font-bold">{subjectName(record.subjectId)}</p><h2 className="text-xl font-bold">{record.topicName}</h2>
      <p className="text-3xl font-black">{record.finalScore}%</p><p className="text-sm">{record.baselineAvailable===false?"Primera medición de este tema.":`${record.initialScore}% → ${record.finalScore}% · cambio ${record.improvementDelta >= 0 ? "+" : ""}${record.improvementDelta} puntos.`}</p>
      <p className="text-sm">{record.totalAttempts !== undefined ? `${record.totalAttempts} intentos` : ""}{record.hintsUsed !== undefined ? ` · ${record.hintsUsed} pistas` : ""}{record.reexplanationsUsed !== undefined ? ` · ${record.reexplanationsUsed} re-explicaciones` : ""}</p>
      <div className="grid sm:grid-cols-2 gap-3"><div className="bg-white border rounded-xl p-4"><h3 className="font-bold text-emerald-900">✨ Ideas comprobadas</h3><ul className="text-sm mt-2 space-y-1">{record.masteredConcepts.map(c=><li key={c}>✓ {c}</li>)}</ul></div><div className="bg-white border rounded-xl p-4"><h3 className="font-bold text-amber-900">Practicaremos juntos</h3><ul className="text-sm mt-2 space-y-1">{record.pendingConcepts.map(c=><li key={c}>{c}</li>)}</ul>{!record.pendingConcepts.length&&<p className="text-sm mt-2">Resolviste todos los conceptos de este reto.</p>}</div></div>
      <SupportLedger evidence={record}/>
    </article>)}
  </div>;
}
