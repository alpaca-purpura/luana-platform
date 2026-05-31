// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-3
/**
 * shell-store.test.ts — TDD RED-first tests for nicolify shell-store.
 * nicolify-r0-shell T-3 — port from vitalia shell-store.test.ts, re-themed to Nicolify.
 *
 * Tests Zustand store actions + persist partialize behavior.
 * gherkin_coverage: C1, C2, C3 (splitter states + hydration)
 *
 * Nicolify changes vs Vitalia:
 * - valeriaState/ValeriaState → luanaState/LuanaState
 * - cycleValeriaState → cycleLuanaState
 * - setValeriaState → setLuanaState
 * - SHELL_STORAGE_KEY = 'nicolify-shell-state'
 * - shellMode retained (agentic|web)
 * - splitState NEW field (chat-collapsed|narrow|50-50)
 *
 * downstream-regression-na: brand-local store test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach } from "vitest";

import { useShellStore, SHELL_STORAGE_KEY } from "../shell-store";

describe("useShellStore (nicolify)", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useShellStore.setState({
      luanaState: "collapsed",
      splitState: "chat-collapsed",
      shellMode: "agentic",
      mobileDrawerOpen: false,
    });
  });

  // ── SHELL_STORAGE_KEY ──────────────────────────────────────────────────────

  describe("SHELL_STORAGE_KEY", () => {
    it("SHELL_STORAGE_KEY exported 'nicolify-shell-state'", () => {
      expect(SHELL_STORAGE_KEY).toBe("nicolify-shell-state");
    });
  });

  // ── initial state ──────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("initial state: luanaState=collapsed, splitState=chat-collapsed, shellMode=agentic, mobileDrawerOpen=false", () => {
      const state = useShellStore.getState();
      expect(state.luanaState).toBe("collapsed");
      expect(state.splitState).toBe("chat-collapsed");
      expect(state.shellMode).toBe("agentic");
      expect(state.mobileDrawerOpen).toBe(false);
    });
  });

  // ── setLuanaState ──────────────────────────────────────────────────────────

  describe("setLuanaState", () => {
    it("setLuanaState('history') updates state", () => {
      useShellStore.getState().setLuanaState("history");
      expect(useShellStore.getState().luanaState).toBe("history");
    });

    it("setLuanaState('full') updates state", () => {
      useShellStore.getState().setLuanaState("full");
      expect(useShellStore.getState().luanaState).toBe("full");
    });

    it("setLuanaState back to collapsed", () => {
      useShellStore.getState().setLuanaState("full");
      useShellStore.getState().setLuanaState("collapsed");
      expect(useShellStore.getState().luanaState).toBe("collapsed");
    });
  });

  // ── cycleLuanaState ────────────────────────────────────────────────────────

  describe("cycleLuanaState", () => {
    it("cycleLuanaState from collapsed goes to history", () => {
      useShellStore.getState().setLuanaState("collapsed");
      useShellStore.getState().cycleLuanaState();
      expect(useShellStore.getState().luanaState).toBe("history");
    });

    it("cycleLuanaState from history goes to full", () => {
      useShellStore.getState().setLuanaState("history");
      useShellStore.getState().cycleLuanaState();
      expect(useShellStore.getState().luanaState).toBe("full");
    });

    it("cycleLuanaState from full goes to collapsed", () => {
      useShellStore.getState().setLuanaState("full");
      useShellStore.getState().cycleLuanaState();
      expect(useShellStore.getState().luanaState).toBe("collapsed");
    });
  });

  // ── setSplitState ──────────────────────────────────────────────────────────

  describe("setSplitState", () => {
    it("setSplitState('narrow') updates state", () => {
      useShellStore.getState().setSplitState("narrow");
      expect(useShellStore.getState().splitState).toBe("narrow");
    });

    it("setSplitState('50-50') updates state", () => {
      useShellStore.getState().setSplitState("50-50");
      expect(useShellStore.getState().splitState).toBe("50-50");
    });

    it("setSplitState back to chat-collapsed", () => {
      useShellStore.getState().setSplitState("50-50");
      useShellStore.getState().setSplitState("chat-collapsed");
      expect(useShellStore.getState().splitState).toBe("chat-collapsed");
    });
  });

  // ── setShellMode ───────────────────────────────────────────────────────────

  describe("setShellMode", () => {
    it("setShellMode('web') updates state", () => {
      useShellStore.getState().setShellMode("web");
      expect(useShellStore.getState().shellMode).toBe("web");
    });

    it("setShellMode back to agentic", () => {
      useShellStore.getState().setShellMode("web");
      useShellStore.getState().setShellMode("agentic");
      expect(useShellStore.getState().shellMode).toBe("agentic");
    });
  });

  // ── mobileDrawerOpen — independent slice ──────────────────────────────────

  describe("mobileDrawerOpen slice independence from luanaState", () => {
    it("mobileDrawerOpen defaults to false", () => {
      expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    });

    it("setMobileDrawerOpen changes mobileDrawerOpen without changing luanaState", () => {
      useShellStore.getState().setLuanaState("history");
      useShellStore.getState().setMobileDrawerOpen(true);
      expect(useShellStore.getState().mobileDrawerOpen).toBe(true);
      // luanaState must be unchanged (slices are independent — ADR-vitalia-006 D5)
      expect(useShellStore.getState().luanaState).toBe("history");
    });

    it("changing luanaState does not affect mobileDrawerOpen", () => {
      useShellStore.getState().setMobileDrawerOpen(true);
      useShellStore.getState().setLuanaState("full");
      expect(useShellStore.getState().mobileDrawerOpen).toBe(true);
    });

    it("luanaState='full' (desktop) does NOT auto-set mobileDrawerOpen=true", () => {
      // Bug #2 from vitalia: full desktop state must NEVER auto-open mobile drawer
      useShellStore.getState().setLuanaState("full");
      expect(useShellStore.getState().mobileDrawerOpen).toBe(false);
    });
  });

  // ── persist.partialize ─────────────────────────────────────────────────────

  describe("persist partialize", () => {
    it("persist API is available", () => {
      expect(useShellStore.persist).toBeDefined();
    });

    it("storage key is nicolify-shell-state", () => {
      expect(useShellStore.persist.getOptions().name).toBe("nicolify-shell-state");
    });

    it("partialize includes state fields (luanaState, splitState, shellMode, mobileDrawerOpen)", () => {
      const { partialize } = useShellStore.persist.getOptions();
      if (partialize) {
        const fullState = useShellStore.getState();
        const partial = partialize(fullState);
        expect(partial).toHaveProperty("luanaState");
        expect(partial).toHaveProperty("splitState");
        expect(partial).toHaveProperty("shellMode");
        expect(partial).toHaveProperty("mobileDrawerOpen");
      }
    });

    it("partialize excludes setter functions and _hasHydrated", () => {
      const { partialize } = useShellStore.persist.getOptions();
      if (partialize) {
        const fullState = useShellStore.getState();
        const partial = partialize(fullState);
        expect(partial).not.toHaveProperty("setLuanaState");
        expect(partial).not.toHaveProperty("cycleLuanaState");
        expect(partial).not.toHaveProperty("setSplitState");
        expect(partial).not.toHaveProperty("setShellMode");
        expect(partial).not.toHaveProperty("setMobileDrawerOpen");
        expect(partial).not.toHaveProperty("_hasHydrated");
        expect(partial).not.toHaveProperty("setHasHydrated");
      }
    });
  });
});
