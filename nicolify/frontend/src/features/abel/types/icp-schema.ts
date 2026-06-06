// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * icp-schema.ts — Zod validation schemas for ICP and Buyer forms (RHF + zodResolver).
 *
 * Used by:
 *   IcpDatosForm   → icpFormSchema (T-FE-4, out of T-FE-3 scope)
 *   BuyerLeafForm  → buyerFormSchema (T-FE-4, out of T-FE-3 scope)
 *
 * T-FE-3 scope: define the schemas + export for downstream use.
 * T-FE-4 wires these into RHF forms with autosave (debounce 600ms).
 *
 * Spanish neutro LatAm error messages (tuteo, sin voseo).
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §3 Forms (RHF + zodResolver)
 * validators_gate: RN-8 (mark-ready min) + RN-11 (currency preserved)
 */

import { z } from "zod";

// ── ICP Form Schema ──────────────────────────────────────────────────────────

/**
 * icpFormSchema — full ICP editing schema.
 *
 * Required: label (RN-7 unique enforced server-side — client shows 409 error).
 * Optional: all other fields (ICP starts as borrador — RN-3 proponer/ratificar).
 * Currency: avgTicketCurrency always paired with avgTicket (RN-11 preserve currency).
 */
export const icpFormSchema = z.object({
  label: z.string().min(1, "El nombre del ICP es requerido").max(120, "Máximo 120 caracteres"),
  description: z.string().max(2000, "Máximo 2000 caracteres").nullish(),
  vertical: z.string().max(120, "Máximo 120 caracteres").nullish(),
  companySize: z.string().max(80, "Máximo 80 caracteres").nullish(),
  geo: z.string().max(120, "Máximo 120 caracteres").nullish(),
  businessModel: z.string().max(120, "Máximo 120 caracteres").nullish(),
  /** Decimal as string — currency preserved, not converted (RN-11) */
  avgTicket: z.string().max(30, "Máximo 30 caracteres").nullish(),
  /** ISO 4217 currency code — always paired with avgTicket */
  avgTicketCurrency: z.string().length(3, "Código de moneda inválido (ej. USD, MXN)").nullish(),
  salesCycle: z.string().max(120, "Máximo 120 caracteres").nullish(),
  mainPain: z.string().max(500, "Máximo 500 caracteres").nullish(),
  salesAngle: z.string().max(500, "Máximo 500 caracteres").nullish(),
  signals: z.array(z.string().max(200, "Señal muy larga")).max(20, "Máximo 20 señales"),
  antiPattern: z.string().max(500, "Máximo 500 caracteres").nullish(),
});

export type IcpFormValues = z.infer<typeof icpFormSchema>;

// ── Buyer Form Schema ────────────────────────────────────────────────────────

const decisionPowerEnum = z.enum(["high", "medium", "low", "influencer"]);

/**
 * buyerFormSchema — buyer profile editing schema.
 *
 * Mirrors engine BuyerPersona field-contract slugs (demographics/psychographics/etc.)
 * Extended with B2B fields: role, decisionPower, preferredChannels (RN-5/RN-6).
 */
export const buyerFormSchema = z.object({
  name: z.string().min(1, "El nombre del buyer es requerido").max(120, "Máximo 120 caracteres"),
  role: z.string().max(120, "Máximo 120 caracteres").nullish(),
  decisionPower: decisionPowerEnum.nullish(),
  isPrimary: z.boolean(),
  demographics: z.record(z.string(), z.unknown()),
  psychographics: z.record(z.string(), z.unknown()),
  painPoints: z.array(z.record(z.string(), z.unknown())).max(20, "Máximo 20 dolores"),
  desires: z.array(z.record(z.string(), z.unknown())).max(20, "Máximo 20 deseos"),
  objections: z.array(z.record(z.string(), z.unknown())).max(20, "Máximo 20 objeciones"),
  buyerJourney: z.record(z.string(), z.unknown()),
  purchaseTriggers: z.array(z.string().max(200, "Trigger muy largo")).max(10, "Máximo 10 triggers"),
  preferredChannels: z
    .array(z.record(z.string(), z.unknown()))
    .max(10, "Máximo 10 canales preferidos"),
});

export type BuyerFormValues = z.infer<typeof buyerFormSchema>;

// ── ICP Create Schema (minimal) ──────────────────────────────────────────────

/**
 * icpCreateSchema — minimal schema for creating a new blank ICP.
 * Only requires label. All other fields are optional (borrador state).
 */
export const icpCreateSchema = z.object({
  label: z.string().min(1, "El nombre del ICP es requerido").max(120, "Máximo 120 caracteres"),
});

export type IcpCreateFormValues = z.infer<typeof icpCreateSchema>;
