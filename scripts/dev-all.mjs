#!/usr/bin/env node
/**
 * MACHTIA Adaptive Tutor - Concurrent Dev Runner (MCP + Next.js)
 * Zero external dependencies. Cross-platform (Windows & Linux/macOS).
 */

import { spawn } from "node:child_process";
import process from "node:process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\n=========================================================");
console.log("🚀 Starting MACHTIA Adaptive Tutor + Real MCP Server");
console.log("   • MCP Server: http://localhost:3100/mcp (Streamable HTTP)");
console.log("   • Web UI:     http://localhost:3000");
console.log("=========================================================\n");

// 1. Spawn MCP Server
const mcpProcess = spawn(npmCmd, ["run", "mcp:start"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, MCP_PORT: "3100" },
});

mcpProcess.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[36m[MCP Server]\x1b[0m ${data.toString()}`);
});

mcpProcess.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[31m[MCP Server Error]\x1b[0m ${data.toString()}`);
});

// 2. Spawn Next.js Dev Server
const devProcess = spawn(npmCmd, ["run", "dev"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_MCP_URL: "http://localhost:3100/mcp" },
});

devProcess.stdout.on("data", (data) => {
  process.stdout.write(`\x1b[32m[Next.js UI]\x1b[0m ${data.toString()}`);
});

devProcess.stderr.on("data", (data) => {
  process.stderr.write(`\x1b[33m[Next.js UI]\x1b[0m ${data.toString()}`);
});

function cleanup() {
  console.log("\nShutting down dev processes...");
  try {
    mcpProcess.kill();
    devProcess.kill();
  } catch (e) {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
