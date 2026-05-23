import { describe, it, expect } from 'vitest'
import { SHELL_STORAGE_KEY, useShellStore } from '../../stores/shell-store'
import type { ValeriaState, ShellMode } from '../../stores/shell-store'

describe('arch: shell-store schema cementado (DC §6.1)', () => {
  it("exports ValeriaState union 'collapsed' | 'rail' | 'full'", () => {
    const validStates: ValeriaState[] = ['collapsed', 'rail', 'full']
    validStates.forEach(s => {
      useShellStore.getState().setValeriaState(s)
      expect(useShellStore.getState().valeriaState).toBe(s)
    })
  })

  it("exports ShellMode union 'agentic' | 'web'", () => {
    const validModes: ShellMode[] = ['agentic', 'web']
    validModes.forEach(m => {
      useShellStore.getState().setShellMode(m)
      expect(useShellStore.getState().shellMode).toBe(m)
    })
  })

  it("SHELL_STORAGE_KEY equals 'vitalia-shell-state'", () => {
    expect(SHELL_STORAGE_KEY).toBe('vitalia-shell-state')
  })
})
