# Dependency risk — 2026-10-05

Next 14 → 15.5.27; React 18 → 19; Vitest 2 → 4.1.11. The official Next 15 migration guide was followed; this project has no async cookies/headers/route-params migration requirement. PostCSS is overridden to 8.5.29. Rollup and esbuild are replaced by their official WASM packages to respect Windows Application Control. The SWC WASM package is also explicit for Windows builds.

`npm audit --omit=dev`: **0 vulnerabilities**. `npm audit`: **7 high findings** in the development glob chain: braces, micromatch, chokidar, fast-glob, Tailwind 3, @next/eslint-plugin-next and eslint-config-next. The leaf braces version remains 3.0.3; no fixed release was available in the registry during verification. A blind major Tailwind migration does not constitute a demonstrated fix for that leaf advisory.

These are retained with documented risk: build/lint tools operate on trusted repository patterns; no user-provided glob patterns are passed to them. Do not expose dev/watch/test servers publicly or run untrusted checkout configuration. Production does not load these tool paths to serve the tutor. Build jobs remain susceptible if their input configuration is malicious. Keep the upstream advisory under review and migrate once an actual compatible fix is available.

Raw evidence: npm-audit.json and npm-audit-runtime.json in this directory. This is an accepted development-tool limitation, not a claim that the full dependency audit is clean. Native Windows binary loading remains prohibited; no system policy was changed.
