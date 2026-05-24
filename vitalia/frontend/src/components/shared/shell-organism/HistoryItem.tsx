"use client";

/**
 * HistoryItem — conversation history item atom
 * T-3 of vitalia-fase1-valeria-rail-history (F1-S5)
 *
 * Clickable row displaying title + meta with active state.
 * Active: bg-agent-valeria-soft + aria-current="true".
 * Hover: hover:bg-muted.
 *
 * "use client" required: onClick event handler.
 *
 * spec: 01-spec.md § 5 · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only.
 * HIPAA-lite: no-phi-scope — UI chrome only.
 *
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
 * HistoryItem — single conversation row atom.
 * Client Component (click handler).
 */
export function HistoryItem({
  id,
  title,
  meta,
  active,
  onClick,
}: HistoryItemProps) {
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
        active && "bg-agent-valeria-soft",
      )}
    >
      <p className="text-xs font-medium text-foreground truncate leading-tight">
        {title}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 truncate leading-tight">
        {meta}
      </p>
    </button>
  );
}
