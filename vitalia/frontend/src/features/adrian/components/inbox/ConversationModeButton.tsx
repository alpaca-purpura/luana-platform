// cap: adrian.inbox
// story-origin: vitalia-fase2-adrian-inbox
/**
 * ConversationModeButton.tsx — T-5 NEW.
 *
 * "Modo conversación" full-canvas toggle (⛶).
 * On click: collapses Valeria → inbox gets 100% width.
 * Remembers prior valeriaState (rail | full) in inbox-store.
 * On re-click: restores prior valeriaState.
 *
 * per 03-arch-fe.md § 6 + RN-11/RN-12:
 *   - uses useShellStore (REUSE, DO NOT modify)
 *   - uses useInboxStore.priorValeriaState (T-4 EXTEND)
 *   - calls setValeriaState('collapsed') on activate
 *   - calls setValeriaState(priorValeriaState ?? 'rail') on deactivate
 *
 * aria-pressed conveys toggle state (WCAG 2.1 AA).
 *
 * "use client" required: reads store + calls store actions.
 *
 * Spanish neutro LatAm — no voseo.
 * No hardcoded hex colors — tokens only.
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */

"use client";

import { useCallback } from "react";
import { useShellStore } from "@/stores/shell-store";
import { useInboxStore } from "../../store/inbox-store";
import { cn } from "@/lib/cn";

// ── Props ────────────────────────────────────────────────────────────────────

interface ConversationModeButtonProps {
  className?: string;
}

// ── ConversationModeButton ───────────────────────────────────────────────────

/**
 * Toggle button that collapses Valeria sidebar to give the inbox full width.
 * Label: "Modo conversación"
 * Tooltip: "Ocultar a Valeria para ganar espacio"
 * Placement: ThreadHeader row 1 action buttons area.
 */
export function ConversationModeButton({
  className,
}: ConversationModeButtonProps) {
  // T-1 (vitalia-shell-core-hardening) minimal compile fixup — NO re-layout.
  // The legacy 3-state valeriaState (collapsed|rail|full) was replaced by the new
  // machine valeriaOpen (closed|chat). "Conversation mode" = Valeria closed so the
  // inbox takes full width. Map: collapsed → closed; restore → chat (openValeria).
  // The inbox-store priorValeriaState slot stays untouched (its own type); we simply
  // stop feeding it shell-legacy values. Full UX rework lands in T-2/T-3.
  const valeriaOpen = useShellStore((s) => s.valeriaOpen);
  const openValeria = useShellStore((s) => s.openValeria);
  const collapseValeria = useShellStore((s) => s.collapseValeria);
  const setPriorValeriaState = useInboxStore((s) => s.setPriorValeriaState);

  const isConversationMode = valeriaOpen === "closed";

  const handleToggle = useCallback(() => {
    if (isConversationMode) {
      // Restore: reopen Valeria in chat (RN-5 — history never auto-restored)
      openValeria();
      setPriorValeriaState(null);
    } else {
      // Collapse Valeria → inbox full width
      collapseValeria();
    }
  }, [isConversationMode, openValeria, collapseValeria, setPriorValeriaState]);

  return (
    <button
      type="button"
      role="button"
      aria-pressed={isConversationMode}
      aria-label={
        isConversationMode
          ? "Salir del modo conversación"
          : "Ocultar a Valeria para ganar espacio"
      }
      title={
        isConversationMode
          ? "Salir del modo conversación"
          : "Ocultar a Valeria para ganar espacio"
      }
      data-testid="conversation-mode-button"
      onClick={handleToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
        "text-xs font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--agent-adrian)]",
        isConversationMode
          ? "vt-bg-primary/12 vt-text-primary ring-1 ring-[var(--agent-adrian)]/30"
          : "vt-bg-surface vt-text-muted hover:vt-bg-muted",
        className,
      )}
    >
      {/* Icon: expand/collapse glyphs */}
      <span aria-hidden="true" className="text-sm leading-none">
        {isConversationMode ? "⛶" : "⛶"}
      </span>
      <span>Modo conversación</span>
    </button>
  );
}
