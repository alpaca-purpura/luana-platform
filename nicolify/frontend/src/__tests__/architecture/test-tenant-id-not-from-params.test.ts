/**
 * test-tenant-id-not-from-params.test.ts — architectural fitness test.
 *
 * Ensures NO abel hook or API file uses `useParams(...).tenantId` as the
 * X-Tenant-ID source, and none uses `orgId` from Clerk.
 *
 * Background (DoD #37 systemic bug — 2026-06-04):
 *   The URL `[tenantId]` segment is a human-readable SLUG (e.g. "alpaca-purpura").
 *   The BE expects X-Tenant-ID to be the UUID tenant_id from Clerk publicMetadata.
 *   Using the slug as the API tenant header → 422 on every authenticated request.
 *   This was masked because the e2e navigated with a UUID in the URL (so
 *   useParams().tenantId happened to be a UUID). Real users have a slug URL → 422.
 *   Fix: all abel hooks now use useTenantId() (publicMetadata.tenant_id UUID).
 *
 * Pattern: Ratchet / shrink-only allowlist. New violations = FAIL.
 * Mirror of vitalia's `test-no-clerk-organizations.test.ts` adapted for nicolify.
 *
 * downstream-regression-na: architecture test; no cross-brand consumers.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

import { describe, it, expect } from "vitest";

// ── Paths under test ─────────────────────────────────────────────────────────

// SRC_ROOT = nicolify/frontend/src/
const SRC_ROOT = resolve(__dirname, "../../");
const ABEL_HOOKS_DIR = resolve(SRC_ROOT, "features/abel/hooks");
const ABEL_API_DIR = resolve(SRC_ROOT, "features/abel/api");
const HOOKS_DIR = resolve(SRC_ROOT, "hooks");

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSourceFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function readSource(path: string): string {
  return readFileSync(path, "utf-8");
}

// ── Test 1: Abel hooks do NOT use useParams as API tenant source ──────────────

describe("Abel hooks: NEVER useParams().tenantId as API tenant (slug → 422)", () => {
  const hookFiles = getSourceFiles(ABEL_HOOKS_DIR);

  it("has hook files to check", () => {
    expect(hookFiles.length).toBeGreaterThan(0);
  });

  hookFiles.forEach((filePath) => {
    const filename = filePath.split("/").pop() ?? filePath;

    it(`${filename}: does NOT import useParams from next/navigation`, () => {
      const src = readSource(filePath);
      // Check for import statement (comments mentioning useParams are OK)
      const hasUseParamsImport = /import\s*\{[^}]*useParams[^}]*\}\s*from/.test(src);
      expect(hasUseParamsImport).toBe(false);
    });

    it(`${filename}: does NOT assign useParams().tenantId to tenantId`, () => {
      const src = readSource(filePath);
      // Pattern: tenantId = params.tenantId or tenantId = useParams().tenantId
      expect(src).not.toMatch(/tenantId\s*=\s*params\.tenantId/);
      expect(src).not.toMatch(/tenantId\s*=\s*useParams\(\)/);
    });

    it(`${filename}: does NOT use orgId as tenant source`, () => {
      const src = readSource(filePath);
      // Check no assignment of orgId to tenantId (comments mentioning "NEVER orgId" are OK)
      expect(src).not.toMatch(/tenantId\s*=\s*.*\.orgId/);
      expect(src).not.toContain("useOrganization");
    });
  });
});

// ── Test 2: Abel API files do NOT embed useParams-derived tenant ──────────────

describe("Abel API files: no useParams dependency", () => {
  const apiFiles = getSourceFiles(ABEL_API_DIR);

  it("has API files to check", () => {
    expect(apiFiles.length).toBeGreaterThan(0);
  });

  apiFiles.forEach((filePath) => {
    const filename = filePath.split("/").pop() ?? filePath;

    it(`${filename}: does NOT use useParams`, () => {
      const src = readSource(filePath);
      expect(src).not.toContain("useParams");
    });

    it(`${filename}: does NOT use orgId`, () => {
      const src = readSource(filePath);
      // Comments mentioning orgId prohibition are OK; check no runtime usage
      expect(src).not.toMatch(/\.orgId\b/);
      expect(src).not.toContain("useOrganization");
    });
  });
});

// ── Test 3: useTenantId hook uses publicMetadata.tenant_id ───────────────────

describe("useTenantId hook: reads UUID from publicMetadata, NEVER orgId/useParams", () => {
  const hookPath = resolve(HOOKS_DIR, "use-tenant-id.ts");

  it("useTenantId file exists", () => {
    const src = readSource(hookPath);
    expect(src).toBeTruthy();
  });

  it("useTenantId reads tenant_id from publicMetadata", () => {
    const src = readSource(hookPath);
    expect(src).toContain("publicMetadata");
    expect(src).toContain("tenant_id");
  });

  it("useTenantId does NOT import useParams (comments OK)", () => {
    const src = readSource(hookPath);
    // Comments explaining the prohibition are OK; check no import
    expect(src).not.toMatch(/import\s*\{[^}]*useParams[^}]*\}\s*from/);
  });

  it("useTenantId does NOT use orgId as a variable (comments OK)", () => {
    const src = readSource(hookPath);
    // Comments mentioning orgId are OK; check no runtime usage
    expect(src).not.toMatch(/\.orgId\b/);
    expect(src).not.toMatch(/\bconst\s+\w*orgId\b/);
    expect(src).not.toContain("useOrganization");
  });

  it("useTenantId uses useUser (publicMetadata source), not imported useAuth", () => {
    const src = readSource(hookPath);
    expect(src).toContain("useUser");
    // useAuth doesn't expose publicMetadata — check it's not IMPORTED (comments OK)
    expect(src).not.toMatch(/import\s*\{[^}]*useAuth[^}]*\}\s*from/);
  });

  it("useTenantId returns empty string when not loaded", () => {
    const src = readSource(hookPath);
    expect(src).toContain("isLoaded");
    expect(src).toContain('return ""');
  });
});

// ── Test 4: Abel hooks import useTenantId (not useParams) ────────────────────

describe("Abel hooks: import useTenantId for tenant UUID resolution", () => {
  const hooksToCheck = [
    "use-icps.ts",
    "use-buyers.ts",
    "use-icp-mutations.ts",
    "use-buyer-mutations.ts",
  ];

  hooksToCheck.forEach((filename) => {
    const filePath = resolve(ABEL_HOOKS_DIR, filename);

    it(`${filename}: imports useTenantId`, () => {
      const src = readSource(filePath);
      expect(src).toContain("useTenantId");
      expect(src).toContain("@/hooks/use-tenant-id");
    });

    it(`${filename}: does NOT import useParams`, () => {
      const src = readSource(filePath);
      // Check import statement — comments mentioning useParams are OK
      expect(src).not.toMatch(/import\s*\{[^}]*useParams[^}]*\}\s*from/);
    });
  });
});
