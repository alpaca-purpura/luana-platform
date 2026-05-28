// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * tools-state.ts — TS interfaces mirroring Pydantic ToolsStateResponse.
 *
 * Read-only state of Adrián's active tools per conversation.
 * Displayed in AdrianToolsSheet (right panel 420px, Shadcn Sheet).
 * Cached 30s (changes infrequent per BE design).
 *
 * Snake_case per 03-arch-fe.md § 4 (mirrors Pydantic DTOs verbatim).
 * ISO 8601 datetimes as `string`.
 *
 * downstream-regression-na: brand-local FE types; no cross-brand consumers
 */

/** Status of a single tool invocation. */
export type ToolInvocationStatus = "pending" | "success" | "error" | "skipped";

/** Single tool invocation record shown in AdrianToolsSheet. */
export interface ToolInvocation {
  /** Tool identifier (e.g. "schedule_appointment", "send_offer_link") */
  tool_name: string;
  /** ISO 8601 timestamp of invocation */
  invoked_at: string;
  /** Execution outcome */
  status: ToolInvocationStatus;
  /** Human-readable summary (server-rendered, Spanish neutro) */
  result_summary: string | null;
}

/**
 * ToolsState — mirrors Pydantic ToolsStateResponse.
 * Null when agent is not active for the conversation.
 */
export interface ToolsState {
  /** FK → vitalia_conversations.id */
  conversation_id: string;
  /** Ordered list of tool invocations (chronological) */
  invocations: ToolInvocation[];
  /** ISO 8601 timestamp of last state update */
  updated_at: string;
}
