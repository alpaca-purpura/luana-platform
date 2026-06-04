// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * buyer.ts — TypeScript types for Buyer entities (camelCase mirror of BE DTOs).
 *
 * Mirrors BuyerResponse DTO from 03-arch-fe.md §6.
 * JSONB sub-objects typed as Record for flexibility (field-contract engine pattern).
 * ISO 8601 datetimes as string. Optional fields explicit.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 */

export type DecisionPower = "high" | "medium" | "low" | "influencer";

export interface Buyer {
  id: string;
  tenantId: string;
  icpId: string; // FK → ICP (RN-5)
  name: string;
  role: string | null;
  decisionPower: DecisionPower | null;
  isPrimary: boolean; // ≤1 per ICP (RN-6)
  /** JSONB — mirrors engine BuyerPersona demographics slugs */
  demographics: Record<string, unknown>;
  /** JSONB — mirrors engine psychographics slugs */
  psychographics: Record<string, unknown>;
  /** list[dict] — pain_points JSONB */
  painPoints: Array<Record<string, unknown>>;
  /** list[dict] — desires JSONB */
  desires: Array<Record<string, unknown>>;
  /** list[dict] — objections JSONB */
  objections: Array<Record<string, unknown>>;
  /** JSONB — buyer_journey sub-fields */
  buyerJourney: Record<string, unknown>;
  purchaseTriggers: string[];
  /** list[dict] — channel + frequency + tone */
  preferredChannels: Array<Record<string, unknown>>;
  createdAt: string | null; // ISO 8601
  updatedAt: string | null; // ISO 8601
}

export interface BuyerListItem {
  id: string;
  name: string;
  role: string | null;
  decisionPower: DecisionPower | null;
  isPrimary: boolean;
}
