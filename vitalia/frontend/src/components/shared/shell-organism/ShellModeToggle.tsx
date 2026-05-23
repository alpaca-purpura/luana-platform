/**
 * ShellModeToggle — disabled chip placeholder F1-S4.
 * F1-S5/S7+ activará interaction → setShellMode('agentic' | 'web').
 *
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-5 (stub for T-3 integration)
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
 */
export function ShellModeToggle() {
  const shellMode = useShellStore((s) => s.shellMode);

  return (
    <button
      type="button"
      disabled
      data-testid="shell-mode-toggle"
      aria-disabled="true"
      aria-label={`Modo de shell: ${shellMode === "agentic" ? "agéntico" : "web"} activo`}
      title="Modo (agéntico/web) — toggle se activa en F1-S5/S7"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground opacity-60 cursor-not-allowed"
    >
      <span>{shellMode === "agentic" ? "Agéntico" : "Web"}</span>
    </button>
  );
}
