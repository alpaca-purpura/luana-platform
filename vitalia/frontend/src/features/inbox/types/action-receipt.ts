// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
/**
 * action-receipt.ts — TS interface mirroring Pydantic ActionReceiptResponse.
 *
 * Action receipts enable the 5-minute undo chip on messages.
 * Snake_case per 03-arch-fe.md § 4 (mirrors Pydantic DTOs verbatim).
 * ISO 8601 datetimes as `string`.
 *
 * downstream-regression-na: brand-local FE types; no cross-brand consumers
 */

/**
 * ActionReceipt — minimal envelope enabling undo retraction.
 * Sourced from action_receipts field in ConversationDetailResponse.
 */
export interface ActionReceipt {
  /** FK → vitalia_messages.id */
  message_id: string;
  /** ISO 8601 expiry — chip renders countdown; past = chip hidden */
  expires_at: string;
}
