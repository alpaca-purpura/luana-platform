// cap: abel.icp-buyer
/**
 * buyer-api.test.ts — Unit tests locking the correct BE path shapes.
 *
 * BUG-2 regression lock: single-resource buyer endpoints MUST use SINGULAR
 * path `/api/v1/abel/buyer/{id}` (not the PLURAL `/api/v1/abel/buyers/{id}`).
 * The BE openapi exposes:
 *   GET/PATCH/DELETE  /api/v1/abel/buyer/{buyer_id}        ← SINGULAR
 *   POST              /api/v1/abel/buyer/{buyer_id}/set-primary  ← SINGULAR
 *   GET/POST          /api/v1/abel/icp/{icp_id}/buyers      ← PLURAL collection
 *
 * Using the PLURAL path for single-resource ops → 404 (buyer exists, path wrong).
 * Using the SINGULAR path for collection ops → 404 (different resource tree).
 *
 * TDD: these tests were RED before the BUG-2 fix (plural paths → tests verified wrong
 * paths). After fix: GREEN (singular paths matched).
 *
 * spec_anchor: 03-arch-fe.md §1 FSD-Lite / api/buyer-api.ts
 * validators_gate: BUG-2 path mismatch (buyer get/patch/set-primary/delete → 404)
 * story-origin: nicolify-r1-abel-icp-buyer (audit iter 5 BUG-2 fix)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buyerApi } from "./buyer-api";
import type { BuyerCreatePayload } from "./buyer-api";

// ── Mock fetchClient ──────────────────────────────────────────────────────────

const mockFetchClient = vi.fn();

vi.mock("@/lib/api/fetch-client", () => ({
  fetchClient: (...args: unknown[]) => mockFetchClient(...args),
  ApiError: class ApiError extends Error {
    status: number;
    statusText: string;
    body: unknown;
    constructor(response: { status: number; statusText: string }, body?: unknown) {
      super(`API error ${response.status}: ${response.statusText}`);
      this.name = "ApiError";
      this.status = response.status;
      this.statusText = response.statusText;
      this.body = body;
    }
  },
}));

// ── Minimal raw buyer stub ────────────────────────────────────────────────────

const rawBuyerStub = {
  id: "buyer-123",
  tenant_id: "tenant-abc",
  icp_id: "icp-001",
  name: "Decisor Principal",
  role: "CEO",
  decision_power: "high" as const,
  is_primary: true,
  demographics: {},
  psychographics: {},
  pain_points: [],
  desires: [],
  objections: [],
  buyer_journey: {},
  purchase_triggers: [],
  preferred_channels: [],
  created_at: "2026-06-04T00:00:00Z",
  updated_at: "2026-06-04T00:00:00Z",
};

const opts = { token: "tk-test", tenantId: "tenant-abc" };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("buyerApi — single-resource endpoints use SINGULAR path (BUG-2 regression lock)", () => {
  beforeEach(() => {
    mockFetchClient.mockClear();
  });

  // ── BUG-2: GET /api/v1/abel/buyer/{id} (SINGULAR) ─────────────────────────

  it("buyerApi.get — calls SINGULAR /api/v1/abel/buyer/{id} (not plural)", async () => {
    mockFetchClient.mockResolvedValueOnce(rawBuyerStub);

    await buyerApi.get(opts, "buyer-123");

    expect(mockFetchClient).toHaveBeenCalledOnce();
    const [url] = mockFetchClient.mock.calls[0] as [string, unknown];
    expect(url).toBe("/api/v1/abel/buyer/buyer-123");
    // Regression: PLURAL path would have been /api/v1/abel/buyers/buyer-123
    expect(url).not.toContain("/buyers/");
  });

  // ── BUG-2: PATCH /api/v1/abel/buyer/{id} (SINGULAR) ──────────────────────

  it("buyerApi.patch — calls SINGULAR /api/v1/abel/buyer/{id} (not plural)", async () => {
    mockFetchClient.mockResolvedValueOnce(rawBuyerStub);

    await buyerApi.patch(opts, "buyer-123", { name: "Actualizado" });

    expect(mockFetchClient).toHaveBeenCalledOnce();
    const [url, fetchOpts] = mockFetchClient.mock.calls[0] as [string, { method: string }];
    expect(url).toBe("/api/v1/abel/buyer/buyer-123");
    expect(fetchOpts.method).toBe("PATCH");
    expect(url).not.toContain("/buyers/");
  });

  // ── BUG-2: POST /api/v1/abel/buyer/{id}/set-primary (SINGULAR) ───────────

  it("buyerApi.setPrimary — calls SINGULAR /api/v1/abel/buyer/{id}/set-primary (not plural)", async () => {
    mockFetchClient.mockResolvedValueOnce(rawBuyerStub);

    await buyerApi.setPrimary(opts, "buyer-123");

    expect(mockFetchClient).toHaveBeenCalledOnce();
    const [url, fetchOpts] = mockFetchClient.mock.calls[0] as [string, { method: string }];
    expect(url).toBe("/api/v1/abel/buyer/buyer-123/set-primary");
    expect(fetchOpts.method).toBe("POST");
    expect(url).not.toContain("/buyers/");
  });

  // ── BUG-2: DELETE /api/v1/abel/buyer/{id} (SINGULAR) ─────────────────────

  it("buyerApi.delete — calls SINGULAR /api/v1/abel/buyer/{id} (not plural)", async () => {
    mockFetchClient.mockResolvedValueOnce(undefined);

    await buyerApi.delete(opts, "buyer-123");

    expect(mockFetchClient).toHaveBeenCalledOnce();
    const [url, fetchOpts] = mockFetchClient.mock.calls[0] as [string, { method: string }];
    expect(url).toBe("/api/v1/abel/buyer/buyer-123");
    expect(fetchOpts.method).toBe("DELETE");
    expect(url).not.toContain("/buyers/");
  });

  // ── Collection endpoints keep PLURAL path (correct, must not regress) ─────

  it("buyerApi.listByIcp — keeps PLURAL /api/v1/abel/icp/{icpId}/buyers (collection, correct)", async () => {
    mockFetchClient.mockResolvedValueOnce([]);

    await buyerApi.listByIcp(opts, "icp-001");

    expect(mockFetchClient).toHaveBeenCalledOnce();
    const [url] = mockFetchClient.mock.calls[0] as [string, unknown];
    expect(url).toBe("/api/v1/abel/icp/icp-001/buyers");
  });

  it("buyerApi.create — keeps PLURAL /api/v1/abel/icp/{icpId}/buyers (collection, correct)", async () => {
    mockFetchClient.mockResolvedValueOnce(rawBuyerStub);

    const payload: BuyerCreatePayload = { name: "Nuevo buyer" };
    await buyerApi.create(opts, "icp-001", payload);

    expect(mockFetchClient).toHaveBeenCalledOnce();
    const [url, fetchOpts] = mockFetchClient.mock.calls[0] as [string, { method: string }];
    expect(url).toBe("/api/v1/abel/icp/icp-001/buyers");
    expect(fetchOpts.method).toBe("POST");
  });

  // ── Mapper correctness (camelCase output) ─────────────────────────────────

  it("buyerApi.get — maps snake_case response to camelCase Buyer type", async () => {
    mockFetchClient.mockResolvedValueOnce(rawBuyerStub);

    const result = await buyerApi.get(opts, "buyer-123");

    expect(result.id).toBe("buyer-123");
    expect(result.tenantId).toBe("tenant-abc");
    expect(result.icpId).toBe("icp-001");
    expect(result.decisionPower).toBe("high");
    expect(result.isPrimary).toBe(true);
    // snake_case keys must NOT appear in the mapped output
    expect(Object.keys(result)).not.toContain("tenant_id");
    expect(Object.keys(result)).not.toContain("icp_id");
    expect(Object.keys(result)).not.toContain("decision_power");
    expect(Object.keys(result)).not.toContain("is_primary");
  });
});
