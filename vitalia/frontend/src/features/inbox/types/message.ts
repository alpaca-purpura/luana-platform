// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * message.ts — TS interface mirroring Pydantic MessageResponse.
 *
 * Snake_case per 03-arch-fe.md § 4 (mirrors Pydantic DTOs verbatim).
 * ISO 8601 datetimes as `string`. Optional fields explicit.
 *
 * PHI note: body_text may contain indirect PHI (names embedded in patient messages).
 * Rendered via PiiMaskedSpan where appropriate (ContactSidebar).
 *
 * downstream-regression-na: brand-local FE types; no cross-brand consumers
 */

/** Who sent the message. */
export type MessageSenderType =
  | "patient"
  | "agent_ai"
  | "agent_human"
  | "system";

/** Supported media types for message attachments. */
export type MessageMediaKind =
  | "audio"
  | "image"
  | "video"
  | "document"
  | "sticker";

/**
 * Message — mirrors Pydantic MessageResponse.
 * Maps vitalia_messages table row (PHI-scoped: tenant_id + clinic_id).
 */
export interface Message {
  /** UUID primary key */
  id: string;
  /** FK → vitalia_conversations.id */
  conversation_id: string;
  /** Who sent the message */
  sender_type: MessageSenderType;
  /** FK → users.id for human senders; null for agent_ai / system */
  sender_user_id: string | null;
  /** Plain-text body (null for media-only messages) */
  body_text: string | null;
  /** Presence indicates a media attachment */
  media_kind: MessageMediaKind | null;
  /** CDN URL for the media asset */
  media_url: string | null;
  /** Audio duration in seconds (only for media_kind="audio") */
  media_duration_s: number | null;
  /** Whisper STT transcription text (null if not transcribed or failed) */
  transcription_text: string | null;
  /** Whisper confidence score 0..1 (null if not transcribed) */
  transcription_confidence: number | null;
  /** ISO 8601 timestamp of retraction; null if not retracted */
  retracted_at: string | null;
  /** Whether the retraction API call to the channel succeeded */
  retract_succeeded: boolean | null;
  /** Handler mode at time of send (reflects conversation state) */
  handler_mode: "ai" | "human";
  /** ISO 8601 timestamp when sent to the channel */
  sent_at: string;
  /** ISO 8601 expiry for undo action receipt chip (null = no undo available) */
  action_receipt_expires_at: string | null;
}
