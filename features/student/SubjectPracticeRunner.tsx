"use client";
import React, { useState } from "react";
import type { Practice, SupportEvent, ExerciseAnswer, LearningEvidence } from "@/types";
import { useTutor } from "@/lib/context/tutor-context";
import { subjectName, ACTIVITY_LABELS } from "@/lib/learning/catalog";
import { summarizeSupports } from "@/lib/learning/support";
import { SupportCoach } from "@/components/SupportCoach";
import { TutorRobotAvatar, type TutorEmotion } from "@/components/TutorRobotAvatar";
import { SpeechAudioButton } from "@/components/SpeechAudioButton";
import { useSpeech } from "@/lib/hooks/use-speech";
import { repository } from "@/lib/data/repository";

function initialEvent(practice: Practice, index: number): SupportEvent[] {
  if (!practice.initialSupport || practice.initialSupport === "independent") return [];
  return [{ exerciseId: practice.exercises[index].id, kind: practice.initialSupport === "visual" ? "visual_hint" : "verbal_hint", source: "teacher", timestamp: new Date().toISOString() }];
}
export function SubjectPracticeRunner({ practice, onFinish }: { practice: Practice; onFinish: () => void }) {
  const { submitAnswer, completePractice, setRole, setActiveTeacherTab } = useTutor();
  const speech = useSpeech();
  const [phase, setPhase] = useState<"intro" | "questions" | "results">("intro");
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [answers, setAnswers] = useState<ExerciseAnswer[]>([]);
  const [supports, setSupports] = useState<SupportEvent[]>([]);
  const [dialogue, setDialogue] = useState(`¡Hola ${practice.studentName.split(" ")[0]}! Vamos a explorar ${practice.topicName.toLowerCase()}. Lee una pista, prueba y cuéntame qué descubres.`);
  const [emotion, setEmotion] = useState<TutorEmotion>("idle");
  const [saving, setSaving] = useState(false);
  const [serverEvidence, setServerEvidence] = useState<LearningEvidence | null>(null);
  const [saveError, setSaveError] = useState("");
  const [baseline] = useState(() => repository.getStudentById(practice.studentId)?.topicPerformances[practice.topicId]);
  const exercise = practice.exercises[index];
  const score = serverEvidence?.finalScore ?? (answers.length ? Math.round(answers.filter(a=>a.isCorrect).length / practice.exercises.length * 100) : 0);
  const counts = summarizeSupports(supports);
  function say(text: string, state: TutorEmotion = "explaining") { speech.stop();setDialogue(text);setEmotion(state); }
  function begin() { setSupports(initialEvent(practice,0));setPhase("questions");say(`Primer reto: ${exercise.prompt} ${practice.initialSupport && practice.initialSupport !== "independent" ? exercise.hint : "Observa el contexto y elige cuando estés listo."}`);repository.updatePracticeStatus(practice.id,"in_progress"); }
  async function check() {
    if (!choice || checked) return;
    let result; try { result = await submitAnswer(exercise.id, choice, attempts); } catch (error) { setSaveError(String(error)); return; }
    const success = result.isCorrect;
    setChecked(true);setCorrect(success);
    if (success) {
      say(`⭐ ¡Lo descubriste! ${exercise.explanation} ${index + 1 < practice.exercises.length ? "¿Vamos al siguiente reto?" : "Vamos a revisar lo que lograste."}`,"success");
      setAnswers(a=>[...a.filter(a=>a.exerciseId!==exercise.id),{exerciseId:exercise.id,studentAnswer:choice,isCorrect:true,attemptsCount:attempts,hintsUsed:supports.some(s=>s.exerciseId===exercise.id)}]);
    } else {
      if (!result.allowRetry) setAnswers(a=>[...a.filter(a=>a.exerciseId!==exercise.id),{exerciseId:exercise.id,studentAnswer:choice,isCorrect:false,attemptsCount:attempts,hintsUsed:true}]);
      const kind = attempts === 1 ? "verbal_hint" : attempts === 2 ? "alternative_representation" : "guided_steps";
      setSupports(s=>[...s,{exerciseId:exercise.id,kind,source:"automatic",timestamp:new Date().toISOString()}]);
      say(`Estás cerca. ${result.hint} Puedes volver a intentarlo o pedir otro apoyo.`,"encouraging");
    }
  }
  async function next() {
    speech.stop();
    if (index+1 < practice.exercises.length) {
      const nextIndex=index+1;setIndex(nextIndex);setChoice(null);setChecked(false);setAttempts(1);setSupports(s=>[...s,...initialEvent(practice,nextIndex)]);
      say(`Reto ${nextIndex+1}: ${practice.exercises[nextIndex].prompt} Mira qué cambia respecto al anterior.`);
    } else {
      setSaving(true);setSaveError("");
      const mastered=Array.from(new Set(practice.exercises.filter(e=>answers.some(a=>a.exerciseId===e.id&&a.isCorrect)).map(e=>e.conceptTag)));
      const pending=Array.from(new Set(practice.exercises.filter(e=>!answers.some(a=>a.exerciseId===e.id&&a.isCorrect)).map(e=>e.conceptTag)));
      try {
        const evidence = await completePractice(practice.id,{score,totalCorrect:answers.filter(a=>a.isCorrect).length,totalExercises:practice.exercises.length,mastered,pending,totalAttempts:answers.reduce((n,a)=>n+a.attemptsCount,0),...counts,supportEvents:supports});
        setServerEvidence(evidence);
        setPhase("results");say(`🏆 Reto completado. Respondiste ${answers.filter(a=>a.isCorrect).length} de ${practice.exercises.length} ejercicios correctamente. Tu esfuerzo y los apoyos que usaste quedan en tu evidencia.`,"celebrating");
      } catch { setSaveError("No se pudo guardar la evidencia. Vuelve a intentar; tus respuestas siguen aquí."); }
      finally { setSaving(false); }
    }
  }
  const tutor = <aside className="theme-card border-2 rounded-3xl p-5 space-y-4 text-center lg:sticky lg:top-36">
    <span className="text-xs font-bold">Tu Tutor MACHTIA · {subjectName(practice.subjectId)}</span>
    <div><TutorRobotAvatar size="xl" showGlow isSpeaking={speech.isSpeaking} emotion={emotion}/></div>
    <p aria-live="polite" className="text-left bg-white border rounded-2xl p-4 text-base text-slate-900">{dialogue}</p>
    <SpeechAudioButton textToSpeak={dialogue} label="Escuchar al Tutor" speech={speech}/>
  </aside>;
  return <div className="subject-shell space-y-5" data-subject={practice.subjectId}>
    <header className="theme-banner"><p className="text-xs font-bold uppercase">{subjectName(practice.subjectId)} · {practice.grade}° de primaria</p><h1 className="text-2xl font-black mt-1">{practice.topicName}</h1><p className="text-sm mt-2">{practice.learningObjective}</p></header>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-5 items-start">
      <div className="theme-card border-2 rounded-3xl p-5 sm:p-7 space-y-5">
        {phase === "intro" ? <><h2 className="text-xl font-bold">Nuestra misión</h2><p>{practice.instructions||practice.description}</p><div className="grid grid-cols-2 gap-3"><p className="bg-white border rounded-xl p-3 text-sm">{practice.exercises.length} retos cortos</p><p className="bg-white border rounded-xl p-3 text-sm">Aprox. {practice.estimatedMinutes} minutos</p></div><p className="text-sm">Tú haces los descubrimientos. Yo puedo darte pistas y mostrarte otra representación.</p><button className="theme-primary" onClick={begin}>Comenzar retos</button></> : phase === "questions" ? <>
          <div className="flex flex-wrap justify-between gap-2 text-sm"><h2 className="font-bold">Reto {index+1} de {practice.exercises.length}</h2><span>Intento {attempts} · {exercise.difficulty === "easy" ? "Inicial" : exercise.difficulty === "medium" ? "Intermedio" : "Desafío"}</span></div>
          <progress aria-label="Progreso de la práctica" value={index} max={practice.exercises.length} className="w-full h-2" style={{accentColor:"var(--subject)"}}/>
          {exercise.context&&<div className={`bg-white rounded-2xl p-4 border-2 ${exercise.activityKind==="reading"?"border-rose-200":"border-slate-200"}`}><p className="text-xs font-bold mb-2">{ACTIVITY_LABELS[exercise.activityKind||"choice"]}</p><p className="text-base leading-relaxed">{exercise.context}</p></div>}
          <h3 className="text-xl font-bold">{exercise.prompt}</h3>
          <div className="grid gap-3 sm:grid-cols-2">{exercise.options.map((option,i)=><button aria-pressed={choice===option} key={i} disabled={checked} className={`p-4 rounded-2xl text-left border-2 ${choice===option?"border-violet-600 bg-violet-50 ring-2 ring-violet-300":"bg-white border-slate-300 hover:border-violet-400"}`} onClick={()=>{setChoice(option);say(`Elegiste «${option}». ¿Qué pista de la pregunta sostiene tu elección? Cuando estés listo, comprueba tu respuesta.`,"thinking");}}><span className="text-xs font-bold block mb-1">{exercise.activityKind==="classification"?"Clasificar como":exercise.activityKind==="sequence"?"Comparar secuencia":"Opción"} {String.fromCharCode(65+i)}</span>{option}</button>)}</div>
          {!(checked && correct) && <SupportCoach key={exercise.id} exercise={exercise} initialSupport={practice.initialSupport} onSupport={e=>setSupports(s=>[...s,e])} onDialogue={text=>say(text,"hint")}/>}
          {checked&&<p role="status" className={`rounded-xl p-4 border ${correct?"bg-emerald-50 border-emerald-300 text-emerald-950":"bg-amber-50 border-amber-300 text-amber-950"}`}>{correct?"✨ Nueva idea aprendida. Puedes pasar al siguiente reto.":"Vamos otra vez. Puedes revisar tu elección con los apoyos."}</p>}
          {!checked?<button disabled={!choice} className="theme-primary" onClick={check}>Comprobar respuesta</button>:!correct && attempts < 3?<button className="support-button" onClick={()=>{setAttempts(a=>a+1);setChecked(false);setChoice(null);say("Prueba de nuevo. Observa qué aprendiste con la pista.","encouraging");}}>Volver a intentar</button>:<button disabled={saving} className="theme-primary" onClick={next}>{saving?"Guardando evidencia…":index+1<practice.exercises.length?"Siguiente reto":"Finalizar y ver progreso"}</button>}
          {saveError&&<p role="alert">{saveError}</p>}
        </> : <><h2 className="text-2xl font-black">🏆 Reto completado</h2><p className="text-5xl font-black text-emerald-700">{score}%</p><p>{answers.filter(a=>a.isCorrect).length} de {practice.exercises.length} aciertos · {answers.reduce((n,a)=>n+a.attemptsCount,0)} intentos</p><p className="text-sm">{baseline===undefined?"Primera medición: aún no hay diagnóstico inicial para comparar.":`${baseline}% → ${score}% · cambio ${score-baseline} puntos`}</p><p className="text-sm">{counts.hintsUsed} pistas · {counts.reexplanationsUsed} re-explicaciones. Tu profesor puede ver qué apoyo recibiste en cada reto.</p><button className="theme-primary" onClick={()=>{speech.stop();setRole("teacher");setActiveTeacherTab("evidences");onFinish();}}>Ver evidencia con mi profesor</button><button className="support-button ml-2" onClick={()=>{speech.stop();onFinish();}}>Volver a Mis Prácticas</button></>}
      </div>{tutor}
    </div>
  </div>;
}
