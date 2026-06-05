---
story_id: nicolify-r1-abel-icp-buyer
brand: nicolify
type: ui-story
architecture_pattern: ADR-nicolify-001
adr_001_compliance: full
nav_pattern: N3-dynamic-EntitySubNavBar
cap_target: abel/icp-buyer
cap_change_type: new
map_zone: agentes
map_box: abel
map_area: icp
route_master: /{tenantId}/abel/icp
route_detail: /{tenantId}/abel/icp/{icpId}/{leaf}   # leaf ∈ {datos, <buyerId>}
architect_run_on: 2026-06-03
surfaces: [be, fe, agentic]
promotable_candidates: [icp-entity (B2B brands), EntitySubNavBar (@luana/ui-kit N=2)]
---

# Contract: Abel → ICP & buyer (hoja fundacional)

> SSoT técnico para implementación paralela cross-surface (BE + FE + AGENTIC). Consume `01-spec.md` v2 (ratificado) + mockup G1 (`mockups/icp-buyer.html`, `ratified_visual_by_chris: true`). Cita `ADR-nicolify-001` (9 secciones + G1/G2/G3) y el patrón `EntitySubNavBar` (SHELL-DESIGN-CONTRACT § 5.1).
>
> Per-surface: `03-arch-be.md` · `03-arch-fe.md` · `03-arch-agentic.md`.

## 0. Context Summary

- **Story:** `nicolify-r1-abel-icp-buyer` · Release **R1** (Abel + Brenda · Atracción inbound · 1er vendible).
- **Architect run on:** 2026-06-03 (Opus 4.8 cutoff Jan 2026; patrones SOTA verificados live por WebSearch hoy — ver § 15).
- **Módulos tocados:** `nicolify/backend/src/modules/nicolify/abel/` (NEW brand-extension) · `nicolify/frontend/src/features/abel/` (NEW) + `components/shared/{intake,shell-organism}/` (NEW reusables) · extracción draft-first (`nicolify/backend/src/modules/nicolify/abel/extraction/` — NET-NEW, consume engine `core/luana-core-extraction` + copilot template/persister patrón).
- **Engine consultado READ-ONLY:** `core/luana-core-brand-studio` (BuyerPersona field-contract/DTO/persister como **referencia de esquema**) · `core/luana-core-copilot` (`buyer_persona_doc_extraction.j2` + `buyer_persona_persister.py` patrón) · `core/luana-core-extraction` (`BaseExtractionOrchestrator`) · `core/luana-core-observability` (`sanitize_payload`, cost recording). **Ningún core editado.**

### Surface → builder → auditor mapping (PM/dev-team spawn matrix)

| Surface | Builder | Auditor |
|---|---|---|
| `nicolify/backend/src/modules/nicolify/abel/{domain,infrastructure,application,api}/` (ICP + buyer brand-local + telemetría) | **`builder-backend`** (Sonnet) | **`auditor-backend`** (Opus) |
| `nicolify/backend/src/modules/nicolify/abel/extraction/` (draft-first extractor · production agentic) | **`builder-agentic`** (Opus · R23 HARD) | **`auditor-agentic`** (Opus) |
| `nicolify/frontend/src/features/abel/**` + `components/shared/{intake,ProposalBanner,DraftFirstStarter,WhatForChip}` + `shell-organism/EntitySubNavBar` (port) | **`builder-frontend`** (Sonnet) | **`auditor-frontend`** (Opus) |

### Skills consulted (decisión tomada por cada uno)

