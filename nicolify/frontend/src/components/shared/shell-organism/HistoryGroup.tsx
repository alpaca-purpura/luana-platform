// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
/**
 * HistoryGroup — conversation group molecule (Hoy / Ayer / Esta semana)
 *
 * Port verbatim from vitalia/HistoryGroup.tsx. No brand-specific changes needed.
 * Server Component — purely presentational.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { HistoryItem } from "./HistoryItem";

import type { MockConversation } from "./_mock-conversations";

export interface HistoryGroupProps {
  label: string;
  items: MockConversation[];
  activeId: string | null;
  onItemClick: (id: string) => void;
}

/**
 *
 */
export function HistoryGroup({ label, items, activeId, onItemClick }: HistoryGroupProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label={label}>
      <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul role="listbox" aria-label={label} className="flex flex-col gap-0.5">
        {items.map((conversation) => (
          <li key={conversation.id} role="presentation">
            <HistoryItem
              id={conversation.id}
              title={conversation.title}
              meta={conversation.meta}
              active={activeId === conversation.id}
              onClick={onItemClick}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
