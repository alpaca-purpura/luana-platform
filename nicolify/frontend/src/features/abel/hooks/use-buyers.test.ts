// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * use-buyers.test.ts — TDD tests for Buyer React Query hooks.
 *
 * Covers:
 *   - buyerQueryKeys shape (stable, correct keys)
 *   - listByIcp key: ['abel', 'icp', icpId, 'buyers']
 *   - detail key: ['abel', 'buyer', id]
 *   - NEVER uses orgId (tenant isolation)
 *   - useBuyers disabled when icpId is null
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §1 hooks/use-buyers.ts
 * validators_gate: RN-5 (buyer scoped to ICP) + tenant isolation
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import { buyerQueryKeys } from "./use-buyers";

// ── Source scan: NEVER orgId ───────────────────────────────────────────────────

const HOOK_PATH = resolve(__dirname, "./use-buyers.ts");

describe("use-buyers tenant isolation (NEVER Clerk orgId)", () => {
  it("does NOT assign orgId as tenantId", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).not.toContain("useOrganization");
    // orgId must not be used as the value for tenantId
    expect(src).not.toMatch(/tenantId\s*=\s*.*orgId/);
    expect(src).not.toContain("X-Tenant-ID: orgId");
  });

  it("uses useParams() to extract tenantId from URL", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("useParams");
    expect(src).toContain("tenantId");
  });
});

// ── buyerQueryKeys shape ──────────────────────────────────────────────────────

describe("buyerQueryKeys — stable, correct shape", () => {
  it("listByIcp key is ['abel', 'icp', icpId, 'buyers']", () => {
    expect(buyerQueryKeys.listByIcp("icp-1")).toEqual(["abel", "icp", "icp-1", "buyers"]);
  });

  it("listByIcp key varies by icpId", () => {
    expect(buyerQueryKeys.listByIcp("icp-a")).not.toEqual(buyerQueryKeys.listByIcp("icp-b"));
  });

  it("detail key is ['abel', 'buyer', id]", () => {
    expect(buyerQueryKeys.detail("buyer-1")).toEqual(["abel", "buyer", "buyer-1"]);
  });

  it("detail key varies by id", () => {
    expect(buyerQueryKeys.detail("a")).not.toEqual(buyerQueryKeys.detail("b"));
  });
});

// ── useBuyers alignment ────────────────────────────────────────────────────────

describe("useBuyers — correct key and API alignment", () => {
  it("useBuyers uses buyerQueryKeys.listByIcp(icpId) (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("buyerQueryKeys.listByIcp(icpId)");
  });

  it("buyerApi.listByIcp called in queryFn (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("buyerApi.listByIcp");
  });

  it("useBuyers disabled when icpId is null (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("icpId !== null");
  });
});

// ── useBuyer alignment ────────────────────────────────────────────────────────

describe("useBuyer — correct key and API alignment", () => {
  it("useBuyer uses buyerQueryKeys.detail(buyerId) (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("buyerQueryKeys.detail(buyerId)");
  });

  it("buyerApi.get called in queryFn (source scan)", () => {
    const src = readFileSync(HOOK_PATH, "utf-8");
    expect(src).toContain("buyerApi.get");
  });
});
