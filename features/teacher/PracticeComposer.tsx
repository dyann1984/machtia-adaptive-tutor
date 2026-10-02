"use client";
import React, { useState, useEffect } from "react";
import { useTutor } from "@/lib/context/tutor-context";
import { SUBJECT_CATALOG, ACTIVITY_LABELS, createDraft, makeExercise, regenerateExercise, publishDraft, recommendPractice, validateDraft, type DraftConfig, type PracticeDraft } from "@/lib/learning/catalog";
import type { Exercise } from "@/types";

const defaultConfig: DraftConfig = { subjectId: "matematicas", topicId: "fracciones-equivalentes", recipientId: "mariana-lopez", grade: 3, objective: "Reconocer cantidades equivalentes y explicar la relación entre sus partes.", difficulty: "easy", exerciseCount: 5, activityKind: "choice", initialSupport: "independent" };
export function PracticeComposer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("demo"); url.searchParams.delete("judge"); url.searchParams.set("mode", "teacher");
    window.history.replaceState(null, "", url);
  }, []);
  const { students, group, evidences, refreshState, setSelectedStudentId, setRole, setActiveStudentTab, setCurrentPracticingId } = useTutor();
  const [config, setConfig] = useState<DraftConfig>(defaultConfig);
  const [draft, setDraft] = useState<PracticeDraft | null>(null);
  const [error, setError] = useState("");
  const [published, setPublished] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const subject = SUBJECT_CATALOG.find(s => s.id === config.subjectId)!;
  function updateConfig(patch: Partial<DraftConfig>) { setConfig(c => ({...c,...patch})); setSaved(false); }
  function updateExercise(index: number, patch: Partial<Exercise>) {
    setDraft(d => d ? {...d, exercises: d.exercises.map((e,i) => i === index ? {...e,...patch} : e)} : d); setSaved(false);
  }
  function saveDraft() { if (draft) { localStorage.setItem("machtia_teacher_draft_v2", JSON.stringify(draft)); setSaved(true); } }
  function restoreDraft() {
    try { const raw = localStorage.getItem("machtia_teacher_draft_v2"); if (!raw) { setError("No hay un borrador guardado en este navegador."); return; }
      const value = JSON.parse(raw) as PracticeDraft;
      if (!value.config || !Array.isArray(value.exercises) || !SUBJECT_CATALOG.some(s=>s.id===value.config.subjectId)) throw new Error();
      setConfig(value.config); setDraft(value); setError("");
    } catch { setError("No se pudo recuperar el borrador. Puedes crear uno nuevo."); }
  }
  const recommendation = config.recipientId === "group" ? "Selecciona un alumno para consultar su evidencia individual." : recommendPractice(students.find(s=>s.id===config.recipientId),config.subjectId,config.topicId,evidences);
  return <section className="subject-shell space-y-5" data-subject={config.subjectId} aria-label="Editor docente de prácticas">
    <p className="text-xs text-slate-600">Espacio docente: tus prácticas y borradores se conservan en este navegador. Abrir el modo juez reinicia su escenario de demostración.</p>
    <div className="theme-banner flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-black">Crear práctica</h2><p className="text-sm mt-1">Configura, revisa y decide qué publicar.</p></div><button className="support-button" onClick={onClose}>Cerrar editor</button></div>
    {published.length > 0 ? <div className="theme-card border-2 rounded-2xl p-6 space-y-4" role="status"><h3 className="text-lg font-bold">Práctica asignada</h3><p>{published.length} {published.length === 1 ? "alumno recibió" : "alumnos recibieron"} la práctica. Cada alumno tiene su propio registro.</p><button className="theme-primary" onClick={()=>{const studentId = config.recipientId === "group" ? students.find(s=>s.groupId===group.id)!.id : config.recipientId;setSelectedStudentId(studentId);setCurrentPracticingId(null);setRole("student");setActiveStudentTab("practices");}}>Ver en Mis Prácticas</button><button className="support-button ml-2" onClick={()=>{setPublished([]);setDraft(null);}}>Crear otra práctica</button></div> : <>
      {!draft ? <div className="theme-card rounded-2xl border-2 p-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-bold">Materia<select className="editor-field mt-1" value={config.subjectId} onChange={e=>{const s=SUBJECT_CATALOG.find(s=>s.id===e.target.value)!;updateConfig({subjectId:s.id,topicId:s.topics[0].id,objective:`Comprender ${s.topics[0].name.toLowerCase()} y justificar una respuesta usando pistas del contexto.`});}}>{SUBJECT_CATALOG.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="text-sm font-bold">Tema<select className="editor-field mt-1" value={config.topicId} onChange={e=>updateConfig({topicId:e.target.value})}>{subject.topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="text-sm font-bold">Alumno o grupo<select className="editor-field mt-1" value={config.recipientId} onChange={e=>updateConfig({recipientId:e.target.value})}><option value="group">Todo el grupo {group.name}</option>{students.filter(s=>s.groupId===group.id).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="text-sm font-bold">Grado<select className="editor-field mt-1" value={config.grade} onChange={e=>updateConfig({grade:Number(e.target.value)})}>{[2,3,4].map(g=><option key={g} value={g}>{g}° de primaria</option>)}</select></label>
          <label className="text-sm font-bold">Dificultad<select className="editor-field mt-1" value={config.difficulty} onChange={e=>updateConfig({difficulty:e.target.value as DraftConfig["difficulty"]})}><option value="easy">Inicial</option><option value="medium">Intermedia</option><option value="hard">Desafío</option></select></label>
          <label className="text-sm font-bold">Número de ejercicios<input className="editor-field mt-1" type="number" min={1} max={10} value={config.exerciseCount} onChange={e=>updateConfig({exerciseCount:Number(e.target.value)})}/></label>
          <label className="text-sm font-bold">Tipo de actividades<select className="editor-field mt-1" value={config.activityKind} onChange={e=>updateConfig({activityKind:e.target.value as DraftConfig["activityKind"]})}>{Object.entries(ACTIVITY_LABELS).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
          <label className="text-sm font-bold">Nivel inicial de apoyo<select className="editor-field mt-1" value={config.initialSupport} onChange={e=>updateConfig({initialSupport:e.target.value as DraftConfig["initialSupport"]})}><option value="independent">Intentar por su cuenta</option><option value="verbal">Orientación verbal</option><option value="visual">Ayuda visual</option></select></label>
        </div>
        <label className="text-sm font-bold block">Objetivo de aprendizaje<textarea className="editor-field mt-1" rows={2} value={config.objective} onChange={e=>updateConfig({objective:e.target.value})}/></label>
        <aside className="bg-white border rounded-xl p-4 text-sm"><strong>Tutor IA recomienda</strong><p className="mt-2">{recommendation}</p></aside>
        <p className="text-xs text-slate-600">Banco demo de primaria (2°–4°). El borrador usa actividades revisables; tu objetivo se incluye en la práctica. Revisa que las preguntas lo cubran antes de asignar.</p>
        <div className="flex flex-wrap gap-3"><button className="theme-primary" onClick={()=>{try{setDraft(createDraft(config));setError("");}catch(e){setError((e as Error).message);}}}>Generar borrador</button><button className="support-button" onClick={restoreDraft}>Recuperar borrador guardado</button></div>
      </div> : <div className="space-y-4">
        <div className="theme-card border-2 rounded-2xl p-5 space-y-3"><h3 className="text-lg font-bold">Vista previa editable · {subject.name}</h3><p className="text-xs text-slate-600">Solo se publicará cuando pulses Asignar práctica. Los cambios de una pregunta conservan las demás.</p>
          <label className="block text-sm font-bold">Título<textarea rows={2} className="editor-field mt-1" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
          <label className="block text-sm font-bold">Instrucciones<textarea className="editor-field mt-1" rows={2} value={draft.instructions} onChange={e=>setDraft({...draft,instructions:e.target.value})}/></label>
          <label className="block text-sm font-bold">Objetivo<textarea rows={2} className="editor-field mt-1" value={draft.config.objective} onChange={e=>setDraft({...draft,config:{...draft.config,objective:e.target.value}})}/></label>
        </div>
        {draft.exercises.map((exercise,index)=><article key={exercise.id} className="bg-white rounded-2xl border-2 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Ejercicio {index+1}</h3><div className="flex flex-wrap gap-2">{[[-1,"Subir"],[1,"Bajar"]].map(([direction,label])=><button key={label} className="support-button" disabled={index+Number(direction)<0||index+Number(direction)>=draft.exercises.length} onClick={()=>{const items=[...draft.exercises];[items[index],items[index+Number(direction)]]=[items[index+Number(direction)],items[index]];setDraft({...draft,exercises:items});}}>{label}</button>)}<button className="support-button" onClick={()=>updateExercise(index,regenerateExercise(draft.config,index,exercise))}>Regenerar este ejercicio</button><button className="support-button" onClick={()=>setDraft({...draft,exercises:draft.exercises.filter((_,i)=>i!==index)})}>Eliminar ejercicio</button></div></div>
          <label className="block text-sm font-bold">Contexto o lectura<textarea className="editor-field mt-1" value={exercise.context||""} onChange={e=>updateExercise(index,{context:e.target.value,visualCue:e.target.value})}/></label>
          <label className="block text-sm font-bold">Pregunta<textarea className="editor-field mt-1" value={exercise.prompt} onChange={e=>updateExercise(index,{prompt:e.target.value})}/></label>
          <fieldset className="space-y-2"><legend className="text-sm font-bold">Opciones · marca la correcta</legend>{exercise.options.map((option,i)=><div key={i} className="flex items-center gap-2"><input aria-label={`Respuesta correcta opción ${i+1}, ejercicio ${index+1}`} type="radio" name={`correct-${exercise.id}`} checked={exercise.correctAnswer===option} onChange={()=>updateExercise(index,{correctAnswer:option})}/><textarea rows={2} aria-label={`Opción ${i+1}, ejercicio ${index+1}`} className="editor-field" value={option} onChange={e=>{const options=[...exercise.options];options[i]=e.target.value;updateExercise(index,{options,...(exercise.correctAnswer===option?{correctAnswer:e.target.value}:{})});}}/></div>)}</fieldset>
          <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm font-bold">Pista sin respuesta<textarea rows={3} className="editor-field mt-1" value={exercise.hint} onChange={e=>updateExercise(index,{hint:e.target.value})}/></label><label className="text-sm font-bold">Dificultad del ejercicio<select className="editor-field mt-1" value={exercise.difficulty} onChange={e=>updateExercise(index,{difficulty:e.target.value as Exercise["difficulty"]})}><option value="easy">Inicial</option><option value="medium">Intermedia</option><option value="hard">Desafío</option></select></label></div>
          <label className="block text-sm font-bold">Otra explicación<textarea className="editor-field mt-1" value={exercise.alternativeExplanation||""} onChange={e=>updateExercise(index,{alternativeExplanation:e.target.value})}/></label>
        </article>)}
        <div className="theme-banner flex flex-wrap gap-3"><button className="support-button" disabled={draft.exercises.length>=10} onClick={()=>setDraft({...draft,exercises:[...draft.exercises,makeExercise(draft.config,draft.exercises.length)]})}>Agregar ejercicio</button><button className="support-button" onClick={saveDraft}>{saved?"Borrador guardado":"Guardar borrador"}</button><button className="theme-primary" onClick={()=>{const errors=validateDraft(draft);if(errors.length){setError(errors.join(" "));return;}try{const practices=publishDraft(draft);refreshState();setPublished(practices.map(p=>p.id));setError("");localStorage.removeItem("machtia_teacher_draft_v2");}catch(e){setError((e as Error).message);}}}>Asignar práctica</button></div>
      </div>}
      {error&&<p role="alert" className="bg-amber-50 border border-amber-400 p-4 rounded-xl text-amber-950">{error}</p>}
    </>}
  </section>;
}
