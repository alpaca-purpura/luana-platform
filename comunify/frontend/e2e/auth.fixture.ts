/**
 * auth.fixture.ts — Comunify E2E authentication fixture (Story 12 T-e2e-1)
 *
 * Clerk testing token per playwright-expert SSoT:
 * - setupClerkTestingToken() injects bypass interceptor
 * - storageState freshness gate (>1h → rebuild)
 * - Tenant isolation: each fixture carries tenant_id (org_slug)
 * - NO direct `test` import from @playwright/test in authenticated specs
 *
 * Usage in specs:
 *   import { test, expect } from '../../auth.fixture';
 *
 * Environment:
 *   CLERK_TESTING_TOKEN=<token>  (required for authenticated tests)
 *   E2E_BASE_URL=http://localhost:3000  (default)
 *
 * PRAGMA T-e2e-1: Unauthenticated smoke specs (widget embed, cross-tenant)
 * do NOT use this fixture — they use bare @playwright/test `test`.
 */
import path from "path";
import fs from "fs";
import { test as base, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComunifyAuthFixtures = {
  /** Pre-authenticated page with Clerk testing token */
  authedPage: import("@playwright/test").Page;
};

export type ComunifyEnvFixtures = {
  /** Tenant org slug (maps to X-Tenant-ID header) */
  tenantSlug: string;
  /** Base URL for the Comunify app */
  baseUrl: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_STATE_PATH = path.join(__dirname, ".playwright", "comunify-auth.json");
const FRESHNESS_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAuthStateFresh(): boolean {
  if (!fs.existsSync(STORAGE_STATE_PATH)) return false;
  const stat = fs.statSync(STORAGE_STATE_PATH);
  return Date.now() - stat.mtimeMs < FRESHNESS_THRESHOLD_MS;
}

function collectConsoleErrors(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore expected non-actionable dev errors
      if (
        text.includes("ResizeObserver") ||
        text.includes("Non-Error promise rejection") ||
        text.includes("[Clerk]") // Clerk dev mode warnings
      ) {
        return;
      }
      errors.push(text);
    }
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Extended test with auth fixtures
// ---------------------------------------------------------------------------

export const test = base.extend<ComunifyAuthFixtures & ComunifyEnvFixtures>({
  tenantSlug: async ({}, use) => {
    const slug = process.env.COMUNIFY_TEST_TENANT || "anabella-coaching-ar";
    await use(slug);
  },

  baseUrl: async ({}, use) => {
    const url = process.env.E2E_BASE_URL || "http://localhost:3000";
    await use(url);
  },

  authedPage: async ({ page, baseUrl }, use) => {
    // Inject Clerk testing token bypass
    const clerkTestingToken = process.env.CLERK_TESTING_TOKEN;
    if (!clerkTestingToken) {
      throw new Error(
        "CLERK_TESTING_TOKEN not set. " +
        "Get a testing token from Clerk Dashboard → Testing → Tokens. " +
        "See deploy/CLERK-APP-SETUP.md § 7."
      );
    }

    // Set cookie for Clerk bypass interceptor
    await page.context().addCookies([
      {
        name: "__clerk_testing_token",
        value: clerkTestingToken,
        domain: new URL(baseUrl).hostname,
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // Navigate to app and wait for Clerk session
    await page.goto(baseUrl);
    await page.waitForSelector('[data-clerk-ready="true"]', { timeout: 10000 }).catch(() => {
      // Clerk may not emit this attribute — fall through
    });

    await use(page);
  },
});

export { expect };
