/**
 * ShellOrganismLayoutClient — actual shell layout implementation.
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-3 + T-7 SSR fix
 *
 * 03-arch.md § 2.2, § 2.9
 *
 * Importado dinámicamente via `next/dynamic({ ssr: false })` desde
 * ShellOrganismLayout.tsx para evitar el bug SSR de react-resizable-panels
 * v4.11.1 (bare-name `localStorage` default param en useDefaultLayout que
 * crashea durante el SSR pass).
 *
 * Este file NO se importa directamente desde ningún consumer — siempre
 * via el wrapper `ShellOrganismLayout` que aplica el dynamic guard.
 *
 * react-resizable-panels v4 API note:
 * - PanelGroup → Group (orientation="horizontal", useDefaultLayout for persist)
 * - Panel → Panel (id, defaultSize, minSize)
 * - PanelResizeHandle → Separator (aria-label via ...rest passthrough)
 *
 * Triple-main pattern (03-arch.md § 2.2 implementation note):
 * Three <main id="main-content"> elements — CSS mutually exclusive via Tailwind.
 * Only ONE main is visible at any viewport. Skip-link #main-content resolves
 * to the visible one.
 *
 * HIPAA-lite: not applicable — chrome UI, no PHI.
 * downstream-regression-na: brand-local shell component; no cross-brand consumers
 */

"use client";

import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { useShellStore } from "@/stores/shell-store";
import { useViewportGuard } from "./useViewportGuard";
import { TopBarGlobal } from "./TopBarGlobal";
import { ValeriaSidebarSlot } from "./ValeriaSidebarSlot";
import { AppPanelSlot } from "./AppPanelSlot";
import { ShellModeToggle } from "./ShellModeToggle";

/** Unique group ID for localStorage persistence via useDefaultLayout */
const SHELL_GROUP_ID = "vitalia-shell-split-agentic";

/** Panel IDs must be stable strings (used for layout persistence keying) */
const VALERIA_PANEL_ID = "valeria-panel";
const APP_PANEL_ID = "app-panel";

export interface ShellOrganismLayoutClientProps {
  children: React.ReactNode;
  tenantId: string;
}

export function ShellOrganismLayoutClient({
  children,
  tenantId: _tenantId,
}: ShellOrganismLayoutClientProps) {
  const shellMode = useShellStore((s) => s.shellMode);
  const valeriaState = useShellStore((s) => s.valeriaState);

  // One-way viewport guard: forces 'full' → 'rail' when viewport [768, 1104)
  useViewportGuard();

  // Panel size percentages (react-resizable-panels v4 uses percent units)
  // Reference viewport: 1640px (valeria 620 + handle 4 + app 480 + padding)
  const minValeriaPct = valeriaState === "full" ? 38 : 22;
  const minAppPct = 30;
  const defaultValeriaPct = shellMode === "agentic" ? 50 : 5;

  // Persist layout across page reloads via localStorage.
  // Safe to call directly: this component is client-only via dynamic({ssr:false}).
  const layoutProps = useDefaultLayout({
    id: SHELL_GROUP_ID,
    panelIds: [VALERIA_PANEL_ID, APP_PANEL_ID],
    storage: window.localStorage,
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar — always visible (48px) */}
      <TopBarGlobal />

      {/* Shell mode toggle chip — disabled placeholder (F1-S5/S7 activates) */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <ShellModeToggle />
      </div>

      {/* ── Agentic desktop layout (md+): resizable 2-panel via react-resizable-panels v4 ── */}
      {shellMode === "agentic" && (
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-hidden hidden md:block"
          aria-label="Contenido principal"
        >
          <Group
            id={SHELL_GROUP_ID}
            orientation="horizontal"
            className="h-full"
            {...layoutProps}
          >
            <Panel
              id={VALERIA_PANEL_ID}
              defaultSize={defaultValeriaPct}
              minSize={minValeriaPct}
              collapsible={false}
            >
              <ValeriaSidebarSlot />
            </Panel>

            <Separator
              id="shell-handle"
              className={cn(
                "w-1 bg-border hover:bg-primary/40 focus-visible:bg-primary",
                "data-[separator]:bg-primary",
                "transition-colors outline-none",
              )}
              aria-label="Redimensionar paneles"
            />

            <Panel
              id={APP_PANEL_ID}
              defaultSize={100 - defaultValeriaPct}
              minSize={minAppPct}
            >
              <AppPanelSlot>{children}</AppPanelSlot>
            </Panel>
          </Group>
        </main>
      )}

      {/* ── Web desktop layout (md+): static CSS grid 60px / 1px / 1fr ── */}
      {shellMode === "web" && (
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-hidden hidden md:grid grid-cols-[60px_1px_1fr]"
          aria-label="Contenido principal"
        >
          <ValeriaSidebarSlot />
          {/* Visual divider (1px) */}
          <div className="bg-border" aria-hidden="true" />
          <AppPanelSlot>{children}</AppPanelSlot>
        </main>
      )}

      {/* ── Mobile fallback (< md): single-column, no Valeria visible ── */}
      {/* Valeria accessible via drawer trigger (F1-S5 will add burger button) */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-hidden md:hidden"
        aria-label="Contenido principal"
      >
        <AppPanelSlot>{children}</AppPanelSlot>
      </main>
    </div>
  );
}
