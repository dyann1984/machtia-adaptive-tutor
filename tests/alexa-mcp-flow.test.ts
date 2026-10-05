import { describe,it,expect,beforeEach,afterEach } from "vitest";
import { harness,solve } from "./server-harness";
let h: Awaited<ReturnType<typeof harness>>;beforeEach(async()=>{h=await harness();});afterEach(async()=>{await h.close();});
describe("Server-authoritative learning evidence",()=>{
  it.each([0,3,4,5])("calculates %i correct answers without trusting completion flags",async n=>{
    const p=await solve(h,n);const r=await h.call("complete_practice",{practiceId:p.id,studentId:p.studentId,answers:p.exercises.map((e:any)=>({exerciseId:e.id,isCorrect:true,studentAnswer:"wrong",attemptsCount:1}))});
    expect(r.body.result.isError).toBe(false);const result=r.body.result.structuredContent;expect(result.finalScore).toBe(n*20);expect(result.initialScore).toBe(52);expect(result.improvementDelta).toBe(n*20-52);expect(result.evidence.totalAttempts).toBe(n+(5-n)*3);
    await h.role("teacher");const state=await h.state();const evidence=state.evidences.find((e:any)=>e.practiceId===p.id);expect(evidence.id).toBe(result.evidenceId);expect(evidence.finalScore).toBe(result.finalScore);
    const report=await h.call("get_practice_result",{practiceId:p.id,studentId:p.studentId});expect(report.body.result.structuredContent.evidenceId).toBe(evidence.id);
    const teacher=await h.call("report_progress_to_teacher",{studentId:p.studentId,subjectId:p.subjectId});expect(teacher.body.result.structuredContent.evidenceId).toBe(evidence.id);
  });
  it("rejects completion before any recorded attempts",async()=>{await h.role("student");const r=await h.call("complete_practice",{practiceId:"prac-mariana-fracciones",studentId:"mariana-lopez",answers:[{exerciseId:"ex-frac-1",isCorrect:true}]});expect(r.body.result.isError).toBe(true);expect((await h.state()).practices[0].status).toBe("pending");});
  it("returns the same evidence on repeated completion",async()=>{const p=await solve(h,4);const a=await h.call("complete_practice",{practiceId:p.id,studentId:p.studentId});const b=await h.call("complete_practice",{practiceId:p.id,studentId:p.studentId});expect(a.body.result.structuredContent.evidenceId).toBe(b.body.result.structuredContent.evidenceId);expect((await h.state()).evidences.filter((e:any)=>e.practiceId===p.id)).toHaveLength(1);});
  it("does not invent evidence before completion",async()=>{const r=await h.call("get_practice_result",{practiceId:"prac-mariana-fracciones",studentId:"mariana-lopez"});expect(r.body.result.structuredContent.finalScore).toBeNull();expect(r.body.result.structuredContent.verifiedInTeacherDashboard).toBe(false);});
  it("rejects malformed nested answers",async()=>{const r=await h.call("complete_practice",{practiceId:"prac-mariana-fracciones",studentId:"mariana-lopez",answers:[{exerciseId:"x",isCorrect:"true"}]});expect(r.body.result.structuredContent.error).toBe("INVALID_PARAMS");});
  it("isolates two judges",async()=>{const other=await harness();try{await solve(h,5);await h.call("complete_practice",{practiceId:"prac-mariana-fracciones",studentId:"mariana-lopez"});expect((await other.state()).practices[0].status).toBe("pending");expect((await other.state()).students[0].topicPerformances["fracciones-equivalentes"]).toBe(52);}finally{await other.close();}});
});
