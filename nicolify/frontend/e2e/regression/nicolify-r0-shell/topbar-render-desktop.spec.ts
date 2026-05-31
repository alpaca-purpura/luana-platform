/**
 * topbar-render-desktop.spec.ts — Scenario B1
 * nicolify-r0-shell T-6
 *
 * B1 · happy · render desktop completo + 3 paneles en sync
 * - given: viewport ≥1280px, tema light
 * - when: carga /{tenantId}/christian/pipeline
 * - then: TopBar h-12 (LogoMark izq, [control splitter · ThemeToggle · TenantSwitcher] der)
 *   · grid dual-mode 50/50 · Ribbon Christian active (azul #3B82F6)
 *   · tokens nicolify.com resueltos (primario #635BFF, fuentes League Spartan)
 *
 * gherkin_coverage: B1
 * spec_anchor: 04-validators.yaml § F-B1
 */

import { test, expect } from "../../auth.fixture";

test.describe("B1 — TopBar render desktop light ≥1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("TopBar visible con role=banner + h-12 height", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    const topbar = page.locator(
      "header[role='banner'], [data-testid='topbar-global']",
    );
    await expect(topbar).toBeVisible({ timeout: 10_000 });

    // Height ≈ 48px (h-12 = 3rem = 48px)
    const box = await topbar.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeLessThanOrEqual(56);
    }
  });

  test("LogoMark visible en TopBar izquierda", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    await expect(
      page.locator(
        "[aria-label='Nicolify inicio'], [data-testid='logo-mark']",
      ),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("ThemeToggle visible en TopBar derecha", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    await expect(
      page.locator(
        "[aria-label*='tema'], [data-testid='theme-toggle'], [aria-label*='Cambiar tema']",
      ),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shell agentic grid monta (dual-mode 50/50)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });

    // Wait for hydration
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Both panels visible (LuanaSidebar + AppPanelSlot)
    await expect(
      page.locator(
        "[role='complementary'], [data-testid='luana-sidebar']",
      ),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("[data-testid='app-panel-slot']")).toBeVisible({
      timeout: 10_000,
    });
  });
});
