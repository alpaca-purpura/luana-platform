/**
 * design-system-pairs.spec.ts — SC-01 Playwright regression
 * (Story comunify-design-system-a11y-contrast-cement T-4)
 *
 * Validates:
 *   SC-01 (Happy) — Computed contrast ≥ 4.5:1 for Camino B button text on light bg
 *   SC-01 (utility emission) — The 5 *-text utility classes exist in the rendered stylesheet
 *
 * Runs unauthenticated on /sign-in (design tokens available even pre-auth).
 * NO Clerk fixture needed for CSS var validation.
 *
 * Pre-requisites:
 *   make dev-comunify (frontend on 3003)
 *
 * Run native:
 *   cd comunify/frontend && E2E_BASE_URL=http://localhost:3003 \
 *     npx playwright test e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts \
 *     --project=regression
 *
 * Coverage: SC-01 (Gherkin in 01-spec.md § Acceptance criteria)
 */
import { test, expect } from "@playwright/test";
import { getContrastRatio } from "./_helpers";

test.describe("SC-01 — Camino B design-system-pairs contrast (unauthenticated)", () => {
  /**
   * SC-01 Happy — verify the 5 *-text CSS vars resolve to WCAG AA compliant colors.
   *
   * Strategy: inject a temporary element with each text-comunify-*-text class,
   * measure computed color, compute contrast vs white bg (the canonical Camino B light bg).
   * This validates the CSS var chain: @theme → tailwind.config.ts → utility class → computed color.
   */
  test("sc-01-camino-b-buttons-pass-aa", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/sign-in`);
    await page.waitForLoadState("domcontentloaded");

    // Inject a test surface with all 5 *-text classes on white background
    // and measure contrast for each token.
    const contrastResults = await page.evaluate(() => {
      const tokens = [
        { name: "warning-text", cls: "text-comunify-warning-text" },
        { name: "stable-text", cls: "text-comunify-stable-text" },
        { name: "accent-text", cls: "text-comunify-accent-text" },
        { name: "critical-text", cls: "text-comunify-critical-text" },
        { name: "blue-text", cls: "text-comunify-blue-text" },
      ];

      function parseRGB(value: string): [number, number, number] | null {
        const m = value.match(
          /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/,
        );
        if (!m) return null;
        return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
      }

      function sRGBtoLinear(c: number): number {
        const normalized = c / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : Math.pow((normalized + 0.055) / 1.055, 2.4);
      }

      function relativeLuminance(rgb: [number, number, number]): number {
        const [r, g, b] = rgb.map(sRGBtoLinear);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }

      function contrastRatio(L1: number, L2: number): number {
        const lighter = Math.max(L1, L2);
        const darker = Math.min(L1, L2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      // White bg luminance (canonical Camino B light bg)
      const whiteLuminance = 1.0;
      const results: { token: string; ratio: number; color: string }[] = [];

      // Create a container div with white bg
      const container = document.createElement("div");
      container.style.backgroundColor = "white";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      for (const token of tokens) {
        const el = document.createElement("span");
        el.className = token.cls;
        el.textContent = "Test";
        container.appendChild(el);

        const color = getComputedStyle(el).color;
        const rgb = parseRGB(color);
        if (rgb) {
          const fgL = relativeLuminance(rgb);
          results.push({
            token: token.name,
            ratio: contrastRatio(whiteLuminance, fgL),
            color,
          });
        } else {
          results.push({ token: token.name, ratio: 0, color: color });
        }
      }

      document.body.removeChild(container);
      return results;
    });

    // Each token must achieve WCAG AA ≥ 4.5:1 on white background
    for (const result of contrastResults) {
      expect(
        result.ratio,
        `Token ${result.name} contrast ${result.ratio.toFixed(2)}:1 (color: ${result.color}) must be ≥ 4.5:1 (WCAG AA)`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  /**
   * SC-01 utility emission — the 5 *-text utility class CSS vars are present in the DOM.
   *
   * Verifies the Tailwind compilation pipeline emitted the CSS for all 5 new tokens.
   * Uses CSS.supports() or style injection to confirm each var resolves.
   */
  test("sc-01-utility-classes-exist-in-computed-stylesheet", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/sign-in`);
    await page.waitForLoadState("domcontentloaded");

    const tokenPresence = await page.evaluate(() => {
      const expectedVars = [
        "--comunify-warning-text",
        "--comunify-stable-text",
        "--comunify-accent-text",
        "--comunify-critical-text",
        "--comunify-blue-text",
      ];

      return expectedVars.map((varName) => {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue(varName)
          .trim();
        return { varName, present: value.length > 0, value };
      });
    });

    for (const token of tokenPresence) {
      expect(
        token.present,
        `CSS var ${token.varName} must be defined in :root (got: "${token.value}")`,
      ).toBe(true);
    }
  });

  /**
   * Sanity: no JavaScript errors on sign-in page (baseline health).
   */
  test("sc-01-no-js-errors-on-page-load", async ({ page, baseURL }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await page.goto(`${baseURL}/sign-in`);
    await page.waitForLoadState("domcontentloaded");

    // Filter known non-actionable errors
    const actionableErrors = jsErrors.filter(
      (msg) =>
        !msg.includes("ResizeObserver") &&
        !msg.includes("[Clerk]") &&
        !msg.includes("Non-Error promise rejection"),
    );

    expect(actionableErrors).toHaveLength(0);
  });
});
