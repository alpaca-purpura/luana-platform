// cap: platform.lift-shell-chrome-ui-kit
"use client";

/**
 * ShellLayoutClient — brand-agnostic shell chrome splitter (T-K2 port).
 *
 * VERBATIM port of vitalia ShellOrganismLayoutClient (fixes v4 SAGRADOS) made
 * brand-agnostic. The binary state machine, the react-resizable-panels v4
 * footgun workarounds, and the ★ Live-fix 2026-06-11 comments are preserved
 * byte-for-byte; only NAMES are generic (no Valeria / no vitalia / no brand
 * tokens in logic) and brand data flows in BY PROP:
 *   - supervisorSlug/Name/Avatar/Initial/Thumbnail, agentCatalog, getAgentClasses
 *   - useShellStore / useChatStore (zustand hooks)
 *   - splitGroupId (localStorage namespace, was SHELL_GROUP_ID const)
 *   - onNavigate, logoSlot, rightClusterSlot, labels
 *
 * react-resizable-panels v4.11.1 footgun (do NOT touch without re-reading
 * useDefaultLayout source): collapsible/collapsedSize/minSize props are
 * CAPTURED AT MOUNT. Runtime open↔closed therefore needs a `key` REMOUNT of
 * the supervisor panel; `collapse()` bypasses minSize → uses collapsedSize;
 * `expand()` must run before `setLayout` on re-open. number = PX, "NN%" = %.
 *
 * NOTE: this file is rendered ONLY inside the dynamic({ssr:false}) boundary of
 * ShellLayout.tsx — see ShellLayout for the SSR-crash rationale.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// react-resizable-panels Group/Separator aliased locally — kit already exports a
// form-field `Group` + a `./separator` primitive; re-exporting these would collide.
import {
  Group as ResizableGroup,
  Panel,
  Separator as ResizeSeparator,
  useDefaultLayout,
  useGroupRef,
  usePanelRef,
} from "react-resizable-panels";
import { cn } from "@luana/format/utils";
import { Toaster } from "../../sonner";
import type { ShellLayoutProps, ShellStoreState } from "./types";
import { SUPERVISOR_MIN_PX } from "./useViewportGuard";
import { useViewportGuard } from "./useViewportGuard";
import { TopBarShell } from "./TopBarShell";
import { SupervisorSidebar } from "./SupervisorSidebar";
import type { SupervisorSidebarLabels } from "./SupervisorSidebar";
import { AppPanelSlot } from "./AppPanelSlot";
import { ChatPanel } from "./ChatPanel";

/** Generic panel ids (was VALERIA_PANEL_ID / APP_PANEL_ID — brand-agnostic). */
const SUPERVISOR_PANEL_ID = "supervisor-panel";
const APP_PANEL_ID = "app-panel";

/** Minimum px for the application (right) panel. */
const MIN_APP_PX = 480;
/** Collapsed-strip width (px) of the supervisor panel in the desktop split. */
const STRIP_SUPERVISOR_PX = 44;
/** Default supervisor panel size (%) when opened in chat mode. */
const DEFAULT_SUPERVISOR_PCT = 30;
/** History-push width (px) — RN-7 280px reconcile. */
const HISTORY_PX = 280;

/** Tailwind `lg` breakpoint (px) — matches DRAWER_BREAKPOINT contract. */
const LG_BREAKPOINT = 1024;

/**
 * useIsLg — true at/above the lg breakpoint. Drives inline-split vs drawer.
 * matchMedia listener; SSR-safe default false (this file is ssr:false anyway).
 */
