# 05-guidelines.md — nicolify-r1-abel-buyer-multi-icp

> Owner: `/architect`. Consumido por `builder-backend` + `builder-frontend`. story_type: bugfix (extend).

## must_load_skills (por surface)

### BE (`builder-backend`)
| Skill / rule | when |
|---|---|
| `backend-expert` | siempre (schema rewrite, repos, services) |
| `.claude/rules/backend-migrations.md` | migración 003 (raw SQL idempotente, backfill guardado por column-existence, `ON CONFLICT DO NOTHING`) |
| `.claude/rules/backend-ddd.md` | Inside-Out, SQLA 2.0 async, response_model, no cross-module import |
| `.claude/rules/tenant-isolation.md` | RN-1 en cada query de `abel_icp_buyers` |
| `.claude/rules/tdd-mandatory.md` | RED por capa (domain→infra→app→api→integration) |
| `.claude/rules/anti-duplication.md` | EXTEND no NEW (join = dominio del módulo) |
| `nicolify/.claude/rules/agent-revenue-engine.md` | overlay (CRM/buyer B2B, sin PHI, tenant-isolation raíz) |

### FE (`builder-frontend`)
| Skill / rule | when |
|---|---|
| `frontend-expert` | siempre (types/api/hooks/components) |
| `nicolify-design-system` | Storybook-first reuse-only (átomos `@luana/ui-kit`, §5.bis) |
| `nicolify/.claude/rules/shell-feature-architecture.md` | sub-tab "buyers" nueva → G0-G3 (ADR-nicolify-001) |
| `nicolify/.claude/rules/shell-mockup-per-component.md` | reuse-only, sin PROMOTE (composiciones feature-local) |
| `.claude/rules/frontend-fsd.md` | named exports, boundaries FSD-Lite |
| `.claude/rules/frontend-visual-fidelity.md` | D1 Storybook-first, D3 scope discipline |
| `chrome-devtools-verify` | live-verify (#37) antes de developed |
| `.claude/rules/tenant-isolation.md` | `useTenantId()` NUNCA `orgId` |

## Patterns REQUIRED
- **BE migración:** SOLO `op.execute("...")` raw SQL. Backfill ANTES de `DROP COLUMN`, guardado por `information_schema` check (idempotente). `ALTER TABLE ... DROP COLUMN IF EXISTS`, `DROP INDEX IF EXISTS`, `CREATE ... IF NOT EXISTS`. **(v2)** Backfill JOINea `abel_icps` VIVOS + cierra zombies (buyer vivo con 0 joins → `deleted_at`) DENTRO del mismo guard — 2º run no re-borra.
- **BE join repo:** SQLA 2.0 `select/insert/delete/update` async; `attach` deja subir `IntegrityError` al service.
- **BE `_attach_link` (v2, RN-12):** UNA helper compartida create+attach — `is_primary = count_buyers_in_icp == 0`; `IntegrityError` desambiguada **por estado** (rollback → `is_attached`? → dup 409 `BuyerAlreadyAttached` : retry `is_primary=False`), NUNCA parseando constraint names. En `create`, envolver en `begin_nested()` (savepoint) para no perder el buyer recién creado en el retry. Pseudocódigo exacto: `03-arch-be.md §7`.
- **BE cascade (v2, RN-11):** `IcpService.soft_delete` = soft-delete ICP + detach all + soft-delete buyers en 0 attachments, **UN solo commit** (falla a mitad ⇒ rollback total). Loop simple (<50 buyers) — no bulk prematuro.
- **BE tenant:** cada query de `abel_icp_buyers` filtra `tenant_id` (incluso reads del directory). Cross-tenant → 404 sin leak.
- **BE `is_primary` del domain Buyer:** contextual (poblado por `list_by_icp` desde el join), NO persistido en `abel_buyers`. Documentar en docstring.
- **BE no-re-promoción (v2, RN-6 nota):** detach del primary deja al ICP sin primary — comportamiento DECLARADO, fijarlo con `test_detach_primary_does_not_repromote`.
- **BE response_model:** cada route (attach→`BuyerResponse`, directory→`list[BuyerResponse]`, detach→`None`, set-primary→`BuyerResponse`).
- **FE contrato:** `mapBuyer` mapea `attached_icps`; `setPrimary` body `{icp_id}`; nuevos `attach`/`detach`/`listAll`. Mirror EXACTO del DTO BE (verificar contra `03-arch-be.md §4`). **(v2)** ELIMINAR `isPrimary` de `CreateBuyerPayload` (payload muerto — BE nunca tuvo el campo; server decide RN-12).
- **FE detach UX (v2, SC-14):** botón "Quitar de este ICP" NET-NEW en `BuyerLeafForm` modo ICP — confirm simple (`attachedIcps.length > 1`) vs destructivo (`=== 1`, "el perfil se eliminará"). Cancelar = cero requests. Copys exactos en `01-spec.md § Pantallas`.
- **FE create-con-nombre (v2, AC-10):** tab "Crear nuevo" = input nombre required (autofocus, disabled vacío) → create + navigate. Cero create-blank "Nuevo buyer".
- **FE 409 stale (v2, SC-2):** `useAttachBuyer` onError 409 → toast "«{name}» ya está en este ICP" + invalidación (lista se refresca sola).
- **FE composiciones:** átomos `@luana/ui-kit` (Dialog/EntityInfoCard/Input/Button/Tabs/PageContainer/…). `bg-agent-abel` estático (G3). Spanish neutro tuteo.
- **FE registro sub-tab:** exactamente los 2 puntos de `03-arch-fe.md §5` (`shell-routes.ts` + `SubTabContent.tsx` 1-línea dispatch).

## Patterns FORBIDDEN
- ❌ `op.create_table/add_column/create_index` o `sa.Enum(create_type=True)` en la migración (arch gate FAIL).
- ❌ Dropear columnas ANTES del backfill (pérdida de datos — SC-8).
- ❌ **(v2)** Backfillear joins hacia ICPs soft-deleted (recrea el bug fantasma que RN-11 cierra).
- ❌ **(v2)** Parsear constraint names para desambiguar el `IntegrityError` del attach (frágil cross-driver — usar el check por estado de `_attach_link`).
- ❌ **(v2)** Duplicar la lógica primary entre create y attach (una sola helper `_attach_link` — divergencia = el bug que v2 arregla).
- ❌ **(v2)** Detach/cascade con commits parciales (buyer detachado pero no soft-deleteado a 0 = huérfano RN-5).
- ❌ **(v2)** Detach sin confirm en UI, o confirm destructivo genérico que no diga "se eliminará el perfil" en el caso último-ICP.
- ❌ Editar `core/luana-core-*` (engine change → `/pm-luana` lift; fuera de scope).
- ❌ Mirror cross-brand (buyer/icp es nicolify-only).
- ❌ Tocar el dispatch entity-bearing (`[subtab]/[subsubtab]/layout.tsx` + `page.tsx`) — el buyer-detail del directory es panel client-side, NO ruta ([[registry-exists-resolver-closed]]).
- ❌ `<select>` nativo, arbitrary-values, `<div>` de layout donde hay page-primitive (canon §0/§2.5/§2.7).
- ❌ Componente/story nuevo del kit (reuse-only; composiciones feature-local sin PROMOTE).
- ❌ `useAuth().orgId` como tenant (usar `useTenantId()`).
- ❌ Declarar "verificado" por 200/verde sin ejercer la acción real + leer logs (#37, [[verification-real-not-200]]).

## Files in scope (brand-scoped SOLO)
**BE:**
- `nicolify/backend/alembic/versions/003_abel_buyer_multi_icp.py` (NEW)
- `nicolify/backend/src/modules/nicolify/abel/infrastructure/models/{buyer_model.py (MOD), icp_buyer_model.py (NEW)}`
- `nicolify/backend/src/modules/nicolify/abel/domain/{buyer.py (MOD), icp_buyer.py (NEW), exceptions.py (MOD)}`
- `nicolify/backend/src/modules/nicolify/abel/infrastructure/repositories/{buyer_repository.py (MOD), icp_buyer_repository.py (NEW)}`
- `nicolify/backend/src/modules/nicolify/abel/application/dtos/buyer_dtos.py (MOD)`
- `nicolify/backend/src/modules/nicolify/abel/application/services/buyer_service.py (MOD — v2: _attach_link helper)`
- `nicolify/backend/src/modules/nicolify/abel/application/services/icp_service.py (MOD — v2: soft_delete cascade RN-11)`
- `nicolify/backend/src/modules/nicolify/abel/api/router.py (MOD)`
- `nicolify/backend/tests/modules/nicolify/abel/** (MOD/NEW)`, `nicolify/backend/tests/integration/test_abel_icp_buyer_migration_backfill.py (NEW)`, `nicolify/backend/tests/architecture/conftest.py (MOD — registrar IcpBuyerModel)`

**FE:**
- `nicolify/frontend/src/features/abel/types/buyer.ts (MOD)`
- `nicolify/frontend/src/features/abel/api/buyer-api.ts (MOD)`
- `nicolify/frontend/src/features/abel/hooks/{use-buyers.ts (MOD), use-buyer-mutations.ts (MOD), use-icp-mutations.ts (MOD — v2: useDeleteIcp invalida directory)}`
- `nicolify/frontend/src/features/abel/components/icp/{BuyerLeafForm.tsx (MOD), IcpEntityLayoutClient.tsx (MOD), IcpWorkspaceView.tsx (MOD — v2: copy cascade confirm), AddBuyerSheet.tsx (NEW), AttachToIcpSheet.tsx (NEW), BuyersMasterListView.tsx (NEW), BuyerCard.tsx (NEW)}`
- `nicolify/frontend/src/features/abel/index.ts (MOD)`
- `nicolify/frontend/src/lib/routing/shell-routes.ts (MOD — AGENT_SUBTABS.abel +buyers)`
- `nicolify/frontend/src/components/shared/shell-organism/SubTabContent.tsx (MOD — 1-línea dispatch abel.buyers)`
- `nicolify/frontend/e2e/regression/nicolify-r1-abel-buyer-multi-icp/** (NEW)`
- `nicolify/frontend/src/features/abel/**/*.test.{ts,tsx} (MOD/NEW)`

## Files Builder NEVER touches
- `core/luana-core-*/**` (engine — `/pm-luana` lift gate).
- Otras brands (`vitalia/`, `comunify/`, `lupulo/`).
- `nicolify/backend/src/modules/nicolify/{copilot,sales_agent}/**` (agentic — no scope).
- `[subtab]/[subsubtab]/{layout,page}.tsx` (dispatch entity-bearing — path crítico del parent).
- `components/ui/`, `app/layout.tsx` (shell global).
