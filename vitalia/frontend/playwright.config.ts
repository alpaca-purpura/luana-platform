import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load env vars from vitalia/.env.dev BEFORE defineConfig runs.
// Playwright's Node process does not read .env automatically (Next.js does,
// but Playwright is a separate Node process). Without this, clerk.setup.ts
// sees undefined E2E_CLERK_USER_EMAIL / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// and authentication fails with a misleading "invalid credentials" error.
dotenv.config({ path: path.resolve(__dirname, "../.env.dev") });
dotenv.config({ path: path.resolve(__dirname, ".env.e2e"), override: true });

// Fail fast if essential Clerk E2E vars are missing.
// Caught BEFORE the first test runs instead of cryptic "signIn timed out" 60s in.
const requiredEnvVars = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "E2E_CLERK_USER_EMAIL",
  "E2E_CLERK_USER_PASSWORD",
  "E2E_TENANT_ID",
] as const;
const missing = requiredEnvVars.filter((k) => !process.env[k]);
if (missing.length > 0) {
  // Only enforce when running Playwright (not when other tooling imports config).
  // The setup project is what actually needs these.
  console.warn(
    `[playwright.config] Warning: missing Clerk E2E vars: ${missing.join(", ")}. ` +
      `setup project will fail until populated. Check vitalia/.env.dev.`,
  );
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : process.env.E2E_BASE_URL ? 1 : 0,
  // Setup project pins itself to mode:'serial' (clerk.setup.ts).
  // Smoke/visual/admin/mobile/a11y can run in parallel; each fixture re-injects testing token.
  workers: process.env.CI ? 1 : 4,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never", host: "0.0.0.0" }]],

  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    launchOptions: {
      args: ["--disable-dev-shm-usage"],
    },
  },
  projects: [
    // Setup project — runs clerkSetup() + signIn + saves storageState.
    // All Clerk-gated projects depend on this.
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      retries: 1,
      timeout: 180_000,
    },

    // Smoke project — all *.smoke.spec.ts + vitalia-auth-base-functional specs.
    // Pre-authenticated via storageState. Uses dependencies: ['setup'].
    {
      name: "smoke",
      testMatch: [
        /.*\.smoke\.spec\.ts/,
        /.*\/e2e\/auth\/.*\.spec\.ts/,
        /.*\/e2e\/dashboard\/.*\.spec\.ts/,
        /.*\/e2e\/visual\/.*\.spec\.ts/,
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },
    // Mobile responsive
    {
      name: "mobile",
      testMatch: [
        /.*\/mobile\/.*\.spec\.ts/,
        /.*\/responsive\/.*\.smoke\.spec\.ts/,
      ],
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },
    // Tablet
    {
      name: "tablet",
      testMatch: /.*\/responsive\/.*\.smoke\.spec\.ts/,
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },
    // Desktop responsive baseline
    {
      name: "desktop",
      testMatch: /.*\/responsive\/.*\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },
    // A11y axe scans
    {
      name: "a11y",
      testMatch: [
        /.*\/a11y\/.*\.spec\.ts/,
        /.*\/a11y\/.*\.smoke\.spec\.ts/,
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },
    // Admin Streamlit panel — separate baseURL + own auth fixture (NOT Clerk).
    // Run: E2E_ADMIN_BASE_URL=http://localhost:8502 VITALIA_ADMIN_PASSWORD=...
    {
      name: "admin-smoke",
      testMatch: /.*\/e2e\/admin\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env["E2E_ADMIN_BASE_URL"] || "http://127.0.0.1:8502",
      },
    },
    // Admin-smoke project — Streamlit admin panel at port 8502 (NOT Clerk-gated).
    // Requires VITALIA_ADMIN_PASSWORD + VITALIA_INTERNAL_API_TOKEN env vars.
    // Run: E2E_ADMIN_BASE_URL=http://localhost:8502 VITALIA_ADMIN_PASSWORD=... npx playwright test --project=admin-smoke
    {
      name: "admin-smoke",
      testMatch: /.*\/e2e\/admin\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env["E2E_ADMIN_BASE_URL"] || "http://127.0.0.1:8502",
      },
    },
  ],
});
