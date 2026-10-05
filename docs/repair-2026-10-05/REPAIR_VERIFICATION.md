# Repair verification — 2026-10-05

Baseline audit is preserved. No prior application edits were restored or reverted. The ignored .repair-backup-20261005 directory preserves the initial local changes. Existing modified artwork, screenshot files and unrelated capture scripts are intentionally retained as local work.

## Critical corrections

P0: scoped server identities; anonymous protected reads rejected; student IDOR and identity spoofing rejected; independent judge controller capability for intentional demo role exchange; isolated repositories; server-recorded grading; no trust in completion flags; complete-all-exercises gate; idempotent evidence; one shared evidence for web/teacher/MCP/simulator; no fabricated result before completion.

P1: progressive support avoids direct answer output; practice-scoped support handles reused exercise IDs; no-baseline topics are first measurements; full simulator traversal and completed-web-evidence lookup; strict MCP Origin/headers/JSON-RPC/notifications/body limits; official SDK client test; Next/React/PostCSS/Vitest updates; reproducible Windows WASM toolchain; visible failures rather than local evidence fallback; mobile navigation; truthful provider/AI/Alexa labels; source-code MIT license with asset exclusions.

## Verification evidence

The final local suite reports **91 tests / 91 passed / 0 failed**, across nine files. Raw Vitest report: tests-final.json. It contains unit, integration, security/adversarial and official MCP client tests. HTTP E2E is an additional executed scenario, not counted as a Vitest test. Lint, TypeScript, npm ci and runtime dependency audit passed. Build completed with official SWC WASM in Windows.

HTTP E2E: teacher publication → introduction → wrong answer → requested hint → retry → all five exercises → completion → teacher snapshot → official SDK → simulator MCP contract. All fields in the four evidence objects compare equal. See shared-evidence-http.json for that run's exact IDs and scores.

Browser journey: teacher generated/assigned a new practice; student completed the visual explanation; wrong answer and conceptual support; retry; five correct exercises; web 100%, teacher 100%, real MCP get_practice_result displayed by simulator 100%. Evidence ID: evi-a91ecdda-ee46-42fd-af8a-e7f9b23d8524. Captures: screenshots/web-result.png, teacher-result.png, alexa-mcp-result.png. A subsequently discovered requested-support scope bug was fixed and regression tested; this older journey had one intervention due to that former bug and is not claimed as the final support-counter regression proof.

Independent full simulator browser journey: all five exercises, one wrong answer, requested hint and successful retry; evidence evi-be7e273f-4ae5-456a-a8dc-5f47b8bca817, score 100%, 52% baseline, +48 points, two interventions. See screenshots/simulator-full-completion.png. The teacher retrieved that same result.

Mobile: at 390 px, all seven teacher tabs visible; document width 385 px, no horizontal overflow. Capture: screenshots/mobile-navigation.png.

## Adversarial outcomes

| Attack | Verified outcome |
|---|---|
| Anonymous protected context read | HTTP 401 |
| Student sends teacher/system identity in tool args | Tool error; no authority granted |
| Actor without judge controller requests teacher exchange | HTTP 403 |
| Student reads another student's evidence/context | Denied |
| Student accesses another practice's support | Denied |
| Completion flags mark all wrong recorded answers true | Actual final score remains 0% |
| Completion without resolved recorded exercises | Rejected; practice remains pending |
| Repeated completion | Same evidence ID; one evidence |
| Two independent judges | Repository and progress remain isolated |
| Host spoof plus hostile Origin | HTTP 403 |
| Invalid Accept/protocol/JSON-RPC IDs/batches/oversized body | Rejected |
| Initialized notification | HTTP 202 |

## Remaining boundaries

No institutional auth, durable database, actual Bedrock inference or native Alexa+ deployment. The intentionally public controller creates only a new synthetic sandbox. This is not security certification for real school data.

Full audit retains seven high development-tool findings (braces chain); runtime audit is zero. See DEPENDENCY_RISK.md and the raw audit JSON. Artwork redistribution rights remain unverified and excluded from MIT; see ../ASSET_PROVENANCE.md.

Deployment is authorized only after critical gates pass. This committed report records local proof; live production SHA and post-deployment verification must be recorded separately and must not be inferred from this report. External video, feedback submission, Devpost and optional additional Open Source Mini Challenge contribution remain participant steps. SUBMISSION READY is not claimed solely from passing local tests.
