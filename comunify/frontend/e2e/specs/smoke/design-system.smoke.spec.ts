// comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts
/**
 * design-system.smoke.spec.ts — Comunify design system cement smoke
 * (Story comunify-design-system-cement T-4)
 *
 * Validates runtime correctness of the cemented tokens:
 *   1. Font CSS variables present on <html>
 *   2. Body background is comunify-bg + text is comunify-text (computed style)
 *   3. Sign-in page (chrome elements) inherits comunify tokens — no stock gray fallback
 *
 * Scope: native browser, no auth-protected routes (avoid Clerk fixture coupling
 * for this design-only smoke). /sign-in is unauthenticated — safe smoke target.
 * Chrome elements have tokens applied even pre-auth.
 *
 * Pre-requisitos:
 *   - `make dev-comunify` corriendo (backend 8003 + frontend 3003)
 *   - `E2E_BASE_URL=http://localhost:3003` (override default 3000)
 *
 * Run native (NEVER make e2e per .claude/rules/e2e-testing.md):
 *   cd comunify/frontend && E2E_BASE_URL=http://localhost:3003 \
 *     COMUNIFY_BE_URL=http://127.0.0.1:8003 \
 *     npx playwright test e2e/specs/smoke/design-system.smoke.spec.ts --project=smoke
 */
import { test, expect } from "@playwright/test";

test.describe("Comunify design system cement smoke", () => {
  test("font CSS variables are present on <html>", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/`);
    // Wait for layout to apply font className
    await page.waitForLoadState("domcontentloaded");

    const satoshiVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-satoshi').trim()
    );
    expect(satoshiVar).toMatch(/Plus Jakarta Sans/);

    const manropeVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-manrope').trim()
    );
    expect(manropeVar.length).toBeGreaterThan(0);

    const interVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-inter').trim()
    );
    expect(interVar.length).toBeGreaterThan(0);

    // Computed body font-family resolves to Inter (via Tailwind font-inter)
    const bodyFontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily
    );
    expect(bodyFontFamily.toLowerCase()).toMatch(/inter/);
  });

  test("body background is comunify-bg + text is comunify-text (computed style)", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState("domcontentloaded");

    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // --comunify-bg = 210 40% 98% → rgb(248, 250, 252) approx
    // hsl(210 40% 98%) computed: rgb(248, 250, 252) on Chrome
    expect(bodyBg).toMatch(/rgb\(\s*248,\s*250,\s*252\s*\)/);

    const bodyColor = await page.evaluate(() =>
      getComputedStyle(document.body).color
    );
    // --comunify-text = 226 49% 9% → rgb ~ (12, 17, 33) — narrow range tolerated via regex
    expect(bodyColor).toMatch(/rgb\(\s*1[0-5],\s*1[5-9],\s*3[0-5]\s*\)/);
  });

  test("sign-in page (chrome elements) inherits comunify tokens — no stock gray fallback", async ({
    page,
    baseURL,
  }) => {
    // /sign-in is unauthenticated — safe smoke target.
    // Validates that even pre-Clerk-mount, chrome page tokens are applied.
    const response = await page.goto(`${baseURL}/sign-in`);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("domcontentloaded");

    // Body should be comunify-bg (not Tailwind default white or gray-50)
    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    expect(bodyBg).toMatch(/rgb\(\s*248,\s*250,\s*252\s*\)/);

    // Verify Tailwind processed the comunify-* utility classes:
    // probe a computed style of a known element if present (e.g., main wrapper)
    // — fallback to body itself if no such marker exists.
    const hasComunifyClasses = await page.evaluate(() => {
      const all = [document.body, ...Array.from(document.body.querySelectorAll("*"))];
      return all.some((el) =>
        Array.from(el.classList).some((c) =>
          c.includes("comunify-")  // matches bg-comunify-bg, text-comunify-text, border-comunify-border, etc.
        )
      );
    });
    expect(hasComunifyClasses).toBe(true);
  });
});
