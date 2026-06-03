// cap: adrian.inbox
// story-origin: vitalia-fase2-adrian-inbox
/**
 * adrian/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states (origin)
 * F3-T-3 vitalia-fase2-adrian-inbox (2026-06-03): adds AdrianInboxView + getInitialInboxState
 *
 * T-3: Exports AdrianInboxView (client root skeleton) + getInitialInboxState (SSR fetch).
 *      InboxPlaceholder is kept for backward-compat but is no longer wired in
 *      SubTabContent (adrian.inbox is now a SHIPPED_STATIC_SUBTABS route).
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Inbox root component (T-3 skeleton — T-5 fleshes out 3-pane) ──────────────
export { AdrianInboxView } from "./components/inbox/AdrianInboxView";
export type { AdrianInboxViewProps } from "./components/inbox/AdrianInboxView";

// ── SSR server-side fetch (T-3) — Server Components only ─────────────────────
// NOTE: This import is safe in server context. Do NOT import in "use client" components.
export { getInitialInboxState } from "./api/inbox-server";
export type {
  GetInitialInboxStateOptions,
  InitialInboxState,
  InboxConversationSummary,
} from "./api/inbox-server";

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { OutboundPlaceholder } from "./components/placeholders/OutboundPlaceholder";
export { PropuestasPlaceholder } from "./components/placeholders/PropuestasPlaceholder";

// ── Placeholder components (T-4 special: AdrianEmbudo) ───────────────────────
export { EmbudoPlaceholder } from "./components/placeholders/EmbudoPlaceholder";

// ── Placeholder components (T-6 special: AdrianInbox — DEPRECATED wiring) ──────
// InboxPlaceholder kept for backward-compat but is NO LONGER registered in
// SubTabContent.PLACEHOLDER_MAP (adrian.inbox is a SHIPPED_STATIC_SUBTABS route since F3-T-3).
export { InboxPlaceholder } from "./components/placeholders/InboxPlaceholder";

// ── Inbox molecules (T-5 sales_studio parity — brand-local) ───────────────────
export { CampaignTag } from "./components/inbox/CampaignTag";
export { ConversationItem } from "./components/inbox/ConversationItem";
export { MessageBubble } from "./components/inbox/MessageBubble";
export { MessageInput } from "./components/inbox/MessageInput";
export { ContactSidebar } from "./components/inbox/ContactSidebar";
// ── Inbox molecules (T-6 takeover UX — brand-local) ──────────────────────────
export { ThreadHeader } from "./components/inbox/ThreadHeader";
export type { ThreadHeaderProps } from "./components/inbox/ThreadHeader";
export { TakeoverBanner } from "./components/inbox/TakeoverBanner";
export type { TakeoverBannerProps } from "./components/inbox/TakeoverBanner";
export type {
  ConversationListItem,
  InboxChannel,
  LeadTemp,
  FunnelStage,
  HandlerMode,
  CampaignRef,
} from "./components/inbox/types";
