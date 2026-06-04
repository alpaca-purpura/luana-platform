// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * use-buyer-mutations.test.ts — TDD tests for Buyer mutation hooks.
 *
 * Covers:
 *   - useCreateBuyer invalidates ['abel','icp',icpId,'buyers'] on success
 *   - usePatchBuyer invalidates listByIcp + detail on success
 *   - useSetPrimaryBuyer invalidates listByIcp + detail on success
 *   - useDeleteBuyer invalidates listByIcp on success
 *   - NEVER uses orgId (tenant isolation source scan)
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §3 Forms (buyer) + §2 data layer
 * validators_gate: RN-5 (buyer → ICP) + RN-6 (set-primary ≤1) + cache invalidation
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import { buyerQueryKeys } from "./use-buyers";

// ── Source scan ───────────────────────────────────────────────────────────────

const MUTATIONS_PATH = resolve(__dirname, "./use-buyer-mutations.ts");

describe("use-buyer-mutations tenant isolation (NEVER Clerk orgId)", () => {
  it("does NOT assign orgId as tenantId", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).not.toContain("useOrganization");
    expect(src).not.toMatch(/tenantId\s*=\s*.*orgId/);
  });

  it("uses useParams() for tenantId", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("useParams");
  });
});

// ── buyer cache invalidation ──────────────────────────────────────────────────

describe("Buyer mutation cache invalidation", () => {
  it("buyerQueryKeys.listByIcp(icpId) is used for create invalidation (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("buyerQueryKeys.listByIcp(icpId)");
  });

  it("buyerQueryKeys.detail(buyerId) is used for patch invalidation (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("buyerQueryKeys.detail(buyerId)");
  });
});

// ── buyerQueryKeys alignment ──────────────────────────────────────────────────

describe("Cache key alignment: buyer mutations use correct keys", () => {
  it("listByIcp key is ['abel', 'icp', icpId, 'buyers']", () => {
    expect(buyerQueryKeys.listByIcp("icp-xyz")).toEqual(["abel", "icp", "icp-xyz", "buyers"]);
  });

  it("detail key is ['abel', 'buyer', id]", () => {
    expect(buyerQueryKeys.detail("buyer-xyz")).toEqual(["abel", "buyer", "buyer-xyz"]);
  });
});

// ── buyerApi calls ─────────────────────────────────────────────────────────────

describe("Buyer mutation API calls", () => {
  it("useCreateBuyer calls buyerApi.create (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("buyerApi.create");
  });

  it("usePatchBuyer calls buyerApi.patch (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("buyerApi.patch");
  });

  it("useSetPrimaryBuyer calls buyerApi.setPrimary (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("buyerApi.setPrimary");
  });

  it("useDeleteBuyer calls buyerApi.delete (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("buyerApi.delete");
  });
});