- **`backend-expert`** — ICP = nuevo módulo `abel` Inside-Out DDD async (`AsyncSession`). Buyer brand-local (no mount engine sync router). `response_model=` en toda ruta. Telemetría brand-local `nicolify_growth_studio_event`.
- **`brand-expert`** — BuyerPersona engine es la **referencia de esquema** (demographics/psychographics/pain_points/desires/buyer_journey/objections/canales). Brand-local replica + extiende (`role`, `decision_power`, `preferred_channels`, `icp_id` FK). NO tocar `identity.voice_tone` (deprecated, irrelevante acá).
- **`offer-expert`** / **`offer-type-preset-expert`** — N/A para esta hoja (ICP ≠ offer). El `ticket` monetario del ICP usa `currency-handling` (preservar, no convertir).
- **`copilot-expert`** — el extractor draft-first NO es el copilot runtime (`core/luana-core-copilot`). Es un extractor brand-local que **consume el patrón** (template j2 + persister + `BaseExtractionOrchestrator`). NO editar `copilot/` engine. Trace best-effort + `sanitize_payload`.
- **`sales-agent-expert`** — N/A directo (Christian/Brenda son consumers downstream futuros, no se tocan acá). Confirma que el ICP/buyer es **materia prima discursiva** que esas stories leerán.
- **`metrics-expert`** — N/A (no ETL). Telemetría = `nicolify_growth_studio_event`, no analytics-engine.

### CONTEXT-BRIEF source

Self-ran greps (Path B — no `CONTEXT-BRIEF.md` para esta story; el `00-research.md` + `00-research-icp-data-ux.md` ya contienen el prior-art scan, re-verificado live contra el workspace 2026-06-03).

### capability YAML + modules/{m}.md afectados (post-merge, paradigma post 2026-05)

- `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` (NEW · `cap_change_type: new`).
- `nicolify/docs/product/modules/abel.md` (NEW o sección — primer módulo `abel` con código real).
- `nicolify/docs/architecture/SYSTEM-MAP.yaml` → `abel.icp` `status: planned → built` + `dev_preview` al código real (Fase F.3 `/pm-nicolify`).

### Architecture gates que deben seguir verdes

- BE: `nicolify/backend/tests/architecture/{test_response_model_required,test_no_cross_brand_imports,test_main_app_config,test_migrations_idempotent,test_no_secret_leak}.py` + NEW `test_growth_studio_event_no_pii.py`.
- FE: `nicolify/frontend/src/__tests__/architecture/{test_shell_routes_ssot,test_agent_tw_classes,test_spanish_neutro,no-store-in-ssr-skeleton}.test.tsx`.

## Prior art audit (NO-NEW-LAYER rule + engine-boundary)

### Source of evidence
- [x] Self-run greps (Path B) — verificados live contra el workspace 2026-06-03.
- [x] Re-validación de `00-research.md §3` + `00-research-icp-data-ux.md` (claims confirmados/corregidos abajo).

### Audit cross-module ejecutado (resumen — comandos en § 13)

```
core/luana-core-brand-studio/src/.../domain/buyer_persona.py            → EXISTE (BuyerPersona rica)
core/luana-core-brand-studio/src/.../infrastructure/repositories/buyer_persona_repository.py → EXISTE · SYNC Session
core/luana-core-brand-studio/src/.../api/buyer_personas.py             → EXISTE · routes async PERO db=sync Session + engine IAM (get_current_user)
core/luana-core-copilot/src/.../persisters/buyer_persona_persister.py  → EXISTE · SYNC
core/luana-core-copilot/.../templates/interview/buyer_persona_doc_extraction.j2 → EXISTE
core/luana-core-extraction/src/.../base_orchestrator.py                → EXISTE (BaseExtractionOrchestrator)
core/luana-core-observability/.../recording/sanitization.py            → EXISTE (sanitize_payload)
core/luana-core-crm  Account/Stakeholder                               → NO EXISTE (grep vacío) → agent-revenue-engine §5 es ASPIRACIONAL
cross-brand ICP mirror (vitalia/comunify/lupulo)                       → NINGUNO (grep vacío) → NET-NEW limpio
nicolify/backend/src/modules/nicolify/                                  → solo __init__.py (esqueleto)
EntitySubNavBar en nicolify/frontend                                    → FALTA (port de vitalia requerido)
vitalia/frontend/.../shell-organism/EntitySubNavBar.tsx                 → EXISTE (reference impl + test)
```

