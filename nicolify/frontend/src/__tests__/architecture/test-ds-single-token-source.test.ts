/**
 * Architecture test — V1 (ds-adoption T-1): globals.css @theme mirrors @luana/design-tokens scale.
 *
 * Asserts (drift detection — NO codegen):
 *   1. Every SPACING value from design-tokens is declared in globals.css @theme.
 *   2. Every RADIUS_NAMES entry appears as --radius-{name} in globals.css.
 *   3. Every TYPOGRAPHY_TIERS entry appears as a font-size-related declaration.
 *   4. Semantic COLOR_NAMES (non-agent entries) are present via --color-{name} in @theme.
 *   5. Brand identity intact: --primary: 243 100% 68% (exact), 7 nicolify agent colors.
 *   6. Fonts: League Spartan (sans) + Bree Serif (serif).
 *   7. --radius-control and --radius-pill are declared.
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers.
 */
// cap: shell.shell-nicolify
import { readFileSync } from "fs";
import { resolve } from "path";

import { SPACING, RADIUS_NAMES, TYPOGRAPHY_TIERS, COLOR_NAMES } from "@luana/design-tokens";
import { describe, it, expect } from "vitest";

const GLOBALS = resolve(__dirname, "../../app/globals.css");
const css = readFileSync(GLOBALS, "utf8");

// Semantic-only names (shared contract); agent-per-brand names are brand-owned, not from this list
const SEMANTIC_COLOR_NAMES = (COLOR_NAMES as readonly string[]).filter(
  (n) => !n.startsWith("agent-") && !["success", "warning", "danger", "info"].includes(n),
);

// Nicolify's 7 brand-owned agent colors (declared in globals.css :root, NOT from COLOR_NAMES)
const NICOLIFY_AGENT_SLUGS = ["luana", "abel", "brenda", "christian", "sara", "norvil", "config"];

describe("DS single-token-source — spacing scale in @theme", () => {
  for (const [key, value] of Object.entries(SPACING)) {
    it(`spacing-${key} (${value}) is declared in @theme`, () => {
      // globals.css @theme must declare --spacing-{key}: {value}  OR use the value directly
      // Tailwind v4: spacing values go as --spacing-{key}
      const hasVar = css.includes(`--spacing-${key}:`);
      const hasValue = css.includes(value);
      expect(hasVar || hasValue, `spacing ${key}=${value} not found in globals.css @theme`).toBe(
        true,
      );
    });
  }
});

describe("DS single-token-source — radius names in @theme", () => {
  for (const name of RADIUS_NAMES) {
    it(`--radius-${name} declared in globals.css`, () => {
      expect(css, `--radius-${name} not found`).toMatch(new RegExp(`--radius-${name}\\s*:`));
    });
  }
});

describe("DS single-token-source — typography tiers in @theme", () => {
  for (const tier of TYPOGRAPHY_TIERS) {
    it(`typography tier "${tier}" referenced in globals.css`, () => {
      // Tailwind v4: font-size tiers as --text-{tier} or --font-size-{tier}
      const hasTextVar = css.includes(`--text-${tier}`);
      const hasFontSizeVar = css.includes(`--font-size-${tier}`);
      expect(
        hasTextVar || hasFontSizeVar,
        `typography tier "${tier}" not found in globals.css`,
      ).toBe(true);
    });
  }
});

describe("DS single-token-source — semantic color names present", () => {
  for (const name of SEMANTIC_COLOR_NAMES) {
    it(`--color-${name} declared in @theme`, () => {
      expect(css, `--color-${name} not found in @theme`).toMatch(
        new RegExp(`--color-${name}\\s*:`),
      );
    });
  }
});

describe("DS single-token-source — brand identity intact", () => {
  it("--primary is exactly 243 100% 68% (light mode)", () => {
    // :root --primary must be 243 100% 68% (nicolify indigo brand)
    expect(css).toMatch(/--primary\s*:\s*243\s+100%\s+68%/);
  });

  it("League Spartan declared as sans font", () => {
    expect(css).toContain("League Spartan");
    expect(css).toMatch(/--font-sans\s*:.*League Spartan/);
  });

  it("Bree Serif declared as serif font", () => {
    expect(css).toContain("Bree Serif");
    expect(css).toMatch(/--font-serif\s*:.*Bree Serif/);
  });

  for (const slug of NICOLIFY_AGENT_SLUGS) {
    it(`--agent-${slug} declared in globals.css`, () => {
      expect(css, `--agent-${slug} not found`).toMatch(new RegExp(`--agent-${slug}\\s*:`));
    });
  }
});

describe("DS single-token-source — radius-control + radius-pill", () => {
  it("--radius-pill is declared (9999px)", () => {
    expect(css).toMatch(/--radius-pill\s*:\s*9999px/);
  });

  it("--radius-control points to var(--radius-pill)", () => {
    expect(css).toMatch(/--radius-control\s*:\s*var\(--radius-pill\)/);
  });
});

describe("DS dark-mode wiring (ds-adoption G round-1 regression)", () => {
  // BUG-A: next-themes sets <html data-theme="dark">; Tailwind v4 dark: defaults to
  // prefers-color-scheme and ignores it. The @custom-variant re-points dark: to the
  // data-theme/.dark selector so kit + own dark: variants honor the toggle.
  it("@custom-variant dark targets [data-theme=dark] (not just prefers-color-scheme)", () => {
    expect(
      css,
      "@custom-variant dark missing — dark: variants won't honor the theme toggle",
    ).toMatch(/@custom-variant\s+dark\s*\([^)]*\[data-theme="dark"\][^)]*\)/);
  });

  it("@custom-variant dark also covers the .dark class", () => {
    expect(css).toMatch(/@custom-variant\s+dark\s*\([^)]*\.dark[^)]*\)/);
  });

  // BUG-B: consumed kit molecules (EntityWorkspaceLayout/EntitySubNavBar/Group/AutosaveBadge)
  // live in ui-kit/src root, outside organism/shell. @source must scan the whole src or
  // their classes (dark:/arbitrary) get purged silently.
  it("@source scans the whole @luana/ui-kit/src (not only organism/shell)", () => {
    expect(css, "@source too narrow — kit molecules outside organism/shell get purged").toMatch(
      /@source\s+"[^"]*@luana\/ui-kit\/src"\s*;/,
    );
  });
});
