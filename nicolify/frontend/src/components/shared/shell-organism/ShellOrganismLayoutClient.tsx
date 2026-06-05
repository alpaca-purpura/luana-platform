// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3 + bugfix (live-verification)
"use client";

/**
 * ShellOrganismLayoutClient — actual shell layout implementation for Nicolify.
 * nicolify-r0-shell T-3 — port from vitalia ShellOrganismLayoutClient.tsx.
 * Renamed: Valeria → Luana, valeriaState → luanaState, ValeriaSidebar → LuanaSidebar.
 *
 * Importado dinámicamente via `next/dynamic({ ssr: false })` desde
 * ShellOrganismLayout.tsx para evitar el bug SSR de react-resizable-panels.
 *
 * Layout responsive vía CSS (no JS): el desktop layout (Group resizable o web
 * grid) se monta SIEMPRE y se oculta en mobile con `md:block`; el mobile layout
 * se monta SIEMPRE y se oculta en desktop con `md:hidden`. Montar/desmontar el
 * <Group> condicionalmente (detrás de useSyncExternalStore(isDesktop)) disparaba
 * "Rendered more hooks than during the previous render" — por eso el gate es CSS.
 *
 * UN solo <main id="main-content"> envuelve ambos layouts (id único, HTML válido).
 *
 * G2 (ADR-nicolify-001): SSR-safe store — useStoreHydration once client-side.
 * C3 mitigation: useGroupRef snap-up + useDefaultLayout localStorage persistence.
 * Splitter shortcuts: C/R/F (collapsed/rail/full via setLuanaState).
 *
 * downstream-regression-na: brand-local shell component; no cross-brand consumers
 */

import { useStoreHydration } from "@luana/hooks/use-store-hydration";
import { useEffect, useRef, useState } from "react";
import { Group, Panel, Separator, useDefaultLayout, useGroupRef } from "react-resizable-panels";

import { cn } from "@/lib/utils";
import { useShellStore } from "@/stores/shell-store";

import { AppPanelSlot } from "./AppPanelSlot";
import { LuanaSidebar } from "./LuanaSidebar";
import { ShellModeToggle } from "./ShellModeToggle";
import { TopBarGlobal } from "./TopBarGlobal";
import { useViewportGuard } from "./useViewportGuard";

/** Unique group ID for localStorage persistence via useDefaultLayout */
const SHELL_GROUP_ID = "nicolify-shell-split-agentic";

/** Panel IDs must be stable strings (used for layout persistence keying) */
const LUANA_PANEL_ID = "luana-panel";
const APP_PANEL_ID = "app-panel";

export interface ShellOrganismLayoutClientProps {
  children: React.ReactNode;
  tenantId: string;
}

/**
 * Shell organism layout client — agentic + web dual-mode panel.
 * Long function is inherent: inner chrome variants + ResizeObserver + useGroupRef
 * snap-up + useDefaultLayout all in one boundary (shared state refs).
 */
