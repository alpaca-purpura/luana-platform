# T-KIT-ALIGN2 — abel ICP `<div>` → `@luana/ui-kit` Stack/Grid micro-layout migration

**Story:** nicolify-r1-abel-icp-buyer (kit-alignment phase 2 · HB-111)
**Scope:** `nicolify/frontend/src/features/abel/components/icp/` (4 files) + baseline ratchet update
**Outcome:** abel = **0 flagged layout divs** (was 14). All 14 component-internal layout `<div>` migrated to the new kit `Stack`/`Grid` primitives. Zero visual change. Zero test weakening. All gates GREEN.

---

## Per-file div → primitive list (14 divs)

Primitive contract verified against `core/@luana/ui-kit/src/layout/stack.tsx`:
- `Stack` → `cn("flex", DIRECTION[dir], GAP[gap], align?ALIGN[align]:_, justify?JUSTIFY[justify]:_, className)` — `<Stack gap={1} className="min-w-0">` = `flex flex-col gap-1 min-w-0` (exact, tailwind-merge keeps non-conflicting classes).
- `Grid` → `cn("grid", COLS[cols], GAP[gap], className)` — `<Grid cols={2} gap={3}>` = `grid grid-cols-2 gap-3` (exact).
- All non-layout classes + every attribute (`data-testid`, `aria-busy`, `aria-label`, `role`, `aria-live`) preserved via `className` + `...props` passthrough.

### IcpCard.tsx (1 div)
| original `<div>` | → |
|---|---|
| `flex flex-col gap-1 min-w-0` (label stack, ~L132) | `<Stack gap={1} className="min-w-0">` |
- Import: `import { Badge } from "@luana/ui-kit"` → `import { Badge, Stack } from "@luana/ui-kit"`.

### IcpIntakeOverlay.tsx (3 divs — map listed only 1; 2 extra found by re-scan)
| original `<div>` | → |
|---|---|
| `flex flex-col items-center gap-4 py-8 text-center` (AnalyzingState, role=status, aria-live/aria-busy/data-testid, ~L215) | `<Stack gap={4} align="center" className="py-8 text-center" role="status" aria-live="polite" aria-busy="true" data-testid="intake-analyzing-state">` |
| `flex flex-col gap-4` (ErrorState outer, role=alert, aria-live/data-testid, ~L245) | `<Stack gap={4} role="alert" aria-live="polite" data-testid="intake-error-state">` |
| `flex flex-col items-center gap-3 py-4 text-center` (ErrorState inner, ~L250) | `<Stack gap={3} align="center" className="py-4 text-center">` |
- Import: added `import { Stack } from "@luana/ui-kit"` (placed first among external imports to satisfy `import/order`).
- The inner `w-12 h-12 ...` icon div + `flex justify-end gap-3 pt-2 border-t border-border` footer div are NOT layout divs (no `flex-col`+`gap`/`grid-cols`) → left as `<div>` (scanner does not flag them).

### IcpDatosForm.tsx (6 divs)
| original `<div>` | → |
|---|---|
| `flex flex-col gap-1` (FieldRow wrapper, ~L91) | `<Stack gap={1}>` |
| `grid grid-cols-2 gap-3` (Identidad: Vertical/Tamaño, ~L338) | `<Grid cols={2} gap={3}>` |
| `grid grid-cols-2 gap-3` (Identidad: Geografía/Modelo, ~L366) | `<Grid cols={2} gap={3}>` |
| `grid grid-cols-3 gap-3` (Firmográficos: ticket+moneda, ~L402) | `<Grid cols={3} gap={3}>` |
| `flex flex-col gap-2` (Señales wrapper, ~L500) | `<Stack gap={2}>` |
| `flex flex-col gap-2 mt-2 pt-4 border-t border-border/40` (Mark-ready wrapper, ~L576) | `<Stack gap={2} className="mt-2 pt-4 border-t border-border/40">` |
- Import: added `Grid` + `Stack` to existing `@luana/ui-kit` named import.
- Inner `col-span-2` div, `flex flex-wrap gap-1.5 min-h-7`, `flex items-center gap-2`, `flex items-center justify-end` → NOT layout divs, left as `<div>`.

