/**
 * InboxPageClient.tsx — "use client" wrapper for /inbox route.
 *
 * Wraps the inbox feature with nuqs NuqsAdapter (required for useQueryStates).
 * Owns no data fetching — all async state lives in child Client Components
 * via React Query (T-inbox-fe-2).
 *
 * Scaffold state (T-inbox-fe-1): renders InboxLayout shell with placeholder slots.
 * Full assembly (panels + hooks) added in T-inbox-fe-3..6.
 *
 * "use client" required for:
 *   - NuqsAdapter (Next.js App Router adapter for nuqs)
 *   - useInboxStore (Zustand UI state)
 *   - useInboxUrlState (nuqs URL state hook)
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */
"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { useInboxStore } from "../store/inbox-store";
import { InboxLayout } from "./InboxLayout";
import { INBOX_COPY } from "../copy";

/**
 * InboxPageClient — Client entry point for /inbox.
 * Renders within RSC page.tsx (Server Component wrapper).
 *
 * Scaffold (T-inbox-fe-1): placeholder slots for all 3 panes.
 * Real panels injected by T-inbox-fe-3 (list) + T-inbox-fe-4 (thread) + T-inbox-fe-5 (sidebar).
 */
export function InboxPageClient() {
  const contactSidebarOpen = useInboxStore((s) => s.contactSidebarOpen);

  return (
    <NuqsAdapter>
      <InboxLayout
        contactSidebarOpen={contactSidebarOpen}
        conversationListSlot={
          <ConversationListPlaceholder />
        }
        threadSlot={
          <ThreadPlaceholder />
        }
        contactSidebarSlot={
          <ContactSidebarPlaceholder />
        }
      />
    </NuqsAdapter>
  );
}

/** Scaffold placeholder — replaced by ConversationListPanel in T-inbox-fe-3 */
function ConversationListPlaceholder() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center"
      aria-label={INBOX_COPY.empty.noConversations.heading}
      data-testid="conversation-list-placeholder"
    >
      <p className="text-sm font-medium vt-text-foreground">
        {INBOX_COPY.empty.noConversations.heading}
      </p>
      <p className="text-xs vt-text-muted">
        {INBOX_COPY.empty.noConversations.body}
      </p>
    </div>
  );
}

/** Scaffold placeholder — replaced by ConversationThread in T-inbox-fe-4 */
function ThreadPlaceholder() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"
      data-testid="thread-placeholder"
      aria-label="Selecciona una conversación para comenzar"
    >
      <p className="text-sm vt-text-muted">
        Selecciona una conversación de la lista para comenzar.
      </p>
    </div>
  );
}

/** Scaffold placeholder — replaced by ContactSidebar in T-inbox-fe-5 */
function ContactSidebarPlaceholder() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center p-4"
      aria-label={INBOX_COPY.contactSidebar.ariaLabel}
      data-testid="contact-sidebar-placeholder"
    >
      <p className="text-xs vt-text-muted">
        {INBOX_COPY.contactSidebar.sectionContact}
      </p>
    </div>
  );
}
