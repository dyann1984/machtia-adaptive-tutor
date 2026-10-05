import { createMcpHttpServer } from "@/mcp/server/transport";
import type { Server } from "node:http";
export const rpcHeaders = { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" };
export async function harness() {
  const server: Server = createMcpHttpServer({ port: 0 });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const demo = await fetch(base + "/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(r => r.json());
  let token: string = demo.actorToken;
  return {
    base, demo, token: () => token,
    close: () => new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }),
    async role(role: "teacher" | "student", studentId = "mariana-lopez") {
      const res = await fetch(base + "/api/role", { method: "POST", headers: { "Content-Type": "application/json", "X-Demo-Control": demo.judgeToken }, body: JSON.stringify({ role, studentId }) });
      const body = await res.json(); token = body.actorToken; return token;
    },
    async call(name: string, args: Record<string, unknown>, authenticated = true) {
      const response = await fetch(base + "/mcp", { method: "POST", headers: { ...rpcHeaders, ...(authenticated ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method: "tools/call", params: { name, arguments: args } }) });
      return { status: response.status, body: await response.json() };
    },
    async state() { return fetch(base + "/api/state", { headers: { Authorization: "Bearer " + token } }).then(r => r.json()); },
  };
}
export async function solve(h: Awaited<ReturnType<typeof harness>>, correctCount: number) {
  const p = (await h.state()).practices[0];
  await h.role("student", p.studentId);
  await h.call("start_practice", { practiceId: p.id, studentId: p.studentId });
  for (let i = 0; i < p.exercises.length; i++) {
    const e = p.exercises[i];
    for (let n = 1; n <= (i < correctCount ? 1 : 3); n++) {
      const r = await h.call("submit_answer", { practiceId: p.id, studentId: p.studentId, exerciseId: e.id, studentAnswer: i < correctCount ? e.correctAnswer : "respuesta incorrecta", attemptNumber: n });
      if (r.body.result?.isError) throw new Error(JSON.stringify(r.body));
    }
  }
  return p;
}
