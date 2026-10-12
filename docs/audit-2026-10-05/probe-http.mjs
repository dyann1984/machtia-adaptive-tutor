import fs from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const endpoint='http://127.0.0.1:3000/mcp';
const findings=[];
async function tool(name,args) {
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})});
 return (await response.json()).result;
}
const unauth=await tool('get_student_context',{studentId:'mariana-lopez'});
findings.push({probe:'Unauthenticated student profile read',confirmed:unauth.isError===false});
const spoof=await tool('get_student_context',{studentId:'mariana-lopez',requesterRole:'teacher',requesterId:'luis-hernandez'});
findings.push({probe:'Caller can self-declare teacher role',confirmed:spoof.isError===false});
const gen=await tool('generate_adaptive_practice',{studentId:'mariana-lopez',topicId:'fracciones-equivalentes',exerciseCount:5});
const practiceId=gen.structuredContent.practiceId;
const fabricated=await tool('complete_practice',{practiceId,studentId:'mariana-lopez',answers:gen.structuredContent.exercises.map(e=>({exerciseId:e.id,isCorrect:true,studentAnswer:'WRONG UNSUBMITTED ANSWER'}))});
findings.push({probe:'Unsubmitted wrong answers marked correct yield 100%',confirmed:fabricated.structuredContent.finalScore===100,score:fabricated.structuredContent.finalScore});
const client=new Client({name:'official-sdk-audit',version:'1'},{capabilities:{}});
try {
 await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
 const list=await client.listTools();
 findings.push({probe:'Official MCP SDK connect and listTools',passed:list.tools.length===15,count:list.tools.length});
}catch(error){findings.push({probe:'Official MCP SDK connect and listTools',passed:false,error:error.message});}
finally {await client.close().catch(()=>{});}
fs.writeFileSync('docs/audit-2026-10-05/local-probes.json',JSON.stringify(findings,null,2));
console.log(JSON.stringify(findings,null,2));
