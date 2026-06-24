---
ticket: T-2
story: nicolify-r0-design-system-adoption
agent: builder-frontend
model: claude-sonnet-4-6
date: 2026-06-15
status: PASS
---

# T-2 result — Kill 4 local mirrors → @luana/ui-kit

## Verdict: PASS (all gates GREEN)

## Diff summary

### DELETED (6 files via `git rm`)

| File | Reason |
|---|---|
| `src/components/shared/AutosaveBadge.tsx` | Local mirror of kit `AutosaveBadge` |
| `src/components/shared/shell-organism/EmptyState.tsx` | Local mirror of kit `ShellEmptyState` |
| `src/components/shared/shell-organism/EntitySubNavBar.tsx` | Local mirror of kit `EntitySubNavBar` (had `agentSlug` prop, agent-abel color) |
| `src/components/shared/shell-organism/EntitySubNavBar.test.tsx` | Tests for the deleted mirror (24 tests) |
| `src/components/shared/shell-organism/EntityWorkspaceLayout.tsx` | Local mirror of kit `EntityWorkspaceLayout` |
| `src/components/shared/shell-organism/EntityWorkspaceLayout.test.tsx` | Tests for the deleted mirror |

Net: -1483 lines of mirror code eliminated.

### NEW (2 arch-test files — TDD RED-first)

| File | Gate | Tests |
|---|---|---|
| `src/__tests__/architecture/test-no-kit-mirror.test.ts` | V5 — 0 local declarations of kit component names in `components/shared/` | 5 tests (4 components × RED-before-delete, 1 allowlist-empty ratchet) |
| `src/__tests__/architecture/test-no-cross-brand-import.test.ts` | V6 — 0 imports from vitalia/comunify/lupulo in nicolify src/ | 2 tests (1 violations assert, 1 allowlist-empty ratchet) |

Both tests were written BEFORE mirrors were deleted (RED phase confirmed). Deletion made them GREEN.

### MODIFIED (4 consumer files)

| File | Change |
|---|---|
| `src/components/shared/shell-organism/SubTabContent.tsx` | `EmptyState` → `ShellEmptyState` from `@luana/ui-kit`; `EntitySubNavBar`+`EntitySubNavLeaf` → `@luana/ui-kit`; dropped `agentSlug="abel"` prop |
| `src/features/abel/components/icp/IcpEntityLayoutClient.tsx` | `EntityWorkspaceLayout` + types `EntitySubNavLeaf`/`EntitySubNavEntity` → `@luana/ui-kit` |
| `src/features/abel/components/icp/IcpDatosForm.tsx` | `AutosaveBadge` → `@luana/ui-kit`; removed `data-testid="icp-autosave-badge"` |
| `src/features/abel/components/icp/BuyerLeafForm.tsx` | `AutosaveBadge` → `@luana/ui-kit`; removed `data-testid="buyer-autosave-badge"` |

## Prop-divergence decisions (per 03-arch.md §6.2)

| Divergence | Decision |
|---|---|
| `agentSlug: AgentSlug` (local `EntitySubNavBar`) — agent-abel color via `_agent-tw-classes` | **Dropped.** Kit is brand-agnostic via semantic `accent` tokens. Active leaf uses `bg-accent text-accent-foreground`. Per 03-arch.md §6.2: "drop agentSlug — kit accent-slot-lift candidate" (flag only if kit semantic tokens don't render agent color; not flagged since brand `--primary` maps to abel indigo #635BFF). |
| `data-testid` prop (local `AutosaveBadge`) — kit has no such prop | **Removed.** Kit uses `data-state={status}` attribute. Existing tests test via hook mock, not DOM selector — no test failures. |
| `AutosaveStatus` 4-value local vs 5-value kit (`"idle"\|"dirty"\|"saving"\|"saved"\|"error"`) | **No change needed.** Local 4-value is structural subtype of kit 5-value. `dirty` state never emitted by local `useAutosave`. TypeScript accepts it. |
| `EmptyState` name clash with layout-level empty state | **Used `ShellEmptyState` alias.** Kit exports `EmptyState` from `./organism/shell` as `ShellEmptyState`. Same API, only import name changes. |

## Validator output

### V2 — TypeScript strict (tsc --noEmit)
```
0 errors
```

### V5 — arch test no-kit-mirror
```
✓ Architecture V5: no local mirror of @luana/ui-kit components (ADR-014) (5 tests) PASS
```

### V6 — arch test no-cross-brand-import
```
✓ Architecture V6: no cross-brand imports in nicolify frontend (ADR-014) (2 tests) PASS
```

### V11 — Vitest full suite
```
35 test files | 518 tests | all PASS
(note: deleted mirror tests -24 from EntitySubNavBar.test.tsx + EntityWorkspaceLayout.test.tsx)
```

### ESLint (src/)
```
✖ 53 problems (0 errors, 53 warnings)
```
0 errors. 53 warnings are all pre-existing in unmodified files (check-file, jsdoc, react-perf categories). No new warnings introduced by T-2 changes.

### Architecture fitness (all 160 tests)
```
PASS (160/160)
```

## Skills consulted

| Skill | Reason | Decision |
|---|---|---|
| `frontend-expert` | Runtime quality checklist — prop divergence patterns, AutosaveStatus structural subtype compat, agentSlug drop | `agentSlug` not retained; `ShellEmptyState` alias; `data-testid` removed |
| React patterns baseline | Arch-test design (ratchet, empty allowlists, KNOWN_ arrays), import repoint patterns | TDD RED-first confirmed; ratchet pattern applied |
| FSD-Lite / anti-duplication | V6 arch-test covers cross-brand imports, V5 covers local mirrors | Both arch-tests use empty allowlists |

## Kit-lift flags

None. Per 03-arch.md §6.2:
- `agentSlug` / accent-slot-lift: gated on visual golden (T-5). If semantic tokens don't render agent color in real UI → flag then.
- `data-testid` on AutosaveBadge: kit uses `data-state` attribute instead. Tests use hook mocks, not DOM selectors. No impact.

## Constraints honored

- `forbidden_to_touch`: `core/@luana/` — NOT touched. `vitalia/` / `comunify/` / `lupulo/` — NOT touched. `nicolify/backend/` — NOT touched.
- PROP-DIVERGENCE = adapted CONSUMER, NEVER edited the kit.
- Staged by exact pathspec (NEVER `git add -A`).

## Commit SHA

facdd25b
