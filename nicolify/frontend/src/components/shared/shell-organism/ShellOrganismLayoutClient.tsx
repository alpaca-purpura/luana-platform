// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3 + bugfix (live-verification)
"use client";

/**
 * ShellOrganismLayoutClient — actual shell layout implementation for Nicolify.
 * nicolify-r0-shell T-3 — port from vitalia ShellOrganismLayoutClient.tsx.
 * Renamed: Valeria → Luana, valeriaState → luanaState, ValeriaSidebar → LuanaSidebar.
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
 * - PanelResizeHandle → Separator (aria-label via rest passthrough)
 *
 * Single-main pattern (bugfix live-verification 2026-05-30):
 * ONE <main id="main-content"> wraps ALL layouts — desktop and mobile.
 * Inner chrome (agentic Group/Panel vs web grid vs mobile single-column)
 * switches based on shellMode + isDesktop viewport guard.
 * This guarantees a unique id="main-content" in the DOM at all times,
 * valid HTML, and no Playwright strict-mode-violation (1 element resolved).
 *
 * G2 (ADR-nicolify-001): SSR-safe store — useStoreHydration called ONCE
 * client-side inside this ssr:false boundary (same pattern as vitalia ADR-vitalia-006).
 *
 * C3 bug mitigation: useGroupRef snap-up on hydration + useDefaultLayout localStorage
 * persistence — spurious default write prevented by skeleton store-free (ShellOrganismLayout).
 *
 * Splitter shortcuts: C/R/F (collapsed/rail/full via setLuanaState). Hit-area ≥8px (w-2).
 *
 * downstream-regression-na: brand-local shell component; no cross-brand consumers
 */

import { useStoreHydration } from "@luana/hooks/use-store-hydration";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

/** MediaQuery for desktop breakpoint (md = 768px) */
const DESKTOP_MQL = typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)") : null;

/**
 * useSyncExternalStore wrappers for the desktop MediaQueryList.
 * Avoids calling setState synchronously inside a useEffect body.
 */
function subscribeToDesktopMql(callback: () => void) {
  if (!DESKTOP_MQL) return () => undefined;
  DESKTOP_MQL.addEventListener("change", callback);
  return () => DESKTOP_MQL.removeEventListener("change", callback);
}
function getDesktopSnapshot() {
  return DESKTOP_MQL?.matches ?? true;
}
function getDesktopServerSnapshot() {
  return true; // assume desktop on server (safe: component is ssr:false)
}

export interface ShellOrganismLayoutClientProps {
  children: React.ReactNode;
  tenantId: string;
}

/**
 * Shell organism layout client — agentic + web dual-mode panel.
 * Long function is inherent: inner chrome variants (agentic/web/mobile)
 * + ResizeObserver + useGroupRef snap-up + useDefaultLayout all in one boundary.
 * Extracting each inner layout into sub-components would lose the shared state refs.
 *
 * Bugfix (live-verification 2026-05-30): replaced 3 conditional <main> elements with a
 * SINGLE <main id="main-content"> wrapper containing conditional inner chrome.
 * Previously the mobile <main> was always rendered (no guard) → duplicate id
 * + 2× subtab-content testids → Playwright strict-mode-violation.
 */
