// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s5-TBD
/**
 * HistoryGroup — conversation group molecule (Hoy / Ayer / Esta semana)
 * T-3 of vitalia-fase1-valeria-rail-history (F1-S5)
 *
 * Server Component — no interactivity, group is purely presentational.
 * If items.length === 0 → renders nothing (group label hidden per SC-6 spec).
 * Renders: section with group label (10px uppercase muted) + HistoryItem list.
 *
 * spec: 01-spec.md § 0 SC-6 + § 5 · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import type { MockConversation } from "./_mock-conversations";
import { HistoryItem } from "./HistoryItem";

export interface HistoryGroupProps {
  /** Group label: 'Hoy' | 'Ayer' | 'Esta semana' */
  label: string;
  items: MockConversation[];
  activeId: string | null;
  onItemClick: (id: string) => void;
}

/**
 * HistoryGroup — groups conversation history items by time period.
 * Server Component (no state, no effects — receives props from Client parent).
 * Hidden when items.length === 0 (per SC-6 spec: groups with 0 items not rendered).
 */
export function HistoryGroup({
  label,
  items,
  activeId,
  onItemClick,
}: HistoryGroupProps) {
  // Per spec SC-6: if 0 items in group → render nothing
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
