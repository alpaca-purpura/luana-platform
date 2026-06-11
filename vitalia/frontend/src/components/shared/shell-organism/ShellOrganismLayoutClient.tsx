// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-dual-mount-a11y-fix T-1
"use client";

/**
 * ShellOrganismLayoutClient — actual shell layout implementation.
 * vitalia-shell-dual-mount-a11y-fix T-1 (bugfix: triple-main → single-main + single-slot)
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
 * ─── Single-main + single-slot pattern (vitalia-shell-dual-mount-a11y-fix) ───
 *
 * PROBLEMA PREVIO — "Triple-main pattern":
 * Había 3 <main id="main-content"> mutuamente excluyentes por CSS, con
 * <AppPanelSlot> en CADA rama. La rama mobile (md:hidden) se montaba SIEMPRE
 * → en desktop había 2 AppPanelSlot en el DOM → cada data-testid duplicado.
 *
 * SOLUCIÓN ELEGIDA — Opción A (03-arch.md § D2):
 * Un ÚNICO <main id="main-content"> envuelve TODAS las variantes de chrome.
 * <AppPanelSlot> se renderiza UNA SOLA VEZ dentro del app-panel del chrome
 * desktop (Group Panel id="app-panel" para agentic; grid col para web).
 * La diferencia desktop↔mobile es CSS sobre los CONTENEDORES (Valeria panel +
 * separador se ocultan en mobile), NO sobre el slot. El <Group> resizable se
 * monta SIEMPRE — nunca condicional por viewport JS.
 *
 * Concretamente:
 * - Agentic: <Group> SIEMPRE montado; panel "valeria-panel" con className
 *   "hidden md:flex" oculta Valeria en mobile; app-panel visible siempre.
 * - Web: grid-cols dinámico — columnas Valeria+separador con "hidden md:block",
 *   columna app con "min-w-0" siempre visible.
 * - Mobile collapsa automáticamente mostrando sólo el AppPanelSlot (ya visible
 *   porque el app-panel no tiene `hidden` propio).
 *
 * Lección nicolify (prior art live, leída 2026-06-01):
 * Montar/desmontar <Group> condicionalmente detrás de isDesktop/useMediaQuery
 * dispara "Rendered more hooks than during the previous render" (React crash).
 * Por eso el gate desktop↔mobile es CSS, nunca JS. Nicolify aplicó single-main
 * pero dejó AppPanelSlot en la rama mobile también; vitalia va un paso más allá
 * con single-slot (0 branches → 1 slot en el DOM).
 *
 * Invariantes:
 * - document.querySelectorAll('#main-content').length === 1 (cualquier viewport/mode)
 * - document.querySelectorAll('[data-testid="app-panel-slot"]').length === 1
 * - Cero console.error "Rendered more hooks than during the previous render"
 * - axe wcag2aa: 0 violaciones duplicate-id / landmark-unique
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
import { useTenantStore } from "@/stores/tenant-store";
import { useStoreHydration } from "@luana/hooks/use-store-hydration";
import {
  useViewportGuard,
  VALERIA_MIN_PX,
} from "./useViewportGuard";
import { TopBarGlobal } from "./TopBarGlobal";
import { ValeriaSidebar } from "./ValeriaSidebar";
import { AppPanelSlot } from "./AppPanelSlot";
import { Toaster } from "@/components/ui/sonner";

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
  // D3 (ADR-vitalia-006): Trigger store rehydration exactly ONCE client-side,
  // inside this ssr:false chunk. This is the ONLY place rehydrate() is called for the
  // shell + tenant stores. StrictMode-safe via ref guard in useStoreHydration.
  // ── ALL hooks called UNCONDITIONALLY at the top before any branch/early-return (D3) ──
  useStoreHydration(useShellStore);
  // T-3 (vitalia-shell-core-hardening): binary machine drives the panel width.
  // closed (state A) → panel shrinks to the 44px tira-avatar; chat (B/C) → restore.
  const valeriaOpen = useShellStore((s) => s.valeriaOpen);
  // Bug #2 fix (vitalia-bugfix-shell-nav-scroll-errors T-4): el tenant-store usa
  // createSsrSafePersistedStore con skipHydration:true; su doc pide rehidratarlo
  // desde el primer componente cliente que lo consume — y nadie lo hacía. Sin esto,
  // el activeTenant persistido nunca se restaura y el TenantSwitcher dependía 100%
  // del auto-pick de useTenants, dejando una ventana con activeTenant=null →
  // selector invisible. Llamado acá (junto a useShellStore, ANTES de cualquier
  // branch — invariante D3, hook-count estable).
  useStoreHydration(useTenantStore);

  // T-2 (vitalia-shell-core-hardening): shellMode ('agentic'|'web') + ShellModeToggle
  // + the legacy "web mode" static grid + the 60px rail are ELIMINATED (AC-1/RN-1).
  // The shell is always the resizable split now — there is no longer a mode branch.
  // The closed-state tira-avatar (state A) + its open/collapse wiring is T-3.

  // Store-inert viewport hook (T-2): owns the clamp/drawer constants; the binary
  // machine has no viewport-driven store mutation (called unconditionally — D3).
  useViewportGuard();

  // ── Min pixels (03-arch-fe §2 · T-2 clamp 320; sin 620/rail) ───────────────
  // Valeria clamps to VALERIA_MIN_PX (320) in the inline split window [1024,1280)
  // so the agent panel stays legible without overflow-x. The legacy 580/360 rail
  // sizing (rail 60 + chat 300) is REMOVED ("sin 620/rail"). The 44px collapsed
  // tira-avatar (state A) is T-3; here closed simply collapses the panel to 0.
  // App min constante 480px (ribbon 6 tabs + sub-tabs sin overflow).
  //
  // react-resizable-panels v4 minSize: STRING values ending in "%" are treated as
  // percent. We compute the % dynamically with ResizeObserver on the container so
  // the pixel minimum is always respected, then pass it as `"${minValeriaPct}%"`.
  const MIN_VALERIA_PX = VALERIA_MIN_PX;
  const MIN_APP_PX = 480;
  // T-3: state A tira-avatar fixed width (matches ValeriaCollapsedStrip ~44px). The
  // Panel is `collapsible collapsedSize={0}` so this bypasses minSize via setLayout.
  const STRIP_VALERIA_PX = 44;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280); // sane default

  // Deterministic readiness signal: set true after the first post-mount layout
  // reconciliation (Fix A snap-up settled). Exposed as `data-shell-ready` for
  // consumers and E2E tests to await a stable layout.
  const [shellReady, setShellReady] = useState(false);

  // Point 3 (bugfix-shell-valeria-responsive, Chris 2026-06-04): inline split only
  // at >= lg (1024). Below it, Valeria is a drawer/overlay → the Valeria Panel must
  // collapse to 0 so the agent gets the FULL width (otherwise the Group reserves its
  // 30% even though the panel content is CSS-hidden, leaving an empty gap).
  // ValeriaSidebar stays mounted (inside the Panel) so its drawer portal still works.
  // Synchronous init (client-only via ssr:false) → no flash.
  const [isLg, setIsLg] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    setIsLg(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
  // T-3: raw % of the 44px strip (no [10,70] clamp — the strip is intentionally
  // narrower than MIN_VALERIA_PX; the Panel collapse bypasses minSize).
  const stripPct = Math.max(
    1,
    (STRIP_VALERIA_PX / Math.max(containerWidth, 1)) * 100,
  );
  // Default split 30% Valeria / 70% app (03-arch-fe §1.1 estado B + §2: ≥1280 split
  // 30/70 default). Still resizable + persisted (useDefaultLayout / valeriaPct) — this
  // is only the fresh default. T-2: no shellMode branch (web mode eliminated).
  const defaultValeriaPct = 30;

  // ── Imperative Group ref for snap-up (Fix A — C3 bug mitigation) ─────────
  const groupRef = useGroupRef();

  // Fix A: snap-up when containerWidth or minValeriaPct changes (hydration race +
  // valeriaState change cycle). Signals readiness once layout reconciled.
  useEffect(() => {
    if (containerWidth <= 0 || !groupRef.current) return;
    // Point 3: below lg, collapse Valeria to 0 so the agent panel takes full width
    // (Valeria renders as a drawer/overlay there, not inline). The Panel is
    // `collapsible collapsedSize={0}` so this bypasses minSize.
    if (!isLg) {
      groupRef.current.setLayout({
        [VALERIA_PANEL_ID]: 0,
        [APP_PANEL_ID]: 100,
      });
      setShellReady(true);
      return;
    }
    // T-3 state A: Valeria closed → pin the panel to the 44px tira-avatar so the
    // strip is visible (not 0, which would hide it) and the agent panel takes the
    // rest. Bypasses minSize via the `collapsible` Panel.
    if (valeriaOpen === "closed") {
      groupRef.current.setLayout({
        [VALERIA_PANEL_ID]: stripPct,
        [APP_PANEL_ID]: 100 - stripPct,
      });
      setShellReady(true);
      return;
    }
    const layout = groupRef.current.getLayout();
    const valeriaPct = layout[VALERIA_PANEL_ID];
    // Open (state B/C): if the persisted/current width is below the floor (e.g. left
    // over from the strip), snap up to minValeriaPct so the chat is legible.
    if (valeriaPct !== undefined && valeriaPct < minValeriaPct) {
      groupRef.current.setLayout({
        [VALERIA_PANEL_ID]: minValeriaPct,
        [APP_PANEL_ID]: 100 - minValeriaPct,
      });
    }
    setShellReady(true);
  }, [containerWidth, minValeriaPct, groupRef, isLg, valeriaOpen, stripPct]);

  // Persist layout across page reloads via localStorage.
  // Safe to call directly: this component is client-only via dynamic({ssr:false}).
  const layoutProps = useDefaultLayout({
    id: SHELL_GROUP_ID,
    panelIds: [VALERIA_PANEL_ID, APP_PANEL_ID],
    storage: window.localStorage,
  });

  // ── End of unconditional hooks (D3) ────────────────────────────────────────
  // No JSX branch by shellMode anymore (web mode eliminated — T-2). The single
  // resizable <Group> is the only layout. Hook count is identical across renders.

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar — always visible (48px). Right cluster [ThemeToggle][TenantSwitcher],
          no web/agentic chip (ShellModeToggle eliminated — AC-1). */}
      <TopBarGlobal />

      {/*
       * ── SINGLE <main id="main-content"> (D1) ──────────────────────────────
       *
       * ONE main element wraps ALL chrome variants. containerRef lives here so
       * ResizeObserver measures the correct element in all modes (D5).
       *
       * single-slot (D2): <AppPanelSlot>{children}</AppPanelSlot> is rendered
       * EXACTLY ONCE — inside the app-panel area. Mobile responsiveness is
       * achieved by hiding the VALERIA containers (panel + separator) via CSS
       * classes (`hidden md:flex`, `hidden md:block`), NOT by unmounting the
       * slot or adding a second slot in a separate mobile branch.
       *
       * <Group> is ALWAYS mounted (never gated by isDesktop/useMediaQuery — D4).
       * On mobile the Valeria panel container is `hidden md:flex` so it's invisible
       * but the Group itself stays mounted → hook-count stable (D3).
       *
       * CSS responsive breakdown:
       * - ≥ md (768px): Valeria panel visible + app-panel visible
       * - < md (mobile): Valeria panel hidden (className "hidden md:flex"),
       *   app-panel takes full width — single slot still in DOM exactly once
       */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-hidden"
        aria-label="Contenido principal"
        ref={containerRef}
        data-shell-ready={shellReady ? "true" : "false"}
      >
        {
          /*
           * ── Resizable 2-panel via react-resizable-panels v4 (only layout) ──
           *
           * T-2: the legacy "web mode" static grid branch is REMOVED — the shell
           * is always this resizable split (shellMode eliminated, AC-1).
           *
           * The Group is ALWAYS mounted — no `hidden md:block` on the Group
           * wrapper itself. Instead:
           * - `panel-valeria-panel` wrapper: `hidden md:flex h-full`
           *   → Valeria is hidden on mobile, visible on desktop (md+)
           * - `panel-app-panel` wrapper: `h-full min-w-0`
           *   → app-panel + AppPanelSlot always visible on any viewport
           *
           * This gives us a single slot in the DOM for all viewports.
           */
          <Group
            id={SHELL_GROUP_ID}
            orientation="horizontal"
            className="h-full"
            groupRef={groupRef}
            {...layoutProps}
            onLayoutChanged={layoutProps.onLayoutChanged}
          >
            {/*
             * Valeria panel — hidden on mobile via CSS (not via conditional mount).
             * The `hidden md:flex` wrapper means react-resizable-panels still
             * mounts the Panel but its container is invisible on mobile (height=0).
             */}
            <Panel
              id={VALERIA_PANEL_ID}
              defaultSize={isLg ? defaultValeriaPct : 0}
              minSize={`${minValeriaPct}%`}
              collapsible={true}
              collapsedSize={0}
            >
              {/* ValeriaSidebar stays mounted at all widths (its drawer portals to
                  document.body); the inline aside hides itself < lg (hidden lg:grid),
                  and the Panel collapses to 0 < lg so the agent gets full width. */}
              <div className="h-full">
                <ValeriaSidebar />
              </div>
            </Panel>

            {/*
             * Separator — hidden on mobile (no resize handle needed when Valeria
             * panel container is invisible).
             */}
            <Separator
              id="shell-handle"
              className={cn(
                "hidden lg:block",
                // ★ Fix 2026-05-24: 1px visible (mockup parity) pero 8px hit area.
                "group relative w-2 shrink-0 bg-transparent cursor-col-resize outline-none",
                "after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:-translate-x-1/2",
                "after:bg-border after:transition-all after:duration-150",
                "hover:after:w-0.5 hover:after:bg-primary/60",
                "focus-visible:after:w-0.5 focus-visible:after:bg-primary",
              )}
              aria-label="Redimensionar paneles"
            />

            {/*
             * App panel — ALWAYS visible (no hidden prefix).
             * On mobile: takes full width since Valeria container is CSS-hidden.
             * Contains the single <AppPanelSlot> — the ONLY slot in the DOM.
             */}
            <Panel
              id={APP_PANEL_ID}
              defaultSize={isLg ? 100 - defaultValeriaPct : 100}
              minSize={`${minAppPct}%`}
            >
              <AppPanelSlot>{children}</AppPanelSlot>
            </Panel>
          </Group>
        }
      </main>
      {/* Sonner toast portal — required for toast() calls throughout the shell.
          Rendered here (inside client-only boundary) to avoid SSR issues.
          If absent, all toast.error/success/info calls are no-ops. */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
