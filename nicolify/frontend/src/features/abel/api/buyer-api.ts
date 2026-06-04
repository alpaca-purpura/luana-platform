// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * buyer-api.ts — API client for Buyer CRUD operations (Abel).
 *
 * Endpoints:
 *   GET    /api/v1/abel/icp/{icpId}/buyers       → list buyers for an ICP
 *   GET    /api/v1/abel/buyers/{id}               → get buyer detail
 *   POST   /api/v1/abel/icp/{icpId}/buyers        → create buyer under ICP
 *   PATCH  /api/v1/abel/buyers/{id}               → partial update
 *   POST   /api/v1/abel/buyers/{id}/set-primary   → set as primary (RN-6)
 *   DELETE /api/v1/abel/buyers/{id}               → soft-delete
 *
 * Buyer is always scoped to an ICP (FK icp_id — RN-5).
 * fetchClient auto-injects X-Tenant-ID (RN-1 tenant isolation).
 * snake_case → camelCase mapping in this API layer.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §1 FSD-Lite layout / api/buyer-api.ts
 * validators_gate: RN-5 (buyer ↔ ICP) + RN-6 (≤1 primary) + RN-1 (tenant isolation)
 */

import { fetchClient } from "@/lib/api/fetch-client";

import type { Buyer, BuyerListItem, DecisionPower } from "../types/buyer";

// ── API options type ────────────────────────────────────────────────────────

export interface BuyerApiOptions {
  token: string;
  tenantId: string;
}

// ── Payload types ───────────────────────────────────────────────────────────

export interface BuyerCreatePayload {
  name: string;
  role?: string | null;
  decisionPower?: DecisionPower | null;
  isPrimary?: boolean;
  demographics?: Record<string, unknown>;
  psychographics?: Record<string, unknown>;
  painPoints?: Record<string, unknown>[];
  desires?: Record<string, unknown>[];
  objections?: Record<string, unknown>[];
  buyerJourney?: Record<string, unknown>;
  purchaseTriggers?: string[];
  preferredChannels?: Record<string, unknown>[];
}

export type BuyerPatchPayload = Partial<BuyerCreatePayload>;

// ── Raw BE types (snake_case) ───────────────────────────────────────────────

interface RawBuyerListItem {
  id: string;
  name: string;
  role: string | null;
  decision_power: DecisionPower | null;
  is_primary: boolean;
}

interface RawBuyer {
  id: string;
  tenant_id: string;
  icp_id: string;
  name: string;
  role: string | null;
  decision_power: DecisionPower | null;
  is_primary: boolean;
  demographics: Record<string, unknown>;
  psychographics: Record<string, unknown>;
  pain_points: Record<string, unknown>[];
  desires: Record<string, unknown>[];
  objections: Record<string, unknown>[];
  buyer_journey: Record<string, unknown>;
  purchase_triggers: string[];
  preferred_channels: Record<string, unknown>[];
  created_at: string | null;
  updated_at: string | null;
}

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapBuyerListItem(raw: RawBuyerListItem): BuyerListItem {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    decisionPower: raw.decision_power,
    isPrimary: raw.is_primary,
  };
}

function mapBuyer(raw: RawBuyer): Buyer {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    icpId: raw.icp_id,
    name: raw.name,
    role: raw.role,
    decisionPower: raw.decision_power,
    isPrimary: raw.is_primary,
    demographics: raw.demographics ?? {},
    psychographics: raw.psychographics ?? {},
    painPoints: raw.pain_points ?? [],
    desires: raw.desires ?? [],
    objections: raw.objections ?? [],
    buyerJourney: raw.buyer_journey ?? {},
    purchaseTriggers: raw.purchase_triggers ?? [],
    preferredChannels: raw.preferred_channels ?? [],
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toSnakePayload(payload: BuyerCreatePayload | BuyerPatchPayload): Record<string, unknown> {
  return {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.role !== undefined ? { role: payload.role } : {}),
    ...(payload.decisionPower !== undefined ? { decision_power: payload.decisionPower } : {}),
    ...(payload.isPrimary !== undefined ? { is_primary: payload.isPrimary } : {}),
    ...(payload.demographics !== undefined ? { demographics: payload.demographics } : {}),
    ...(payload.psychographics !== undefined ? { psychographics: payload.psychographics } : {}),
    ...(payload.painPoints !== undefined ? { pain_points: payload.painPoints } : {}),
    ...(payload.desires !== undefined ? { desires: payload.desires } : {}),
    ...(payload.objections !== undefined ? { objections: payload.objections } : {}),
    ...(payload.buyerJourney !== undefined ? { buyer_journey: payload.buyerJourney } : {}),
    ...(payload.purchaseTriggers !== undefined
      ? { purchase_triggers: payload.purchaseTriggers }
      : {}),
    ...(payload.preferredChannels !== undefined
      ? { preferred_channels: payload.preferredChannels }
      : {}),
  };
}

