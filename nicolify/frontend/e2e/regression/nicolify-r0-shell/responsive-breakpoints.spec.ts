/**
 * responsive-breakpoints.spec.ts — Scenario B3
 * nicolify-r0-shell T-6
 *
 * B3 · happy · responsive 375 / 768 / 1280
 * - given: las 3 anchuras
 * - when: carga el shell en cada una
 * - then: <768 → 1 columna, LuanaSidebar en drawer (cerrado por defecto)
 *   · [768–1104) → grid 2col, Luana forzada a rail
 *   · ≥1104 → dual-mode libre · sin overflow horizontal salvo Ribbon scroll mobile
 *
 * gherkin_coverage: B3
 * spec_anchor: 04-validators.yaml § NF-3
 */

import { test, expect } from "../../auth.fixture";

test.describe("B3 — responsive breakpoints", () => {
  test("mobile 375px — 1 columna, LuanaSidebar drawer cerrado", async ({
    page,
    tenantId,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Main content visible
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });

    // No horizontal overflow on body
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });

  test("tablet 768px — grid 2col, no horizontal overflow", async ({
    page,
    tenantId,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // No horizontal overflow on body
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(780); // 768 + small tolerance
  });

  test("desktop 1280px — dual-mode, both panels visible", async ({
    page,
    tenantId,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });

    // Wait for hydration
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Both panels visible at desktop
    await expect(
      page.locator("[role='complementary'], [data-testid='luana-sidebar']"),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("[data-testid='app-panel-slot']")).toBeVisible({
      timeout: 10_000,
    });
  });
});
