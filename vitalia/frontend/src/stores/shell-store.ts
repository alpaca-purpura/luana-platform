// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
/**
 * shell-store.ts — Zustand SSR-safe store for the shell state machine.
 * vitalia-shell-core-hardening — T-1
 *
 * NEW MACHINE (03-arch-fe.md § 1.1) — replaces the legacy collapsed|rail|full + shellMode:
 *   - valeriaOpen: 'closed' | 'chat'   (A=closed tira-avatar 44px · B=chat split 30/70)
 *   - historyOpen: boolean             (ADDITIVE push — C = chat + history; NOT a 3rd conflated state)
 *   - valeriaPct: number | null        (split %; null = default 30 via useDefaultLayout)
 *   - mobileDrawerOpen: boolean        (INDEPENDENT slice — desktop NEVER auto-opens drawer)
 *
 * shellMode + ShellModeToggle + valeriaState (rail/full) + cycleValeriaState are ELIMINATED (AC-1/RN-1).
 *
 * Persisted slice (partialize): valeriaOpen + valeriaPct + mobileDrawerOpen.
 *   - historyOpen is NEVER persisted open (RN-5/RN-11) — history always starts closed on reload.
 *   - setters + _hasHydrated NOT persisted (recreated on hydration — Zustand standard).
 *
 * Storage key conserved: 'vitalia-shell-state' (SHELL_STORAGE_KEY) — E2E addInitScript + migration.
 *
 * State machine invariants:
 *   - RN-5: while valeriaOpen='closed', historyOpen is forced false (history can't show in state A).
 *   - RN-6: collapseValeria() → closed AND historyOpen=false (collapsing closes history too).
 *   - RN-5: openValeria() → chat, NEVER restores history (reopening is chat-only).
 *   - RN-7: opening history from A also opens Valeria (A → B+C) — additive.
 *
 * MIGRATION (03-arch-fe.md § 1.2, SC-18) — legacy persisted state version 0 → version 1:
 *   - 'collapsed' → { valeriaOpen: 'closed' }
 *   - 'rail'      → { valeriaOpen: 'chat', historyOpen: false }
 *   - 'full'      → { valeriaOpen: 'chat', historyOpen: false }   (NO restore history — RN-5)
 *   - corrupt / unknown → fallback { valeriaOpen: 'chat', historyOpen: false } + console.warn
 *   - shellMode is dropped (no longer a field).
 *   - NO clobber during SSR/skeleton (factory setItem NO-OP pre-hydration — ADR-vitalia-006).
 *
 * REHYDRATION: call useStoreHydration(useShellStore) from ShellOrganismLayoutClient
 * (the ssr:false dynamic chunk). Flips _hasHydrated → true and enables storage writes.
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

/** Valeria panel open state — A=closed (tira-avatar) · B=chat (split). 2 states per 03-arch-fe § 1.1 */
export type ValeriaOpen = "closed" | "chat";

/** localStorage key for shell state persistence (conserved from F1-S4) */
export const SHELL_STORAGE_KEY = "vitalia-shell-state" as const;

/** Persisted store schema version. v0 = legacy (collapsed|rail|full + shellMode); v1 = new machine. */
const SHELL_STORE_VERSION = 1;

/** Persisted slice — valeriaOpen + valeriaPct + mobileDrawerOpen (no historyOpen, no setters, no _hasHydrated) */
type PersistedState = {
  valeriaOpen: ValeriaOpen;
  /** Split % of the Valeria panel. null = default (30) via react-resizable-panels useDefaultLayout. */
  valeriaPct: number | null;
  /** Mobile drawer open/closed — INDEPENDENT slice. Default false. Desktop NEVER auto-opens it. */
  mobileDrawerOpen: boolean;
};

/** Shell store interface — extends SsrSafeHydration for factory compliance */
interface ShellStore extends SsrSafeHydration {
  // ── State ────────────────────────────────────────────────────────────────────
  /** A=closed (tira-avatar 44px, agent 100%) · B=chat (split 30/70). */
  valeriaOpen: ValeriaOpen;
  /** Additive: when true AND valeriaOpen='chat', history rail pushes (C). NEVER persisted (RN-5/11). */
  historyOpen: boolean;
  /** Valeria split %; null = default 30. */
  valeriaPct: number | null;
  /** Mobile drawer open/closed (independent slice). */
  mobileDrawerOpen: boolean;

