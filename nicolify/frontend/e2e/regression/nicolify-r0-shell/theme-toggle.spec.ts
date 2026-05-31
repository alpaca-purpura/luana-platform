/**
 * theme-toggle.spec.ts — Scenario B2
 * nicolify-r0-shell T-6
 *
 * B2 · happy · theme toggle light↔dark aplica a todo el shell
 * - given: shell en light
 * - when: click en ThemeToggle
 * - then: .dark CSS vars aplican · LogoMark swap a variante dark
 *   · persiste localStorage · sin FOUC
 *
 * gherkin_coverage: B2
 * spec_anchor: 04-validators.yaml § F-B2
 */

import { test, expect } from "../../auth.fixture";

test.describe("B2 — ThemeToggle light↔dark", () => {
  test("tema inicia como light (sin .dark en html)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    // Default: no .dark class on html
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass ?? "").not.toContain("dark");
  });

  test("click ThemeToggle → aplica .dark a html", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    const themeToggle = page.locator(
      "[aria-label*='Cambiar tema'], [data-testid='theme-toggle']",
    );
    await expect(themeToggle).toBeVisible({ timeout: 10_000 });
    await themeToggle.click();

    // .dark class applied to html
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5_000 });
  });

  test("tema dark persiste en localStorage (nicolify-theme)", async ({
    page,
    tenantId,
  }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    const themeToggle = page.locator(
      "[aria-label*='Cambiar tema'], [data-testid='theme-toggle']",
    );
    await expect(themeToggle).toBeVisible({ timeout: 10_000 });
    await themeToggle.click();

    // Wait for .dark
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5_000 });

    // Check localStorage
    const stored = await page.evaluate(() =>
      localStorage.getItem("nicolify-theme"),
    );
    expect(stored).toBe("dark");
  });

  test("toggle back to light", async ({ page, tenantId }) => {
    await page.goto(`/${tenantId}/christian/pipeline`, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    const themeToggle = page.locator(
      "[aria-label*='Cambiar tema'], [data-testid='theme-toggle']",
    );
    await expect(themeToggle).toBeVisible({ timeout: 10_000 });

    // Toggle to dark
    await themeToggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5_000 });

    // Toggle back to light
    await themeToggle.click();
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass ?? "").not.toContain("dark");
  });
});
