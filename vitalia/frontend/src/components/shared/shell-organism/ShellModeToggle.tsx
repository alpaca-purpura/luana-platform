// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s4-TBD
/**
 * ShellModeToggle — disabled chip placeholder F1-S4.
 * F1-S5/S7+ activará interaction → setShellMode('agentic' | 'web').
 *
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-5
 * 03-arch.md § 2.7
 *
 * Mounting: rendered inside ShellOrganismLayout as overlay over the TopBar area.
 * F1-S4 does NOT modify TopBarGlobal.tsx (REUSE intacto per anti-creep rule).
 *
 * downstream-regression-na: brand-local toggle stub; no cross-brand consumers
 */

"use client";

import { useShellStore } from "@/stores/shell-store";

/**
 * ShellModeToggle — disabled shell mode indicator chip.
 * Shows current shellMode (agentic|web). Disabled until F1-S5/S7 activation.
 * Includes SVG icon (aria-hidden) representing current layout mode.
 */
export function ShellModeToggle() {
  const shellMode = useShellStore((s) => s.shellMode);
  const label = shellMode === "agentic" ? "Agéntico" : "Web";

  return (
    <button
      type="button"
      disabled
      data-testid="shell-mode-toggle"
      aria-disabled="true"
      aria-label={`Modo de shell: ${shellMode === "agentic" ? "agéntico" : "web"} activo`}
      title="Modo (agéntico/web) — toggle se activa en F1-S5/S7"
      className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 text-xs font-medium text-muted-foreground opacity-70 cursor-not-allowed"
    >
      {shellMode === "agentic" ? (
        /* Two equal panels — agentic 50/50 split layout */
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="7" height="18" rx="1" />
        </svg>
      ) : (
        /* Rail + main panel — web mode layout */
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="4" height="18" rx="1" />
          <rect x="11" y="3" width="10" height="18" rx="1" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
