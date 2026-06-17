/**
 * _helpers.ts — Computed contrast + WCAG formula utilities
 * (Story comunify-design-system-a11y-contrast-cement T-4)
 *
 * Used by SC-01, SC-03, SC-04 Playwright specs.
 * References WCAG 2.1 SC 1.4.3 formula: https://www.w3.org/TR/WCAG20-TECHS/G18.html
 */
import type { Page } from "@playwright/test";

/**
 * Compute WCAG 2.1 contrast ratio between an element's foreground color and
 * its closest opaque background ancestor.
 *
 * Uses browser-side getComputedStyle + standard WCAG sRGB relative luminance formula.
 * Returns 0 if selector not found or styles not resolvable.
 */
export async function getContrastRatio(
  page: Page,
  selector: string,
): Promise<number> {
  return await page.evaluate((sel) => {
    function parseRGB(value: string): [number, number, number] | null {
      const m = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
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

    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return 0;

    const fgStyle = getComputedStyle(el);
    const fgRGB = parseRGB(fgStyle.color);
    if (!fgRGB) return 0;

    // Walk up DOM to find opaque background
    let bgRGB: [number, number, number] | null = null;
    let node: HTMLElement | null = el;
    while (node) {
      const bgStyle = getComputedStyle(node);
      const parsed = parseRGB(bgStyle.backgroundColor);
      if (parsed) {
        // Check alpha channel — rgba(r,g,b,0) = transparent
        const alphaMatch = bgStyle.backgroundColor.match(
          /rgba\([^)]+,\s*([\d.]+)\)/,
        );
        const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
        if (alpha > 0.9) {
          bgRGB = parsed;
          break;
        }
      }
      node = node.parentElement;
    }

    if (!bgRGB) {
      // Default to white (standard assumption for page background)
      bgRGB = [255, 255, 255];
    }

    const fgL = relativeLuminance(fgRGB);
    const bgL = relativeLuminance(bgRGB);
    return contrastRatio(fgL, bgL);
  }, selector);
}

/**
 * Probe that an element's text token class resolves to a computed color
 * visible in the DOM (i.e. the CSS var chain is not broken).
 *
 * Returns true if the element exists and has a non-transparent color.
 */
export async function hasResolvedColor(
  page: Page,
  selector: string,
): Promise<boolean> {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return false;
    const color = getComputedStyle(el).color;
    return !!color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
  }, selector);
}
