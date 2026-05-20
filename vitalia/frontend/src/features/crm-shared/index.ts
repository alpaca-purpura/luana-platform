/**
 * crm-shared — Public API barrel (PRODUCER · Ola 1+).
 *
 * Consumer pattern (per FSD-Lite boundary matrix):
 *   import type { Lead, Conversation } from "@/features/crm-shared";
 *
 * NO default exports (arch fitness test enforces).
 * React Query hooks for crm-shared (use-leads, use-conversations, use-conversation-detail)
 * are added in T-inbox-fe-2 (they live in crm-shared/api/).
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
