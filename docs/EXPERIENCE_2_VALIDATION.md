# MACHTIA Experience 2.0 — validation

Extends production commit `30b0b8e` on the existing Render service `srv-datcvj2d0e5s73bjorbg`. No new service, domain, or MCP tool is required.

## Implemented

- Five subject themes and an extensible primary-school activity catalog: Mathematics, Spanish, Science, History, English.
- Teacher configuration, editable questions/options/instructions/difficulty, addition/removal/reordering, single-question regeneration, saved drafts and individual/group assignment.
- Learner objective, duration, status, contextual dialogue and permanent progressive help during unsolved challenges.
- Verbal/visual hints, alternative pizza/blocks or reasoning maps, guided microsteps; current dialogue compatible with existing es-MX speech and cancellation.
- Actual answers, attempts and support events feed teacher evidence. Subjects without a baseline show a first measurement rather than an invented improvement.
- Official robot image preserved (SHA256 `4e4918a2b0b0931a4e9421667f339b6a6496182276fa04edde34592450dc1997`).

## Local validation

- 94 tests passed: original 69 plus 25 Experience 2.0 regressions.
- TypeScript, ESLint and optimized Next.js build passed.
- Teacher → edit → assign → learner → help → complete → teacher evidence tested in browser for Spanish. Result: 2/2, 3 attempts, 3 hints and 2 re-explanations; 5 support events.
- Science editor tested: regenerate, add, reorder, remove, edit answer/options and difficulty. Assignment persists after reload in `?mode=teacher`.
- English saved draft recovered after reload; guided microstep updates both support and robot dialogue; completed 1/1.
- Official judge tour: visual discovery, three incorrect attempts, five correct exercises, 52 → 100 (+48), 8 attempts, 1 hint, 2 re-explanations.
- Teacher editor and learner checked at 390×844, 820×1180, 1440×900 and 1920×1080. No horizontal overflow or controls outside page width. Long editor content uses multiline fields.
- HTTP smoke: /health, handshake, all 15 tools, 24 RPC checks, actual result/evidence and denied IDOR. Separate security audit: 8/8 checks. Alexa MCP suite: 16/16.

## Boundaries

The five-subject editor uses a transparent, reviewable demo bank for grades 2–4. It does not claim live AI generation. Custom assignments, drafts and evidence use existing browser-local persistence; they do not sync between devices or add subject capabilities to the existing Alexa/MCP contracts. Judge mode intentionally restores its reproducible scenario. Speech availability depends on the browser's voices.

Production deployment and browser smoke results are recorded separately after Render finishes.
