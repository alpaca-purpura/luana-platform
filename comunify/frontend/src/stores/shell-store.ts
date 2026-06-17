// cap: comunify-shell-organism
/**
 * shell-store.ts — Comunify shell state store (T-shell).
 *
 * Thin wrapper around the @luana/ui-kit createShellStore factory.
 * Comunify has no legacy store to migrate from (fresh build).
 *
 * storageKey: 'comunify-shell-state'
 * version: 1 (fresh — no legacy fields to migrate)
 *
 * Named exports only — no default export (FSD-Lite enforce).
 * No PHI — shell layout state only.
 * No Clerk Organizations — per MEMORY.md::no-clerk-organizations.
 *
 * downstream-regression-na: brand-local store; no cross-brand consumers
 */

import { createShellStore } from "@luana/ui-kit";

import type { ShellStoreState } from "@luana/ui-kit";

// ── Canonical storage key ─────────────────────────────────────────────────────
/** Canonical shell state key for Comunify. */
export const SHELL_STORAGE_KEY = "comunify-shell-state" as const;

/** Shell store version. */
const SHELL_STORE_VERSION = 1;

// ── Migration (no-op — comunify has no legacy state) ─────────────────────────

const toBool = (v: unknown): boolean => (typeof v === "boolean" ? v : false);

/**
 * migrateComunifyState — migration for comunify persisted state.
 *
 * Comunify has no legacy shell state shape (fresh brand).
 * Handles corrupt/unknown shapes: returns defaults WITHOUT throw.
 */
export function migrateComunifyState(
  persisted: unknown,
  _version: number,
): Partial<ShellStoreState> {
  const fallback: Partial<ShellStoreState> = {
    supervisorOpen: "chat",
    splitPct: null,
    mobileDrawerOpen: false,
  };

  // Corrupt or missing shape — return defaults WITHOUT throw
  if (persisted === null || typeof persisted !== "object") return fallback;

  const raw = persisted as Record<string, unknown>;
  const mobileDrawerOpen = toBool(raw.mobileDrawerOpen);

  // Valid kit shape: supervisorOpen present
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
 * storageKey 'comunify-shell-state'.
 */
export const useShellStoreKit = createShellStore({
  storageKey: SHELL_STORAGE_KEY,
  version: SHELL_STORE_VERSION,
  migrate: migrateComunifyState,
});

/**
 * Convenience alias — useShellStore matches common naming convention.
 */
export const useShellStore = useShellStoreKit;
