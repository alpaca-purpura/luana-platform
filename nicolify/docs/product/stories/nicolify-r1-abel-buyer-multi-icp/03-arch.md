# 03-arch · nicolify-r1-abel-buyer-multi-icp (consolidado)

---
story_id: nicolify-r1-abel-buyer-multi-icp
type: bugfix                                  # ADR-011 lite (extend) — sin 02-design-agentic
module: abel
capability: abel/icp-buyer
cap_change_type: extend
architecture_pattern: ADR-nicolify-001
adr_001_compliance: full
architect_run_on: 2026-07-15
arch_version: 2                               # v2 — review funcional adversarial (spec v2)
surfaces: [backend, frontend]                 # NO agentic
splits: [03-arch-be.md, 03-arch-fe.md]
---

## 0. Context Summary

Reescribe la relación `Buyer↔ICP` del cap `abel/icp-buyer` (parent `nicolify-r1-abel-icp-buyer` YA `done`, migración 002 shipped) de **FK 1:1 dura** (`abel_buyers.icp_id NOT NULL`) a **many-to-many** (join table `abel_icp_buyers`). Permite reusar un buyer transversal (ej. "CTO") en ≥1 ICP sin duplicar la fila, con `is_primary` por par (icp, buyer). Agrega attach-existing, detach (con soft-delete a 0 ICPs), directory `GET /buyers` + sub-tab "Buyers" en Abel.

**v2 (review funcional adversarial 2026-07-15, ratificado Chris):** cierra 4 huecos detectados poniéndose en escenarios de usuario adversos, todos verificados contra código mergeado:
1. **RN-11 cascade** — `DELETE /icp/{id}` ("Descartar borrador", existe en `router.py:185` SIN cascade) dejaba joins fantasma + buyers atrapados (sin affordance para removerlos) → `IcpService.soft_delete` cascadea (detach all + soft-delete a 0), 1 transacción (`03-arch-be.md §7`). El backfill de la migración también filtra ICPs vivos + cierra zombies legacy (`§1`).
2. **RN-12 auto-primary simétrico** — attach a ICP vacío no seteaba primary (create sí lo iba a hacer) → helper compartida `_attach_link` (create+attach, race del primary resuelta por retry — `§7`).
3. **SC-14 confirm destructivo** — detach del último ICP destruía el perfil sin aviso; además el detach NO tenía affordance UI (`useDeleteBuyer` sin consumidor, verificado) → botón "Quitar de este ICP" net-new + confirm 2 variantes (`03-arch-fe.md §3.4`).
4. **AC-10 no más blanks** — create-blank (`name: "Nuevo buyer"`) contaminaría directory+picker → tab "Crear nuevo" pide nombre required; se elimina el payload muerto `isPrimary` del create (`03-arch-fe.md §6`).
Además: RN-9 awareness ("También en:"), empty states del picker (SC-15), 409-stale con toast+refresh (SC-2), RN-6 no-re-promoción fijada por test.

**Surface → builder → auditor (PM spawns):**

| Surface | Builder | Auditor |
|---|---|---|
| `nicolify/backend/src/modules/nicolify/abel/**` (migración/model/domain/repo/service/dto/router) + tests | **`builder-backend`** (workhorse) | **`auditor-backend`** (flagship) |
| `nicolify/frontend/src/features/abel/**` + `lib/routing/shell-routes.ts` + `components/shared/shell-organism/SubTabContent.tsx` (1 línea dispatch) + e2e | **`builder-frontend`** (workhorse) | **`auditor-frontend`** (flagship) |

**Skills consultados (decisión, no cuerpo):**
- `backend-expert` — schema rewrite: join table composite-PK (patrón IAM `user_tenants`); migración raw-SQL idempotente con backfill guardado por column-existence (2º run no-op); `is_primary` contextual en el domain Buyer (cero churn a `IcpService`).
- `frontend-expert` + `nicolify-design-system` — reuse-only: composiciones feature-local con átomos `@luana/ui-kit` (Dialog/EntityInfoCard/Input/Button/Tabs), sin PROMOTE (§5.bis). Buyer-detail directory = panel client-side, NO ruta nueva (evita tocar el dispatch entity-bearing hardcodeado a `abel.icp`).
- `shell-feature-architecture.md` (ADR-nicolify-001) — sub-tab "buyers" nueva → G0-G3 (routing SSoT, SSR-safe store, JIT-safe classes).
- `copilot-expert` / `sales-agent-expert` — **N/A** (sin superficie agentic; el skill se cargó por routing pero esta story no toca `copilot/`/`sales_agent/`).

