// cap: shell-organism.shell-vitalia
// story-origin: vitalia-shell-core-hardening
/**
 * Architecture test — Shell Store Schema (NEW machine, T-1 vitalia-shell-core-hardening).
 *
 * Supersedes the F1-S4/F1-S5 collapsed|rail|full + shellMode schema.
 * New schema (03-arch-fe.md § 1.1): valeriaOpen 'closed'|'chat' + historyOpen additive.
 * shellMode ELIMINATED (AC-1/RN-1).
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import { SHELL_STORAGE_KEY, useShellStore } from "../../stores/shell-store";
import type { ValeriaOpen } from "../../stores/shell-store";

describe("arch: shell-store schema (T-1 new machine closed|chat + historyOpen)", () => {
  it("exports ValeriaOpen union 'closed' | 'chat'", () => {
    const validStates: ValeriaOpen[] = ["closed", "chat"];
    validStates.forEach((s) => {
      useShellStore.getState().setValeriaOpen(s);
      expect(useShellStore.getState().valeriaOpen).toBe(s);
    });
  });

  it("historyOpen is a boolean slice (additive, not conflated with valeriaOpen)", () => {
    useShellStore.getState().setValeriaOpen("chat");
    useShellStore.getState().setHistoryOpen(true);
    expect(useShellStore.getState().historyOpen).toBe(true);
    expect(typeof useShellStore.getState().historyOpen).toBe("boolean");
  });

  it("shellMode + cycleValeriaState + valeriaState ELIMINATED (AC-1)", () => {
    const state = useShellStore.getState() as unknown as Record<string, unknown>;
    expect(state.shellMode).toBeUndefined();
    expect(state.setShellMode).toBeUndefined();
    expect(state.cycleValeriaState).toBeUndefined();
    expect(state.valeriaState).toBeUndefined();
    expect(state.setValeriaState).toBeUndefined();
  });

  it("SHELL_STORAGE_KEY equals 'vitalia-shell-state' (conserved)", () => {
    expect(SHELL_STORAGE_KEY).toBe("vitalia-shell-state");
  });
});
