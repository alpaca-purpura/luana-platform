// cap: sales_agent.inbox-handler-mode-occ
// story-origin: vitalia-fase1-s10-TBD
/**
 * MessageBubble — molécula burbuja de mensaje inbox.
 * F1-S10 vitalia-fase1-empty-states — T-5
 *
 * Variants:
 *   direction='in'  → bg-agent-adrian-soft, rounded-bl-sm, left-aligned
 *   direction='out' → bg-agent-lisa-soft, rounded-br-sm, right-aligned + ml-auto
 *
 * Footer meta: timestamp + (if out) "· {sender}" right-aligned.
 *
 * Mockup parity: adrian-inbox-placeholder.html .msg-bubble styles
 *
 * Server Component — pure presentational, no state.
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — Tailwind semantic tokens only.
 *
 * spec_anchor: 03-arch.md § 3.3 + 06-tickets.yaml T-5
 * downstream-regression-na: brand-local vitalia inbox; no cross-brand consumers
 */

import { cn } from "@/lib/utils";

export interface MessageBubbleProps {
  /** 'in' = incoming (patient), 'out' = outgoing (bot or agent) */
  direction: "in" | "out";
  /** Message text content */
  text: string;
  /** Display timestamp — e.g. "12:34" */
  timestamp: string;
  /** Sender label shown on outgoing messages — e.g. "Adrián" or undefined */
  sender?: string;
  className?: string;
}

/**
 * MessageBubble — single message in the thread.
 * Server Component.
 */
export function MessageBubble({
  direction,
  text,
  timestamp,
  sender,
  className,
}: MessageBubbleProps) {
  const isOut = direction === "out";

  return (
    <div
      className={cn(
        "flex flex-col",
        isOut ? "items-end" : "items-start",
        className,
      )}
    >
      {/* Bubble */}
      <div
        className={cn(
          "max-w-[70%] rounded-[10px] px-3 py-2 text-[13px] text-foreground",
          isOut
            ? "rounded-br-[2px] bg-agent-lisa-soft"
            : "rounded-bl-[2px] bg-agent-adrian-soft",
        )}
      >
        {text}
      </div>

      {/* Footer meta */}
      <div
        className={cn(
          "mt-0.5 text-[10px] text-muted-foreground",
          isOut && "text-right",
        )}
      >
        {timestamp}
        {isOut && sender && <span> · {sender}</span>}
      </div>
    </div>
  );
}
