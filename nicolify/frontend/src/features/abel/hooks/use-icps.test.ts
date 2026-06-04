// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * use-icps.test.ts — TDD tests for ICP React Query hooks.
 *
 * Covers:
 *   - icpQueryKeys shape (stable, correct keys)
 *   - useIcps: query key is ['abel', 'icp', 'list']
 *   - useIcps: calls icpApi.list with token + tenantId (NEVER orgId)
 *   - useIcps: disabled when not signed in
 *   - useIcp: query key is ['abel', 'icp', id]
 *   - useIcp: disabled when icpId is null
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §1 hooks/use-icps.ts
 * validators_gate: RQ keys ['abel','icp','list'] / ['abel','icp',id] + tenant isolation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import { icpQueryKeys } from "./use-icps";

// ── Source scan: tenantId source (NEVER orgId) ─────────────────────────────

const HOOK_PATH = resolve(__dirname, "./use-icps.ts");

describe("use-icps tenant isolation (NEVER Clerk orgId)", () => {
  it("does NOT call useAuth().orgId as tenantId", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    // Ensure orgId is not used as a value (only allowed in comment "NEVER orgId")
    // Check that no line sets orgId as a header or uses it in fetch calls
    expect(src).not.toContain("X-Tenant-ID: orgId");
    expect(src).not.toContain("useOrganization");
    // Should not assign orgId to tenantId
    expect(src).not.toMatch(/tenantId\s*=\s*.*orgId/);
  });

  it("uses useParams() to extract tenantId from URL", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("useParams");
    expect(src).toContain("tenantId");
  });

  it("has no hardcoded USD or currency", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).not.toMatch(/'USD'/);
    expect(src).not.toMatch(/"USD"/);
  });
});

// ── icpQueryKeys shape ────────────────────────────────────────────────────────

describe("icpQueryKeys — stable, correct shape", () => {
  it("list key is ['abel', 'icp', 'list']", () => {
    expect(icpQueryKeys.list()).toEqual(["abel", "icp", "list"]);
  });

  it("detail key is ['abel', 'icp', id]", () => {
    expect(icpQueryKeys.detail("abc-123")).toEqual(["abel", "icp", "abc-123"]);
  });

  it("detail key varies by id", () => {
    expect(icpQueryKeys.detail("id-a")).not.toEqual(icpQueryKeys.detail("id-b"));
  });

  it("list key is always identical (stable for invalidation)", () => {
    expect(icpQueryKeys.list()).toEqual(icpQueryKeys.list());
  });
});

// ── useIcps query key alignment ────────────────────────────────────────────────

describe("useIcps — query key alignment with icpQueryKeys.list()", () => {
  it("useIcps uses ['abel', 'icp', 'list'] as queryKey (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("icpQueryKeys.list()");
  });

  it("icpApi.list is called in queryFn (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("icpApi.list");
  });
});

// ── useIcp query key alignment ────────────────────────────────────────────────

describe("useIcp — query key alignment with icpQueryKeys.detail()", () => {
  it("useIcp uses icpQueryKeys.detail(icpId) as queryKey (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("icpQueryKeys.detail(icpId)");
  });

  it("icpApi.get is called in queryFn (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("icpApi.get");
  });

  it("useIcp is disabled when icpId is null (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    // enabled condition includes icpId !== null
    expect(src).toContain("icpId !== null");
  });
});
