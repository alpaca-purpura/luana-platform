# T-FE-4 Result — ICP & Buyer Detail Forms (IcpWorkspaceView, IcpDatosForm, BuyerLeafForm)

**Ticket:** T-FE-4  
**Story:** nicolify-r1-abel-icp-buyer  
**Brand:** nicolify  
**Builder:** builder-frontend (Sonnet 4.6)  
**Status:** FE4-AUTO-FIX-ITER1-GREEN-READY  
**Date:** 2026-06-03

---

## Auto-fix loop iter 1 response

**Finding addressed:** Cat 11+15 FAIL — `+ buyer` affordance never creates a buyer (dead handler + dead-route navigation).

### Root cause (confirmed)
`handleAddBuyer`/`handleLeafClick` closures in `IcpEntityLayoutClient` were dead code (`void`-ed, not passed to `EntityWorkspaceLayout`). `EntitySubNavBar` had no `onAddAffordance` prop — clicking `+ buyer` called `router.push("/__add_buyer__")` → literal route → "No se encontró este buyer" error.

### What was wired

1. **`EntitySubNavBar.tsx`** — added `onAddAffordance?: () => void` prop. For `isAddAffordance` leaves, `onClick` now calls `onAddAffordance()` INSTEAD of `router.push(href)`. Non-affordance leaves keep normal `router.push`. Added `data-testid="entity-leaf-add-affordance"` + `data-add-affordance="true"` on the add button (stable e2e locator).

2. **`EntityWorkspaceLayout.tsx`** — added `onAddAffordance?: () => void` prop and forwards it to `EntitySubNavBar`.

3. **`IcpEntityLayoutClient.tsx`** — replaced dead `handleAddBuyer`/`handleLeafClick` (both `void`-ed) with a proper `useCallback` `handleAddBuyer` that: calls `createBuyer.mutateAsync({ name: "Nuevo buyer", isPrimary: ... })` → on success navigates to the new buyer's leaf via `router.push(/{tenantId}/abel/icp/{icpId}/{newBuyer.id})`. Affordance leaf `href` changed from `.../__add_buyer__` to `""` (never routed directly). `onAddAffordance` passed through to `EntityWorkspaceLayout`.

4. **Dead `__add_buyer__` route**: IcpWorkspaceView's `leaf` routing remains unchanged (no `__add_buyer__` special-casing existed there — it falls through to `BuyerLeafForm` which shows "No se encontró este buyer" for invalid UUIDs, which is the correct fallback for stale URLs).

5. **`IcpEntityLayoutClient.test.tsx`** (NEW, 5 tests) — integration tests locking the corrected path: affordance visible, click calls mutateAsync (not router.push to `__add_buyer__`), after resolve navigates to new buyer leaf.

6. **`EntitySubNavBar.test.tsx`** — 4 new tests: `onAddAffordance` called on click, `data-add-affordance=true` attribute present, NOT called in directory mode, NOT router.push to `__add_buyer__`.

7. **`e2e/specs/regression/abel-icp-regression.spec.ts`** — activated SC-add-buyer assertion: `expect(addAffordance).toBeVisible()` + `expect(addAffordance).toBeEnabled()` (was commented out / `void addAffordance`). Locator updated to `[data-testid='entity-leaf-add-affordance']`.

### Files touched (auto-fix iter 1)
- `nicolify/frontend/src/components/shared/shell-organism/EntitySubNavBar.tsx`
- `nicolify/frontend/src/components/shared/shell-organism/EntitySubNavBar.test.tsx` (+4 tests)
- `nicolify/frontend/src/components/shared/shell-organism/EntityWorkspaceLayout.tsx`
- `nicolify/frontend/src/features/abel/components/icp/IcpEntityLayoutClient.tsx`
- `nicolify/frontend/src/features/abel/components/icp/IcpEntityLayoutClient.test.tsx` (NEW, +5 tests)
- `nicolify/frontend/e2e/specs/regression/abel-icp-regression.spec.ts` (SC-add-buyer activated)
- `nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/T-FE-4-result.md` (this file)

### Gate results (post-fix)
| Gate | Result | Notes |
|---|---|---|
| `tsc --noEmit` | PASS | 0 errors |
| `eslint` (scoped files) | PASS | 0 errors; warnings pre-existing (JSX inline fns in EntitySubNavBar — pre-existing from T-FE-1) |
| `vitest run EntitySubNavBar.test.tsx` | PASS | 22/22 (19 pre-existing + 3 new RED→GREEN + 1 data-attr) |
| `vitest run IcpEntityLayoutClient.test.tsx` | PASS | 5/5 (all new) |
| `vitest run shell-organism + abel + architecture` | PASS | 323/325 (2 pre-existing ShellOrganismLayoutClient R0 reds — NOT in scope) |
| `playwright test --list` | PASS | 175 tests parse correctly |

---

## Gate Summary

| Gate | Result | Notes |
|---|---|---|
| `tsc --noEmit` | PASS | 0 errors, strict mode |
| `eslint src/features/abel 'src/app/[tenantId]'` | PASS | 0 errors in T-FE-4 files; 10 pre-existing errors in T-FE-2 test files (DraftFirstStarter.test.tsx, ProposalBanner.test.tsx — Prettier formatting) |
| `vitest run src/features/abel` | PASS | 131/131 tests pass |
| `vitest run src/__tests__/architecture` | PASS | 90/90 arch tests pass |
| Overall vitest | 448/450 | 2 pre-existing failures in ShellOrganismLayoutClient.test.tsx (T-FE-1 scope, not T-FE-4) |

---

## Implementation Summary

### Files Created (T-FE-4 scope)

