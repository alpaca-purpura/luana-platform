// cap: shell-organism.shell-vitalia
// story-origin: TBD
"use client";

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

import { useEffect, useRef, useState } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  useGroupRef,
} from "react-resizable-panels";
import { cn } from "@/lib/utils";
import { useShellStore } from "@/stores/shell-store";
import { useStoreHydration } from "@/lib/store/use-store-hydration";
import { useViewportGuard } from "./useViewportGuard";
import { TopBarGlobal } from "./TopBarGlobal";
import { ValeriaSidebar } from "./ValeriaSidebar";
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
  // D3 (ADR-vitalia-006): Trigger useShellStore rehydration exactly ONCE client-side,
  // inside this ssr:false chunk. This is the ONLY place rehydrate() is called for the shell store.
  //
  // WHY HERE: This component is loaded via dynamic({ssr:false}) in ShellOrganismLayout.
  // It executes only on the client, after the SSR skeleton has been replaced.
  // The skeleton renders TopBarGlobal variant="skeleton" (store-free, D4) to prevent
  // the persist middleware from writing localStorage during SSR/pre-hydration.
  // Once THIS component mounts, useStoreHydration fires rehydrate() which:
  //   1. Reads the saved value from localStorage (user's preference).
  //   2. Flips _hasHydrated = true via onRehydrateStorage.
  //   3. Enables storage writes (ssrSafeStorage setItem no longer no-ops).
  //
  // Combined with D4 (skeleton store-free), this kills the Bug #1 clobber:
  // No spurious default write can happen before rehydrate() reads the real value.
  //
  // StrictMode-safe: useStoreHydration uses a ref guard — double-invoke does not
  // trigger double rehydrate().
  useStoreHydration(useShellStore);

  const shellMode = useShellStore((s) => s.shellMode);
  const valeriaState = useShellStore((s) => s.valeriaState);

  // One-way viewport guard: forces 'full' → 'rail' when viewport [768, 1104)
  useViewportGuard();

  // ── Min pixels cementados (01-spec.md §5 + §8) ─────────────────────────────
  // valeriaState='full' → min Valeria 580px (history 280 + chat 300) — D3 F1-S5
  //   (rail XOR history mutuamente exclusivos: 3-col model obsoleto, nuevo 2-col)
  // valeriaState='rail' → min Valeria 360px (rail 60 + chat 300)
  // App min constante 480px (ribbon 6 tabs + sub-tabs sin overflow)
  //
  // react-resizable-panels v4 minSize: numeric values are treated as PIXELS (not percent).
  // STRING values ending in "%" ARE treated as percent. We compute the % dynamically
  // with ResizeObserver on the container so the pixel minimum is always respected,
  // then pass it as `"${minValeriaPct}%"` string to trigger v4's native percent enforcement.
  const MIN_VALERIA_PX = valeriaState === "full" ? 580 : 360;
  const MIN_APP_PX = 480;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280); // sane default

  // Deterministic readiness signal (F1-S4b race-fix). Set true after the first
  // post-mount layout reconciliation (Fix A snap-up settled). Exposed as
  // `data-shell-ready` on the agentic main so consumers and E2E tests can await a
  // stable layout instead of racing the dynamic({ssr:false}) + useDefaultLayout +
  // ResizeObserver hydration sequence. Closes the SC-3 transition+drag-immediately
  // edge case deterministically (no visual/behaviour change for end users).
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

  // Convert min pixels → percent based on actual container width.
  // Clamp a [10, 70] para evitar valores absurdos en viewport extremo.
  const clampPct = (px: number, total: number) =>
    Math.max(10, Math.min(70, (px / Math.max(total, 1)) * 100));
  const minValeriaPct = clampPct(MIN_VALERIA_PX, containerWidth);
  const minAppPct = clampPct(MIN_APP_PX, containerWidth);
  const defaultValeriaPct = shellMode === "agentic" ? 50 : 5;

  // ── Imperative Group ref for snap-up (F13 fix) ───────────────────────────────
  // Two mechanisms enforce the pixel minimum:
  //
  // 1. minSize as string percent (primary, native v4 drag enforcement):
  //    react-resizable-panels v4 treats NUMERIC minSize as pixels (tiny, useless for
  //    our layout). STRING minSize ending in "%" is treated as percent (enforced during
  //    drag). Passing `minValeriaPct + "%"` (e.g., "48.4375%") makes v4 natively clamp
  //    drag to the correct pixel minimum. This eliminates the need for a manual
  //    snap-up in onLayoutChanged for the drag case.
  //
  // 2. Hydration / state-change snap-up (Fix A — useEffect):
  //    useDefaultLayout reads localStorage on hydration. If the persisted layout has
  //    Valeria below the current minValeriaPct (e.g., after valeriaState full→rail→full
  //    cycle), the panel starts below the current minimum. Fix A snaps it up imperatively.
  //    Also catches the valeriaState change case (full→rail lowers min — panel stays;
  //    rail→full raises min — snap up needed).
  //
  // API note (react-resizable-panels v4):
  //   groupRef prop (NOT std ref) → GroupImperativeHandle
  //   getLayout() → { [panelId: string]: number } (map by panel id, percent 0..100)
  //   setLayout({ [panelId]: pct }) → applied Layout
  //   onLayoutChanged(layout) → fires after pointer released (not on each move)
  const groupRef = useGroupRef();

  // Fix A: snap-up when containerWidth or minValeriaPct changes.
  // Catches hydration race (localStorage restore below new minimum) and
  // valeriaState change (full→rail→full cycle where panel is below new min).
  useEffect(() => {
    if (containerWidth <= 0 || !groupRef.current) return;
    const layout = groupRef.current.getLayout();
    const valeriaPct = layout[VALERIA_PANEL_ID];
    if (valeriaPct !== undefined && valeriaPct < minValeriaPct) {
      groupRef.current.setLayout({
        [VALERIA_PANEL_ID]: minValeriaPct,
        [APP_PANEL_ID]: 100 - minValeriaPct,
      });
    }
    // Layout reconciled — signal readiness for consumers/tests awaiting a stable
    // post-hydration layout (idempotent; React bails when already true).
    setShellReady(true);
  }, [containerWidth, minValeriaPct, groupRef]);

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
          data-shell-ready={shellReady ? "true" : "false"}
        >
          <Group
            id={SHELL_GROUP_ID}
            orientation="horizontal"
            className="h-full"
            groupRef={groupRef}
            {...layoutProps}
            onLayoutChanged={layoutProps.onLayoutChanged}
          >
            <Panel
              id={VALERIA_PANEL_ID}
              defaultSize={defaultValeriaPct}
              minSize={`${minValeriaPct}%`}
              collapsible={false}
            >
              <ValeriaSidebar />
            </Panel>

            <Separator
              id="shell-handle"
              className={cn(
                // ★ Fix 2026-05-24: 1px visible (mockup parity) pero 8px hit area.
                // Antes: w-px directo → handle 1 pixel apenas grabbable + border-r del aside
                // adyacente confundía hit zone (usuario clickeaba el border no interactivo).
                // Ahora: container transparente w-2 (8px) con ::after pseudo 1px centrado.
                // Hover/focus expanden el indicator a 2px (sin cambiar hit area).
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
              defaultSize={100 - defaultValeriaPct}
              minSize={`${minAppPct}%`}
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
          <ValeriaSidebar />
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
