import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { harness, rpcHeaders } from "./server-harness";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
let h: Awaited<ReturnType<typeof harness>>;
beforeEach(async()=>{h=await harness();});afterEach(async()=>{await h.close();});
describe("MCP strict transport and scoped authorization",()=>{
  it("SDK initializes, lists 15 tools and calls an authenticated tool",async()=>{
    const client = new Client({name:"test-sdk",version:"1"});
    await client.connect(new StreamableHTTPClientTransport(new URL(h.base+"/mcp"),{requestInit:{headers:{Authorization:"Bearer "+h.token()}}}));
    expect((await client.listTools()).tools).toHaveLength(15);
    expect((await client.callTool({name:"get_student_context",arguments:{studentId:"mariana-lopez"}})).isError).toBe(false);await client.close();
  });
  it("rejects anonymous profile reads",async()=>{expect((await h.call("get_student_context",{studentId:"mariana-lopez"},false)).status).toBe(401);});
  it("rejects student IDOR",async()=>{await h.role("student");expect((await h.call("get_student_context",{studentId:"luis-hernandez"})).body.result.structuredContent.error).toBe("IDOR_FORBIDDEN");});
  it("rejects caller role spoofing",async()=>{await h.role("student");expect((await h.call("get_student_context",{studentId:"luis-hernandez",requesterRole:"teacher"})).body.result.isError).toBe(true);});
  it("rejects system role spoofing",async()=>{await h.role("student");expect((await h.call("get_student_context",{studentId:"mariana-lopez",requesterRole:"system"})).body.result.isError).toBe(true);});
  it("rejects student teacher tool invocation",async()=>{await h.role("student");expect((await h.call("generate_adaptive_practice",{studentId:"mariana-lopez",topicId:"fracciones-equivalentes"})).body.result.isError).toBe(true);});
  it("requires judge capability for role exchange",async()=>{const r=await fetch(h.base+"/api/role",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+h.token()},body:'{"role":"teacher"}'});expect(r.status).toBe(403);});
  it("denies hostile Origin on reads and mutations",async()=>{const r=await fetch(h.base+"/api/demo",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://evil.example"},body:"{}"});expect(r.status).toBe(403);});
  it("requires both MCP Accept media types",async()=>{const r=await fetch(h.base+"/mcp",{method:"POST",headers:{"Content-Type":"application/json"},body:'{"jsonrpc":"2.0","id":1,"method":"initialize"}'});expect(r.status).toBe(406);});
  it.each([{},[],{jsonrpc:"1.0",id:1,method:"ping"},{jsonrpc:"2.0",id:null,method:"ping"},{jsonrpc:"2.0",id:{x:1},method:"ping"},{jsonrpc:"2.0",id:true,method:"ping"}])("rejects malformed JSON-RPC %j",async body=>{const r=await fetch(h.base+"/mcp",{method:"POST",headers:rpcHeaders,body:JSON.stringify(body)});expect(r.status).toBe(400);});
  it("does not derive trusted Origin from caller Host",async()=>{const r=await fetch(h.base+"/api/demo",{method:"POST",headers:{"Content-Type":"application/json",Origin:"http://evil.example",Host:"evil.example"},body:"{}"});expect(r.status).toBe(403);});
  it("accepts initialized notification with 202",async()=>{const r=await fetch(h.base+"/mcp",{method:"POST",headers:rpcHeaders,body:'{"jsonrpc":"2.0","method":"notifications/initialized"}'});expect(r.status).toBe(202);});
  it("rejects oversized body",async()=>{const r=await fetch(h.base+"/mcp",{method:"POST",headers:rpcHeaders,body:JSON.stringify({blob:"x".repeat(130*1024)})});expect(r.status).toBe(413);});
  it("rejects unsupported protocol version",async()=>{const r=await fetch(h.base+"/mcp",{method:"POST",headers:{...rpcHeaders,"MCP-Protocol-Version":"wrong"},body:'{"jsonrpc":"2.0","id":1,"method":"ping"}'});expect(r.status).toBe(400);});
});