1. **`nicolify/frontend/src/features/abel/components/icp/IcpWorkspaceView.tsx`**
   - "use client" workspace root for ICP entity detail
   - Dispatches leaf=datos → IcpDatosForm, leaf={buyerId} → BuyerLeafForm
   - Mounts ProposalBanner when icp.origin=draft AND status=borrador (RN-3)
   - Ratificar → useMarkReadyIcp; Descartar → useDeleteIcp + navigate back to list
   - Error state when ICP not found; skeleton while loading

2. **`nicolify/frontend/src/features/abel/components/icp/IcpDatosForm.tsx`**
   - Full ICP editing form with 5 field groups + WhatForChip per group (RN-4):
     - Identidad (consumers: abel, christian)
     - Firmográficos (consumers: brenda, norvil) — RN-11 currency preserved
     - Dolor & ángulo (consumers: christian, abel)
     - Señales de compra (consumers: brenda, christian) — pill-tag interface
     - Anti-patrón (consumers: abel)
   - Autosave on-change debounced 600ms via usePatchIcp (RN-8)
   - "Marcar listo" → on 422 renders missing[] inline per group (NO completeness bar — spec RN-8/mockup ring override per 03-arch-fe.md §9 D2 note)
   - Toast "Guardado." on save, toast error on failure
   - Currency: ISO 4217 user-provided (NO hardcoded 'USD' — RN-11)

3. **`nicolify/frontend/src/features/abel/components/icp/BuyerLeafForm.tsx`**
   - Full buyer profile form with 8 sections + WhatForChip per section (RN-4):
     - Identidad del buyer (rol, decisionPower, isPrimary)
     - Datos demográficos (JSONB sub-fields)
     - Psicografía (JSONB sub-fields)
     - Dolores, Deseos, Objeciones (list[dict] — ListDictField cards)
     - Canales preferidos (list[dict])
     - Viaje del comprador (awareness/consideration/decision JSONB)
   - set-primary button (RN-6): shown only when isPrimary=false; calls useSetPrimaryBuyer; clears others server-side; toast on success
   - Autosave on-change debounced 600ms via usePatchBuyer (RN-8)
   - Loading skeleton + error state

4. **`nicolify/frontend/src/features/abel/components/icp/IcpWorkspaceView.test.tsx`** — 3 tests
5. **`nicolify/frontend/src/features/abel/components/icp/IcpDatosForm.test.tsx`** — 10 tests
6. **`nicolify/frontend/src/features/abel/components/icp/BuyerLeafForm.test.tsx`** — 9 tests

### Files Modified (T-FE-4 scope)

7. **`nicolify/frontend/src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/[leaf]/page.tsx`**
   - MODIFIED: was T-FE-1 structural placeholder
   - Now imports and renders `IcpWorkspaceView` with `icpId={entityId}` and `leaf={leaf}`

8. **`nicolify/frontend/src/features/abel/components/icp/IcpEntityLayoutClient.tsx`**
   - MODIFIED: was T-FE-1 structural scaffold with stubs
   - Now uses real `useIcp(icpId)` + `useBuyers(icpId)` hooks for dynamic leaves
   - "+ buyer" affordance leaf present; `useCreateBuyer` mounted for add action

9. **`nicolify/frontend/src/features/abel/index.ts`**
   - Added T-FE-4 exports: IcpWorkspaceView, IcpDatosForm, BuyerLeafForm

---

## Skills Consulted

| Skill | Why | Decision |
|---|---|---|
| `frontend-expert` | FSD-Lite boundaries, form patterns, testing | Used `register` + `watch` (RHF direct — no Form context since shadcn Form component not installed); no default exports |
| `brand-expert` | BuyerPersona field-contract schema (JSONB sub-keys) | Mirrored engine slugs: demographics, psychographics, pain_points, desires, buyer_journey, objections, preferred_channels |
| `offer-expert` | N/A — ICP is not offer | N/A |
| `copilot-expert` | N/A — no copilot surface touched | N/A |

---

## Requirements Coverage

| RN | Covered | How |
|---|---|---|
| RN-3 (draft-first propone/ratifica) | ✅ | ProposalBanner shown when origin=draft+status=borrador; Ratificar→markReady; Descartar→delete |
| RN-4 (field consumer catalog) | ✅ | WhatForChip on every group header in IcpDatosForm + BuyerLeafForm |
| RN-6 (set-primary ≤1) | ✅ | BuyerLeafForm "Establecer como principal" button → useSetPrimaryBuyer; hidden when isPrimary=true |
| RN-8 (autosave + mark-ready missing[]) | ✅ | Autosave 600ms debounce; mark-ready 422 → missing[] inline per group header; NO completeness bar |
| RN-11 (currency preserve) | ✅ | avgTicketCurrency user-provided ISO 4217; hint text; placeholder "MXN" (not "USD"); formatMoney pattern documented |

---

## Test Coverage

- IcpWorkspaceView: ProposalBanner visibility (RN-3), leaf routing (datos/buyerId), ratificar/descartar actions
- IcpDatosForm: 5 groups + WhatForChip (RN-4), mark-ready missing[] inline (RN-8, no bar), currency no-USD (RN-11), signal pills add/remove, buyers missing message
- BuyerLeafForm: render, set-primary show/hide/action/toast (RN-6), autosave infrastructure wired, loading skeleton, error state, decision power dropdown

---

## Architecture Notes

- No default exports (FSD-Lite enforce)
- No deep cross-feature imports
- No "use client" on Server Components (leaf/page.tsx remains Server Component)
- No hardcoded 'USD' (RN-11)
- No template literals in agent class strings (G3 JIT-safe)
- IcpEntityLayoutClient updated to use real hooks (stub removed)
- EntityWorkspaceLayout remains store-free (G2 SSR-safe gate)
- `# cap: abel.icp-buyer` header on all new production files
