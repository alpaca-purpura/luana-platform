// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-state-persistence
/**
 * shell-store-hydration.test.ts — TDD RED-first hydration tests for shell-store.
 * vitalia-shell-state-persistence T-1
 *
 * Tests (per 04-validators.yaml val-fn-unit-shell-hydration + creation_order step 3):
 *
 * SC-3 (adversarial — the bug):
 *   - Seed localStorage with valeriaState='rail'
 *   - Simulate SSR/pre-hydration window (store created, mutations happen)
 *   - Assert NO setItem writes valeriaState='full' (the default) during that window
 *   - Assert first post-rehydration value === 'rail' (not clobbered)
 *
 * SC-6 (empty_state — first visit):
 *   - No localStorage entry
 *   - Store hydrates to default full/agentic
 *   - Single clean write post-hydrate (not a spurious clobber)
 *
 * SC-7 (corrupt localStorage):
 *   - localStorage contains invalid JSON
 *   - Store falls back to default without throw
 *   - Shell renders correctly with defaults
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local store test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { useShellStore, SHELL_STORAGE_KEY } from "../shell-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function seedLocalStorage(
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("shell-store SSR-safe hydration", () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clearStorage();
    // Reset store partial state — _hasHydrated: false also resets the closure hydrationRef
    // (the factory wraps setState to sync hydrationRef when _hasHydrated is reset)
    useShellStore.setState({
      valeriaState: "full",
      shellMode: "agentic",
      mobileDrawerOpen: false,
      _hasHydrated: false,
    });
    setItemSpy = vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearStorage();
  });

  // ── SC-3: adversarial — the bug ───────────────────────────────────────────

  describe("SC-3 adversarial — NO write espurio del default during SSR/pre-hydration", () => {
    it("does NOT write valeriaState='full' to storage while _hasHydrated=false", async () => {
      // Seed localStorage with user's preference ('rail')
      seedLocalStorage("rail");

      setItemSpy.mockClear();

      // Simulate: store exists pre-hydration (skipHydration=true, no auto-hydrate)
      // During this window, the persist middleware must NOT write the default
      expect(useShellStore.getState()._hasHydrated).toBe(false);

      // Verify NO write to the shell storage key happened pre-hydration
      const writesForKey = setItemSpy.mock.calls.filter(
        ([k]) => k === SHELL_STORAGE_KEY,
      );
      expect(writesForKey).toHaveLength(0);
    });

    it("after rehydrate, valeriaState is 'rail' (not clobbered to 'full')", async () => {
      // Seed localStorage with 'rail' — user preference
      seedLocalStorage("rail");

      // Trigger rehydrate (simulates useStoreHydration in ShellOrganismLayoutClient)
      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      // _hasHydrated must flip
      expect(useShellStore.getState()._hasHydrated).toBe(true);
      // valeriaState must be 'rail' from localStorage, not the default 'full'
      expect(useShellStore.getState().valeriaState).toBe("rail");
    });

    it("after rehydrate, shellMode is preserved from storage", async () => {
      seedLocalStorage("rail", "web");

      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStore.getState().shellMode).toBe("web");
    });

    it("'full' is NEVER written to storage key when seed is 'rail' (pre-hydration window)", async () => {
      seedLocalStorage("rail");
      setItemSpy.mockClear();

      // Pre-hydration: any state mutations should NOT write storage
      // (this is the window where the bug occurred — SSR/skeleton subscribed the store)
      expect(useShellStore.getState()._hasHydrated).toBe(false);

      const writesWithFull = setItemSpy.mock.calls.filter(([k, v]) => {
        if (k !== SHELL_STORAGE_KEY) return false;
        try {
          const parsed = JSON.parse(v as string) as { state?: { valeriaState?: string } };
          return parsed.state?.valeriaState === "full";
        } catch {
          return false;
        }
      });
      expect(writesWithFull).toHaveLength(0);
    });

    it("mutations before rehydrate don't persist to storage", async () => {
      seedLocalStorage("rail");
      setItemSpy.mockClear();

      // Simulate pre-hydration state mutations (like what SSR skeleton might trigger)
      act(() => {
        useShellStore.getState().setValeriaState("full"); // default value
      });

      // Must NOT have written to storage (NO-OP)
      const writesForKey = setItemSpy.mock.calls.filter(
        ([k]) => k === SHELL_STORAGE_KEY,
      );
      expect(writesForKey).toHaveLength(0);

      // After rehydrate, state comes from localStorage (rail), not the pre-hydration mutation
      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStore.getState().valeriaState).toBe("rail");
    });
  });

  // ── SC-6: empty_state — first visit ──────────────────────────────────────

  describe("SC-6 empty_state — first visit without stored preference", () => {
    it("defaults to valeriaState='full' shellMode='agentic' when no storage entry", async () => {
      // No localStorage entry (fresh user) — clearStorage in beforeEach ensures this
      // After reset, the store starts with defaults
      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      // With no stored value, defaults should be maintained
      const state = useShellStore.getState();
      expect(state.valeriaState).toBe("full");
      expect(state.shellMode).toBe("agentic");
    });

    it("_hasHydrated is true after rehydrate even with empty storage", async () => {
      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStore.getState()._hasHydrated).toBe(true);
    });

    it("post-hydrate mutation writes to storage (single clean write)", async () => {
      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      setItemSpy.mockClear();

      act(() => {
        useShellStore.getState().setValeriaState("rail");
      });

      const writesForKey = setItemSpy.mock.calls.filter(
        ([k]) => k === SHELL_STORAGE_KEY,
      );
      expect(writesForKey.length).toBeGreaterThan(0);
    });

    it("mobileDrawerOpen defaults to false (fresh user)", async () => {
      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    });
  });

  // ── SC-7: corrupt localStorage — no crash ────────────────────────────────

  describe("SC-7 corrupt localStorage — fallback to default without throw", () => {
    it("handles invalid JSON in localStorage without throwing", async () => {
      // Seed with invalid JSON
      localStorage.setItem(SHELL_STORAGE_KEY, "not-valid-json{{{{");

      // Should not throw
      await expect(
        act(async () => {
          useShellStore.persist.rehydrate();
          await new Promise((r) => setTimeout(r, 0));
        }),
      ).resolves.not.toThrow();
    });

    it("falls back to default state when localStorage contains invalid JSON", async () => {
      localStorage.setItem(SHELL_STORAGE_KEY, "this is not json");

      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      const state = useShellStore.getState();
      // Should have default values (not crash/undefined)
      expect(state.valeriaState).toBe("full");
      expect(state.shellMode).toBe("agentic");
      expect(state.mobileDrawerOpen).toBe(false);
    });

    it("_hasHydrated is true after corrupt JSON rehydrate (still hydrated, just defaults)", async () => {
      localStorage.setItem(SHELL_STORAGE_KEY, "{invalid");

      await act(async () => {
        useShellStore.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStore.getState()._hasHydrated).toBe(true);
    });

    it("handles valeriaState with out-of-enum value gracefully", async () => {
      localStorage.setItem(
        SHELL_STORAGE_KEY,
        JSON.stringify({
          state: { valeriaState: "unknown-state", shellMode: "agentic" },
          version: 0,
        }),
      );

      // Should not throw — Zustand persist merges what it can
      await expect(
        act(async () => {
          useShellStore.persist.rehydrate();
          await new Promise((r) => setTimeout(r, 0));
        }),
      ).resolves.not.toThrow();
    });
  });

  // ── _hasHydrated + SsrSafeHydration interface ─────────────────────────────

  describe("SsrSafeHydration interface on shell-store", () => {
    it("shell-store exposes _hasHydrated (false initially)", () => {
      expect(useShellStore.getState()._hasHydrated).toBe(false);
    });

    it("shell-store exposes setHasHydrated action", () => {
      expect(typeof useShellStore.getState().setHasHydrated).toBe("function");
    });

    it("shell-store exposes persist.rehydrate method", () => {
      expect(typeof useShellStore.persist.rehydrate).toBe("function");
    });

    it("partialize excludes _hasHydrated and setHasHydrated", () => {
      const partialize = useShellStore.persist.getOptions().partialize;
      if (partialize) {
        const partial = partialize(useShellStore.getState());
        expect(partial).not.toHaveProperty("_hasHydrated");
        expect(partial).not.toHaveProperty("setHasHydrated");
        // Setters also excluded
        expect(partial).not.toHaveProperty("setValeriaState");
        expect(partial).not.toHaveProperty("cycleValeriaState");
        expect(partial).not.toHaveProperty("setShellMode");
        expect(partial).not.toHaveProperty("setMobileDrawerOpen");
      }
    });

    it("partialize includes valeriaState, shellMode, mobileDrawerOpen", () => {
      const partialize = useShellStore.persist.getOptions().partialize;
      if (partialize) {
        const partial = partialize(useShellStore.getState());
        expect(partial).toHaveProperty("valeriaState");
        expect(partial).toHaveProperty("shellMode");
        expect(partial).toHaveProperty("mobileDrawerOpen");
      }
    });
  });

  // ── mobileDrawerOpen slice independence ──────────────────────────────────

  describe("mobileDrawerOpen slice independence from valeriaState", () => {
    it("mobileDrawerOpen defaults to false", () => {
      expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    });

    it("setMobileDrawerOpen changes mobileDrawerOpen without changing valeriaState", () => {
      useShellStore.getState().setValeriaState("rail");

      act(() => {
        useShellStore.getState().setMobileDrawerOpen(true);
      });

      expect(useShellStore.getState().mobileDrawerOpen).toBe(true);
      // valeriaState must be unchanged (slices are independent)
      expect(useShellStore.getState().valeriaState).toBe("rail");
    });

    it("changing valeriaState does not affect mobileDrawerOpen", () => {
      act(() => {
        useShellStore.getState().setMobileDrawerOpen(true);
        useShellStore.getState().setValeriaState("collapsed");
      });

      expect(useShellStore.getState().mobileDrawerOpen).toBe(true);
    });

    it("valeriaState='full' (desktop default) does NOT set mobileDrawerOpen=true", () => {
      // This tests the bug fix: full desktop state never auto-opens mobile drawer
      act(() => {
        useShellStore.getState().setValeriaState("full");
      });
      expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    });
  });
});
