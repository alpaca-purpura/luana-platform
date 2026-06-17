// cap: comunify-shell-organism
/**
 * SubTabContent — dispatcher for Comunify shell-organism subtab content.
 * T-shell — all combos render EmptyState (R0 shell skeleton).
 *
 * Maps {agent}.{subtab} combos to content.
 * R0 shell: ALL combos → EmptyState (feature pages built in subsequent tickets).
 *
 * Server Component (no "use client" needed for R0 skeleton).
 * Named export (NO default) per FSD-Lite enforce.
 *
 * spec_anchor: 06-tickets.yaml T-shell · navigation-tree.md v2
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { AGENT_SUBTABS } from "@/lib/routing/shell-routes";
import type { RibbonTabSlug } from "@/lib/routing/shell-routes";

// ── EmptyState inline (no cross-feature import needed — local to shell-organism) ──

interface EmptyStateProps {
  agent: string;
  subtab: string;
}

/**
 * R0 empty-state placeholder for a sub-tab content area.
 * Replaced per subtab as feature tickets ship.
 */
function EmptyState({ agent, subtab }: EmptyStateProps) {
  // Resolve subtab label from catalog
  const agentSlug = agent as RibbonTabSlug;
  const subtabMeta = AGENT_SUBTABS[agentSlug]?.find((t) => t.id === subtab);
  const label = subtabMeta?.label ?? subtab;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-4xl" aria-hidden="true">
        {subtabMeta?.icon ?? "🚧"}
      </span>
      <h2 className="text-lg font-semibold text-foreground">{label}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Esta sección está en construcción. Disponible próximamente.
      </p>
    </div>
  );
}

// ── SubTabContent dispatcher ──────────────────────────────────────────────────

interface SubTabContentProps {
  agent: string;
  subtab: string;
  subsubtab?: string;
}

/**
 * SubTabContent — R0 skeleton dispatcher.
 * All {agent}.{subtab} combos render EmptyState.
 * Replace with feature components as tickets ship.
 */
export function SubTabContent({ agent, subtab }: SubTabContentProps) {
  // R0: all combos → EmptyState
  return <EmptyState agent={agent} subtab={subtab} />;
}
