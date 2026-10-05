# Devpost submission draft — MACHTIA

## One-line description
A teacher-to-student learning demo where progressive support produces server-verified evidence shared by a web dashboard and an Alexa+ experience simulator over MCP.

## Problem and solution
A diagnostic score does not by itself tell a teacher how to support a struggling student. MACHTIA connects a synthetic class diagnosis to curated practice, an explanation before assessment, progressive conceptual support, recorded retries and one evidence the teacher can inspect.

## What was built and verified
The Next.js web app has teacher and student views and a practice composer. A real MCP server exposes 15 tools. Its scoped synthetic demo sessions reject anonymous protected calls, identity spoofing and cross-student access. The server evaluates the actual normalized answer against the assigned exercise and records attempts; it does not trust isCorrect or a caller-supplied score. Repeated completion returns one evidence.

The Alexa+ client is a simulation that calls that real server. It traverses all exercises and can retrieve the evidence created in the browser. It requires no Echo or Amazon account. The demo tutor is deterministic; no Bedrock inference or native Alexa+ deployment is claimed. Data and diagnostic baselines are synthetic.

A verified HTTP journey produced five correct exercises, six attempts and two hints, with exactly the same evidence across web contract, teacher snapshot, official MCP SDK and simulator MCP contract. A separately verified browser journey displayed 100% in the student view, teacher view and actual get_practice_result response in the simulator. Scores are calculated, not fixed at 80%. These examples do not demonstrate learning efficacy in a real classroom.

## Technology and limitations
Next.js 15.5.27, React 19, TypeScript, custom Streamable HTTP MCP transport and official MCP SDK compatibility tests. Browser speech synthesis supports the simulation. Demo state is isolated but ephemeral for four hours or until restart. Institutional authentication, durable school storage and Amazon preview integration are not implemented. Full dependency audit retains seven high development-tool findings; runtime audit is clean. Asset redistribution permission remains separately documented.

## Judging links
- Demo: https://machtia-tutor-mcp-server.onrender.com/?demo=judge
- Repository: https://github.com/dyann1984/machtia-adaptive-tutor
- Run instructions and judge flow: README.md
- Proof and deployment status: docs/repair-2026-10-05/

## External fields still requiring the participant
Add a publicly accessible English video under three minutes, verify current contest rules and participant eligibility, submit the honest Amazon developer feedback, complete Devpost fields and confirm artwork rights. This draft is not a submitted entry. The optional Open Source Mini Challenge requires its own qualifying contribution/project and evidence; the main repo alone is not claimed to satisfy it.
