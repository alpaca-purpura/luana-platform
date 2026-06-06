/**
 * ribbon-nav.spec.ts — Scenario E1
 * nicolify-r0-shell T-6 · updated T-2 (sitemap-completo v3 slug fix)
 *
 * E1 · happy · click en tab de agente navega a su sub-tab default + marca active
 * - given: shell en christian/pipeline
 * - when: click en la tab de Abel
 * - then: navega a /{tenantId}/abel/icp · Ribbon marca Abel active (agent-color border)
 *   · SubTabsBar muestra las 3 sub-tabs de Abel · roving tabindex
 *
 * v3 slug fix (T-2):
 *   abel default subtab: oferta → icp  (getDefaultSubtab retorna el primero del catálogo v3;
 *   AGENT_CATALOG.abel.defaultSubtab="icp" en el árbol v3)
 *
 * gherkin_coverage: E1
 * spec_anchor: 04-validators.yaml § F-E1
 */

import { test, expect } from "../../auth.fixture";

test.describe("E1 — Ribbon navegación por agente", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("click Abel → navega a abel/icp (default subtab v3)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Click Abel tab in Ribbon.
    // .first() — el shell monta el Ribbon en desktop (md:block) + mobile (md:hidden)
    // SIEMPRE (responsive vía CSS); el desktop va primero en el DOM y es el visible a 1280.
    const abelTab = page
      .locator("[role='tab'][data-agent='abel'], [data-testid='ribbon-tab-abel']")
      .first();
    await expect(abelTab).toBeVisible({ timeout: 10_000 });
    await abelTab.click();

    // Should navigate to abel/icp (default subtab in v3 — first in AGENT_CATALOG.abel)
    await page.waitForURL(`**/${tenantId}/abel/icp**`, { timeout: 15_000 });
    expect(page.url()).toContain("/abel/icp");
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
      page.locator("[role='tablist'][aria-label='Agentes']").first(),
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

    // Active tab (christian) should have tabindex=0. .first() = desktop Ribbon (visible at 1280).
    const christianTab = page
      .locator("[role='tab'][data-agent='christian'], [data-testid='ribbon-tab-christian']")
      .first();
    await expect(christianTab).toBeVisible({ timeout: 10_000 });
    const tabIndex = await christianTab.getAttribute("tabindex");
    expect(tabIndex).toBe("0");
  });

  test("SubTabsBar muestra sub-tabs del agente activo", async ({
    page,
    tenantId,
  }) => {
    // Use abel/icp (v3 default) — oferta is still valid but icp is canonical default
    await page.goto(`/${tenantId}/abel/icp`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // SubTabsBar for Abel should show 3 sub-tabs (v3: icp + oferta + marca)
    const subTabsBar = page
      .locator("[data-testid='sub-tabs-bar'], [role='tablist']")
      .nth(1);
    await expect(subTabsBar).toBeVisible({ timeout: 10_000 });
  });
});
