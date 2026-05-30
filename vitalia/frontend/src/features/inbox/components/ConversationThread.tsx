// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
"use client";

/**
 * ConversationThread.tsx — Main thread panel for a single conversation.
 *
 * Fork adapter from nicolify/closer-studio/components/inbox/ConversationThread.tsx.
 * Retokenization: violet-* → vt-purpura-* · amber-* → vt-surface-warning.
 * Header replaced by ThreadHeader (SegmentedControl3Modes + VoiceStyleChip + buttons).
 *
 * Renders:
 *   1. ThreadHeader — mode control + pause + tools + contact sidebar toggle
 *   2. Messages list — scrollable, auto-scrolls to bottom on new messages
 *   3. Empty/loading/error states
 *
 * Message bubbles (full MessageBubble component) deferred to T-inbox-fe-6.
 * This ticket: ThreadHeader assembly + scaffold message list.
 *
 * OCC conflict toast: shows inline error message via isConflict state.
 * Full toast implementation: T-inbox-fe-6.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useConversationDetail } from "@/features/crm-shared";
import { INBOX_COPY } from "../copy";
import { ThreadHeader } from "./ThreadHeader";

interface ConversationThreadProps {
  /** Conversation ID from URL state (?lead=...) */
  conversationId: string;
  className?: string;
}

/** Skeleton row for loading state */
function MessageSkeleton({ width }: { width: string }) {
  return (
    <div
      className={cn("h-10 animate-pulse rounded-xl vt-bg-muted", width)}
      aria-hidden="true"
    />
  );
}

/**
 * ConversationThread — full thread panel.
 * Client Component: owns scroll behavior + conversation detail query.
 */
export function ConversationThread({
  conversationId,
  className,
}: ConversationThreadProps) {
  const {
    data: detail,
    isLoading,
    isError,
  } = useConversationDetail(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [detail?.messages]);

  if (isLoading) {
    return (
      <div
        className={cn("flex flex-col h-full", className)}
        data-testid="conversation-thread"
        aria-busy="true"
      >
        {/* Loading header placeholder */}
        <div className="px-4 py-3 border-b vt-border shrink-0">
          <div className="h-8 w-48 animate-pulse rounded-lg vt-bg-muted mb-2" />
          <div className="h-8 w-64 animate-pulse rounded-lg vt-bg-muted" />
        </div>
        {/* Loading messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <MessageSkeleton width="w-3/4" />
          <MessageSkeleton width="w-1/2 ml-auto" />
          <MessageSkeleton width="w-2/3" />
          <MessageSkeleton width="w-1/3 ml-auto" />
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div
        className={cn(
          "flex flex-col h-full items-center justify-center gap-2 p-8 text-center",
          className,
        )}
        data-testid="conversation-thread-error"
        role="alert"
      >
        <p className="text-sm font-medium vt-text-foreground">
          {INBOX_COPY.errors.loadThread}
        </p>
        <p className="text-xs vt-text-muted">{INBOX_COPY.errors.retry}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col h-full min-h-0", className)}
      data-testid="conversation-thread"
    >
      {/* Thread header: mode control + pause + tools + contact sidebar toggle */}
      <ThreadHeader
        detail={detail}
        voiceConfigured={false}
        voiceStyleLabel={null}
      />

      {/* Messages list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
        aria-label="Mensajes de la conversación"
        data-testid="messages-list"
      >
        {detail.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm vt-text-muted">
              {INBOX_COPY.empty.noConversations.body}
            </p>
          </div>
        ) : (
          detail.messages.map((msg) => (
            <div
              key={msg.id}
              data-testid="message-bubble-scaffold"
              className={cn(
                "rounded-xl px-3 py-2 text-sm max-w-[80%]",
                msg.sender_type === "patient"
                  ? "vt-bg-muted vt-text-foreground self-start"
                  : "vt-bg-primary/12 vt-text-primary ml-auto",
              )}
            >
              {msg.body_text ?? "[media]"}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
