import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Load environment variables from .env.local and .env
loadEnvConfig(process.cwd());

const PORT = process.env.PORT || 3005;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    serviceWorkers: "block",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT} -H 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      PORT: String(PORT),
      AUTH_SECRET: process.env.AUTH_SECRET || "68f7854474e1b40796d17d84d6ae231a8c6319d30aaf144e0b2ecd6e92966afe",
    },
  },
});