### Sistemas existentes encontrados

| Sistema | Path | Esquema/Config | Repo/Persister | Estado | Runtime |
|---|---|---|---|---|---|
| BuyerPersona (engine) | `core/luana-core-brand-studio/.../domain/buyer_persona.py` (+ field_contract, model, repo, api, dto) | rich JSONB | repo + api | active | **SYNC `Session` + engine IAM** |
| Buyer extraction template + persister | `core/luana-core-copilot/.../{templates/interview/buyer_persona_doc_extraction.j2, persisters/buyer_persona_persister.py}` | j2 + propose_field_updates | persister | active | SYNC |
| BaseExtractionOrchestrator | `core/luana-core-extraction/.../base_orchestrator.py` | wave-based | — | active | genérico (sync hooks) |
| EntitySubNavBar (FE) | `vitalia/frontend/.../shell-organism/EntitySubNavBar.tsx` | leaves fijos | — | active (N=1 prod) | client |
| sanitize_payload | `core/luana-core-observability/.../recording/sanitization.py` | PII regex | — | active | shared |

### Decisión por sistema (EXTEND > REPLACE > NEW)

- **BuyerPersona engine → CONSUME-BY-REFERENCE + REPLICATE brand-local (NET-NEW async).**
  Razón (engine-boundary `[[engine-boundary-consume-not-mount]]`): el router/repo engine corre **sync `Session` + engine IAM (`get_current_user`)**; el módulo `abel` de nicolify es **async (`AsyncSession`) + Clerk**. Montar el router engine = boundary mismatch. Además el esquema engine **no tiene** `icp_id` (FK 1 ICP→N buyers), ni `role`/`decision_power`/`preferred_channels` (RN-5/RN-6 + spec § 4.2). Agregar columnas al `buyer_personas` engine = engine-owned → `/pm-luana`, fuera de scope. **Decisión:** la entidad `Buyer` vive brand-local en `abel` (async, FK `icp_id`), **espejando el esquema de campos del engine** (demographics/psychographics/pain_points/desires/buyer_journey/objections — mismos slugs JSONB que el field-contract engine) + extendiendo lo B2B. El `01-spec.md` dice "consumir vía import, no recrear" — eso aplica al **esquema/patrón** (consumido), no al **runtime** (no se puede montar sync en async). → **Open Question #1 para PM.**
- **Buyer extraction template + persister → CONSUME el PATRÓN (no el código sync).** El extractor draft-first brand-local subclasea/imita `BaseExtractionOrchestrator` (engine) y usa el template j2 engine como referencia de prompt. NO importa el persister sync (escribe brand-local async). NO edita `core/luana-core-copilot`.
- **BaseExtractionOrchestrator → EXTEND (subclass) si se importa limpio en async; si la base es sync-only, REPLICATE el patrón wave brand-local.** Builder-agentic decide en `technical_design` tras leer la base (los hooks `_merge_and_save` son sync → probablemente patrón replicado async). Documentar en ticket.
- **EntitySubNavBar (FE) → PORT re-temizado de vitalia (consume el patrón, no reinventa).** Variante **leaves-dinámicos** (leaves = `datos` + buyers + `+ buyer`). Vive en `nicolify/frontend/src/components/shared/shell-organism/`. **Lift candidate `@luana/ui-kit` (N=2 con vitalia staff)** → FLAGGEAR, NO liftear acá (es `/pm-luana`).
- **sanitize_payload → CONSUME vía import** (RN-9 sanitización de la semilla + RN-10 trace sin PII). NUNCA reimplementar local.

### NEW justificado — por qué los existentes no sirven

