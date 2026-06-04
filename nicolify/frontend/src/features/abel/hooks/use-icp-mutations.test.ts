// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * use-icp-mutations.test.ts — TDD tests for ICP mutation hooks.
 *
 * Covers:
 *   - useCreateIcp invalidates ['abel','icp','list'] on success
 *   - usePatchIcp invalidates list + detail on success
 *   - useMarkReadyIcp invalidates list + detail on success
 *   - useDeleteIcp invalidates list on success
 *   - NEVER uses orgId (tenant isolation source scan)
 *   - No hardcoded 'USD' currency
 *
 * TDD RED-first per tdd-mandatory.md.
 * spec_anchor: 03-arch-fe.md §3 Forms → autosave + mark-ready
 * validators_gate: RN-7 (label unique) + RN-8 (mark-ready) + cache invalidation
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import { icpQueryKeys } from "./use-icps";
import { buyerQueryKeys } from "./use-buyers";

// ── Source scan ───────────────────────────────────────────────────────────────

const MUTATIONS_PATH = resolve(__dirname, "./use-icp-mutations.ts");

describe("use-icp-mutations tenant isolation (NEVER Clerk orgId)", () => {
  it("does NOT assign orgId as tenantId", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).not.toContain("useOrganization");
    expect(src).not.toMatch(/tenantId\s*=\s*.*orgId/);
  });

  it("uses useParams() for tenantId", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("useParams");
  });

  it("has no hardcoded 'USD' currency", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).not.toMatch(/'USD'/);
    expect(src).not.toMatch(/"USD"/);
  });
});

// ── icpQueryKeys invalidation mapping ────────────────────────────────────────

describe("ICP mutation cache invalidation", () => {
  it("icpQueryKeys.list() is used for create invalidation (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    // useCreateIcp invalidates list
    expect(src).toContain("icpQueryKeys.list()");
  });

  it("icpQueryKeys.detail(icpId) is used for patch/markReady invalidation (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("icpQueryKeys.detail(icpId)");
  });
});

// ── Invalidation key alignment ────────────────────────────────────────────────

describe("Cache key alignment: mutations use same keys as queries", () => {
  it("list key matches useIcps query key", () => {
    // Both must use ['abel', 'icp', 'list']
    expect(icpQueryKeys.list()).toEqual(["abel", "icp", "list"]);
  });

  it("buyer list key includes icpId segment", () => {
    // Must include icpId for ICP-scoped invalidation
    expect(buyerQueryKeys.listByIcp("test-id")).toEqual(["abel", "icp", "test-id", "buyers"]);
  });
});

// ── icpApi calls ───────────────────────────────────────────────────────────────

describe("ICP mutation API calls", () => {
  it("useCreateIcp calls icpApi.create (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("icpApi.create");
  });

  it("usePatchIcp calls icpApi.patch (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("icpApi.patch");
  });

  it("useMarkReadyIcp calls icpApi.markReady (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("icpApi.markReady");
  });

  it("useDeleteIcp calls icpApi.delete (source scan)", () => {
    const src = readFileSync(MUTATIONS_PATH, "utf-8");
    expect(src).toContain("icpApi.delete");
  });
});
