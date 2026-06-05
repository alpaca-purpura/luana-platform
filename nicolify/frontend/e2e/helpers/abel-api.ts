// cap: abel/icp-buyer
/**
 * abel-api.ts — Self-provisioning helpers for abel E2E journeys.
 *
 * Calls the BE directly (http://localhost:8001) or via FE proxy depending on
 * E2E_BASE_URL. Each helper takes (request, tenantId, ...) to avoid shared
 * state and enable serial journeys that clean up after themselves.
 *
 * Auth: X-Tenant-ID header only (no Bearer in dev — the BE abel router uses
 * the `_get_tenant_id` dep that only reads the header, no JWT required for
 * local dev as confirmed by working curl in HANDOFF notes).
 *
 * Unique labels for created resources use `[e2e] ${title}-${index}` format
 * so rows created by tests are identifiable in the DB.
 *
 * story-origin: nicolify-r1-abel-icp-buyer T-E2E-2
 */

import type { APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Types mirroring BE DTOs (snake_case matching API responses)
// ---------------------------------------------------------------------------

export interface IcpListItem {
  id: string;
  label: string;
  vertical: string | null;
  status: string;
  buyer_count: number;
}

export interface IcpResponse {
  id: string;
  label: string;
  description: string | null;
  vertical: string | null;
  company_size: string | null;
  geo: string | null;
  business_model: string | null;
  avg_ticket: number | null;
  avg_ticket_currency: string | null;
  sales_cycle: string | null;
  main_pain: string | null;
  sales_angle: string | null;
  signals: string[];
  anti_pattern: string | null;
  status: string;
  origin: string;
  buyer_count: number;
  created_at: string;
  updated_at: string;
}

export interface IcpPatch {
  label?: string;
  description?: string;
  vertical?: string;
  company_size?: string;
  geo?: string;
  business_model?: string;
  avg_ticket?: number;
  avg_ticket_currency?: string;
  sales_cycle?: string;
  main_pain?: string;
  sales_angle?: string;
  signals?: string[];
  anti_pattern?: string;
}

export interface MarkReadyBody {
  status: string;
  missing: string[];
}

export interface BuyerResponse {
  id: string;
  icp_id: string;
  tenant_id: string;
  name: string;
  role: string;
  decision_power: string | null;
  is_primary: boolean;
  pain_points: unknown[];
  desires: unknown[];
  objections: unknown[];
  preferred_channels: unknown[];
  created_at: string;
  updated_at: string;
}

export interface ExtractJobResponse {
  job_id: string;
  status: "analizando" | "done" | "failed";
  icp_id: string | null;
}

// ---------------------------------------------------------------------------
// Base URL resolution:
//   E2E tests hit BE directly at localhost:8001 (avoids FE proxy 307 redirect).
//   The FE proxy (/api/v1/*) requires a browser context for cookie auth, but
//   the APIRequestContext in Playwright doesn't carry Clerk storageState by
//   default, so we call BE directly for API provisioning.
// ---------------------------------------------------------------------------

const BE_URL = process.env["E2E_BE_URL"] ?? "http://localhost:8001";

/**
 * Build default headers for abel API calls.
 * X-Tenant-ID is the only required header in dev (no Bearer auth).
 */
function headers(tenantId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
}

/**
 * Throw a descriptive error if the response is not in the expected range.
 * markReady 422 is special: caller decides whether to throw.
 */
async function assertOk(
  res: Awaited<ReturnType<APIRequestContext["get"]>>,
  context: string,
  allowedStatuses: number[] = [],
): Promise<void> {
  if (res.ok()) return;
  if (allowedStatuses.includes(res.status())) return;
  const body = await res.text().catch(() => "(no body)");
  throw new Error(
    `[abel-api] ${context} failed: HTTP ${res.status()} — ${body}`,
  );
}

// ---------------------------------------------------------------------------
// ICP helpers
// ---------------------------------------------------------------------------

/**
 * Create an ICP with the given label.
 * Returns IcpResponse (201). Throws on any other status.
 */
export async function createIcp(
  request: APIRequestContext,
  tenantId: string,
  label: string,
): Promise<IcpResponse> {
  const res = await request.post(`${BE_URL}/api/v1/abel/icp`, {
    headers: headers(tenantId),
    data: { label },
  });
  await assertOk(res, `createIcp(${label})`);
  return (await res.json()) as IcpResponse;
}

/**
 * PATCH an ICP with arbitrary fields.
 * Returns the updated IcpResponse (200). Throws on error.
 */
export async function patchIcp(
  request: APIRequestContext,
  tenantId: string,
  icpId: string,
  fields: IcpPatch,
): Promise<IcpResponse> {
  const res = await request.patch(`${BE_URL}/api/v1/abel/icp/${icpId}`, {
    headers: headers(tenantId),
    data: fields,
  });
  await assertOk(res, `patchIcp(${icpId})`);
  return (await res.json()) as IcpResponse;
}

/**
 * GET an ICP by ID.
 * Returns IcpResponse (200). Throws on error.
 */
export async function getIcp(
  request: APIRequestContext,
  tenantId: string,
  icpId: string,
): Promise<IcpResponse> {
  const res = await request.get(`${BE_URL}/api/v1/abel/icp/${icpId}`, {
    headers: headers(tenantId),
  });
  await assertOk(res, `getIcp(${icpId})`);
  return (await res.json()) as IcpResponse;
}

/**
 * List all ICPs for the tenant.
 * Returns IcpListItem[]. Throws on error.
 */
export async function listIcps(
  request: APIRequestContext,
  tenantId: string,
): Promise<IcpListItem[]> {
  const res = await request.get(`${BE_URL}/api/v1/abel/icp`, {
    headers: headers(tenantId),
  });
  await assertOk(res, "listIcps()");
  return (await res.json()) as IcpListItem[];
}

/**
 * Soft delete an ICP (204). Throws on unexpected non-204.
 */
export async function deleteIcp(
  request: APIRequestContext,
  tenantId: string,
  icpId: string,
): Promise<void> {
  const res = await request.delete(`${BE_URL}/api/v1/abel/icp/${icpId}`, {
    headers: headers(tenantId),
  });
  // 204 = success; 404 = already gone → both are OK for cleanup
  if (res.status() !== 204 && res.status() !== 404) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(
      `[abel-api] deleteIcp(${icpId}) failed: HTTP ${res.status()} — ${body}`,
    );
  }
}

