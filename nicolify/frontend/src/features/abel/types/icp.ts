// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * icp.ts — TypeScript types for ICP entities (camelCase mirror of BE DTOs).
 *
 * Mirrors IcpResponse + IcpListItem DTOs from 03-arch-fe.md §6.
 * ISO 8601 datetimes as string. Optional fields explicit.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §6 TypeScript Types
 */

export type IcpStatus = "borrador" | "listo";
export type IcpOrigin = "manual" | "draft";

export interface Icp {
  id: string;
  label: string;
  description: string | null;
  vertical: string | null;
  companySize: string | null;
  geo: string | null;
  businessModel: string | null;
  /** Decimal as string — preserved currency, never convert on write (RN-11) */
  avgTicket: string | null;
  /** ISO 4217 currency code — always paired with avgTicket (RN-11) */
  avgTicketCurrency: string | null;
  salesCycle: string | null;
  mainPain: string | null;
  salesAngle: string | null;
  signals: string[];
  antiPattern: string | null;
  status: IcpStatus;
  origin: IcpOrigin;
  /** Count of buyers under this ICP */
  buyerCount: number;
  createdAt: string | null; // ISO 8601
  updatedAt: string | null; // ISO 8601
}

export interface IcpListItem {
  id: string;
  label: string;
  vertical: string | null;
  status: IcpStatus;
  buyerCount: number;
}

export interface IcpCreatePayload {
  label: string;
  description?: string | null;
  vertical?: string | null;
  companySize?: string | null;
  geo?: string | null;
  businessModel?: string | null;
  avgTicket?: string | null;
  avgTicketCurrency?: string | null;
  salesCycle?: string | null;
  mainPain?: string | null;
  salesAngle?: string | null;
  signals?: string[];
  antiPattern?: string | null;
}

export type IcpPatchPayload = Partial<IcpCreatePayload>;
