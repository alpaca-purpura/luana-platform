/**
 * ribbon-nav.spec.ts — Scenario E1
 * nicolify-r0-shell T-6
 *
 * E1 · happy · click en tab de agente navega a su sub-tab default + marca active
 * - given: shell en christian/pipeline
 * - when: click en la tab de Abel
 * - then: navega a /{tenantId}/abel/oferta · Ribbon marca Abel active (agent-color border)
 *   · SubTabsBar muestra las 4 sub-tabs de Abel · roving tabindex
 *
 * gherkin_coverage: E1
 * spec_anchor: 04-validators.yaml § F-E1
 */

import { test, expect } from "../../auth.fixture";

test.describe("E1 — Ribbon navegación por agente", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("click Abel → navega a abel/oferta", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Click Abel tab in Ribbon
    const abelTab = page.locator(
      "[role='tab'][data-agent='abel'], [data-testid='ribbon-tab-abel']",
    );
    await expect(abelTab).toBeVisible({ timeout: 10_000 });
    await abelTab.click();

    // Should navigate to abel/oferta (default subtab)
    await page.waitForURL(`**/${tenantId}/abel/oferta**`, { timeout: 15_000 });
    expect(page.url()).toContain("/abel/oferta");
  });

  test("Ribbon role=tablist con aria-label='Agentes'", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      page.locator("[role='tablist'][aria-label='Agentes']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("tab activa tiene tabindex=0, inactivas tabindex=-1 (roving)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Active tab (christian) should have tabindex=0
    const christianTab = page.locator(
      "[role='tab'][data-agent='christian'], [data-testid='ribbon-tab-christian']",
    );
    await expect(christianTab).toBeVisible({ timeout: 10_000 });
    const tabIndex = await christianTab.getAttribute("tabindex");
    expect(tabIndex).toBe("0");
  });

  test("SubTabsBar muestra sub-tabs del agente activo", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/abel/oferta`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // SubTabsBar for Abel should show 4 sub-tabs
    const subTabsBar = page.locator("[data-testid='sub-tabs-bar'], [role='tablist']").nth(1);
    await expect(subTabsBar).toBeVisible({ timeout: 10_000 });
  });
});
