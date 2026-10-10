import { NextRequest, NextResponse } from "next/server";
import { listMcpTools, executeMcpTool } from "@/mcp/server/tools";
import { authenticate, createDemoSession, issueActor, judgeSession, runAsActor } from "@/mcp/server/session";
import { publishDraft } from "@/lib/learning/catalog";
import { ledger } from "@/mcp/server/learning-ledger";

export const DEFAULT_RENDER_BACKEND = "https://machtia-tutor-mcp-server.onrender.com";

export function getBackendBaseUrl(): string {
  return process.env.MCP_BACKEND_URL || process.env.NEXT_PUBLIC_MCP_URL?.replace(/\/mcp\/?$/, "") || DEFAULT_RENDER_BACKEND;
}

/**
 * High-Availability In-Process MCP Execution Engine:
 * Serves MCP JSON-RPC 2.0 and pedagogical endpoints locally in Next.js.
 * This guarantees instantaneous responses (<10ms) and prevents the app
 * from hanging when external hosting services (like Render free tier) are cold-starting.
 */
export async function handleInProcessMcp(req: NextRequest, targetPath: string): Promise<Response> {
  const normalizedPath = targetPath.toLowerCase().replace(/\/+$/, "");

  // 1. Health check
  if (normalizedPath === "/health" || normalizedPath === "/healthz") {
    return NextResponse.json({
      status: "ok",
      protocolVersion: "2025-11-25",
      transport: "Streamable HTTP (Next.js Edge / Node.js High-Availability)",
      server: "machtia-tutor-mcp-server",
      version: "1.1.0",
      toolsCount: listMcpTools().length,
      commit: process.env.RENDER_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_SHA || null,
      dataMode: "isolated-ephemeral-demo",
      aiProvider: "deterministic-educational",
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Demo session creation
  if (normalizedPath === "/api/demo" && req.method === "POST") {
    const { session, actorToken } = createDemoSession();
    return NextResponse.json(
      {
        judgeToken: session.judgeToken,
        actorToken,
        expiresAt: session.expires,
        mode: "isolated-demo",
      },
      { status: 201 }
    );
  }

  // 3. Demo role switching
  if (normalizedPath === "/api/role" && req.method === "POST") {
    const judgeToken = String(req.headers.get("x-demo-control") || "");
    const session = judgeSession(judgeToken);
    if (!session) {
      return NextResponse.json({ error: "Judge controller capability required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    if (!["teacher", "student"].includes(body?.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const actorToken = issueActor(
      session,
      body.role,
      body.role === "teacher" ? session.repository.getTeacher().id : body.studentId
    );
    return NextResponse.json({ actorToken });
  }

  // Auth resolver for protected educational routes
  const authHeader = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const actor = authenticate(authHeader);

  // 4. Student support ledger
  if (normalizedPath === "/api/support" && req.method === "POST") {
    if (!actor) {
      return NextResponse.json({ error: "Authenticated demo actor required" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const practice = actor.session.repository.getPracticeById(body?.practiceId);
    if (
      !practice ||
      actor.role !== "student" ||
      practice.studentId !== actor.id ||
      practice.status === "completed" ||
      !practice.exercises.some((e) => e.id === body?.exerciseId)
    ) {
      return NextResponse.json({ error: "Support resource forbidden" }, { status: 403 });
    }
    if (!["verbal_hint", "visual_hint", "alternative_representation", "guided_steps"].includes(body?.kind)) {
      return NextResponse.json({ error: "Invalid support kind" }, { status: 400 });
    }
    runAsActor(actor, () =>
      ledger(practice.id).supports.push({
        exerciseId: body.exerciseId,
        kind: body.kind,
        source: "requested",
        timestamp: new Date().toISOString(),
      })
    );
    return NextResponse.json({ recorded: true });
  }

  // 5. Educational state snapshot
  if (normalizedPath === "/api/state" && req.method === "GET") {
    if (!actor) {
      return NextResponse.json({ error: "Authenticated demo actor required" }, { status: 401 });
    }
    const r = actor.session.repository;
    const practices = r.getPractices().filter((p) => actor.role === "teacher" || p.studentId === actor.id);
    return NextResponse.json({
      teacher: r.getTeacher(),
      group: r.getGroup(),
      subject: r.getSubject(),
      students: r.getStudents().filter((s) => actor.role === "teacher" || s.id === actor.id),
      practices: practices.map((p) =>
        actor.role === "teacher"
          ? p
          : {
              ...p,
              exercises: p.exercises.map((e) => ({
                ...e,
                correctAnswer: "",
                explanation: "",
                alternativeExplanation: "",
                guidedExample: "",
                hint: "Revisa la estrategia del tema antes de elegir.",
              })),
            }
      ),
      evidences: r.getEvidences().filter((e) => actor.role === "teacher" || e.studentId === actor.id),
      actionLogs: actor.role === "teacher" ? r.getActionLogs() : [],
    });
  }

  // 6. Teacher practice composer publication
  if (normalizedPath === "/api/practices" && req.method === "POST") {
    if (!actor) {
      return NextResponse.json({ error: "Authenticated demo actor required" }, { status: 401 });
    }
    if (actor.role !== "teacher") {
      return NextResponse.json({ error: "Teacher role required" }, { status: 403 });
    }
    const draft = await req.json().catch(() => null);
    if (!draft || !Array.isArray(draft.exercises) || draft.exercises.length > 20 || !draft.config) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }
    for (const e of draft.exercises) {
      if (
        !e ||
        !Array.isArray(e.options) ||
        !e.options.includes(e.correctAnswer) ||
        new Set(e.options).size !== e.options.length
      ) {
        return NextResponse.json({ error: "Invalid exercise options" }, { status: 400 });
      }
    }
    const result = runAsActor(actor, () => publishDraft(draft));
    return NextResponse.json(result);
  }

  // 7. Core MCP JSON-RPC 2.0 Endpoint (/mcp)
  if (normalizedPath === "/mcp" || normalizedPath === "/api/mcp") {
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed. MCP requires POST." }, { status: 405 });
    }
    const message = await req.json().catch(() => null);
    if (
      !message ||
      Array.isArray(message) ||
      message.jsonrpc !== "2.0" ||
      typeof message.method !== "string" ||
      message.id === null ||
      (message.id !== undefined && typeof message.id !== "string" && typeof message.id !== "number")
    ) {
      return NextResponse.json(
        { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } },
        { status: 400 }
      );
    }

    if (message.id === undefined) {
      if (message.method.startsWith("notifications/")) {
        return new Response(null, { status: 202 });
      }
      return NextResponse.json({ error: "Request id required" }, { status: 400 });
    }

    const reply = (result: unknown) =>
      NextResponse.json({ jsonrpc: "2.0", id: message.id, result });

    if (message.method === "initialize") {
      return reply({
        protocolVersion: "2025-11-25",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "machtia-tutor-mcp-server", version: "1.1.0" },
        instructions: "Isolated educational demo. Integrated High-Availability MCP Engine.",
      });
    }

    if (message.method === "ping") {
      return reply({});
    }

    if (message.method === "tools/list") {
      return reply({ tools: listMcpTools() });
    }

    if (message.method === "tools/call") {
      if (!actor) {
        return NextResponse.json({ error: "Authenticated actor required" }, { status: 401 });
      }
      if (
        typeof message.params?.name !== "string" ||
        !message.params.arguments ||
        typeof message.params.arguments !== "object" ||
        Array.isArray(message.params.arguments)
      ) {
        return NextResponse.json({ error: "Invalid tool arguments" }, { status: 400 });
      }
      try {
        const toolResult = await runAsActor(actor, () =>
          executeMcpTool(message.params.name, message.params.arguments)
        );
        return reply(toolResult);
      } catch (err: any) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: message.id,
            error: {
              code: err?.statusCode === 403 ? -32003 : -32603,
              message: err?.message || "Error ejecutando herramienta pedagógica",
            },
          },
          { status: err?.statusCode || 500 }
        );
      }
    }

    return NextResponse.json({ error: "Method not found" }, { status: 404 });
  }

  return NextResponse.json({ error: `Ruta ${targetPath} no encontrada` }, { status: 404 });
}

export async function proxyToBackend(req: NextRequest, targetPath: string): Promise<Response> {
  const backendBase = getBackendBaseUrl();
  const isExternalBackend =
    Boolean(process.env.MCP_BACKEND_URL) ||
    (!backendBase.includes("localhost") && !backendBase.includes("127.0.0.1"));

  // If no external dedicated backend is explicitly configured or if we are in local/standalone mode,
  // execute in-process directly for peak performance (<5ms response time)
  if (!isExternalBackend) {
    return handleInProcessMcp(req, targetPath);
  }

  const targetUrl = new URL(targetPath, backendBase);

  // Preserve query parameters
  req.nextUrl.searchParams.forEach((val, key) => {
    targetUrl.searchParams.set(key, val);
  });

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const demoControl = req.headers.get("x-demo-control");
  if (demoControl) headers.set("x-demo-control", demoControl);

  const mcpVersion = req.headers.get("mcp-protocol-version") || req.headers.get("x-mcp-protocol-version");
  if (mcpVersion) headers.set("mcp-protocol-version", mcpVersion);

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  headers.set("Origin", backendBase);

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {
      body = null;
    }
  }

  try {
    // 3.5-second fast timeout: If Render is cold-starting, do not leave user hanging!
    const res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });

    const resContentType = res.headers.get("content-type") || "";
    const resBody = await res.text();

    // If backend returns HTML or spin-up error (502/503/504), activate in-process fallback seamlessly!
    const isHtmlResponse =
      resContentType.includes("text/html") ||
      resBody.trim().startsWith("<!DOCTYPE") ||
      resBody.trim().startsWith("<html");

    const isSpinUpError = res.status === 502 || res.status === 503 || res.status === 504;

    if (isHtmlResponse || isSpinUpError) {
      console.warn(
        `[BackendProxy] Render backend devolvió HTTP ${res.status} o HTML para ${targetPath}. Activando fallback in-process de alta disponibilidad.`
      );
      return handleInProcessMcp(req, targetPath);
    }

    return new Response(resBody, {
      status: res.status,
      headers: {
        "content-type": resContentType || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (err: any) {
    // Timeout or network unreachable on Render: activate in-process fallback immediately!
    console.warn(
      `[BackendProxy] Conexión a Render expiró o falló para ${targetPath} (${err?.message || "Timeout"}). Activando fallback in-process de alta disponibilidad.`
    );
    return handleInProcessMcp(req, targetPath);
  }
}
