# 05-guidelines · nicolify-r1-abel-icp-buyer

> Patterns required/forbidden + files-in-scope + must_load_skills enforceable por ticket. Consumido por `/dev-team` builders. Complementa `03-arch.md` (contrato) + `04-validators.yaml` (verificación).

## Must-load skills (enforceable · por surface)

| Surface / ticket | must_load_skills (HARD) |
|---|---|
| BE (`abel/{domain,infra,app,api}`) | `backend-expert` + (FastAPI canonical · pytest async) |
| BE buyer/icp esquema | `backend-expert` + `brand-expert` (referencia esquema BuyerPersona) |
| AGENTIC (`abel/extraction/`) | `copilot-expert` + `claude-api` (R23: Opus) |
| FE (cualquier ticket) | **`nicolify-design-system` (SIEMPRE)** + `frontend-expert` + `playwright-expert` |

## Patterns REQUIRED

### Cross-cutting
- **Tenant isolation raíz (RN-1):** `.where(Model.tenant_id == tenant_id)` en TODA query, incl. `get_by_id` y buyers (scoped `icp_id ∧ tenant_id`). Cross-tenant → 404.
- **Soft delete only:** `deleted_at` (nunca hard delete).
- **SQLA 2.0 async:** `await session.execute(select(Model).where(...))`. NUNCA `session.query()`.
- **Pydantic v2:** `model_config = ConfigDict(from_attributes=True)`. NUNCA inner `class Config`.
- **`response_model=` en TODA ruta** (arch test + PII allowlist).
- **`X-Tenant-ID` + Bearer** en toda ruta autenticada (providers async nicolify + Clerk).
- **Currency (RN-11):** `avg_ticket_currency: str | None`; preservar, no convertir on-write. FE `formatMoney(amount, currency ?? useTenantLocale().currency)`.
- **Master data:** `DateTime(timezone=True)` UTC + `utc_now()` engine. NUNCA `datetime.utcnow()`.
- **Spanish neutro tuteo** (sin voseo) en chrome UI + microcopy. Texto de Abel = voz Abel/Luana.
- **`structlog`** (no `print`/`logging`).
- **Native-first:** `${WS}/.venv/bin/{ruff,pytest}` · `npx {tsc,eslint,vitest,playwright}`. NUNCA `docker exec`.

### Engine consumption (CRÍTICO)
- **CONSUME por import:** `sanitize_payload`, `utc_now`, `BaseEntity`, `TenantLocale` desde `luana_core_*`.
- **CONSUME por referencia (esquema):** BuyerPersona engine field-contract slugs JSONB (mismos nombres en `Buyer` brand-local) + `buyer_persona_doc_extraction.j2` (referencia prompt) + `BaseExtractionOrchestrator` (patrón wave).
- **REPLICATE brand-local async:** la entidad Buyer (FK `icp_id`, async repo) — el engine es sync + sin `icp_id` (engine-boundary).
- **PORT re-temizado:** `EntitySubNavBar`/`EntityWorkspaceLayout` de vitalia → `components/shared/shell-organism/` (agent-abel púrpura `#A855F7`, variante leaves-dinámicos).

### Agentic (extractor)
- **Least-privilege:** el extractor solo PROPONE borrador (`status=borrador`). No borra, no marca listo, no toca otro tenant.
- **Semilla = dato no confiable (RN-9):** delimiter-wrap `<untrusted_seed>` + sanitize. Jamás concatenar con system prompt.
- **Audit (RN-10):** escritura del extractor → audit row + telemetría.
- **Cost recording** via engine observability (NUNCA recrear). Trace best-effort + sanitize_payload.

### FE
- **D1 design-system-first:** átomos `@luana/ui-kit` → tokens → moléculas shared → crear solo si no existe.
- **G1 mockup adherence:** las 4 vistas de `mockups/icp-buyer.html` (SIN completeness ring — RN-8).
- **G2 SSR-safe store:** `createSsrSafePersistedStore` + `useStoreHydration` en chunk `dynamic({ssr:false})`. Skeleton store-free.
- **G3 Tailwind JIT-safe:** `_agent-tw-classes.ts`, NUNCA template literals en class strings.
- **Server-First:** Server Component default; `"use client"` solo en roots con state/handlers.
- **`fetchClient`** auto-inyecta `X-Tenant-ID` (de `useTenantId()`, NUNCA `useAuth().orgId`).
- **EntitySubNavBar:** `role="tablist"` + roving tabindex + flechas; `router.push` (no reload); activeLeaf URL-derived.
- **Autosave 600ms** por campo (RN-8 guardar nunca bloquea).

