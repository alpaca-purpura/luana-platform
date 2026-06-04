// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * extract-api.ts — API client for ICP draft-first extraction (Abel).
 *
 * Two operations:
 *   1. startExtraction → POST /api/v1/abel/icp/extract → IcpExtractJob
 *   2. pollExtraction  → GET  /api/v1/abel/icp/extract/{jobId} → IcpExtractJob
 *
 * fetchClient auto-injects X-Tenant-ID + Authorization (tenant-isolation raíz RN-1).
 * NEVER manually inject X-Tenant-ID in Client Components.
 *
 * Timeout: POST 60s (extraction may take time); GET 10s (quick poll).
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §1 FSD-Lite layout / api/extract-api.ts
 * validators_gate: NF-res-extract (timeout → failed, no infinite spinner)
 */

import { fetchClient } from "@/lib/api/fetch-client";

import type { IcpExtractJob, IcpExtractRequest } from "../types/extract";

// ── API options type ────────────────────────────────────────────────────────

export interface ExtractApiOptions {
  token: string;
  tenantId: string;
}

// ── Extract API ─────────────────────────────────────────────────────────────

export const extractApi = {
  /**
   * Start a draft-first ICP extraction job.
   * POST /api/v1/abel/icp/extract
   *
   * The seed (url/archivo/texto) is treated as UNTRUSTED DATA by the backend (RN-9).
   * This client sends the seed as-is — the backend applies delimiter wrapping + sanitization.
   *
   * @throws ApiError on network failure or non-2xx response
   */
  startExtraction: (
    { token, tenantId }: ExtractApiOptions,
    payload: IcpExtractRequest,
  ): Promise<IcpExtractJob> =>
    fetchClient<IcpExtractJob>("/api/v1/abel/icp/extract", {
      method: "POST",
      token,
      tenantId,
      body: JSON.stringify(payload),
      // Allow longer timeout — LLM extraction may take up to 60s
      timeoutMs: 60_000,
    }),

  /**
   * Poll an in-flight extraction job.
   * GET /api/v1/abel/icp/extract/{jobId}
   *
   * Returns current status: analizando | done | failed.
   * Caller (use-icp-extract hook) polls every 2s until done/failed.
   *
   * @throws ApiError on non-2xx response
   */
  pollExtraction: ({ token, tenantId }: ExtractApiOptions, jobId: string): Promise<IcpExtractJob> =>
    fetchClient<IcpExtractJob>(`/api/v1/abel/icp/extract/${jobId}`, {
      method: "GET",
      token,
      tenantId,
      timeoutMs: 10_000,
    }),
};
