// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * ProposalBanner.tsx — "Abel propone este borrador" banner (RN-3 draft-first ratify).
 *
 * Shown when an ICP has status=borrador AND origin=draft (Abel proposed it).
 * Presents two actions to the owner:
 *
 *   Ratificar: confirms the draft is good (marks ICP as listo after user review)
 *   Descartar: discards the draft (deletes the ICP or resets to manual)
 *
 * RN-3 doctrine: Abel propone, el dueño ratifica.
 * This banner IS the ratification gate — Abel never auto-promotes to listo.
 *
 * Visual: distinct top-of-content banner (agent-abel purple tinted) with clear actions.
 * Non-blocking: user can still edit the form while the banner is visible.
 *
 * Accessibility:
 *   - role="status" with aria-label (screen reader announces the proposal)
 *   - aria-busy on action buttons while loading
 *   - Focus visible on both buttons
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §7 Estados visuales → borrador-propuesto
 * validators_gate: RN-3 (propone/ratifica) + SC-happy (draft lifecycle)
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProposalBannerProps {
  /** Agent name that generated the proposal (default: "Abel") */
  agentName?: string;
  /** Called when user clicks "Ratificar" (accept the draft) */
  onRatificar: () => void;
  /** Called when user clicks "Descartar" (reject the draft) */
  onDescartar: () => void;
  /** Whether ratificar action is in progress */
  isRatificando?: boolean;
  /** Whether descartar action is in progress */
  isDescartando?: boolean;
  /** Additional className for the banner wrapper */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ProposalBanner — draft ratification gate for Abel proposals.
 *
 * Shown above the ICP form when origin=draft. Requires explicit owner action
 * (RN-3: Abel proposes, owner ratifies — never auto-promote).
 *
 * Non-blocking: allows form editing while banner is shown.
 */
export function ProposalBanner({
  agentName = "Abel",
  onRatificar,
  onDescartar,
  isRatificando = false,
  isDescartando = false,
  className,
}: ProposalBannerProps) {
  const isLoading = isRatificando || isDescartando;

  return (
    <div
      role="status"
      aria-label={`${agentName} propone este borrador. Revisa y ratifica o descarta.`}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5",
        "border-b border-agent-abel/30 bg-agent-abel/5",
        "text-sm",
        className,
      )}
      data-testid="proposal-banner"
    >
      {/* Agent attribution */}
      <span
        className={cn("flex items-center gap-1.5 font-medium text-agent-abel flex-shrink-0")}
        aria-hidden="true"
      >
        <span className="text-base">✨</span>
        {agentName} propuso este borrador
      </span>

      <span className="text-muted-foreground/60 flex-shrink-0" aria-hidden="true">
        —
      </span>

      {/* Explanation */}
      <span className="text-muted-foreground text-xs flex-1 min-w-0 truncate">
        Revisa los datos y confirma cuando estés listo.
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDescartar}
          disabled={isLoading}
          aria-busy={isDescartando}
          data-testid="proposal-banner-descartar"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2.5 text-xs"
        >
          Descartar
        </Button>
        <Button
          size="sm"
          onClick={onRatificar}
          disabled={isLoading}
          aria-busy={isRatificando}
          data-testid="proposal-banner-ratificar"
          className="bg-agent-abel hover:bg-agent-abel/90 text-white h-7 px-3 text-xs"
        >
          {isRatificando ? "Guardando…" : "Ratificar"}
        </Button>
      </div>
    </div>
  );
}