/**
 * Delete ALL ICPs for the tenant.
 * Used as beforeAll in the empty-state journey to guarantee cold-start.
 */
export async function deleteAllIcps(
  request: APIRequestContext,
  tenantId: string,
): Promise<void> {
  const icps = await listIcps(request, tenantId);
  await Promise.all(icps.map((icp) => deleteIcp(request, tenantId, icp.id)));
}

/**
 * Call POST /icp/{id}/mark-ready.
 * Returns MarkReadyBody on 200 OR 422 (never throws on 422 — caller inspects
 * result.missing[] to distinguish success vs validation failure).
 * Throws on any other unexpected status.
 */
export async function markReady(
  request: APIRequestContext,
  tenantId: string,
  icpId: string,
): Promise<MarkReadyBody> {
  const res = await request.post(
    `${BE_URL}/api/v1/abel/icp/${icpId}/mark-ready`,
    { headers: headers(tenantId) },
  );
  if (res.status() === 200) {
    return (await res.json()) as MarkReadyBody;
  }
  if (res.status() === 422) {
    // FastAPI wraps 422 detail in { detail: { status, missing } }
    const body = (await res.json()) as {
      detail: MarkReadyBody;
    };
    return body.detail;
  }
  const body = await res.text().catch(() => "(no body)");
  throw new Error(
    `[abel-api] markReady(${icpId}) unexpected HTTP ${res.status()} — ${body}`,
  );
}

// ---------------------------------------------------------------------------
// Buyer helpers
// ---------------------------------------------------------------------------

/**
 * Create a buyer under an ICP.
 * Returns BuyerResponse (201). Throws on error.
 */
export async function createBuyer(
  request: APIRequestContext,
  tenantId: string,
  icpId: string,
  name: string,
  role: string,
): Promise<BuyerResponse> {
  const res = await request.post(
    `${BE_URL}/api/v1/abel/icp/${icpId}/buyers`,
    {
      headers: headers(tenantId),
      data: { name, role },
    },
  );
  await assertOk(res, `createBuyer(${icpId}, ${name})`);
  return (await res.json()) as BuyerResponse;
}

/**
 * Set a buyer as primary.
 * Returns the updated BuyerResponse (200). Throws on error.
 */
export async function setPrimaryBuyer(
  request: APIRequestContext,
  tenantId: string,
  buyerId: string,
): Promise<BuyerResponse> {
  const res = await request.post(
    `${BE_URL}/api/v1/abel/buyer/${buyerId}/set-primary`,
    { headers: headers(tenantId) },
  );
  await assertOk(res, `setPrimaryBuyer(${buyerId})`);
  return (await res.json()) as BuyerResponse;
}

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

/**
 * Start an extraction job with a text seed.
 * Returns the job (status=analizando). Throws on error.
 */
export async function extractIcp(
  request: APIRequestContext,
  tenantId: string,
  seedText: string,
): Promise<ExtractJobResponse> {
  const res = await request.post(`${BE_URL}/api/v1/abel/icp/extract`, {
    headers: headers(tenantId),
    data: { seed_type: "text", payload: seedText },
  });
  await assertOk(res, "extractIcp()");
  return (await res.json()) as ExtractJobResponse;
}

/**
 * Poll an extraction job until status is "done" or "failed".
 * Polls every 2s for up to 30s. Returns the final job response.
 * Throws if the poll times out.
 */
export async function pollExtractJob(
  request: APIRequestContext,
  tenantId: string,
  jobId: string,
): Promise<ExtractJobResponse> {
  const MAX_POLLS = 15; // 15 × 2s = 30s max
  const INTERVAL_MS = 2_000;

  for (let i = 0; i < MAX_POLLS; i++) {
    const res = await request.get(
      `${BE_URL}/api/v1/abel/icp/extract/${jobId}`,
      { headers: headers(tenantId) },
    );
    await assertOk(res, `pollExtractJob(${jobId}) poll ${i + 1}`);
    const job = (await res.json()) as ExtractJobResponse;

    if (job.status === "done" || job.status === "failed") {
      return job;
    }

    // Still analizando — wait before next poll
    await new Promise<void>((resolve) => setTimeout(resolve, INTERVAL_MS));
  }

  throw new Error(
    `[abel-api] pollExtractJob(${jobId}) timed out after 30s (still analizando)`,
  );
}
