# T-KIT-ALIGN — Abel ICP FE kit-alignment (result)

**Date:** 2026-06-24 · **Owner:** `/dev-team` (builder-frontend partial + orchestrator finish) · **Nature:** pre-merge DS-adoption fix-loop within `reviewing`.

> Builder-frontend ran the substantive edits then its process died mid-run (no commit, no result). Orchestrator verified the partial work via gates, finished the 2 remaining items (test assertion for kit Select + baseline lowering), and closed GREEN.

## What changed (4 components + 2 ratchets + 1 test)

| File | Change |
|---|---|
| `BuyerLeafForm.tsx` | native `<select>`→kit **Select** (controlled value+onValueChange, RHF wiring preserved) · `<textarea>`→kit **Textarea** · `<button>`×2→kit **Button** · 4 layout `<div>`→page-primitives · kit import added |
| `IcpDatosForm.tsx` | `<textarea>`→kit **Textarea** · `<button>`→kit **Button** · arbitrary `min-h-[28px]`→token · 3 layout `<div>`→page-primitives · kit import added |
| `IcpCard.tsx` | `Badge` from `@/components/ui`→**`@luana/ui-kit`** (kit import clean, no barrel break) |
| `IcpIntakeOverlay.tsx` | arbitrary `sm:max-w-[560px]`→token |
| `BuyerLeafForm.test.tsx` | decision-power test adapted to kit Select (open dropdown via userEvent → assert option offered; native-`<option>` textContent assertion no longer applies). happy-dom opens Radix Select — verified. |
| `test-no-native-select.test.ts` | baseline `1→0` (native `<select>` eliminated) |
| `test-no-div-layout.test.ts` | baseline `39→32` (7 abel layout divs migrated, shrink-only honest) |

## Drift signals — before → after

- Native `<select>` (BuyerLeafForm): **1 → 0** ✅ (ratchet baseline lowered to 0)
- Native `<textarea>` / `<button>` (BuyerLeafForm×2, IcpDatosForm): **5 → 0** ✅
- Arbitrary-values (`min-h-[28px]`, `sm:max-w-[560px]`): **2 → 0** ✅ (eslint no-arbitrary clean)
- Badge local→kit (IcpCard): **done** ✅
- Layout `<div>`→page-primitive: **21 → 14** ⚠️ **PARTIAL** (7 migrated in BuyerLeafForm/IcpDatosForm; 14 remain: IcpIntakeOverlay 3 · IcpCard 1 · BuyerLeafForm 4 · IcpDatosForm 6 tail)

## Gates (verbatim)

- `npx tsc --noEmit` → **0 abel errors**. (1 pre-existing engine error in `core/@luana/hooks/create-ssr-safe-persisted-store.ts` — zustand persist mutator typing — present in base, NOT introduced here → flag `/pm-luana`.)
- `npx eslint <changed> --cache` → **0 errors** (49 warnings pre-existing non-blocking).
- `npx vitest run src/features/abel src/__tests__/architecture` → **344 passed (26 files)** — abel suite + 4 DS ratchets GREEN.

## Scope discipline

- Touched ONLY the 4 abel components + their ratchets/test. `components/shared/intake/UniversalIntake.tsx` + `DraftFirstStarter.tsx` NOT touched (shared drift = adoption story).
- `@/components/ui/*` standalone Shadcn copies NOT mass-migrated (the 8-atom local→kit migration is the design-system-adoption story's systematic job). Only the native-HTML elements were routed to the kit (the real canon violations); IcpCard Badge→kit succeeded without barrel breakage.

## Deferred (flag for nicolify-r0-design-system-adoption)

- **14 remaining abel layout `<div>`** → page-primitives (partial migration; native/arbitrary fully done).
- Wholesale `@/components/ui/{button,input,dialog,...}` → `@luana/ui-kit` for nicolify (8 local atoms, R0 barrel workaround).
- Pre-existing engine tsc error in `core/@luana/hooks` (out of brand scope).

## Skills consulted

| Skill / Rule | Status |
|---|---|
| nicolify-design-system | loaded (builder) |
| frontend-expert | loaded (builder) |
| design-system-canon.md §0/§2.5/§2.7/§5 | applied |
| frontend-visual-fidelity.md § Storybook | applied |
| spanish-text.md (tuteo) | applied (no copy regressions) |

## Verdict

Native-element + arbitrary-value drift **100% aligned** to kit. Layout-div migration **partial (7/21)** — remainder flagged. Gates GREEN. → `/auditor` re-pass (decide: finish remaining 14 divs via Carril R, or confirm + route to adoption story) → demo gate #37 → merge.
