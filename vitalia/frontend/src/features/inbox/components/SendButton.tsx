// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
"use client";

/**
 * SendButton.tsx — Send message CTA button for inbox composer.
 *
 * Dynamic label:
 *   - handler_mode="ai" → "Enviar como Adrián ➤"
 *   - handler_mode="human" → "Enviar"
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

import { cn } from "@/lib/cn";
import { INBOX_COPY } from "../copy";

export interface SendButtonProps {
  handlerMode: "ai" | "human";
  onClick: () => void;
  disabled?: boolean;
  isPending?: boolean;
  className?: string;
}

/**
 * SendButton — dynamic label CTA for sending a message.
 */
export function SendButton({
  handlerMode,
  onClick,
  disabled,
  isPending,
  className,
}: SendButtonProps) {
  const label =
    handlerMode === "ai"
      ? INBOX_COPY.composer.sendButtonAi
      : INBOX_COPY.composer.sendButtonHuman;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isPending}
      aria-label={label}
      aria-busy={isPending}
      className={cn(
        "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold",
        "text-white transition-opacity duration-150",
        handlerMode === "ai" ? "vt-bg-gradient-agent" : "vt-bg-azul-marino",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {isPending ? (
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
        />
      ) : (
        <>
          {label}
          {handlerMode === "ai" && <span aria-hidden="true"> ➤</span>}
        </>
      )}
    </button>
  );
}
