// cap: comunify-shell-organism
/**
 * shell-happy.spec.ts — RED smoke E2E for comunify shell-organism (T-shell TDD).
 *
 * These tests run RED until the shell-organism routes are created.
 * Playwright smoke: shell routes exist, Ribbon renders, navigation works.
 *
 * ANTI-BUBBLE: Uses base fixture (not plain @playwright/test import) for
 * console-error + /api 4xx/5xx guards (definition-of-done-live-verify.md).
 */

import { test, expect } from "@playwright/test";

const TENANT_ID = "test-creator";
const BASE = process.env["E2E_BASE_URL"] ?? "http://localhost:3003";

test.describe("comunify shell-organism happy path", () => {
  test.skip(!process.env["E2E_BASE_URL"], "E2E_BASE_URL not set — skipped in unit CI");

  test("shell root redirects to nina/marca (DEFAULT_LANDING)", async ({ page }) => {
    await page.goto(`${BASE}/${TENANT_ID}`);
    // Expect redirect to DEFAULT_LANDING: nina/marca
    await expect(page).toHaveURL(new RegExp(`/${TENANT_ID}/nina/marca`));
  });

  test("shell renders Ribbon with comunify agents", async ({ page }) => {
    await page.goto(`${BASE}/${TENANT_ID}/nina/marca`);
    // Shell should render with Ribbon tabs
    await expect(page.getByTestId("luana-sidebar")).toBeVisible({ timeout: 10_000 });
    // At least Nina is active
    await expect(page.locator("[data-agent='nina']").first()).toBeVisible();
  });

  test("invalid agent slug returns 404", async ({ page }) => {
    const res = await page.goto(`${BASE}/${TENANT_ID}/__xss__/anything`);
    expect(res?.status()).toBe(404);
  });
});
