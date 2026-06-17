/**
 * Architecture fitness ratchet — comunify-design-system-a11y-contrast-cement (T-2)
 *
 * Enforces that Comunify frontend does NOT use Tailwind class pairs that produce
 * WCAG AA contrast failures (< 4.5:1 on normal text).
 *
 * 6 HARD-blocked patterns (opción C híbrida — per 03-arch.md § 4.1):
 *   Group A — solid bg + text-white (1.80–2.95:1 fail):
 *     warning-bg-white-text, stable-bg-white-text, accent-bg-white-text
 *   Group B — semantic text token on light bg without -text suffix (1.72–2.82:1 fail):
 *     warning-text-on-bg, stable-text-on-bg, accent-text-on-bg
 *
 * NOT blocked (opción C — dev responsibility, marginal ratios):
 *   bg-comunify-critical text-white (3.76:1 — UI/large text OK)
 *   bg-comunify-blue text-white (3.81:1 — UI/large text OK)
 *   text-comunify-critical bare, text-comunify-blue bare (marginal, not hard-blocked)
 *
 * Scenarios covered:
 *   SC-01 (utility emission)  — text-comunify-{X}-text classes exist in tailwind.config.ts
 *   SC-02 (negative)          — forbidden pairs detected → test fails with violation list
 *   SC-02 (allowlist)         — allowlist baseline = [] (clean slate ratchet)
 *   SC-04 (ratchet)           — legacy pattern grep finds 0 matches post-sweep
 *
 * RED state (T-2 baseline): ~13 violations in 7 source files.
 * GREEN state (post T-3 sweep): 0 violations.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import allowlistJson from "./_low-contrast-allowlist.json" with { type: "json" };

// ──────────────────────────────────────────────────────────────
// Regex SSoT — 6 HARD-blocked patterns per 03-arch.md § 4.1
// ──────────────────────────────────────────────────────────────
// Negative lookahead rationale (03-arch.md § 4.2):
//   (?!-text)   — exclude legitimate "text-comunify-warning-text" (the fix)
//   (?![/-])    — exclude "bg-comunify-warning/10" (Camino B tint) and "bg-comunify-warning-text" (safe)
//
// sc-01-utility-classes-exist-in-bundle: verified via tailwind.config.ts content grep below.

const FORBIDDEN_PAIR_REGEXES: {
  kind: string;
  pattern: RegExp;
  hint: string;
}[] = [
  // Group A — solid bg + text-white (1.80–2.95:1 fail)
  {
    kind: "warning-bg-white-text",
    pattern:
      /\bbg-comunify-warning(?!-text)(?![/-])\b[^"'`]*\btext-white\b|\btext-white\b[^"'`]*\bbg-comunify-warning(?!-text)(?![/-])\b/g,
    hint: "1.80:1 fail. Use Camino B: bg-comunify-warning/10 border border-comunify-warning text-comunify-warning-text",
  },
  {
    kind: "stable-bg-white-text",
    pattern:
      /\bbg-comunify-stable(?!-text)(?![/-])\b[^"'`]*\btext-white\b|\btext-white\b[^"'`]*\bbg-comunify-stable(?!-text)(?![/-])\b/g,
    hint: "2.20:1 fail. Use Camino B: bg-comunify-stable/10 border border-comunify-stable text-comunify-stable-text",
  },
  {
    kind: "accent-bg-white-text",
    pattern:
      /\bbg-comunify-accent(?!-text)(?![/-])\b[^"'`]*\btext-white\b|\btext-white\b[^"'`]*\bbg-comunify-accent(?!-text)(?![/-])\b/g,
    hint: "2.95:1 fail. Use Camino B: bg-comunify-accent/10 border border-comunify-accent text-comunify-accent-text",
  },
  // Group B — semantic text on bg without -text suffix (1.72–2.82:1 fail)
  {
    kind: "warning-text-on-bg",
    pattern: /\btext-comunify-warning(?!-text)(?![/-])\b/g,
    hint: "1.72:1 on bg-comunify-bg. Use text-comunify-warning-text (4.72:1 AA).",
  },
  {
    kind: "stable-text-on-bg",
    pattern: /\btext-comunify-stable(?!-text)(?![/-])\b/g,
    hint: "2.10:1 on bg-comunify-bg. Use text-comunify-stable-text (4.77:1 AA).",
  },
  {
    kind: "accent-text-on-bg",
    pattern: /\btext-comunify-accent(?!-text)(?![/-])\b/g,
    hint: "2.82:1 on bg-comunify-bg. Use text-comunify-accent-text (4.53:1 AA).",
  },
];

// ──────────────────────────────────────────────────────────────
// Permanent allowlist — files where patterns are definition context
// ──────────────────────────────────────────────────────────────
const PERMANENT_ALLOWLIST_PATHS = new Set([
  "src/app/globals.css", // SSoT runtime tokens
  "src/__tests__/architecture/test-no-low-contrast-pairs.test.ts", // self-ref (regex strings)
  "src/__tests__/architecture/_low-contrast-allowlist.json", // self-ref
]);

// ──────────────────────────────────────────────────────────────
// Allowlist (JSON ratchet — shrink-only)
// ──────────────────────────────────────────────────────────────
interface AllowlistEntry {
  file: string;
  match: string;
  kind: string;
  line?: number;
  justification: string;
  owner_pr: string;
}
const ALLOWLIST: AllowlistEntry[] = allowlistJson as AllowlistEntry[];

// Magic comment escape: "// a11y-allow: <reason>" on the violation's line suppresses it inline.
// Baseline for T-2: ALLOWLIST = [] and no magic comments in source → ~13 violations expected.
const MAGIC_COMMENT_REGEX = /\/\/\s*a11y-allow(?::\s*[^"\n]+)?/;

// ──────────────────────────────────────────────────────────────
// File walker — src/**/*.{tsx,ts} excluding node_modules + __tests__ + .next
// ──────────────────────────────────────────────────────────────
function walkFiles(root: string, results: string[] = []): string[] {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (
        entry === "node_modules" ||
        entry === "__tests__" ||
        entry === ".next"
      )
        continue;
      walkFiles(full, results);
    } else if (
      st.isFile() &&
      (entry.endsWith(".tsx") || entry.endsWith(".ts"))
    ) {
      results.push(full);
    }
  }
  return results;
}

