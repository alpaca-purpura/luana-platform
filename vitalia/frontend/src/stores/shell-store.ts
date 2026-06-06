// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s4-TBD
/**
 * shell-store.ts — Zustand SSR-safe store for shell layout state with localStorage persistence.
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-1
 * Migrated to createSsrSafePersistedStore (vitalia-shell-state-persistence T-1).
 *
 * WHY MIGRATED: The raw persist() middleware auto-writes the default value during
 * SSR/skeleton/pre-hydration, clobbering user preferences on every reload (Bug #1 PROD REAL).
 * The factory wraps persist with skipHydration:true + setItem NO-OP until client rehydrate.
 * ADR-vitalia-006 documents the pattern and all 4 failed techniques.
 *
 * Persisted state: valeriaState + shellMode + mobileDrawerOpen (via partialize).
 * Setters are NOT persisted (recreated on each hydration — Zustand standard pattern).
 *
 * Storage key: 'vitalia-shell-state' (SHELL_STORAGE_KEY).
 *
 * partialize strategy:
 * - valeriaState → persisted (user's last Valeria panel state — desktop)
 * - shellMode → persisted (user's last shell mode)
 * - mobileDrawerOpen → persisted (user's last mobile drawer state — INDEPENDENT slice)
 * - _hasHydrated → NOT persisted (transient hydration flag)
 * - setters → NOT persisted (recreated on hydration)
 *
 * Default values (03-arch.md § 2.5, Design Contract §6.1 + bugfix-shell-valeria-responsive):
 * - valeriaState: 'rail'  ← Chris 2026-06-04 (Point 1: historial collapsed by default; reverts
 *                            the architect 'full' override). Frees width for the agent panel.
 * - shellMode: 'agentic'  ← default mode for Vitalia MVP
 * - mobileDrawerOpen: false ← default closed (mobile drawer starts closed; remembers via SC-5b)
 *
 * cycleValeriaState: rail ↔ full (collapsed only via direct setValeriaState).
 * setMobileDrawerOpen: independent from valeriaState — desktop 'full' NEVER auto-opens mobile drawer.
 *
 * REHYDRATION: call useStoreHydration(useShellStore) from ShellOrganismLayoutClient
 * (the ssr:false dynamic chunk). This triggers persist.rehydrate() once client-side,
 * which flips _hasHydrated → true and enables storage writes.
 *
 * Named export (no default export) per FSD-Lite enforce.
 * HIPAA-lite: no-phi-scope — shell layout state, no PHI.
 * No Clerk Organizations used — per MEMORY.md::no-clerk-organizations 2026-05-20.
 *
 * downstream-regression-na: brand-local store; no cross-brand consumers
 */

import {
  createSsrSafePersistedStore,
  type SsrSafeHydration,
} from "@luana/hooks/create-ssr-safe-persisted-store";

/** Valeria panel display state — 3 states per Design Contract §6.1 */
export type ValeriaState = "collapsed" | "rail" | "full";

/** Shell layout mode — agentic (split 50/50) or web (static rail) */
export type ShellMode = "agentic" | "web";

/** localStorage key for shell state persistence */
export const SHELL_STORAGE_KEY = "vitalia-shell-state" as const;

/** Persisted slice — valeriaState + shellMode + mobileDrawerOpen only (no setters, no _hasHydrated) */
type PersistedState = {
  valeriaState: ValeriaState;
  shellMode: ShellMode;
  /** Mobile drawer open/closed state — INDEPENDENT from valeriaState desktop slice.
   * Default false (closed). Desktop 'full' NEVER propagates to this slice.
   * Persisted so user remembers their mobile drawer preference (SC-5b). */
  mobileDrawerOpen: boolean;
};

/** Shell store interface — extends SsrSafeHydration for factory compliance */
interface ShellStore extends SsrSafeHydration {
  // ── Desktop state ──────────────────────────────────────────────────────────
  valeriaState: ValeriaState;
  shellMode: ShellMode;
  setValeriaState: (s: ValeriaState) => void;
  /** Cycles between rail ↔ full. Collapsed is only reachable via setValeriaState directly. */
  cycleValeriaState: () => void;
  setShellMode: (m: ShellMode) => void;

  // ── Mobile state (independent slice — ADR-vitalia-006 § 2, Decisión D5) ──
  /** Mobile drawer open/closed. Default false. Independent of valeriaState. */
  mobileDrawerOpen: boolean;
  /** Set mobile drawer open/closed state. Does NOT touch valeriaState. */
  setMobileDrawerOpen: (open: boolean) => void;
}

export const useShellStore = createSsrSafePersistedStore<ShellStore>(
  (set, get) => ({
    // ── SsrSafeHydration ────────────────────────────────────────────────────
    _hasHydrated: false,
    setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

    // ── Desktop State ────────────────────────────────────────────────────────
    // Default valeriaState: 'rail' (vitalia-bugfix-shell-valeria-responsive, Chris 2026-06-04).
    // Point 1: el rail del historial arranca COLLAPSED por default → 'rail' (icon rail + chat,
    // sin el panel ValeriaHistory de 280px). Esto baja el min de Valeria (580→360) y, junto al
    // default 30/70 (defaultValeriaPct, ShellOrganismLayoutClient), evita que Valeria exprima el
    // contenido del agente. Revierte el override del architect ('full') del mockup F1-S5.
    // Solo aplica a fresh load — la preferencia persistida del usuario se respeta (ADR-vitalia-006).
    valeriaState: "rail",
    shellMode: "agentic",

    // ── Mobile State (independent slice) ────────────────────────────────────
    // Default: false (drawer closed). User's choice remembered between reloads (SC-5b).
    // NEVER derived from valeriaState — desktop 'full' does NOT auto-open mobile drawer.
    mobileDrawerOpen: false,

    // ── Desktop Actions ───────────────────────────────────────────────────────

    setValeriaState: (s: ValeriaState) => set({ valeriaState: s }),

    cycleValeriaState: () =>
      set({
        valeriaState: get().valeriaState === "full" ? "rail" : "full",
      }),

    setShellMode: (m: ShellMode) => set({ shellMode: m }),

    // ── Mobile Actions ────────────────────────────────────────────────────────

    setMobileDrawerOpen: (open: boolean) => set({ mobileDrawerOpen: open }),
  }),
  {
    name: SHELL_STORAGE_KEY,
    // Only persist state fields — NOT setter functions, NOT _hasHydrated
    partialize: (state): PersistedState => ({
      valeriaState: state.valeriaState,
      shellMode: state.shellMode,
      mobileDrawerOpen: state.mobileDrawerOpen,
    }),
  },
);
