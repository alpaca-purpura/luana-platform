/**
 * ValeriaChatSlot — chat area placeholder (F1-S5, replaced by real chat in F1-S6)
 * T-3 of vitalia-fase1-valeria-rail-history (F1-S5)
 *
 * Renders ChatHeader real (avatar V + "Valeria" + "En línea" status dot)
 * + 4 alternating skeleton bubbles + skeleton composer + floating label "CHATSLOT · F1-S6".
 *
 * Server Component (no state, no event handlers, no browser APIs).
 * F1-S6 replaces body + composer but PRESERVES this ChatHeader intact.
 *
 * spec: 01-spec.md § 0 D6 + § 5 · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — semantic tokens only.
 * HIPAA-lite: no-phi-scope — UI placeholder chrome only.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { cn } from "@/lib/utils";

/**
 * ValeriaChatSlot — placeholder chat panel for F1-S5.
 * Server Component. Replaced in F1-S6 with real chat implementation.
 */
export function ValeriaChatSlot({ className }: { className?: string }) {
  return (
    <section
      role="region"
      aria-label="Chat con Valeria (próximamente)"
      data-testid="valeria-chat-slot"
      className={cn(
        "relative flex flex-1 min-w-0 flex-col overflow-hidden bg-background",
        className,
      )}
    >
      {/* ChatHeader real — PRESERVED by F1-S6 */}
      <div className="flex items-center gap-3 border-b border-border px-4 h-14 shrink-0">
        {/* Avatar: 9×9 rounded-full bg-agent-valeria + "V" white text */}
        <div className="relative shrink-0">
          <div
            data-testid="valeria-avatar"
            className="h-9 w-9 rounded-full bg-agent-valeria flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-sm font-semibold text-white select-none">
              V
            </span>
          </div>
          {/* Status dot — green online indicator with card border ring */}
          <span
            data-testid="valeria-status-dot"
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-vitalia-success ring-2 ring-card"
            aria-hidden="true"
          />
        </div>

        {/* Name + status */}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground leading-tight truncate">
            Valeria
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            • En línea
          </span>
        </div>
      </div>

      {/* Skeleton chat bubbles (4, alternated) */}
      <div className="flex flex-1 min-h-0 flex-col gap-3 p-4 overflow-hidden">
        {/* Bubble 0 — self-start (received) */}
        <div
          data-testid="skeleton-bubble"
          className="self-start h-11 w-[62%] rounded-lg bg-muted animate-pulse"
          aria-hidden="true"
        />
        {/* Bubble 1 — self-end (sent) */}
        <div
          data-testid="skeleton-bubble"
          className="self-end h-9 w-[48%] rounded-lg bg-agent-valeria-soft animate-pulse"
          aria-hidden="true"
        />
        {/* Bubble 2 — self-start (received) */}
        <div
          data-testid="skeleton-bubble"
          className="self-start h-14 w-[70%] rounded-lg bg-muted animate-pulse"
          aria-hidden="true"
        />
        {/* Bubble 3 — self-end (sent) */}
        <div
          data-testid="skeleton-bubble"
          className="self-end h-10 w-[40%] rounded-lg bg-agent-valeria-soft animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Skeleton composer */}
      <div className="border-t border-border p-3 shrink-0">
        <div
          id="valeria-composer-placeholder"
          tabIndex={0}
          className="h-11 w-full rounded-md bg-muted cursor-text"
          aria-label="Compositor de mensajes (próximamente)"
          role="textbox"
          aria-multiline="false"
          aria-readonly="true"
        />
      </div>

      {/* Floating label — identifies placeholder */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 whitespace-nowrap rounded-md border border-dashed border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none"
        aria-hidden="true"
      >
        CHATSLOT · F1-S6
      </span>
    </section>
  );
}
