/**
 * inbox/index.ts — Public API barrel (FSD-Lite boundary matrix).
 *
 * Consumers (app layer only — cross-feature imports forbidden per boundary matrix):
 *   import { InboxPageClient } from "@/features/inbox";
 *
 * NO default exports (arch fitness test enforces named exports only).
 * API hooks (use-conversations, use-send-message etc.) added in T-inbox-fe-2.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// Components (scaffold — full list expanded in T-inbox-fe-3..6)
export { InboxLayout } from "./components/InboxLayout";
export { InboxPageClient } from "./components/InboxPageClient";

// URL state
export {
  INBOX_URL_SCHEMA,
  useInboxUrlState,
} from "./url-state";
export type {
  InboxUrlState,
  InboxChannelFilter,
  InboxStatusFilter,
  InboxStageFilter,
  InboxModeFilter,
  InboxPeriodFilter,
} from "./url-state";

// Copy constants
export { INBOX_COPY } from "./copy";
export type { InboxCopyKey } from "./copy";

// Store
export { useInboxStore } from "./store/inbox-store";

// Types (re-export from sub-modules)
export type { Message, MessageSenderType, MessageMediaKind } from "./types/message";
export type { ActivityEvent, ActivityEventKind } from "./types/activity-event";
export type { ActionReceipt } from "./types/action-receipt";
export type { ToolsState, ToolInvocation, ToolInvocationStatus } from "./types/tools-state";
export type { ConversationDetail } from "./types/conversation-detail";
