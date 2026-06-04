// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * DraftFirstStarter.tsx — Draft-first empty-state 2-path starter for Abel.
 *
 * Rendered when the ICP list is empty (arranque state — SC-empty).
 * Presents two mutually exclusive paths (RN-2 draft-first doctrine):
 *
 *   Path A: "Abel lo arma" → triggers UniversalIntake overlay
 *   Path B: "Lo armo yo"  → navigates directly to the empty ICP form (manual start)
 *
 * The primary CTA is always Path A (draft-first = Abel generates the seed).
 * Path B is secondary (escape hatch for power users).
 *
 * No EntitySubNavBar in this state — list empty, no entity selected.
 *
 * Accessibility:
 *   - Main region with descriptive label
 *   - Two clearly labeled CTAs with distinct styles (primary + outline)
 *   - Focus trap NOT needed (not a modal)
 *
 * Spanish neutro LatAm (tuteo, sin voseo):
 *   - "Abel te arma un borrador" (no voseo imperativo)
 *   - "Empezar en blanco" (neutro LatAm, sin voseo imperativo)
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §7 Estados visuales → arranque
 * validators_gate: RN-2 (draft-first) + SC-empty
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DraftFirstStarterProps {
  /** Called when user chooses "Abel lo arma" (opens UniversalIntake) */
  onGenerateDraft: () => void;
  /** Called when user chooses "Lo armo yo" (starts blank form) */
  onStartBlank: () => void;
  /** Agent name for copy (default: "Abel") */
  agentName?: string;
  /** Additional className for the container */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DraftFirstStarter — 2-path empty state for Abel ICP creation.
 *
 * Path A: agent generates draft from a seed (draft-first doctrine).
 * Path B: manual blank form (escape hatch).
 */
export function DraftFirstStarter({
  onGenerateDraft,
  onStartBlank,
  agentName = "Abel",
  className,
}: DraftFirstStarterProps) {
  return (
    <main
      className={cn(
        "flex flex-col items-center justify-center gap-8",
        "flex-1 min-h-0 p-8 text-center",
        className,
      )}
      aria-label="Crear primer perfil de cliente ideal"
      data-testid="draft-first-starter"
    >
      {/* Illustration area */}
      <div className="flex flex-col items-center gap-3" aria-hidden="true">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center",
            "bg-agent-abel/10 text-agent-abel text-3xl",
          )}
        >
          🎯
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2 max-w-sm">
        <h2 className="text-lg font-semibold text-foreground">Define tu cliente ideal</h2>
        <p className="text-sm text-muted-foreground">
          Un Perfil de Cliente Ideal (ICP) describe exactamente qué tipo de empresa o persona es tu
          cliente más valioso. {agentName} puede armar uno desde una URL, archivo o texto.
        </p>
      </div>

      {/* 2-path CTAs */}
      <div className="flex flex-col gap-3 w-full max-w-xs" data-testid="draft-first-paths">
        {/* Path A: primary — draft-first */}
        <Button
          className="w-full gap-2"
          onClick={onGenerateDraft}
          data-testid="draft-first-generate-btn"
        >
          <span aria-hidden="true">✨</span>
          {agentName} te arma un borrador
        </Button>

        {/* Path B: secondary — blank form */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onStartBlank}
          data-testid="draft-first-blank-btn"
        >
          <span aria-hidden="true">📝</span>
          Empezar en blanco
        </Button>
      </div>

      {/* Microcopy */}
      <p className="text-xs text-muted-foreground/70 max-w-xs">
        Puedes tener múltiples perfiles (por segmento de mercado o tipo de cliente).
      </p>
    </main>
  );
}