// ──────────────────────────────────────────────────────────────
// Violation detector
// ──────────────────────────────────────────────────────────────
interface Violation {
  file: string;
  line: number;
  match: string;
  kind: string;
  hint: string;
}

function detectViolations(filePath: string, relPath: string): Violation[] {
  if (PERMANENT_ALLOWLIST_PATHS.has(relPath)) return [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  for (const { kind, pattern, hint } of FORBIDDEN_PAIR_REGEXES) {
    // Reset lastIndex between files (global regex reuse)
    pattern.lastIndex = 0;
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      // Reset pattern for each line check
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        // Skip if magic comment present on the same line
        if (MAGIC_COMMENT_REGEX.test(line)) return;
        // Skip if in JSON allowlist
        if (
          ALLOWLIST.some(
            (e) =>
              e.file === relPath &&
              e.kind === kind &&
              (!e.line || e.line === lineNum),
          )
        )
          return;
        // Reset and find actual match string
        pattern.lastIndex = 0;
        const m = pattern.exec(line);
        violations.push({
          file: relPath,
          line: lineNum,
          match: m?.[0] ?? "(pattern match)",
          kind,
          hint,
        });
      }
    });
  }
  return violations;
}

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────
describe("Architecture: no WCAG AA low-contrast Tailwind class pairs in src/", () => {
  const srcRoot = join(__dirname, "..", "..");

  /**
   * sc-01-utility-classes-exist-in-bundle
   * Verify the 5 new -text utility tokens are declared in tailwind.config.ts.
   * This ensures Tailwind generates the utility classes at build time.
   */
  it("sc-01-utility-classes-exist-in-bundle: 5 comunify-*-text slots in tailwind.config.ts", () => {
    const twConfig = readFileSync(
      join(srcRoot, "..", "tailwind.config.ts"),
      "utf-8",
    );
    const expected = [
      "comunify-warning-text",
      "comunify-stable-text",
      "comunify-accent-text",
      "comunify-critical-text",
      "comunify-blue-text",
    ];
    const missing = expected.filter((slot) => !twConfig.includes(`"${slot}"`));
    if (missing.length > 0) {
      throw new Error(
        `Missing utility class slots in tailwind.config.ts: ${missing.join(", ")}\n` +
          `Add them per 03-arch.md § 2.3 pattern.`,
      );
    }
    expect(missing).toHaveLength(0);
  });

  /**
   * sc-02-forbidden-pairs-fail-build
   * Scans all .tsx/.ts under src/ (excluding permanent allowlist) for 6 HARD-blocked patterns.
   * T-2 RED state: ~13 violations expected.
   * T-3 GREEN state: 0 violations.
   */
  it("sc-02-forbidden-pairs-fail-build: zero low-contrast pairs in src/**/*.{tsx,ts}", () => {
    const files = walkFiles(srcRoot);
    const allViolations: Violation[] = [];

    for (const f of files) {
      const rel = relative(join(srcRoot, ".."), f).replace(/\\/g, "/");
      // relPath as stored: starts with "src/"
      const relForAllowlist = rel.startsWith("src/") ? rel : `src/${rel}`;
      allViolations.push(...detectViolations(f, relForAllowlist));
    }

    if (allViolations.length > 0) {
      const report = allViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line} [${v.kind}] "${v.match}"\n    → ${v.hint}`,
        )
        .join("\n");
      throw new Error(
        `Found ${allViolations.length} low-contrast pair violation(s):\n\n${report}\n\n` +
          `Fix options:\n` +
          `  1. Migrate to Camino B pattern (see design-system.md § 6).\n` +
          `  2. Add inline magic comment: // a11y-allow: <justification>\n` +
          `  3. Add entry to _low-contrast-allowlist.json (justified + shrink-only).`,
      );
    }

    expect(allViolations).toHaveLength(0);
  });

  /**
   * sc-02-allowlist-requires-justification
   * Allowlist baseline is [] (clean slate per spec opción C híbrida).
   * Every entry in the allowlist must have a non-empty justification field.
   * This is the ratchet enforcement: allowlist can only shrink, never silently grow.
   */
  it("sc-02-allowlist-requires-justification: all allowlist entries have justification", () => {
    const invalid = ALLOWLIST.filter(
      (e) => !e.justification || e.justification.trim().length < 10,
    );
    if (invalid.length > 0) {
      throw new Error(
        `Allowlist entries missing justification (min 10 chars):\n` +
          invalid
            .map(
              (e) =>
                `  ${e.file}:${e.line ?? "?"} [${e.kind}] — "${e.justification}"`,
            )
            .join("\n") +
          `\n\nEach allowlist entry requires a verbose justification explaining why the contrast exception is acceptable.`,
      );
    }
    expect(invalid).toHaveLength(0);
  });

  /**
   * sc-04-legacy-pattern-grep-ratchet
   * Post-T-3 sweep: zero bare text-comunify-{warning,stable,accent} in src/features/ + src/app/.
   * This is a SUPERSET of sc-02 (includes non-bg context like error labels, link text).
   * At T-2 RED state: violations exist (same set as sc-02 for Group B patterns).
   * At T-3 GREEN state: 0 violations.
   */
  it("sc-04-legacy-pattern-grep-ratchet: zero bare text-comunify-{warning,stable,accent} in features/", () => {
    const featuresRoot = join(srcRoot, "features");
    const appRoot = join(srcRoot, "app");

    const featureFiles = walkFiles(featuresRoot);
    const appFiles = walkFiles(appRoot).filter(
      (f) => !f.includes("globals.css"),
    );
    const allFiles = [...featureFiles, ...appFiles];

    const legacyPatterns = [
      {
        pattern: /\btext-comunify-warning(?!-text)(?![/-])\b/g,
        token: "text-comunify-warning",
      },
      {
        pattern: /\btext-comunify-stable(?!-text)(?![/-])\b/g,
        token: "text-comunify-stable",
      },
      {
        pattern: /\btext-comunify-accent(?!-text)(?![/-])\b/g,
        token: "text-comunify-accent",
      },
    ];

    const ratchetViolations: { file: string; line: number; token: string }[] =
      [];

    for (const f of allFiles) {
      const rel = relative(join(srcRoot, ".."), f).replace(/\\/g, "/");
      const relForAllowlist = rel.startsWith("src/") ? rel : `src/${rel}`;
      if (PERMANENT_ALLOWLIST_PATHS.has(relForAllowlist)) continue;

      const content = readFileSync(f, "utf-8");
      const lines = content.split("\n");

      for (const { pattern, token } of legacyPatterns) {
        pattern.lastIndex = 0;
        lines.forEach((line, idx) => {
          pattern.lastIndex = 0;
          if (pattern.test(line) && !MAGIC_COMMENT_REGEX.test(line)) {
            ratchetViolations.push({
              file: relForAllowlist,
              line: idx + 1,
              token,
            });
          }
        });
      }
    }

    if (ratchetViolations.length > 0) {
      const report = ratchetViolations
        .map(
          (v) =>
            `  ${v.file}:${v.line} — bare "${v.token}" (use "${v.token}-text" for WCAG AA)`,
        )
        .join("\n");
      throw new Error(
        `Found ${ratchetViolations.length} legacy text token(s) post-sweep:\n${report}`,
      );
    }

    expect(ratchetViolations).toHaveLength(0);
  });
});
