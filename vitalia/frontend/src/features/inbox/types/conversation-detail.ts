// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
/**
 * conversation-detail.ts — TS interfaces mirroring Pydantic ConversationDetailResponse.
 *
 * Snake_case per 03-arch-fe.md § 4 (mirrors Pydantic DTOs verbatim).
 * ISO 8601 datetimes as `string`.
 * Compound response consumed by use-conversation-detail.ts hook (T-inbox-fe-2).
 *
 * downstream-regression-na: brand-local FE types; no cross-brand consumers
 */

import type { Message } from "./message";
import type { ActionReceipt } from "./action-receipt";
import type { ToolsState } from "./tools-state";
import type { Conversation, Lead } from "@/features/crm-shared";

/**
 * ConversationDetail — full compound response for a single conversation thread.
 * Mirrors Pydantic ConversationDetailResponse.
 */
export interface ConversationDetail {
  /** The conversation entity */
  conversation: Conversation;
  /** The lead / patient contact associated with this conversation */
  lead: Lead;
  /** Ordered list of messages in the thread (chronological) */
  messages: Message[];
  /** Active action receipts (for undo chip rendering) */
  action_receipts: ActionReceipt[];
  /** Agent tools state for the conversation (null if agent not active) */
  tools_state: ToolsState | null;
}
