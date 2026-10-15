import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = process.env.INTEGRATOR_API_ROOT;
if (!apiRoot) throw new Error("Set INTEGRATOR_API_ROOT to the gosintegrator-api checkout for end-to-end tests.");
const dataDirectory = mkdtempSync(path.join(tmpdir(), "integrator-e2e-"));
const env = {
  ...process.env,
  DataDirectory: dataDirectory,
  Admin__Email: "e2e@example.invalid",
  Admin__Password: "Test-Only-E2E-Password-9Z!",
  ASPNETCORE_ENVIRONMENT: "Testing",
  ASPNETCORE_URLS: "http://127.0.0.1:5081",
  Catalog__SeedDemo: "true",
  DOTNET_USE_POLLING_FILE_WATCHER: "1",
  WATCHPACK_POLLING: "true",
  NEXT_DIST_DIR: ".next-e2e",
  API_URL: "http://127.0.0.1:5081",
  Logging__LogLevel__Default: "Warning",
};
const api = spawn(
  process.env.DOTNET_COMMAND ?? "dotnet",
  [
    "run",
    "--no-build",
    "--project",
    "src/Integrator.Api",
    "--no-launch-profile",
  ],
  { cwd: apiRoot, env, stdio: "inherit" },
);
let web;
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  api.kill();
  web?.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
api.on("error", (error) => {
  console.error(error.message);
  stop();
  process.exitCode = 1;
});
for (let attempt = 0; attempt < 100; attempt++) {
  try {
    if ((await fetch("http://127.0.0.1:5081/api/health")).ok) break;
  } catch {}
  if (attempt === 99) {
    stop();
    throw new Error("Test API did not start");
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
}
web = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/next/dist/bin/next"),
    "dev",
    "--webpack",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  { cwd: root, env, stdio: "inherit" },
);
web.on("exit", stop);
