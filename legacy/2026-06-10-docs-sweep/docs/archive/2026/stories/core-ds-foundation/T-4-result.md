# T-4 result — EntityWorkspaceLayout + EntitySubNavBar lift to @luana/ui-kit

**Ticket:** T-4 (story `core-ds-foundation`) — mechanical lift of the canon N3 list/detail
workspace (`EntityWorkspaceLayout` + `EntitySubNavBar`) from nicolify's shell-organism
into the shared `@luana/ui-kit`, generalized brand-agnostic.

**Canon:** `docs/architecture/luana-platform/design-system-canon.md` §2.1-§2.2
(full-bleed N3 third ribbon · root-pill `‹ {rootLabel}` · SSR-safe store-free skeleton).

---

## Delivered files

### Components (lifted + generalized — source-clean tsc)

- `core/@luana/ui-kit/src/EntitySubNavBar.tsx` — the N3 ribbon. Full-bleed sticky
  (`bg-card`, `border-b border-border`, `rounded-none` — NOT a rounded card). Root leaf
  is the first tab in the tablist with a leading `‹` back-arrow that navigates to
  `rootHref` via `router.push`. Master mode (`entity=null`) renders only the active root
  leaf + optional `placeholder`; detail mode renders root (inactive peer) + entity
  identity + content leaves + optional add-affordance. WAI-ARIA tablist (role=tablist/tab,
  aria-selected/current) + roving tabindex (←→/Home/End, circular wrap).
- `core/@luana/ui-kit/src/EntityWorkspaceLayout.tsx` — 1-panel URL-driven wrapper.
  Derives `activeLeaf` from the `[leaf]` route segment via `useParams` (URL-driven,
  NEVER a store). Mounts `EntitySubNavBar` + `{children}` (active leaf content). Store-free
  skeleton bar (G2) when `isLoading` — inert markup, subscribes to no store.

### Tests (validator F-7)

- `core/@luana/ui-kit/src/__tests__/EntitySubNavBar.test.tsx` (22 tests) — tablist/tab
  roles, master vs detail mode, root-pill is a `<button>` (not link) with the `‹` arrow +
  navigates `rootHref`, no `<a>` to rootHref, roving tabindex + keyboard nav incl. wrap,
  add-affordance calls `onAddAffordance` (hidden in master), content-leaf soft nav.
- `core/@luana/ui-kit/src/__tests__/EntityWorkspaceLayout.test.tsx` (7 tests) — master
  mode renders children/content slot + only root leaf (leaves not active), detail mode
  mounts the nav bar with leaves, URL-derived active leaf, **skeleton store-free**
  (isLoading renders skeleton with NO store provider wrapping).

### Barrel + enabling wiring (ui-kit-scoped)

- `core/@luana/ui-kit/src/index.ts` — added `export * from "./EntitySubNavBar"` +
  `export * from "./EntityWorkspaceLayout"`.
- `core/@luana/ui-kit/src/next-navigation.d.ts` — ambient module shim. `next` is a runtime
  peer (provided by the consuming Next app), not a dep of the lib → tsc can't resolve
  `next/navigation` types standalone. Shim declares the minimal hook surface so the package
  type-checks; inert in a real Next app.
- `core/@luana/ui-kit/src/__tests__/__mocks__/next-navigation.ts` + `vitest.config.ts`
  alias — vite's import-analysis resolves `next/navigation` to this stub in the test env
  (tests still override with `vi.mock`).
- `core/@luana/ui-kit/package.json` — declared `next` as an optional `peerDependency`
  (correctness: the lib needs the App Router at runtime, supplied by the host app).

---

## Generalization (brand-coupling stripped)

- `@/components/ui/*` → `./*` (ui-kit relative); `@/lib/utils` `cn` → `cn` from
  `@luana/format/utils`.
- nicolify agent theming removed: `_agent-tw-classes` (`agentBgClass`/`agentTextClass`/
  `AgentSlug`), hardcoded `bg-agent-abel-*`, the `agentSlug` prop — replaced by generic
  design tokens (`bg-accent`/`text-accent-foreground`, `bg-primary`) + the leaf's own
  static `avatarBgClass` (JIT-safe).
- `next/image` eliminated by switching entity avatar to the ui-kit `Avatar` primitive
  (no next/image mock needed).
- Hardcoded "Selecciona un ICP" placeholder → generic `placeholder?` prop.
- Headers swapped: nicolify `// cap:` / `// story-origin:` → `// canon: design-system-canon.md
  §2.1-§2.2 · story-origin: core-ds-foundation`.

**Invariant note:** the nicolify source had REMOVED the `‹` back-link (root as a bare peer
tab). The ticket invariant requires the root-pill `‹ {rootLabel}` WITH the arrow, so the
lift re-adds the `‹` (ticket overrides source) — covered by an explicit test.

**Contract preserved:** `EntityWorkspaceLayout` props `{ entity|null, leaves[], rootHref,
rootLabel, isLoading?, onAddAffordance?, children }` (+ added optional `placeholder?`,
`className?`). `EntitySubNavLeaf = { id, label, href, isAddAffordance?, prefixEmoji?,
avatarBgClass?, isPrimary? }`.

---

## Gate output

```
$ npx vitest run src/__tests__/EntityWorkspaceLayout.test.tsx src/__tests__/EntitySubNavBar.test.tsx
 ✓ src/__tests__/EntityWorkspaceLayout.test.tsx (7 tests)
 ✓ src/__tests__/EntitySubNavBar.test.tsx (22 tests)
 Test Files  2 passed (2)
      Tests  29 passed (29)

$ npx tsc --noEmit 2>&1 | grep -E "src/EntityWorkspaceLayout|src/EntitySubNavBar"
(empty — SOURCE files tsc-clean)
```

Remaining tsc output is pre-existing, ticket-permitted noise only: jest-dom matcher
errors in test files (identical to the pre-existing `layout-primitives.test.tsx`) +
unrelated `../hooks/src/use-copilot-offset.ts` errors. No new errors in source.

## Skills consulted

None — pure mechanical lift + generalization (no agentic/domain skill needed). Followed
canon §2.1-§2.2, `frontend-fsd.md` (named exports, ui-kit layering), `frontend-visual-fidelity.md`
(canon binding), `anti-duplication.md` (lift to shared, no cross-brand mirror).

## Commit

`feat(core-ds): T-4 EntityWorkspaceLayout + EntitySubNavBar lift to @luana/ui-kit`

SHA: 1777d58d
