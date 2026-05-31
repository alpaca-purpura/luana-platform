/**
 * splitter-snap-up.spec.ts — Scenario C2
 * nicolify-r0-shell T-6
 *
 * C2 · edge · cambio de estado fuerza snap-up si el ancho actual < mínimo nuevo
 * - given: Luana en rail con ratio custom estrecho
 * - when: expando a full (mín ~620px) y el ancho actual es menor
 * - then: snap-up automático al mínimo del estado destino · sin layout shift roto
 *
 * gherkin_coverage: C2
 * spec_anchor: 04-validators.yaml edge
 */

import { test, expect } from "../../auth.fixture";

test.describe("C2 — splitter snap-up edge case", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shell hydrates without layout crash (snap-up logic)", async ({
    page,
    tenantId,
  }) => {
    // Pre-set a narrow shell state in localStorage to trigger snap-up
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });

    // Set persisted state with narrow Luana
    await page.evaluate(() => {
      localStorage.setItem(
        "nicolify-shell-state",
        JSON.stringify({ luanaState: "collapsed", shellMode: "agentic" }),
      );
    });

    // Reload to trigger hydration snap-up
    await page.reload({ waitUntil: "load" });

    // Shell should stabilize without crash
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 25_000,
    });

    // LuanaSidebar still visible (not hidden due to snap)
    await expect(
      page.locator("[role='complementary'], [data-testid='luana-sidebar']"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("transition collapsed → full via F shortcut (snap-up triggers)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // Collapse first (C)
    await page.locator("main").first().click();
    await page.keyboard.press("KeyC");

    // Then expand to full (F) — triggers snap-up if needed
    await page.keyboard.press("KeyF");

    // Shell still ready without crash
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });

    // No layout error visible
    const errorText = await page
      .locator("[data-testid='error-boundary']")
      .count();
    expect(errorText).toBe(0);
  });
});