function useIsLg(): boolean {
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const apply = () => setIsLg(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isLg;
}

/**
 * useContainerWidth — observes the split container width (px) for the
 * percent↔px clamp math. ResizeObserver; returns 0 until first measure.
 */
function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Default SupervisorSidebarLabels — brand may override via ShellLayoutLabels. */
function buildSupervisorLabels(
  supervisorName: string,
  labels?: Partial<{ openSupervisor: string; collapseSupervisor: string }>,
): SupervisorSidebarLabels {
  return {
    panel: supervisorName,
    drawerClose: labels?.collapseSupervisor ?? `Cerrar ${supervisorName}`,
    liveHistory: "Historial abierto",
    liveClosed: `${supervisorName} cerrado`,
    liveOpen: `${supervisorName} abierto`,
    openStrip: labels?.openSupervisor ?? `Abrir a ${supervisorName}`,
    history: {},
  };
}

export function ShellLayoutClient({
  children,
  supervisorName,
  supervisorSlug,
  supervisorAvatar,
  supervisorInitial,
  supervisorThumbnail,
  agentCatalog,
  ribbonOrder,
  subTabsByAgent,
  shippedStaticSubtabs,
  getAgentClasses,
  useShellStore,
  useChatStore,
  splitGroupId,
  logoSlot,
  rightClusterSlot,
  labels,
  onNavigate,
  testIds,
  statusDotClass,
}: ShellLayoutProps) {
  // Shell UI store (binary machine) — injected by the brand (persisted).
  // The strip/header toggles (openSupervisor/collapseSupervisor) live inside
  // SupervisorSidebar; this layout only READS the machine for split sizing.
  const supervisorOpen = useShellStore((s: ShellStoreState) => s.supervisorOpen);
  const historyOpen = useShellStore((s: ShellStoreState) => s.historyOpen);
  const setSplitPct = useShellStore((s: ShellStoreState) => s.setSplitPct);

  // Store-inert viewport contract (D3 stable hook — call unconditionally).
  useViewportGuard();

  const isLg = useIsLg();

  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);

  const groupRef = useGroupRef();
  const supervisorPanelRef = usePanelRef();

  // Persisted split layout (localStorage namespaced by splitGroupId).
  const { defaultLayout, onLayoutChanged: persistLayout } = useDefaultLayout({
    id: splitGroupId,
    panelIds: [SUPERVISOR_PANEL_ID, APP_PANEL_ID],
  });

  // ─── px ↔ percent clamp math (binary machine) ──────────────────────────────
  // Minimum supervisor width as a percent of the current container.
  const minSupervisorPct = useMemo(() => {
    if (!containerWidth) return 0;
    return (SUPERVISOR_MIN_PX / containerWidth) * 100;
  }, [containerWidth]);

  // Effective min while the panel can host the inline chat.
  const minSupervisorEffectivePct = useMemo(() => {
    return Math.max(minSupervisorPct, 0);
  }, [minSupervisorPct]);

  const minAppPct = useMemo(() => {
    if (!containerWidth) return 0;
    return (MIN_APP_PX / containerWidth) * 100;
  }, [containerWidth]);

  // Collapsed-strip size expressed as % of the container (for closed state).
  const stripPct = useMemo(() => {
    if (!containerWidth) return 0;
    return (STRIP_SUPERVISOR_PX / containerWidth) * 100;
  }, [containerWidth]);

  // History push width expressed as % of the container.
  const histPct = useMemo(() => {
    if (!containerWidth) return 0;
    return (HISTORY_PX / containerWidth) * 100;
  }, [containerWidth]);

  // Whether the supervisor panel is collapsible in the current state.
  const supervisorCollapsible = supervisorOpen === "closed" || !isLg;

  // ─── ★ Live-fix 2026-06-11: retry-rAF collapse ─────────────────────────────
  // react-resizable-panels v4 captures `collapsible`/`collapsedSize` AT MOUNT;
  // after a key-remount the panel ref may not be wired on the first frame, so
  // imperative collapse() can no-op. Retry across up to 30 animation frames
  // until the ref answers, then collapse to the strip (bypasses minSize → uses
  // collapsedSize). DO NOT replace with a single-shot effect.
  useEffect(() => {
    if (supervisorOpen !== "closed" || !isLg) return;
    let frames = 0;
    let raf = 0;
    const tryCollapse = () => {
      const panel = supervisorPanelRef.current;
      if (panel && typeof panel.collapse === "function") {
        panel.collapse();
        return;
      }
      if (frames++ < 30) {
        raf = requestAnimationFrame(tryCollapse);
      }
    };
    raf = requestAnimationFrame(tryCollapse);
    return () => cancelAnimationFrame(raf);
    // deps SAGRADAS — verbatim from source (do not "optimize").
  }, [containerWidth, minSupervisorPct, groupRef, supervisorPanelRef, isLg, supervisorOpen, stripPct]);

  // ─── ★ Live-fix 2026-06-11: retry-rAF RN-7 history-push (280px) ─────────────
  // When history opens, push the split layout left by histPct so the history
  // rail (280px) docks without overlapping the app panel. Same v4 mount-capture
  // hazard → retry across up to 30 frames until the group ref answers, then
  // apply the adjusted layout. DO NOT collapse to a single setLayout call.
  useEffect(() => {
    if (!historyOpen || !isLg || supervisorOpen === "closed") return;
    let frames = 0;
    let raf = 0;
    const apply = () => {
      const group = groupRef.current;
      if (group && typeof group.setLayout === "function") {
        const supervisor = Math.max(
          minSupervisorPct,
          DEFAULT_SUPERVISOR_PCT + histPct,
        );
        const app = Math.max(minAppPct, 100 - supervisor);
        // v4: setLayout accepts {[panelId: string]: number}, NOT number[].
        group.setLayout({ [SUPERVISOR_PANEL_ID]: supervisor, [APP_PANEL_ID]: app });
        return;
      }
      if (frames++ < 30) {
        raf = requestAnimationFrame(apply);
      }
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
    // deps SAGRADAS — verbatim from source.
  }, [historyOpen, isLg, supervisorOpen, groupRef, histPct, minSupervisorPct, minAppPct]);

  // Persist split changes back to the shell store (percent of supervisor panel).
  // v4 Layout = { [panelId: string]: number } (NOT number[]).
  const handleLayout = useCallback(
    (layout: { [panelId: string]: number }) => {
      const supervisorPct = layout[SUPERVISOR_PANEL_ID];
      if (typeof supervisorPct === "number") {
        setSplitPct(supervisorPct);
      }
      // Also persist via useDefaultLayout callback.
      persistLayout(layout);
    },
    [setSplitPct, persistLayout],
  );

  // Default size of the supervisor panel: 0 on mobile, strip when closed, else
  // the persisted/default open size.
  const supervisorDefaultSize = !isLg
    ? 0
    : supervisorOpen === "closed"
      ? stripPct
      : (defaultLayout?.[SUPERVISOR_PANEL_ID] ?? DEFAULT_SUPERVISOR_PCT);

  // key REMOUNT discriminator (A=strip, B=chat, C=history-push, mobile=drawer).
  // The key VALUE is internal (not a testid); semantics preserved verbatim.
  const supervisorKey = `supervisor-${
    !isLg ? "mobile" : supervisorOpen === "closed" ? "A" : historyOpen ? "C" : "B"
  }`;

  // Build supervisor labels with per-brand overrides from `labels`.
  const supervisorLabels = buildSupervisorLabels(supervisorName, labels);

  // Build the injected chat slot (ChatPanel with brand-injected stores + classes).
  const chatSlot = (
    <ChatPanel
      supervisor={
        agentCatalog.find((d) => d.slug === supervisorSlug) ?? agentCatalog[0] ?? {
          slug: supervisorSlug,
          name: supervisorName,
          initial: supervisorInitial ?? supervisorName[0] ?? "?",
          role: "",
          colorToken: "",
          colorSoftToken: "",
          tabLabel: supervisorName,
          defaultSubtab: "",
          thumbnail: supervisorThumbnail,
        }
      }
      agentCatalog={Object.fromEntries(agentCatalog.map((d) => [d.slug, d]))}
      status="online"
      useShellStore={useShellStore}
      useChatStore={useChatStore}
      getAgentClasses={getAgentClasses}
      statusDotClass={statusDotClass}
      testIds={testIds}
    />
  );

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-background text-foreground"
      data-shell-ready="true"
    >
      <TopBarShell
        supervisorName={supervisorName}
        useShellStore={useShellStore}
        logoSlot={logoSlot}
        rightClusterSlot={rightClusterSlot}
        labels={labels}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-h-0 overflow-hidden"
        aria-label={labels?.mainContent ?? "Contenido principal"}
      >
        {isLg ? (
          <div ref={containerRef} className="h-full w-full">
            {/* v4: id not groupId, onLayoutChanged not onLayout, groupRef stays. */}
            <ResizableGroup
              groupRef={groupRef}
              id={splitGroupId}
              orientation="horizontal"
              className="h-full w-full"
              onLayoutChanged={handleLayout}
              defaultLayout={defaultLayout}
            >
              {/* v4: id not panelId, panelRef stays. */}
              <Panel
                key={supervisorKey}
                panelRef={supervisorPanelRef}
                id={SUPERVISOR_PANEL_ID}
                // v4: PX number for collapsedSize (strip), "%" string for minSize.
                collapsible={supervisorCollapsible}
                collapsedSize={isLg ? STRIP_SUPERVISOR_PX : 0}
                defaultSize={supervisorDefaultSize}
                minSize={`${minSupervisorEffectivePct}%`}
                className="min-h-0"
              >
                {/* SupervisorSidebar owns all three states (A/B/C) + mobile drawer
                    (createPortal). Single instance per layout — no duplicate mobile render. */}
                <SupervisorSidebar
                  supervisorSlug={supervisorSlug}
                  supervisorName={supervisorName}
                  supervisorInitial={supervisorInitial}
                  supervisorThumbnail={supervisorThumbnail}
                  getAgentClasses={getAgentClasses}
                  useShellStore={useShellStore}
                  useChatStore={useChatStore}
                  chatSlot={chatSlot}
                  labels={supervisorLabels}
                  testIds={testIds}
                  statusDotClass={statusDotClass}
                />
              </Panel>

              <ResizeSeparator
                className={cn(
                  "w-px shrink-0 bg-border transition-colors",
                  "hover:bg-primary/40 data-[resizing]:bg-primary/60",
                )}
                // strip state: separator is non-interactive (panel is collapsed).
                disabled={supervisorOpen === "closed"}
              />

              <Panel
                id={APP_PANEL_ID}
                minSize={`${minAppPct}%`}
                className="min-h-0"
              >
                <AppPanelSlot
                  agentCatalog={agentCatalog}
                  ribbonOrder={ribbonOrder}
                  subTabsByAgent={subTabsByAgent}
                  shippedStaticSubtabs={shippedStaticSubtabs}
                  getAgentClasses={getAgentClasses}
                  useShellStore={useShellStore}
                  labels={labels}
                  onNavigate={onNavigate}
                >
                  {children}
                </AppPanelSlot>
              </Panel>
            </ResizableGroup>
          </div>
        ) : (
          // Mobile: app panel full-bleed; SupervisorSidebar handles its own
          // drawer internally via createPortal (mobileDrawerOpen slice).
          <div className="h-full w-full">
            <AppPanelSlot
              agentCatalog={agentCatalog}
              ribbonOrder={ribbonOrder}
              subTabsByAgent={subTabsByAgent}
              shippedStaticSubtabs={shippedStaticSubtabs}
              getAgentClasses={getAgentClasses}
              useShellStore={useShellStore}
              labels={labels}
              onNavigate={onNavigate}
            >
              {children}
            </AppPanelSlot>
            {/* Mobile drawer — SupervisorSidebar renders via createPortal when
                mobileDrawerOpen=true; isMobile branch = non-intrusive in DOM. */}
            <SupervisorSidebar
              supervisorSlug={supervisorSlug}
              supervisorName={supervisorName}
              supervisorInitial={supervisorInitial}
              supervisorThumbnail={supervisorThumbnail}
              getAgentClasses={getAgentClasses}
              useShellStore={useShellStore}
              useChatStore={useChatStore}
              chatSlot={chatSlot}
              labels={supervisorLabels}
              testIds={testIds}
              statusDotClass={statusDotClass}
            />
          </div>
        )}
      </main>

      <Toaster />
    </div>
  );
}

export type { ShellLayoutProps };
