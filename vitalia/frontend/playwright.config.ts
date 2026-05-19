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
    // Smoke project — all *.smoke.spec.ts + vitalia-auth-base-functional specs
    // (e2e/auth/*, e2e/dashboard/*, e2e/admin/*, e2e/visual/* are plain *.spec.ts per 06-tickets.yaml)
    {
      name: "smoke",
      testMatch: [
        /.*\.smoke\.spec\.ts/,
        /.*\/e2e\/auth\/.*\.spec\.ts/,
        /.*\/e2e\/dashboard\/.*\.spec\.ts/,
        /.*\/e2e\/admin\/.*\.spec\.ts/,
        /.*\/e2e\/visual\/.*\.spec\.ts/,
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    // Responsive projects — spec §9 breakpoints
    // mobile: < 768px — includes T-6.b mobile/ specs + legacy responsive/ suite
    {
      name: "mobile",
      testMatch: [
        /.*\/mobile\/.*\.spec\.ts/,
        /.*\/responsive\/.*\.smoke\.spec\.ts/,
      ],
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
      },
    },
    // tablet: 768-1024px
    {
      name: "tablet",
      testMatch: /.*\/responsive\/.*\.smoke\.spec\.ts/,
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },
    // desktop: > 1024px (already covered by smoke, explicit for responsive suite)
    {
      name: "desktop",
      testMatch: /.*\/responsive\/.*\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    // A11y project — axe-core scans (T-6.b a11y/ specs + legacy *.smoke.spec.ts pattern)
    {
      name: "a11y",
      testMatch: [
        /.*\/a11y\/.*\.spec\.ts/,
        /.*\/a11y\/.*\.smoke\.spec\.ts/,
      ],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