**CONTEXT-BRIEF source:** self-run greps (Path B) — el prompt entregó los paths reales; verifiqué modelo/migración/router/service/repo + FE api/hooks/rutas contra código real.

**Cap YAML afectado (post-merge · Fase E):** `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` — agrega scenarios (attach-existing, detach, buyers-directory); `dev_preview.main_component` puede sumar `BuyersMasterListView`. `modules/abel.md` narrativa (buyer reusable cross-ICP). Sin cap nuevo (extend).

**Architecture gates que deben seguir verdes:** `test_migrations_idempotent.py`, `test_response_model_required.py`, `test_no_cross_brand_imports.py`, `test_growth_studio_event_no_pii.py`, `test_main_app_config.py` (BE) · arch-fitness FE (`__tests__/architecture/`, tsc, eslint boundaries).

## 1. Existing systems audit (NO-NEW-LAYER)

**Fuente:** self-run greps (Path B). **Ver detalle §0 de `03-arch-be.md`.** Resumen:

| Sistema | Path | Decisión |
|---|---|---|
| Módulo `abel` (cap `abel/icp-buyer`) | `nicolify/backend/src/modules/nicolify/abel/` | **EXTEND** — join table + join repo son dominio dentro del módulo, no capa nueva |
| Engine `BuyerPersona` | `core/luana-core-brand-studio` | **CONSUME por referencia** — sin cambio, cero engine edit |
| Composite-PK join pattern | `001_nicolify_iam_baseline.py::user_tenants` | **PATRÓN DE LA CASA** — `abel_icp_buyers` lo sigue; no hay abstracción `core/` a heredar |
| Cross-brand mirror | vitalia/comunify grep `buyer\|icp_` → 0 | **NO mirror**, cero lift candidate |

Cero NEW layer, cero engine change, cero cross-brand mirror. Coincide con `01-spec.md § Prior art applied`.

## 2. Read-side gate citations (claims "el FE/BE ya hace X")

Todo claim de "ya existe / sin cambio" está anclado a `path:línea` real en `03-arch-be.md §0` y `03-arch-fe.md §0` (anti [[embudo-imagined-contract]]). Highlights que corrigen el spec:
- El "sheet + buyer con 2 tabs" **NO existe** hoy (es affordance de create-inmediato, `IcpEntityLayoutClient.tsx:154-190`) → es composición nueva.
- "BuyerLeafForm sin cambios" es **inexacto** → 3 cambios reales (is_primary per-ICP, set-primary con icp_id, modo directory).
- `DELETE /buyer/{id}` retirado → callers reales citados (`buyer-api.ts:228`, `use-buyer-mutations.ts:127` + 2 tests) migran a detach.
- `GET /icp/{id}/buyers` list-item shape = subconjunto que el FE ya consume (`RawBuyerListItem`) → mapper FE del list sin cambio.

## 3. Integration design (CONN) — anti-orphan

Superficie nueva user-reachable = **sub-tab "Buyers"** (Abel). Reachability concreta + registration points exactos en `03-arch-fe.md §5`:
- **Consumed:** el dueño la navega desde el Ribbon; R2 (Christian/outbound) consumirá `GET /buyers` como materia prima.
- **On-map:** cap `abel/icp-buyer` (extend).
- **Navigable:** SubTabsBar de Abel → `[ICP & buyer][Oferta][Marca][Buyers]`.
- **Notarized:** `shell-routes.ts::AGENT_SUBTABS.abel` (+entry buyers) + `SubTabContent.tsx` (dispatch `abel.buyers`→`BuyersMasterListView`). BE: rutas nuevas cuelgan del router ya montado (`include_router` sin cambio).

