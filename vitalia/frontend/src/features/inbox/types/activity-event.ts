// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * activity-event.ts — TS interface mirroring Pydantic ActivityEventResponse.
 *
 * Activity events mirror copilot_trace_event filtered by conversation_id.
 * Displayed in AgentActivityStream (sticky 32px → 240px).
 *
 * Snake_case per 03-arch-fe.md § 4 (mirrors Pydantic DTOs verbatim).
 * ISO 8601 datetimes as `string`.
 *
 * PHI note: payload_redacted = pre-sanitized server-side via sanitize_payload()
 * — FE never receives raw PHI in trace events.
 *
 * downstream-regression-na: brand-local FE types; no cross-brand consumers
 */

/**
 * Activity event type discriminants.
 * Maps to Adrián Copilot trace event kinds visible to clinic operators.
 */
export type ActivityEventKind =
  | "tool_call"
  | "llm_call"
  | "turn_start"
  | "turn_end"
  | "proposal_generated"
  | "mode_changed"
  | "message_sent"
  | "message_retracted"
  | "adrian_paused"
  | "compliance_blocked";

/**
 * ActivityEvent — mirrors Pydantic ActivityEventResponse.
 * Sourced from copilot_trace_event table filtered by conversation_id.
 */
export interface ActivityEvent {
  /** UUID primary key */
  id: string;
  /** FK → vitalia_conversations.id */
  conversation_id: string;
  /** Discriminant for rendering icon + label */
  kind: ActivityEventKind;
  /** Human-readable summary (Spanish neutro, server-rendered) */
  summary: string;
  /** Pre-sanitized metadata snippet (no PHI per hipaa-lite.md) */
  payload_redacted: Record<string, unknown> | null;
  /** ISO 8601 event timestamp */
  occurred_at: string;
}
