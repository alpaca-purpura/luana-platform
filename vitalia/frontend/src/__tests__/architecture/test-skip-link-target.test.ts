import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LAYOUT_PATH = resolve(__dirname, '../../components/shared/shell-organism/ShellOrganismLayout.tsx')

describe('arch: skip-link target invariant (NEW gate T-6)', () => {
  const src = readFileSync(LAYOUT_PATH, 'utf-8')

  it("ShellOrganismLayout contains main id='main-content'", () => {
    expect(src).toMatch(/<main[^>]*id=["']main-content["']/i)
  })

  it("main has tabIndex={-1}", () => {
    expect(src).toMatch(/tabIndex\s*=\s*\{?-1\}?/i)
  })
})
