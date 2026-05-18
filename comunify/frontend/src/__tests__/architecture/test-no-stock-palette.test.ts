/**
 * Architecture fitness ratchet — T-2 design-system-cement
 *
 * Enforces that Comunify frontend uses ONLY comunify-* design tokens.
 * NO stock Tailwind palette classes (bg-blue-500, text-gray-*, etc.)
 * NO HEX literals in component source (except globals.css SSoT allowlist).
 *
 * Scenarios covered:
 *   Scenario 2 (negative):    stock-palette-prohibida — test FAILS with violations list
 *   Scenario 4 (adversarial): hex-literal-blocked — test FAILS with violations list
 *
 * RED state (T-2 baseline): test fails with ~91 violations listed verbatim.
 * GREEN state (post T-3 close): test passes with 0 violations.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import allowlistJson from "./_stock-palette-allowlist.json" with { type: "json" };

// ──────────────────────────────────────────────────────────────
// Regex SSoT — matches spec §"Acceptance Criteria" verbatim
// ──────────────────────────────────────────────────────────────
const STOCK_PALETTE_REGEX =
  /\b(bg|text|border|ring|from|to|via|hover:bg|hover:text|hover:border|focus:bg|focus:text|focus:border)-(gray|green|yellow|red|blue|emerald|amber|rose|sky|violet|purple|pink|orange|teal|cyan|indigo|fuchsia|lime|stone|zinc|neutral|slate)-[0-9]+\b/g;

const HEX_LITERAL_REGEX = /#[0-9a-fA-F]{6}\b/g;
const HEX_ARBITRARY_TAILWIND_REGEX = /\b(bg|text|border|ring|from|to|via)-\[#[0-9a-fA-F]{6}\]/g;

// ──────────────────────────────────────────────────────────────
// Permanent allowlist — SSoT files where literals are CANON
// ──────────────────────────────────────────────────────────────
const PERMANENT_ALLOWLIST_PATHS = new Set([
  "src/app/globals.css", // SSoT runtime tokens (HEX in --comunify-gradient is canon)
]);

// JSON allowlist: { file, class, line?, justification, owner_pr } shrink-only enforced
interface AllowlistEntry {
  file: string;
  class: string;
  line?: number;
  justification: string;
  owner_pr: string;
}
const ALLOWLIST: AllowlistEntry[] = allowlistJson as AllowlistEntry[];

// ──────────────────────────────────────────────────────────────
// File walker — src/**/*.{tsx,ts} excluding node_modules + tests
// ──────────────────────────────────────────────────────────────
function walkFiles(root: string, results: string[] = []): string[] {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__" || entry === ".next") continue;
      walkFiles(full, results);
    } else if (st.isFile() && (entry.endsWith(".tsx") || entry.endsWith(".ts"))) {
      results.push(full);
    }
  }
  return results;
}

// ──────────────────────────────────────────────────────────────
// Match detector — returns violations not covered by allowlist
// ──────────────────────────────────────────────────────────────
interface Violation {
  file: string;
  line: number;
  match: string;
  kind: "stock-palette" | "hex-literal" | "hex-arbitrary";
}

function detectViolations(filePath: string, relPath: string): Violation[] {
  if (PERMANENT_ALLOWLIST_PATHS.has(relPath)) return [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Stock palette
    for (const m of line.matchAll(STOCK_PALETTE_REGEX)) {
      if (!isAllowed(relPath, m[0])) {
        violations.push({ file: relPath, line: lineNum, match: m[0], kind: "stock-palette" });
      }
    }
    // HEX literal (skip comments — best-effort: skip if line trimmed starts with // or *)
    const trimmed = line.trim();
    if (!trimmed.startsWith("//") && !trimmed.startsWith("*") && !trimmed.startsWith("/*")) {
      for (const m of line.matchAll(HEX_LITERAL_REGEX)) {
        if (!isAllowed(relPath, m[0])) {
          violations.push({ file: relPath, line: lineNum, match: m[0], kind: "hex-literal" });
        }
      }
      for (const m of line.matchAll(HEX_ARBITRARY_TAILWIND_REGEX)) {
        if (!isAllowed(relPath, m[0])) {
          violations.push({ file: relPath, line: lineNum, match: m[0], kind: "hex-arbitrary" });
        }
      }
    }
  });
  return violations;
}

function isAllowed(relPath: string, className: string): boolean {
  return ALLOWLIST.some((e) => e.file === relPath && e.class === className);
}

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────
describe("Architecture: no stock Tailwind palette + no HEX literals in src/", () => {
  const srcRoot = join(__dirname, "..", "..");

  it("no stock palette classes in src/**/*.{tsx,ts}", () => {
    const files = walkFiles(srcRoot);
    const allViolations: Violation[] = [];
    for (const f of files) {
      const rel = relative(join(__dirname, "..", ".."), f).replace(/\\/g, "/");
      const relForAllowlist = `src/${rel}`;
      const v = detectViolations(f, relForAllowlist).filter((x) => x.kind === "stock-palette");
      allViolations.push(...v);
    }
    if (allViolations.length > 0) {
      const report = allViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line} — ${v.match} (use comunify token; see comunify/docs/architecture/design-system.md §1)`
        )
        .join("\n");
      throw new Error(
        `Found ${allViolations.length} stock palette violation(s):\n${report}\n\nTo allowlist (must justify): add entry to comunify/frontend/src/__tests__/architecture/_stock-palette-allowlist.json`
      );
    }
    expect(allViolations).toHaveLength(0);
  });

  it("no HEX literals (#RRGGBB) in src/**/*.{tsx,ts} (except permanent allowlist)", () => {
    const files = walkFiles(srcRoot);
    const allViolations: Violation[] = [];
    for (const f of files) {
      const rel = relative(join(__dirname, "..", ".."), f).replace(/\\/g, "/");
      const relForAllowlist = `src/${rel}`;
      const v = detectViolations(f, relForAllowlist).filter(
        (x) => x.kind === "hex-literal" || x.kind === "hex-arbitrary"
      );
      allViolations.push(...v);
    }
    if (allViolations.length > 0) {
      const report = allViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line} — HEX literal ${v.match} forbidden (use text-comunify-*/bg-comunify-* tokens; see design-system.md §1)`
        )
        .join("\n");
      throw new Error(`Found ${allViolations.length} HEX violation(s):\n${report}`);
    }
    expect(allViolations).toHaveLength(0);
  });

  it("allowlist is shrink-only — never grows beyond baseline manifest", () => {
    // Baseline manifest stored alongside as _stock-palette-allowlist.json
    // Initial value: 0 entries (allowlist starts empty post-migration).
    // If allowlist exceeds baseline + 0 → fail.
    expect(ALLOWLIST.length).toBeLessThanOrEqual(0);
    // If a justified addition is needed, builder MUST bump baseline in same PR with rationale.
    // For T-2 initial commit: ALLOWLIST = []; this assertion passes trivially.
  });
});
