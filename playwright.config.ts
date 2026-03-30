import { defineConfig, devices } from "@playwright/test"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, ".env.test") })

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // share one DB — avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  globalSetup: "./playwright/global-setup.ts",

  projects: [
    // Auth setup — must run first, saves cookies
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },

    // Public tests — no auth required
    {
      name: "public",
      testMatch: /portal\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Authenticated tests — reuse saved auth state
    {
      name: "authenticated",
      testMatch: /e2e\/(events|event-flow|settings)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
    },
  ],
})