Endpoints nuevos (attach `POST /icp/{id}/buyers/{buyer_id}/attach`, directory `GET /buyers`, detach `DELETE /icp/{id}/buyers/{buyer_id}`, set-primary con `{icp_id}`) → todos consumidos por el FE (T-FE) → cero isla.

## 4. Storybook / visual (Storybook-first · reuse-only)

`03-arch-fe.md §4` mapea cada composición → átomos `@luana/ui-kit` + su story de referencia (`Dialog`, `EntityInfoCard`, `Input`, `Button`, `Tabs`, `PageContainer`/`PageHeader`/`ListPageSkeleton`/`ErrorState`/`ShellEmptyState`). **Cero componente/story nuevo del kit** — composiciones feature-local de un solo uso (`shell-mockup-per-component.md §5.bis`). Sin `PROMOTE`.

## 5. Splits (fuente de verdad por surface)
- **`03-arch-be.md`** — migración 003 (SQL exacto), model diffs (`BuyerModel` drop icp_id/is_primary + `IcpBuyerModel` nuevo), domain, DTOs, routes (8), repos (`IcpBuyerRepository` nuevo + `BuyerRepository` diff), services, tests, fitness impact.
- **`03-arch-fe.md`** — types, api/hooks diff, `BuyerLeafForm` 3 cambios, 4 composiciones nuevas, routing decision + CONN, e2e.

## 6. Cross-cutting (resumen — detalle en splits)
Tenant isolation RN-1 (join denormaliza `tenant_id`) · soft-delete buyer + hard-delete de fila join en detach · PII (response sin `tenant_id`; `attached_icps` solo label) · Spanish neutro tuteo · sin currency/master-data nuevos · sin eventos nuevos · native-first.

## 7. Migration notes (SC-8 = mayor riesgo)
Backfill ANTES de drop, guardado por `information_schema` (idempotente, 2º run no-op), `ON CONFLICT DO NOTHING`. El viejo `uq_abel_buyers_icp_primary` garantiza ≤1 primary/icp entre vivos → backfill nunca viola `ux_abel_icp_buyers_primary`. **(v2)** El backfill JOINea `abel_icps` vivos (cero join fantasma hacia ICPs soft-deleted legacy) + cierra buyers zombie (0 joins resultantes → `deleted_at`, RN-5/RN-11) dentro del mismo guard. Prod-clone test siembra 3 clases de filas (`03-arch-be.md §1`). `04-validators § test_construction_plan` marca `code-db→integration-realdb` + mutation HARD en el write path.

## 8. Test surfaces (TDD RED-first)
BE: domain → infrastructure (repo join) → application (service) → api/integration (migración). FE: types/api/hooks → components → e2e. Ver `04-validators.yaml § test_construction_plan.seam_coverage` (HB-95).

## 9. Open questions for PM
1. **Buyer-detail del directory = panel client-side (Option C), NO ruta URL-addressable.** Ratificado por default (spec no exige ruta; evita tocar el dispatch entity-bearing hardcodeado a `abel.icp`). Si Chris quiere el buyer detail URL-addressable en G → story aparte (deferrable).
2. `SubTabContent.tsx` (en `components/shared/`, técnicamente en visual-scope forbidden) recibe **1 línea de dispatch** (registration point, no cambio visual). Declarado permitido aquí por anti-orphan. Confirmar con auditor-frontend que es la única edición a shared.
3. **(v2, RESUELTO)** RN-5 en el modelo M:N (¿"banco" de buyers sin ICP?) → se mantiene huérfano-prohibido + confirm destructivo (SC-14). Relajarlo después = story lite (quitar el soft-delete del detach-a-0).
4. **(v2, RESUELTO)** cascade vs filtrar-ICPs-vivos → cascade (RN-11): invariante "cero join hacia ICP muerto" verificable con 1 query; filtrar acumula fantasmas y hace mentir a `count_attachments`.
5. **(v2, declarado)** readiness stale: ICP `LISTO` puede quedar sin buyers-con-role tras detach/cascade (`mark_ready` no se recomputa) — pre-existente del parent, fuera de scope. Si molesta en G → story lite.
