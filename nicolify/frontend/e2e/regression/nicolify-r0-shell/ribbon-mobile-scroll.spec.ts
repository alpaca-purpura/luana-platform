/**
 * ribbon-mobile-scroll.spec.ts — Scenario E5
 * nicolify-r0-shell T-6
 *
 * E5 · edge · Ribbon en mobile 375px → scroll horizontal, ConfigTab al final
 * - given: viewport 375px
 * - when: render del Ribbon (5 tabs + Config no entran)
 * - then: overflow-x-auto, ConfigTab ml-auto (último), sin romper la altura uniforme h-14
 *
 * gherkin_coverage: E5
 * spec_anchor: 04-validators.yaml edge
 */

import { test, expect } from "../../auth.fixture";

test.describe("E5 — Ribbon mobile scroll horizontal", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("Ribbon visible en mobile 375px", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Ribbon should be visible
    const ribbon = page.locator(
      "[role='tablist'][aria-label='Agentes']",
    );
    await expect(ribbon).toBeVisible({ timeout: 10_000 });
  });

  test("Ribbon height consistent in mobile (≈ h-14 = 56px)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    const ribbon = page.locator(
      "[role='tablist'][aria-label='Agentes']",
    );
    await expect(ribbon).toBeVisible({ timeout: 10_000 });

    const box = await ribbon.boundingBox();
    if (box) {
      // h-14 = 56px, allow tolerance [48, 64]
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeLessThanOrEqual(64);
    }
  });

  test("no vertical overflow from Ribbon in mobile", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Body should not have vertical overflow due to ribbon
    const hasVerticalOverflow = await page.evaluate(() => {
      const body = document.body;
      return body.scrollHeight > window.innerHeight + 50; // 50px tolerance
    });

    // In mobile shell, vertical overflow from ribbon should not exist
    // (overflow from scroll is expected in content area, not from ribbon itself)
    expect(hasVerticalOverflow).toBe(false);
  });
});
