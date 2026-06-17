/**
 * Architecture test — DS dark-mode wiring contract (canon §2.10 · lift 2026-06-16).
 *
 * @luana/ui-kit ships components with Tailwind `dark:` variants (AutosaveBadge/alert/
 * chart/FloatingAutosaveIndicator) but ships NO CSS — every consumer wires dark in its
 * own globals.css. This gate asserts comunify honors the contract so a future @source
 * narrowing or a dropped @custom-variant fails the build instead of silently breaking
 * dark (tsc green, visual broken). Origin: nicolify ds-adoption G round-1 (fix b09bc9dc).
 *
 * Asserts:
 *   1. @custom-variant dark re-points dark: to [data-theme="dark"] (next-themes attribute),
 *      not @media prefers-color-scheme.
 *   2. …and also covers the .dark class.
 *   3. @source scans the WHOLE @luana/ui-kit/src (kit molecules live outside organism/shell).
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers.
 */
// cap: comunify-shell-organism
import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const GLOBALS = resolve(__dirname, "../../app/globals.css");
const css = readFileSync(GLOBALS, "utf8");

describe("DS dark-mode wiring (canon §2.10 — kit dark: honors the theme toggle)", () => {
  it("@custom-variant dark targets [data-theme=dark] (not only prefers-color-scheme)", () => {
    expect(
      css,
      "@custom-variant dark missing — kit dark: variants won't honor the data-theme toggle",
    ).toMatch(/@custom-variant\s+dark\s*\([^)]*\[data-theme="dark"\][^)]*\)/);
  });

  it("@custom-variant dark also covers the .dark class", () => {
    expect(css).toMatch(/@custom-variant\s+dark\s*\([^)]*\.dark[^)]*\)/);
  });

  it('@source scans the whole @luana/ui-kit/src (not only "organism/shell")', () => {
    expect(css, "@source too narrow — kit dark:/arbitrary classes get purged silently").toMatch(
      /@source\s+"[^"]*@luana\/ui-kit\/src"\s*;/,
    );
  });
});
