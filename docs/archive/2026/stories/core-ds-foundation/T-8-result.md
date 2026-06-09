# T-8 result — Page archetypes (list/detail/form/dashboard) in @luana/ui-kit

**Ticket:** T-8 · story `core-ds-foundation` · canon §6.2 (page archetypes / capa 5).
**Scope:** scaffolds that compose existing T-3..T-7 primitives via slots. Consumers FILL slots — no bespoke layout.

## Files created/modified
- `core/@luana/ui-kit/src/archetypes/ListPageScaffold.tsx` — PageHeader + toolbar slot + grid `auto-fill minmax(250px,1fr)` of EntityInfoCard + EmptyState/ErrorState/ListPageSkeleton states + optional Pagination. State precedence: error → loading → empty → grid.
- `core/@luana/ui-kit/src/archetypes/DetailPageScaffold.tsx` — `subnav` slot (EntitySubNavBar / EntityWorkspaceLayout, router-free) or `header` slot + DetailLayout content + ErrorState/FormPageSkeleton states. Kept router-free (no next/navigation) so it's testable without router mocks.
- `core/@luana/ui-kit/src/archetypes/FormPageScaffold.tsx` — PageHeader + FormLayout (`paired` opt) + `autosaveIndicator` slot (one FloatingAutosaveIndicator per page, canon §2.6) + FormPageSkeleton loading.
- `core/@luana/ui-kit/src/archetypes/DashboardPageScaffold.tsx` — PageHeader + PageContentStack of PageSection blocks (children) + ErrorState/skeleton states.
- `core/@luana/ui-kit/src/archetypes/index.ts` — barrel.
- `core/@luana/ui-kit/src/index.ts` — added `export * from "./archetypes"`.
- `core/@luana/ui-kit/src/__tests__/archetypes.test.tsx` — validator F-11 (16 tests).

All scaffold files carry header `// canon: design-system-canon.md §6.2 · story-origin: core-ds-foundation`. Default strings Spanish neutro LatAm. Named exports only.

## Gate output
- `npx vitest run src/__tests__/archetypes.test.tsx` → **16 passed (16)** GREEN.
- `npx tsc --noEmit 2>&1 | grep "src/archetypes"` → **EMPTY** (source tsc-clean). The only `archetypes`-matching tsc errors are `toBeInTheDocument` jest-dom matcher noise inside `__tests__/archetypes.test.tsx` — identical to the pre-existing noise in `layout-primitives.test.tsx` (package-wide jest-dom type gap), explicitly out of scope per ticket.
- Full package `npx vitest run` → **133 passed (133)** across 11 files — no regression.

## Design notes
- Scaffolds COMPOSE primitives (import) — none reimplement PageHeader/EmptyState/etc.
- DetailPageScaffold takes the N3 ribbon as a `subnav` slot rather than mounting EntityWorkspaceLayout internally, to avoid coupling the archetype to next/navigation (EntityWorkspaceLayout needs `useParams`). Consumers pass either an `<EntitySubNavBar/>` or `<EntityWorkspaceLayout/>`.
- `error` accepts a node (custom) or `true` (renders a default neutral ErrorState).

## Skills consulted
- None invoked (self-contained FE compose ticket; primitives + canon confirmed by reading T-3..T-7 source). Canon SSoT: `docs/architecture/luana-platform/design-system-canon.md §6.2`.

## SHA
`784fbe8b` (wip/vitalia)
