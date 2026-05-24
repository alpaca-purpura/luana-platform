import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

const WS = resolve(__dirname, '../../../../..')   // hasta luana-vitalia/

function grepCount(pattern: string, paths: string[]): number {
  try {
    const targets = paths.filter(p => {
      try { return existsSync(p) } catch { return false }
    })
    if (targets.length === 0) return 0
    const result = execSync(`grep -rl "${pattern}" ${targets.join(' ')} 2>/dev/null || true`, { encoding: 'utf-8' })
    return result.trim().split('\n').filter(Boolean).length
  } catch {
    return 0
  }
}

const OTHER_BRANDS_FRONTEND = ['nicolify', 'comunify', 'lupulo']
  .map(b => `${WS}/${b}/frontend/src`)

describe('arch: anti-duplication cross-brand mirror = 0 (NEW gate T-6)', () => {
  it('no matches for ShellOrganismLayout in nicolify/comunify/lupulo', () => {
    expect(grepCount('ShellOrganismLayout', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for shell-store across brands', () => {
    expect(grepCount('shell-store', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for useShellStore across brands', () => {
    expect(grepCount('useShellStore', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for ValeriaSidebarSlot across brands', () => {
    expect(grepCount('ValeriaSidebarSlot', OTHER_BRANDS_FRONTEND)).toBe(0)
  })
})

describe('arch: anti-duplication cross-brand mirror = 0 (F1-S5 NEW names T-7)', () => {
  it('no matches for ValeriaSidebar in nicolify/comunify/lupulo', () => {
    expect(grepCount('ValeriaSidebar', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for ValeriaRail across brands', () => {
    expect(grepCount('ValeriaRail', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for ValeriaHistory across brands', () => {
    expect(grepCount('ValeriaHistory', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for ValeriaChatSlot across brands', () => {
    expect(grepCount('ValeriaChatSlot', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for HistoryItem across brands', () => {
    expect(grepCount('HistoryItem', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for HistoryGroup across brands', () => {
    expect(grepCount('HistoryGroup', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for EmptyStateInline across brands', () => {
    expect(grepCount('EmptyStateInline', OTHER_BRANDS_FRONTEND)).toBe(0)
  })

  it('no matches for useKeyboardShortcuts across brands', () => {
    expect(grepCount('useKeyboardShortcuts', OTHER_BRANDS_FRONTEND)).toBe(0)
  })
})
