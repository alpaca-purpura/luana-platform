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

import { useEffect, useRef, useState } from "react";
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

  // ── Min pixels cementados (01-spec.md §5 + §8) ─────────────────────────────
  // valeriaState='full' → min Valeria 620px (rail 60 + history 280 + chat 280)
  // valeriaState='rail' → min Valeria 360px (rail 60 + chat 300)
  // App min constante 480px (ribbon 6 tabs + sub-tabs sin overflow)
  //
  // react-resizable-panels v4 `minSize` es PERCENT (no pixels). Calculamos %
  // dinámicamente con ResizeObserver del container actual del Group para que
  // el min en pixeles siempre se respete sin importar el viewport actual.
  const MIN_VALERIA_PX = valeriaState === "full" ? 620 : 360;
  const MIN_APP_PX = 480;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280); // sane default

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Convert min pixels → percent based on actual container width.
  // Clamp a [10, 70] para evitar valores absurdos en viewport extremo.
  const clampPct = (px: number, total: number) =>
    Math.max(10, Math.min(70, (px / Math.max(total, 1)) * 100));
  const minValeriaPct = clampPct(MIN_VALERIA_PX, containerWidth);
  const minAppPct = clampPct(MIN_APP_PX, containerWidth);
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
          ref={containerRef}
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
                // Idle: 1px gris muted (mockup parity). Hover/focus: primary tenue.
                "w-px bg-border hover:w-1 hover:bg-primary/60 focus-visible:w-1 focus-visible:bg-primary",
                "transition-all duration-150 outline-none cursor-col-resize",
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
