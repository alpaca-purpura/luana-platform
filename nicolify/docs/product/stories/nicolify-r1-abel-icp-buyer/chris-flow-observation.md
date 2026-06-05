# Chris Flow Observation — "Empezar en blanco" create-blank ICP
<!-- story: nicolify-r1-abel-icp-buyer · commit under test: 3eebc096 -->

**Date:** 2026-06-04  
**Auth as:** `hola@alpacapurpura.lat` (Chris · tenant `alpaca-purpura`)  
**Stack:** `make dev-nicolify` → BE :8001 health 200 · FE :3001 (307 auth)  
**Commit under test:** `3eebc096` — handleStartBlank → createIcp.mutateAsync → navigate /datos  
**Method:** Playwright throwaway observational script (non-keeper · `e2e/tmp/observe-chris-blank-flow.ts`)  

---

## Summary — VERDICT: CREATE-BLANK-WORKS

The "Empezar en blanco" flow works correctly after commit `3eebc096`. Full end-to-end trace observed live as Chris against localhost:3001.

---

## Auth

- **Strategy:** `clerk.signIn({ page, emailAddress: 'hola@alpacapurpura.lat' })` (ticket strategy via CLERK_SECRET_KEY).
- **Result:** Authenticated successfully. Post-sign-in URL: `/alpaca-purpura/christian/pipeline` — app resolved `resolvePrimaryTenantId` → slug `alpaca-purpura` (correct).
- **AUTH_AS_CHRIS: ok**

---

## Step 1 — Navigate to `/alpaca-purpura/abel/icp`

- URL navigated: `http://localhost:3001/alpaca-purpura/abel/icp`
- Shell hydrates correctly (`data-shell-ready='true'` present).
- Content panel shows ICP & buyer sub-tab.
- The `GET /api/v1/abel/icp` fires with `X-Tenant-ID: e4373552-f70f-58e0-b2bf-55425cc3259f` (UUID — not slug). This confirms the `d6fd864d` fix (`useTenantId()` reads `publicMetadata.tenant_id`) is working.

---

## Step 2 — Empty State (Screenshot 01)

**Screenshot:** `dod-evidence-screens/01-empty-state.png`

- `data-testid='icp-master-empty'`: **visible** (hasDraftFirstStarter: true)
- `data-testid='draft-first-blank-btn'` ("Empezar en blanco"): **visible** (hasBlankBtn: true)
- No error states, no Next.js overlay.

Note: Screenshot 01 was captured just as the GET response came in (the skeleton grid is visible), but the DraftFirstStarter renders immediately when the query returns 0 ICPs.

**Network at this point:**
```
[RESP] GET /api/v1/abel/icp → 200  X-Tenant-ID: e4373552-f70f-58e0-b2bf-55425cc3259f
```

**EMPTY_STATE: yes**

---

## Step 3 — Click "Empezar en blanco"

Button clicked: `[data-testid='draft-first-blank-btn']`.

### Network sequence (all with X-Tenant-ID = UUID):

| # | Method | URL | Status | X-Tenant-ID | Notes |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/abel/icp` | 200 | `e4373552-f70f-58e0-b2bf-55425cc3259f` | Initial list fetch |
| 2 | POST | `/api/v1/abel/icp` | **201** | `e4373552-f70f-58e0-b2bf-55425cc3259f` | ICP created (33ms) |
| 3 | GET | `/api/v1/abel/icp/0397674d-a705-4a74-bca8-aff573999727/buyers` | 200 | `e4373552-f70f-58e0-b2bf-55425cc3259f` | Detail page buyers fetch |
| 4 | GET | `/api/v1/abel/icp/0397674d-a705-4a74-bca8-aff573999727` | 200 | `e4373552-f70f-58e0-b2bf-55425cc3259f` | Detail page ICP fetch |

### POST /api/v1/abel/icp — response body (201):
```json
{
  "id": "0397674d-a705-4a74-bca8-aff573999727",
  "label": "Nuevo ICP",
  "description": null,
  "vertical": null,
  "company_size": null,
  "geo": null,
  "business_model": null,
  "avg_ticket": null,
  "avg_ticket_currency": null,
  "sales_cycle": null,
  "main_pain": null,
  "sales_angle": null,
  "signals": [],
  "anti_pattern": null,
  "status": "borrador",
  "origin": "manual",
  "buyer_count": 0,
  "created_at": "2026-06-04T08:32:47.347070Z",
  "updated_at": "2026-06-04T08:32:47.347070Z"
}
```

