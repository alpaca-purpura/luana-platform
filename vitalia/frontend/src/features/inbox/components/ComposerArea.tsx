"use client";

/**
 * ComposerArea.tsx — Composer panel assembling all input sub-components.
 *
 * Assembles:
 *   - MessageInput (textarea)
 *   - ComposerAttachButton (📎)
 *   - ComposerVoiceButton (🎤 MediaRecorder)
 *   - SendButton (dynamic Adrián / Yo label)
 *
 * Shows ProposalCardBanner above when agent-waiting-approval state (Adrián consulta
 * + has a pending proposed message).
 *
 * Disabled entirely when handler_mode state = "agent-thinking".
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { MessageInput } from "./MessageInput";
import { ComposerAttachButton } from "./ComposerAttachButton";
import { ComposerVoiceButton } from "./ComposerVoiceButton";
import { SendButton } from "./SendButton";
import { ProposalCardBanner } from "./ProposalCardBanner";
import { useSendMessage } from "../api/use-send-message";
import { useInboxStore } from "../store/inbox-store";
import type { Conversation } from "@/features/crm-shared";
import type { VoiceReadyResult } from "./ComposerVoiceButton";

function randomIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface ComposerAreaProps {
  conversation: Conversation;
  /** Patient first name for placeholder personalisation */
  patientName?: string | null;
  /**
   * When set, ComposerArea shows ProposalCardBanner above.
   * Set to the text Adrián is proposing to send.
   */
  pendingProposalText?: string | null;
  className?: string;
}

/**
 * ComposerArea — full message input + attach + voice + send assembler.
 */
export function ComposerArea({
  conversation,
  patientName,
  pendingProposalText,
  className,
}: ComposerAreaProps) {
  const [text, setText] = useState("");
  const [voiceReady, setVoiceReady] = useState<VoiceReadyResult | null>(null);
  const sendMessage = useSendMessage();
  const clearAttachQueue = useInboxStore((s) => s.clearAttachQueue);
  const attachQueue = useInboxStore((s) => s.attachQueue);

  const { handler_mode, id: conversationId } = conversation;
  const isAgentThinking =
    conversation.status === "active" && handler_mode === "ai";

  const canSend =
    (text.trim().length > 0 || voiceReady !== null || attachQueue.length > 0) &&
    !sendMessage.isPending;

  const handleSend = useCallback(() => {
    if (!canSend) return;

    if (voiceReady) {
      sendMessage.mutate(
        {
          conversationId,
          bodyText: voiceReady.transcriptionText,
          mediaUrl: voiceReady.mediaUrl,
          mediaKind: "audio",
          mediaDurationS: voiceReady.durationS,
          idempotencyKey: randomIdempotencyKey(),
        },
        {
          onSuccess: () => {
            setVoiceReady(null);
            setText("");
            clearAttachQueue();
          },
        },
      );
    } else if (text.trim()) {
      sendMessage.mutate(
        {
          conversationId,
          bodyText: text.trim(),
          idempotencyKey: randomIdempotencyKey(),
        },
        {
          onSuccess: () => {
            setText("");
            clearAttachQueue();
          },
        },
      );
    }
  }, [
    canSend,
    voiceReady,
    text,
    conversationId,
    sendMessage,
    clearAttachQueue,
  ]);

  const handleVoiceReady = useCallback((result: VoiceReadyResult) => {
    setVoiceReady(result);
    setText(result.transcriptionText);
  }, []);

  const handleApproveProposal = useCallback(() => {
    if (!pendingProposalText) return;
    sendMessage.mutate({
      conversationId,
      bodyText: pendingProposalText,
      idempotencyKey: randomIdempotencyKey(),
    });
  }, [pendingProposalText, conversationId, sendMessage]);

  const handleEditProposal = useCallback(() => {
    if (!pendingProposalText) return;
    setText(pendingProposalText);
  }, [pendingProposalText]);

  return (
    <div
      className={cn("flex flex-col gap-2 p-3 border-t vt-border", className)}
    >
      {/* Proposal banner for Adrián consulta state */}
      {pendingProposalText && (
        <ProposalCardBanner
          proposedText={pendingProposalText}
          onApprove={handleApproveProposal}
          onEdit={handleEditProposal}
          isApproving={sendMessage.isPending}
        />
      )}

      {/* Voice ready preview badge */}
      {voiceReady && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs",
            "vt-bg-cian-8 vt-text-cian border vt-border-cian",
          )}
        >
          <span aria-hidden="true">🎤</span>
          <span className="flex-1 truncate">
            {voiceReady.transcriptionText}
          </span>
          <button
            type="button"
            onClick={() => {
              setVoiceReady(null);
              setText("");
            }}
            className="vt-text-muted hover:vt-text-danger text-xs"
            aria-label="Quitar nota de voz"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main composer row */}
      <div className="flex items-end gap-2">
        <MessageInput
          value={text}
          onChange={setText}
          onSubmit={handleSend}
          handlerMode={handler_mode}
          patientName={patientName}
          disabled={isAgentThinking || sendMessage.isPending}
          className="flex-1"
        />

        <ComposerAttachButton
          conversationId={conversationId}
          disabled={isAgentThinking || sendMessage.isPending}
        />

        <ComposerVoiceButton
          conversationId={conversationId}
          onVoiceReady={handleVoiceReady}
          disabled={isAgentThinking || sendMessage.isPending}
        />

        <SendButton
          handlerMode={handler_mode}
          onClick={handleSend}
          disabled={!canSend}
          isPending={sendMessage.isPending}
        />
      </div>
    </div>
  );
}
