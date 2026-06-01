/**
 * boot-live-smoke.spec.ts — A0 Definition of Done gate.
 * nicolify-r0-shell T-6 — CLOSES A0.
 *
 * Scenario A0 — Dev-stack boot LIVE (app realmente funcional):
 *   - BE :8001/health responds 200
 *   - FE :3001 serves app
 *   - Clerk middleware active (unauth → /sign-in)
 *   - After login → redirect to DEFAULT_LANDING (christian/pipeline)
 *   - Shell renders without crash (HTTP 200)
 *
 * This is the "app is actually running" gate — not components in isolation over a dead stack.
 * Requiere make dev-nicolify levantado (native, no Docker para e2e).
 *
 * gherkin_coverage: A0
 * spec_anchor: 04-validators.yaml § F-A0
 */

import { test, expect } from "../../auth.fixture";

test.describe("A0 — boot-live-smoke (Definition of Done)", () => {
  test("BE :8001 health 200 via FE proxy", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json() as { status: string; brand: string };
    expect(body.status).toBe("ok");
    expect(body.brand).toBe("nicolify");
  });

  test("FE :3001 sirve — no white-screen con autenticación Clerk", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}`, { waitUntil: "load" });

    // Must not redirect to sign-in when authenticated
    expect(page.url()).not.toContain("/sign-in");

    // Main content visible — no white-screen
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Body not empty
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test("DEFAULT_LANDING reachable: christian/pipeline con empty-state", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}`, { waitUntil: "load" });

    // Should redirect to christian/pipeline
    await page.waitForURL(`**/${tenantId}/christian/pipeline**`, {
      timeout: 30_000,
    });

    // Shell renders without crash
    expect(page.url()).toContain("/christian/pipeline");
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // TopBar visible
    await expect(page.locator("header[role='banner'], [data-testid='topbar-global']")).toBeVisible({ timeout: 10_000 });

    // Empty-state visible (A0 DoD — shell is reachable + renders content)
    await expect(page.locator("[data-testid='empty-state']")).toBeVisible({
      timeout: 15_000,
    });
  });
});
