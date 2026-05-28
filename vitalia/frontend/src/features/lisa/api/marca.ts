// cap: brand_studio.lisa-marca
// atomics: TBD
// story-origin: vitalia-fase2-s7-TBD
/**
 * marca.ts — API client for Lisa Marca sub-tab (brand identity admin).
 *
 * Consumes:
 *   GET  /api/v1/lisa/marca/identity
 *   PUT  /api/v1/lisa/marca/identity
 *   GET  /api/v1/lisa/marca/visuals
 *   PUT  /api/v1/lisa/marca/visuals
 *   POST /api/v1/lisa/marca/logos
 *   DELETE /api/v1/lisa/marca/logos
 *
 * Auth pattern: fetchClient auto-injects X-Tenant-ID + X-Clinic-ID (HIPAA-lite).
 * React Query keys factory: marcaKeys.* (per 03-arch.md conventions).
 *
 * T-5 vitalia-fase2-lisa-marca
 * spec_anchor: 03-arch.md § 4 API endpoints + CONTEXT-BRIEF § 6
 * downstream-regression-na: brand-local vitalia FE API; no cross-brand consumers
 */

import { fetchClient } from "@/lib/api/fetchClient";
import type { IdentityFormValues } from "../types/marca/identity-schema";
import type { ClinicVisualsFormValues } from "../types/marca/visuals-schema";

// ── React Query Key Factory ────────────────────────────────────────────────────

export const marcaKeys = {
  all: ["lisa", "marca"] as const,
  identity: (tenantId: string) =>
    [...marcaKeys.all, "identity", tenantId] as const,
  visuals: (tenantId: string) =>
    [...marcaKeys.all, "visuals", tenantId] as const,
  logo: (tenantId: string) => [...marcaKeys.all, "logo", tenantId] as const,
  // T-6 Voz y tono
  personality: (tenantId: string) =>
    [...marcaKeys.all, "personality", tenantId] as const,
  voicePreview: (tenantId: string, blocksHash: string) =>
    [...marcaKeys.all, "voicePreview", tenantId, blocksHash] as const,
  prohibitedPhrases: (tenantId: string) =>
    [...marcaKeys.all, "prohibitedPhrases", tenantId] as const,
  // T-7 Presencia
  contact: (tenantId: string) =>
    [...marcaKeys.all, "contact", tenantId] as const,
  trustSignals: (tenantId: string) =>
    [...marcaKeys.all, "trustSignals", tenantId] as const,
  trustCatalog: (tenantId: string, countryCode: string) =>
    [...marcaKeys.all, "trustCatalog", tenantId, countryCode] as const,
  locations: (tenantId: string) =>
    [...marcaKeys.all, "locations", tenantId] as const,
} as const;

// ── Response types (camelCase mirrors of Pydantic DTOs per 03-arch.md) ────────

export interface IdentityResponse extends IdentityFormValues {
  tenantId: string;
  clinicId: string;
  updatedAt: string; // ISO 8601
}

export interface VisualsResponse extends ClinicVisualsFormValues {
  tenantId: string;
  clinicId: string;
  logoUrl: string | null;
  updatedAt: string; // ISO 8601
}

export interface LogoUploadResponse {
  logoUrl: string;
  updatedAt: string;
}

// ── API client options ─────────────────────────────────────────────────────────

interface ApiOpts {
  token: string;
  tenantId: string;
  clinicId?: string | null;
}

// ── Identity endpoints ─────────────────────────────────────────────────────────

export async function getIdentity(opts: ApiOpts): Promise<IdentityResponse> {
  return fetchClient<IdentityResponse>(
    `/api/v1/lisa/marca/identity`,
    opts,
  );
}

export async function updateIdentity(
  opts: ApiOpts,
  payload: Partial<IdentityFormValues>,
): Promise<IdentityResponse> {
  return fetchClient<IdentityResponse>(`/api/v1/lisa/marca/identity`, {
    ...opts,
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Visuals endpoints ──────────────────────────────────────────────────────────

export async function getVisuals(opts: ApiOpts): Promise<VisualsResponse> {
  return fetchClient<VisualsResponse>(
    `/api/v1/lisa/marca/visuals`,
    opts,
  );
}

export async function updateVisuals(
  opts: ApiOpts,
  payload: Partial<ClinicVisualsFormValues>,
): Promise<VisualsResponse> {
  return fetchClient<VisualsResponse>(`/api/v1/lisa/marca/visuals`, {
    ...opts,
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Logo endpoints ─────────────────────────────────────────────────────────────

export async function uploadLogo(
  opts: ApiOpts,
  file: File,
): Promise<LogoUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  // fetchClient sets Content-Type JSON by default; for FormData we override
  const { token, tenantId, clinicId } = opts;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Tenant-ID": tenantId,
  };
  if (clinicId) headers["X-Clinic-ID"] = clinicId;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s for uploads

  let response: Response;
  try {
    response = await fetch(`/api/v1/lisa/marca/logos`, {
      method: "POST",
      headers,
      body: formData,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(`Logo upload failed: ${response.status} ${JSON.stringify(body)}`);
  }

  return response.json() as Promise<LogoUploadResponse>;
}

export async function deleteLogo(opts: ApiOpts): Promise<void> {
  await fetchClient<void>(`/api/v1/lisa/marca/logos`, {
    ...opts,
    method: "DELETE",
  });
}
