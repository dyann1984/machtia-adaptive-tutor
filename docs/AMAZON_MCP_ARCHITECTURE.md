# MCP architecture — repaired 2026-10-05

A custom Streamable HTTP transport exposes 15 real MCP tools. Initialize/list/call are verified with the official MCP SDK client. GET /mcp returns 405 because this stateless server does not send unsolicited SSE events. POST notifications return 202. JSON-RPC requires version 2.0 and valid IDs; arrays/batches are rejected. Requests require JSON Content-Type and the two MCP Accept types. Bodies are limited to 128 KiB; unknown protocol versions and disallowed Origins are rejected.

## Trusted identity and isolated data

The server creates a synthetic demo sandbox in POST /api/demo. Opaque cryptographically random bearer actor tokens bind server-side role and student ID. The separate judge controller capability intentionally exchanges personas within that sandbox. It is not an institutional authentication system. Student tokens cannot call teacher tools, read another student's evidence, spoof system/teacher, or access exercises belonging to another student's practice. Caller-supplied identity fields never grant authority.

AsyncLocalStorage selects the session repository for each call. Browser repository data is a refreshed presentation snapshot; localStorage is not evidence authority. Teacher drafts may be saved locally, but publication is performed by the authorized server endpoint. Each demo has its own repository and learning ledger and expires after four hours. Restarting the service loses the ephemeral demo. No real student information should be entered.

## Server-authoritative grading

The ledger captures available baseline once, records normalized answers and correctness from the stored exercise, and derives attempt numbers rather than trusting the caller's attempt number. Exercises must be resolved in order. Three unsuccessful recorded attempts allow moving forward with an incorrect result. Correct answers and retries are counted separately. Completion requires all exercises to be resolved; supplied isCorrect flags cannot change the ledger. Finalization stores an attempt plus one evidence and returns that same evidence on repeats.

All channels read that same evidence: web completion, teacher snapshot/report, get_practice_result and the simulator's real MCP call. No evidence means no finalScore or fabricated improvement. A topic without a diagnostic is marked Primera medición, with baselineAvailable false and no claimed comparative improvement. Requested and automatic support are recorded by the server in the selected practice.

## Teaching and simulator

The browser teaches with an interactive fraction explanation. The simulator provides an introduction before its first exercise, then traverses all exercises, retries and progressive support. It can query completed web practices. Supports provide conceptual guidance or an analogous example rather than the current answer. Difficulty labels describe the exercise bank; adaptive support is real rule-based behavior, while generative LLM adaptation is not implemented.

## Amazon classification

REAL: MCP server, official SDK compatibility tests, tool execution, oral text normalization, scoped demo actors, grading and shared evidence.
SIMULATED: Alexa+ conversation UI, Echo-inspired presentation and browser speech synthesis.
DEMO DATA: names, school, teacher and diagnostic baselines.
NOT IMPLEMENTED: Bedrock inference, native Alexa+/Echo registration, institutional login, durable multi-tenant database and deployment in Amazon preview tooling.

Official contest references: https://amazonappdev2026.devpost.com/ and https://amazonappdev2026.devpost.com/details/faqs . Simulation acceptance is not a claim of native deployment or personal eligibility.
