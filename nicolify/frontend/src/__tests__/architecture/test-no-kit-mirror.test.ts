// cap: shell-organism.ds-adoption
// story-origin: nicolify-r0-design-system-adoption T-2
/**
 * test-no-kit-mirror.test.ts — V5 arch gate: 0 local components duplicating @luana/ui-kit.
 *
 * TDD RED-first: written before mirrors are deleted (test must fail first).
 * After T-2 deletion + repoint, all assertions go GREEN.
 *
 * Ratchet pattern (ADR-014 § enforcement): allowlist is EMPTY.
 * Any match = violation. Allowlist is shrink-only — never add entries.
 *
 * Checks:
 *   - No local EntityWorkspaceLayout declaration in components/shared/
 *   - No local EntitySubNavBar declaration in components/shared/
 *   - No local EmptyState declaration in components/shared/
 *   - No local AutosaveBadge declaration in components/shared/
 *
 * spec_anchor: 04-validators.yaml V5-arch-no-kit-mirror
 * validators_gate: V5
 * downstream-regression-na: brand-local arch test; no cross-brand consumers
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

import { describe, it, expect } from "vitest";

// ── Config ────────────────────────────────────────────────────────────────────

const SHARED_DIR = resolve(__dirname, "../../components/shared");

// Ratchet allowlist — EMPTY (shrink-only per ADR-014)
const KNOWN_KIT_MIRRORS: string[] = [];

// Kit component names that must NOT be re-declared locally
const KIT_COMPONENT_NAMES = [
  "EntityWorkspaceLayout",
  "EntitySubNavBar",
  "EmptyState",
  "AutosaveBadge",
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function collectTsxFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Returns files that export the given component name as a named export.
 * Matches: `export function ComponentName` or `export const ComponentName`
 * Excludes test files.
 */
function findLocalDeclarations(files: string[], componentName: string): string[] {
  const pattern = new RegExp(`export\\s+(function|const)\\s+${componentName}[\\s(<]`, "m");
  return files.filter((filePath) => {
    if (filePath.includes(".test.") || filePath.includes(".spec.")) return false;
    try {
      const content = readFileSync(filePath, "utf-8");
      return pattern.test(content);
    } catch {
      return false;
    }
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Architecture V5: no local mirror of @luana/ui-kit components (ADR-014)", () => {
  const sharedFiles = collectTsxFiles(SHARED_DIR);

  for (const componentName of KIT_COMPONENT_NAMES) {
    it(`${componentName} must NOT be declared locally in components/shared/ (kit provides it)`, () => {
      const violations = findLocalDeclarations(sharedFiles, componentName).filter(
        (f) => !KNOWN_KIT_MIRRORS.includes(f),
      );

      if (violations.length > 0) {
        const relativePaths = violations.map((f) => f.replace(resolve(__dirname, "../../../"), ""));
        throw new Error(
          `Kit mirror violation — ${componentName} declared locally in ${relativePaths.join(", ")}.\n` +
            `These components must be imported from @luana/ui-kit.\n` +
            `Fix: delete the local copy + repoint imports to @luana/ui-kit.\n` +
            `Allowlist is EMPTY per ADR-014 ratchet (never add entries).`,
        );
      }

      expect(violations).toHaveLength(0);
    });
  }

  it("KNOWN_KIT_MIRRORS allowlist is empty (ratchet — never grows)", () => {
    expect(KNOWN_KIT_MIRRORS).toHaveLength(0);
  });
});
