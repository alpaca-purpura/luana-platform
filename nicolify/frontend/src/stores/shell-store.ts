// cap: shell-organism.shell-nicolify
// story-origin: platform-lift-shell-chrome-ui-kit T-N1
/**
 * shell-store.ts — Shell state store (T-N1 convergence).
 * platform-lift-shell-chrome-ui-kit T-N1
 *
 * Replaces the legacy nicolify shell-store (luanaState/splitState/shellMode)
 * with a thin wrapper around the @luana/ui-kit createShellStore factory.
 *
 * The kit exposes a generic API: supervisorOpen ('closed' | 'chat') + splitPct + mobileDrawerOpen.
 * Legacy nicolify localStorage state used luanaState ('collapsed' | 'history' | 'full').
 * migrateLuanaState maps: collapsed→'closed', history→'chat', full→'chat'.
 *
 * SC-6: storageKey 'nicolify-shell-state' preserved (e2e harness contract).
 *
 * Named exports only — no default export (FSD-Lite enforce).
 * No PHI — shell layout state only.
 * No Clerk Organizations — per MEMORY.md::no-clerk-organizations 2026-05-20.
 *
 * downstream-regression-na: brand-local store; no cross-brand consumers
 */

import { createShellStore } from "@luana/ui-kit";

import type { ShellStoreState } from "@luana/ui-kit";

// ── Canonical storage key (SC-6 — preserved for e2e + legacy migration) ──────
/** Canonical shell state key (SC-6). Used by the kit store. */
export const SHELL_STORAGE_KEY = "nicolify-shell-state" as const;

/**
 * Shell store version — bumped to 1 to trigger migrate() for stored v0 data
 * that used the legacy nicolify field names (luanaState/splitState/shellMode).
 *
 * Without this bump, Zustand skips migrate() for matching-version data and
 * silently tries to merge unknown fields → falls back to defaults.
 */
const SHELL_STORE_VERSION = 1;

// ── Migration helpers ─────────────────────────────────────────────────────────

const toBool = (v: unknown): boolean => (typeof v === "boolean" ? v : false);

/**
 * Maps legacy luanaState (3-state: collapsed/history/full) → kit supervisorOpen (closed/chat).
 * - collapsed → 'closed'
 * - history   → 'chat'  (shows history panel — maps to kit 'chat' open state)
 * - full      → 'chat'  (shows history + chat — both map to kit 'chat' open)
 * - unknown   → 'chat'  (safe default, supervisor visible)
 */
function mapLuanaStateToSupervisorOpen(raw: unknown): "closed" | "chat" {
  switch (raw) {
    case "collapsed":
      return "closed";
    case "history":
    case "full":
      return "chat";
    default:
      return "chat";
  }
}

/**
 * migrateLuanaState — migrate legacy nicolify persisted state → kit generic shape.
 *
 * Handles v0 legacy nicolify shape: {luanaState, splitState, shellMode, mobileDrawerOpen}.
 * Also handles corrupt/unknown shapes: returns defaults WITHOUT throw (Bif-5).
 *
 * SC-6 compliance: storageKey preserved; migration is transparent to the user.
 */
export function migrateLuanaState(persisted: unknown, _version: number): Partial<ShellStoreState> {
  const fallback: Partial<ShellStoreState> = {
    supervisorOpen: "chat",
    splitPct: null,
    mobileDrawerOpen: false,
  };

  // Corrupt or missing shape — return defaults WITHOUT throw (Bif-5)
  if (persisted === null || typeof persisted !== "object") return fallback;

  const raw = persisted as Record<string, unknown>;

  const mobileDrawerOpen = toBool(raw.mobileDrawerOpen);

  // Legacy v0 nicolify shape: raw.luanaState is present
  if ("luanaState" in raw) {
    const supervisorOpen = mapLuanaStateToSupervisorOpen(raw.luanaState);
    // splitState (chat-collapsed|narrow|50-50) → not used in kit; drop it (kit uses splitPct number|null)
    return { supervisorOpen, splitPct: null, mobileDrawerOpen };
  }

  // Already-migrated or partial kit shape: supervisorOpen present
  if ("supervisorOpen" in raw) {
    const so = raw.supervisorOpen;
    if (so !== "closed" && so !== "chat") return { ...fallback, mobileDrawerOpen };
    return {
      supervisorOpen: so,
      splitPct: typeof raw.splitPct === "number" ? raw.splitPct : null,
      mobileDrawerOpen,
    };
  }

  // Unknown shape — return defaults without throw
  return fallback;
}

// ── Kit store (generic API — supervisorOpen / splitPct) ──────────────────────

/**
 * useShellStoreKit — generic kit API (supervisorOpen / splitPct).
 *
 * Used by layout.tsx to wire ShellLayout from @luana/ui-kit.
 * storageKey 'nicolify-shell-state' — canonical SC-6 key.
 */
export const useShellStoreKit = createShellStore({
  storageKey: SHELL_STORAGE_KEY,
  version: SHELL_STORE_VERSION,
  migrate: migrateLuanaState,
});

/**
 * Convenience alias — matches the name consumers used before T-N1.
 * Allows IcpEntityLayoutClient + EntityWorkspaceLayout to use useShellStore
 * without file-level changes if they only read supervisorOpen/mobileDrawerOpen.
 *
 * Note: the kit API no longer exposes luanaState/cycleLuanaState/shellMode/splitState.
 * Files reading those legacy fields will get undefined at runtime — they must be
 * updated to read supervisorOpen / openSupervisor / collapseSupervisor instead.
 *
 * Transitional re-export: removed when all consumers updated.
 */
export const useShellStore = useShellStoreKit;
