// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
/**
 * Architecture test — Shell Store Schema Invariant (NEW machine enforce).
 *
 * SUPERSEDES the F1-S4/F1-S5 read-only invariant (collapsed|rail|full + shellMode).
 * Story vitalia-shell-core-hardening T-1 LEGALLY rewrites the shell-store schema:
 * the F1-S5 "revert the store, not this test" guard no longer applies — this story
 * is the sanctioned schema change (06-tickets.yaml T-1, AC-1/RN-1).
 *
 * New invariant (03-arch-fe.md § 1.1):
 *   - valeriaOpen: 'closed' | 'chat'  (A=closed tira-avatar · B=chat split)
 *   - historyOpen: boolean            (additive push — NOT a conflated third state)
 *   - valeriaPct: number | null       (split %)
 *   - mobileDrawerOpen: boolean       (independent slice)
 *   - shellMode + valeriaState + cycleValeriaState ELIMINATED.
 *
 * If a consumer re-introduces shellMode/valeriaState/rail/full → FAIL.
 * Storage key 'vitalia-shell-state' MUST stay (E2E addInitScript + persisted migration).
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import {
  useShellStore,
  type ValeriaOpen,
  SHELL_STORAGE_KEY,
} from "@/stores/shell-store";

describe("Architecture: shell-store schema invariant (T-1 new machine)", () => {
  it("exports ValeriaOpen union: closed | chat", () => {
    const validStates: ValeriaOpen[] = ["closed", "chat"];
    expect(validStates).toEqual(["closed", "chat"]);
  });

  it("SHELL_STORAGE_KEY equals vitalia-shell-state (conserved)", () => {
    // Storage key cementado F1-S4 — must NOT change (breaks E2E addInitScript + persisted migration)
    expect(SHELL_STORAGE_KEY).toBe("vitalia-shell-state");
  });

  it("useShellStore exposes setValeriaOpen setter", () => {
    expect(typeof useShellStore.getState().setValeriaOpen).toBe("function");
  });

  it("useShellStore exposes openValeria / collapseValeria setters", () => {
    expect(typeof useShellStore.getState().openValeria).toBe("function");
    expect(typeof useShellStore.getState().collapseValeria).toBe("function");
  });

  it("useShellStore exposes setHistoryOpen / openHistory / closeHistory / toggleHistory", () => {
    const state = useShellStore.getState();
    expect(typeof state.setHistoryOpen).toBe("function");
    expect(typeof state.openHistory).toBe("function");
    expect(typeof state.closeHistory).toBe("function");
    expect(typeof state.toggleHistory).toBe("function");
  });

  it("useShellStore exposes setValeriaPct setter", () => {
    expect(typeof useShellStore.getState().setValeriaPct).toBe("function");
  });

  it("default valeriaOpen is chat (03-arch-fe § 1.1)", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });

  it("default historyOpen is false (RN-5/RN-11 — never persisted open)", () => {
    useShellStore.setState({ valeriaOpen: "chat", historyOpen: false });
    expect(useShellStore.getState().historyOpen).toBe(false);
  });

  it("setValeriaOpen updates to each valid state", () => {
    useShellStore.getState().setValeriaOpen("closed");
    expect(useShellStore.getState().valeriaOpen).toBe("closed");

    useShellStore.getState().setValeriaOpen("chat");
    expect(useShellStore.getState().valeriaOpen).toBe("chat");
  });

  it("collapseValeria → closed AND historyOpen=false (RN-6)", () => {
    useShellStore.getState().setValeriaOpen("chat");
    useShellStore.getState().setHistoryOpen(true);
    useShellStore.getState().collapseValeria();
    expect(useShellStore.getState().valeriaOpen).toBe("closed");
    expect(useShellStore.getState().historyOpen).toBe(false);
  });

  it("openValeria → chat, NEVER restores history (RN-5)", () => {
    useShellStore.getState().setValeriaOpen("chat");
    useShellStore.getState().setHistoryOpen(true);
    useShellStore.getState().collapseValeria();
    useShellStore.getState().openValeria();
    expect(useShellStore.getState().valeriaOpen).toBe("chat");
    expect(useShellStore.getState().historyOpen).toBe(false);
  });

  it("openHistory from closed opens Valeria too (A → B+C) (RN-7 additive)", () => {
    useShellStore.getState().setValeriaOpen("closed");
    useShellStore.getState().openHistory();
    expect(useShellStore.getState().valeriaOpen).toBe("chat");
    expect(useShellStore.getState().historyOpen).toBe(true);
  });

  it("shellMode / valeriaState / cycleValeriaState removed (AC-1)", () => {
    const state = useShellStore.getState() as unknown as Record<string, unknown>;
    expect(state.shellMode).toBeUndefined();
    expect(state.valeriaState).toBeUndefined();
    expect(state.cycleValeriaState).toBeUndefined();
    expect(state.setShellMode).toBeUndefined();
    expect(state.setValeriaState).toBeUndefined();
  });
});
