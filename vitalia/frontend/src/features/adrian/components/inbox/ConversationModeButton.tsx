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
  const valeriaState = useShellStore((s) => s.valeriaState);
  const setValeriaState = useShellStore((s) => s.setValeriaState);
  const priorValeriaState = useInboxStore((s) => s.priorValeriaState);
  const setPriorValeriaState = useInboxStore((s) => s.setPriorValeriaState);

  const isConversationMode = valeriaState === "collapsed";

  const handleToggle = useCallback(() => {
    if (isConversationMode) {
      // Restore prior state (rail → full fallback)
      setValeriaState(priorValeriaState ?? "rail");
      setPriorValeriaState(null);
    } else {
      // Save current state before collapsing
      setPriorValeriaState(valeriaState);
      setValeriaState("collapsed");
    }
  }, [isConversationMode, valeriaState, priorValeriaState, setValeriaState, setPriorValeriaState]);

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
