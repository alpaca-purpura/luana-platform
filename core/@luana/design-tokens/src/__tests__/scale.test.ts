// canon: design-system-canon.md §6.1 · story-origin: core-ds-foundation
/**
 * F-1 — @luana/design-tokens scale + NAME contract.
 *
 * Asserts (AC-1, RN-4, RN-5, D1):
 *  - spacing scale = Tailwind 4px-base AS-IS (shared cross-brand, identical values).
 *  - radius / typography / color = shared NAME contract only (tiers/names),
 *    NOT per-brand VALUES (never merge palettes — RN-5).
 *  - all exports are frozen (Object.isFrozen) — same idiom as z-index.ts.
 *  - index barrel re-exports all (z-index preserved).
 */
import { describe, it, expect } from "vitest";
import * as tokens from "../index";
import { SPACING, type SpacingKey } from "../spacing";
import { RADIUS_NAMES, type RadiusName } from "../radius";
import { TYPOGRAPHY_TIERS, type TypographyTier } from "../typography";
import { COLOR_NAMES, type ColorName } from "../color-names";

describe("@luana/design-tokens — spacing scale (RN-4, D1)", () => {
  it("exports the Tailwind 4px-base scale AS-IS", () => {
    // 4px-base ladder (rem): 0,1,2,3,4,5,6,8,10,12,16 — no invented rhythm.
    expect(SPACING["0"]).toBe("0");
    expect(SPACING["1"]).toBe(".25rem"); // 4px
    expect(SPACING["2"]).toBe(".5rem"); // 8px
    expect(SPACING["4"]).toBe("1rem"); // 16px
    expect(SPACING["6"]).toBe("1.5rem"); // 24px
    expect(SPACING["16"]).toBe("4rem"); // 64px
  });

  it("is frozen (immutable SSoT, z-index idiom)", () => {
    expect(Object.isFrozen(SPACING)).toBe(true);
  });

  it("has every key resolving to a non-empty value", () => {
    for (const k of Object.keys(SPACING) as SpacingKey[]) {
      expect(typeof SPACING[k]).toBe("string");
      expect(SPACING[k].length).toBeGreaterThan(0);
    }
  });
});

describe("@luana/design-tokens — radius NAME contract (RN-5)", () => {
  it("exports the shared tier names (sm/md/lg/bubble/pill/control), NOT per-brand values", () => {
    const expected: RadiusName[] = ["sm", "md", "lg", "bubble", "pill", "control"];
    expect([...RADIUS_NAMES]).toEqual(expected);
    // contract carries NAMES only — no hex / rem brand values leaked here.
    for (const name of RADIUS_NAMES) {
      expect(name).not.toMatch(/rem|px|#/);
    }
  });

  it("is frozen", () => {
    expect(Object.isFrozen(RADIUS_NAMES)).toBe(true);
  });
});

describe("@luana/design-tokens — typography NAME contract (RN-5)", () => {
  it("exports the shared tier names (display/heading/body/caption)", () => {
    const expected: TypographyTier[] = ["display", "heading", "body", "caption"];
    expect([...TYPOGRAPHY_TIERS]).toEqual(expected);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(TYPOGRAPHY_TIERS)).toBe(true);
  });
});

describe("@luana/design-tokens — color NAME contract (RN-5)", () => {
  it("exports semantic + agent token NAMES (shared), never hex VALUES", () => {
    expect(COLOR_NAMES).toContain("primary");
    expect(COLOR_NAMES).toContain("agent-lisa");
    expect(COLOR_NAMES).toContain("danger");
    // NAMES only — no brand palette merged in (RN-5).
    for (const name of COLOR_NAMES) {
      expect(name).not.toMatch(/#|hsl|rgb|\d+%/);
    }
  });

  it("is frozen", () => {
    expect(Object.isFrozen(COLOR_NAMES)).toBe(true);
  });

  it("name list is unique (no dup tokens)", () => {
    expect(new Set(COLOR_NAMES).size).toBe(COLOR_NAMES.length);
  });
});

describe("@luana/design-tokens — index barrel", () => {
  it("re-exports the new scale + keeps z-index", () => {
    expect(tokens.SPACING).toBe(SPACING);
    expect(tokens.RADIUS_NAMES).toBe(RADIUS_NAMES);
    expect(tokens.TYPOGRAPHY_TIERS).toBe(TYPOGRAPHY_TIERS);
    expect(tokens.COLOR_NAMES).toBe(COLOR_NAMES);
    // z-index export preserved (no regression).
    expect((tokens as Record<string, unknown>).Z_INDEX).toBeDefined();
  });

  it("type names compile (ColorName narrowed)", () => {
    const c: ColorName = "primary";
    expect(c).toBe("primary");
  });
});