### BuyerLeafForm.tsx (4 divs)
| original `<div>` | → |
|---|---|
| `flex flex-col gap-1` (FieldRow wrapper, ~L91) | `<Stack gap={1}>` |
| `flex flex-col gap-2` (ListDictField wrapper, data-testid, ~L140) | `<Stack gap={2} data-testid={testId}>` |
| `flex flex-col gap-3 p-6` (loading skeleton, aria-busy/aria-label, ~L305) | `<Stack gap={3} className="p-6" aria-busy="true" aria-label="Cargando buyer">` |
| `grid grid-cols-2 gap-3` (Identidad: Rol/Poder de decisión, ~L401) | `<Grid cols={2} gap={3}>` |
- Import: added `Grid` + `Stack` to existing `@luana/ui-kit` named import.
- Loading-state `aria-busy="true"` preserved as string passthrough — keeps DOM byte-identical (codebase convention asserts `.getAttribute("aria-busy") === "true"`).

---

## Baseline ratchet (`test-no-div-layout.test.ts`)

| Const | from | to |
|---|---|---|
| `BASELINE_TOTAL` | 32 | **18** |
| `BASELINE_FILES` | 11 | **7** |

Re-counted (not guessed) with the real `_ds-lock-scanner::countLayoutDivs` logic (`flex-col`+`gap-` OR `grid-cols-`, comments stripped, `.tsx` only):
- abel ICP scan: 14 → **0** flagged.
- full `src` scan: 32 → **18** total (32 − 14 = 18 ✓); 11 → **7** files (4 abel files dropped to 0 layout divs: IcpCard, IcpIntakeOverlay, IcpDatosForm, BuyerLeafForm ✓).
- Comment updated to note the abel kit-primitive (Stack/Grid · HB-111) migration.

---

## Tests updated

**NONE.** No test assertion needed changing. The migration preserved every DOM query target:
- `BuyerLeafForm.test.tsx:180` — `getByRole("generic", { name: "Cargando buyer" })` still resolves: `Stack` renders a `<div>` (implicit `generic` role) and `aria-label="Cargando buyer"` is preserved via passthrough.
- `IcpMasterListView.test.tsx:216` — `aria-busy === "true"` targets `icp-master-loading` (out of scope, untouched).
- `IcpCard.test.tsx:110` — `[class*="completeness"]` (RN-8 ring check, unaffected).
- All `data-testid` (intake-analyzing-state, intake-error-state, buyer-pain-points, etc.) preserved via passthrough → testid-based queries unchanged.

---

## Gate outputs (verbatim)

```
$ npx tsc --noEmit
../../core/@luana/hooks/src/create-ssr-safe-persisted-store.ts(195,32): error TS2345: ...
  → PRE-EXISTING engine error, UNRELATED to abel (task said ignore).
abel-related tsc errors: 0
```

```
$ npx eslint src/features/abel src/__tests__/architecture --cache
✖ 142 problems (0 errors, 142 warnings)
  ESLINT_EXIT=0
  → 0 errors. 142 warnings all PRE-EXISTING in non-migrated abel files
    (hooks/types/store). The 4 migrated icp files introduce 0 new warnings
    (IcpIntakeOverlay is fully clean; import/order self-correction left
    the overall count at 142, slightly below the 144 at file-open).
```

```
$ npx vitest run src/features/abel src/__tests__/architecture
 Test Files  26 passed (26)
      Tests  344 passed (344)
  → includes the 4 DS ratchets (test-no-div-layout with lowered baseline 18/7,
    test-no-native-select, test-no-local-kit-primitive, test-no-kit-mirror)
    + IcpCard/IcpDatosForm/BuyerLeafForm component tests.
```

```
$ node scan.mjs src/features/abel/components/icp
TOTAL 0 FILES 0          ← abel = 0 flagged layout divs ✓

$ node scan.mjs src
TOTAL 18 FILES 7         ← matches new baseline ✓
```

---

## Confirmation

- **abel = 0 flagged layout divs** (verified twice via the real scanner logic).
- Visual output preserved exactly (each Stack/Grid renders the identical Tailwind class string the div had; all non-layout classes + attributes passed through).
- Scope respected: only the 4 abel ICP files + the arch-test baseline touched. `UniversalIntake.tsx`, `DraftFirstStarter.tsx`, `core/` untouched.
- No deviation from the migration map except handling the **2 extra IcpIntakeOverlay divs** (AnalyzingState L215 + ErrorState outer L245) that the map's 12-row table omitted but the 14-div task count required — both re-located by className string and migrated.

done -> nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/T-KIT-ALIGN2-result.md
