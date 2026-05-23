/**
 * AppPanelSlot — placeholder Server Component for application content panel
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-2 (T-7 refit con skeleton siluetas)
 *
 * Placeholder slot for the main application panel (tabs, ribbon, sub-tabs).
 * F1-S7 (ribbon-6-tabs), F1-S8 (sub-tabs-line2), and F1-S10 (empty-states)
 * llenarán este slot con content real.
 *
 * Visualmente: renderiza siluetas skeleton (ribbon 64px con 5 agentes + Configurar ·
 * sub-tabs bar 40px · content area con cards grid) matching el mockup
 * `mockups/shell-layout-agentic.html` ratificado iter 4. El slot label flotante
 * "APPPANELSLOT · F1-S7 / S8 / S10" identifica placeholder. Children pasados por la
 * ruta renderizados ENCIMA del skeleton (cuando F1-S7 active ribbon real, el
 * skeleton queda oculto por content).
 *
 * Server Component (no "use client") — no hooks, no interactivity.
 * Accepts children so the route group layout can pass page content through.
 * Zero PHI — UI shell chrome only.
 *
 * Spec: 03-arch.md § 2.4 + mockup ratificado iter 4.
 * - element: <section role="region">
 * - aria-label: "Panel aplicación (placeholder — F1-S7/S8/S10 lo construirá)"
 * - data-testid: "app-panel-slot"
 * - Props: { children?: React.ReactNode }
 * - Named export (NO default export) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

interface AppPanelSlotProps {
  /** Page content rendered by the route group (F1-S7/S8/S10 will populate) */
  children?: React.ReactNode;
}

export function AppPanelSlot({ children }: AppPanelSlotProps) {
  return (
    <section
      role="region"
      aria-label="Panel aplicación (placeholder — F1-S7/S8/S10 lo construirá)"
      data-testid="app-panel-slot"
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background"
    >
      {/* Ribbon silhouette (~64px) — 5 agentes + Configurar */}
      <div className="hidden md:flex items-center gap-3 border-b border-border px-4 h-16">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-full bg-agent-lisa-soft opacity-65" />
          <div className="h-2 w-12 rounded bg-muted opacity-45" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-full bg-agent-lucas-soft opacity-65" />
          <div className="h-2 w-12 rounded bg-muted opacity-45" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-full bg-agent-adrian-soft opacity-65" />
          <div className="h-2 w-12 rounded bg-muted opacity-45" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-full bg-agent-valeria-soft opacity-65" />
          <div className="h-2 w-12 rounded bg-muted opacity-45" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-full bg-agent-camila-soft opacity-65" />
          <div className="h-2 w-12 rounded bg-muted opacity-45" />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-7 w-7 rounded-md bg-muted opacity-55" />
          <div className="h-2 w-14 rounded bg-muted opacity-45" />
        </div>
      </div>

      {/* Sub-tabs silhouette (~40px) */}
      <div className="hidden md:flex items-center gap-3 border-b border-border px-4 h-10">
        <div className="h-2 w-16 rounded bg-muted opacity-45" />
        <div className="h-2 w-20 rounded bg-muted opacity-45" />
        <div className="h-2 w-14 rounded bg-muted opacity-45" />
        <div className="h-2 w-[70px] rounded bg-muted opacity-45" />
      </div>

      {/* Content area silhouette */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4 p-6">
        <div className="h-3.5 w-[42%] rounded bg-muted opacity-45" />
        <div className="h-2 w-[78%] rounded bg-muted opacity-45" />
        <div className="h-2 w-[60%] rounded bg-muted opacity-45" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-[120px] rounded-md bg-muted opacity-55" />
          <div className="h-[120px] rounded-md bg-muted opacity-55" />
          <div className="h-[120px] rounded-md bg-muted opacity-55" />
          <div className="h-[120px] rounded-md bg-muted opacity-55" />
        </div>
      </div>

      {/* Children slot — render encima del skeleton cuando route pasa content.
          Cuando F1-S7 active el ribbon real (via route group children), el
          content del children visualmente domina sobre el skeleton background. */}
      {children !== undefined && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="h-full w-full pointer-events-auto">{children}</div>
        </div>
      )}

      {/* Slot label */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 whitespace-nowrap rounded-md border border-dashed border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pointer-events-none"
        aria-hidden="true"
      >
        AppPanelSlot · F1-S7 / S8 / S10
      </span>
    </section>
  );
}
