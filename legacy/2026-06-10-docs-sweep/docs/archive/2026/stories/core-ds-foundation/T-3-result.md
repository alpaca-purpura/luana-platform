# T-3 result — Layout-primitives (@luana/ui-kit)

state: pushed · commit: `feec72e8` · built by: orchestrator-direct (builder-frontend subagent overflowed on this package ×4 — see § Note)

## Delivered
13 page-primitives in `core/@luana/ui-kit/src/layout/` (grouped 6 files + barrel), composing existing ui-kit atoms (Button, Skeleton) + Tailwind token classes:
- `page.tsx` — PageContainer · PageContentStack · PageHeader · PageSection
- `toolbar.tsx` — Toolbar · FilterBar
- `states.tsx` — EmptyState (generalized from vitalia shell-organism base) · ErrorState (role=alert + retry)
- `skeletons.tsx` — ListPageSkeleton · FormPageSkeleton
- `pagination.tsx` — Pagination (prev/next + "Página X de Y" + disabled bounds)
- `layouts.tsx` — DetailLayout · FormLayout (1-col default; 2-col only when `paired`)
- `layout/index.ts` barrel + `export * from "./layout"` in `src/index.ts`
- `__tests__/layout-primitives.test.tsx` (F-6)

## Gates
- **F-6 vitest: 7/7 GREEN** (`npx vitest run src/__tests__/layout-primitives.test.tsx`).
- **NF-1 tsc: `src/layout/` CLEAN** (fixed `title: ReactNode` vs DOM `title?: string` collision via `Omit<…, "title">` on 4 interfaces). The 13 `toBeInTheDocument`/`toBeDisabled` tsc lines are the package's pre-existing jest-dom-matcher convention (identical pattern in `tests/label.test.tsx`, `AutosaveBadge.test.tsx`, `inline-editable.test.tsx`) — vitest resolves them at runtime via `vitest.setup.ts`; not a new error category.
- Spanish neutro defaults (Reintentar / Algo salió mal / Página X de Y / Anterior / Siguiente).

## Skills consulted (must_load enforcement v4.1)
| Skill / Rule | Status | When |
|---|---|---|
| frontend-expert (canon contracts) | ✅ applied | composition pattern |
| .claude/rules/tdd-mandatory.md | ✅ | RED test before impl |
| .claude/rules/frontend-quality.md | ✅ | tsc/vitest gates |
| .claude/rules/spanish-text.md | ✅ | neutro defaults |
| .claude/rules/anti-duplication.md | ✅ | EmptyState lift (not new), consume atoms |

## Note (harness)
`builder-frontend` subagent overflowed ("Prompt is too long") ×4 on this `@luana/ui-kit` ticket — root cause traced to the agent reading `pnpm-lock.yaml` (20,688 lines ≈ 250k tokens) and/or broad reads during startup on the big component package. Orchestrator built T-3 directly (full read/command control). → harness backlog candidate: builder-frontend should hard-skip lockfiles/node_modules. (T-1/T-2 builders succeeded — smaller packages, no lockfile read.)

done -> docs/product/stories/core-ds-foundation/T-3-result.md
