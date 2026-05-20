/**
 * inbox/index.ts — Public API barrel (FSD-Lite boundary matrix).
 *
 * Consumers (app layer only — cross-feature imports forbidden per boundary matrix):
 *   import { InboxPageClient } from "@/features/inbox";
 *
 * NO default exports (arch fitness test enforces named exports only).
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// Components (T-inbox-fe-3: conversation list panel + sub-components)
export { ConversationListPanel } from "./components/ConversationListPanel";
export { ConversationList } from "./components/ConversationList";
export { ConversationItem } from "./components/ConversationItem";
export { SearchInput } from "./components/SearchInput";
export { FilterChips } from "./components/FilterChips";
export type { FilterChipsValue } from "./components/FilterChips";
export { ListEmptyState } from "./components/ListEmptyState";
export type { ListEmptyStateVariant } from "./components/ListEmptyState";
// Components (T-inbox-fe-4: conversation thread + controls)
export { ConversationThread } from "./components/ConversationThread";
export { ThreadHeader } from "./components/ThreadHeader";
export { SegmentedControl3Modes } from "./components/SegmentedControl3Modes";
export { VoiceStyleChip } from "./components/VoiceStyleChip";
export { PauseAdrianButton } from "./components/PauseAdrianButton";
export { PauseAdrianConfirmModal } from "./components/PauseAdrianConfirmModal";
export { ToolsSheetTrigger } from "./components/ToolsSheetTrigger";
export { ContactSidebarToggle } from "./components/ContactSidebarToggle";
// Scaffold layout + page client
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

// API hooks (T-inbox-fe-2)
export { useSendMessage } from "./api/use-send-message";
export type { SendMessageInput } from "./api/use-send-message";
export { useRetractMessage } from "./api/use-retract-message";
export type { RetractMessageInput, RetractMessageResult } from "./api/use-retract-message";
export { useSetMode } from "./api/use-set-mode";
export type { SetModeInput, SetModeResult } from "./api/use-set-mode";
export { usePauseAdrian } from "./api/use-pause-adrian";
export type { PauseAdrianInput, PauseAdrianResult } from "./api/use-pause-adrian";
export { useActivityStream } from "./api/use-activity-stream";
export type { ActivityStreamResponse } from "./api/use-activity-stream";
export { useToolsState } from "./api/use-tools-state";
export { useTranscribeAudio } from "./api/use-transcribe-audio";
export type { TranscribeAudioInput, TranscribeAudioResult } from "./api/use-transcribe-audio";
export { useProactiveOutbound } from "./api/use-proactive-outbound";
export type { ProactiveOutboundInput, ProactiveOutboundResult } from "./api/use-proactive-outbound";
export { useAttachMedia } from "./api/use-attach-media";
export type { AttachMediaInput, AttachMediaResult } from "./api/use-attach-media";

// Query key factory
export {
  conversationsListKey,
  conversationDetailKey,
  activityStreamKey,
  toolsStateKey,
} from "./api/_keys";
export type { ConversationsFilters } from "./api/_keys";

// Utility hooks (T-inbox-fe-2)
export { useModeToggle, conversationToSegmentValue } from "./hooks/use-mode-toggle";
export type { SegmentedModeValue, UseModeToggleResult } from "./hooks/use-mode-toggle";
export { useActionReceiptTimer } from "./hooks/use-action-receipt-timer";
export type { UseActionReceiptTimerResult } from "./hooks/use-action-receipt-timer";
export { useConversationFilters } from "./hooks/use-conversation-filters";
export { useActivityStreamPoll } from "./hooks/use-activity-stream-poll";
export type { UseActivityStreamPollResult } from "./hooks/use-activity-stream-poll";
