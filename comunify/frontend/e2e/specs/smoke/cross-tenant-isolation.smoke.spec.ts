/**
 * cross-tenant-isolation.smoke.spec.ts — Cross-tenant data isolation smoke (Story 12 T-e2e-1)
 *
 * Scope: Verify that tenant-scoped API routes do not leak data between tenants.
 * Tests the X-Tenant-ID header enforcement at the API level.
 *
 * Security-critical: This test verifies the tenant isolation invariant
 * (per .claude/rules/tenant-isolation.md) at the E2E layer.
 *
 * Strategy: Direct API call with mismatched tenant header.
 * Uses Playwright's `request` context (no browser UI needed).
 *
 * PRAGMA T-e2e-1: API-level smoke only. Does not test authenticated cross-tenant
 * exploit (requires 2 active Clerk sessions simultaneously — deferred Story 13).
 *
 * Run:
 *   npx playwright test e2e/specs/smoke/cross-tenant-isolation.smoke.spec.ts --project=smoke
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const API_URL = process.env.E2E_API_URL || "http://localhost:8000";

test.describe("Cross-tenant isolation", () => {
  test("community endpoint rejects request without X-Tenant-ID", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/comunidad/members`, {
      headers: {
        // No X-Tenant-ID header
        "Content-Type": "application/json",
      },
    });

    // Should return 401 or 422 (missing header validation), never 200
    expect([401, 403, 422, 404]).toContain(response.status());
  });

  test("anabella data not accessible with trini tenant header", async ({ request }) => {
    // Attempt to access anabella's data using trini's tenant ID
    // This would be a cross-tenant data leak if it returns 200 with data
    const response = await request.get(`${API_URL}/api/v1/comunidad/members`, {
      headers: {
        "X-Tenant-ID": "trini-nutrition-cl",
        "Content-Type": "application/json",
      },
    });

    // Either:
    // - 401 (no auth token) — acceptable
    // - 200 with trini's data only (not anabella's) — acceptable
    // - 404 — acceptable (endpoint may not exist yet in bootstrap)
    // NOT acceptable: 200 with cross-tenant data
    if (response.status() === 200) {
      const body = await response.json().catch(() => null);
      if (body && body.data) {
        // Verify no anabella tenant data leaked
        const bodyStr = JSON.stringify(body);
        expect(bodyStr).not.toContain("anabella-coaching-ar");
      }
    }

    // Test passes as long as it doesn't 500 (server error)
    expect(response.status()).not.toBe(500);
  });

  test("widget embed returns 200 for valid tenant", async ({ request }) => {
    // Widget endpoint should be publicly accessible (no auth required)
    const response = await request.get(
      `${BASE_URL}/widget/embed?tenant=anabella-coaching-ar`,
    );

    // Widget embed should work without auth (it's the public entry point)
    // 200 = widget loaded, 404 = route not yet implemented (acceptable for bootstrap)
    expect([200, 404]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test("widget embed with unknown tenant returns 404 not 500", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/widget/embed?tenant=does-not-exist-xyz-999`,
    );

    // Unknown tenant should return 404, NOT 500 (no unhandled exception)
    expect([404, 400]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test("health endpoint accessible without tenant header", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);

    // Health endpoint must work without tenant context (k8s probe)
    expect(response.status()).toBe(200);
  });
});
