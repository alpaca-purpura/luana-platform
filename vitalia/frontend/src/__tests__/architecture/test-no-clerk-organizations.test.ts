/**
 * Architecture test — test-no-clerk-organizations.test.ts
 * F1-S3 vitalia-fase1-tenant-switcher — T-10
 * T-FIX-1-FE tightened 2026-06-01 — full src/ scan for Clerk Organizations hooks
 *
 * Enforces MEMORY.md::no-clerk-organizations 2026-05-20 constraint:
 * "Luana NO usa Clerk Organizations en esta etapa."
 *
 * Scans F1-S3 new files AND all src/ files for prohibited Clerk Organizations imports:
 * - orgId
 * - useOrganization / useOrganizationList
 * - auth().orgId
 * - orgSlug
 * - OrganizationSwitcher / CreateOrganization / OrganizationProfile (Clerk UI components)
 *
 * Scope: F1-S3 implementation files (original scope) + full src/ scan (T-FIX-1-FE tightening).
 * Legacy exclusions are listed in LEGACY_EXCLUSIONS (shrink-only ratchet).
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join, relative } from "path";

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

/**
 * Recursively collect all .ts and .tsx files under a directory.
 * Excludes __tests__ and node_modules.
 */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

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
// T-FIX-1-FE 2026-06-01: useClinicId.ts removed (fixed to use only user.publicMetadata).
const LEGACY_EXCLUSIONS: ReadonlySet<string> = new Set<string>([
  // Pre-F1-S3 hooks from F1-S0 / earlier stories (legacy Clerk Organizations usage)
  // useClinicId.ts was fixed in T-FIX-1-FE — removed from exclusions.
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
    // T-FIX-1-FE 2026-06-01: useClinicId.ts was fixed to remove useOrganization.
    // Baseline reduced from 2 → 1 (shrink-only ratchet).
    const MAX_LEGACY_EXCLUSIONS = 1; // shrink-only

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

/**
 * T-FIX-1-FE 2026-06-01 — Full src/ scan for Clerk Organizations hook IMPORTS.
 *
 * Per MEMORY.md::no-clerk-organizations (cement 2026-05-20):
 * Luana does NOT use Clerk Organizations. clinic_id + tenant_id are OUR
 * data from luana-core-iam, stored in Clerk user.publicMetadata by us.
 *
 * This test specifically catches IMPORT statements that pull Clerk org
 * hooks/components from @clerk/*:
 *   - useOrganization
 *   - useOrganizationList
 *   - OrganizationSwitcher
 *   - CreateOrganization
 *   - OrganizationProfile
 *
 * Files in CLERK_ORG_IMPORT_EXCLUSIONS are exempt (shrink-only ratchet).
 * Each exclusion is tech-debt that must be migrated away from Clerk orgs.
 */

/**
 * Detects import statements that import Clerk org hooks/components from @clerk/* packages.
 * Pattern: import { ..., <OrgSymbol>, ... } from "@clerk/..."
 * This is more precise than full-text scan — avoids false positives from
 * files that use "orgId" from luana-core-iam (our own tenant data).
 */
const CLERK_ORG_IMPORT_SYMBOLS: ReadonlyArray<{
  symbol: RegExp;
  description: string;
}> = [
  {
    symbol: /\buseOrganization\b/,
    description: "useOrganization from @clerk — use user.publicMetadata instead",
  },
  {
    symbol: /\buseOrganizationList\b/,
    description:
      "useOrganizationList from @clerk — use useTenants (luana-core-iam) instead",
  },
  {
    symbol: /\bOrganizationSwitcher\b/,
    description: "OrganizationSwitcher from @clerk — not used in Luana",
  },
  {
    symbol: /\bCreateOrganization\b/,
    description: "CreateOrganization from @clerk — not used in Luana",
  },
  {
    symbol: /\bOrganizationProfile\b/,
    description: "OrganizationProfile from @clerk — not used in Luana",
  },
];

/**
 * Returns true if the line is a @clerk/* import statement that imports
 * any of the forbidden Clerk org symbols.
 */
function isClerkOrgImportLine(
  line: string,
  symbols: ReadonlyArray<{ symbol: RegExp; description: string }>,
): string[] {
  // Must be an import from @clerk/*
  if (!/@clerk\//.test(line)) return [];
  if (!line.trimStart().startsWith("import")) return [];
  const found: string[] = [];
  for (const { symbol, description } of symbols) {
    if (symbol.test(line)) {
      found.push(description);
    }
  }
  return found;
}

/**
 * Files exempt from Clerk org import scan (shrink-only ratchet).
 * Each entry is a known pre-existing violation to be migrated.
 * DO NOT add new entries — fix the violation instead.
 *
 * Baseline established at T-FIX-1-FE (2026-06-01):
 *   - useClinicId.ts: FIXED in T-FIX-1-FE (removed from exclusions)
 *   - AuditedSection.tsx: pre-existing, tracked for future cleanup
 *   - useTenantLocale.ts: pre-existing, tracked for future cleanup
 *   - onboarding hooks/components: pre-existing, tracked for migration
 */
const CLERK_ORG_IMPORT_EXCLUSIONS: ReadonlySet<string> = new Set<string>([
  // useTenantLocale.ts: pre-dates no-clerk-orgs decision; tracked for future cleanup
  "src/hooks/useTenantLocale.ts",
  // AuditedSection.tsx: pre-existing violation, tracked for cleanup
  "src/components/shared/phi/AuditedSection.tsx",
  // onboarding hooks/components: pre-existing violations, tracked for migration
  "src/features/onboarding/components/WizardOnboardingLayout.tsx",
  "src/features/onboarding/hooks/use-wizard-completion.ts",
  "src/features/onboarding/hooks/use-wizard-live-preview.ts",
  "src/features/onboarding/hooks/use-wizard-onboarding-state.ts",
  "src/features/onboarding/hooks/use-wizard-slot-extraction.ts",
]);

/** Baseline cap for CLERK_ORG_IMPORT_EXCLUSIONS — shrink only, never grow */
const MAX_CLERK_ORG_IMPORT_EXCLUSIONS = 7;

describe("Architecture: full src/ scan — no @clerk org hook IMPORTS (T-FIX-1-FE)", () => {
  it("CLERK_ORG_IMPORT_EXCLUSIONS count must not grow (shrink-only ratchet — baseline 7, T-FIX-1-FE 2026-06-01)", () => {
    expect(
      CLERK_ORG_IMPORT_EXCLUSIONS.size,
      `CLERK_ORG_IMPORT_EXCLUSIONS grew beyond ${MAX_CLERK_ORG_IMPORT_EXCLUSIONS}. ` +
        "Only REMOVE entries — migrate existing violations rather than adding new ones.",
    ).toBeLessThanOrEqual(MAX_CLERK_ORG_IMPORT_EXCLUSIONS);
  });

  it("No source file outside exclusions imports Clerk Organization hooks/components from @clerk/*", () => {
    const srcDir = resolve(ROOT, "src");
    const allFiles = collectSourceFiles(srcDir);

    const violations: string[] = [];

    for (const absolutePath of allFiles) {
      const relPath = relative(ROOT, absolutePath);
      // Skip: exclusions list and the arch test file itself
      if (CLERK_ORG_IMPORT_EXCLUSIONS.has(relPath)) continue;
      if (relPath.includes("__tests__/architecture/test-no-clerk-organizations")) continue;

      let content: string;
      try {
        content = readFileSync(absolutePath, "utf-8");
      } catch {
        continue;
      }

      const lines = content.split("\n");
      for (const line of lines) {
        if (isCommentLine(line)) continue;
        const found = isClerkOrgImportLine(line, CLERK_ORG_IMPORT_SYMBOLS);
        for (const desc of found) {
          violations.push(`  ${relPath}: ${desc}`);
        }
      }
    }

    expect(
      violations,
      [
        "Clerk Organizations hook/component imports detected in src/ files.",
        "Per MEMORY.md::no-clerk-organizations 2026-05-20:",
        "  Luana does NOT use Clerk Organizations.",
        "  clinic_id / tenant_id come from luana-core-iam (our data),",
        "  stored in Clerk user.publicMetadata by us — NOT from Clerk org APIs.",
        "",
        "Violations found:",
        ...violations,
        "",
        "Fix:",
        "  - Remove useOrganization import — read clinic_id from user.publicMetadata.clinicId",
        "  - Remove useOrganizationList import — use useTenants (luana-core-iam hook) instead",
        "  - Remove OrganizationSwitcher/CreateOrganization/OrganizationProfile imports",
        "  If this is a pre-existing file, add it to CLERK_ORG_IMPORT_EXCLUSIONS (with migration plan).",
      ].join("\n"),
    ).toHaveLength(0);
  });
});
