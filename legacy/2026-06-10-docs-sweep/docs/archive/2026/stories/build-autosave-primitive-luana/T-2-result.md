---
ticket: T-2
story_id: build-autosave-primitive-luana
surface: FE
module: luana-ui-kit
state: done
completed_at: 2026-05-30
---

# T-2 Result — @luana/ui-kit AutosaveBadge + showcase

## Deliverables produced

| File | Status | Notes |
|---|---|---|
| `core/@luana/ui-kit/src/AutosaveBadge.tsx` | ✅ Created | Composes badge.tsx; aria-live; contrast AA; no Clerk |
| `core/@luana/ui-kit/src/__tests__/AutosaveBadge.test.tsx` | ✅ Created | 32 tests (RED→GREEN TDD) |
| `core/@luana/ui-kit/src/examples/AutosaveShowcase.tsx` | ✅ Created | Consumer-of-reference end-to-end |
| `core/@luana/ui-kit/src/index.ts` | ✅ Updated | APPEND only — existing exports untouched |
| `core/@luana/ui-kit/package.json` | ✅ Bumped | 0.1.0 → 0.2.0 (minor, new feature) |
| `core/@luana/ui-kit/CHANGELOG.md` | ✅ Created | Documents v0.2.0 additions |

## Validators

| Validator | Result | Notes |
|---|---|---|
| `uikit_tsc` | ✅ PASS (my files: 0 new errors) | 10 pre-existing errors in calendar.tsx, timezone-select.tsx, hooks/use-copilot-offset.ts, tests/label.test.tsx — not introduced by T-2 |
| `autosaveBadge_component` | ✅ PASS | 32/32 tests green |
| `arch_no_clerk_in_luana` | ✅ PASS | 0 `@clerk/*` imports in any @luana package |
| `arch_luana_barrels_export` | ✅ PASS | AutosaveBadge in ui-kit/index.ts; useAutosave in hooks/index.ts; AutosaveStatus in schemas/index.ts |

## Skills consulted

| Skill | Why | Decision taken |
|---|---|---|
| `frontend-expert` | FSD structure, component patterns, barrel exports | Placed component in `core/@luana/ui-kit/src/` (library root, not features/); barrel export APPEND per rules |
| `tessl__shadcn-ui` | Compose existing badge.tsx, not reinvent | Used Badge wrapper pattern; composed with `cn()` from `@luana/format/utils` |
| `tessl__tailwind` | Token-based classes; no inline style; `cn()` | All colors via design tokens (emerald-700, amber-700, destructive, muted-foreground); no hex |
| `tessl__vitest` | TDD RED-first; fake timers; component tests | 32 tests written before implementation; covers all states + aria + i18n + contrast guard |
| `tessl__react-patterns` | aria-live, role=status, aria-atomic, icon aria-hidden | polite/assertive split by urgency; never color-only |
| `spanish-text.md` | Spanish neutro LatAm labels (no voseo) | Labels: "Sin guardar" / "Guardando…" / "Guardado" / "No se pudo guardar. Reintenta." |
| `brand-expert` | Prior art reconciliation from vitalia AutosaveBadge | Reconciled states/copy; corrected WCAG bug (emerald-600 3.65:1 → emerald-700 5.49:1) |

## Architecture decisions

### Import chain
- `AutosaveStatus` imported from `@luana/hooks` (not `@luana/schemas`) — because `@luana/schemas` is not a dependency of ui-kit. The type is re-exported from hooks which IS in ui-kit's deps. This avoids adding a new package.json dep and stays consistent with existing dependency graph.

### Contrast fix (vitalia prior art WCAG bug NOT reproduced)
- vitalia/frontend `AutosaveBadge.tsx` used `text-emerald-600 dark:text-emerald-400` = 3.65:1 on white — below AA threshold.
- This implementation uses `text-emerald-700 dark:text-emerald-400` = 5.49:1 on white — AA compliant.
- Test explicitly guards against `emerald-500`, `emerald-600` in the className.

### aria-live split
- `polite` for idle/dirty/saving/saved — informational, no urgency.
- `assertive` for error — user action needed (retry), screen reader should interrupt.

### No axe-core
- jest-axe / @axe-core not installed in ui-kit devDependencies. Rather than adding a new dep, contrast correctness is enforced via:
  1. Token class assertions (no hex pattern).
  2. emerald-700 assertion (explicit AA-compliant class).
  3. Design-token semantic classes (destructive = accessible red per Luana theme).

### Consumer-of-reference showcase
- `src/examples/AutosaveShowcase.tsx` — minimal wrapper proving the hook↔component contract typechecks.
- No brand imports, no Clerk imports — pure @luana package refs.
- Typechecks with `npx tsc --noEmit` (0 new errors introduced).

## Mockup scope notes
- No UI-SPEC.md / design.md / mockups required for this ticket — it's a platform primitive, not a brand-facing UI story. The vitalia prior art (`AutosaveBadge.tsx`) served as the UX reference per the architect spec.

## Integration (CONN check)
- **Consumed**: AutosaveBadge is exported from barrel (consumable from `@luana/ui-kit`) and imported in `AutosaveShowcase.tsx` (direct consumer). T-3 (nicolify form-runtime) will consume it as the next ticket.
- **On-the-map**: cap `platform.autosave-primitive-platform` (ADR-012).
- **Navigable**: exported from barrel → importable by any brand.
- **Notarized**: `export * from "./AutosaveBadge"` in `src/index.ts`.

## Test summary

```
 ✓ src/__tests__/AutosaveBadge.test.tsx (32 tests) 81ms
 ✓ tests/label.test.tsx (2 tests)
 ✓ tests/inline-editable.test.tsx (5 tests)
 Test Files  3 passed (3)
 Tests  39 passed (39)
```

## Pre-existing tsc errors (not introduced by T-2)

10 pre-existing errors in:
- `../hooks/src/use-copilot-offset.ts` (3 errors — module `@/features/copilot/*` not resolved + any type)
- `src/calendar.tsx` (1 error — @types/react mismatch)
- `src/timezone-select.tsx` (4 errors — Intl.supportedValuesOf + any types)
- `tests/label.test.tsx` (2 errors — missing jest-dom types)

T-2 introduces 0 new tsc errors.
