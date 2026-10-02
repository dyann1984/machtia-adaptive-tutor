import assert from "node:assert/strict";
import fs from "node:fs";

const base = process.env.SMOKE_BASE_URL || "https://machtia-tutor-mcp-server.onrender.com";
const checks = [];
let id = 0;
async function rpc(method, params) {
  const response = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mcp-protocol-version": "2025-11-25" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
    signal: AbortSignal.timeout(60000),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(!body.error, JSON.stringify(body));
  checks.push({ method, name: params?.name, passed: true });
  return body.result;
}
async function tool(name, args) {
  const result = await rpc("tools/call", { name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));
  return result.structuredContent;
}
const health = await fetch(`${base}/health`).then((r) => r.json());
assert.equal(health.toolsCount, 15);
assert.equal((await rpc("initialize", { protocolVersion: "2025-11-25", clientInfo: { name: "production-smoke", version: "1" } })).protocolVersion, "2025-11-25");
assert.equal((await rpc("tools/list", {})).tools.length, 15);
const studentId = "mariana-lopez";
await tool("analyze_student_performance", { groupId: "grupo-3b", subjectId: "matematicas" });
await tool("find_students_needing_support", { groupId: "grupo-3b", subjectId: "matematicas", threshold: 65 });
await tool("get_student_learning_gap", { studentId, subjectId: "matematicas", topicId: "fracciones-equivalentes" });
await tool("get_student_context", { studentId });
const generated = await tool("generate_adaptive_practice", { studentId, topicId: "fracciones-equivalentes", exerciseCount: 5 });
const practiceId = generated.practiceId;
assert.ok(practiceId);
await tool("assign_practice_to_student", { studentId, practiceId });
const assigned = await tool("get_assigned_practice", { studentId, status: "pending" });
assert.ok(assigned.practices.some((p) => p.practiceId === practiceId));
await tool("start_practice", { studentId, practiceId });
const shared = { studentId, practiceId, exerciseId: "ex-frac-1" };
const wrong = await tool("submit_answer", { ...shared, studentAnswer: "3/4", attemptNumber: 1 });
assert.equal(wrong.isCorrect, false);
assert.equal(wrong.supportLevel, "hint");
await tool("get_hint", shared);
const wrong2 = await tool("submit_answer", { ...shared, studentAnswer: "3/4", attemptNumber: 2 });
assert.equal(wrong2.supportLevel, "alternative_explanation");
await tool("get_adaptive_explanation", { ...shared, level: "analogy" });
const answers = [];
for (const [exerciseId, studentAnswer] of [["ex-frac-1", "dos cuartos"], ["ex-frac-2", "comer dos partes"], ["ex-frac-3", "Sí"], ["ex-frac-4", "24"], ["ex-frac-5", "2/3"]]) {
  const result = await tool("submit_answer", { studentId, practiceId, exerciseId, studentAnswer, attemptNumber: exerciseId === "ex-frac-1" ? 3 : 1 });
  assert.equal(result.isCorrect, true, JSON.stringify(result));
  answers.push({ exerciseId, studentAnswer: result.recognizedAnswer, isCorrect: result.isCorrect });
}
const denied = await rpc("tools/call", { name: "submit_answer", arguments: { ...shared, studentAnswer: "2/4", attemptNumber: 1, requesterId: "luis-hernandez", requesterRole: "student" } });
assert.equal(denied.isError, true);
const completed = await tool("complete_practice", { studentId, practiceId, answers });
assert.equal(completed.finalScore, 100);
assert.ok(completed.evidenceId);
const persisted = await tool("get_practice_result", { studentId, practiceId });
assert.equal(persisted.finalScore, 100);
await tool("get_student_progress", { studentId });
await tool("report_progress_to_teacher", { studentId });
fs.mkdirSync("docs/evidence", { recursive: true });
fs.writeFileSync("docs/evidence/production-mcp-smoke.json", JSON.stringify({ timestamp: new Date().toISOString(), base, health, checks, completed, persisted, idorDenied: denied.isError }, null, 2));
console.log(JSON.stringify({ base, passed: checks.length, finalScore: completed.finalScore, evidenceId: completed.evidenceId, idorDenied: denied.isError }));