- **ICP (entidad nivel-cuenta):** NO existe en ningún `core/luana-core-*` (grep vacío en crm Account/Stakeholder — `agent-revenue-engine §5` es diseño aspiracional, sin código). NO existe cross-brand (vitalia/comunify/lupulo sin ICP). El legacy nicolify era B2C (solo Buyer). → NET-NEW brand-local en `abel`. Criterio Chris (1000+ tenants, cero deuda): la entidad es liviana (1 tabla `abel_icps` + FK desde `abel_buyers`), tenant-scoped raíz, sin lógica que duplique engine.
- **`promotable: candidate` para `/pm-luana`:** un "ICP definition" sirve a brands B2B futuras (saasora, inmoflow). FLAGGEAR al cerrar `done` (no liftear en esta story — N=1 todavía).

### ⚠️ Escalaciones a /pm-luana (flags, NO tickets en esta story)

1. **Lift `ICP` a core** cuando aparezca el 2º consumer B2B (N=2). Hoy N=1 → flag only.
2. **Lift `EntitySubNavBar` a `@luana/ui-kit`** (N=2 ya: vitalia staff + nicolify ICP). Hoy se porta brand-local; el lift formal es `/pm-luana`.
3. **`buyer_personas` engine async-ification / `icp_id` extension** — si el patrón ICP→buyers se repite cross-brand, proponer a `/pm-luana` async repo + relación. Hoy brand-local.

**Ningún ticket de esta story edita `core/luana-core-*/src/`.** Todo lo agentic/buyer vive en `nicolify/backend/src/modules/nicolify/abel/`.

## Integration design (CONN — anti-orphan · ninguna funcionalidad llega a `done` como isla)

- **C — Consumed (≥1 consumidor real):** la hoja la consume el **dueño** (web, Plano 1) vía Ribbon→Abel→ICP & buyer, y **Luana→Abel** (Plano 2, misma acción service-layer). Downstream futuro: **Brenda** (ángulo de contenido/pauta) + **Christian** (mensaje/timing outbound) leerán ICP+buyers como materia prima (sus stories — declarados aquí como consumers futuros, no construidos).
- **O — On the map:** vive en `capabilities/abel/icp-buyer.yaml` (hogar declarado) · zona `agentes` · caja `abel` · área `icp` (`SYSTEM-MAP.yaml::abel.icp`).
- **N — Navigable (reachability path concreto):**
  ```
  Login → /{tenantId} → (shell-organism) → Ribbon[Abel] (AGENT_CATALOG.abel.defaultSubtab="icp")
       → SubTabsBar[🎯 ICP & buyer] → /{tenantId}/abel/icp   (MASTER · lista de ICPs)
       → click ICP card → router.push /{tenantId}/abel/icp/{icpId}  (→ redirect a /datos)
       → [icpId]/layout.tsx monta EntitySubNavBar (N3) → leaf /datos | /{buyerId}
  ```
- **N — Notarized (registration points · cableado donde el runtime descubre):**
  - **BE:** `app.include_router(abel_router, prefix="/api/v1/abel", tags=["abel"])` en `nicolify/backend/src/main.py` (T-BE-1).
  - **FE nav:** `abel.icp` ya está en `AGENT_SUBTABS` (shell-routes.ts SSoT) + `AGENT_CATALOG.abel.defaultSubtab="icp"`. El **master** se cablea reemplazando el `EmptyState` de `"abel.icp"` en `SubTabContent.tsx` por `<IcpMasterListView/>` (T-FE-3). Las rutas **detalle** (`[entityId]/layout.tsx` + `[entityId]/[leaf]/page.tsx`) son **nuevos segmentos** bajo `[agent]/[subtab]/` (T-FE-4).
  - **EntitySubNavBar** montado por `[icpId]/layout.tsx` (EntityWorkspaceLayout pattern) — barra N3 superior del stack, NO card flotante.
  - **Extracción:** `POST /api/v1/abel/icp/extract` registrado en el router abel; el job async invalida la React Query key `['abel','icp','list']`.
- **Home cap:** `abel/icp-buyer`.

## 1. Domain Entities (ver detalle en 03-arch-be.md)

Dos entidades brand-local en `nicolify/backend/src/modules/nicolify/abel/domain/`:

