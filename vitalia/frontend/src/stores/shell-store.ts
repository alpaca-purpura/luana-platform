// story-origin: platform-lift-shell-chrome-ui-kit T-V1
/**
 * shell-store.ts — Shell state store (T-V1 transition layer).
 * platform-lift-shell-chrome-ui-kit T-V1
 *
 * T-V1 introduces a dual-store export pattern for a zero-downtime chrome handoff:
 *
 *   `useShellStore`    — OLD brand-specific store (valeriaOpen / valeriaPct API).
 *                        storageKey: 'vitalia-shell-state-legacy'
 *                        Consumed by local chrome components (ValeriaSidebar,
 *                        ShellOrganismLayoutClient, ChatHeader, ValeriaCollapsedStrip)
 *                        that remain in shell-organism/ until T-V2 deletes them.
 *                        @deprecated — removed in T-V2 when chrome is deleted.
 *
 *   `useShellStoreKit` — NEW generic kit store (supervisorOpen / splitPct API).
 *                        storageKey: 'vitalia-shell-state'  (SC-6 conserved — canonical key)
 *                        Consumed by layout.tsx → ShellLayout from @luana/ui-kit.
 *                        Migrate from old key handled by migrateShellStateKit().
 *
 * SC-6: The canonical key 'vitalia-shell-state' is owned by the NEW kit store after T-V1.
 * The old chrome uses 'vitalia-shell-state-legacy' during the T-V1→T-V2 transition.
 * T-V2 deletes the legacy key after deleting the chrome.
 *
 * Named exports only — no default export (FSD-Lite enforce).
 * HIPAA-lite: not_applicable — shell layout state, no PHI.
 * No Clerk Organizations — MEMORY.md::no-clerk-organizations 2026-05-20.
 *
 * downstream-regression-na: brand-local store; no cross-brand consumers
 */

import {
  createSsrSafePersistedStore,
  type SsrSafeHydration,
} from "@luana/hooks/create-ssr-safe-persisted-store";
import { createShellStore } from "@luana/ui-kit";
import type { ShellStoreState } from "@luana/ui-kit";

// ── Canonical storage key (SC-6 — conserved for e2e + migration) ─────────────
/** Canonical shell state key (SC-6). Owned by useShellStoreKit after T-V1. */
export const SHELL_STORAGE_KEY = "vitalia-shell-state" as const;
/**
 * Legacy key for the old chrome store (transition T-V1→T-V2 only).
 * @deprecated — exported for test compatibility; removed in T-V2.
 */
export const SHELL_STORAGE_KEY_LEGACY = "vitalia-shell-state-legacy" as const;
const SHELL_STORE_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// OLD store (brand-specific API — valeriaOpen / valeriaPct)
// @deprecated: will be removed in T-V2 when chrome is deleted.
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated — removed in T-V2. Use useShellStoreKit. */
export type ValeriaOpen = "closed" | "chat";

type PersistedStateLegacy = {
  valeriaOpen: ValeriaOpen;
  valeriaPct: number | null;
  mobileDrawerOpen: boolean;
};