## Patterns FORBIDDEN

- ❌ Editar `core/luana-core-*/src/` (cualquier archivo). Si un scope lo requiere → STOP, flag `/pm-luana`.
- ❌ Montar el router engine `buyer_personas` (sync + engine IAM) en la app async nicolify.
- ❌ Agregar columna al `buyer_personas` engine (engine-owned → `/pm-luana`).
- ❌ Recrear cost recorder / FX resolver / `sanitize_payload` / channel format local (anti-duplication).
- ❌ `PhiRepositoryBase` / dual-filter clínico (nicolify NO es PHI — tenant-isolation raíz + guardrails agénticos).
- ❌ Telemetría en `copilot_trace_event` engine (usar `nicolify_growth_studio_event`, `account_id` no `clinic_id`).
- ❌ Code en `{otro_brand}/...` (vitalia/comunify/lupulo). Cross-brand mirror prohibido.
- ❌ Shadcn `Tabs` internas para el detalle del ICP (es N3-dynamic `EntitySubNavBar`, leaves = rutas).
- ❌ Reinventar el wrapper shell simplificado (TopBar/Ribbon/SubTabsBar — port R0 ya shipped).
- ❌ `persist` raw Zustand (G2). ❌ template literals en clases Tailwind (G3).
- ❌ Implementar completeness ring/barra (RN-8 lo eliminó — el spec manda sobre el CSS del mockup).
- ❌ Hardcodear `'USD'` (RN-11) / `datetime.utcnow()` / voseo en UI.
- ❌ `session.query()` / `class Config` / `Any` fuera de JSONB / ruta sin `response_model=`.
- ❌ Liftear `ICP`/`EntitySubNavBar` a core en esta story (es `/pm-luana` promotion gate — flag only).
- ❌ `git add .`/`-A` (commit por pathspec — índice compartido hub).

## Files in scope (brand-scoped · nada fuera de esto sin escalar)

### BE (NEW)
```
nicolify/backend/src/modules/nicolify/abel/{__init__,domain/{icp,buyer,exceptions},
  infrastructure/{models/{icp_model,buyer_model,growth_studio_event_model},repositories/{icp_repository,buyer_repository}},
  application/{dtos/{icp_dtos,buyer_dtos,extraction_dtos},services/{icp_service,buyer_service,icp_extraction_service},telemetry/growth_studio_emitter},
  extraction/{__init__,orchestrator,seed_sanitizer,schema,prompts/icp_extraction.j2},
  api/router}.py
nicolify/backend/alembic/versions/002_abel_icp_buyer.py
nicolify/backend/tests/modules/nicolify/abel/**
nicolify/backend/tests/architecture/test_growth_studio_event_no_pii.py   # NEW
```
### BE (MODIFIED)
```
nicolify/backend/src/main.py                          # include_router(abel_router)
```
### FE (NEW)
```
nicolify/frontend/src/features/abel/**
nicolify/frontend/src/components/shared/intake/UniversalIntake.tsx
nicolify/frontend/src/components/shared/{ProposalBanner,DraftFirstStarter,WhatForChip}.tsx
nicolify/frontend/src/components/shared/shell-organism/{EntitySubNavBar,EntityWorkspaceLayout}.tsx
nicolify/frontend/src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/{layout,page}.tsx
nicolify/frontend/src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[entityId]/[leaf]/page.tsx
nicolify/frontend/e2e/specs/**  (abel-icp smoke + regression)
```
### FE (MODIFIED)
```
nicolify/frontend/src/components/shared/shell-organism/SubTabContent.tsx   # abel.icp → IcpMasterListView
```

## Post-merge (no es código · /pm-nicolify Fase F)
- `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` (NEW)
- `nicolify/docs/product/modules/abel.md` (NEW)
- `nicolify/docs/architecture/SYSTEM-MAP.yaml` → `abel.icp` `status: built` + flags `promotable: candidate` (icp-entity, EntitySubNavBar)
