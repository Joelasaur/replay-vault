import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Keep test credentials out of Lovable's tracked `.env`. Existing shell/CI
// variables take precedence, then `.env.test.local`, then `.env` fills in
// public Supabase/Vite configuration that is shared with the application.
loadEnv({ path: ".env.test.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  timeout: 10_000,
  expect: {
    timeout: 5_000,
  },
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  // Only auto-start dev server when running against localhost.
  webServer: BASE_URL.includes("localhost")
    ? {
        command: "bun run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 30_000,
      }
    : undefined,
});
