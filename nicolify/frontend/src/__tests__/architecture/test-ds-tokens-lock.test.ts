/**
 * Architecture test — nicolify-r0-design-system-adoption T-4:
 * the @luana/eslint-config `no-arbitrary-value` rule, loaded through the real
 * ESLint Linter, LOCKS the four token axes and honors the named escape.
 *
 * Covers (canon §0 — tokens-only, ADR-014):
 *   SC-1 — locked-axis arbitrary (font-size / radius / spacing / color-hex)
 *          → rule reports, with an actionable token suggestion (AC-2).
 *   SC-2 — sizing-axis arbitrary (w/h/min-w/max-w/min-h/size) → 0 reports (RN-1).
 *   SC-4 — `// ds-lock-allow: <razón>` named escape → allowed (RN-6).
 *   + tokenized arbitraries (`text-[hsl(var(--x))]`, `rounded-[var(--radius)]`) → 0.
 *
 * This is the brand-side guarantee that the shared rule behaves as specified
 * once wired into nicolify/frontend/eslint.config.mjs.
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers.
 */
import noArbitraryValue from "@luana/eslint-config/no-arbitrary-value";
import { Linter } from "eslint";
import { describe, it, expect } from "vitest";

const linter = new Linter();

/** Lint a snippet with ONLY the no-arbitrary-value rule = error. Returns messages. */
function lint(code: string) {
  return linter.verify(code, {
    plugins: { "@luana/ds": { rules: { "no-arbitrary-value": noArbitraryValue } } },
    rules: { "@luana/ds/no-arbitrary-value": "error" },
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
  });
}

describe("T-4 — no-arbitrary-value locks the four token axes (SC-1)", () => {
  const locked: [string, string, RegExp][] = [
    ["font-size", 'const c = "text-[13px]";', /font-size.*text-sm/],
    ["radius", 'const c = "rounded-[7px]";', /radius.*rounded-md/],
    ["spacing", 'const c = "p-[18px]";', /spacing.*p-4/],
    ["color-hex", 'const c = "text-[#635BFF]";', /color-hex.*text-foreground/],
  ];

  for (const [axis, code, suggestion] of locked) {
    it(`flags a locked ${axis} arbitrary with an actionable suggestion (AC-2)`, () => {
      const msgs = lint(code);
      expect(msgs.length, `${axis}: expected exactly 1 report`).toBe(1);
      expect(msgs[0].ruleId).toBe("@luana/ds/no-arbitrary-value");
      // AC-2 — message names the axis AND suggests the nearest token utility.
      expect(msgs[0].message).toMatch(suggestion);
    });
  }

  it("flags multiple locked arbitraries in one className", () => {
    const msgs = lint('const c = "gap-[10px] rounded-[5px] text-[#fff]";');
    expect(msgs).toHaveLength(3);
  });
});

describe("T-4 — sizing axes are NOT locked (SC-2 / RN-1)", () => {
  const sizing = [
    'const c = "w-[200px]";',
    'const c = "max-w-[640px]";',
    'const c = "min-h-[3rem] h-[48px]";',
    'const c = "size-[18px]";',
  ];
  for (const code of sizing) {
    it(`sizing arbitrary scans clean: ${code}`, () => {
      expect(lint(code)).toHaveLength(0);
    });
  }
});

describe("T-4 — tokenized arbitraries are NOT raw literals", () => {
  const tokenized = [
    'const c = "text-[hsl(var(--nicolify-fg))]";',
    'const c = "rounded-[var(--radius)]";',
    'const c = "bg-[var(--card)]";',
    'const c = "p-[theme(spacing.4)]";',
  ];
  for (const code of tokenized) {
    it(`tokenized arbitrary scans clean: ${code}`, () => {
      expect(lint(code)).toHaveLength(0);
    });
  }
});

describe("T-4 — `ds-lock-allow` named escape (SC-4 / RN-6)", () => {
  it("same-line escape suppresses the report", () => {
    const code =
      'const c = "text-[10px]"; // ds-lock-allow: sm avatar initial; below text-xs, no smaller token';
    expect(lint(code)).toHaveLength(0);
  });

  it("previous-line escape suppresses the report", () => {
    const code = [
      "// ds-lock-allow: 10px emoji decorator in chip; below text-xs, no smaller token",
      'const c = "text-[10px]";',
    ].join("\n");
    expect(lint(code)).toHaveLength(0);
  });

  it("arbitrary prose comment does NOT exempt (only ds-lock-allow is honored)", () => {
    const code = 'const c = "text-[10px]"; // TODO: revisit this size later';
    expect(lint(code)).toHaveLength(1);
  });
});
