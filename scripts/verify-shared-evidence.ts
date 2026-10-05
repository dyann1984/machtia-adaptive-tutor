import assert from "node:assert/strict";
import fs from "node:fs";
import { McpClient } from "../lib/mcp/client";
import { createMcpHttpServer } from "../mcp/server/transport";
import { createDraft } from "../lib/learning/catalog";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
async function main() {
  const server=createMcpHttpServer({port:0});await new Promise<void>(r=>server.listen(0,"127.0.0.1",r));
  const base=process.env.VERIFY_BASE_URL || `http://127.0.0.1:${(server.address() as {port:number}).port}`;
  try {
    const web=new McpClient(base+"/mcp");await web.initializeDemo();
    const draft=createDraft({subjectId:"matematicas",topicId:"fracciones-equivalentes",grade:3,objective:"Conservar el valor al transformar una fracción",recipientId:"mariana-lopez",exerciseCount:5,difficulty:"easy",activityKind:"choice",initialSupport:"verbal"});
    const [practice]=await web.demoApi("/api/practices",draft);
    await web.selectRole("student",practice.studentId);
    const started=await web.startPractice(practice.id,practice.studentId);assert.match(started.result.alexaSpeechPrompt,/Antes de comenzar/);
    for(let i=0;i<practice.exercises.length;i++) {
      const e=practice.exercises[i];
      if(i===0){const wrong=await web.submitAnswer(practice.id,e.id,"wrong",1,practice.studentId);assert.equal(wrong.result.isCorrect,false);const hint=await web.getHint(e.id,practice.studentId,{practiceId:practice.id});assert.ok(!hint.result.hint.includes(e.correctAnswer));}
      assert.equal((await web.submitAnswer(practice.id,e.id,e.correctAnswer,i===0?2:1,practice.studentId)).result.isCorrect,true);
    }
    const finished=await web.completePractice(practice.id,practice.studentId);const webEvidence=finished.result.evidence;
    await web.selectRole("teacher",practice.studentId);
    const teacher=(await web.snapshot()).evidences.find((e:any)=>e.id===webEvidence.id);
    const simulator=(await web.getPracticeResult(practice.id,practice.studentId)).result.evidence;
    // Official client uses the SAME authenticated demo actor, not a new isolated scenario.
    const actorState=await web.demoApi("/api/role",{role:"teacher",studentId:practice.studentId});
    const sdk=new Client({name:"shared-evidence-audit",version:"1"});await sdk.connect(new StreamableHTTPClientTransport(new URL(base+"/mcp"),{requestInit:{headers:{Authorization:"Bearer "+actorState.actorToken}}}));
    const result=await sdk.callTool({name:"get_practice_result",arguments:{practiceId:practice.id,studentId:practice.studentId}});
    const mcp=(result.structuredContent as any).evidence;await sdk.close();
    for(const e of [teacher,mcp,simulator]) assert.deepEqual(e,webEvidence);
    const proof={timestamp:new Date().toISOString(),base,scope:"HTTP E2E; browser UI verification recorded separately",practiceId:practice.id,evidenceId:webEvidence.id,WEB:webEvidence.finalScore,TEACHER:teacher.finalScore,MCP:mcp.finalScore,ALEXA_SIMULATOR:simulator.finalScore,totalAttempts:webEvidence.totalAttempts,hintsUsed:webEvidence.hintsUsed,allFieldsEqual:true};
    fs.mkdirSync("docs/repair-2026-10-05",{recursive:true});fs.writeFileSync("docs/repair-2026-10-05/shared-evidence-http.json",JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
  }finally{await new Promise<void>(r=>{server.close(()=>r());server.closeAllConnections();});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