- **`Icp(BaseEntity)`** — `id, tenant_id, label (único/tenant), description, vertical, company_size, geo, business_model, avg_ticket: Decimal|None, avg_ticket_currency: str|None, sales_cycle, main_pain, sales_angle, signals: list[str], anti_pattern, status: Literal["borrador","listo"], origin: Literal["manual","draft"], created_at, updated_at, deleted_at`. (RN-1 tenant_id · RN-7 label único · RN-11 currency preservada · soft-delete.)
- **`Buyer(BaseEntity)`** — `id, tenant_id, icp_id (FK → Icp · RN-5), name, role, decision_power: Literal[...], is_primary: bool (RN-6 ≤1/ICP), demographics: dict, psychographics: dict, pain_points: list[dict], desires: list[dict], objections: list[dict], buyer_journey: dict, purchase_triggers: list[str], preferred_channels: list[dict], created_at, updated_at, deleted_at`. (Espeja slugs JSONB del field-contract engine BuyerPersona + extiende B2B.)

`tenant_id` + `deleted_at` mandatorios en ambas. Toda query filtra `tenant_id` (RN-1).

## 2. SQLAlchemy 2.0 Models

Tablas (prefijo `abel_`): **`abel_icps`** + **`abel_buyers`** + **`nicolify_growth_studio_event`** (telemetría brand-local, ADR-nicolify-001 §8). `mapped_column()`, índices `(tenant_id)`, `(tenant_id, icp_id)`, unique `(tenant_id, lower(label)) WHERE deleted_at IS NULL` (RN-7). Detalle DDL + migración idempotente en `03-arch-be.md`.

## 3. Pydantic v2 DTOs · 4. API Routes · 6. Repos · 7. Services

Detalle completo en **`03-arch-be.md`**. Resumen:

- DTOs `IcpCreate/IcpPatch/IcpResponse`, `BuyerCreate/BuyerPatch/BuyerResponse`, `IcpExtractRequest/IcpExtractJobResponse` — todos `ConfigDict(from_attributes=True)`, sin `Any` (dicts JSONB tipados como `dict[str, Any]` solo donde el field es flexible JSONB, igual que el engine).
- Rutas bajo `/api/v1/abel/...` · Bearer + `X-Tenant-ID` · `response_model=` en cada una · `redirect_slashes=False` (app-level, ya está).
- Repos async ABC, todo método recibe `tenant_id` (incl. `get_by_id`).
- Services async: `IcpService` (CRUD + `mark_ready` valida mínimo RN-8 + unicidad RN-7 idempotente), `BuyerService` (CRUD + `set_primary` RN-6), `IcpExtractionService` (orquesta el extractor draft-first + audit RN-10).

## 5. TypeScript Types (Frontend)

Detalle en **`03-arch-fe.md`**. camelCase mirror: `Icp`, `Buyer`, `IcpExtractJob`, enums `IcpStatus`, `DecisionPower`. ISO 8601 datetimes como `string`.

## 8. Agentic Surfaces — extracción draft-first

Detalle completo en **`03-arch-agentic.md`** (owner `builder-agentic` Opus · R23 HARD). Resumen:

- **NO** es un grafo LangGraph multi-turno (es una extracción wave-based one-shot seed→draft). Topología: single extraction pass (subclass/replica de `BaseExtractionOrchestrator`), NO supervisor, NO deepagents.
- **Anti prompt-injection (RN-9):** la semilla (URL/archivo/texto) se trata como **dato no confiable** → separación estructural (delimiter markers + provenance), el extractor solo **propone** un borrador (least-privilege: no ejecuta acciones destructivas, no borra, no marca `listo`). Sanitización con `sanitize_payload` antes de persistir trazas.
- **Audit (RN-10):** la escritura del borrador registra audit row `(tenant_id, agent="abel", action="propose_icp_draft", icp_id, seed_type, timestamp)` + emite `abel_icp_draft_proposed` telemetría. Estado nace `borrador` (RN-3: Abel propone, dueño ratifica).
- **Graceful degradation:** timeout + fallback "armar a mano" (SC-network) — no spinner infinito.
- **Cost:** LLM call registrado vía `core/luana-core-observability` (token economy nicolify — agent-revenue-engine §4). NUNCA recrear el recorder.

