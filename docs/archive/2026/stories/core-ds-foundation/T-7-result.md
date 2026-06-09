# T-7 result — useAutosave coalesce + FloatingAutosaveIndicator + Group in @luana

**Ticket:** T-7 (core-ds-foundation) — EXTEND shared autosave hook + LIFT two components into `@luana` design packages.
**Status:** ✅ done — TDD GREEN, source tsc-clean, back-compat preserved.
**Branch:** wip/vitalia.

## 7a — EXTEND `useAutosave` (back-compat HARD)

`core/@luana/hooks/src/useAutosave.ts` — extended in place (NOT a parallel hook):

- New option `coalesce?: boolean` (default `false`). When `true`, successive `scheduleSave` calls **shallow-merge** their payloads (on plain objects) into one save instead of last-wins. Primitives / arrays / non-plain objects degrade to last-wins.
- New return method `flush(): Promise<void>` — cancels the debounce and saves the accumulated payload immediately; no-op if nothing pending. Keeps `lastValuesRef` populated so `retry()` and idempotent re-save still work.
- **Back-compat:** defaults UNCHANGED — `coalesce: false`, `debounceMs: 2000`. Existing callers keep last-wins behavior untouched. New canon consumers pass `{ coalesce: true, debounceMs: 600 }`.
- Added private `isPlainObject()` guard (proto === Object.prototype || null) to gate the merge path safely.

## 7b — LIFT `FloatingAutosaveIndicator`

`core/@luana/ui-kit/src/FloatingAutosaveIndicator.tsx` (new) — sticky bottom-center, ONE per page (SSoT, canon §2.6):

- Wrapper `pointer-events-none sticky bottom-4 ... flex justify-center`; pill `pointer-events-auto`, `role="status"`, `aria-live` (assertive on error, polite otherwise), `aria-atomic`, `data-testid="autosave-indicator"`, `data-state={status}`.
- Brand-agnostic: 100% token-driven styles (border/card/muted/destructive + AA-safe emerald for "saved"). NO hardcoded hex, NO per-agent color (vitalia's `agent-lisa` accent dropped → neutral token).
- Spanish neutro labels (`DEFAULT_FLOATING_AUTOSAVE_LABELS`, sin voseo), `labels` override for i18n. `relativeTime()` helper for "Guardado ahora mismo".
- `cn` from `@luana/format/utils`; `AutosaveStatus` type-import from `@luana/hooks`.

## 7c — LIFT `Group` / `GroupHeader`

`core/@luana/ui-kit/src/Group.tsx` (new) — generic/brand-agnostic group container (canon §2.6):

- `Group` — `data-testid="group"`, `data-state={hasError ? "error" : "default"}`; semantic error state = red border (`border-destructive/50`). Agent-color strip on the **LEFT** via `accentClass` (token utility) or `accentVar` (CSS var → inline `borderLeftColor: hsl(var(...))`) + structural `border-l-4`. NEVER hex.
- `GroupHeader` — title + optional `WhatForChip` ("para qué") + inline missing-fields alert (`role="alert"`, `Falta: a, b`, custom `missingLabel`).
- `WhatForChip` — generic (label + optional Radix tooltip); does NOT know agents/brand (did not lift nicolify's hardcoded-slug version).
- **twMerge note:** in `Group`'s `cn()`, `accentClass` is placed AFTER the default/error border classes so tailwind-merge keeps the left-edge accent color (placing it before let `border-border/60` dedupe-drop it).

## Exports

`core/@luana/ui-kit/src/index.ts` — added `export * from "./FloatingAutosaveIndicator"` and `export * from "./Group"` (with canon §2.6 comments).

## Headers

Every new file carries: `// canon: design-system-canon.md §2.6 · story-origin: core-ds-foundation`.

## Verification

| Suite | Result |
|---|---|
| `hooks` useAutosave.test.ts (existing, last-wins) | 11 passed — unchanged ✅ |
| `hooks` useAutosave-coalesce.test.ts (new) | 6 passed ✅ |
| `ui-kit` FloatingAutosaveIndicator.test.tsx (new) | 14 passed ✅ |
| `ui-kit` Group.test.tsx (new) | 10 passed ✅ |
| **Total** | **41 passed** |

`tsc --noEmit`: **T-7 source files emit ZERO errors** (useAutosave.ts, FloatingAutosaveIndicator.tsx, Group.tsx, index.ts). The package-level tsc errors that remain are **pre-existing baseline**, unrelated to T-7:
- ui-kit: jest-dom matcher type augmentation (`toBeInTheDocument`/`toHaveTextContent`) missing in tsc config — identical in ALL sibling test files (EntityInfoCard, EntityPicker, layout-primitives…); matchers resolve at vitest runtime.
- hooks: unrelated `use-copilot-offset.ts` / `use-currency-catalog.ts` / `use-shell-mutex.ts` / `_deferred/` modules (`@/...` aliases not resolvable from the package).

## Files changed

- `core/@luana/hooks/src/useAutosave.ts` (M)
- `core/@luana/hooks/src/__tests__/useAutosave-coalesce.test.ts` (A)
- `core/@luana/ui-kit/src/FloatingAutosaveIndicator.tsx` (A)
- `core/@luana/ui-kit/src/__tests__/FloatingAutosaveIndicator.test.tsx` (A)
- `core/@luana/ui-kit/src/Group.tsx` (A)
- `core/@luana/ui-kit/src/__tests__/Group.test.tsx` (A)
- `core/@luana/ui-kit/src/index.ts` (M)

Scope respected: edits only in `core/@luana/hooks/` + `core/@luana/ui-kit/`. No vitalia/nicolify src, no `core/luana-core-*`, no other tickets' files touched.
