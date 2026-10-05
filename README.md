# MACHTIA Adaptive Tutor

MACHTIA is an educational demo built for Amazon Build, Ship, Shape. A teacher assigns a practice, a student explores a concept and receives progressive support, and the server records attempts and generates one learning evidence shared by the web dashboard, MCP and the Alexa+ experience simulator.

**Classification:** MCP server and HTTP execution are real. Alexa+ conversation and browser voice are simulated. Students, diagnoses and school information are synthetic demo data. The tutor uses a deterministic router and curated exercise bank. Bedrock, a native Alexa+ deployment, real school authentication and durable institutional storage are not implemented.

## Run locally

Use Node.js 22.19+ and npm. No Amazon credentials or Echo device are required.

```sh
npm ci
npm run dev:all
```

Open `http://localhost:3000/?demo=judge`. Development serves the web on 3000 and MCP on 3100. For one production-style service:

```sh
npm run build
npm run start:render
```

Production-style web, APIs and MCP share port 3000. `/health` reports protocol, 15 tools, deterministic mode, ephemeral data mode and deployed commit when `RENDER_GIT_COMMIT` is available. Render configuration is in `render.yaml`. The deployed service is [MACHTIA](https://machtia-tutor-mcp-server.onrender.com/?demo=judge); deployment verification is tracked in `docs/repair-2026-10-05/`.

## Judge flow

1. Open Judge Mode. Each new demo is isolated. Use Options → restart to deliberately create a fresh scenario.
2. Create a practice for Mariana from the teacher dashboard, or use Practices → composer to edit and assign a teacher draft.
3. Enter as student, complete the explanation, submit an incorrect option, request support, retry, and resolve every exercise.
4. Each exercise closes with a correct answer or three recorded unsuccessful attempts. The server, rather than client flags, determines correctness and final score.
5. Complete the practice and open teacher evidence. Consult the same completed practice in the Alexa+ simulator with “How did Mariana do?”
6. Compare the evidence ID, final score, baseline availability, attempts, support events and concepts. A 100% result is possible only with five recorded correct exercises; it is not preset. A recovered wrong answer contributes an additional attempt.

The simulator can also start an assigned practice and traverse all exercises with written answers or oral transcripts. “Listen” uses browser speech synthesis when available. It does not imply a microphone, Echo or Amazon speech integration.

## MCP client contract

`POST /mcp` implements Streamable HTTP JSON responses with protocol `2025-11-25`. Requests use `Content-Type: application/json` and `Accept: application/json, text/event-stream`. Initialized notifications return 202. No unsolicited SSE stream is implemented; GET returns 405. Invalid Origins are denied rather than merely omitting CORS headers; payloads are bounded to 128 KiB.

Initialize, ping, health and tool discovery are public. Protected tools require an opaque scoped demo actor bearer capability. `POST /api/demo` creates a fresh synthetic sandbox and returns a judge controller capability and teacher actor. `POST /api/role` requires that separate controller capability to intentionally switch demo personas. Sending `requesterRole`, `requesterId` or a tenant cannot override the authenticated actor. A student actor alone cannot become a teacher. The public demo controller is not institutional login or production RBAC for real students.

The controller and actor are kept in this browser tab's sessionStorage so a reload can reuse the demo. Sessions expire after four hours or a service restart. Results live in server memory; do not use the deployment to store real student records. Offline calls fail explicitly and do not fabricate local evidence.

The official `@modelcontextprotocol/sdk` client is exercised by integration tests. Details: `docs/AMAZON_MCP_ARCHITECTURE.md`.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm audit
npm audit --omit=dev
```

Windows tooling uses official WASM packages for Rollup, esbuild and SWC; no Windows protection is disabled. `scripts/run-next.mjs` selects SWC WASM before Next loads bindings on Windows; Linux uses its normal compiler. Next.js is 15.5.27, React is 19 and Vitest is 4.1.11. Full audit has seven high findings in the development glob/Tailwind/ESLint chain through `braces`; runtime audit has zero. See `docs/repair-2026-10-05/DEPENDENCY_RISK.md` for scope and mitigation.

## Licensing and submission

Project-authored source and documentation use MIT (`LICENSE`). Existing artwork and branding are excluded pending provenance verification; see `docs/ASSET_PROVENANCE.md`. A public repository alone does not resolve redistribution rights for every asset.

Submission text, a recording script and honest Amazon feedback draft are in `docs/DEVPOST_SUBMISSION.md`, `docs/VIDEO_DEMO_SCRIPT.md` and `docs/AMAZON_FEEDBACK.md`. Final video publication, feedback submission, Devpost entry and any separate Open Source Mini Challenge contribution are external steps; they have not been claimed as complete.
