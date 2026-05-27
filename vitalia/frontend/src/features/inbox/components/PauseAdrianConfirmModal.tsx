"use client";

/**
 * PauseAdrianConfirmModal.tsx — Confirmation dialog for pausing Adrián 60 minutes.
 *
 * Opened by PauseAdrianButton when Adrián is active.
 * Accepts an optional reason (stored in audit_log server-side per HIPAA-lite).
 *
 * Pattern: controlled Dialog (Shadcn-like but built with native dialog semantics).
 * Reason field: textarea (freeform, optional).
 * Confirm CTA triggers usePauseAdrian mutation.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { useState } from "react";
import { cn } from "@/lib/cn";
import { INBOX_COPY } from "../copy";

interface PauseAdrianConfirmModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the user confirms the pause */
  onConfirm: (reason: string | null) => void;
  /** Called when the user cancels */
  onClose: () => void;
  /** Whether the pause mutation is in-flight */
  isPending?: boolean;
}

/**
 * PauseAdrianConfirmModal — accessible dialog for pausing Adrián.
 * Uses native <dialog> semantics for accessibility (role="dialog" + aria-modal).
 */
export function PauseAdrianConfirmModal({
  open,
  onConfirm,
  onClose,
  isPending = false,
}: PauseAdrianConfirmModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !isPending) onClose();
  };

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
        aria-describedby="pause-modal-body"
        data-testid="pause-adrian-modal"
        className={cn(
          "relative z-10 w-full max-w-sm rounded-xl border vt-border",
          "vt-bg-surface p-6 shadow-lg",
        )}
      >
        <h2
          id="pause-modal-title"
          className="text-base font-semibold vt-text-foreground mb-2"
        >
          {INBOX_COPY.pauseAgent.modalTitle}
        </h2>

        <p id="pause-modal-body" className="text-sm vt-text-muted mb-4">
          {INBOX_COPY.pauseAgent.modalBody}
        </p>

        {/* Reason field (optional — for audit trail) */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={INBOX_COPY.pauseAgent.reasonPlaceholder}
          disabled={isPending}
          rows={2}
          className={cn(
            "w-full resize-none rounded-lg border vt-border px-3 py-2",
            "text-sm vt-text-foreground vt-bg-surface",
            "placeholder:vt-text-muted",
            "focus-visible:outline focus-visible:outline-2",
            "focus-visible:outline-[var(--vitalia-cian)]",
            "disabled:opacity-50 mb-4",
          )}
          aria-label={INBOX_COPY.pauseAgent.reasonPlaceholder}
          data-testid="pause-reason-input"
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "vt-text-muted vt-bg-muted/40 hover:vt-bg-muted/60",
              "transition-colors disabled:opacity-50",
            )}
            data-testid="pause-modal-cancel"
          >
            {INBOX_COPY.pauseAgent.cancelCta}
          </button>

          <button
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "text-white bg-[var(--vitalia-purpura)] hover:opacity-90",
              "transition-opacity disabled:opacity-50",
            )}
            data-testid="pause-modal-confirm"
            aria-busy={isPending}
          >
            {isPending ? "Pausando…" : INBOX_COPY.pauseAgent.confirmCta}
          </button>
        </div>
      </div>
    </div>
  );
}
