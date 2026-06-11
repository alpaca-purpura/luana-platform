// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
/**
 * shell-store-hydration.test.ts — TDD RED-first SSR-safe hydration + legacy-migration tests.
 * vitalia-shell-core-hardening — T-1
 *
 * Covers (new machine, 03-arch-fe.md § 1.1 + § 1.2):
 *
 * SC-1/SC-5 SSR-safe (no-clobber — ADR-vitalia-006):
 *   - Seed localStorage with a NEW-shape preference
 *   - Pre-hydration window: store created, mutations happen, NO setItem to the key
 *   - Post-rehydrate: value comes from storage (not the default)
 *
 * SC-18 legacy migration (no-crash):
 *   - Old shape {valeriaState:'collapsed'|'rail'|'full', shellMode} migrates:
 *       collapsed → valeriaOpen='closed'
 *       rail      → valeriaOpen='chat', historyOpen=false
 *       full      → valeriaOpen='chat', historyOpen=false (NO restore history — RN-5)
 *   - corrupt / unknown → fallback {valeriaOpen:'chat', historyOpen:false} + console.warn
 *   - NO clobber during SSR/skeleton (factory setItem NO-OP pre-hydration)
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local store test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act } from "@testing-library/react";
// T-V1 dual-store: useShellStore is the @deprecated legacy store (valeriaOpen API).
// It now uses SHELL_STORAGE_KEY_LEGACY ('vitalia-shell-state-legacy').
// SHELL_STORAGE_KEY is the canonical key owned by useShellStoreKit after T-V1.
// These tests verify legacy SSR-safe hydration + migration (still needed until T-V2).
import { useShellStore, SHELL_STORAGE_KEY_LEGACY } from "../shell-store";
const SHELL_STORAGE_KEY = SHELL_STORAGE_KEY_LEGACY;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Seed localStorage with the NEW shape (version current). */
function seedNew(
  valeriaOpen: string,
  valeriaPct: number | null = null,
  mobileDrawerOpen = false,
) {
  localStorage.setItem(
    SHELL_STORAGE_KEY,
    JSON.stringify({
      state: { valeriaOpen, valeriaPct, mobileDrawerOpen },
      version: 1,
    }),
  );
}

/** Seed localStorage with the LEGACY shape (version 0) for migration tests. */
function seedLegacy(
  valeriaState: string,
  shellMode = "agentic",
  mobileDrawerOpen = false,
) {
  localStorage.setItem(
    SHELL_STORAGE_KEY,
    JSON.stringify({
      state: { valeriaState, shellMode, mobileDrawerOpen },
      version: 0,
    }),
  );
}

function clearStorage() {
  localStorage.removeItem(SHELL_STORAGE_KEY);
}