  // ── Valeria open/close actions ────────────────────────────────────────────────
  /** Set valeriaOpen directly. When set to 'closed', historyOpen is forced false (RN-5 invariant). */
  setValeriaOpen: (open: ValeriaOpen) => void;
  /** Open Valeria (clic tira-avatar) → 'chat'. NEVER restores history (RN-5). */
  openValeria: () => void;
  /** Collapse Valeria → 'closed' AND closes history (RN-6). */
  collapseValeria: () => void;

  // ── History (additive) actions ────────────────────────────────────────────────
  /** Set history flag directly. RN-5: while valeriaOpen='closed' history CANNOT show, so opening is ignored (stays false). Use openHistory() for the additive A→B+C intent (RN-7). */
  setHistoryOpen: (open: boolean) => void;
  /** Open history → ensures Valeria is open too (A → B+C, RN-7 additive). */
  openHistory: () => void;
  /** Close history → B (chat, history closed). */
  closeHistory: () => void;
  /** Toggle history (additive: opening from A also opens Valeria). */
  toggleHistory: () => void;

  // ── valeriaPct ────────────────────────────────────────────────────────────────
  setValeriaPct: (pct: number | null) => void;

  // ── Mobile (independent slice) ────────────────────────────────────────────────
  setMobileDrawerOpen: (open: boolean) => void;
}

/** Legacy persisted shape (version 0) — for migrate(). */
type LegacyPersistedState = {
  valeriaState?: "collapsed" | "rail" | "full" | string;
  shellMode?: "agentic" | "web" | string;
  mobileDrawerOpen?: boolean;
  valeriaPct?: number | null;
};

/**
 * Sanitize a NEW-shape persisted slice on rehydrate (current version).
 * Runs on EVERY rehydrate via merge() — even when stored version === store version,
 * where Zustand skips migrate() entirely. Coerces an invalid valeriaOpen
 * (corrupt localStorage on the current schema) → fallback 'chat' + console.warn (SC-18).
 */
function sanitizePersistedSlice(raw: Record<string, unknown>): PersistedState {
  const fallback: PersistedState = {
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
      `[shell-store] Unknown valeriaOpen "${String(
        valeriaOpen,
      )}" in persisted state; falling back to defaults.`,
    );
    return { ...fallback, valeriaPct, mobileDrawerOpen };
  }

  return { valeriaOpen, valeriaPct, mobileDrawerOpen };
}

/**
 * Migrate persisted state across versions (03-arch-fe § 1.2, SC-18).
 * Returns the NEW-shape persisted slice. Never throws — corrupt → fallback + console.warn.
 */
