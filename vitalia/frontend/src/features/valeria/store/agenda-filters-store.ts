// cap: scheduling.valeria-agenda
// atomics: TBD
// story-origin: vitalia-fase2-s1-TBD
/**
 * agenda-filters-store.ts — Zustand filter + view preference store for Valeria Agenda.
 * T-12 vitalia-fase2-valeria-agenda
 *
 * Persists lastView to localStorage key "vitalia.agenda.lastView" (Q3).
 * activePreset is session-only (URL is SSoT, store is derived state for fast access).
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE store; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.5 + 06-tickets.yaml T-12
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AgendaFilter, AgendaView } from "../types/agenda.types";

// ── Constants ─────────────────────────────────────────────────────────────────

const LAST_VIEW_STORAGE_KEY = "vitalia.agenda.lastView";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FiltersState {
  /** Active preset filter chip. Null = no filter active. Session-only. */
  activePreset: AgendaFilter | null;
  /**
   * Last view used by this user. Persisted in localStorage.
   * Used to restore preferred view on page revisit when no URL param present.
   */
  lastView: AgendaView;
}

export interface FiltersActions {
  /** Set active preset filter. Pass null to clear. */
  setActivePreset: (preset: AgendaFilter | null) => void;
  /** Update last view (called when user changes view mode). */
  setLastView: (view: AgendaView) => void;
  /** Clear all filters (preserves lastView). */
  clearFilters: () => void;
}

export type FiltersStore = FiltersState & FiltersActions;

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * Filters store — manages preset chip state + view preference.
 *
 * URL is the SSoT for view + date (useAgendaFilters syncs URL ↔ store).
 * This store provides fast in-memory access and persistence for lastView.
 */
export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      // State
      activePreset: null,
      lastView: "semana",

      // Actions
      setActivePreset: (preset) => set({ activePreset: preset }),

      setLastView: (view) => set({ lastView: view }),

      clearFilters: () => set({ activePreset: null }),
    }),
    {
      name: LAST_VIEW_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist lastView — activePreset is session state (URL is SSoT)
      partialize: (state) => ({ lastView: state.lastView }),
    },
  ),
);
