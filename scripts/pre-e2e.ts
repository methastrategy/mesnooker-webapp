// scripts/pre-e2e.ts — Pre-flight cleanup for E2E tests
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function runPreE2E() {
  if (process.env.TEST_WORKER_INDEX || process.env.PRE_E2E_RAN === "1") {
    return;
  }
  process.env.PRE_E2E_RAN = "1";

  const port = process.env.PORT || "3005";

  // 1. Terminate leftover processes listening on port
  try {
    if (process.platform === "win32") {
      const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8" });
      for (const line of stdout.split("\n")) {
        if (line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== String(process.pid)) {
            try {
              console.log(`[pre-e2e] Freeing port ${port} by terminating PID ${pid}`);
              execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
            } catch {}
          }
        }
      }
    } else {
      execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null || true`);
    }
  } catch {}

  // 2. Ensure Next.js production build exists
  const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
  if (!fs.existsSync(buildIdPath)) {
    console.log("[pre-e2e] No Next.js production build found. Running 'npm run build'...");
    execSync("npm run build", { stdio: "inherit" });
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && path.basename(process.argv[1]).startsWith("pre-e2e")) {
  runPreE2E();
}
