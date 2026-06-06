/**
 * ribbon-deeplink.spec.ts — Scenario E2
 * nicolify-r0-shell T-6 · updated T-2 (sitemap-completo v3 slug fix)
 *
 * E2 · happy · deep-link marca el active state correcto (URL-derived)
 * - given: URL directa /{tenantId}/norvil/cartera (era salud-cuenta — removido en v3)
 * - when: carga en frío
 * - then: Ribbon marca Norvil active · SubTabsBar marca cartera active · hoja en empty-state
 *
 * v3 slug fix (T-2):
 *   norvil/salud-cuenta → norvil/cartera  (salud-cuenta removido en T-1 v3 sitemap)
 *   sara/proyectos      → sara/proximamente (proyectos removido en T-1 v3 sitemap)
 *
 * gherkin_coverage: E2
 * spec_anchor: 04-validators.yaml § F-E2
 */

import { test, expect } from "../../auth.fixture";

test.describe("E2 — deep-link active state correcto (URL-derived)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("deep-link a norvil/cartera: Ribbon marca Norvil active", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/norvil/cartera`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Norvil tab should be active. .first() = desktop Ribbon copy (shell monta
    // desktop md:block + mobile md:hidden SIEMPRE; desktop primero en DOM, visible a 1280).
    const norvilTab = page
      .locator("[role='tab'][data-agent='norvil'], [data-testid='ribbon-tab-norvil']")
      .first();
    await expect(norvilTab).toBeVisible({ timeout: 10_000 });

    // Active attribute should be set
    const ariaSelected = await norvilTab.getAttribute("aria-selected");
    expect(ariaSelected).toBe("true");
  });

  test("deep-link to sara/proximamente: Sara tab active", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/sara/proximamente`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Sara tab active. .first() = desktop Ribbon copy (visible at 1280).
    const saraTab = page
      .locator("[role='tab'][data-agent='sara'], [data-testid='ribbon-tab-sara']")
      .first();
    await expect(saraTab).toBeVisible({ timeout: 10_000 });

    const ariaSelected = await saraTab.getAttribute("aria-selected");
    expect(ariaSelected).toBe("true");
  });

  test("deep-link shows empty-state for the sub-tab", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/norvil/cartera`, { waitUntil: "load" });

    await expect(
      page.locator("[data-testid='subtab-content-norvil-cartera']:visible"),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.locator("[data-testid='empty-state']:visible")).toBeVisible({
      timeout: 10_000,
    });
  });
});
