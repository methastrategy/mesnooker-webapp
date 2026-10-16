import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Load environment variables from .env.local and .env
loadEnvConfig(process.cwd());

const PORT = process.env.PORT || 3005;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

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
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      PORT: String(PORT),
      AUTH_SECRET: process.env.AUTH_SECRET || "68f7854474e1b40796d17d84d6ae231a8c6319d30aaf144e0b2ecd6e92966afe",
    },
  },
});
