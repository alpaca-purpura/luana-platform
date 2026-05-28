// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
/**
 * _keys.ts — React Query key factory for inbox feature.
 *
 * Centralizes all query keys to prevent string drift across hooks.
 * Follow factory pattern: each function returns a tuple used by
 * useQuery/useMutation/invalidateQueries consistently.
 *
 * downstream-regression-na: brand-local FE keys; no cross-brand consumers
 */

/** Filters shape used when listing conversations */
export interface ConversationsFilters {
  channel?: string | null;
  status?: string | null;
  stage?: string | null;
  mode?: string | null;
  period?: string | null;
  helpNeeded?: boolean | null;
  unreadMedia?: boolean | null;
  search?: string | null;
}

/** Root key segment for all inbox queries */
const INBOX = "inbox" as const;

/**
 * All conversations list (paginated + filterable).
 * Invalidated on send / retract / mode-change mutations.
 */
export const conversationsListKey = (filters?: ConversationsFilters) =>
  filters
    ? ([INBOX, "conversations", filters] as const)
    : ([INBOX, "conversations"] as const);

/**
 * Single conversation detail compound response.
 * Includes messages, action_receipts, tools_state.
 */
export const conversationDetailKey = (conversationId: string) =>
  [INBOX, "conversation", conversationId] as const;

/**
 * Activity stream events for a conversation.
 * Polled every 5s when AgentActivityStream is expanded.
 */
export const activityStreamKey = (conversationId: string) =>
  [INBOX, "activity-stream", conversationId] as const;

/**
 * Tools state for a conversation.
 * Cached 30s — changes infrequent (read-only).
 */
export const toolsStateKey = (conversationId: string) =>
  [INBOX, "tools", conversationId] as const;

/**
 * CRM conversations list (lives in crm-shared but shared key namespace
 * for cross-invalidation when inbox mutations affect list).
 */
export const crmConversationsListKey = (filters?: ConversationsFilters) =>
  filters
    ? (["crm", "conversations", filters] as const)
    : (["crm", "conversations"] as const);

/**
 * CRM single conversation detail (crm-shared hook namespace).
 */
export const crmConversationDetailKey = (conversationId: string) =>
  ["crm", "conversation", conversationId] as const;
