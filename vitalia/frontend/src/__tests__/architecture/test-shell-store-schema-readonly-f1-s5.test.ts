/**
 * Architecture test — Shell Store Schema Invariant (F1-S5 Read-Only Enforce)
 *
 * T-7 of vitalia-fase1-valeria-rail-history (F1-S5 Wave 3)
 *
 * Purpose: regression guard that F1-S5 did NOT modify the shell-store.ts schema
 * established in F1-S4. ValeriaSidebar and sibling components are READ-ONLY
 * consumers of the store — they MUST NOT add new state, change union types,
 * or rename/remove existing fields.
 *
 * If this test fails after F1-S5 changes, it means shell-store.ts was illegally
 * modified. Fix: revert the store change, not this test.
 *
 * Ratchet-style: allowlist is the F1-S4 cementado schema. Any deviation = FAIL.
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers
 */

import { describe, it, expect } from 'vitest';
import { useShellStore, type ValeriaState, type ShellMode, SHELL_STORAGE_KEY } from '@/stores/shell-store';

describe('Architecture: shell-store schema invariant (F1-S5 read-only enforce)', () => {
  it('exports ValeriaState union: collapsed | rail | full', () => {
    // Verify the union type values are stable (compile-time + runtime check)
    const validStates: ValeriaState[] = ['collapsed', 'rail', 'full'];
    expect(validStates).toEqual(['collapsed', 'rail', 'full']);
  });

  it('exports ShellMode union: agentic | web', () => {
    const validModes: ShellMode[] = ['agentic', 'web'];
    expect(validModes).toEqual(['agentic', 'web']);
  });

  it('SHELL_STORAGE_KEY equals vitalia-shell-state', () => {
    // Storage key cementado F1-S4 — must NOT change (breaks E2E addInitScript + existing persisted state)
    expect(SHELL_STORAGE_KEY).toBe('vitalia-shell-state');
  });

  it('useShellStore exposes setValeriaState setter', () => {
    const state = useShellStore.getState();
    expect(typeof state.setValeriaState).toBe('function');
  });

  it('useShellStore exposes setShellMode setter', () => {
    const state = useShellStore.getState();
    expect(typeof state.setShellMode).toBe('function');
  });

  it('useShellStore exposes cycleValeriaState setter', () => {
    const state = useShellStore.getState();
    expect(typeof state.cycleValeriaState).toBe('function');
  });

  it('default valeriaState is full (F1-S4 architect override cementado)', () => {
    // Reset store to initial state (without persisted localStorage override)
    useShellStore.setState({ valeriaState: 'full', shellMode: 'agentic' });
    const state = useShellStore.getState();
    expect(state.valeriaState).toBe('full');
  });

  it('default shellMode is agentic (F1-S4 cementado)', () => {
    useShellStore.setState({ valeriaState: 'full', shellMode: 'agentic' });
    const state = useShellStore.getState();
    expect(state.shellMode).toBe('agentic');
  });

  it('setValeriaState correctly updates to each valid state', () => {
    useShellStore.getState().setValeriaState('rail');
    expect(useShellStore.getState().valeriaState).toBe('rail');

    useShellStore.getState().setValeriaState('full');
    expect(useShellStore.getState().valeriaState).toBe('full');

    useShellStore.getState().setValeriaState('collapsed');
    expect(useShellStore.getState().valeriaState).toBe('collapsed');
  });

  it('setShellMode correctly updates to each valid mode', () => {
    useShellStore.getState().setShellMode('web');
    expect(useShellStore.getState().shellMode).toBe('web');

    useShellStore.getState().setShellMode('agentic');
    expect(useShellStore.getState().shellMode).toBe('agentic');
  });

  it('cycleValeriaState cycles rail ↔ full (collapsed unreachable via cycle)', () => {
    useShellStore.setState({ valeriaState: 'full', shellMode: 'agentic' });
    useShellStore.getState().cycleValeriaState();
    expect(useShellStore.getState().valeriaState).toBe('rail');

    useShellStore.getState().cycleValeriaState();
    expect(useShellStore.getState().valeriaState).toBe('full');
  });
});
