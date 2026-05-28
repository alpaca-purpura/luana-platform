// cap: __shared__
// atomics: TBD
// story-origin: TBD
/**
 * crm-shared/types.ts — Shared CRM type contracts (PRODUCER · Ola 1+).
 *
 * Consumed by: features/inbox (this story) · features/pipeline (Ola 2) · features/agenda (Ola 2).
 * Snake_case per 03-arch-fe.md § 4 (mirrors Pydantic DTOs verbatim).
 * ISO 8601 datetimes as `string`. PHI fields: name, phone, email.
 *
 * HIPAA-lite: all PHI fields (name, phone, email, patient_id) MUST be rendered
 * via <PiiMaskedSpan>, <RequireRole>, or <AuditedSection> in UI components.
 * FE never stores PHI in localStorage/sessionStorage.
 *
 * downstream-regression-na: brand-local FE types; no cross-brand consumers.
 * Note: this is brand-new Ola 1 — downstream features (pipeline, agenda) depend
 * on this contract. Changes require architect review per FSD cross-feature rules.
 */

/** CRM funnel stage — mirrors Pydantic LeadStage enum */
export type LeadStage =
  | "interesado"
  | "calificando"
  | "considerando"
  | "listo"
  | "reservado_deposito"
  | "decidio_no";

/** Lead attribution source */
export type LeadOrigin =
  | "sales_agent"
  | "walk_in"
  | "phone_manual"
  | "proactive_outbound";

/**
 * Lead — mirrors Pydantic LeadResponse.
 * PHI fields: name, phone, email (wrap with PiiMaskedSpan + RequireRole).
 * Dual-filter enforced server-side: tenant_id + clinic_id.
 */
export interface Lead {
  id: string;
  /** Tenant scope — used by fetchClient X-Tenant-ID auto-injection */
  tenant_id: string;
  /** Clinic scope — HIPAA-lite dual filter (vitalia/.claude/rules/hipaa-lite.md) */
  clinic_id: string;
  /** PHI: patient full name — MUST use <PiiMaskedSpan kind="name"> */
  name: string;
  /** PHI: patient phone — MUST use <PiiMaskedSpan kind="phone"> */
  phone: string | null;
  /** PHI: patient email — MUST use <PiiMaskedSpan kind="email"> */
  email: string | null;
  /** Current CRM stage */
  stage: LeadStage;
  /** How lead entered the system */
  attribution: {
    origin: LeadOrigin;
    channel: string | null;
    attributed_at: string;
  };
  /** FK → vitalia_conversations.id (most recent) */
  last_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Supported conversation channels */
export type ConversationChannel =
  | "whatsapp"
  | "instagram"
  | "facebook_messenger"
  | "web"
  | "walk_in"
  | "phone";

/** Conversation lifecycle status */
export type ConversationStatus = "active" | "paused" | "closed" | "archived";

/** Handler mode — who controls message sending */
export type HandlerMode = "ai" | "human";

/**
 * Conversation — mirrors Pydantic ConversationResponse.
 * Dual-filter enforced server-side: tenant_id + clinic_id.
 */
export interface Conversation {
  id: string;
  lead_id: string;
  /** Tenant scope */
  tenant_id: string;
  /** Clinic scope — HIPAA-lite dual filter */
  clinic_id: string;
  /** PHI: patient UUID (only ID, not name) — no PHI wrap needed */
  patient_id: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  /** Current agent mode — drives SegmentedControl3Modes UI */
  handler_mode: HandlerMode;
  /** Adrián is waiting for operator to review proposal */
  proposal_required: boolean;
  /** ISO 8601 — Adrián paused until this time */
  pause_until: string | null;
  /** Operator help requested flag — 🔴 indicator in list */
  help_needed: boolean;
  help_needed_reason: string | null;
  /** Count for 📎 indicator in conversation list */
  unread_media_count: number;
  last_message_at: string;
  /** Preview shown in conversation list item */
  last_message_preview: string | null;
  messages_count: number;
  /** Adrián's stage recommendation */
  stage_decision: LeadStage | null;
  /** FK → offers.id (linked offer for context) */
  linked_offer_id: string | null;
  /** ISO 8601 — used as ETag for OCC (If-Match header) */
  updated_at: string;
}
