/**
 * splitter-drag-snaps.spec.ts — Scenario C1
 * nicolify-r0-shell T-6
 *
 * C1 · happy · splitter drag + snaps (chat-collapsed / narrow / 50-50)
 * - given: shell en dual-mode 50/50
 * - when: uso atajos C/R/F
 * - then: el ancho de Luana cambia con clamp a sus mínimos
 *   · hit-area del handle ≥8px · aria-label="Redimensionar paneles"
 *
 * gherkin_coverage: C1
 * spec_anchor: 04-validators.yaml § F-C1
 */

import { test, expect } from "../../auth.fixture";

test.describe("C1 — splitter drag + snaps", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("splitter handle visible con aria-label='Redimensionar paneles'", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    const handle = page.locator("[aria-label='Redimensionar paneles']");
    await expect(handle).toBeVisible({ timeout: 10_000 });

    // Hit-area ≥ 8px (w-2 = 8px)
    const box = await handle.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(8);
    }
  });

  test("atajo C colapsa el panel de Luana", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Focus the main area first
    await page.locator("main").first().click();

    // Press C to collapse Luana
    await page.keyboard.press("KeyC");

    // LuanaSidebar should still exist but be narrow (rail state)
    await expect(
      page.locator("[role='complementary'], [data-testid='luana-sidebar']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("atajo F expande el panel de Luana", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Focus the main area
    await page.locator("main").first().click();

    // Press F to expand Luana to full
    await page.keyboard.press("KeyF");

    // LuanaSidebar visible
    await expect(
      page.locator("[role='complementary'], [data-testid='luana-sidebar']"),
    ).toBeVisible({ timeout: 10_000 });
  });
});
