/**
 * ValeriaSidebarSlot — placeholder Server Component for Valeria sidebar panel
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-2 (T-7 refit con skeleton siluetas)
 *
 * Placeholder slot for the Valeria conversational sidebar.
 * F1-S5 (valeria-rail-history) and F1-S6 (valeria-chat-skeleton) will replace
 * this import in ShellOrganismLayout con el componente real Valeria.
 *
 * Visualmente: renderiza siluetas skeleton de bajo detalle (rail 60px + history 280px
 * + chat area) matching el mockup `mockups/shell-layout-agentic.html` ratificado por
 * Chris iter 4. NO construye contenido real (no datos, no interactivos) — el slot
 * label flotante "VALERIASIDEBARSLOT · F1-S5/S6" identifica que es placeholder.
 *
 * Server Component (no "use client") — no hooks, no interactivity.
 * Zero PHI — UI shell chrome only.
 *
 * Spec: 03-arch.md § 2.3 + mockup ratificado iter 4.
 * - element: <aside role="complementary">
 * - aria-label: "Panel Valeria (placeholder — F1-S5/S6 lo construirá)"
 * - data-testid: "valeria-sidebar-slot"
 * - Named export (NO default export) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

export function ValeriaSidebarSlot() {
  return (
    <aside
      role="complementary"
      aria-label="Panel Valeria (placeholder — F1-S5/S6 lo construirá)"
      data-testid="valeria-sidebar-slot"
      className="relative flex h-full min-h-0 overflow-hidden border-r border-border bg-card"
    >
      {/* Rail silhouette (~60px) */}
      <div className="hidden md:flex w-[60px] shrink-0 flex-col items-center gap-3 border-r border-border py-3">
        <div className="h-8 w-8 rounded-md bg-muted opacity-55" />
        <div className="h-8 w-8 rounded-md bg-muted opacity-55" />
        <div className="h-8 w-8 rounded-md bg-muted opacity-55" />
        <div className="h-1 w-6 rounded bg-muted opacity-45 mt-2" />
        <div className="h-8 w-8 rounded-md bg-muted opacity-55" />
        <div className="h-8 w-8 rounded-md bg-muted opacity-55" />
      </div>

      {/* History silhouette (~280px) */}
      <div className="hidden md:flex w-[280px] shrink-0 flex-col gap-3 border-r border-border p-3">
        <div className="h-3.5 w-1/2 rounded bg-muted opacity-45" />
        <div className="h-8 w-full rounded-md bg-muted opacity-55" />
        <div className="mt-2 flex flex-col gap-2">
          <div className="h-2 w-1/3 rounded bg-muted opacity-45" />
          <div className="h-9 w-full rounded-md bg-muted opacity-55" />
          <div className="h-9 w-full rounded-md bg-muted opacity-55" />
          <div className="h-9 w-full rounded-md bg-muted opacity-55" />
          <div className="mt-2 h-2 w-1/3 rounded bg-muted opacity-45" />
          <div className="h-9 w-full rounded-md bg-muted opacity-55" />
          <div className="h-9 w-full rounded-md bg-muted opacity-55" />
          <div className="mt-2 h-2 w-1/3 rounded bg-muted opacity-45" />
          <div className="h-9 w-full rounded-md bg-muted opacity-55" />
        </div>
      </div>

      {/* Chat area silhouette (1fr) */}
      <div className="hidden md:flex flex-1 min-w-0 flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border px-4 h-14">
          <div className="h-9 w-9 rounded-full bg-muted opacity-55" />
          <div className="flex flex-col gap-1.5">
            <div className="h-2 w-24 rounded bg-muted opacity-45" />
            <div className="h-1.5 w-36 rounded bg-muted opacity-45" />
          </div>
        </div>
        {/* Chat body */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 p-4 overflow-hidden">
          <div className="self-start h-11 w-[65%] rounded-md bg-muted opacity-55" />
          <div className="self-end h-11 w-[55%] rounded-md bg-agent-valeria-soft opacity-55" />
          <div className="self-start h-16 w-[75%] rounded-md bg-muted opacity-55" />
          <div className="self-end h-9 w-[40%] rounded-md bg-agent-valeria-soft opacity-55" />
          <div className="self-start h-14 w-[60%] rounded-md bg-muted opacity-55" />
        </div>
        {/* Composer */}
        <div className="border-t border-border p-3">
          <div className="h-11 w-full rounded-md bg-muted opacity-55" />
        </div>
      </div>

      {/* Mobile fallback (< md): centered icon + hint */}
      <div className="md:hidden flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted opacity-55" />
          <p className="mt-3 text-xs text-muted-foreground">
            Valeria — abrir desde menú
          </p>
        </div>
      </div>

      {/* Slot label (identifica placeholder F1-S4) */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 whitespace-nowrap rounded-md border border-dashed border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none"
        aria-hidden="true"
      >
        ValeriaSidebarSlot · F1-S5/S6
      </span>
    </aside>
  );
}
