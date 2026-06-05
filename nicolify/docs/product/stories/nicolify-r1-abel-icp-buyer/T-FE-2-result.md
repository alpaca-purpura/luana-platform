# T-FE-2 Result — Abel ICP & buyer: shared reusables + extract data layer

**Story:** nicolify-r1-abel-icp-buyer  
**Ticket:** T-FE-2  
**Builder:** builder-frontend (Sonnet)  
**Date:** 2026-06-03  
**Brand:** nicolify  
**Branch:** wip/nicolify  

---

## Status: FE2-GREEN-READY

Gates:
- `tsc --noEmit`: 0 errors
- `eslint src/` (T-FE-2 files): 0 errors (16 warnings — pre-existing baseline)
- `vitest run` (T-FE-2 scope): 72/72 PASS
- Architecture fitness (`src/__tests__/architecture/`): 90/90 PASS
- Pre-existing failures: 2 (in `ShellOrganismLayoutClient.test.tsx` — pre-T-FE-1 baseline, not caused by this ticket)

---

## Files Created/Modified

### New files (T-FE-2 scope)

**`components/shared/intake/`**
- `UniversalIntake.tsx` — 4-mode intake (URL/Archivo/Texto/Conectar disabled). "Conectar fuente" disabled with CTA → /{tenantId}/config/conexiones.
- `UniversalIntake.test.tsx` — 17 tests: 4 mode tabs, Conectar disabled, URL/Texto/Archivo mode content, submit payload, isSubmitting state, cancel, mode switching.

**`components/shared/`**
- `DraftFirstStarter.tsx` — 2-path empty-state starter (RN-2). Path A = "Abel te arma un borrador", Path B = "Empezar en blanco".
- `DraftFirstStarter.test.tsx` — 8 tests: both CTAs, callbacks, agentName prop, accessible main region.
- `ProposalBanner.tsx` — Draft ratification banner (RN-3): Ratificar/Descartar, role=status, aria-label, loading states.
- `ProposalBanner.test.tsx` — 10 tests: both actions, loading states, copy, accessibility.
- `WhatForChip.tsx` — Field consumer chip with Tooltip (RN-4). 5 consumer agents: abel/brenda/christian/norvil/sara.
- `WhatForChip.test.tsx` — 9 tests: single/multiple consumers, aria-label, fieldLabel, empty=null, keyboard-focusable.

**`features/abel/`**
- `api/extract-api.ts` — startExtraction (POST 60s timeout) + pollExtraction (GET 10s) API client.
- `hooks/use-icp-extract.ts` — Full lifecycle hook: start → poll 2s interval → done/failed → invalidate ['abel','icp','list']. Max 5 poll errors before stopping (NF-res-extract).
- `hooks/use-icp-extract.test.ts` — 11 tests: query keys, initial state, startExtract, isStarting, done/failed transitions, clearJob, retryExtract.
- `store/abel-ui-store.ts` — Zustand SSR-safe store (G2): intakeOverlayOpen, analyzingOverlayVisible, proposalBannerVisible, intakeMode. Only intakeMode persisted. Uses createSsrSafePersistedStore.
- `store/abel-ui-store.test.ts` — 17 tests: source scan (G2 factory, storage key, partialize, exports) + runtime state (initial values + all setters).
- `types/icp.ts` — Icp, IcpListItem, IcpCreatePayload, IcpPatchPayload, IcpStatus, IcpOrigin.
- `types/buyer.ts` — Buyer, BuyerListItem, DecisionPower.
- `types/extract.ts` — IcpExtractJob, IcpExtractRequest, ExtractJobStatus, SeedType.

**Modified files:**
- `features/abel/index.ts` — Extended barrel with T-FE-2 exports (types + extractApi + useIcpExtract + useAbelUiStore).

---

## Skills Consulted

| Skill | Why | Decision |
|---|---|---|
| `frontend-expert` | Core mandatory skill for every FE ticket | Runtime quality checklist followed: no useEffect for data fetching (React Query), no inline styles, correct memoization via useCallback |
| `nicolify-design-system` | Mandatory for all nicolify/frontend/** UI | Reused local atoms: Button, Input, Skeleton, Tooltip, Badge. G2 SSR-safe store via createSsrSafePersistedStore. G3 JIT-safe: no template literals |
| `brand-expert` | BuyerPersona schema reference | Types/fields mirror engine field-contract slugs (demographics/psychographics/pain_points/desires/buyer_journey/objections/preferred_channels) |

---

## Architecture Gate Compliance

| Gate | Status |
|---|---|
| `test_spanish_neutro` | PASS — no voseo in new components (tuteo: "Define tu cliente ideal", "Revisa los datos", "Configurar", etc.) |
| `test_agent_tw_classes` | PASS — EntitySubNavBar (T-FE-1) uses agentBgClass()/agentTextClass(), no template literals |
| `test_shell_routes_ssot` | PASS — no catalog duplication (abel.icp already in SSoT) |
| `no-store-in-ssr-skeleton` | PASS — abel-ui-store.ts uses createSsrSafePersistedStore (source scan verified) |

---

## Key Design Decisions

### UniversalIntake — "Conectar fuente" disabled
- Rendered as `aria-disabled=true`, `tabIndex=-1`, `disabled` button
- CTA navigates to `/{tenantId}/config/conexiones` (CONN-navigable: not island)
- 3 active modes (URL/Archivo/Texto) feed `extractApi.startExtraction`
- Seeds sent as-is to backend (RN-9: backend applies structural separation/sanitization)

### use-icp-extract — polling without infinite spinner
- Polls every 2s while `status=analizando`
- Stops automatically on `done` or `failed` (`refetchInterval` returns `false`)
- Max 5 consecutive poll network errors → stops + sets `extractError`
- On `done`: invalidates `['abel','icp','list']` (causes IcpMasterListView to re-fetch)
- On `failed`: sets `extractError` + `retryExtract` available (NF-res-extract compliant)

### abel-ui-store — G2 SSR-safe
- Uses `createSsrSafePersistedStore` factory (skipHydration + NO-OP setItem pre-hydration)
- Only `intakeMode` is persisted (user preference). Overlay/banner states are ephemeral.
- `useStoreHydration` must be called in `ssr:false` client root (IcpMasterListView/IcpWorkspaceView — T-FE-3 wires this)

### WhatForChip — consumer catalog
- 5 consumer agents: abel (strategy), brenda (targeting), christian (outreach), norvil (account health), sara (delivery)
- Returns `null` when `consumers=[]` (no orphaned chip)
- Accessible: `role="button"`, `tabIndex=0`, `aria-label` with fieldLabel + consumers

---

## Pending (T-FE-3 scope)
- `IcpMasterListView`, `IcpCard`, `IcpWorkspaceView`, `IcpDatosForm`, `BuyerLeafForm`
- `useIcps`, `useBuyers`, `useIcpMutations` hooks
- Wiring `useStoreHydration(useAbelUiStore)` in `IcpMasterListView` (G2 client root)
- SubTabContent.tsx modification: `abel.icp` → `<IcpMasterListView/>`

---

## Mockup Scope Notes (D3)
- Visual goldens scoped to `/abel/icp**` (Playwright E2E — T-E2E-1, not T-FE-2)
- Completeness ring (CSS residual from mockup) NOT implemented (RN-8 eliminated it — spec over CSS)
- "Conectar fuente" mode: rendered disabled, NOT functional (dep Config→conexiones)