**POST_STATUS: 201**

---

## Step 4 — Navigation after create

- **URL after click:** `/alpaca-purpura/abel/icp/0397674d-a705-4a74-bca8-aff573999727/datos`
- Pattern: `/{tenant_slug}/abel/icp/{uuid}/datos` ✅ (correct — matches the fix in 3eebc096)
- **NOT `/nuevo`** (the old broken behavior that triggered "Esa sección no existe")

**CLICK_RESULT: created+/datos**

---

## Step 5 — Final Page (Screenshot 02)

**Screenshot:** `dod-evidence-screens/02-post-click-state.png`

The IcpDatosForm renders at the `/datos` leaf:

- `data-testid='icp-datos-form'`: **visible** (hasDatosForm: true)
- Entity sub-nav shows: `< ICPs | Nuevo ICP | Datos del ICP | + buyer`
- Form fields rendered: Nombre del ICP ("Nuevo ICP"), Descripción, Vertical/industria, Tamaño de empresa, Geografía, Modelo de negocio, Firmográficos (Ticket promedio, Moneda)
- **0 console.error** (no Next.js bubble, no hydration errors)
- **0 page errors** (no JS exceptions)
- **No Next.js error overlay**

**FINAL_PAGE: datos-form**

---

## Anti-Burbuja Gate Results

| Gate | Status |
|---|---|
| JS exceptions (pageerror) | 0 |
| console.error (non-allowlisted) | 0 |
| Hydration errors | 0 |
| /api/ responses ≥400 | 0 (all 200/201) |
| Next.js error overlay in DOM | 0 |

**ANTI-BURBUJA: CLEAN**

---

## Root Cause Confirmed (pre-fix vs post-fix)

**Pre-fix (before 3eebc096):** `handleStartBlank` called `router.push('/{tenantId}/abel/icp/nuevo')`. The path `/nuevo` is not UUID-shaped — the SSR layout's existence check would call `GET /api/v1/abel/icp/nuevo` which returns 404 (RN-1 tenant isolation). This caused the page to render "Esa sección no existe".

**Post-fix (3eebc096):** `handleStartBlank` now calls `createIcp.mutateAsync({ label: 'Nuevo ICP' })` → receives the created ICP with a real UUID → calls `router.push('/{tenantId}/abel/icp/{uuid}/datos')`. The UUID is valid → SSR gate passes → form renders.

**The fix is working correctly for Chris's account (slug-in-URL path).**

---

## Verdict Line

```
CREATE-BLANK-WORKS
AUTH_AS_CHRIS=ok
EMPTY_STATE=yes
CLICK_RESULT=created+/datos
POST_STATUS=201
FINAL_PAGE=datos-form
X-Tenant-ID=e4373552-f70f-58e0-b2bf-55425cc3259f (UUID, correct — not slug)
```

---

## Screenshots

| Screenshot | Path | Description |
|---|---|---|
| 01-empty-state.png | `dod-evidence-screens/01-empty-state.png` | Chris sees ICP & buyer tab with skeleton loading → DraftFirstStarter appears with both CTAs |
| 02-post-click-state.png | `dod-evidence-screens/02-post-click-state.png` | IcpDatosForm at `/datos` — "Nuevo ICP" created · entity nav visible · form fields ready |

---

## Deferral (no blocker for this observation)

The first run (before resetting DB) left 1 ICP in Chris's tenant. For demo reproducibility, the DB was reset to 0 ICPs before the clean observation run. The demo should start from a tenant with 0 ICPs to show the DraftFirstStarter. A final DB reset is needed pre-demo for Chris's tenant.

---

*Observation script: `nicolify/frontend/e2e/tmp/observe-chris-blank-flow.ts` (throwaway, not tracked in CI).*  
*Observation log: `dod-evidence-screens/observation-log.json`.*
