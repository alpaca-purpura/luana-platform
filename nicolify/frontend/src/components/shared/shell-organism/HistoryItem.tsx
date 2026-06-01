// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * HistoryItem — conversation history item atom.
 *
 * Port verbatim from vitalia/HistoryItem.tsx.
 * Re-themed: bg-agent-luana-soft (Luana=indigo, was valeria=purple).
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";

export interface HistoryItemProps {
  id: string;
  title: string;
  meta: string;
  active: boolean;
  onClick: (id: string) => void;
}

/**
 *
 */
export function HistoryItem({ id, title, meta, active, onClick }: HistoryItemProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      aria-current={active ? "true" : undefined}
      data-testid="history-item"
      onClick={() => onClick(id)}
      className={cn(
        "w-full text-left px-3 py-2 rounded-md transition-colors motion-reduce:transition-none",
        "hover:bg-muted",
        active && "bg-agent-luana-soft",
      )}
    >
      <p className="text-xs font-medium text-foreground truncate leading-tight">{title}</p>
      <p
        className={cn(
          "text-[10px] mt-0.5 truncate leading-tight",
          active ? "text-foreground/80" : "text-muted-foreground",
        )}
      >
        {meta}
      </p>
    </button>
  );
}
