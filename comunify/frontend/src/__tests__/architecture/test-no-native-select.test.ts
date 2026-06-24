/**
 * Architecture test — HB-106 (A-1): no NATIVE `<select>` in comunify/frontend/src
 * (Design System canon §2.5, ADR-014).
 *
 * SHRINK-ONLY ratchet:
 *   - +1 native `<select>` → FAILS (count > baseline).
 *   - migrate a native `<select>` to the `Select` primitive → passes, then lower
 *     the baseline. The baseline NEVER rises.
 *
 * Baseline MEASURED 2026-06-24 (HB-106 seed): 1 occurrence across 1 file.
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers.
 */
import { describe, it, expect } from "vitest";
import { resolve, join } from "path";
import { collectSourceFiles, read, relPosix, stripComments } from "./_ds-lock-scanner";

const ROOT = resolve(__dirname, "../../..");
const SRC = join(ROOT, "src");

const NATIVE_SELECT_RE = /<select(\s|>)/g;

// ── Shrink-only baseline (MEASURED 2026-06-24 — HB-106) ───────
const BASELINE_TOTAL = 1;
const BASELINE_FILES = 1;

function scan(): { total: number; files: string[] } {
  let total = 0;
  const files: string[] = [];
  for (const abs of collectSourceFiles(SRC, [".tsx"])) {
    const src = stripComments(read(abs));
    const matches = src.match(NATIVE_SELECT_RE);
    if (matches && matches.length > 0) {
      total += matches.length;
      files.push(relPosix(ROOT, abs));
    }
  }
  return { total, files };
}

describe("HB-106 A-1 — no native <select> (canon §2.5, shrink-only)", () => {
  const { total, files } = scan();

  it(`native <select> count (${total}) does not exceed baseline (${BASELINE_TOTAL})`, () => {
    expect(
      total,
      [
        `New native <select> detected: ${total} > baseline ${BASELINE_TOTAL}.`,
        "Design System canon §2.5 mandates the Shadcn-style <Select> primitive",
        "(import from components/ui/select). A native <select> bypasses tokens, a11y",
        "and keyboard handling. Files with native selects:",
        ...files.map((f) => `  - ${f}`),
      ].join("\n"),
    ).toBeLessThanOrEqual(BASELINE_TOTAL);
  });

  it(`files with native <select> (${files.length}) does not exceed baseline (${BASELINE_FILES})`, () => {
    expect(files.length).toBeLessThanOrEqual(BASELINE_FILES);
  });

  it("baseline is not stale-high (zero native selects → lower baseline to 0)", () => {
    if (total === 0) {
      expect(BASELINE_TOTAL, "all native selects migrated — set BASELINE_TOTAL to 0").toBe(0);
    } else {
      expect(BASELINE_TOTAL).toBeGreaterThan(0);
    }
  });
});
