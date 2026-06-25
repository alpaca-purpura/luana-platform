/**
 * Architecture test — V1 (ds-adoption T-1): globals.css @theme mirrors @luana/design-tokens scale.
 * C2-T2 extension: new VALUE axes (shadow/typo-scale/radius-scale + semantic colors).
 *
 * Asserts (drift detection — NO codegen):
 *   1. Every SPACING value from design-tokens is declared in globals.css @theme.
 *   2. Every RADIUS_NAMES entry appears as --radius-{name} in globals.css.
 *   3. Every TYPOGRAPHY_TIERS entry appears as a font-size-related declaration.
 *   4. Semantic COLOR_NAMES (non-agent entries) are present via --color-{name} in @theme.
 *   5. Brand identity intact: --primary: 243 100% 68% (exact), 7 nicolify agent colors.
 *   6. Fonts: League Spartan (sans) + Bree Serif (serif).
 *   7. --radius-control and --radius-pill are declared.
 *   [T-2] 8. SHADOW values in @theme match @luana/design-tokens SHADOW (no-drift equality).
 *   [T-2] 9. TYPOGRAPHY_SCALE keys covered — @theme declares a size per tier.
 *   [T-2] 10. RADIUS_SCALE structure present in TS (completeness).
 *   [T-2] 11. Semantic status colors (success/warning/danger/info) in @theme + contrast.
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers.
 */
// cap: shell.shell-nicolify
import { readFileSync } from "fs";
import { resolve } from "path";

import {
  SPACING,
  RADIUS_NAMES,
  RADIUS_SCALE,
  TYPOGRAPHY_TIERS,
  TYPOGRAPHY_SCALE,
  COLOR_NAMES,
  SHADOW,
  SEMANTIC_COLOR_DEFAULTS,
} from "@luana/design-tokens";
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

// ── C2-T2 VALUE AXES ─────────────────────────────────────────────────────────

/** Normalize whitespace for CSS value comparison (multi-value shadows have commas). */
function normCss(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

describe("[T-2] DS no-drift — SHADOW values in @theme match SHADOW constant (equality)", () => {
  for (const [key, value] of Object.entries(SHADOW)) {
    it(`--shadow-${key} in @theme equals SHADOW.${key}`, () => {
      const varName = key === "none" ? "--shadow-none" : `--shadow-${key}`;
      const match = css.match(new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`));
      expect(match, `${varName} not found in globals.css @theme`).toBeTruthy();
      if (match) {
        expect(normCss(match[1])).toBe(normCss(value));
      }
    });
  }
});

describe("[T-2] DS no-drift — TYPOGRAPHY_SCALE tiers covered in @theme", () => {
  it("TYPOGRAPHY_SCALE exports size/lineHeight/weight for every tier (structure completeness)", () => {
    for (const tier of TYPOGRAPHY_TIERS) {
      const entry = TYPOGRAPHY_SCALE[tier];
      expect(entry, `TYPOGRAPHY_SCALE.${tier} missing`).toBeDefined();
      expect(entry.size).toBeTruthy();
      expect(entry.lineHeight).toBeTruthy();
      expect(entry.weight).toBeTruthy();
    }
  });

  for (const tier of TYPOGRAPHY_TIERS) {
    it(`@theme declares --text-${tier} (nicolify brand-owned size)`, () => {
      expect(css).toMatch(new RegExp(`--text-${tier}\\s*:`));
    });
  }
});

describe("[T-2] DS no-drift — RADIUS_SCALE structure completeness", () => {
  it("RADIUS_SCALE exports sm/md/lg/control", () => {
    const expected = ["sm", "md", "lg", "control"] as const;
    for (const k of expected) {
      expect(RADIUS_SCALE[k], `RADIUS_SCALE.${k} missing`).toBeDefined();
    }
  });

  it("RADIUS_SCALE.control is calc(var(--radius) - 2px) (RN-7)", () => {
    expect(RADIUS_SCALE.control).toBe("calc(var(--radius) - 2px)");
  });
});

describe("[T-2] DS no-drift — semantic status colors in @theme (completeness + contrast)", () => {
  const STATUS = ["success", "warning", "danger", "info"] as const;

  for (const name of STATUS) {
    it(`--color-${name} declared in @theme`, () => {
      expect(css).toMatch(new RegExp(`--color-${name}\\s*:`));
    });
    it(`--color-${name}-foreground declared in @theme`, () => {
      expect(css).toMatch(new RegExp(`--color-${name}-foreground\\s*:`));
    });
    it(`--${name} HSL channel declared in :root`, () => {
      expect(css).toMatch(new RegExp(`--${name}\\s*:`));
    });
  }

  it("warning-foreground :root HSL is dark (L < 30%) — canon §2.8 contrast", () => {
    // :root --warning-foreground: H S% L%
    const match = css.match(/--warning-foreground\s*:\s*(\d+)\s+(\d+)%\s+(\d+)%/);
    expect(match, "--warning-foreground HSL not found in :root").toBeTruthy();
    if (match) {
      const L = parseInt(match[3]);
      expect(L, `warning-foreground L=${L}% must be < 30% (dark) for contrast`).toBeLessThan(30);
    }
  });

  it("SEMANTIC_COLOR_DEFAULTS matches :root --warning channel (no-drift)", () => {
    const expected = SEMANTIC_COLOR_DEFAULTS["warning"];
    // Check the :root light-mode --warning value matches the shared default
    const match = css.match(/--warning\s*:\s*([\d.]+\s+[\d.]+%\s+[\d.]+%)/);
    expect(match, "--warning not found in :root").toBeTruthy();
    if (match) {
      expect(normCss(match[1])).toBe(normCss(expected));
    }
  });
});

// ── EXISTING TESTS (BELOW) ──────────────────────────────────────────────────

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
