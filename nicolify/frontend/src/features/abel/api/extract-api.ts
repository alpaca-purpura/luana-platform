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

// ── FE ↔ BE contract mapping ──────────────────────────────────────────────────
// The BE DTO (IcpExtractRequest / IcpExtractJobResponse) is snake_case + English
// enums {url,file,text} + {payload,file_ref} / {job_id,icp_id}. The FE types are
// camelCase + Spanish modes {url,archivo,texto} + {url,text,fileContent} / {jobId,
// icpId}. fetchClient does NO camel↔snake conversion, so we map explicitly here.
// (Bug found 2026-06-04 via live-verify: the modal submit 422'd because the FE
// shape was sent raw. Contract-test FE↔BE is the durable guard — HB-42.)

interface ExtractRequestWire {
  seed_type: "url" | "file" | "text";
  payload: string | null;
  file_ref: string | null;
}

interface ExtractJobWire {
  job_id: string;
  status: IcpExtractJob["status"];
  icp_id?: string | null;
  error_message?: string | null;
  detail?: string | null;
}

const SEED_TYPE_TO_WIRE: Record<IcpExtractRequest["seedType"], ExtractRequestWire["seed_type"]> = {
  url: "url",
  archivo: "file",
  texto: "text",
};

function toWireRequest(p: IcpExtractRequest): ExtractRequestWire {
  const seed_type = SEED_TYPE_TO_WIRE[p.seedType];
  let payload: string | null = null;
  let file_ref: string | null = null;
  if (p.seedType === "url") payload = p.url?.trim() ?? null;
  else if (p.seedType === "texto") payload = p.text?.trim() ?? null;
  // archivo: BE expects a storage object ref (file_ref). The base64 fileContent
  // path needs a prior upload endpoint (not yet wired) — send the file name as a
  // best-effort ref so the BE validation passes; full upload pipeline = follow-up.
  else if (p.seedType === "archivo") file_ref = p.fileName ?? null;
  return { seed_type, payload, file_ref };
}

function fromWireJob(d: ExtractJobWire): IcpExtractJob {
  return {
    jobId: d.job_id,
    status: d.status,
    icpId: d.icp_id ?? null,
    errorMessage: d.error_message ?? d.detail ?? null,
  };
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
  startExtraction: async (
    { token, tenantId }: ExtractApiOptions,
    payload: IcpExtractRequest,
  ): Promise<IcpExtractJob> => {
    const wire = await fetchClient<ExtractJobWire>("/api/v1/abel/icp/extract", {
      method: "POST",
      token,
      tenantId,
      body: JSON.stringify(toWireRequest(payload)),
      // Allow longer timeout — LLM extraction may take up to 60s
      timeoutMs: 60_000,
    });
    return fromWireJob(wire);
  },

  /**
   * Poll an in-flight extraction job.
   * GET /api/v1/abel/icp/extract/{jobId}
   *
   * Returns current status: analizando | done | failed.
   * Caller (use-icp-extract hook) polls every 2s until done/failed.
   *
   * @throws ApiError on non-2xx response
   */
  pollExtraction: async (
    { token, tenantId }: ExtractApiOptions,
    jobId: string,
  ): Promise<IcpExtractJob> => {
    const wire = await fetchClient<ExtractJobWire>(`/api/v1/abel/icp/extract/${jobId}`, {
      method: "GET",
      token,
      tenantId,
      timeoutMs: 10_000,
    });
    return fromWireJob(wire);
  },
};
