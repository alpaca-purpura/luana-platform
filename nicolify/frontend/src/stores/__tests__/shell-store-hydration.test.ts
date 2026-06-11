// cap: shell-organism.shell-nicolify
// story-origin: platform-lift-shell-chrome-ui-kit T-N1
/**
 * shell-store-hydration.test.ts — SSR-safe hydration tests (T-N1 convergence).
 * platform-lift-shell-chrome-ui-kit T-N1
 *
 * Replaces legacy luanaState/splitState/shellMode fields with kit API:
 * supervisorOpen ('closed' | 'chat'), splitPct (number | null), mobileDrawerOpen.
 *
 * Tests:
 * SC-3: NO spurious default write pre-hydration (the Vitalia bug, C3)
 * SC-6: first visit defaults (no localStorage entry)
 * SC-7: corrupt localStorage fallback without throw
 *
 * RN-7 (convergencia sancionada): legacy field tests retired wholesale.
 *
 * downstream-regression-na: brand-local store test; no cross-brand consumers
 */

import { act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { useShellStoreKit, SHELL_STORAGE_KEY } from "../shell-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Seed legacy v0 nicolify shape — simulates data from before T-N1 migration */
function seedLegacyV0(luanaState: string, mobileDrawerOpen = false) {
  localStorage.setItem(
    SHELL_STORAGE_KEY,
    JSON.stringify({
      state: { luanaState, splitState: "chat-collapsed", shellMode: "agentic", mobileDrawerOpen },
      version: 0,
    }),
  );
}

/** Seed kit shape — simulates data already migrated to T-N1 format */
function seedKitShape(supervisorOpen: "closed" | "chat", mobileDrawerOpen = false) {
  localStorage.setItem(
    SHELL_STORAGE_KEY,
    JSON.stringify({
      state: { supervisorOpen, splitPct: null, mobileDrawerOpen },
      version: 1,
    }),
  );
}

function clearStorage() {
  localStorage.removeItem(SHELL_STORAGE_KEY);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("shell-store SSR-safe hydration (nicolify — T-N1 kit API)", () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clearStorage();
    // Reset store to initial state — kit API
    useShellStoreKit.setState({
      supervisorOpen: "chat",
      splitPct: null,
      mobileDrawerOpen: false,
      _hasHydrated: false,
    });
    setItemSpy = vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearStorage();
  });

  // ── SC-3: NO spurious write pre-hydration (C3 gate) ──────────────────────

  describe("SC-3 adversarial — NO write espurio during SSR/pre-hydration (C3 gate)", () => {
    it("does NOT write to storage while _hasHydrated=false", async () => {
      seedKitShape("closed");
      setItemSpy.mockClear();

      expect(useShellStoreKit.getState()._hasHydrated).toBe(false);

      const writesForKey = setItemSpy.mock.calls.filter(([k]) => k === SHELL_STORAGE_KEY);
      expect(writesForKey).toHaveLength(0);
    });

    it("after rehydrate, supervisorOpen is restored from kit-shape storage (no clobber)", async () => {
      seedKitShape("closed");

      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStoreKit.getState()._hasHydrated).toBe(true);
      expect(useShellStoreKit.getState().supervisorOpen).toBe("closed");
    });

    it("after rehydrate of legacy v0 data, luanaState='history' → supervisorOpen='chat'", async () => {
      seedLegacyV0("history");

      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStoreKit.getState()._hasHydrated).toBe(true);
      expect(useShellStoreKit.getState().supervisorOpen).toBe("chat");
    });

    it("after rehydrate of legacy v0 data, luanaState='collapsed' → supervisorOpen='closed'", async () => {
      seedLegacyV0("collapsed");

      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStoreKit.getState().supervisorOpen).toBe("closed");
    });

    it("mutations before rehydrate don't persist to storage (NO-OP guard)", async () => {
      seedKitShape("closed");
      setItemSpy.mockClear();

      // Simulate pre-hydration mutation (e.g. SSR skeleton effect)
      act(() => {
        useShellStoreKit.getState().openSupervisor();
      });

      // Must NOT have written to storage
      const writesForKey = setItemSpy.mock.calls.filter(([k]) => k === SHELL_STORAGE_KEY);
      expect(writesForKey).toHaveLength(0);

      // After rehydrate, state comes from localStorage
      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStoreKit.getState().supervisorOpen).toBe("closed");
    });
  });

  // ── SC-6: first visit ─────────────────────────────────────────────────────

  describe("SC-6 empty_state — first visit without stored preference", () => {
    it("defaults to supervisorOpen='chat' when no storage entry", async () => {
      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      const state = useShellStoreKit.getState();
      expect(state.supervisorOpen).toBe("chat");
    });

    it("_hasHydrated is true after rehydrate even with empty storage", async () => {
      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStoreKit.getState()._hasHydrated).toBe(true);
    });

    it("mobileDrawerOpen defaults to false (fresh user)", async () => {
      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStoreKit.getState().mobileDrawerOpen).toBe(false);
    });
  });

  // ── SC-7: corrupt localStorage ────────────────────────────────────────────

  describe("SC-7 corrupt localStorage — fallback to default without throw", () => {
    it("handles invalid JSON in localStorage without throwing", async () => {
      localStorage.setItem(SHELL_STORAGE_KEY, "not-valid-json{{{{");

      await expect(
        act(async () => {
          useShellStoreKit.persist.rehydrate();
          await new Promise((r) => setTimeout(r, 0));
        }),
      ).resolves.not.toThrow();
    });

    it("falls back to default supervisorOpen='chat' when localStorage contains invalid JSON", async () => {
      localStorage.setItem(SHELL_STORAGE_KEY, "this is not json");

      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      const state = useShellStoreKit.getState();
      expect(state.supervisorOpen).toBe("chat");
      expect(state.mobileDrawerOpen).toBe(false);
    });

    it("_hasHydrated is true after corrupt JSON rehydrate (still hydrated, just defaults)", async () => {
      localStorage.setItem(SHELL_STORAGE_KEY, "{invalid");

      await act(async () => {
        useShellStoreKit.persist.rehydrate();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(useShellStoreKit.getState()._hasHydrated).toBe(true);
    });
  });

  // ── SsrSafeHydration interface ─────────────────────────────────────────────

  describe("SsrSafeHydration interface on shell-store", () => {
    it("shell-store exposes _hasHydrated (false initially)", () => {
      expect(useShellStoreKit.getState()._hasHydrated).toBe(false);
    });

    it("shell-store exposes setHasHydrated action", () => {
      expect(typeof useShellStoreKit.getState().setHasHydrated).toBe("function");
    });

    it("shell-store exposes persist.rehydrate method", () => {
      expect(typeof useShellStoreKit.persist.rehydrate).toBe("function");
    });

    it("partialize excludes _hasHydrated, setHasHydrated, and action functions", () => {
      const { partialize } = useShellStoreKit.persist.getOptions();
      if (partialize) {
        const partial = partialize(useShellStoreKit.getState());
        expect(partial).not.toHaveProperty("_hasHydrated");
        expect(partial).not.toHaveProperty("setHasHydrated");
        expect(partial).not.toHaveProperty("openSupervisor");
        expect(partial).not.toHaveProperty("collapseSupervisor");
        expect(partial).not.toHaveProperty("setMobileDrawerOpen");
      }
    });
  });
});
