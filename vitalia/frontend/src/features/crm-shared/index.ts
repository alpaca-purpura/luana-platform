// cap: __shared__
// atomics: TBD
// story-origin: TBD
/**
 * crm-shared — Public API barrel (PRODUCER · Ola 1+).
 *
 * Consumer pattern (per FSD-Lite boundary matrix):
 *   import type { Lead, Conversation } from "@/features/crm-shared";
 *   import { useConversations } from "@/features/crm-shared";
 *
 * NO default exports (arch fitness test enforces).
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

export type {
  Lead,
  LeadStage,
  LeadOrigin,
  Conversation,
  ConversationChannel,
  ConversationStatus,
  HandlerMode,
} from "./types";

// React Query hooks (T-inbox-fe-2)
export { useConversations } from "./api/use-conversations";
export type {
  ConversationsFilters,
  ConversationsResponse,
} from "./api/use-conversations";
export { useConversationDetail } from "./api/use-conversation-detail";
export { useLeads } from "./api/use-leads";
export type { LeadsFilters, LeadsResponse } from "./api/use-leads";
