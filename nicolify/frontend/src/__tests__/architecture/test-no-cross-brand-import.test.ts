// cap: shell-organism.ds-adoption
// story-origin: nicolify-r0-design-system-adoption T-2
/**
 * test-no-cross-brand-import.test.ts — V6 arch gate: 0 imports from other brands.
 *
 * TDD RED-first: written before mirrors are deleted.
 * Replica of vitalia CHECK A pattern — per-brand, not cross-brand copy.
 *
 * Ratchet pattern: allowlist is EMPTY. Any match = violation.
 *
 * Checks:
 *   - No import from vitalia/ comunify/ lupulo/ paths in nicolify frontend src
 *
 * spec_anchor: 04-validators.yaml V6-arch-no-cross-brand-import
 * validators_gate: V6
 * downstream-regression-na: brand-local arch test
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

import { describe, it, expect } from "vitest";

// ── Config ────────────────────────────────────────────────────────────────────

const SRC_DIR = resolve(__dirname, "../../");

// Ratchet allowlist — EMPTY (shrink-only)
const KNOWN_CROSS_BRAND_IMPORTS: string[] = [];

// Other brand paths that MUST NOT appear in imports
const FORBIDDEN_BRAND_PATTERNS = [/vitalia/, /comunify/, /lupulo/] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    // Skip node_modules and .next
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

interface CrossBrandViolation {
  file: string;
  line: string;
  lineNumber: number;
  brand: string;
}

function isImportLine(line: string): boolean {
  return /^\s*import\s/.test(line) || /^\s*from\s+['"]/.test(line);
}

function scanFileForCrossBrandImports(filePath: string): CrossBrandViolation[] {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const relPath = filePath.replace(SRC_DIR, "src");
  return content.split("\n").flatMap((line, i) => {
    if (!isImportLine(line)) return [];
    return FORBIDDEN_BRAND_PATTERNS.filter((p) => p.test(line)).map((p) => ({
      file: relPath,
      line: line.trim(),
      lineNumber: i + 1,
      brand: p.source,
    }));
  });
}

function findCrossBrandImports(files: string[]): CrossBrandViolation[] {
  return files
    .filter((f) => !KNOWN_CROSS_BRAND_IMPORTS.includes(f))
    .flatMap(scanFileForCrossBrandImports);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Architecture V6: no cross-brand imports in nicolify frontend (ADR-014)", () => {
  it("nicolify src/ must not import from vitalia/, comunify/, or lupulo/", () => {
    const files = collectSourceFiles(SRC_DIR);
    const violations = findCrossBrandImports(files);

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.lineNumber} — "${v.line}" (brand: ${v.brand})`)
        .join("\n");
      throw new Error(
        `Cross-brand import violation — ${violations.length} occurrence(s):\n${report}\n\n` +
          `nicolify must NEVER import from another brand.\n` +
          `Fix: move shared code to core/@luana/* packages via /pm-luana promotion gate.`,
      );
    }

    expect(violations).toHaveLength(0);
  });

  it("KNOWN_CROSS_BRAND_IMPORTS allowlist is empty (ratchet — never grows)", () => {
    expect(KNOWN_CROSS_BRAND_IMPORTS).toHaveLength(0);
  });
});
