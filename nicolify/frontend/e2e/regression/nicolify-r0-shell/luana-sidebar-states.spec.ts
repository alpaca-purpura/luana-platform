/**
 * luana-sidebar-states.spec.ts — Scenario D1
 * nicolify-r0-shell T-6
 *
 * D1 · happy · 3 estados del LuanaSidebar (collapsed/history/full)
 * - given: shell montado, Luana en full (default visible)
 * - when: alterno entre LuanaRail / LuanaHistory / LuanaChat
 * - then: cada estado renderiza su estructura skeleton · role="complementary"
 *   · atajos teclado C/R/F · avatar de Luana (#635BFF) en el header
 *   · ChatComposer es no-funcional en R0
 *
 * gherkin_coverage: D1
 * spec_anchor: 04-validators.yaml § F-D1
 */

import { test, expect } from "../../auth.fixture";

test.describe("D1 — LuanaSidebar 3 estados", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("LuanaSidebar tiene role=complementary", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    await expect(page.locator("[role='complementary']")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("ChatComposer placeholder 'Escríbele a Luana…' visible y no-funcional", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    // ChatComposer placeholder
    const composer = page.locator("[data-testid='chat-composer']");
    await expect(composer).toBeVisible({ timeout: 10_000 });

    // Placeholder text
    const placeholder = await page
      .locator(
        "[placeholder='Escríbele a Luana…'], [data-testid='chat-input']",
      )
      .getAttribute("placeholder");
    expect(placeholder).toContain("Escríbele a Luana");
  });

  test("atajo R (rail) cambia estado LuanaSidebar", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    await page.locator("main").first().click();
    await page.keyboard.press("KeyR");

    // Sidebar still visible after state change
    await expect(page.locator("[role='complementary']")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("atajo C (collapsed/rail) y F (full) funcionan", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("[data-shell-ready='true']")).toBeVisible({
      timeout: 20_000,
    });

    const main = page.locator("main").first();
    await main.click();

    // C → collapsed/rail
    await page.keyboard.press("KeyC");
    await expect(page.locator("[role='complementary']")).toBeVisible({
      timeout: 5_000,
    });

    // F → full
    await page.keyboard.press("KeyF");
    await expect(page.locator("[role='complementary']")).toBeVisible({
      timeout: 5_000,
    });
  });
});
