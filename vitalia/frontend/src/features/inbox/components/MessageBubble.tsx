"use client";

/**
 * MessageBubble.tsx — Renders a single message in the conversation thread.
 *
 * Fork adapter from nicolify/closer-studio/components/inbox/MessageBubble.tsx.
 * Retokenization: violet-* → vt-* CSS utility classes + vitalia CSS vars.
 * sender_type adapted: "patient" | "agent_ai" | "agent_human" | "system"
 *   (nicolify used "user" | "assistant" | "system" with different semantics).
 *
 * Renders:
 *   - "patient" → right-aligned dark bubble (patient message)
 *   - "agent_ai" → left-aligned with gradient_adrian avatar + "✨ auto" chip
 *                  + ActionReceiptUndoChip if within 5-minute window
 *   - "agent_human" → left-aligned human avatar (no undo chip)
 *   - "system" → centered pill (info/event notification)
 *
 * XSS safety (SC-04): React default escaping — NO dangerouslySetInnerHTML.
 * All text content rendered via JSX `{}` interpolation (React escapes HTML entities).
 *
 * Media rendering:
 *   - media_kind="audio" → VoiceMessagePlayer
 *   - media_kind="image" → ImageAnalysisCard
 *   - media_kind="video"|"document"|"sticker" → stub label (Slice 2)
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { cn } from "@/lib/cn";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { ImageAnalysisCard } from "./ImageAnalysisCard";
import { ActionReceiptUndoChip } from "./ActionReceiptUndoChip";
import { INBOX_COPY } from "../copy";
import type { Message } from "../types/message";

export interface MessageBubbleProps {
  message: Message;
  /** ISO 8601 updated_at from the parent conversation (used for OCC if-match) */
  conversationUpdatedAt: string;
  /** Patient first name (for system message context) */
  patientName?: string | null;
  className?: string;
}

// ─── Avatar sub-components ────────────────────────────────────────────────────

function AdrianAvatar() {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-7 h-7 rounded-full",
        "vitalia-agent-gradient-adrian",
        "flex items-center justify-center",
        "text-white text-[10px] font-bold select-none"
      )}
      aria-label="Adrián"
    >
      A
    </div>
  );
}

function HumanAvatar() {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-7 h-7 rounded-full",
        "vt-bg-azul-marino",
        "flex items-center justify-center",
        "text-white text-[10px] font-bold select-none"
      )}
      aria-label="Agente humano"
    >
      H
    </div>
  );
}

// ─── Media content renderer ───────────────────────────────────────────────────

function MessageContent({ message }: { message: Message }) {
  // Audio message
  if (message.media_kind === "audio" && message.media_url) {
    return (
      <VoiceMessagePlayer
        mediaUrl={message.media_url}
        durationS={message.media_duration_s}
        transcriptionText={message.transcription_text}
        transcriptionConfidence={message.transcription_confidence}
      />
    );
  }

  // Image message
  if (message.media_kind === "image" && message.media_url) {
    return <ImageAnalysisCard mediaUrl={message.media_url} />;
  }

  // Video / document / sticker (Slice 2 stubs)
  if (message.media_kind === "video") {
    return (
      <span className="text-xs vt-text-muted italic">
        {INBOX_COPY.multimedia.documentLabel}
      </span>
    );
  }
  if (message.media_kind === "document") {
    return (
      <span className="text-xs vt-text-muted italic">
        {INBOX_COPY.multimedia.documentLabel}
      </span>
    );
  }
  if (message.media_kind === "sticker") {
    return (
      <span className="text-xs vt-text-muted italic">
        {INBOX_COPY.multimedia.stickerLabel}
      </span>
    );
  }

  // Text message — React escapes body_text by default (SC-04: no dangerouslySetInnerHTML)
  if (message.body_text) {
    return (
      // NOTE (SC-04): {message.body_text} is React JSX interpolation — React automatically
      // escapes HTML entities. <script>alert('xss')</script> renders as literal text.
      <span className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {message.body_text}
      </span>
    );
  }

  return null;
}

// ─── System message ───────────────────────────────────────────────────────────

function SystemMessage({ message }: { message: Message }) {
  return (
    <div
      className="flex justify-center my-1"
      role="status"
      aria-live="polite"
      data-testid="message-bubble-system"
    >
      <span
        className={cn(
          "text-xs vt-text-muted px-3 py-1 rounded-full",
          "vt-bg-muted border vt-border-soft"
        )}
      >
        {/* SC-04: React escapes body_text — no dangerouslySetInnerHTML */}
        {message.body_text}
      </span>
    </div>
  );
}

// ─── Main MessageBubble ───────────────────────────────────────────────────────

/**
 * MessageBubble — renders one message with correct layout per sender_type.
 */
export function MessageBubble({
  message,
  conversationUpdatedAt,
  className,
}: MessageBubbleProps) {
  const { sender_type, retracted_at, action_receipt_expires_at, conversation_id } = message;

  // System messages get special centered pill layout
  if (sender_type === "system") {
    return <SystemMessage message={message} />;
  }

  const isPatient = sender_type === "patient";
  const isAI = sender_type === "agent_ai";
  // isHuman = sender_type === "agent_human" (implicit)

  const isRetracted = retracted_at !== null;

  // Determine if ActionReceiptUndoChip should be shown
  const showUndoChip = isAI && action_receipt_expires_at !== null && !isRetracted;

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%]",
        isPatient ? "ml-auto flex-row-reverse" : "mr-auto flex-row",
        className
      )}
      data-testid="message-bubble"
      data-sender={sender_type}
    >
      {/* Avatar for agent messages */}
      {isAI && <AdrianAvatar />}
      {sender_type === "agent_human" && <HumanAvatar />}

      {/* Bubble body */}
      <div className="flex flex-col gap-1 min-w-0">
        {/* Agent type chip (AI only) */}
        {isAI && !isRetracted && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                "vt-bg-gradient-agent text-white"
              )}
              aria-label="Adrián responde automáticamente"
            >
              ✨ auto
            </span>
          </div>
        )}

        {/* Message content bubble */}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            // Patient: right-aligned, azul marino
            isPatient && !isRetracted && "vt-bg-azul-marino text-white",
            // AI: light cian bg
            isAI && !isRetracted && "vt-bg-cian-8 vt-text border vt-border-soft",
            // Human agent: surface bg
            sender_type === "agent_human" && !isRetracted && "vt-bg-surface vt-text border vt-border",
            // Retracted: muted strikethrough
            isRetracted && "vt-bg-muted vt-text-muted border vt-border-soft line-through opacity-60",
            // Patient side rounding
            isPatient && "rounded-tr-sm",
            // Agent side rounding
            !isPatient && "rounded-tl-sm"
          )}
        >
          {isRetracted ? (
            <span className="text-xs italic" aria-label="Mensaje revertido">
              [Mensaje revertido]
            </span>
          ) : (
            <MessageContent message={message} />
          )}
        </div>

        {/* ActionReceiptUndoChip — only for AI messages within 5-min window */}
        {showUndoChip && (
          <div className="flex justify-start">
            <ActionReceiptUndoChip
              messageId={message.id}
              conversationId={conversation_id}
              expiresAt={action_receipt_expires_at!}
              conversationUpdatedAt={conversationUpdatedAt}
            />
          </div>
        )}
      </div>
    </div>
  );
}
