import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Windows Application Control may reject native SWC. Select official WASM
// before Next loads bindings. Linux/Render keeps the native compiler.
const env = { ...process.env };
if (process.platform === "win32") env.NEXT_TEST_WASM = "1";
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), ...process.argv.slice(2)], { stdio: "inherit", env });
child.on("exit", code => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
