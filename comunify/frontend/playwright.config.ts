import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Playwright corre como proceso Node separado — no lee .env automáticamente.
// Sin esto, clerk.setup.ts ve E2E_CLERK_USER_EMAIL=undefined.
dotenv.config({ path: path.resolve(__dirname, "../.env.dev") });
dotenv.config({ path: path.resolve(__dirname, ".env.e2e"), override: true });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3003",
    trace: "on-first-retry",
  },
  projects: [
    // Setup — clerk.setup.ts (serial). Genera playwright/.clerk/user.json (storageState).
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      retries: 1,
      timeout: 180_000,
    },
    // Shell-organism — specs autenticados (pre-auth vía storageState). Depende de setup.
    {
      name: "shell-organism",
      testMatch: /e2e\/shell-organism\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },
    // Smoke project — all *.smoke.spec.ts on Desktop Chrome
    {
      name: "smoke",
      testMatch: /.*\.smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Responsive projects — spec § 9 breakpoints
    {
      name: "mobile",
      testMatch: /.*\/responsive\/.*\.smoke\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "tablet",
      testMatch: /.*\/responsive\/.*\.smoke\.spec\.ts/,
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop",
      testMatch: /.*\/responsive\/.*\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    // A11y project — axe-core scans
    {
      name: "a11y",
      testMatch: /.*\/a11y\/.*\.smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Regression project — design system + a11y contrast regression specs
    {
      name: "regression",
      testMatch: /.*\/regression\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