// ── Buyer API ────────────────────────────────────────────────────────────────

export const buyerApi = {
  /**
   * List buyers for a specific ICP (lightweight list items).
   * GET /api/v1/abel/icp/{icpId}/buyers
   *
   * Scoped to ICP (RN-5). Tenant isolation via X-Tenant-ID header.
   */
  listByIcp: async (
    { token, tenantId }: BuyerApiOptions,
    icpId: string,
  ): Promise<BuyerListItem[]> => {
    const raw = await fetchClient<RawBuyerListItem[]>(`/api/v1/abel/icp/${icpId}/buyers`, {
      method: "GET",
      token,
      tenantId,
    });
    return raw.map(mapBuyerListItem);
  },

  /**
   * Get full buyer detail.
   * GET /api/v1/abel/buyers/{id}
   */
  get: async ({ token, tenantId }: BuyerApiOptions, id: string): Promise<Buyer> => {
    const raw = await fetchClient<RawBuyer>(`/api/v1/abel/buyers/${id}`, {
      method: "GET",
      token,
      tenantId,
    });
    return mapBuyer(raw);
  },

  /**
   * Create a new buyer under an ICP.
   * POST /api/v1/abel/icp/{icpId}/buyers
   *
   * FK icp_id is set server-side from the path param (RN-5).
   */
  create: async (
    { token, tenantId }: BuyerApiOptions,
    icpId: string,
    payload: BuyerCreatePayload,
  ): Promise<Buyer> => {
    const raw = await fetchClient<RawBuyer>(`/api/v1/abel/icp/${icpId}/buyers`, {
      method: "POST",
      token,
      tenantId,
      body: JSON.stringify(toSnakePayload(payload)),
    });
    return mapBuyer(raw);
  },

  /**
   * Partial update a buyer.
   * PATCH /api/v1/abel/buyers/{id}
   */
  patch: async (
    { token, tenantId }: BuyerApiOptions,
    id: string,
    payload: BuyerPatchPayload,
  ): Promise<Buyer> => {
    const raw = await fetchClient<RawBuyer>(`/api/v1/abel/buyers/${id}`, {
      method: "PATCH",
      token,
      tenantId,
      body: JSON.stringify(toSnakePayload(payload)),
    });
    return mapBuyer(raw);
  },

  /**
   * Set a buyer as the primary buyer for its ICP (≤1 primary per ICP — RN-6).
   * POST /api/v1/abel/buyers/{id}/set-primary
   */
  setPrimary: async ({ token, tenantId }: BuyerApiOptions, id: string): Promise<Buyer> => {
    const raw = await fetchClient<RawBuyer>(`/api/v1/abel/buyers/${id}/set-primary`, {
      method: "POST",
      token,
      tenantId,
      body: JSON.stringify({}),
    });
    return mapBuyer(raw);
  },

  /**
   * Soft-delete a buyer.
   * DELETE /api/v1/abel/buyers/{id}
   */
  delete: async ({ token, tenantId }: BuyerApiOptions, id: string): Promise<void> => {
    await fetchClient<void>(`/api/v1/abel/buyers/${id}`, {
      method: "DELETE",
      token,
      tenantId,
    });
  },
};