// eslint-disable-next-line max-lines-per-function -- single-main shell layout: shared containerRef, groupRef, ResizeObserver, and layoutProps must live in one scope
export function ShellOrganismLayoutClient({
  children,
  tenantId: _tenantId,
}: ShellOrganismLayoutClientProps) {
  // ADR-nicolify-001 G2 + ADR-vitalia-006 D3: trigger rehydration ONCE client-side
  // inside this ssr:false chunk. StrictMode-safe via ref guard in useStoreHydration.
  useStoreHydration(useShellStore);

  const shellMode = useShellStore((s) => s.shellMode);
  const luanaState = useShellStore((s) => s.luanaState);

  // One-way viewport guard: forces 'full' → 'rail' when viewport [768, 1104)
  useViewportGuard();

  // ── Min pixels (01-spec.md §5 + §8 pattern from vitalia) ─────────────────
  // luanaState='full' → min Luana 580px · 'rail'/'collapsed' → 360px · app 480px
  const MIN_LUANA_PX = luanaState === "full" ? 580 : 360;
  const MIN_APP_PX = 480;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280); // sane default

  // Deterministic readiness signal (Fix A snap-up settled), exposed as
  // data-shell-ready for consumers/E2E to await stable layout.
  const [shellReady, setShellReady] = useState(false);

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

  // Convert min pixels → percent based on actual container width. Clamp [10, 70].
  const clampPct = (px: number, total: number) =>
    Math.max(10, Math.min(70, (px / Math.max(total, 1)) * 100));
  const minLuanaPct = clampPct(MIN_LUANA_PX, containerWidth);
  const minAppPct = clampPct(MIN_APP_PX, containerWidth);
  const defaultLuanaPct = shellMode === "agentic" ? 50 : 5;

  // ── Imperative Group ref for snap-up (Fix A — C3 bug mitigation) ─────────
  const groupRef = useGroupRef();

  // Fix A: snap-up when containerWidth or minLuanaPct changes (hydration race +
  // luanaState change cycle). Signals readiness once layout reconciled.
  useEffect(() => {
    if (containerWidth <= 0 || !groupRef.current) return;
    const layout = groupRef.current.getLayout();
    const luanaPct = layout[LUANA_PANEL_ID];
    if (luanaPct !== undefined && luanaPct < minLuanaPct) {
      groupRef.current.setLayout({
        [LUANA_PANEL_ID]: minLuanaPct,
        [APP_PANEL_ID]: 100 - minLuanaPct,
      });
    }
    setShellReady(true);
  }, [containerWidth, minLuanaPct, groupRef]);

  // Persist layout across reloads via localStorage. Safe: client-only (ssr:false).
  const layoutProps = useDefaultLayout({
    id: SHELL_GROUP_ID,
    panelIds: [LUANA_PANEL_ID, APP_PANEL_ID],
    storage: window.localStorage,
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar — always visible (48px) */}
      <TopBarGlobal />

      {/* Shell mode toggle chip — disabled placeholder in R0 */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <ShellModeToggle />
      </div>

      {/*
       * UN solo <main id="main-content"> envuelve TODAS las variantes. El inner
       * chrome se muestra/oculta con CSS responsive (md:block / md:hidden), NO con
       * render condicional — así el <Group> de resizable se monta una sola vez y no
       * descuadra el conteo de hooks. containerRef aquí; ResizeObserver lee el ancho.
       *
       * AppPanelSlot ({children}) se renderiza EXACTAMENTE UNA VEZ dentro del branch
       * correcto de desktop. En mobile el sidebar se oculta vía CSS y el AppPanelSlot
       * del branch desktop ocupa el ancho completo disponible. El div mobile separado
       * fue eliminado para evitar la duplicación (bug 2026-06-03).
       */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-hidden"
        aria-label="Contenido principal"
        ref={containerRef}
        data-shell-ready={shellReady ? "true" : "false"}
      >
        {/* ── Chrome inner: SIEMPRE montado (CSS gate para md+ sidebar) ── */}
        <div className="h-full w-full">
          {shellMode === "agentic" ? (
            <Group
              id={SHELL_GROUP_ID}
              orientation="horizontal"
              className="h-full"
              groupRef={groupRef}
              {...layoutProps}
              onLayoutChanged={layoutProps.onLayoutChanged}
            >
              <Panel
                id={LUANA_PANEL_ID}
                defaultSize={defaultLuanaPct}
                minSize={`${minLuanaPct}%`}
                collapsible={false}
              >
                <LuanaSidebar />
              </Panel>

              <Separator
                id="shell-handle"
                className={cn(
                  "group relative w-2 shrink-0 bg-transparent cursor-col-resize outline-none",
                  "after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:-translate-x-1/2",
                  "after:bg-border after:transition-all after:duration-150",
                  "hover:after:w-0.5 hover:after:bg-primary/60",
                  "focus-visible:after:w-0.5 focus-visible:after:bg-primary",
                )}
                aria-label="Redimensionar paneles"
              />

              <Panel
                id={APP_PANEL_ID}
                defaultSize={100 - defaultLuanaPct}
                minSize={`${minAppPct}%`}
              >
                <AppPanelSlot>{children}</AppPanelSlot>
              </Panel>
            </Group>
          ) : (
            // web mode — static CSS grid 60px / 1px / 1fr (sidebar always present; mobile sees rail via D5 drawer)
            <div className="h-full grid grid-cols-[60px_1px_1fr]">
              <LuanaSidebar />
              <div className="bg-border" aria-hidden="true" />
              <AppPanelSlot>{children}</AppPanelSlot>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
