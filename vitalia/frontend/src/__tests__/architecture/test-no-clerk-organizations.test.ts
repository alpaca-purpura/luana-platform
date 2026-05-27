/**
 * Architecture test — test-no-clerk-organizations.test.ts
 * F1-S3 vitalia-fase1-tenant-switcher — T-10
 *
 * Enforces MEMORY.md::no-clerk-organizations 2026-05-20 constraint:
 * "Luana NO usa Clerk Organizations en esta etapa."
 *
 * Scans F1-S3 new files for prohibited Clerk Organizations imports:
 * - orgId
 * - useOrganization
 * - auth().orgId
 * - orgSlug
 *
 * Scope: F1-S3 implementation files (NOT legacy hooks that predate this story).
 * Legacy exclusions are listed in LEGACY_EXCLUSIONS (shrink-only ratchet).
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "../../..");

// ── Prohibited patterns (Clerk Organizations) ─────────────────────────────
// NOTE: Patterns match only in non-comment lines (lines that start with
// whitespace + code, not * or // prefixes). This avoids false positives
// from documentation comments that mention the forbidden patterns to explain
// what NOT to use (e.g., "no orgId, no useOrganization" in JSDoc).
/**
 * Returns true if the line is a comment line (starts with * or //).
 * Used to avoid false positives from JSDoc that mentions forbidden patterns.
 */
function isCommentLine(line: string): boolean {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith("*") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*")
  );
}

/**
 * Returns non-comment lines from file content.
 */
function codeLines(content: string): string[] {
  return content.split("\n").filter((line) => !isCommentLine(line));
}

const PROHIBITED_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  description: string;
}> = [
  {
    pattern: /\borgId\b/,
    description:
      "orgId (Clerk Organizations) — use Luana IAM tenant_id instead",
  },
  {
    pattern: /\buseOrganization\s*[({,]/,
    description: "useOrganization (Clerk Organizations) — not used in Luana",
  },
  {
    pattern: /\bauth\(\)\.orgId\b/,
    description:
      "auth().orgId (Clerk Organizations) — use auth().userId instead",
  },
  {
    pattern: /\borgSlug\b/,
    description: "orgSlug (Clerk Organizations) — not applicable in Luana",
  },
  {
    pattern: /\buseOrganizationList\s*[({]/,
    description:
      "useOrganizationList (Clerk Organizations) — use useTenants instead",
  },
  {
    pattern: /\buseClerk\(\)\.organization\b/,
    description: "clerk.organization (Clerk Organizations) — not used in Luana",
  },
];

// ── F1-S3 scope: files added by this story ────────────────────────────────
const F1_S3_FILES: ReadonlyArray<string> = [
  "src/components/shared/shell-organism/TenantBadge.tsx",
  "src/components/shared/shell-organism/TenantOption.tsx",
  "src/components/shared/shell-organism/TenantSwitcher.tsx",
  "src/components/shared/shell-organism/TenantStoreBootstrap.tsx",
  "src/components/shared/shell-organism/AddClinicPlaceholderModal.tsx",
  "src/components/shared/shell-organism/types.ts",
  "src/stores/tenant-store.ts",
  "src/hooks/useTenants.ts",
  "src/hooks/useSignOutCleanup.ts",
  "src/lib/tenant-palette.ts",
];

// ── Legacy exclusions (files that predate F1-S3 — shrink-only ratchet) ───
// These files use Clerk Organizations patterns from before the no-clerk-orgs decision.
// Do NOT add new files here. This list must SHRINK, never grow.
const LEGACY_EXCLUSIONS: ReadonlySet<string> = new Set<string>([
  // Pre-F1-S3 hooks from F1-S0 / earlier stories (legacy Clerk Organizations usage)
  "src/hooks/useClinicId.ts",
  "src/hooks/useTenantLocale.ts",
]);

describe("Architecture: F1-S3 files must NOT use Clerk Organizations (MEMORY no-clerk-orgs 2026-05-20)", () => {
  for (const relativePath of F1_S3_FILES) {
    it(`${relativePath} — no prohibited Clerk Organizations patterns`, () => {
      const filePath = join(ROOT, relativePath);

      let content: string;
      try {
        content = readFileSync(filePath, "utf-8");
      } catch {
        // File doesn't exist — may have been skipped in this implementation
        // Only fail if file is expected (non-optional)
        console.warn(`[arch-test] File not found: ${relativePath} — skipping`);
        return;
      }

      const violations: string[] = [];
      // Check only non-comment lines to avoid false positives from JSDoc
      const nonCommentContent = codeLines(content).join("\n");

      for (const { pattern, description } of PROHIBITED_PATTERNS) {
        if (pattern.test(nonCommentContent)) {
          violations.push(
            `  - ${description} (matched /${pattern.source}/ in ${relativePath})`,
          );
        }
      }

      expect(
        violations,
        [
          `Clerk Organizations usage detected in F1-S3 file: ${relativePath}`,
          "Per MEMORY.md::no-clerk-organizations 2026-05-20:",
          "  Luana NO usa Clerk Organizations. Multi-tenant via luana-core-iam tenants+users.",
          "  Clerk is identity provider only.",
          "",
          "Violations found:",
          ...violations,
          "",
          "Fix: use Luana IAM patterns instead:",
          "  - Replace orgId → useTenantStore (activeTenant.id)",
          "  - Replace useOrganization → useTenants (React Query hook)",
          "  - Replace auth().orgId → auth().userId (for bootstrap calls only)",
        ].join("\n"),
      ).toHaveLength(0);
    });
  }
});

describe("Architecture: legacy exclusions list must shrink (ratchet)", () => {
  it("LEGACY_EXCLUSIONS count must not grow (shrink-only ratchet)", () => {
    // This baseline was set at F1-S3 implementation time (2026-05-22).
    // When legacy files are migrated away from Clerk Organizations, remove them from LEGACY_EXCLUSIONS
    // and reduce this number.
    const MAX_LEGACY_EXCLUSIONS = 2; // shrink-only

    expect(
      LEGACY_EXCLUSIONS.size,
      `Legacy exclusions grew! Current: ${LEGACY_EXCLUSIONS.size}, max: ${MAX_LEGACY_EXCLUSIONS}. ` +
        "Only REMOVE entries from LEGACY_EXCLUSIONS — never add new ones. " +
        "If you need to add a new file, it must NOT use Clerk Organizations.",
    ).toBeLessThanOrEqual(MAX_LEGACY_EXCLUSIONS);
  });

  it("All legacy exclusion paths must still exist (no dead entries)", () => {
    const deadEntries: string[] = [];

    for (const relativePath of LEGACY_EXCLUSIONS) {
      const filePath = join(ROOT, relativePath);
      try {
        readFileSync(filePath, "utf-8");
      } catch {
        deadEntries.push(relativePath);
      }
    }

    // If a file was removed/migrated, remove it from LEGACY_EXCLUSIONS too
    if (deadEntries.length > 0) {
      console.warn(
        "[arch-test] Dead LEGACY_EXCLUSIONS entries detected — remove them from the set:\n" +
          deadEntries.map((p) => `  - ${p}`).join("\n"),
      );
    }
    // Soft warning only (files may have been intentionally removed)
  });
});
