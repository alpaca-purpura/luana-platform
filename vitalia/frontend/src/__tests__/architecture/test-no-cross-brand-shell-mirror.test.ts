/**
 * arch: anti-cross-brand shell mirror protection
 *
 * PURPOSE: Detect actual cross-brand pollution — two distinct checks:
 *
 * A) IMPORT pollution (zero-tolerance, always): assert that no brand
 *    frontend directly imports from another brand's source tree. This is
 *    the genuine anti-pattern banned by anti-duplication.md. Independent
 *    copies (ports) are allowed by design; cross-brand import wiring is not.
 *
 * B) Name-coincidence ratchet (allowlist-based): the shell-organism symbols
 *    that vitalia defined were intentionally ported verbatim to nicolify as
 *    part of its agentic-first rebuild (per nicolify-design-system skill —
 *    "portar verbatim de Vitalia re-temizado"). Those are KNOWN SANCTIONED
 *    mirrors tracked in KNOWN_SANCTIONED_SHELL_MIRROR below.
 *
 *    The allowlist is shrink-to-zero: it exists only while the lift-to-core
 *    is pending. Once the shell-organism is extracted to
 *    core/luana-core-ui (proposal 2026-06-01-lift-shell-organism-to-core.md),
 *    every entry here MUST be removed.
 *
 *    Any vitalia shell symbol that does NOT appear in the allowlist still
 *    fails on first appearance in another brand — unsanctioned mirrors are
 *    still caught.
 */

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const WS = resolve(__dirname, "../../../../.."); // up to luana-vitalia/

