/**
 * agenda-store.ts — Zustand drawer state store for Valeria Agenda.
 * T-12 vitalia-fase2-valeria-agenda
 *
 * Persists drawerWidth to localStorage key "vitalia.agenda.drawerWidth" (Q5).
 * drawerWidth constrained to [440, 640] px — per 03-arch.md § 6.5.
 *
 * Named exports only — NO default exports (FSD-Lite boundary enforcement).
 * downstream-regression-na: brand-local FE store; no cross-brand consumers
 * spec_anchor: 03-arch.md § 6.5 + 06-tickets.yaml T-12
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Constants ─────────────────────────────────────────────────────────────────

export const DRAWER_WIDTH_MIN = 440;
export const DRAWER_WIDTH_MAX = 640;
export const DRAWER_WIDTH_DEFAULT = 520;

const DRAWER_WIDTH_STORAGE_KEY = "vitalia.agenda.drawerWidth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DrawerState {
  /** ID of the currently selected appointment slot. Null = no selection. */
  selectedSlotId: string | null;
  /** Whether the drawer panel is open. */
  drawerOpen: boolean;
  /** Drawer width in pixels. Clamped to [440, 640]. Persisted. */
  drawerWidth: number;
}

export interface DrawerActions {
  /** Open drawer for a specific slot. */
  openDrawer: (slotId: string) => void;
  /** Close the drawer and clear selection. */
  closeDrawer: () => void;
  /** Toggle drawer open/closed for current selection. */
  toggleDrawer: () => void;
  /** Set drawer width (clamped to [440, 640]). */
  setDrawerWidth: (width: number) => void;
}

export type DrawerStore = DrawerState & DrawerActions;

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * Drawer store — controls appointment detail panel state.
 *
 * Only drawerWidth is persisted (user resize preference).
 * selectedSlotId and drawerOpen are session-only (reset on page reload).
 */
export const useDrawerStore = create<DrawerStore>()(
  persist(
    (set) => ({
      // State
      selectedSlotId: null,
      drawerOpen: false,
      drawerWidth: DRAWER_WIDTH_DEFAULT,

      // Actions
      openDrawer: (slotId: string) =>
        set({ selectedSlotId: slotId, drawerOpen: true }),

      closeDrawer: () =>
        set({ drawerOpen: false, selectedSlotId: null }),

      toggleDrawer: () =>
        set((state) => ({ drawerOpen: !state.drawerOpen })),

      setDrawerWidth: (width: number) =>
        set({
          drawerWidth: Math.min(
            DRAWER_WIDTH_MAX,
            Math.max(DRAWER_WIDTH_MIN, Math.round(width)),
          ),
        }),
    }),
    {
      name: DRAWER_WIDTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist drawerWidth — session state is ephemeral
      partialize: (state) => ({ drawerWidth: state.drawerWidth }),
    },
  ),
);