// eslint-disable-next-line max-lines-per-function -- single-main shell layout: shared containerRef, groupRef, ResizeObserver, and layoutProps must live in one scope
export function ShellOrganismLayoutClient({
  children,
  tenantId: _tenantId,
}: ShellOrganismLayoutClientProps) {
  // ADR-nicolify-001 G2 + ADR-vitalia-006 D3:
  // Trigger useShellStore rehydration ONCE client-side, inside this ssr:false chunk.
  // This is the ONLY place rehydrate() is called for the shell store.
  //
  // WHY HERE: This component is loaded via dynamic({ssr:false}) in ShellOrganismLayout.
  // The skeleton renders TopBarGlobal variant="skeleton" (store-free, D4) to prevent
  // the persist middleware from writing localStorage during SSR/pre-hydration (C3).
  // Once THIS component mounts, useStoreHydration fires rehydrate() which:
  //   1. Reads the saved value from localStorage (user's preference).
  //   2. Flips _hasHydrated = true via onRehydrateStorage.
  //   3. Enables storage writes (ssrSafeStorage setItem no longer no-ops).
  //
  // StrictMode-safe: useStoreHydration uses a ref guard — double-invoke does not
  // trigger double rehydrate().
  useStoreHydration(useShellStore);

  const shellMode = useShellStore((s) => s.shellMode);
  const luanaState = useShellStore((s) => s.luanaState);

  // One-way viewport guard: forces 'full' → 'rail' when viewport [768, 1104)
  useViewportGuard();

  // isDesktop: tracks whether the viewport is md+ (≥768px).
  // Used inside this ssr:false dynamic chunk to switch inner chrome.
  // Safe: no SSR, no hydration mismatch (component is ssr:false).
  // Uses useSyncExternalStore to avoid calling setState synchronously in useEffect.
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopMql,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );

  // ── Min pixels (01-spec.md §5 + §8 pattern from vitalia) ─────────────────
  // luanaState='full' → min Luana 580px (history 280 + chat 300)
  // luanaState='rail'/'collapsed' → min Luana 360px
  // App min constant 480px (ribbon 6 tabs + sub-tabs without overflow)
  const MIN_LUANA_PX = luanaState === "full" ? 580 : 360;
  const MIN_APP_PX = 480;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280); // sane default

  // Deterministic readiness signal (Fix A snap-up settled).
  // Exposed as `data-shell-ready` on the main element so consumers and E2E tests
  // can await stable layout instead of racing dynamic({ssr:false}) + useDefaultLayout +
  // ResizeObserver hydration sequence.
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
  // Clamp to [10, 70] to avoid absurd values at extreme viewports.
  const clampPct = (px: number, total: number) =>
    Math.max(10, Math.min(70, (px / Math.max(total, 1)) * 100));
  const minLuanaPct = clampPct(MIN_LUANA_PX, containerWidth);
  const minAppPct = clampPct(MIN_APP_PX, containerWidth);
  const defaultLuanaPct = shellMode === "agentic" ? 50 : 5;

  // ── Imperative Group ref for snap-up (Fix A — C3 bug mitigation) ─────────
  // Mechanisms:
  // 1. minSize as string percent (primary, native v4 drag enforcement):
  //    react-resizable-panels v4 treats STRING minSize ending in "%" as percent.
  //    Passing `${minLuanaPct}%` makes v4 natively clamp drag to the pixel minimum.
  // 2. Hydration / state-change snap-up (Fix A — useEffect):
  //    useDefaultLayout reads localStorage on hydration. If persisted layout has
  //    Luana below the current minLuanaPct, snap up imperatively.
  const groupRef = useGroupRef();

  // Fix A: snap-up when containerWidth or minLuanaPct changes.
  // Catches hydration race (localStorage restore below new minimum) and
  // luanaState change cycle.
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
    // Layout reconciled — signal readiness for consumers/tests
    setShellReady(true);
  }, [containerWidth, minLuanaPct, groupRef]);

  // Persist layout across page reloads via localStorage.
  // Safe to call directly: this component is client-only via dynamic({ssr:false}).
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
       * SINGLE <main id="main-content"> — bugfix (live-verification 2026-05-30).
       * Previously three separate <main id="main-content"> elements existed (agentic +
       * web + mobile), with the mobile one ALWAYS rendered (no shellMode guard), causing:
       *   - duplicate id="main-content" → invalid HTML → breaks skip-link a11y (F1)
       *   - 2× {children} renders → Playwright strict-mode-violation on testid locators
       *
       * Now: ONE <main> wraps ALL variants. Inner chrome switches on shellMode + isDesktop.
       * containerRef placed here (on the outer wrapper) — ResizeObserver reads total width.
       * data-shell-ready reflects when agentic layout has settled (set by Fix A useEffect).
       */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-hidden"
        aria-label="Contenido principal"
        ref={containerRef}
        data-shell-ready={shellReady ? "true" : "false"}
      >
        {/* ── Desktop: agentic (md+) ── */}
        {isDesktop && shellMode === "agentic" && (
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
                // hit-area ≥8px: container transparente w-2 (8px) con ::after pseudo 1px centrado.
                // Hover/focus expanden el indicator a 2px (sin cambiar hit area).
                "group relative w-2 shrink-0 bg-transparent cursor-col-resize outline-none",
                "after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:-translate-x-1/2",
                "after:bg-border after:transition-all after:duration-150",
                "hover:after:w-0.5 hover:after:bg-primary/60",
                "focus-visible:after:w-0.5 focus-visible:after:bg-primary",
              )}
              aria-label="Redimensionar paneles"
            />

            <Panel id={APP_PANEL_ID} defaultSize={100 - defaultLuanaPct} minSize={`${minAppPct}%`}>
              <AppPanelSlot>{children}</AppPanelSlot>
            </Panel>
          </Group>
        )}

        {/* ── Desktop: web mode (md+) — static CSS grid 60px / 1px / 1fr ── */}
        {isDesktop && shellMode === "web" && (
          <div className="h-full grid grid-cols-[60px_1px_1fr]">
            <LuanaSidebar />
            {/* Visual divider (1px) */}
            <div className="bg-border" aria-hidden="true" />
            <AppPanelSlot>{children}</AppPanelSlot>
          </div>
        )}

        {/* ── Mobile fallback (< md): single-column, no Luana visible ── */}
        {/* Luana accessible via drawer trigger (T-4 adds burger button) */}
        {!isDesktop && <AppPanelSlot>{children}</AppPanelSlot>}
      </main>
    </div>
  );
}