## 9. Migration Notes

Raw SQL idempotente `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` + `CREATE UNIQUE INDEX IF NOT EXISTS`. NUNCA `op.create_table()`/`sa.Enum(create_type=True)`. Es la 2ª migración nicolify (tras `001_nicolify_iam_baseline`). Comando prod-clone en `03-arch-be.md`.

## 9.5 Tests audit (default flip)

- [x] **No aplica — 03-arch.md NO flipea defaults side-effect.** La story no toca `USE_*_PATTERN_*` ni flags de routing LLM. El extractor consume el path LLM existente del engine. (La extracción async usa un feature path nuevo, no un flip de default existente.)

## 10. File Structure

Detalle por surface en los 3 sub-arch. Marcas NEW vs MODIFIED:
- **NEW BE:** `nicolify/backend/src/modules/nicolify/abel/{domain,infrastructure,application,api,extraction}/` + `alembic/versions/002_abel_icp_buyer.py`.
- **MODIFIED BE:** `nicolify/backend/src/main.py` (include_router) + `nicolify/backend/tests/architecture/` (EXTEND allowlists, add `test_growth_studio_event_no_pii.py`).
- **NEW FE:** `features/abel/{components/icp,api,hooks,store,types}/` + `components/shared/{intake/UniversalIntake.tsx, ProposalBanner.tsx, DraftFirstStarter.tsx, WhatForChip.tsx}` + `components/shared/shell-organism/{EntitySubNavBar.tsx, EntityWorkspaceLayout.tsx}` (port) + app routes `[agent]/[subtab]/[entityId]/{layout.tsx,page.tsx,[leaf]/page.tsx}`.
- **MODIFIED FE:** `components/shared/shell-organism/SubTabContent.tsx` (`abel.icp` → IcpMasterListView).

## 11. Cross-Cutting Concerns

- **Tenant isolation raíz (RN-1):** `.where(Model.tenant_id == tenant_id)` en TODA query (incl. `get_by_id`, incl. buyer scoped por `icp_id` ∧ `tenant_id`). Cross-tenant read → 404 (no revela existencia, SC-adversarial-tenant). NO `PhiRepositoryBase` (nicolify no es PHI — ADR-nicolify-001 §6).
- **Currency (RN-11):** `avg_ticket_currency: str | None` en el DTO ICP; preservar la moneda capturada, NUNCA convertir on-write. FE: `formatMoney(amount, currency ?? useTenantLocale().currency)`. NO hardcodear `'USD'`.
- **Master data:** `DateTime(timezone=True)` UTC; display vía `useTenantLocale()`. NUNCA `datetime.utcnow()` (usar `utc_now()` engine).
- **Spanish neutro LatAm (tuteo, sin voseo):** todo el chrome UI + microcopy (§ Microcopy del spec). El texto de Abel (banner, "está leyendo") = voz Abel/Luana (no per-tenant). Arch test `test_spanish_neutro`.
- **PII:** `response_model=` allowlist en toda ruta (la semilla cruda nunca sale en una response). `nicolify_growth_studio_event` con `account_id` + montos bucketeados + `icp_id_hashed` (NO PII) → arch test `test_growth_studio_event_no_pii`. Trazas del extractor → `sanitize_payload`.
- **Anti prompt-injection (RN-9):** semilla = dato no confiable, separación estructural + least-privilege (ver § 8 + 03-arch-agentic.md).
- **Guardrails agénticos (agent-revenue-engine):** Abel **propone**, dueño **ratifica** (RN-3); escritura del extractor con audit row (RN-10). Token economy: cost recording via engine observability.
- **Native-first:** lint/tests/tsc/vitest/pytest nativos (`${WS}/.venv/bin/...` · `npx`). NUNCA `docker exec`.

## 12. Architecture Fitness Impact