async function rehydrate() {
  await act(async () => {
    await useShellStore.persist.rehydrate();
    await new Promise((r) => setTimeout(r, 0));
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("shell-store SSR-safe hydration + legacy migration", () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clearStorage();
    useShellStore.setState({
      valeriaOpen: "chat",
      historyOpen: false,
      valeriaPct: null,
      mobileDrawerOpen: false,
      _hasHydrated: false,
    });
    setItemSpy = vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearStorage();
  });

  // ── SC-1/SC-5 no-clobber during SSR/pre-hydration ─────────────────────────

  describe("SC-1/SC-5 no-clobber — NO write espurio del default during pre-hydration", () => {
    it("does NOT write to storage while _hasHydrated=false", () => {
      seedNew("closed");
      setItemSpy.mockClear();

      expect(useShellStore.getState()._hasHydrated).toBe(false);

      const writesForKey = setItemSpy.mock.calls.filter(
        ([k]) => k === SHELL_STORAGE_KEY,
      );
      expect(writesForKey).toHaveLength(0);
    });

    it("after rehydrate, valeriaOpen comes from storage (not clobbered to default)", async () => {
      seedNew("closed");

      await rehydrate();

      expect(useShellStore.getState()._hasHydrated).toBe(true);
      expect(useShellStore.getState().valeriaOpen).toBe("closed");
    });

    it("mutations before rehydrate don't persist to storage (NO-OP)", async () => {
      seedNew("closed");
      setItemSpy.mockClear();

      act(() => {
        useShellStore.getState().setValeriaOpen("chat");
      });

      const writesForKey = setItemSpy.mock.calls.filter(
        ([k]) => k === SHELL_STORAGE_KEY,
      );
      expect(writesForKey).toHaveLength(0);

      // After rehydrate, state comes from localStorage (closed), not the mutation
      await rehydrate();
      expect(useShellStore.getState().valeriaOpen).toBe("closed");
    });

    it("post-hydrate mutation writes to storage (single clean write)", async () => {
      await rehydrate();
      setItemSpy.mockClear();

      act(() => {
        useShellStore.getState().setValeriaOpen("closed");
      });

      const writesForKey = setItemSpy.mock.calls.filter(
        ([k]) => k === SHELL_STORAGE_KEY,
      );
      expect(writesForKey.length).toBeGreaterThan(0);
    });
  });

  // ── SC-18 legacy migration ────────────────────────────────────────────────

  describe("SC-18 legacy migration — old shape maps to new machine", () => {
    it("legacy 'collapsed' → valeriaOpen='closed'", async () => {
      seedLegacy("collapsed");
      await rehydrate();
      expect(useShellStore.getState().valeriaOpen).toBe("closed");
    });

    it("legacy 'rail' → valeriaOpen='chat', historyOpen=false", async () => {
      seedLegacy("rail");
      await rehydrate();
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      expect(useShellStore.getState().historyOpen).toBe(false);
    });

    it("legacy 'full' → valeriaOpen='chat', historyOpen=false (NO restore history — RN-5)", async () => {
      seedLegacy("full");
      await rehydrate();
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      // RN-5: NO restaura el historial al migrar de 'full'
      expect(useShellStore.getState().historyOpen).toBe(false);
    });

    it("legacy shellMode is dropped (not present on migrated state)", async () => {
      seedLegacy("full", "web");
      await rehydrate();
      const state = useShellStore.getState() as unknown as Record<string, unknown>;
      expect(state.shellMode).toBeUndefined();
    });

    it("legacy mobileDrawerOpen preserved", async () => {
      seedLegacy("rail", "agentic", true);
      await rehydrate();
      expect(useShellStore.getState().mobileDrawerOpen).toBe(true);
    });
  });

  // ── SC-18 corrupt / unknown → fallback + console.warn ─────────────────────

  describe("SC-18 corrupt/unknown → fallback {valeriaOpen:'chat', historyOpen:false} + console.warn", () => {
    it("invalid JSON does not throw, falls back to default", async () => {
      localStorage.setItem(SHELL_STORAGE_KEY, "not-valid-json{{{{");
      await expect(rehydrate()).resolves.not.toThrow();
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      expect(useShellStore.getState().historyOpen).toBe(false);
      expect(useShellStore.getState()._hasHydrated).toBe(true);
    });

    it("unknown legacy valeriaState → fallback chat + console.warn (SC-18)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      localStorage.setItem(
        SHELL_STORAGE_KEY,
        JSON.stringify({
          state: { valeriaState: "unknown-state", shellMode: "agentic" },
          version: 0,
        }),
      );

      await rehydrate();

      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      expect(useShellStore.getState().historyOpen).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    });

    it("unknown new-shape valeriaOpen → fallback chat + console.warn", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      localStorage.setItem(
        SHELL_STORAGE_KEY,
        JSON.stringify({
          state: { valeriaOpen: "bogus", valeriaPct: null, mobileDrawerOpen: false },
          version: 1,
        }),
      );

      await rehydrate();

      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  // ── SC-6 empty_state — first visit ────────────────────────────────────────

  describe("empty_state — first visit without stored preference", () => {
    it("defaults to valeriaOpen='chat' historyOpen=false when no storage entry", async () => {
      await rehydrate();
      const state = useShellStore.getState();
      expect(state.valeriaOpen).toBe("chat");
      expect(state.historyOpen).toBe(false);
    });

    it("_hasHydrated is true after rehydrate with empty storage", async () => {
      await rehydrate();
      expect(useShellStore.getState()._hasHydrated).toBe(true);
    });

    it("mobileDrawerOpen defaults to false (fresh user)", async () => {
      await rehydrate();
      expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    });
  });

  // ── SsrSafeHydration interface ────────────────────────────────────────────

  describe("SsrSafeHydration interface on shell-store", () => {
    it("exposes _hasHydrated (false initially)", () => {
      expect(useShellStore.getState()._hasHydrated).toBe(false);
    });

    it("exposes setHasHydrated action", () => {
      expect(typeof useShellStore.getState().setHasHydrated).toBe("function");
    });

    it("exposes persist.rehydrate method", () => {
      expect(typeof useShellStore.persist.rehydrate).toBe("function");
    });

    it("partialize excludes _hasHydrated, setters, and historyOpen", () => {
      const partialize = useShellStore.persist.getOptions().partialize;
      if (partialize) {
        const partial = partialize(useShellStore.getState()) as Record<string, unknown>;
        expect(partial).not.toHaveProperty("_hasHydrated");
        expect(partial).not.toHaveProperty("setHasHydrated");
        expect(partial).not.toHaveProperty("setValeriaOpen");
        expect(partial).not.toHaveProperty("setMobileDrawerOpen");
        // RN-5/RN-11: historyOpen never persisted
        expect(partial).not.toHaveProperty("historyOpen");
      }
    });
  });
});