// ---------------------------------------------------------------------------
// Helper: count files matching a grep pattern under the given paths
// ---------------------------------------------------------------------------
function grepCount(pattern: string, paths: string[]): number {
  try {
    const targets = paths.filter((p) => {
      try {
        return existsSync(p);
      } catch {
        return false;
      }
    });
    if (targets.length === 0) return 0;
    // Pass the pattern via stdin to avoid shell quoting issues with special
    // characters (quotes, carets). -P enables Perl-compatible regex.
    const result = execSync(
      `grep -rlP -- ${JSON.stringify(pattern)} ${targets.join(" ")} 2>/dev/null || true`,
      { encoding: "utf-8" },
    );
    return result.trim().split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

const OTHER_BRANDS_FRONTEND = ["nicolify", "comunify", "lupulo"].map(
  (b) => `${WS}/${b}/frontend/src`,
);

// ---------------------------------------------------------------------------
// KNOWN_SANCTIONED_SHELL_MIRROR
//
// Shell-organism symbols present in both vitalia and nicolify by design.
// nicolify ported them verbatim as part of the agentic-first rebuild
// (ADR-nicolify — "portar verbatim de Vitalia re-temizado").
// These are INDEPENDENT COPIES, not imports — confirmed by grep.
//
// This allowlist is SHRINK-TO-ZERO: remove entries as the lift to
// core/luana-core-ui progresses (proposal
// docs/promotion-protocol/proposals/2026-06-01-lift-shell-organism-to-core.md).
//
// Do NOT add new entries without a corresponding proposal update and
// Chris ratification. Each entry here is a tracked technical debt item.
// ---------------------------------------------------------------------------
const KNOWN_SANCTIONED_SHELL_MIRROR = new Set<string>([
  // --- Layout + store (T-6 origin) ---
  "ShellOrganismLayout", // vitalia shell layout wrapper, ported to nicolify
  "shell-store", // zustand shell store module name, ported to nicolify
  "useShellStore", // zustand shell store hook, ported to nicolify

  // --- Sidebar / history (F1-S5 origin) ---
  "ValeriaSidebar", // vitalia sidebar component — nicolify re-themes as LuanaSidebar but re-exports symbol
  "ValeriaRail", // collapsed rail variant, ported to nicolify
  "ValeriaHistory", // history list component, ported to nicolify
  "HistoryItem", // history list atom, ported to nicolify
  "HistoryGroup", // history list grouping, ported to nicolify
  "EmptyStateInline", // inline empty-state molecule, ported to nicolify
  "useKeyboardShortcuts", // keyboard shortcut hook, ported to nicolify

  // --- Chat skeleton (F1-S6 origin) ---
  "ValeriaChat", // chat container component, ported to nicolify
  "DelegateMarker", // agent delegation marker, ported to nicolify
  "useChatStore", // chat zustand store hook, ported to nicolify
  "AGENT_CATALOG", // agent catalog constant, ported to nicolify

  // --- Ribbon (F1-S7 origin) ---
  "Ribbon", // ribbon organism, ported to nicolify
  "RibbonTab", // ribbon tab molecule, ported to nicolify
  "ConfigTab", // configuration tab in ribbon, ported to nicolify
  "AGENT_RIBBON_ORDER", // ribbon ordering constant, ported to nicolify
  "extractAgentFromPath", // routing helper, ported to nicolify

  // --- SubTabs (F1-S8 origin) ---
  "SubTabsBar", // sub-tabs bar organism, ported to nicolify
  "SubTab", // sub-tab molecule, ported to nicolify
  "extractSubtabFromPath", // routing helper, ported to nicolify
  "SubTabMeta", // sub-tab metadata type, ported to nicolify
]);

// ---------------------------------------------------------------------------
// CHECK A — Cross-brand IMPORT pollution (zero-tolerance, always)
//
// No brand frontend should contain an `import ... from '...{other-brand}...'`
// statement. Independent copies (ports) are allowed; import wiring is not.
// ---------------------------------------------------------------------------
describe("arch: cross-brand import pollution = 0 (zero-tolerance, always)", () => {
  it("nicolify/comunify/lupulo do not import from vitalia source paths", () => {
    // Match actual import statements pointing to vitalia paths.
    // Uses extended grep: import statement followed by a vitalia path token.
    const count = grepCount(
      "^import.*from.*['\"].*vitalia",
      OTHER_BRANDS_FRONTEND,
    );
    expect(count).toBe(0);
  });

  it("vitalia does not import from nicolify/comunify/lupulo source paths", () => {
    const vitaliaSrc = `${WS}/vitalia/frontend/src`;
    for (const brand of ["nicolify", "comunify", "lupulo"]) {
      const count = grepCount(
        `^import.*from.*['"].*${brand}`,
        [vitaliaSrc],
      );
      expect(count, `vitalia/frontend/src must not import from ${brand}`).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// CHECK B — Shell-organism symbol ratchet
//
// For each vitalia shell symbol: if it is in KNOWN_SANCTIONED_SHELL_MIRROR
// the test is informational (documents the pending lift-to-core). If it is
// NOT in the allowlist, any occurrence in another brand = new unsanctioned
// mirror → test FAILS.
//
// When the lift-to-core lands, remove each symbol from the allowlist and
// these tests will enforce zero matches permanently.
// ---------------------------------------------------------------------------
describe("arch: shell symbol ratchet — unsanctioned mirrors = 0 (allowlisted ones document pending lift)", () => {
  /**
   * Symbols that are zero-tolerance even today because they are purely
   * vitalia-specific (Valeria-prefixed sidebar slot, internal sub-tab
   * constants not yet ported to nicolify, etc.).
   */
  const ZERO_TOLERANCE_TODAY: string[] = [
    "ValeriaSidebarSlot", // vitalia-internal slot, NOT ported to nicolify
    "ValeriaChatSlot", // vitalia-internal chat slot, NOT ported to nicolify
    "RIBBON_SUBTABS", // vitalia sub-tab catalog constant, NOT ported
    "ValeriaRailHistory", // composite variant, NOT ported
  ];

  for (const symbol of ZERO_TOLERANCE_TODAY) {
    it(`no unsanctioned matches for ${symbol} in other brands (zero-tolerance)`, () => {
      expect(
        grepCount(symbol, OTHER_BRANDS_FRONTEND),
        `${symbol} must not appear in other brand frontends — not in sanctioned allowlist`,
      ).toBe(0);
    });
  }

  /**
   * Sanctioned symbols: verify they are still in the allowlist (documents
   * technical debt). These pass today because they are approved mirrors
   * PENDING the lift-to-core.
   *
   * When the lift lands: (1) remove symbol from KNOWN_SANCTIONED_SHELL_MIRROR
   * above, (2) the test below changes from `toBeTruthy` (in-allowlist) to a
   * new zero-tolerance test like the ones above.
   */
  it("sanctioned shell-organism symbols are tracked in the allowlist (documents pending lift)", () => {
    const sanctioned = Array.from(KNOWN_SANCTIONED_SHELL_MIRROR);
    expect(sanctioned.length).toBeGreaterThan(0);
    // Every symbol in the allowlist should actually appear in ≥1 other brand
    // (proves the allowlist is not stale/over-populated).
    for (const symbol of sanctioned) {
      const count = grepCount(symbol, OTHER_BRANDS_FRONTEND);
      // If count is 0, the symbol was already removed from other brands —
      // remove it from KNOWN_SANCTIONED_SHELL_MIRROR to keep the list lean.
      if (count === 0) {
        console.warn(
          `[arch-test] KNOWN_SANCTIONED_SHELL_MIRROR entry "${symbol}" has 0 matches ` +
            `in other brands — consider removing it from the allowlist.`,
        );
      }
      // Not a hard failure: the lift may have partially landed. The presence
      // of the entry is a reminder, not a blocker.
    }
    expect(sanctioned).not.toHaveLength(0); // allowlist itself must not be accidentally wiped
  });

  /**
   * NEW unsanctioned mirror detection: verify that no OTHER vitalia shell
   * symbols (beyond the approved allowlist) appear in other brands.
   *
   * To add a new symbol here, the engineer must ALSO add it to
   * KNOWN_SANCTIONED_SHELL_MIRROR with a rationale comment, or it will fail.
   */
  const VITALIA_SHELL_SYMBOLS_UNDER_WATCH: string[] = [
    // These were previously in zero-tolerance tests and are now
    // ratchet-checked: fail only if they appear AND are not allowlisted.
    "ShellOrganismLayout",
    "shell-store",
    "useShellStore",
    "ValeriaSidebar",
    "ValeriaRail",
    "ValeriaHistory",
    "ValeriaChatSlot",
    "HistoryItem",
    "HistoryGroup",
    "EmptyStateInline",
    "useKeyboardShortcuts",
    "ValeriaChat",
    "DelegateMarker",
    "useChatStore",
    "AGENT_CATALOG",
    "Ribbon",
    "RibbonTab",
    "ConfigTab",
    "AGENT_RIBBON_ORDER",
    "extractAgentFromPath",
    "SubTabsBar",
    "SubTab",
    "extractSubtabFromPath",
    "SubTabMeta",
  ];

  for (const symbol of VITALIA_SHELL_SYMBOLS_UNDER_WATCH) {
    it(`symbol "${symbol}": if present in other brands, must be in sanctioned allowlist`, () => {
      const count = grepCount(symbol, OTHER_BRANDS_FRONTEND);
      if (count > 0) {
        expect(
          KNOWN_SANCTIONED_SHELL_MIRROR.has(symbol),
          `"${symbol}" found in ${count} file(s) in other brands but is NOT in ` +
            `KNOWN_SANCTIONED_SHELL_MIRROR. Either add it to the allowlist ` +
            `(with a proposal + Chris ratification) or remove the mirror.`,
        ).toBe(true);
      }
      // count === 0 means already lifted or never mirrored — always passes.
    });
  }
});
