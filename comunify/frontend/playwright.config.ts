import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
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
  ],
});