function migrateShellState(persisted: unknown, version: number): PersistedState {
  const fallback: PersistedState = {
    valeriaOpen: "chat",
    valeriaPct: null,
    mobileDrawerOpen: false,
  };

  if (persisted === null || typeof persisted !== "object") {
    return fallback;
  }

  const raw = persisted as Record<string, unknown>;

  // ── version 0 → 1: map legacy collapsed|rail|full + drop shellMode ──────────
  if (version < 1) {
    const legacy = raw as LegacyPersistedState;
    const mobileDrawerOpen =
      typeof legacy.mobileDrawerOpen === "boolean" ? legacy.mobileDrawerOpen : false;
    const valeriaPct =
      typeof legacy.valeriaPct === "number" || legacy.valeriaPct === null
        ? (legacy.valeriaPct as number | null)
        : null;

    switch (legacy.valeriaState) {
      case "collapsed":
        return { valeriaOpen: "closed", valeriaPct, mobileDrawerOpen };
      case "rail":
      case "full":
        // RN-5: NO restore history when migrating from rail/full.
        return { valeriaOpen: "chat", valeriaPct, mobileDrawerOpen };
      default:
        // unknown legacy value → fallback + warn (SC-18)
        console.warn(
          `[shell-store] Unknown legacy valeriaState "${String(
            legacy.valeriaState,
          )}" during migration; falling back to defaults.`,
        );
        return { ...fallback, valeriaPct, mobileDrawerOpen };
    }
  }

  // ── current version: validate the new-shape value ───────────────────────────
  const valeriaOpen = raw.valeriaOpen;
  if (valeriaOpen !== "closed" && valeriaOpen !== "chat") {
    console.warn(
      `[shell-store] Unknown valeriaOpen "${String(
        valeriaOpen,
      )}" in persisted state; falling back to defaults.`,
    );
    const mobileDrawerOpen =
      typeof raw.mobileDrawerOpen === "boolean" ? raw.mobileDrawerOpen : false;
    const valeriaPct =
      typeof raw.valeriaPct === "number" || raw.valeriaPct === null
        ? (raw.valeriaPct as number | null)
        : null;
    return { ...fallback, valeriaPct, mobileDrawerOpen };
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

export const useShellStore = createSsrSafePersistedStore<ShellStore>(
  (set, get) => ({
    // ── SsrSafeHydration ────────────────────────────────────────────────────
    _hasHydrated: false,
    setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

    // ── State ─────────────────────────────────────────────────────────────────
    // Default valeriaOpen: 'chat' (B) — Valeria visible by default (03-arch-fe § 1.1).
    // Only applies on fresh load; persisted preference is respected (ADR-vitalia-006).
    valeriaOpen: "chat",
    // historyOpen always starts closed — NEVER persisted open (RN-5/RN-11).
    historyOpen: false,
    // null = default split (30) via useDefaultLayout.
    valeriaPct: null,
    // Default closed; user's choice remembered between reloads. Independent slice.
    mobileDrawerOpen: false,

    // ── Valeria open/close actions ──────────────────────────────────────────────

    setValeriaOpen: (open: ValeriaOpen) =>
      // RN-5 invariant: history can't be open while Valeria is closed (state A).
      set(open === "closed" ? { valeriaOpen: "closed", historyOpen: false } : { valeriaOpen: open }),

    // RN-5: reopening is chat-only — NEVER restores history.
    openValeria: () => set({ valeriaOpen: "chat" }),

    // RN-6: collapsing closes history too.
    collapseValeria: () => set({ valeriaOpen: "closed", historyOpen: false }),

    // ── History (additive) actions ──────────────────────────────────────────────

    setHistoryOpen: (open: boolean) => {
      if (!open) {
        set({ historyOpen: false });
        return;
      }
      // RN-5 invariant: history can't show while Valeria is closed (state A).
      // setHistoryOpen is the literal field setter — it does NOT auto-open
      // Valeria. The additive A → B+C intent lives in openHistory() (RN-7).
      if (get().valeriaOpen === "closed") {
        set({ historyOpen: false });
        return;
      }
      set({ historyOpen: true });
    },

    openHistory: () => set({ valeriaOpen: "chat", historyOpen: true }),

    closeHistory: () => set({ historyOpen: false }),

    toggleHistory: () => {
      if (get().historyOpen) {
        set({ historyOpen: false });
      } else {
        // RN-7 additive: opening also opens Valeria.
        set({ valeriaOpen: "chat", historyOpen: true });
      }
    },

    // ── valeriaPct ──────────────────────────────────────────────────────────────

    setValeriaPct: (pct: number | null) => set({ valeriaPct: pct }),

    // ── Mobile (independent slice) ────────────────────────────────────────────────

    setMobileDrawerOpen: (open: boolean) => set({ mobileDrawerOpen: open }),
  }),
  {
    name: SHELL_STORAGE_KEY,
    version: SHELL_STORE_VERSION,
    migrate: (persisted, version) => migrateShellState(persisted, version) as Partial<ShellStore>,
    // Only persist state fields — NOT setters, NOT _hasHydrated, NOT historyOpen (RN-5/11).
    partialize: (state): PersistedState => ({
      valeriaOpen: state.valeriaOpen,
      valeriaPct: state.valeriaPct,
      mobileDrawerOpen: state.mobileDrawerOpen,
    }),
    // merge() runs on EVERY rehydrate (unlike migrate(), which Zustand skips when
    // stored version === store version). It is the only hook that sees corrupt
    // current-schema localStorage (e.g. valeriaOpen='bogus' at version 1) — so the
    // SC-18 sanitization for the current version lives here, not in migrate().
    merge: (persistedState, currentState): ShellStore => {
      const slice =
        persistedState !== null && typeof persistedState === "object"
          ? sanitizePersistedSlice(persistedState as Record<string, unknown>)
          : { valeriaOpen: "chat" as ValeriaOpen, valeriaPct: null, mobileDrawerOpen: false };
      return {
        ...currentState,
        ...slice,
        // RN-5/RN-11: history is NEVER persisted open — always starts closed.
        // RN-5: while valeriaOpen='closed', history cannot show (force false).
        historyOpen: false,
      };
    },
  },
);