interface ShellStoreLegacy extends SsrSafeHydration {
  valeriaOpen: ValeriaOpen;
  historyOpen: boolean;
  valeriaPct: number | null;
  mobileDrawerOpen: boolean;
  setValeriaOpen: (open: ValeriaOpen) => void;
  openValeria: () => void;
  collapseValeria: () => void;
  setHistoryOpen: (open: boolean) => void;
  openHistory: () => void;
  closeHistory: () => void;
  toggleHistory: () => void;
  setValeriaPct: (pct: number | null) => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

type LegacyPersistedStateV0 = {
  valeriaState?: "collapsed" | "rail" | "full" | string;
  shellMode?: "agentic" | "web" | string;
  mobileDrawerOpen?: boolean;
  valeriaPct?: number | null;
};

function sanitizeLegacy(raw: Record<string, unknown>): PersistedStateLegacy {
  const fallback: PersistedStateLegacy = {
    valeriaOpen: "chat",
    valeriaPct: null,
    mobileDrawerOpen: false,
  };
  const valeriaPct =
    typeof raw.valeriaPct === "number" || raw.valeriaPct === null
      ? (raw.valeriaPct as number | null)
      : null;
  const mobileDrawerOpen =
    typeof raw.mobileDrawerOpen === "boolean" ? raw.mobileDrawerOpen : false;
  const valeriaOpen = raw.valeriaOpen;
  if (valeriaOpen !== "closed" && valeriaOpen !== "chat") {
    console.warn(
      `[shell-store] Unknown valeriaOpen "${String(valeriaOpen)}" in legacy state; defaulting.`,
    );
    return { ...fallback, valeriaPct, mobileDrawerOpen };
  }
  return { valeriaOpen, valeriaPct, mobileDrawerOpen };
}

function migrateLegacy(
  persisted: unknown,
  version: number,
): PersistedStateLegacy {
  const fallback: PersistedStateLegacy = {
    valeriaOpen: "chat",
    valeriaPct: null,
    mobileDrawerOpen: false,
  };
  if (persisted === null || typeof persisted !== "object") return fallback;
  const raw = persisted as Record<string, unknown>;
  if (version < 1) {
    const v0 = raw as LegacyPersistedStateV0;
    const mobileDrawerOpen =
      typeof v0.mobileDrawerOpen === "boolean" ? v0.mobileDrawerOpen : false;
    const valeriaPct =
      typeof v0.valeriaPct === "number" || v0.valeriaPct === null
        ? (v0.valeriaPct as number | null)
        : null;
    switch (v0.valeriaState) {
      case "collapsed":
        return { valeriaOpen: "closed", valeriaPct, mobileDrawerOpen };
      case "rail":
      case "full":
        return { valeriaOpen: "chat", valeriaPct, mobileDrawerOpen };
      default:
        // unknown legacy value → fallback + warn (SC-18)
        console.warn(
          `[shell-store] Unknown legacy valeriaState "${String(v0.valeriaState)}" during migration; falling back to defaults.`,
        );
        return { ...fallback, valeriaPct, mobileDrawerOpen };
    }
  }
  const valeriaOpen = raw.valeriaOpen;
  if (valeriaOpen !== "closed" && valeriaOpen !== "chat") {
    return {
      ...fallback,
      valeriaPct:
        typeof raw.valeriaPct === "number" || raw.valeriaPct === null
          ? (raw.valeriaPct as number | null)
          : null,
      mobileDrawerOpen:
        typeof raw.mobileDrawerOpen === "boolean"
          ? raw.mobileDrawerOpen
          : false,
    };
  }
  return {
    valeriaOpen,
    valeriaPct:
      typeof raw.valeriaPct === "number" || raw.valeriaPct === null
        ? (raw.valeriaPct as number | null)
        : null,
    mobileDrawerOpen:
      typeof raw.mobileDrawerOpen === "boolean" ? raw.mobileDrawerOpen : false,
  };
}

/**
 * OLD useShellStore — brand-specific API (valeriaOpen / valeriaPct).
 * @deprecated — removed in T-V2. Use useShellStoreKit for new code.
 */
export const useShellStore = createSsrSafePersistedStore<ShellStoreLegacy>(
  (set, get) => ({
    _hasHydrated: false,
    setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
    valeriaOpen: "chat",
    historyOpen: false,
    valeriaPct: null,
    mobileDrawerOpen: false,
    setValeriaOpen: (open: ValeriaOpen) =>
      set(
        open === "closed"
          ? { valeriaOpen: "closed", historyOpen: false }
          : { valeriaOpen: open },
      ),
    openValeria: () => set({ valeriaOpen: "chat" }),
    collapseValeria: () => set({ valeriaOpen: "closed", historyOpen: false }),
    setHistoryOpen: (open: boolean) => {
      if (!open) { set({ historyOpen: false }); return; }
      if (get().valeriaOpen === "closed") { set({ historyOpen: false }); return; }
      set({ historyOpen: true });
    },
    openHistory: () => set({ valeriaOpen: "chat", historyOpen: true }),
    closeHistory: () => set({ historyOpen: false }),
    toggleHistory: () => {
      if (get().historyOpen) {
        set({ historyOpen: false });
      } else {
        set({ valeriaOpen: "chat", historyOpen: true });
      }
    },
    setValeriaPct: (pct: number | null) => set({ valeriaPct: pct }),
    setMobileDrawerOpen: (open: boolean) => set({ mobileDrawerOpen: open }),
  }),
  {
    name: SHELL_STORAGE_KEY_LEGACY,
    version: SHELL_STORE_VERSION,
    migrate: (persisted, version) =>
      migrateLegacy(persisted, version) as Partial<ShellStoreLegacy>,
    partialize: (state): PersistedStateLegacy => ({
      valeriaOpen: state.valeriaOpen,
      valeriaPct: state.valeriaPct,
      mobileDrawerOpen: state.mobileDrawerOpen,
    }),
    merge: (persistedState, currentState): ShellStoreLegacy => {
      const slice =
        persistedState !== null && typeof persistedState === "object"
          ? sanitizeLegacy(persistedState as Record<string, unknown>)
          : { valeriaOpen: "chat" as ValeriaOpen, valeriaPct: null, mobileDrawerOpen: false };
      return { ...currentState, ...slice, historyOpen: false };
    },
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// NEW kit store (generic API — supervisorOpen / splitPct)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Migrate legacy persisted state → kit generic shape.
 * Handles both v0 (legacy collapsed/rail/full) and v1 (valeriaOpen/valeriaPct).
 */
function migrateShellStateKit(
  persisted: unknown,
  version: number,
): Partial<ShellStoreState> {
  const fallback: Partial<ShellStoreState> = {
    supervisorOpen: "chat",
    splitPct: null,
    mobileDrawerOpen: false,
  };
  if (persisted === null || typeof persisted !== "object") return fallback;
  const raw = persisted as Record<string, unknown>;

  const toPct = (v: unknown): number | null =>
    typeof v === "number" || v === null ? (v as number | null) : null;
  const toBool = (v: unknown): boolean =>
    typeof v === "boolean" ? v : false;

  if (version < 1) {
    const splitPct = toPct(raw.valeriaPct);
    const mobileDrawerOpen = toBool(raw.mobileDrawerOpen);
    switch (raw.valeriaState) {
      case "collapsed":
        return { supervisorOpen: "closed", splitPct, mobileDrawerOpen };
      case "rail":
      case "full":
        return { supervisorOpen: "chat", splitPct, mobileDrawerOpen };
      default:
        return { ...fallback, splitPct, mobileDrawerOpen };
    }
  }

  // v1 — map vitalia-specific field names → generic kit names
  const splitPct = toPct(raw.splitPct ?? raw.valeriaPct);
  const mobileDrawerOpen = toBool(raw.mobileDrawerOpen);
  const rawOpen = raw.supervisorOpen ?? raw.valeriaOpen;
  if (rawOpen !== "closed" && rawOpen !== "chat") {
    return { ...fallback, splitPct, mobileDrawerOpen };
  }
  return {
    supervisorOpen: rawOpen as "closed" | "chat",
    splitPct,
    mobileDrawerOpen,
  };
}

/**
 * NEW useShellStoreKit — generic kit API (supervisorOpen / splitPct).
 *
 * Used by layout.tsx to wire ShellLayout from @luana/ui-kit (T-V1).
 * storageKey 'vitalia-shell-state' — canonical SC-6 key, owned by this store after T-V1.
 * T-V2 renames this export back to `useShellStore` after deleting the old chrome.
 */
export const useShellStoreKit = createShellStore({
  storageKey: SHELL_STORAGE_KEY,
  version: SHELL_STORE_VERSION,
  migrate: migrateShellStateKit,
});
