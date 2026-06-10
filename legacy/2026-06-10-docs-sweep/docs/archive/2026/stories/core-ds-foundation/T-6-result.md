# T-6 result — EntityPicker (net-new, debounced + windowed) in @luana/ui-kit

**Ticket:** T-6 of `core-ds-foundation` · **Canon:** design-system-canon.md §2.4 · **Status:** GREEN

## Files

- `core/@luana/ui-kit/src/EntityPicker.tsx` — **NEW** (net-new, no prior art). Query-lib-agnostic
  entity selector. `searchFn` prop (cursor pagination contract), Popover trigger (Avatar initials +
  name + chevron ▾), debounced search (`@luana/hooks` `useDebounce`, 200ms default), server-side
  fetch (never loads the whole collection — always passes `limit`), cursor pagination + infinite
  scroll, windowed/virtualized render via `@tanstack/react-virtual`, empty state ("Sin resultados"),
  count footer ("Mostrando N de M"), combobox/listbox a11y (role=listbox/option, ↑↓/Enter/Esc,
  autofocus search on open). Generic over `T extends EntityPickerItem`. Spanish neutro strings.
- `core/@luana/ui-kit/src/__tests__/EntityPicker.test.tsx` — **NEW** (Validator F-9, TDD).
- `core/@luana/ui-kit/src/index.ts` — added `export * from "./EntityPicker"`.
- `core/@luana/ui-kit/package.json` — added dependency `"@tanstack/react-virtual": "^3.0.0"`
  (resolves to store copy `3.13.24`).
- `core/@luana/ui-kit/vitest.config.ts` — test-env aliases (see workarounds): `@tanstack/react-virtual`
  → hoisted pnpm-store ESM entry; `@luana/hooks` → leaf `use-debounce` source.
- `core/@luana/ui-kit/tsconfig.json` — `baseUrl` + `paths` mapping `@tanstack/react-virtual` to the
  hoisted store `.d.ts` (so tsc resolves without `pnpm install`; native symlink wins once installed).

## Validator F-9 coverage (6 tests, all GREEN)

1. typing calls `searchFn` DEBOUNCED — `vi.useFakeTimers()`, type 4 chars fast → 0 extra calls
   until the 200ms window elapses → exactly 1 call with `q: "Pers"`.
2. `searchFn` ALWAYS called with a numeric `limit` (asserts every call's `args.limit === 20`) —
   never fetches the whole collection.
3. renders items returned by `searchFn` (windowed listbox, role=listbox + role=option present).
4. empty state ("Sin resultados") when `searchFn` returns `[]` (+ no listbox rendered).
5. selecting an item fires `onChange` (with the entity) and closes the popover.
6. selected entity shown in trigger label.

## Gate output

```
$ cd core/@luana/ui-kit && npx vitest run src/__tests__/EntityPicker.test.tsx
 ✓ src/__tests__/EntityPicker.test.tsx (6 tests)
 Test Files  1 passed (1)   Tests  6 passed (6)

$ npx tsc --noEmit 2>&1 | grep "src/EntityPicker"
src/EntityPicker.tsx  → EMPTY (source tsc-clean)
# Only noise: jest-dom matcher typings on EntityPicker.test.tsx (toHaveAttribute/
# toBeInTheDocument/toHaveTextContent) — identical pre-existing pattern on EntityInfoCard.test.tsx,
# explicitly ignorable per ticket.

$ npx vitest run   (full package)
 Test Files  8 passed (8)   Tests  93 passed (93)   ← no sibling regressions
```

## jsdom workaround (documented per ticket NOTE)

`@tanstack/react-virtual` (via `@tanstack/virtual-core`) measures the scroll element with
`element.offsetWidth/offsetHeight` and observes it with `ResizeObserver` — both 0/absent under
jsdom, so `getVirtualItems()` returns `[]` (the total-size div has height but renders no rows). The
test installs two stubs in `beforeAll` (restored in `afterAll`):
1. a no-op `ResizeObserver` class on `globalThis` (jsdom has none), and
2. `offsetHeight`/`offsetWidth` getters on `HTMLElement.prototype` returning a 300×320 viewport.
Rows still size deterministically via the component's `estimateSize: () => 44`, so the first window
renders and the returned items assert present. (A `getBoundingClientRect` stub alone was NOT enough —
virtual-core reads `offset*`, not the bounding rect.)

## Module-resolution workaround (no `pnpm install` per guardrail)

The dependency is declared in `package.json` but not symlinked into the package's local `node_modules`
without `pnpm install` (forbidden by the context guardrail). Both gates resolve it from the pnpm store
without installing: vitest via `alias`, tsc via `paths`. Once a real `pnpm install` runs (CI/gate-runner),
the native symlink resolves and these mappings are inert.

## Skills consulted

None invoked (focused net-new build). Composed atoms per `frontend-fsd` / `frontend-visual-fidelity`
(D1 design-system-first: reused Popover/Input/Avatar atoms + `@luana/hooks` useDebounce, no reinvented
primitives) and `spanish-text` (neutro strings, no voseo).

## SHA

`89a78e3b` (branch `wip/vitalia`)
