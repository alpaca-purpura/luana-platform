// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * icp-api.ts — API client for ICP CRUD operations (Abel).
 *
 * Endpoints:
 *   GET    /api/v1/abel/icp               → list ICPs (IcpListItem[])
 *   GET    /api/v1/abel/icp/{id}          → get ICP detail (Icp)
 *   POST   /api/v1/abel/icp              → create ICP
 *   PATCH  /api/v1/abel/icp/{id}          → partial update
 *   POST   /api/v1/abel/icp/{id}/mark-ready → mark as listo
 *   DELETE /api/v1/abel/icp/{id}          → soft-delete
 *
 * fetchClient auto-injects X-Tenant-ID from tenant param (RN-1 tenant isolation).
 * NEVER hardcode 'USD' or tenantId — caller provides both.
 * snake_case → camelCase mapping happens here in the API layer.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §1 FSD-Lite layout / api/icp-api.ts
 * validators_gate: RN-1 (tenant isolation) + RN-7 (label unique) + RN-8 (mark-ready)
 */

import { fetchClient } from "@/lib/api/fetch-client";

import type { Icp, IcpListItem, IcpCreatePayload, IcpPatchPayload } from "../types/icp";

// ── API options type ────────────────────────────────────────────────────────

export interface IcpApiOptions {
  token: string;
  tenantId: string;
}

// ── Response types (snake_case from BE → mapped to camelCase) ──────────────

/** Raw BE IcpListItemResponse (snake_case) */
interface RawIcpListItem {
  id: string;
  label: string;
  vertical: string | null;
  status: "borrador" | "listo";
  buyer_count: number;
}

/** Raw BE IcpResponse (snake_case) */
interface RawIcp {
  id: string;
  label: string;
  description: string | null;
  vertical: string | null;
  company_size: string | null;
  geo: string | null;
  business_model: string | null;
  avg_ticket: string | null;
  avg_ticket_currency: string | null;
  sales_cycle: string | null;
  main_pain: string | null;
  sales_angle: string | null;
  signals: string[];
  anti_pattern: string | null;
  status: "borrador" | "listo";
  origin: "manual" | "draft";
  buyer_count: number;
  created_at: string | null;
  updated_at: string | null;
}

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapListItem(raw: RawIcpListItem): IcpListItem {
  return {
    id: raw.id,
    label: raw.label,
    vertical: raw.vertical,
    status: raw.status,
    buyerCount: raw.buyer_count,
  };
}

function mapIcp(raw: RawIcp): Icp {
  return {
    id: raw.id,
    label: raw.label,
    description: raw.description,
    vertical: raw.vertical,
    companySize: raw.company_size,
    geo: raw.geo,
    businessModel: raw.business_model,
    avgTicket: raw.avg_ticket,
    avgTicketCurrency: raw.avg_ticket_currency,
    salesCycle: raw.sales_cycle,
    mainPain: raw.main_pain,
    salesAngle: raw.sales_angle,
    signals: raw.signals ?? [],
    antiPattern: raw.anti_pattern,
    status: raw.status,
    origin: raw.origin,
    buyerCount: raw.buyer_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/** Converts camelCase payload keys to snake_case for BE */
function toSnakePayload(payload: IcpCreatePayload | IcpPatchPayload): Record<string, unknown> {
  return {
    ...(payload.label !== undefined ? { label: payload.label } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.vertical !== undefined ? { vertical: payload.vertical } : {}),
    ...(payload.companySize !== undefined ? { company_size: payload.companySize } : {}),
    ...(payload.geo !== undefined ? { geo: payload.geo } : {}),
    ...(payload.businessModel !== undefined ? { business_model: payload.businessModel } : {}),
    ...(payload.avgTicket !== undefined ? { avg_ticket: payload.avgTicket } : {}),
    ...(payload.avgTicketCurrency !== undefined
      ? { avg_ticket_currency: payload.avgTicketCurrency }
      : {}),
    ...(payload.salesCycle !== undefined ? { sales_cycle: payload.salesCycle } : {}),
    ...(payload.mainPain !== undefined ? { main_pain: payload.mainPain } : {}),
    ...(payload.salesAngle !== undefined ? { sales_angle: payload.salesAngle } : {}),
    ...(payload.signals !== undefined ? { signals: payload.signals } : {}),
    ...(payload.antiPattern !== undefined ? { anti_pattern: payload.antiPattern } : {}),
  };
}

// ── ICP API ─────────────────────────────────────────────────────────────────

export const icpApi = {
  /**
   * List all ICPs for the tenant (returns lightweight list items).
   * GET /api/v1/abel/icp
   */
  list: async ({ token, tenantId }: IcpApiOptions): Promise<IcpListItem[]> => {
    const raw = await fetchClient<RawIcpListItem[]>("/api/v1/abel/icp", {
      method: "GET",
      token,
      tenantId,
    });
    return raw.map(mapListItem);
  },

  /**
   * Get full ICP detail.
   * GET /api/v1/abel/icp/{id}
   */
  get: async ({ token, tenantId }: IcpApiOptions, id: string): Promise<Icp> => {
    const raw = await fetchClient<RawIcp>(`/api/v1/abel/icp/${id}`, {
      method: "GET",
      token,
      tenantId,
    });
    return mapIcp(raw);
  },

  /**
   * Create a new ICP (manual start — blank form path).
   * POST /api/v1/abel/icp
   */
  create: async ({ token, tenantId }: IcpApiOptions, payload: IcpCreatePayload): Promise<Icp> => {
    const raw = await fetchClient<RawIcp>("/api/v1/abel/icp", {
      method: "POST",
      token,
      tenantId,
      body: JSON.stringify(toSnakePayload(payload)),
    });
    return mapIcp(raw);
  },

  /**
   * Partial update an ICP field (autosave debounce 600ms — RN-8).
   * PATCH /api/v1/abel/icp/{id}
   */
  patch: async (
    { token, tenantId }: IcpApiOptions,
    id: string,
    payload: IcpPatchPayload,
  ): Promise<Icp> => {
    const raw = await fetchClient<RawIcp>(`/api/v1/abel/icp/${id}`, {
      method: "PATCH",
      token,
      tenantId,
      body: JSON.stringify(toSnakePayload(payload)),
    });
    return mapIcp(raw);
  },

  /**
   * Mark ICP as "listo" (validates minimum requirements — RN-8).
   * POST /api/v1/abel/icp/{id}/mark-ready
   * Returns 422 with {missing: string[]} if minimum not met.
   */
  markReady: async ({ token, tenantId }: IcpApiOptions, id: string): Promise<Icp> => {
    const raw = await fetchClient<RawIcp>(`/api/v1/abel/icp/${id}/mark-ready`, {
      method: "POST",
      token,
      tenantId,
      body: JSON.stringify({}),
    });
    return mapIcp(raw);
  },

  /**
   * Soft-delete an ICP.
   * DELETE /api/v1/abel/icp/{id}
   */
  delete: async ({ token, tenantId }: IcpApiOptions, id: string): Promise<void> => {
    await fetchClient<void>(`/api/v1/abel/icp/${id}`, {
      method: "DELETE",
      token,
      tenantId,
    });
  },
};