| Gate | Acción |
|---|---|
| BE `test_response_model_required` | EXTEND — toda ruta abel con `response_model=` |
| BE `test_no_cross_brand_imports` | mantener verde — abel NO importa otro brand; engine vía `luana_core_*` import OK |
| BE `test_migrations_idempotent` | la migración 002 debe pasar (raw SQL IF NOT EXISTS) |
| BE `test_main_app_config` | mantener `redirect_slashes=False` |
| BE `test_growth_studio_event_no_pii` | **NEW** — account_id + montos bucketeados + ids hasheados, sin PII |
| FE `test_shell_routes_ssot` | mantener verde — `abel.icp` ya en SSoT; NO duplicar catálogos |
| FE `test_agent_tw_classes` | EntitySubNavBar usa `_agent-tw-classes.ts` (agent-abel), NUNCA template literals (G3) |
| FE `test_spanish_neutro` | microcopy neutro |
| FE `no-store-in-ssr-skeleton` | EntityWorkspaceLayout skeleton store-free (G2) |

Allowlists: solo shrink. La story agrega gates (no relaja).

## 13. capability YAML + modules/abel.md updates (post-merge)

- `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` — NEW (scenarios = los 15 SC, access, business_rules RN-1..RN-11, zona/caja, `dev_preview` → código real).
- `nicolify/docs/product/modules/abel.md` — NEW (primer código del módulo abel).
- `nicolify/docs/architecture/SYSTEM-MAP.yaml` — `abel.icp` `status: planned → built`.

### Comandos de audit cross-module ejecutados (verbatim)

```bash
WS=$(git rev-parse --show-toplevel)
# engine buyer + extraction + sanitize
find ${WS}/core/luana-core-brand-studio/src -iname "*buyer_persona*"
grep -rn "class BuyerPersona" ${WS}/core/luana-core-brand-studio/src
grep -rn "from sqlalchemy.orm import Session\|AsyncSession" ${WS}/core/luana-core-brand-studio/src/luana_core_brand_studio/{api/buyer_personas.py,infrastructure/repositories/buyer_persona_repository.py}
find ${WS}/core/luana-core-copilot/src -iname "*buyer_persona*"
ls ${WS}/core/luana-core-extraction/src/luana_core_extraction/base_orchestrator.py
ls ${WS}/core/luana-core-observability/src/luana_core_observability/recording/sanitization.py
# crm account/stakeholder (aspiracional check)
find ${WS}/core/luana-core-crm/src -iname "*.py" | grep -iE "account|stakeholder"   # → vacío
# cross-brand ICP mirror
for b in vitalia comunify lupulo; do grep -rln "class Icp\|ideal_customer" ${WS}/$b/backend/src; done  # → vacío
# EntitySubNavBar port source
ls ${WS}/vitalia/frontend/src/components/shared/shell-organism/EntitySubNavBar.tsx
ls ${WS}/nicolify/frontend/src/components/shared/shell-organism/ | grep -i entity   # → falta
```

## 14. Test Construction Plan (TDD RED-first · ver 04-validators.yaml para el plan completo)

- **BE (pytest async):** domain (`Icp`/`Buyer` invariants: RN-5/RN-6/RN-7/RN-8) → infrastructure (repos tenant-scoped, unique constraint) → application (services: mark_ready valida mínimo, set_primary, extraction audit) → api/E2E (response_model, cross-tenant 404, 409 dup label). RED por capa antes de implementar.
- **AGENTIC (pytest):** sanitización de semilla (RN-9 — inyección no ejecuta), extracción produce `borrador` (RN-3), timeout → fallback (SC-network), thin-seed → esqueleto sin alucinar (SC-edge-thin-seed). Trace best-effort.
- **FE (Vitest):** hooks (`useIcps`, `useIcp`, `useBuyers`, `useIcpExtract`) → componentes (`IcpMasterList`, `IcpDatosForm`, `BuyerLeafForm`, `UniversalIntake`, `ProposalBanner`, `DraftFirstStarter`, `WhatForChip`, `EntitySubNavBar` dinámico) → store SSR-safe (G2).
- **E2E (Playwright · fixture `base.ts` anti-burbuja):** 15 SC mapeados (ver 04-validators `scenario_coverage`). Visual goldens side-by-side vs `mockups/icp-buyer.html` (G1 · 4 vistas × 2 themes). axe WCAG 2.1 AA (SC-a11y). Roving tabindex EntitySubNavBar.

