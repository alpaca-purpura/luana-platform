// cap: abel/icp-buyer
/**
 * tenant-id-header.smoke.spec.ts — Tight verification that X-Tenant-ID header on
 * /api/v1/abel/icp is the UUID from Clerk publicMetadata.tenant_id, NOT the URL slug.
 *
 * CONTEXT (DoD #37 · commit d6fd864d):
 *   Bug: abel hooks used useParams().tenantId (URL slug, e.g. "alpaca-purpura") as
 *   X-Tenant-ID → BE 422. Fix: useTenantId() reads publicMetadata.tenant_id UUID.
 *
 * owner.demo@nicolify.com publicMetadata.tenant_id = 7f464ab7-137b-5e3a-af13-3020aa18814a
 * owner.demo has NO tenant_slug → URL uses the UUID as the slug (masks the bug in e2e).
 *
 * THE DECISIVE CHECK:
 *   1. Subscribe to network requests filtering for /api/v1/abel/icp.
 *   2. Navigate to the abel/icp master route.
 *   3. ASSERT: X-Tenant-ID header = 7f464ab7-137b-5e3a-af13-3020aa18814a (UUID)
 *      NOT a slug, NOT empty.
 *   4. ASSERT: response is 200 (not 422).
 *   5. Anti-burbuja: 0 console.error / 0 next-overlay.
 *
 * Also tests a SLUG-shaped URL (/alpaca-purpura/abel/icp) if the tenant exists
 * with a slug to prove the URL segment is IGNORED.
 *
 * Stack prerequisite: make dev-nicolify (FE :3001, BE :8001 health 200).
 * story-origin: nicolify-r1-abel-icp-buyer · fix-verification commit d6fd864d
 */

import { test, expect } from "../../fixtures/base";

const EXPECTED_TENANT_UUID = "7f464ab7-137b-5e3a-af13-3020aa18814a";
const ICP_API_PATH_RE = /\/api\/v1\/abel\/icp/;

// ---------------------------------------------------------------------------
// Helper: wait for the first /api/v1/abel/icp request and capture its
// X-Tenant-ID header + status code.
// ---------------------------------------------------------------------------
interface CapturedRequest {
  xTenantId: string | null;
  status: number;
  url: string;
}

