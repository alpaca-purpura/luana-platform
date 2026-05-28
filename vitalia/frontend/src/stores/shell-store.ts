// cap: shell-organism.shell-vitalia
// story-origin: vitalia-fase1-s4-TBD
/**
 * shell-store.ts — Zustand store for shell layout state with localStorage persistence.
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-1
 *
 * Persists only `valeriaState` and `shellMode` (via partialize) — NOT setter functions.
 * Setters are recreated on each hydration (zustand standard pattern).
 *
 * Storage key: 'vitalia-shell-state' (SHELL_STORAGE_KEY).
 *
 * partialize strategy:
 * - valeriaState → persisted (user's last Valeria panel state)
 * - shellMode → persisted (user's last shell mode)
 * - setters → NOT persisted (recreated on hydration)
 *
 * Default values (03-arch.md § 2.5, Design Contract §6.1 override):
 * - valeriaState: 'full'  ← architect override DC §6.1 'rail' (mockup ratificado Chris shows full)
 * - shellMode: 'agentic'  ← default mode for Vitalia MVP
 *
 * cycleValeriaState: rail ↔ full (collapsed only via direct setValeriaState).
 *
 * Named export (no default export) per FSD-Lite enforce.
 * HIPAA-lite: no-phi-scope — shell layout state, no PHI.
 * No Clerk Organizations used — per MEMORY.md::no-clerk-organizations 2026-05-20.
 *
 * downstream-regression-na: brand-local store; no cross-brand consumers
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Valeria panel display state — 3 states per Design Contract §6.1 */
export type ValeriaState = "collapsed" | "rail" | "full";

/** Shell layout mode — agentic (split 50/50) or web (static rail) */
export type ShellMode = "agentic" | "web";

/** localStorage key for shell state persistence */
export const SHELL_STORAGE_KEY = "vitalia-shell-state" as const;

/** Persisted slice — valeriaState + shellMode only (no setters) */
type PersistedState = {
  valeriaState: ValeriaState;
  shellMode: ShellMode;
};

/** Shell store interface */
interface ShellStore {
  valeriaState: ValeriaState;
  shellMode: ShellMode;
  setValeriaState: (s: ValeriaState) => void;
  /** Cycles between rail ↔ full. Collapsed is only reachable via setValeriaState directly. */
  cycleValeriaState: () => void;
  setShellMode: (m: ShellMode) => void;
}

export const useShellStore = create<ShellStore>()(
  persist(
    (set, get) => ({
      // ── State ─────────────────────────────────────────────────────────────
      // Default valeriaState: 'full' (architect override DC §6.1 'rail')
      // Justification: mockup ratificado Chris shows Valeria with history visible (full state)
      valeriaState: "full",
      shellMode: "agentic",

      // ── Actions ───────────────────────────────────────────────────────────

      setValeriaState: (s: ValeriaState) => set({ valeriaState: s }),

      cycleValeriaState: () =>
        set({
          valeriaState: get().valeriaState === "full" ? "rail" : "full",
        }),

      setShellMode: (m: ShellMode) => set({ shellMode: m }),
    }),
    {
      name: SHELL_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist state fields — NOT setter functions
      partialize: (state): PersistedState => ({
        valeriaState: state.valeriaState,
        shellMode: state.shellMode,
      }),
    },
  ),
);
