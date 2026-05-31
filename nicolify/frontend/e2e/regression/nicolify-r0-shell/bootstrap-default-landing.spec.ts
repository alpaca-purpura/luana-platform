/**
 * bootstrap-default-landing.spec.ts — Scenario A1
 * nicolify-r0-shell T-6
 *
 * A1 · happy · bootstrap → default landing
 * - given: tenant autenticado entra a la raíz del shell /{tenantId}
 * - when: la app monta
 * - then: redirige a /{tenantId}/christian/pipeline · TopBar visible (role="banner")
 *   · LuanaSidebar visible · Ribbon 5 tabs + Configurar · SubTabsBar Christian
 *   · empty-state "Aún no hay deals en tu pipeline"
 *
 * gherkin_coverage: A1
 * spec_anchor: 04-validators.yaml § F-A1
 */

import { test, expect } from "../../auth.fixture";

test.describe("A1 — bootstrap → default landing", () => {
  test("redirige a christian/pipeline desde raíz del shell", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}`, { waitUntil: "load" });

    // Should redirect to DEFAULT_LANDING
    await page.waitForURL(`**/${tenantId}/christian/pipeline**`, {
      timeout: 30_000,
    });
    expect(page.url()).toContain("/christian/pipeline");
  });

  test("TopBar visible con role=banner", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });

    // Wait for shell to be ready
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // TopBar has role=banner
    await expect(
      page.locator("header[role='banner'], [data-testid='topbar-global']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Ribbon con 5 agentes + Configurar visibles", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });

    // Wait for shell hydration (dynamic({ssr:false}))
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Ribbon visible (role=tablist)
    const ribbon = page.locator("[role='tablist'][aria-label='Agentes']");
    await expect(ribbon).toBeVisible({ timeout: 10_000 });

    // 5 agentes + Configurar = 6 tabs total (Abel, Brenda, Christian, Sara, Norvil, Configurar)
    const ribbonTabs = ribbon.locator("[role='tab']");
    const count = await ribbonTabs.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test("empty-state pipeline visible", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });

    // Wait for SubTabContent to render
    await expect(
      page.locator("[data-testid='subtab-content-christian-pipeline']"),
    ).toBeVisible({ timeout: 15_000 });

    // EmptyState visible
    await expect(page.locator("[data-testid='empty-state']")).toBeVisible({
      timeout: 10_000,
    });

    // Branded empty-state copy
    await expect(
      page.getByText("Aún no hay deals en tu pipeline"),
    ).toBeVisible({ timeout: 10_000 });
  });
});
