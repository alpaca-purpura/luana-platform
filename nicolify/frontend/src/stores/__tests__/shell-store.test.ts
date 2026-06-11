// cap: shell-organism.shell-nicolify
// story-origin: platform-lift-shell-chrome-ui-kit T-N1
/**
 * shell-store.test.ts — Tests for nicolify shell-store (T-N1 convergence).
 * platform-lift-shell-chrome-ui-kit T-N1
 *
 * Replaces the legacy luanaState/cycleLuanaState/shellMode tests with
 * kit-API tests: supervisorOpen, openSupervisor, collapseSupervisor, splitPct.
 *
 * SC-6: storageKey 'nicolify-shell-state' must remain unchanged.
 *
 * RN-7 (convergencia sancionada): retiring legacy tests is the sanctioned goal
 * — these kit-API tests replace them wholesale.
 *
 * downstream-regression-na: brand-local store test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  useShellStoreKit,
  useShellStore,
  SHELL_STORAGE_KEY,
  migrateLuanaState,
} from "../shell-store";

describe("useShellStoreKit (nicolify — T-N1 kit API)", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useShellStoreKit.setState({
      supervisorOpen: "chat",
      splitPct: null,
      mobileDrawerOpen: false,
    });
  });

  // ── SHELL_STORAGE_KEY ──────────────────────────────────────────────────────

  describe("SHELL_STORAGE_KEY", () => {
    it("SHELL_STORAGE_KEY exported 'nicolify-shell-state'", () => {
      expect(SHELL_STORAGE_KEY).toBe("nicolify-shell-state");
    });
  });

  // ── storage key preserved (SC-6) ──────────────────────────────────────────

  describe("SC-6 — storage key preserved", () => {
    it("persist.getOptions().name is 'nicolify-shell-state'", () => {
      expect(useShellStoreKit.persist.getOptions().name).toBe("nicolify-shell-state");
    });
  });

  // ── useShellStore convenience alias ───────────────────────────────────────

  describe("useShellStore alias", () => {
    it("useShellStore is same reference as useShellStoreKit", () => {
      expect(useShellStore).toBe(useShellStoreKit);
    });
  });

  // ── kit API: supervisorOpen ───────────────────────────────────────────────

  describe("supervisorOpen initial state", () => {
    it("supervisorOpen is 'chat' by default", () => {
      const state = useShellStoreKit.getState();
      expect(state.supervisorOpen).toBe("chat");
    });
  });

  describe("openSupervisor / collapseSupervisor", () => {
    it("collapseSupervisor sets supervisorOpen to 'closed'", () => {
      useShellStoreKit.getState().collapseSupervisor();
      expect(useShellStoreKit.getState().supervisorOpen).toBe("closed");
    });

    it("openSupervisor sets supervisorOpen to 'chat'", () => {
      useShellStoreKit.getState().collapseSupervisor();
      useShellStoreKit.getState().openSupervisor();
      expect(useShellStoreKit.getState().supervisorOpen).toBe("chat");
    });
  });

  // ── kit API: mobileDrawerOpen independent slice ───────────────────────────

  describe("mobileDrawerOpen slice independence", () => {
    it("mobileDrawerOpen defaults to false", () => {
      expect(useShellStoreKit.getState().mobileDrawerOpen).toBe(false);
    });

    it("setMobileDrawerOpen changes mobileDrawerOpen without changing supervisorOpen", () => {
      useShellStoreKit.getState().openSupervisor();
      useShellStoreKit.getState().setMobileDrawerOpen(true);
      expect(useShellStoreKit.getState().mobileDrawerOpen).toBe(true);
      expect(useShellStoreKit.getState().supervisorOpen).toBe("chat");
    });

    it("collapseSupervisor does NOT affect mobileDrawerOpen", () => {
      useShellStoreKit.getState().setMobileDrawerOpen(true);
      useShellStoreKit.getState().collapseSupervisor();
      expect(useShellStoreKit.getState().mobileDrawerOpen).toBe(true);
    });
  });

  // ── persist API ───────────────────────────────────────────────────────────

  describe("persist API", () => {
    it("persist API is available", () => {
      expect(useShellStoreKit.persist).toBeDefined();
    });

    it("partialize includes supervisorOpen and mobileDrawerOpen", () => {
      const { partialize } = useShellStoreKit.persist.getOptions();
      if (partialize) {
        const fullState = useShellStoreKit.getState();
        const partial = partialize(fullState);
        expect(partial).toHaveProperty("supervisorOpen");
        expect(partial).toHaveProperty("mobileDrawerOpen");
      }
    });
  });
});

// ── migrateLuanaState — unit tests ───────────────────────────────────────────

describe("migrateLuanaState (T-N1)", () => {
  // ── Legacy v0 luanaState mapping ─────────────────────────────────────────

  describe("legacy luanaState → supervisorOpen mapping", () => {
    it("maps luanaState='collapsed' → supervisorOpen='closed'", () => {
      const result = migrateLuanaState(
        {
          luanaState: "collapsed",
          splitState: "chat-collapsed",
          shellMode: "agentic",
          mobileDrawerOpen: false,
        },
        0,
      );
      expect(result.supervisorOpen).toBe("closed");
    });

    it("maps luanaState='history' → supervisorOpen='chat'", () => {
      const result = migrateLuanaState(
        {
          luanaState: "history",
          splitState: "50-50",
          shellMode: "agentic",
          mobileDrawerOpen: false,
        },
        0,
      );
      expect(result.supervisorOpen).toBe("chat");
    });

    it("maps luanaState='full' → supervisorOpen='chat'", () => {
      const result = migrateLuanaState(
        { luanaState: "full", splitState: "50-50", shellMode: "agentic", mobileDrawerOpen: false },
        0,
      );
      expect(result.supervisorOpen).toBe("chat");
    });

    it("preserves mobileDrawerOpen from legacy shape", () => {
      const result = migrateLuanaState(
        {
          luanaState: "collapsed",
          splitState: "chat-collapsed",
          shellMode: "agentic",
          mobileDrawerOpen: true,
        },
        0,
      );
      expect(result.mobileDrawerOpen).toBe(true);
    });

    it("drops legacy splitState (maps to splitPct: null)", () => {
      const result = migrateLuanaState(
        { luanaState: "full", splitState: "narrow", shellMode: "agentic", mobileDrawerOpen: false },
        0,
      );
      expect(result.splitPct).toBeNull();
    });
  });

  // ── Already-migrated kit shape ────────────────────────────────────────────

  describe("already-migrated kit shape passthrough", () => {
    it("passes through supervisorOpen='closed'", () => {
      const result = migrateLuanaState(
        { supervisorOpen: "closed", splitPct: null, mobileDrawerOpen: false },
        1,
      );
      expect(result.supervisorOpen).toBe("closed");
    });

    it("passes through supervisorOpen='chat'", () => {
      const result = migrateLuanaState(
        { supervisorOpen: "chat", splitPct: null, mobileDrawerOpen: false },
        1,
      );
      expect(result.supervisorOpen).toBe("chat");
    });

    it("passes through splitPct number", () => {
      const result = migrateLuanaState(
        { supervisorOpen: "chat", splitPct: 0.35, mobileDrawerOpen: false },
        1,
      );
      expect(result.splitPct).toBe(0.35);
    });
  });

  // ── Corrupt / unknown shapes — must return defaults WITHOUT throw (Bif-5) ─

  describe("Bif-5 — corrupt shape returns defaults without throw", () => {
    it("null → fallback defaults (no throw)", () => {
      expect(() => migrateLuanaState(null, 0)).not.toThrow();
      const result = migrateLuanaState(null, 0);
      expect(result.supervisorOpen).toBe("chat");
    });

    it("string → fallback defaults (no throw)", () => {
      expect(() => migrateLuanaState("corrupt", 0)).not.toThrow();
      const result = migrateLuanaState("corrupt", 0);
      expect(result.supervisorOpen).toBe("chat");
    });

    it("unknown supervisorOpen value → fallback defaults (no throw)", () => {
      expect(() => migrateLuanaState({ supervisorOpen: "invalid-value" }, 1)).not.toThrow();
      const result = migrateLuanaState({ supervisorOpen: "invalid-value" }, 1);
      expect(result.supervisorOpen).toBe("chat");
    });

    it("empty object → fallback defaults (no throw)", () => {
      expect(() => migrateLuanaState({}, 0)).not.toThrow();
      const result = migrateLuanaState({}, 0);
      expect(result.supervisorOpen).toBe("chat");
    });
  });
});
