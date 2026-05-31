/**
 * ribbon-deeplink.spec.ts — Scenario E2
 * nicolify-r0-shell T-6
 *
 * E2 · happy · deep-link marca el active state correcto (URL-derived)
 * - given: URL directa /{tenantId}/norvil/salud-cuenta
 * - when: carga en frío
 * - then: Ribbon marca Norvil active (rosa) · SubTabsBar marca salud-cuenta active
 *   · hoja en empty-state
 *
 * gherkin_coverage: E2
 * spec_anchor: 04-validators.yaml § F-E2
 */

import { test, expect } from "../../auth.fixture";

test.describe("E2 — deep-link active state correcto (URL-derived)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("deep-link a norvil/salud-cuenta: Ribbon marca Norvil active", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/norvil/salud-cuenta`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Norvil tab should be active
    const norvilTab = page.locator(
      "[role='tab'][data-agent='norvil'], [data-testid='ribbon-tab-norvil']",
    );
    await expect(norvilTab).toBeVisible({ timeout: 10_000 });

    // Active attribute should be set
    const ariaSelected = await norvilTab.getAttribute("aria-selected");
    expect(ariaSelected).toBe("true");
  });

  test("deep-link to sara/proyectos: Sara tab active", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/sara/proyectos`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Sara tab active
    const saraTab = page.locator(
      "[role='tab'][data-agent='sara'], [data-testid='ribbon-tab-sara']",
    );
    await expect(saraTab).toBeVisible({ timeout: 10_000 });

    const ariaSelected = await saraTab.getAttribute("aria-selected");
    expect(ariaSelected).toBe("true");
  });

  test("deep-link shows empty-state for the sub-tab", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/norvil/salud-cuenta`, { waitUntil: "load" });

    await expect(
      page.locator("[data-testid='subtab-content-norvil-salud-cuenta']"),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.locator("[data-testid='empty-state']")).toBeVisible({
      timeout: 10_000,
    });
  });
});
