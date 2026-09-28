import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { startMcpServer, stopMcpServer } from "../mcp/server/index";
import { listMcpTools, executeMcpTool } from "../mcp/server/tools";
import { validateToolArguments, MCP_TOOLS_SCHEMAS } from "../mcp/server/schemas";
import { McpClient } from "../lib/mcp/client";
import { repository } from "../lib/data/repository";

const TEST_PORT = 3198;
const TEST_MCP_URL = `http://localhost:${TEST_PORT}/mcp`;

describe("MACHTIA Adaptive Tutor - MCP Real Server & Streamable HTTP Tests", () => {
  let server: http.Server;

  beforeAll(async () => {
    repository.resetToInitialState();
    server = await startMcpServer(TEST_PORT);
  });

  afterAll(async () => {
    await stopMcpServer(server);
  });

  it("1. Servidor MCP inicia correctamente y responde a initialize con protocolo 2025-11-25", async () => {
    const res = await fetch(TEST_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-init",
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          clientInfo: { name: "test-runner", version: "1.0.0" },
        },
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe("test-init");
    expect(data.result.protocolVersion).toBe("2025-11-25");
    expect(data.result.serverInfo.name).toBe("machtia-tutor-mcp-server");
    expect(data.result.capabilities.tools).toBeDefined();
  });

  it("2. Endpoint de salud /health responde con estado ok y transport Streamable HTTP", async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.protocolVersion).toBe("2025-11-25");
    expect(data.transport).toBe("Streamable HTTP");
    expect(data.toolsCount).toBeGreaterThanOrEqual(7);
  });

  it("3. tools/list registra correctamente las herramientas pedagógicas requeridas", async () => {
    const res = await fetch(TEST_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-tools-list",
        method: "tools/list",
      }),
    });

    const data = await res.json();
    expect(data.result.tools).toBeDefined();
    const toolNames = data.result.tools.map((t: any) => t.name);

    expect(toolNames).toContain("analyze_student_performance");
    expect(toolNames).toContain("find_students_needing_support");
    expect(toolNames).toContain("get_student_learning_gap");
    expect(toolNames).toContain("generate_adaptive_practice");
    expect(toolNames).toContain("assign_practice_to_student");
    expect(toolNames).toContain("get_student_progress");
    expect(toolNames).toContain("report_progress_to_teacher");
  });

  it("4. Schemas validan inputs y detectan parámetros faltantes o tipos incorrectos", () => {
    // Missing required groupId
    const invalidRes = validateToolArguments("analyze_student_performance", {
      subjectId: "matematicas",
    });
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.errors[0]).toContain("groupId");

    // Invalid type for threshold
    const invalidTypeRes = validateToolArguments("find_students_needing_support", {
      groupId: "grupo-3b",
      threshold: "sesenta y cinco" as any,
    });
    expect(invalidTypeRes.valid).toBe(false);
    expect(invalidTypeRes.errors[0]).toContain("number");

    // Valid parameters
    const validRes = validateToolArguments("generate_adaptive_practice", {
      studentId: "mariana-lopez",
      topicId: "fracciones-equivalentes",
      initialDifficulty: "easy",
      exerciseCount: 5,
    });
    expect(validRes.valid).toBe(true);
    expect(validRes.errors).toHaveLength(0);
  });

  it("5. find_students_needing_support devuelve a Mariana López y Luis Hernández con sus evidencias", async () => {
    const res = await fetch(TEST_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-support",
        method: "tools/call",
        params: {
          name: "find_students_needing_support",
          arguments: {
            groupId: "grupo-3b",
            subjectId: "matematicas",
            threshold: 65,
          },
        },
      }),
    });

    const data = await res.json();
    expect(data.result.isError).toBe(false);
    const content = data.result.structuredContent;
    expect(content.students).toBeDefined();

    const studentNames = content.students.map((s: any) => s.name);
    expect(studentNames).toContain("Mariana López");
    expect(studentNames).toContain("Luis Hernández");

    const mariana = content.students.find((s: any) => s.studentId === "mariana-lopez");
    expect(mariana.score).toBe(52);
    expect(mariana.topicName).toBe("Fracciones equivalentes");
    expect(mariana.evidence).toBeDefined();
  });

  it("6. get_student_learning_gap devuelve la materia y tema correctos para Mariana", async () => {
    const res = await fetch(TEST_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-gap",
        method: "tools/call",
        params: {
          name: "get_student_learning_gap",
          arguments: {
            studentId: "mariana-lopez",
            subjectId: "matematicas",
          },
        },
      }),
    });

    const data = await res.json();
    expect(data.result.isError).toBe(false);
    const gap = data.result.structuredContent;
    expect(gap.studentName).toBe("Mariana López");
    expect(gap.subject).toBe("Matemáticas");
    expect(gap.topicName).toBe("Fracciones equivalentes");
    expect(gap.learningGap).toContain("denominadores");
  });

  it("7. generate_adaptive_practice genera una práctica válida con estado pending", async () => {
    const res = await fetch(TEST_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-gen",
        method: "tools/call",
        params: {
          name: "generate_adaptive_practice",
          arguments: {
            studentId: "mariana-lopez",
            topicId: "fracciones-equivalentes",
            initialDifficulty: "easy",
            exerciseCount: 5,
          },
        },
      }),
    });

    const data = await res.json();
    expect(data.result.isError).toBe(false);
    const practice = data.result.structuredContent;
    expect(practice.practiceId).toBeDefined();
    expect(practice.exerciseCount).toBe(5);
    expect(["pending", "assigned"]).toContain(practice.status);
    expect(practice.exercises).toHaveLength(5);
  });

  it("8. assign_practice_to_student cambia el estado a assigned y lo asocia al estudiante", async () => {
    const genCall = await executeMcpTool("generate_adaptive_practice", {
      studentId: "mariana-lopez",
      topicId: "fracciones-equivalentes",
    });
    const practiceId = genCall.structuredContent?.practiceId;

    const assignRes = await fetch(TEST_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-assign",
        method: "tools/call",
        params: {
          name: "assign_practice_to_student",
          arguments: {
            practiceId,
            studentId: "mariana-lopez",
          },
        },
      }),
    });

    const data = await assignRes.json();
    expect(data.result.isError).toBe(false);
    expect(data.result.structuredContent.success).toBe(true);
    expect(["assigned", "pending"]).toContain(data.result.structuredContent.status);
  });

  it("9. McpClient invoca herramientas reales sobre Streamable HTTP con source 'mcp'", async () => {
    const client = new McpClient(TEST_MCP_URL);

    // Verify connection check
    const status = await client.checkConnection();
    expect(status.connected).toBe(true);
    expect(status.protocolVersion).toBe("2025-11-25");

    // Call tool via client
    const toolCall = await client.findStudentsNeedingSupport("grupo-3b", "matematicas", 65);
    expect(toolCall.source).toBe("mcp");
    expect(toolCall.isError).toBe(false);
    expect(toolCall.result.students.length).toBeGreaterThanOrEqual(2);
  });

  it("10. Errores MCP están controlados ante herramientas desconocidas o inputs no conformes", async () => {
    const res = await fetch(TEST_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-unknown-tool",
        method: "tools/call",
        params: {
          name: "non_existent_tool_xyz",
          arguments: {},
        },
      }),
    });

    const data = await res.json();
    expect(data.result.isError).toBe(true);
    expect(data.result.structuredContent.error).toBeDefined();
  });

  it("11. Fallback Mock continúa funcionando transparentemente cuando el servidor MCP está apagado", async () => {
    // Unreachable client port
    const offlineClient = new McpClient("http://localhost:9999/mcp");

    const status = await offlineClient.checkConnection();
    expect(status.connected).toBe(false);

    // Call tool on offline client -> should fall back gracefully without throwing
    const fallbackCall = await offlineClient.findStudentsNeedingSupport("grupo-3b", "matematicas", 65);
    expect(fallbackCall.source).toBe("local-fallback");
    expect(fallbackCall.isError).toBe(false);
    expect(fallbackCall.result.students).toBeDefined();
    expect(fallbackCall.result.students.length).toBe(2);
  });
});
