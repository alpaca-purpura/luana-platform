// cap: sales_agent.adrian-3-tools-mvp
// atomics: TBD
// story-origin: vitalia-fase1-s10-TBD
/**
 * adrian/index.ts — Feature public API (FSD-Lite boundary matrix).
 * F1-S10 vitalia-fase1-empty-states
 *
 * Exposes placeholder components created in T-2.
 * Special placeholders (T-4: EmbudoPlaceholder, T-6: InboxPlaceholder) added by those tickets.
 *
 * downstream-regression-na: brand-local FE barrel; no cross-brand consumers
 */

// ── Placeholder components (T-2 generic EmptyState wrappers) ──────────────────
export { OutboundPlaceholder } from "./components/placeholders/OutboundPlaceholder";
export { PropuestasPlaceholder } from "./components/placeholders/PropuestasPlaceholder";

// ── Placeholder components (T-4 special: AdrianEmbudo) ───────────────────────
export { EmbudoPlaceholder } from "./components/placeholders/EmbudoPlaceholder";

// ── Placeholder components (T-6 special: AdrianInbox) ───────────────────────
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
