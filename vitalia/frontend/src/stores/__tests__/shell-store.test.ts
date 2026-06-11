// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
/**
 * shell-store.test.ts — TDD RED-first tests for the NEW shell-store state machine.
 * vitalia-shell-core-hardening — T-1
 *
 * Replaces the legacy collapsed/rail/full + shellMode model with the additive
 * machine (03-arch-fe.md § 1.1):
 *   - valeriaOpen: "closed" | "chat"   (A=closed tira-avatar 44px · B=chat split 30/70)
 *   - historyOpen: boolean             (additive push — NOT a third conflated state)
 *   - valeriaPct: number | null        (split % · null = default 30)
 *   - mobileDrawerOpen: boolean        (independent slice)
 *
 * gherkin_coverage:
 * - SC-1 happy: default closed|chat machine + valeriaOpen/historyOpen defaults
 * - SC-5 RN-5/6: colapsar cierra historial; clic avatar NUNCA restaura historial
 * - SC-8 RN-7: historyOpen aditivo (no conflado con valeriaOpen)
 *
 * 03-arch-fe.md § 1.1 — state machine verbatim. ELIMINATE shellMode (AC-1).
 * Named export (no default export) per FSD-Lite enforce.
 *
 * downstream-regression-na: brand-local store test; no cross-brand consumers
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useShellStore, SHELL_STORAGE_KEY } from "../shell-store";

describe("useShellStore — new state machine (closed|chat + historyOpen additive)", () => {
  beforeEach(() => {
    // Reset to factory default. Default valeriaOpen='chat' (B) per 03-arch-fe § 1.1.
    useShellStore.setState({
      valeriaOpen: "chat",
      historyOpen: false,
      valeriaPct: null,
      mobileDrawerOpen: false,
    });
  });

  // ── SC-1 happy: initial state ────────────────────────────────────────────

  describe("initial state", () => {
    it("valeriaOpen='chat' historyOpen=false valeriaPct=null mobileDrawerOpen=false", () => {
      const state = useShellStore.getState();
      expect(state.valeriaOpen).toBe("chat");
      expect(state.historyOpen).toBe(false);
      expect(state.valeriaPct).toBeNull();
      expect(state.mobileDrawerOpen).toBe(false);
    });

    it("shellMode is NOT a field on the store (AC-1 — eliminated)", () => {
      const state = useShellStore.getState() as unknown as Record<string, unknown>;
      expect(state.shellMode).toBeUndefined();
      expect(state.setShellMode).toBeUndefined();
      expect(state.cycleValeriaState).toBeUndefined();
      expect(state.valeriaState).toBeUndefined();
    });
  });

  // ── SHELL_STORAGE_KEY (conserved) ──────────────────────────────────────────

  describe("SHELL_STORAGE_KEY", () => {
    it("SHELL_STORAGE_KEY exported 'vitalia-shell-state' (conserved)", () => {
      expect(SHELL_STORAGE_KEY).toBe("vitalia-shell-state");
    });
  });

  // ── valeriaOpen: closed <-> chat ───────────────────────────────────────────

  describe("setValeriaOpen", () => {
    it("setValeriaOpen('closed') sets state A", () => {
      useShellStore.getState().setValeriaOpen("closed");
      expect(useShellStore.getState().valeriaOpen).toBe("closed");
    });

    it("setValeriaOpen('chat') sets state B", () => {
      useShellStore.getState().setValeriaOpen("closed");
      useShellStore.getState().setValeriaOpen("chat");
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
    });
  });

  // ── RN-5 / RN-6 transitions: collapse closes history; reopen never restores ─

  describe("RN-5/6 transitions", () => {
    it("collapseValeria → A (valeriaOpen='closed') AND forces historyOpen=false (RN-6)", () => {
      // Start in C (chat + history)
      useShellStore.getState().setValeriaOpen("chat");
      useShellStore.getState().setHistoryOpen(true);
      expect(useShellStore.getState().historyOpen).toBe(true);

      useShellStore.getState().collapseValeria();

      expect(useShellStore.getState().valeriaOpen).toBe("closed");
      // colapsar cierra historial también (RN-6)
      expect(useShellStore.getState().historyOpen).toBe(false);
    });

    it("openValeria (clic tira-avatar) → B chat-only, NEVER restores history (RN-5)", () => {
      // Was in C before collapsing
      useShellStore.getState().setValeriaOpen("chat");
      useShellStore.getState().setHistoryOpen(true);
      useShellStore.getState().collapseValeria(); // → A, history false
      expect(useShellStore.getState().valeriaOpen).toBe("closed");

      useShellStore.getState().openValeria();

      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      // RN-5: reapertura NUNCA restaura el historial
      expect(useShellStore.getState().historyOpen).toBe(false);
    });

    it("historyOpen forced false while valeriaOpen='closed' (RN-5 invariant)", () => {
      useShellStore.getState().setValeriaOpen("closed");
      // Attempt to open history while closed must NOT leave A
      useShellStore.getState().setHistoryOpen(true);
      // RN-5: en A, historyOpen está forzado false
      expect(useShellStore.getState().historyOpen).toBe(false);
    });
  });

  // ── SC-8 RN-7: historyOpen additive (opens Valeria too from A) ─────────────

  describe("openHistory — additive (RN-7)", () => {
    it("setHistoryOpen(true) from chat → C (chat + history)", () => {
      useShellStore.getState().setValeriaOpen("chat");
      useShellStore.getState().setHistoryOpen(true);
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      expect(useShellStore.getState().historyOpen).toBe(true);
    });

    it("openHistory from A opens Valeria too (A → B+C) (RN-7)", () => {
      useShellStore.getState().setValeriaOpen("closed");
      useShellStore.getState().openHistory();
      // abrir historial desde A → B+C (abre Valeria también)
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      expect(useShellStore.getState().historyOpen).toBe(true);
    });

    it("closeHistory → B (chat, history closed)", () => {
      useShellStore.getState().setValeriaOpen("chat");
      useShellStore.getState().setHistoryOpen(true);
      useShellStore.getState().closeHistory();
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
      expect(useShellStore.getState().historyOpen).toBe(false);
    });

    it("toggleHistory flips historyOpen (chat context)", () => {
      useShellStore.getState().setValeriaOpen("chat");
      useShellStore.getState().setHistoryOpen(false);
      useShellStore.getState().toggleHistory();
      expect(useShellStore.getState().historyOpen).toBe(true);
      useShellStore.getState().toggleHistory();
      expect(useShellStore.getState().historyOpen).toBe(false);
    });
  });

  // ── valeriaPct (split %) ───────────────────────────────────────────────────

  describe("setValeriaPct", () => {
    it("setValeriaPct(45) updates split %", () => {
      useShellStore.getState().setValeriaPct(45);
      expect(useShellStore.getState().valeriaPct).toBe(45);
    });

    it("setValeriaPct(null) resets to default", () => {
      useShellStore.getState().setValeriaPct(45);
      useShellStore.getState().setValeriaPct(null);
      expect(useShellStore.getState().valeriaPct).toBeNull();
    });
  });

  // ── mobileDrawerOpen slice independence (conserved) ────────────────────────

  describe("mobileDrawerOpen slice independence", () => {
    it("setMobileDrawerOpen(true) does not change valeriaOpen", () => {
      useShellStore.getState().setValeriaOpen("chat");
      useShellStore.getState().setMobileDrawerOpen(true);
      expect(useShellStore.getState().mobileDrawerOpen).toBe(true);
      expect(useShellStore.getState().valeriaOpen).toBe("chat");
    });
  });

  // ── persist partialize ─────────────────────────────────────────────────────

  describe("persist partialize", () => {
    it("persist API defined", () => {
      expect(useShellStore.persist).toBeDefined();
    });

    // T-V1 dual-store: useShellStore is the @deprecated legacy store.
    // Its key moved to 'vitalia-shell-state-legacy' (canonical 'vitalia-shell-state' → useShellStoreKit).
    it("storage key is vitalia-shell-state-legacy (T-V1: legacy key; kit store owns canonical)", () => {
      expect(useShellStore.persist.getOptions().name).toBe("vitalia-shell-state-legacy");
    });

    it("partialize persists valeriaOpen, valeriaPct, mobileDrawerOpen — NOT historyOpen (RN-5/11)", () => {
      const partialize = useShellStore.persist.getOptions().partialize;
      expect(partialize).toBeDefined();
      if (partialize) {
        const partial = partialize(useShellStore.getState()) as Record<string, unknown>;
        expect(partial).toHaveProperty("valeriaOpen");
        expect(partial).toHaveProperty("valeriaPct");
        expect(partial).toHaveProperty("mobileDrawerOpen");
        // RN-5/RN-11: historial NUNCA persiste abierto
        expect(partial).not.toHaveProperty("historyOpen");
        // setters + transient excluded
        expect(partial).not.toHaveProperty("setValeriaOpen");
        expect(partial).not.toHaveProperty("openValeria");
        expect(partial).not.toHaveProperty("collapseValeria");
        expect(partial).not.toHaveProperty("toggleHistory");
        expect(partial).not.toHaveProperty("_hasHydrated");
      }
    });
  });
});
