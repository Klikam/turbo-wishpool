import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 3100;
const STUB_PORT = 4010;
const BASE_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Tests share one stub backend and reset its state, so they run in turn.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `node e2e/stub-backend.mjs ${STUB_PORT}`,
      url: `http://127.0.0.1:${STUB_PORT}/api/auth/get-session`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm exec next dev --port ${WEB_PORT}`,
      env: {
        BACKEND_URL: `http://127.0.0.1:${STUB_PORT}`,
        SITE_URL: BASE_URL,
        // Not .next: that belongs to `pnpm dev`, which may be running.
        NEXT_DIST_DIR: ".next-e2e",
      },
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
