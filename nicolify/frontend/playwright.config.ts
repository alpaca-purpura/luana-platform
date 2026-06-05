/**
 * playwright.config.ts — Nicolify E2E (T-6 nicolify-r0-shell — extends T-4)
 *
 * Loads env vars from nicolify/.env.dev (sibling of frontend/).
 * Override per-test with .env.e2e (gitignored).
 *
 * Fail-fast gate: si faltan vars Clerk esenciales → error antes del primer test.
 *
 * Projects:
 *   setup      — clerk.setup.ts (serial). Genera playwright/.clerk/user.json.
 *   smoke      — *.smoke.spec.ts (parallel, storageState). Depende de setup.
 *   regression — e2e/regression/**\/*.spec.ts (parallel, storageState). T-6 nicolify-r0-shell.
 *
 * Ejecución (nativa Linux, NUNCA Docker — .claude/rules/e2e-testing.md):
 *   cd nicolify/frontend
 *   E2E_BASE_URL=http://localhost:3001 npx playwright test --project=setup
 *   E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke
 *   E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression
 *
 * NO levantar webServer aquí — usar E2E_BASE_URL con stack ya corriendo.
 * Port nicolify: FE :3001, BE :8001.
 *
 * Port re-temizado desde vitalia/frontend/playwright.config.ts.
 */

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Cargar nicolify/.env.dev ANTES de defineConfig.
// Playwright corre como proceso Node separado — no lee .env automáticamente.
// Sin esto, clerk.setup.ts ve E2E_CLERK_USER_EMAIL=undefined.
dotenv.config({ path: path.resolve(__dirname, "../.env.dev") });
dotenv.config({ path: path.resolve(__dirname, ".env.e2e"), override: true });

// Fail-fast: si faltan vars Clerk esenciales, el error es claro antes del setup.
// Más informativo que "clerk.signIn() timed out" 60 segundos después.
const requiredEnvVars = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "E2E_CLERK_USER_EMAIL",
  "E2E_CLERK_USER_PASSWORD",
  "E2E_TENANT_ID",
] as const;

const missing = requiredEnvVars.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(
    `[playwright.config] Advertencia: faltan vars Clerk E2E: ${missing.join(", ")}. ` +
      `El proyecto setup fallará hasta que se configuren. Verifica nicolify/.env.dev.`,
  );
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never", host: "0.0.0.0" }]],

  timeout: 60_000,
  use: {
    // nicolify FE port :3001. Override con E2E_BASE_URL env var.
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
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
    // Setup — clerk.setup.ts (serial).
    // Corre clerkSetup() + signIn + guarda storageState en playwright/.clerk/user.json.
    // Retries: 1 (setup suele fallar por timing Clerk en primera corrida).
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      retries: 1,
      timeout: 180_000,
    },

    // Smoke — specs en e2e/smoke/, e2e/specs/smoke/, y e2e/auth/.
    // (parallel, pre-autenticado vía storageState). Depende de setup.
    // T-6 nicolify-r0-shell + T-E2E-1 abel-icp smoke.
    {
      name: "smoke",
      testMatch: [
        /e2e\/smoke\/.*\.smoke\.spec\.ts/,
        /e2e\/specs\/smoke\/.*\.smoke\.spec\.ts/,
        /e2e\/auth\/.*\.spec\.ts/,
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },

    // Regression — E2E regression suite (T-6 nicolify-r0-shell + T-E2E-1 abel-icp).
    // Includes e2e/regression/**/*.spec.ts + e2e/specs/regression/**/*.spec.ts.
    // Depende de setup para tener playwright/.clerk/user.json fresco.
    {
      name: "regression",
      testMatch: [
        /e2e\/regression\/.*\.spec\.ts/,
        /e2e\/specs\/regression\/.*\.spec\.ts/,
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // NO webServer — stack ya está corriendo vía make dev-nicolify.
  // Usar E2E_BASE_URL=http://localhost:3001 en la invocación.
  // Levantar webServer acá abre un segundo proceso Next.js en :3000 y colisiona.
});