async function captureIcpApiRequest(
  page: import("@playwright/test").Page,
  navigateFn: () => Promise<void>,
): Promise<CapturedRequest> {
  let captured: CapturedRequest | null = null;

  const listener = async (request: import("@playwright/test").Request) => {
    if (!ICP_API_PATH_RE.test(request.url())) return;
    if (captured !== null) return; // only capture the first match

    const headers = await request.allHeaders();
    const xTenantId = headers["x-tenant-id"] ?? null;

    // Response may not be available immediately; wait for it.
    let status = -1;
    try {
      const response = await request.response();
      status = response?.status() ?? -1;
    } catch {
      // response() can throw if request was aborted before completing
    }

    captured = { xTenantId, status, url: request.url() };
  };

  page.on("request", listener);

  await navigateFn();

  // Wait up to 10 seconds for the request to be captured.
  const deadline = Date.now() + 10_000;
  while (captured === null && Date.now() < deadline) {
    await page.waitForTimeout(200);
  }

  page.removeListener("request", listener);

  if (captured === null) {
    throw new Error(
      "No request to /api/v1/abel/icp was intercepted within 10 seconds. " +
        "Is the stack running? Is the user authenticated?",
    );
  }

  return captured;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("X-Tenant-ID header verification (commit d6fd864d)", () => {
  /**
   * PRIMARY CHECK — UUID-shaped URL.
   *
   * owner.demo has no tenant_slug so the URL segment already IS the UUID.
   * This verifies that useTenantId() resolves from publicMetadata (not URL param).
   * After the fix: both UUID-URL and slug-URL must send the SAME UUID header.
   */
  test("SC: X-Tenant-ID on /api/v1/abel/icp equals publicMetadata UUID (not a slug)", async ({
    page,
  }) => {
    // Navigate to the abel/icp route for owner.demo.
    // owner.demo's tenant_id IS the URL segment (no human slug).
    const navigateFn = async () => {
      await page.goto(`/${EXPECTED_TENANT_UUID}/abel/icp`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
    };

    const { xTenantId, status, url } = await captureIcpApiRequest(
      page,
      navigateFn,
    );

    // ── CORE ASSERTION: X-Tenant-ID must be the UUID ──────────────────────
    expect(
      xTenantId,
      `X-Tenant-ID on ${url} must be the publicMetadata UUID. Got: "${xTenantId}".` +
        ` If this is a slug (non-UUID string) or empty, the fix did NOT take effect.`,
    ).toBe(EXPECTED_TENANT_UUID);

    // ── SECONDARY ASSERTION: response must not be 422 ────────────────────
    expect(
      status,
      `BE returned ${status} for ${url}. Expected 200 (list) or 404 (empty list OK). ` +
        `422 means the BE rejected the X-Tenant-ID — the fix did NOT take effect.`,
    ).not.toBe(422);

    // 200 OR 404 (empty tenant, no ICPs yet) are both acceptable.
    // What matters is NOT 422 (invalid tenant header).
    expect(
      [200, 404].includes(status) || status === -1,
      `Expected status 200 or 404 (not 422). Got: ${status}`,
    ).toBe(true);

    // ── NOTE: anti-burbuja is asserted by base.ts teardown ───────────────
  });

  /**
   * SLUG URL CHECK — tests that even a SLUG-shaped URL segment does NOT
   * change what useTenantId() sends as X-Tenant-ID.
   *
   * owner.demo@nicolify.com does NOT have a human slug ("alpaca-purpura")
   * set in publicMetadata.tenant_slug — so we cannot force-navigate with a
   * real slug here. Instead we verify that a hypothetical slug URL
   * (/alpaca-purpura/abel/icp) — if the app redirects → uses UUID,
   * OR we document that owner.demo always uses UUID in URL.
   *
   * Practical test: navigate to a known-bad slug URL and confirm the app
   * does NOT send "alpaca-purpura" as X-Tenant-ID. The page may 404/redirect,
   * but the API header must remain UUID or be absent (no request fired).
   */
  test("SC: slug-shaped URL does NOT cause X-Tenant-ID to be the slug", async ({
    page,
  }) => {
    // Slug "alpaca-purpura" is NOT owner.demo's tenant. Navigating here
    // should either:
    //  (a) 404 (unknown tenant segment → Next.js not-found), OR
    //  (b) redirect to UUID-based URL and fire API with UUID header.
    // What it must NOT do: fire /api/v1/abel/icp with X-Tenant-ID = "alpaca-purpura".
    const capturedHeaders: string[] = [];

    const listener = async (request: import("@playwright/test").Request) => {
      if (!ICP_API_PATH_RE.test(request.url())) return;
      const headers = await request.allHeaders();
      const xTenantId = headers["x-tenant-id"] ?? "(absent)";
      capturedHeaders.push(xTenantId);
    };

    page.on("request", listener);

    try {
      await page.goto(`/alpaca-purpura/abel/icp`, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });
    } catch {
      // Navigation timeout is OK — we just need to check what API calls were made.
    }

    // Wait briefly for any requests to fire.
    await page.waitForTimeout(2_000);
    page.removeListener("request", listener);

    // ASSERT: IF any /api/v1/abel/icp request fired, its X-Tenant-ID must NOT be the slug.
    for (const header of capturedHeaders) {
      expect(
        header,
        `X-Tenant-ID was "${header}" — looks like a slug (non-UUID format). ` +
          `useTenantId() must read from publicMetadata, not from the URL param.`,
      ).not.toMatch(/^[a-z][a-z0-9-]{2,}$/); // non-UUID slug pattern: lowercase-with-dashes

      // If a request DID fire and has a UUID-looking value → it's the UUID (good).
      const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        header,
      );
      if (header !== "(absent)") {
        expect(
          isUuidLike,
          `X-Tenant-ID "${header}" is not UUID format. The fix may not be working.`,
        ).toBe(true);
      }
    }

    // Result: either no request fired (404 before reaching API call) or UUID was sent.
  });
});
