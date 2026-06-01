/**
 * config-tab-nav.spec.ts — Scenario E3
 * nicolify-r0-shell T-6
 *
 * E3 · happy · ConfigTab navega a /config/conexiones
 * - given: shell montado
 * - when: click en Configurar (IconButton Settings + Tooltip "Configurar")
 * - then: navega a /{tenantId}/config/conexiones (default de config) · ConfigTab active
 *
 * gherkin_coverage: E3
 * spec_anchor: 04-validators.yaml § F-E3
 */

import { test, expect } from "../../auth.fixture";

test.describe("E3 — ConfigTab navega a config/conexiones", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("click Configurar → navega a config/conexiones", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Click ConfigTab
    const configTab = page.locator(
      "[data-testid='config-tab'], [role='tab'][data-agent='config'], [aria-label='Configurar']",
    );
    await expect(configTab).toBeVisible({ timeout: 10_000 });
    await configTab.click();

    // Should navigate to config/conexiones
    await page.waitForURL(`**/${tenantId}/config/conexiones**`, {
      timeout: 15_000,
    });
    expect(page.url()).toContain("/config/conexiones");
  });

  test("ConfigTab shows empty-state at config/conexiones", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/config/conexiones`, { waitUntil: "load" });

    await expect(
      page.locator("[data-testid='subtab-content-config-conexiones']"),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.locator("[data-testid='empty-state']")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("ConfigTab right-aligned en Ribbon (ml-auto)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // ConfigTab should be positioned to the right (last in tablist visually)
    const configTab = page.locator(
      "[data-testid='config-tab'], [role='tab'][data-agent='config']",
    );
    await expect(configTab).toBeVisible({ timeout: 10_000 });

    // Get the bounding box and verify it's on the right side of the ribbon
    const ribbonBox = await page
      .locator("[role='tablist'][aria-label='Agentes']")
      .boundingBox();
    const configBox = await configTab.boundingBox();

    if (ribbonBox && configBox) {
      // ConfigTab x should be in the right half of the ribbon
      const ribbonMidX = ribbonBox.x + ribbonBox.width / 2;
      expect(configBox.x).toBeGreaterThan(ribbonMidX);
    }
  });
});
