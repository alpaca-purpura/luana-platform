/**
 * Architecture test — HB-107: no KIT-SHAPED primitive left LOCAL in a feature.
 *
 * Canon §5 + frontend-visual-fidelity D1: a generic UI primitive (Button, Card,
 * Select, Dialog, …) belongs in `core/@luana/ui-kit` + its Storybook story — NOT
 * re-implemented locally in `{brand}/frontend/src/features/{m}/components/`. A
 * primitive left local drifts and is invisible to other features/brands.
 *
 * This is the MECHANICAL backstop for the "promote net-new shared to the kit"
 * rule that until now lived only in `/auditor` Cat 16 prose (a local primitive
 * passed every git hook). It is intentionally CONSERVATIVE to avoid false
 * positives: it flags ONLY files whose basename is EXACTLY a kit-primitive name
 * (case-insensitive) — e.g. `features/foo/components/Button.tsx`. A domain
 * molecule that COMPOSES a primitive (`IcpCard.tsx`, `BuyerLeafForm.tsx`,
 * `CohortRosterTable.tsx`) is NOT a primitive name → never flagged.
 *
 * SHRINK-ONLY ratchet. Baseline MEASURED 2026-06-24 (HB-107 seed): 0.
 * A new `features/<m>/components/<Primitive>.tsx` → FAILS. Fix = promote it to
 * `@luana/ui-kit` + story and import it, OR (if genuinely domain-specific) give
 * it a domain-prefixed name.
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers.
 */
import { resolve, join, basename } from "path";

import { describe, it, expect } from "vitest";

import { collectSourceFiles, relPosix } from "./_ds-lock-scanner";

const ROOT = resolve(__dirname, "../../..");
const FEATURES = join(ROOT, "src", "features");

// Kit primitives that must live in `@luana/ui-kit` (NOT re-implemented in a feature).
// Exact basename match only (lowercased) — domain-prefixed names are exempt by design.
const KIT_PRIMITIVES = new Set([
  "accordion",
  "alert",
  "alertdialog",
  "avatar",
  "badge",
  "button",
  "calendar",
  "card",
  "chart",
  "checkbox",
  "chip",
  "collapsible",
  "combobox",
  "command",
  "dialog",
  "drawer",
  "dropdown",
  "dropdownmenu",
  "form",
  "input",
  "label",
  "menu",
  "modal",
  "pagination",
  "popover",
  "progress",
  "radio",
  "radiogroup",
  "scrollarea",
  "select",
  "separator",
  "sheet",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "tooltip",
]);

// ── Shrink-only baseline (MEASURED 2026-06-24 — HB-107) ───────
const BASELINE = 0;

function scan(): string[] {
  const hits: string[] = [];
  for (const abs of collectSourceFiles(FEATURES, [".tsx"])) {
    if (!abs.replace(/\\/g, "/").includes("/components/")) continue;
    const base = basename(abs)
      .replace(/\.tsx$/, "")
      .toLowerCase();
    if (KIT_PRIMITIVES.has(base)) hits.push(relPosix(ROOT, abs));
  }
  return hits;
}

describe("HB-107 — kit-shaped primitive left local in a feature (shrink-only)", () => {
  const hits = scan();

  it(`local kit-primitive count (${hits.length}) does not exceed baseline (${BASELINE})`, () => {
    expect(
      hits.length,
      [
        `New local kit primitive(s) detected (${hits.length} > baseline ${BASELINE}):`,
        ...hits.map((f) => `  - ${f}`),
        "",
        "Canon §5: a generic primitive belongs in core/@luana/ui-kit + its story,",
        "not in features/{m}/components/. PROMOTE it to the kit and import it, or —",
        "if it is genuinely domain-specific — give it a domain-prefixed name",
        "(e.g. IcpCard, CohortTable) so it is not a bare primitive name.",
      ].join("\n"),
    ).toBeLessThanOrEqual(BASELINE);
  });
});
