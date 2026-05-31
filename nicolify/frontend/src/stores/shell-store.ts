// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3
/**
 * shell-store.ts — Zustand SSR-safe store for shell layout state with localStorage persistence.
 * nicolify-r0-shell T-3
 * Port re-tematizado from vitalia shell-store.ts (Valeria→Luana + nicolify agent model).
 *
 * WHY SSR-SAFE: The raw persist() middleware auto-writes the default value during
 * SSR/skeleton/pre-hydration, clobbering user preferences on every reload (Vitalia Bug C3).
 * The factory wraps persist with skipHydration:true + setItem NO-OP until client rehydrate.
 * ADR-vitalia-006 documents the pattern and all 4 failed techniques. Applied here via G2 gate.
 *
 * Persisted state: luanaState + splitState + shellMode + mobileDrawerOpen (via partialize).
 * Setters are NOT persisted (recreated on each hydration — Zustand standard pattern).
 *
 * Storage key: 'nicolify-shell-state' (SHELL_STORAGE_KEY).
 *
 * partialize strategy:
 * - luanaState → persisted (user's last Luana panel state — desktop)
 * - splitState → persisted (user's last splitter state)
 * - shellMode → persisted (user's last shell mode)
 * - mobileDrawerOpen → persisted (user's last mobile drawer state — INDEPENDENT slice)
 * - _hasHydrated → NOT persisted (transient hydration flag)
 * - setters → NOT persisted (recreated on hydration)
 *
 * Default values (nicolify R0 shell design):
 * - luanaState: 'full' ← Luana panel abierto (historial + chat) on load (mockup ratificado)
 * - splitState: '50-50' ← Luana panel y app panel comparten el ancho
 * - shellMode: 'agentic' ← default mode for Nicolify R0
 * - mobileDrawerOpen: false ← default closed (mobile drawer starts closed)
 *
 * cycleLuanaState: collapsed → history → full → collapsed (3-state cycle).
 * setMobileDrawerOpen: independent from luanaState — desktop 'full' NEVER auto-opens mobile drawer.
 *
 * REHYDRATION: call useStoreHydration(useShellStore) from ShellOrganismLayoutClient
 * (the ssr:false dynamic chunk). This triggers persist.rehydrate() once client-side,
 * which flips _hasHydrated → true and enables storage writes.
 *
 * Named export (no default export) per FSD-Lite enforce.
 * No PHI — shell layout state only.
 * No Clerk Organizations used — per MEMORY.md::no-clerk-organizations 2026-05-20.
 *
 * downstream-regression-na: brand-local store; no cross-brand consumers
 */

import {
  createSsrSafePersistedStore,
  type SsrSafeHydration,
} from "@luana/hooks/create-ssr-safe-persisted-store";

/** Luana sidebar/panel display state — 3 states (Nicolify R0) */
export type LuanaState = "collapsed" | "history" | "full";

/** Shell split state — 3 splitter positions (per 01-spec.md C1-C3) */
export type ShellSplitState = "chat-collapsed" | "narrow" | "50-50";

/** Shell layout mode — agentic (split dual-panel) or web (static rail) */
export type ShellMode = "agentic" | "web";

/** localStorage key for shell state persistence */
export const SHELL_STORAGE_KEY = "nicolify-shell-state" as const;

/** Persisted slice — luanaState + splitState + shellMode + mobileDrawerOpen only (no setters, no _hasHydrated) */
interface PersistedState {
  luanaState: LuanaState;
  splitState: ShellSplitState;
  shellMode: ShellMode;
  /** Mobile drawer open/closed state — INDEPENDENT from luanaState desktop slice.
   * Default false (closed). Desktop 'full' NEVER propagates to this slice.
   * Persisted so user remembers their mobile drawer preference (ADR-vitalia-006 D5). */
  mobileDrawerOpen: boolean;
}

/** Shell store interface — extends SsrSafeHydration for factory compliance */
interface ShellStore extends SsrSafeHydration {
  // ── Desktop state ──────────────────────────────────────────────────────────
  /** Luana panel state: collapsed/history/full */
  luanaState: LuanaState;
  /** Splitter state: chat-collapsed/narrow/50-50 */
  splitState: ShellSplitState;
  /** Shell layout mode */
  shellMode: ShellMode;
  setLuanaState: (s: LuanaState) => void;
  /** Cycles: collapsed → history → full → collapsed */
  cycleLuanaState: () => void;
  setSplitState: (s: ShellSplitState) => void;
  setShellMode: (m: ShellMode) => void;

  // ── Mobile state (independent slice — ADR-vitalia-006 § D5) ──────────────
  /** Mobile drawer open/closed. Default false. Independent of luanaState. */
  mobileDrawerOpen: boolean;
  /** Set mobile drawer open/closed state. Does NOT touch luanaState. */
  setMobileDrawerOpen: (open: boolean) => void;
}

export const useShellStore = createSsrSafePersistedStore<ShellStore>(
  (set: (partial: Partial<ShellStore>) => void, get: () => ShellStore) => ({
    // ── SsrSafeHydration ────────────────────────────────────────────────────
    _hasHydrated: false,
    setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

    // ── Desktop State ────────────────────────────────────────────────────────
    // Default luanaState: 'full' (Luana panel abierto: historial 280px + chat).
    // Justificación: el mockup ratificado del shell muestra a Luana abierta como
    // orquestadora. 'collapsed' dejaba una franja de 60px VACÍA en desktop (sin
    // rail ni chat ni affordance de apertura — bug visual). Alineado con vitalia,
    // cuyo default es 'full' por la misma razón (mockup con panel visible).
    luanaState: "full",
    splitState: "50-50",
    shellMode: "agentic",

    // ── Mobile State (independent slice) ────────────────────────────────────
    mobileDrawerOpen: false,

    // ── Desktop Actions ───────────────────────────────────────────────────────

    setLuanaState: (s: LuanaState) => set({ luanaState: s }),

    /**
     * Cycles: collapsed → history → full → collapsed
     * Allows progressive reveal of Luana sidebar.
     * Collapsed-only reachable directly via setLuanaState.
     */
    cycleLuanaState: () => {
      const current = get().luanaState;
      let next: LuanaState;
      if (current === "collapsed") {
        next = "history";
      } else if (current === "history") {
        next = "full";
      } else {
        next = "collapsed";
      }
      set({ luanaState: next });
    },

    setSplitState: (s: ShellSplitState) => set({ splitState: s }),

    setShellMode: (m: ShellMode) => set({ shellMode: m }),

    // ── Mobile Actions ────────────────────────────────────────────────────────

    setMobileDrawerOpen: (open: boolean) => set({ mobileDrawerOpen: open }),
  }),
  {
    name: SHELL_STORAGE_KEY,
    // Only persist state fields — NOT setter functions, NOT _hasHydrated
    partialize: (state: ShellStore): PersistedState => ({
      luanaState: state.luanaState,
      splitState: state.splitState,
      shellMode: state.shellMode,
      mobileDrawerOpen: state.mobileDrawerOpen,
    }),
  },
);
