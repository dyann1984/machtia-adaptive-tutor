import http from "node:http";
import { listMcpTools, executeMcpTool } from "./tools";
import { authenticate, createDemoSession, issueActor, judgeSession, runAsActor } from "./session";
import { publishDraft } from "@/lib/learning/catalog";
import { ledger } from "./learning-ledger";
import { miaAgent } from "@/lib/ai/mia-agent";
export interface TransportConfig { port: number; host?: string; corsOrigin?: string; webHandler?: http.RequestListener }
export const PROTOCOL_VERSION = "2025-11-25";
export const SERVER_NAME = "machtia-tutor-mcp-server";
export const SERVER_VERSION = "1.1.0";
async function readBody(req: http.IncomingMessage) {
  let size = 0; const parts: Buffer[] = [];
  for await (const chunk of req) { size += chunk.length; if (size > 128 * 1024) throw Object.assign(new Error("Request body too large"), { statusCode: 413 }); parts.push(Buffer.from(chunk)); }
  try { return JSON.parse(Buffer.concat(parts).toString("utf8")); } catch { throw Object.assign(new Error("Invalid JSON"), { statusCode: 400 }); }
}
export function createMcpHttpServer(config: TransportConfig): http.Server {
  return http.createServer(async (req, res) => {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    const api = pathname.startsWith("/api/");
    const controlled = api || ["/health", "/healthz", "/mcp", "/sse", "/mcp/stream"].includes(pathname);
    if (!controlled && config.webHandler) { config.webHandler(req, res); return; }
    const send = (status: number, value?: unknown) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(value === undefined ? undefined : JSON.stringify(value)); };
    const origin = req.headers.origin;
    const allowed = (process.env.MCP_ALLOWED_ORIGINS || config.corsOrigin || "http://localhost:3000,http://127.0.0.1:3000,https://machtia-tutor-mcp-server.onrender.com,http://machtia-tutor-mcp-server.onrender.com,https://machtia-adaptive-tutor.onrender.com,http://machtia-adaptive-tutor.onrender.com,https://machtia-adaptive-tutor.vercel.app").split(",").map(s => s.trim()).filter(s => s && !s.includes("*"));
    if (origin && !allowed.includes(origin)) { send(403, { error: "Origin forbidden" }); return; }
    if (origin) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, MCP-Protocol-Version, MCP-Session-Id, X-Demo-Control");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method === "OPTIONS") { send(204); return; }
    try {
      if (req.method === "GET" && ["/health", "/healthz"].includes(pathname)) {
        send(200, { status: "ok", protocolVersion: PROTOCOL_VERSION, transport: "Streamable HTTP", server: SERVER_NAME, version: SERVER_VERSION, toolsCount: listMcpTools().length,
          commit: process.env.RENDER_GIT_COMMIT || process.env.BUILD_SHA || null, dataMode: "isolated-ephemeral-demo", aiProvider: "deterministic", timestamp: new Date().toISOString() }); return;
      }
      if (req.method === "POST" && pathname === "/api/demo") {
        await readBody(req); const { session, actorToken } = createDemoSession(); send(201, { judgeToken: session.judgeToken, actorToken, expiresAt: session.expires, mode: "isolated-demo" }); return;
      }
      if (req.method === "POST" && pathname === "/api/role") {
        const session = judgeSession(String(req.headers["x-demo-control"] || ""));
        if (!session) { send(403, { error: "Judge controller capability required" }); return; }
        const body = await readBody(req);
        if (!["teacher", "student"].includes(body.role)) { send(400, { error: "Invalid role" }); return; }
        send(200, { actorToken: issueActor(session, body.role, body.role === "teacher" ? session.repository.getTeacher().id : body.studentId) }); return;
      }
      if (req.method === "POST" && pathname === "/api/mia") {
        const body = await readBody(req);
        const { message, mode, practiceContext } = body || {};
        const reply = await miaAgent.respond(String(message || ""), mode || "free", practiceContext);
        send(200, reply);
        return;
      }
      const actor = authenticate((req.headers.authorization || "").replace(/^Bearer /, ""));
      if (api) {
        if (!actor) { send(401, { error: "Authenticated demo actor required" }); return; }
        if (req.method === "POST" && pathname === "/api/support") {
          const body = await readBody(req);
          const practice = actor.session.repository.getPracticeById(body.practiceId);
          if (!practice || actor.role !== "student" || practice.studentId !== actor.id || practice.status === "completed" || !practice.exercises.some(e => e.id === body.exerciseId)) { send(403, { error: "Support resource forbidden" }); return; }
          if (!["verbal_hint", "visual_hint", "alternative_representation", "guided_steps"].includes(body.kind)) throw new Error("Invalid support kind");
          runAsActor(actor, () => ledger(practice.id).supports.push({ exerciseId: body.exerciseId, kind: body.kind, source: "requested", timestamp: new Date().toISOString() }));
          send(200, { recorded: true }); return;
        }
        if (req.method === "GET" && pathname === "/api/state") {
          const r = actor.session.repository;
          const practices = r.getPractices().filter(p => actor.role === "teacher" || p.studentId === actor.id);
          send(200, { teacher: r.getTeacher(), group: r.getGroup(), subject: r.getSubject(), students: r.getStudents().filter(s => actor.role === "teacher" || s.id === actor.id),
            practices: practices.map(p => actor.role === "teacher" ? p : { ...p, exercises: p.exercises.map(e => ({ ...e, correctAnswer: "", explanation: "", alternativeExplanation: "", guidedExample: "", hint: "Revisa la estrategia del tema antes de elegir." })) }),
            evidences: r.getEvidences().filter(e => actor.role === "teacher" || e.studentId === actor.id), actionLogs: actor.role === "teacher" ? r.getActionLogs() : [] }); return;
        }
        if (req.method === "POST" && pathname === "/api/practices") {
          if (actor.role !== "teacher") { send(403, { error: "Teacher role required" }); return; }
          const draft = await readBody(req);
          if (!draft || !Array.isArray(draft.exercises) || draft.exercises.length > 20 || !draft.config) throw new Error("Invalid draft");
          for (const e of draft.exercises) if (!e || !Array.isArray(e.options) || !e.options.includes(e.correctAnswer) || new Set(e.options).size !== e.options.length) throw new Error("Invalid exercise options");
          const result = runAsActor(actor, () => publishDraft(draft)); send(200, result); return;
        }
        send(404, { error: "Endpoint not found" }); return;
      }
      if (pathname !== "/mcp") { send(404, { error: "Endpoint not found" }); return; }
      if (req.method === "GET") { send(405, { error: "Server has no unsolicited event stream; use POST" }); return; }
      if (req.method !== "POST") { send(405, { error: "Method not allowed" }); return; }
      const accept = req.headers.accept || "";
      if (!accept.includes("application/json") || !accept.includes("text/event-stream")) { send(406, { error: "Accept must include application/json and text/event-stream" }); return; }
      if (!req.headers["content-type"]?.includes("application/json")) { send(415, { error: "Content-Type must be application/json" }); return; }
      const version = req.headers["mcp-protocol-version"];
      if (version && version !== PROTOCOL_VERSION) { send(400, { error: "Unsupported MCP protocol version" }); return; }
      const message = await readBody(req);
      if (!message || Array.isArray(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string" || message.id === null || message.id !== undefined && typeof message.id !== "string" && typeof message.id !== "number") { send(400, { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }); return; }
      if (message.id === undefined) {
        if (message.method.startsWith("notifications/")) { send(202); return; }
        send(400, { error: "Request id required" }); return;
      }
      const reply = (result: unknown) => send(200, { jsonrpc: "2.0", id: message.id, result });
      if (message.method === "initialize") { reply({ protocolVersion: PROTOCOL_VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }, instructions: "Isolated educational demo. Obtain scoped actor capability via POST /api/demo. Alexa+ experience is simulated." }); return; }
      if (message.method === "ping") { reply({}); return; }
      if (message.method === "tools/list") { reply({ tools: listMcpTools() }); return; }
      if (message.method === "tools/call") {
        if (!actor) { send(401, { error: "Authenticated actor required" }); return; }
        if (typeof message.params?.name !== "string" || !message.params.arguments || typeof message.params.arguments !== "object" || Array.isArray(message.params.arguments)) { send(400, { error: "Invalid tool arguments" }); return; }
        reply(await runAsActor(actor, () => executeMcpTool(message.params.name, message.params.arguments))); return;
      }
      send(200, { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Method not found" } });
    } catch (error: any) { if (!res.headersSent) send(error.statusCode || 400, { error: error.message || "Request failed" }); }
  });
}
