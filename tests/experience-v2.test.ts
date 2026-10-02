import { beforeEach, describe, expect, it } from "vitest";
import { createDraft, makeExercise, regenerateExercise, publishDraft, validateDraft, recommendPractice, SUBJECT_CATALOG, type DraftConfig } from "@/lib/learning/catalog";
import { supportDialogue, summarizeSupports } from "@/lib/learning/support";
import { repository } from "@/lib/data/repository";
import { listMcpTools } from "@/mcp/server/tools";
import type { SupportEvent } from "@/types";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const config: DraftConfig = { subjectId:"espanol",topicId:"comprension-lectora",recipientId:"mariana-lopez",grade:3,objective:"Identificar ideas usando evidencia del texto.",difficulty:"easy",exerciseCount:3,activityKind:"reading",initialSupport:"independent" };
beforeEach(()=>repository.resetOfficialDemoScenario());
describe("MACHTIA Experience 2.0",()=>{
  it.each(SUBJECT_CATALOG)("generates and assigns a valid $name practice without replacing the judge practice",subject=>{
    const draft=createDraft({...config,subjectId:subject.id,topicId:subject.topics[0].id});
    expect(validateDraft(draft)).toEqual([]);
    expect(repository.getPractices()).toHaveLength(1);
    const [practice]=publishDraft(draft);
    expect(practice.subjectId).toBe(subject.id);expect(practice.exercises).toHaveLength(3);
    expect(repository.getPracticesByStudent("mariana-lopez")).toContainEqual(practice);
    expect(repository.getPracticeById("prac-mariana-fracciones")?.exercises).toHaveLength(5);
  });
  it.each([2,3,4])("supports the primary demo grade %i with valid answers",grade=>{
    const draft=createDraft({...config,grade,subjectId:"matematicas",topicId:"operaciones"});
    expect(draft.exercises.every(e=>e.options.includes(e.correctAnswer))).toBe(true);
    expect(draft.exercises[0].prompt).toContain(String(grade*4));
  });
  it("keeps instructions, edits and the correct option on publication",()=>{
    const draft=createDraft(config);draft.instructions="Lee en voz baja y busca evidencia.";
    draft.exercises[0].prompt="Pregunta revisada por el profesor";
    draft.exercises[0].options[0]="Opción revisada";draft.exercises[0].correctAnswer="Opción revisada";
    const [practice]=publishDraft(draft);
    expect(practice.instructions).toBe(draft.instructions);expect(practice.exercises[0].prompt).toBe(draft.exercises[0].prompt);
    expect(practice.exercises[0].correctAnswer).toBe("Opción revisada");
    draft.exercises[0].prompt="Modificación posterior";expect(practice.exercises[0].prompt).not.toBe(draft.exercises[0].prompt);
  });
  it("regenerates only one exercise and preserves all other edits",()=>{
    const draft=createDraft(config);draft.exercises[1].prompt="Mi pregunta especial";
    const untouched=structuredClone(draft.exercises[1]); const originalId=draft.exercises[0].id;
    draft.exercises[0]=makeExercise(config,0,1);
    expect(draft.exercises[0].id).not.toBe(originalId);expect(draft.exercises[1]).toEqual(untouched);
  });
  it("regeneration changes the activity on every successive request",()=>{
    const original=makeExercise(config,0);
    const first=regenerateExercise(config,0,original);
    const second=regenerateExercise(config,0,first);
    expect(first.prompt).not.toBe(original.prompt);
    expect(second.prompt).not.toBe(first.prompt);
  });
  it("uses difficulty to change mathematical challenge and can regenerate grade two fractions",()=>{
    const base={...config,subjectId:"matematicas",topicId:"fracciones-equivalentes",grade:2};
    const easy=makeExercise(base,0);
    const hard=makeExercise({...base,difficulty:"hard"},0);
    expect(hard.prompt).not.toBe(easy.prompt);
    expect(regenerateExercise(base,0,easy).options).not.toEqual(easy.options);
  });
  it("supports addition, removal and reordering with final numbering",()=>{
    const draft=createDraft(config);draft.exercises.push(makeExercise(config,3));draft.exercises.splice(1,1);draft.exercises.reverse();
    const [practice]=publishDraft(draft);expect(practice.exercises.map(e=>e.questionNumber)).toEqual([1,2,3]);
    expect(practice.exercises[0].id).toBe(draft.exercises[0].id);
  });
  it("assigns separate copies to authorized group members",()=>{
    const practices=publishDraft(createDraft({...config,recipientId:"group"}));
    expect(practices).toHaveLength(5);expect(new Set(practices.map(p=>p.id)).size).toBe(5);
    practices[0].exercises[0].prompt="One student only";expect(practices[1].exercises[0].prompt).not.toBe("One student only");
  });
  it("rejects recipients outside the authorized group without saving anything",()=>{
    expect(()=>publishDraft(createDraft({...config,recipientId:"external-student"}))).toThrow(/autorizado/);
    expect(repository.getPractices()).toHaveLength(1);
  });
  it("blocks malformed answers and duplicate options before assignment",()=>{
    const draft=createDraft(config);draft.exercises[0].options=["Duplicada","Duplicada"];
    expect(validateDraft(draft).length).toBeGreaterThan(0);expect(()=>publishDraft(draft)).toThrow();expect(repository.getPractices()).toHaveLength(1);
  });
  it.each([0,11,-1,2.5])("rejects invalid exercise count %s",exerciseCount=>expect(()=>createDraft({...config,exerciseCount})).toThrow());
  it("does not invent a diagnosis for a new subject",()=>expect(recommendPractice(repository.getStudentById("mariana-lopez"),"espanol","comprension-lectora",[])).toBe("Sin datos suficientes para recomendar una práctica."));
  it("uses recorded learning gap evidence for a recommendation",()=>expect(recommendPractice(repository.getStudentById("mariana-lopez"),"matematicas","fracciones-equivalentes",[])).toContain("Evidencia del diagnóstico"));
  it("counts supports without successful answers",()=>{
    const events:SupportEvent[]=["verbal_hint","visual_hint","alternative_representation","guided_steps"].map(kind=>({exerciseId:"custom",kind:kind as SupportEvent["kind"],source:"requested",timestamp:"2026-10-02"}));
    expect(summarizeSupports(events)).toEqual({hintsUsed:2,reexplanationsUsed:2});expect(summarizeSupports([])).toEqual({hintsUsed:0,reexplanationsUsed:0});
  });
  it("does not disclose the answer or select it in support content",()=>{
    const exercise=createDraft(config).exercises[0];
    for(const kind of ["verbal_hint","visual_hint","alternative_representation","guided_steps"] as const)expect(supportDialogue(exercise,kind)).not.toContain(exercise.correctAnswer);
  });
  it("preserves the official asset bytes and the 15 MCP tools",()=>{
    expect(createHash("sha256").update(readFileSync("public/machtia-tutor-official.png")).digest("hex").toUpperCase()).toBe("4E4918A2B0B0931A4E9421667F339B6A6496182276FA04EDDE34592450DC1997");
    expect(listMcpTools()).toHaveLength(15);
  });
});
