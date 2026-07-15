# T-FE-FIX-intake — Result

**Ticket:** Bug A — UniversalIntake orphan integration  
**Date:** 2026-06-04  
**Status:** DONE — all gates GREEN

---

## Root Cause (restated)

`IcpMasterListView.handleGenerateDraft()` called `setIntakeOverlayOpen(true)` in the Zustand store.  
NOTHING in the component tree ever read that flag to render the overlay.  
Result: clicking "Abel te arma un borrador" updated a store bool silently — the modal never opened.

The `<UniversalIntake>` component existed and worked (correct `onSubmit` contract, correct `data-testid="universal-intake"`), but it was an **orphan** — never mounted anywhere as a conditional render gated on `intakeOverlayOpen`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/features/abel/components/icp/IcpIntakeOverlay.tsx` | **NEW** — mounts `<UniversalIntake>` inside Shadcn `<Dialog>` controlled by `intakeOverlayOpen` store flag. Handles analyzing state, error state (retry + manual fallback), navigation on done. |
| `src/features/abel/components/icp/IcpMasterListView.tsx` | Imports + renders `<IcpIntakeOverlay />` at root of all 4 state branches (loading/error/empty/list). |
| `src/features/abel/index.ts` | Adds `IcpIntakeOverlay` to barrel exports. |
| `src/features/abel/components/icp/IcpMasterListView.test.tsx` | Adds `vi.mock('./IcpIntakeOverlay', ...)` — keeps unit test scope to the list view; overlay integration covered by E2E Journey 5. |
| `e2e/specs/regression/abel-icp-regression.spec.ts` | Adds Journey 5 (honest modal-open assertion). Wraps SC-network in sub-describe with `failOnRuntimeError: false` (intentional 503 path). |

---

## New Component: IcpIntakeOverlay

**Path:** `nicolify/frontend/src/features/abel/components/icp/IcpIntakeOverlay.tsx`

Key design decisions:
- Uses Shadcn `<Dialog>` (existing `components/ui/dialog.tsx`) — no new primitives invented.
- Self-gates on `intakeOverlayOpen` store flag (Dialog `open` prop controls visibility).
- **Tenant nuance**: `tenantUuid` from `useTenantId()` (Clerk publicMetadata) → passed to `startExtract(payload, tenantUuid)`. `tenantSlug` from `useParams()` → used only for `router.push()` navigation. NEVER useAuth().orgId, NEVER slug for API.
- `void startExtract(...).catch(() => undefined)` — prevents unhandled promise rejection burbuja when 503/network errors hit (the hook's `onError` sets `extractError` for the ErrorState UI).
- Esc/backdrop close guarded when `isInFlight === true` (prevents accidental close during LLM processing).
- Sub-components `AnalyzingState` + `ErrorState` extracted to avoid `react-perf/jsx-no-new-function-as-prop` ESLint warnings.

---

## Quality Gates

### TypeScript strict
```
npx tsc --noEmit → 0 errors
```

### ESLint (0 errors)
```
npx eslint src/ → 0 errors, 313 warnings (down from ~319 stale cache)
IcpIntakeOverlay.tsx alone → 0 errors, 0 warnings
```
Warning baseline did NOT grow.

### Vitest (all pass)
```
Test Files  37 passed (37)
Tests       538 passed (538)
```
Architecture fitness: 127/127 passed.

### E2E Playwright regression (20/20)
```
E2E_BASE_URL=http://localhost:3001 E2E_TENANT_ID=7f464ab7-... 
npx playwright test --project=regression abel-icp-regression.spec.ts --workers=1

20 passed (50.2s) — 0 failed, 0 skipped
```

**Journey 5 (Bug A regression guard) — NEW TEST, PASSES:**
- `SC-happy intake: 'Abel te arma un borrador' → modal abre con 4 tabs → cancel cierra` ✅
- Modal opens after clicking `[data-testid='draft-first-generate-btn']`
- `[data-testid='universal-intake']` visible within 5s
- All 4 mode tabs present (url/archivo/texto/conectar)
- Cancel closes the dialog

**Previously broken tests now pass:**
- SC-network (503 intercept): sub-wrapped with `failOnRuntimeError: false` (intentional error path)

---

## Anti-masking confirmation

The SC-network test previously passed by returning early (the modal didn't open → no 503 triggered). Now the modal opens, the 503 is submitted, and the test exercises the full error path. The `failOnRuntimeError: false` wrapper is correct because the 503 console.error is intentional (route intercept for error path testing).

Journey 3 (LLM extraction live) continues to pass against the real LLM gateway.

---

## Commit

Staged by pathspec (never `git add .`):
- `nicolify/frontend/src/features/abel/components/icp/IcpIntakeOverlay.tsx`
- `nicolify/frontend/src/features/abel/components/icp/IcpMasterListView.tsx`
- `nicolify/frontend/src/features/abel/components/icp/IcpMasterListView.test.tsx`
- `nicolify/frontend/src/features/abel/index.ts`
- `nicolify/frontend/e2e/specs/regression/abel-icp-regression.spec.ts`
- `nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/T-FE-FIX-intake-result.md`
