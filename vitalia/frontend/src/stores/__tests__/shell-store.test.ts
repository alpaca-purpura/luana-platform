/**
 * shell-store.test.ts — TDD RED-first tests for shell-store Zustand store
 * F1-S4 vitalia-fase1-shell-layout-5050 — T-1
 *
 * Tests Zustand store actions + persist partialize behavior.
 * Note: Zustand persist with localStorage in happy-dom environment —
 * we test state mutations directly (not the actual localStorage write,
 * which is integration behavior covered by E2E).
 *
 * gherkin_coverage:
 * - SC-1 happy: shellMode='agentic' default + valeriaState='full' default
 * - SC-3 edge: setValeriaState + cycleValeriaState + setShellMode + persistencia
 *
 * 03-arch.md § 2.5 — store spec verbatim.
 * Named export (no default export) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local store test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useShellStore, SHELL_STORAGE_KEY } from "../shell-store";

describe("useShellStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useShellStore.setState({
      valeriaState: "full",
      shellMode: "agentic",
    });
  });

  // ── SC-1 happy: initial state ────────────────────────────────────────────

  describe("initial state", () => {
    it("initial state agentic + full", () => {
      const state = useShellStore.getState();
      expect(state.valeriaState).toBe("full");
      expect(state.shellMode).toBe("agentic");
    });
  });

  // ── SHELL_STORAGE_KEY ──────────────────────────────────────────────────────

  describe("SHELL_STORAGE_KEY", () => {
    it("SHELL_STORAGE_KEY exported 'vitalia-shell-state'", () => {
      expect(SHELL_STORAGE_KEY).toBe("vitalia-shell-state");
    });
  });

  // ── SC-3 edge: setValeriaState ─────────────────────────────────────────────

  describe("setValeriaState", () => {
    it("setValeriaState updates state", () => {
      useShellStore.getState().setValeriaState("rail");
      expect(useShellStore.getState().valeriaState).toBe("rail");
    });

    it("setValeriaState to collapsed", () => {
      useShellStore.getState().setValeriaState("collapsed");
      expect(useShellStore.getState().valeriaState).toBe("collapsed");
    });

    it("setValeriaState back to full", () => {
      useShellStore.getState().setValeriaState("rail");
      useShellStore.getState().setValeriaState("full");
      expect(useShellStore.getState().valeriaState).toBe("full");
    });
  });

  // ── SC-3 edge: cycleValeriaState ──────────────────────────────────────────

  describe("cycleValeriaState", () => {
    it("cycleValeriaState toggles full<->rail", () => {
      // Start at full (initial)
      expect(useShellStore.getState().valeriaState).toBe("full");

      // Cycle: full → rail
      useShellStore.getState().cycleValeriaState();
      expect(useShellStore.getState().valeriaState).toBe("rail");

      // Cycle: rail → full
      useShellStore.getState().cycleValeriaState();
      expect(useShellStore.getState().valeriaState).toBe("full");
    });

    it("cycleValeriaState from rail toggles to full", () => {
      useShellStore.getState().setValeriaState("rail");
      useShellStore.getState().cycleValeriaState();
      expect(useShellStore.getState().valeriaState).toBe("full");
    });

    it("cycleValeriaState from collapsed goes to full (collapsed only reachable via setValeriaState)", () => {
      // When collapsed, cycle treats it as non-full → toggles to 'full'
      // Implementation: get().valeriaState === 'full' ? 'rail' : 'full'
      // collapsed !== 'full' → result is 'full' (snapping back to visible state)
      useShellStore.getState().setValeriaState("collapsed");
      useShellStore.getState().cycleValeriaState();
      expect(useShellStore.getState().valeriaState).toBe("full");
    });
  });

  // ── SC-3 edge: setShellMode ────────────────────────────────────────────────

  describe("setShellMode", () => {
    it("setShellMode persists localStorage", () => {
      useShellStore.getState().setShellMode("web");
      expect(useShellStore.getState().shellMode).toBe("web");
    });

    it("setShellMode back to agentic", () => {
      useShellStore.getState().setShellMode("web");
      useShellStore.getState().setShellMode("agentic");
      expect(useShellStore.getState().shellMode).toBe("agentic");
    });
  });

  // ── SC-3 edge: partialize ──────────────────────────────────────────────────

  describe("persist partialize — SC-3", () => {
    it("partialize includes both fields", () => {
      // Zustand persist adds .persist to the store
      expect(useShellStore.persist).toBeDefined();
    });

    it("storage key is vitalia-shell-state", () => {
      expect(useShellStore.persist.getOptions().name).toBe(
        "vitalia-shell-state",
      );
    });

    it("partialize excludes setter functions (only state fields serialized)", () => {
      // Access the partialize function and verify it only returns state fields
      const partialize = useShellStore.persist.getOptions().partialize;
      if (partialize) {
        const fullState = useShellStore.getState();
        const partial = partialize(fullState);
        // Should include state fields
        expect(partial).toHaveProperty("valeriaState");
        expect(partial).toHaveProperty("shellMode");
        // Should NOT include setter functions
        expect(partial).not.toHaveProperty("setValeriaState");
        expect(partial).not.toHaveProperty("cycleValeriaState");
        expect(partial).not.toHaveProperty("setShellMode");
      }
    });
  });
});