## 15. Research Notes (date-aware)

- **Prompt-injection defense para extracción de documentos no confiables** — WebSearch `2026`, accessed **2026-06-03**. Takeaway: el estado del arte 2026 es **separación estructural** (delimiter markers + provenance: la semilla entra como `<untrusted_data>` jamás como instrucción) + **least-privilege/capability scope** (el extractor solo PROPONE un borrador, no puede ejecutar acciones destructivas — reduce blast radius) + **monitoreo de invocaciones** (audit row). No hay "fix" 100% — el bar es "reducir blast radius a aceptable". Mapea exacto a RN-9 (semilla = dato) + RN-10 (audit) + RN-3 (propone/ratifica = el dueño es el gate). Conocimiento post-cutoff (Opus 4.8 = Jan 2026) → verificado live hoy.
  - Fuentes: [Zylos — Indirect Prompt Injection 2026 SOTA](https://zylos.ai/research/2026-04-12-indirect-prompt-injection-defenses-agents-untrusted-content/) · [GetAstra — Prompt Injection 2026 Guide](https://www.getastra.com/blog/ai-security/prompt-injection-attacks/) · [RedDog — LLM Security 2026 Attack Map](https://reddogsecurity.substack.com/p/llm-security-in-2026-a-complete-attack)
- **Draft-first ICP/buyer extraction (seed→extract→propose→ratify)** — research ya capturado en `00-research-icp-data-ux.md §2` (lemlist/M1/Delve/HubSpot/Clay, accessed 2026-06-03 por `/pm-nicolify`). Patrón confirmado como estándar de industria 2025-26. No re-investigado (fresco).
- **EntitySubNavBar / list→detail** — patrón interno cementado en `SHELL-DESIGN-CONTRACT §5.1` (no external research; reference impl vitalia).

## 16. Open Questions for PM

1. **(Engine-boundary · informativa, no bloqueante)** El `01-spec.md` dice "Buyer = consumir engine via import, NO recrear". La realidad técnica: el repo/router engine `buyer_personas` corre **sync `Session` + engine IAM**, incompatible con el módulo `abel` **async + Clerk**, y carece de `icp_id` (FK requerida por RN-5). **Decisión del architect:** consumir el engine **por referencia de esquema/patrón** (mismos slugs JSONB + template extracción + DTO shape) y **replicar la entidad Buyer brand-local async** con FK `icp_id`. Esto NO es "recrear gratuito" — es la única forma de cumplir RN-5/RN-6 sin editar engine. Confirmar que PM/Chris está OK con esta lectura (vs. esperar a un async-ification del engine vía `/pm-luana`). **Recomendación architect: proceder brand-local; flag lift cuando N=2.**
2. **(Lift timing)** `ICP` + `EntitySubNavBar` quedan `promotable: candidate`. ¿`/pm-luana` quiere abrir la promotion proposal ahora (EntitySubNavBar ya es N=2) o esperar al cierre de la story? (No bloquea esta story — se porta/replica brand-local.)
3. **(Intake "conectar fuente")** Depende de Config→conexiones (no construido). El spec lo aprueba con dep-flag. **Decisión architect:** el modo "Conectar" del `UniversalIntake` se renderiza **deshabilitado con CTA "Configurar → Conexiones"** (mockup ya lo muestra así) — los 3 modos activos day-1 son URL/Archivo/Texto. Confirmar que está OK shippear el 4º modo como placeholder navegable (cumple CONN: no es isla, apunta a la zona Config).
