// playwright.config.ts

import { defineConfig, devices } from "@playwright/test";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Manually load .env.test BEFORE the config is evaluated.
const envPath = path.resolve(process.cwd(), ".env.test");
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const TEST_PORT = 3100;
const baseURL = process.env.BASE_URL ?? `http://localhost:${TEST_PORT}`;
const isRemote = Boolean(process.env.BASE_URL);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL,
    // WATCH THE BROWSER DO THE WORK
    headless: true,
    launchOptions: {
      slowMo: 0,
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "storefront",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/customer.json",
      },
      dependencies: ["setup"],
      testMatch: /tests\/storefront\/(?!guest\/).*\.spec\.ts/,
    },
    {
      name: "storefront-guest",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /tests\/storefront\/guest\/.*\.spec\.ts/,
    },
    {
      name: "admin",
      use: { ...devices["Desktop Chrome"], storageState: ".auth/admin.json" },
      dependencies: ["setup"],
      testMatch: /tests\/admin\/.*\.spec\.ts/,
    },
    { name: "api", testMatch: /tests\/api\/.*\.spec\.ts/ },
  ],

  webServer: isRemote
    ? undefined
    : {
        command: `next dev -p ${TEST_PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
        // THIS IS THE CRUCIAL LINE: forces Next.js to use the test DB
        env: process.env as Record<string, string>,
      },
});
