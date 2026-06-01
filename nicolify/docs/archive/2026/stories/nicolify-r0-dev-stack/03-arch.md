# 03-arch.md — nicolify-r0-dev-stack

> Owner: `/architect`. Contrato técnico consolidado (BE + FE + E2E + INFRA). SSoT de CÓMO se construye lo que el `01-spec.md` define como QUÉ. Builders consumen este archivo.

---
story_id: nicolify-r0-dev-stack
brand: nicolify
type: service-story
module: platform
capability: nicolify-brand-runtime-foundation
cap_target: platform/nicolify-brand-runtime-foundation
cap_change_type: new
arch_version: 1
schema_version: v4.1
architecture_pattern: n/a                      # service-only — ADR-nicolify-001 NO aplica (shell-feature-architecture.md § Scope)
adr_nicolify_001_compliance: not-applicable
architect_run_on: 2026-05-30
ratified_by_chris: true
links:
  spec: "01-spec.md"
  checkpoint: "checkpoint.md"
  chris_input: "chris-input.md"
  validators: "04-validators.yaml"
  guidelines: "05-guidelines.md"
  tickets: "06-tickets.yaml"
  dispatch: "dispatch-plan.md"
---

## 0. Context Summary

- **Story:** `nicolify-r0-dev-stack` — blocker [1] de R0. Levantar Nicolify como brand activa y verde: BE FastAPI :8001 + FE Next.js 16 :3001 vía `make dev-nicolify`, con vertical slice de auth Clerk end-to-end + smoke Playwright verde + 1 owner demo.
- **Architect run on:** 2026-05-30 (knowledge cutoff Opus 4.8 = Jan 2026; convención Next.js 16 `proxy.ts` verificada in-repo — todo tiene precedente en `vitalia/` + `core/luana-core-*/`, sin research externo).
- **Módulos touched:** `platform` (runtime foundation). Sin business modules (`nicolify/backend/src/modules/nicolify/` nace como paquete skeleton vacío).
- **NO AGENTIC:** ningún ticket toca `copilot/` ni `sales_agent/`. Surfaces = BE + FE + E2E/INFRA.

### Surface → builder → auditor mapping (/dev-team usa esto para spawn)

| Surface | Builder | Auditor |
|---|---|---|
| `nicolify/backend/src/{main.py,db.py,modules/nicolify/__init__.py}` + `alembic/` + `scripts/seed_test_users_link.py` + `tests/` | **`builder-backend`** (Sonnet) | **`auditor-backend`** (Opus) |
| `nicolify/frontend/src/{app,lib,proxy.ts}` | **`builder-frontend`** (Sonnet) | **`auditor-frontend`** (Opus) |
| `nicolify/frontend/e2e/` + `playwright.config.ts` + `.env.dev.template` + INFRA verify | **`builder-frontend`** (Sonnet) e2e + **`builder-backend`** (Sonnet) infra/seed | **`auditor-frontend`** (Opus) e2e · `auditor-backend` infra |

> Ningún surface AGENTIC → ningún `builder-agentic`/`auditor-agentic`. Ningún ticket edita `core/luana-core-*/src/`.

### Skills consultados (decisión, no contenido)

- **backend-expert** — DDD Inside-Out + arch fitness (redirect_slashes, response_model, migrations idempotent). Decisión: `main.py` thin mount del engine IAM router (NO crear `/me` local — anti-duplication). `db.py` async session portado de vitalia. Alembic shallow (mirror engine IAM tables, cero brand tables).
- **frontend-expert** — FSD-Lite + Server-First. Decisión: `ClerkProvider` en `app/layout.tsx` (foundational, se toca acá por excepción documentada) + `proxy.ts` (Next 16 convención, NO `middleware.ts`) + `fetchClient.ts` portado re-temizado (sin `X-Clinic-ID` — eso es PHI vitalia-only). Root placeholder Server+Client split con manejo de error 500.
- **playwright-expert** (vía e2e-testing rule) — Clerk↔Playwright. Decisión: portar refinado del worktree hermano `../luana-vitalia` (`clerk.setup.ts` ticket strategy + freshness 4h + retry, `auth.fixture.ts` re-inject token). El playwright.config legacy de nicolify (refs `/home/chris/AISALESHT/.env`) se **REEMPLAZA** completo.
- **copilot-expert / sales-agent-expert** — invocados para confirmar scope: **NO aplican** (cero superficie agéntica; los módulos `copilot`/`sales_agent` nacen en stories de agentes futuras).

### CONTEXT-BRIEF source

Self-ran greps (Path B — story-level, brief skipped). Prior-art re-validado in-disk: `vitalia/backend/src/{main.py,db.py}`, `vitalia/backend/alembic/{env.py,versions/022_vitalia_add_engine_iam_tables.py}`, `core/luana-core-iam/src/luana_core_iam/{application/auth.py,api/dependencies.py,api/routers/auth_router.py,domain/user.py}`, `core/luana-core-platform/core/database.py`, `../luana-vitalia/vitalia/frontend/e2e/{setup/clerk.setup.ts,auth.fixture.ts}` + `playwright.config.ts`, `../luana-vitalia/vitalia/backend/scripts/seed_test_users_link.py`, `vitalia/frontend/src/{proxy.ts,app/layout.tsx,lib/api/fetchClient.ts}`.

### capability YAML files afectados (post-merge)

- **CREATE** `nicolify/docs/product/capabilities/platform/nicolify-brand-runtime-foundation.yaml` (schema v2, `change_log[0].type: new`). Atomics: `stack-up-green`, `auth-vertical-slice`, `tenant-isolation-gate`, `alembic-shallow-baseline`, `smoke-clerk-playwright`.
- **CREATE/UPDATE** `nicolify/docs/product/modules/platform.md` (intro + auto-block) — `/pm-nicolify` Fase F.

### Architecture gates que deben quedar verdes

- `nicolify/backend/tests/architecture/test_main_app_config.py` (NEW — redirect_slashes=False + HealthResponse response_model)
- `nicolify/backend/tests/architecture/test_response_model_required.py` (NEW — mirror vitalia, allowlist vacío shrink-only)
- `nicolify/backend/tests/architecture/test_migrations_idempotent.py` (NEW — mirror vitalia, AST + regex IF NOT EXISTS)
- `nicolify/backend/tests/architecture/test_no_secret_leak.py` (NEW — /health + OpenAPI sin secrets)
- `nicolify/backend/tests/architecture/test_no_cross_brand_imports.py` (NEW — nicolify nunca `from vitalia`/`from comunify`/`from lupulo`)

---

## Architecture Decisions (cardinales — leer antes de codear)

### AD-1 — ADR-nicolify-001 NO aplica (documentado)

`shell-feature-architecture.md § Scope` lista **explícitamente** `nicolify-r0-dev-stack` como service-only (sin sub-tab UI nueva). El `root /` placeholder NO es una sub-tab del shell-organism (`(shell-organism)/{agent}/{subtab}/page.tsx`) — es el bootstrap de auth. Por tanto: **sin gate de mockup-per-component, sin cita ADR, sin las 9 secciones**. Las sub-tabs nacen en stories `nicolify-r0-{topbar,shell-layout-splitter,...}`.

### AD-2 — Auth + tenant isolation = CONSUMIR engine, CERO recreación (NO-NEW-LAYER)

El binding tenant y la verificación JWT viven **íntegros** en `core/luana-core-iam`:
- `luana_core_iam.application.auth.verify_clerk_token` → JWT verify contra `CLERK_ISSUER`/JWKS (RS256). Token inválido/ausente → `401`.
- `luana_core_iam.api.dependencies.get_current_user` → resuelve user por email del token, enforce X-Tenant-ID contra `user_tenants` junction. **Tenant ajeno → `403`**. User no en DB → `403`.
- `luana_core_iam.api.routers.auth_router` → `/me` + `/me/tenants`.

nicolify **monta el router verbatim** (igual que vitalia `main.py` líneas 52-57). **NUNCA** crea `/me` local ni reimplementa JWT verify / tenant resolution. El gate de tenant isolation del Scenario 4 lo provee el engine — la story solo lo **wirea y testea**.

### AD-3 — Alembic shallow: REEMPLAZAR el snapshot legacy, mirror SOLO engine IAM tables

**Hallazgo bloqueante:** `nicolify/backend/alembic/versions/001_initial_snapshot.py` es el snapshot del **monolito legacy visionarias** (115 tablas, `pg_dump visionarias_logs`, 4692 líneas) — sobrevivió al reset. Contradice el scope ratificado ("CERO tablas brand-local, stamp head sobre esquema de engine, precavido"). **Decisión:** se **REEMPLAZA** por un baseline limpio nicolify que crea SOLO las 3 tablas engine IAM (`tenants`, `users`, `user_tenants`) idempotentes — patrón verbatim de `vitalia/backend/alembic/versions/022_vitalia_add_engine_iam_tables.py` (schema-mirror exception, `backend-ddd.md`). Nuevo `001_nicolify_iam_baseline.py` con `down_revision = None`. El legacy `001_initial_snapshot.py` se **borra**. "Stamp head" del spec = aplicar este baseline (1 migración) sobre `nicolify_dev`.

> Schema-mirror exception (per `backend-ddd.md`): `builder-backend` PUEDE crear estas tablas que reflejan el DDL del engine `TenantModel/UserModel/UserTenantModel`. Sin promotion proposal. Reference: `docs/promotion-protocol/proposals/2026-05-19-vitalia-adopt-luana-core-iam.md` (state accepted) — nicolify adopta el mismo engine.

### AD-4 — db.py / env.py DSN: priorizar DATABASE_URL (compose SSoT)

`nicolify/docker-compose.dev.yml` inyecta `DATABASE_URL` (asyncpg). El `env.py` actual de nicolify usa solo `POSTGRES_*`. Decisión: portar el patrón de vitalia (`db.py` + `env.py`) que **prioriza `DATABASE_URL`** (asyncpg→psycopg sync para alembic) con fallback `POSTGRES_*`. Garantiza paridad host (E2E/seed) ↔ container (runtime/migrate).

### AD-5 — fetchClient SIN X-Clinic-ID (PHI dual-filter es vitalia-only)

El `fetchClient.ts` de vitalia inyecta `X-Clinic-ID` (HIPAA-lite). nicolify **NO** es brand de salud: re-tematizar **eliminando** `clinicId`/`X-Clinic-ID`. Solo `Authorization: Bearer <jwt>` + `X-Tenant-ID` + `Content-Type`. Tenant isolation raíz (no dual-filter clínico).

### AD-6 — Legacy E2E/playwright/scripts cruft = REEMPLAZAR, no extender

`nicolify/frontend/e2e/{pages,fixtures}/*` + `playwright.config.ts` (refs `/home/chris/AISALESHT/.env`, copilot/growth-studio POMs) son residuo del monolito legacy. La story **reemplaza** `playwright.config.ts` (port 3001, carga `../.env.dev`, setup+smoke projects) y crea `e2e/{setup,auth,smoke}/` limpios. El cruft legacy de `e2e/pages/` + `e2e/fixtures/` que no usa esta story se deja intacto (no es scope borrarlo masivo) PERO el nuevo config NO lo matchea. Builder documenta en impl-log si algún archivo legacy rompe `tsc`.

### AD-7 — `/me` engine devuelve User domain (clerk_id, email, phone)

El `auth_router./me` retorna el `User` domain model engine (incluye `clerk_id`, `email`, `phone`) — **engine-owned**, montado verbatim como vitalia. nicolify NO altera el response_model del engine (eso sería engine edit → `/pm-luana`). Para esta story el `/me` es solo gate de auth (200 con JWT válido). Si una story futura necesita response_model PII-allowlist más estricto para nicolify → escalation `/pm-luana` (engine), NO ticket aquí. Documentado, no bloqueante para R0.

---

## Prior art audit (anti-duplication-refining · NO-NEW-LAYER)

### Source of evidence
- [ ] CONTEXT-BRIEF.md § 7 + § 8 (no existe — story-level, brief skipped)
- [x] Self-run greps (Path B)

### Audit cross-module ejecutado

```bash
# 1. Auth/JWT verify en engine (no recrear)
grep -rln "verify_clerk_token|CLERK_ISSUER|PyJWKClient" core/luana-core-*/src/
#   → core/luana-core-iam/{application/auth.py, api/dependencies.py}  [EXISTE]
# 2. Tenant resolution / X-Tenant-ID / get_current_user en engine
grep -rln "X-Tenant-ID|set_tenant_id|get_current_user" core/luana-core-*/src/
#   → core/luana-core-iam/api/dependencies.py  [EXISTE — get_current_user 403]
# 3. Cross-brand mirror: ¿otro brand tiene auth/me local?
for b in vitalia comunify lupulo; do grep -rln "def get_current_user|verify_clerk_token" $b/backend/src/modules/; done
#   → (vacío en los 3) — NADIE mirrorea. Todos consumen engine iam.
# 4. DB session / get_db en engine
grep -rln "def get_db|create_async_engine" core/luana-core-platform/src/
#   → core/luana-core-platform/core/database.py  [EXISTE]
```

### Sistemas existentes encontrados

| Sistema | Path | Config | Factory/Router | Estado |
|---|---|---|---|---|
| JWT verify + tenant gate | `core/luana-core-iam/{application/auth.py, api/dependencies.py}` | `CLERK_ISSUER` env | `get_current_user` (403), `get_user_from_token` (401) | active |
| Auth router `/me` | `core/luana-core-iam/api/routers/auth_router.py` | — | `router` (GET /me, /me/tenants) | active |
| DB session engine | `core/luana-core-platform/core/database.py` | `DATABASE_URL`/`POSTGRES_*` | `get_db` | active |
| IAM tables DDL (mirror brand) | `vitalia/backend/alembic/versions/022_vitalia_add_engine_iam_tables.py` | — | schema-mirror | active (vitalia) |
| Clerk↔Playwright refinado | `../luana-vitalia/vitalia/frontend/e2e/{setup/clerk.setup.ts, auth.fixture.ts}` | env E2E_* | ticket strategy + freshness | active (vitalia disk) |
| Seed users/tenants | `../luana-vitalia/vitalia/backend/scripts/seed_test_users_link.py` | uuid5 namespace | `--clerk-sync` idempotente | active (vitalia disk) |

### Decisión por sistema

- **JWT verify + tenant gate (engine iam):** **CONSUME vía import** (`from luana_core_iam.api.routers import auth_router`). CERO recreación. El gate `403` cross-tenant del Scenario 4 lo provee el engine.
- **DB session (engine platform):** el engine `get_db` (sync Session) lo usa el router IAM montado. nicolify además crea `db.py` async (`get_async_session`) para sus rutas futuras — **portado re-temizado de vitalia**. NEW justificado: brand-local session factory (paridad con vitalia; el engine no expone async factory brand-scoped).
- **IAM tables DDL:** **EXTEND via schema-mirror** — `001_nicolify_iam_baseline.py` clona el patrón de `022_vitalia`. No es cross-brand mirror prohibido (es el patrón canónico de `backend-ddd.md`; cada brand mirrorea las tablas engine en su chain).
- **Clerk↔Playwright + seed:** **PORT re-temizado** del worktree hermano. Cambios: brand=nicolify, 1 tenant "Agencia Demo" (agencia-demo/PEN/PE), 1 owner demo, sin clinic branch (no PHI). El header de `clerk.setup.ts` dice "Adapted from nicolify/frontend/e2e/setup/clerk.setup.ts" → el pattern nació en nicolify legacy, lo traemos refinado.

**Cross-brand mirror check:** ✅ CERO mirrors prohibidos. Nadie reimplementa auth. Reuses = (a) consumo engine vía import, (b) schema-mirror DDL (excepción documentada), (c) port de scaffold infra re-tematizado. CERO lift candidates a core.

**NO-NEW-LAYER verdict:** sin layers nuevos. Ningún factory/registry/provider paralelo al engine. El único NEW (db.py async brand-local) es paridad con vitalia, no duplica el engine.

---

## 1. Domain Entities

**NINGUNA nueva.** `Tenant`/`User`/`UserTenant` viven en `core/luana-core-iam/domain/`. nicolify las consume vía el router montado. `nicolify/backend/src/modules/nicolify/__init__.py` = paquete skeleton vacío.

## 2. SQLAlchemy 2.0 Models

**NINGUNO nuevo.** `TenantModel`/`UserModel`/`UserTenantModel` viven en `core/luana-core-iam/infrastructure/models/`. La migración baseline solo refleja su DDL (raw SQL).

## 3. Pydantic v2 DTOs

Solo `HealthResponse` (BE):

```python
class HealthResponse(BaseModel):
    """Liveness probe response DTO."""
    status: str
    brand: str
    version: str
```

`/me` retorna el `User` domain (engine) — no se redefine acá.

## 4. API Routes

| Method | Path | Auth | response_model | Owner |
|---|---|---|---|---|
| GET | `/health` | público | `HealthResponse` | nicolify main.py (NEW) |
| GET | `/api/health` | público | `HealthResponse` | nicolify main.py (NEW) — allowlist Clerk proxy + smoke |
| GET | `/api/v1/iam/users/me` | Bearer + X-Tenant-ID | `User` (engine) | engine iam router (MOUNTED) |
| GET | `/api/v1/iam/users/me/tenants` | Bearer + X-Tenant-ID | `list[TenantSchema]` (engine) | engine iam router (MOUNTED) |

- `FastAPI(redirect_slashes=False)` mandatory (arch test).
- IAM router montado en prefix `/api/v1/iam/users` (paridad vitalia main.py:52-57).
- `/me` sin JWT → `401` (engine). X-Tenant-ID ajeno → `403` (engine).

## 5. TypeScript Types (Frontend)

```typescript
export interface FetchClientOptions extends Omit<RequestInit, "headers"> {
  token: string;        // Clerk JWT (getToken())
  tenantId: string;     // X-Tenant-ID (Clerk publicMetadata.tenant_id)
  headers?: Record<string, string>;
  timeoutMs?: number;   // default 30000
}
// NO clinicId / X-Clinic-ID (PHI dual-filter es vitalia-only — AD-5)
```

Health response: keys ya snake-free (`status`/`brand`/`version`).

## 6. Repository Interfaces

**NINGUNA nueva.** Engine iam owns repos.

## 7. Application Services

**NINGUNO nuevo.** Engine iam owns `UserService`/`TenantService`.

## 8. Agentic Surfaces

**N/A — esta story NO toca `copilot/` ni `sales_agent/`.** Cero LangGraph, cero tools, cero prompt cache, cero goldens. Los agentes nacen en stories `/ux-agentico` posteriores.

## 9. Migration Notes

- **REEMPLAZAR** `001_initial_snapshot.py` (legacy visionarias 115 tablas) por **`001_nicolify_iam_baseline.py`** (`down_revision = None`).
- Contenido: `CREATE EXTENSION IF NOT EXISTS pgcrypto;` + 3 tablas idempotentes (`tenants`, `users`, `user_tenants`) + índices — clon del DDL de `022_vitalia_add_engine_iam_tables.py`.
- `env.py`: priorizar `DATABASE_URL` (asyncpg→psycopg sync) + fallback `POSTGRES_*`. `target_metadata = None`.
- **CERO tablas `nicolify_*`** (precavido).
- Idempotency: `IF NOT EXISTS` en todo. Segundo `upgrade head` = no-op (Scenario 3).
- Prod-clone test: `docker exec luana-nicolify-backend-dev bash -c 'alembic upgrade head && alembic upgrade head'`.

## 9.5 Tests audit (default flip)

`[x] No aplica — CONTRACT no flipea defaults side-effect.`

## 10. File Structure

```
nicolify/backend/
  src/
    main.py                              [MODIFIED] FastAPI(redirect_slashes=False) + HealthResponse + /health + /api/health + mount iam auth_router
    db.py                                [NEW] async session (get_async_session) — port vitalia re-temizado, DATABASE_URL priority
    modules/nicolify/__init__.py         [NEW] paquete skeleton vacío
  alembic/
    env.py                               [MODIFIED] DATABASE_URL priority + POSTGRES_* fallback, target_metadata=None
    versions/001_nicolify_iam_baseline.py [NEW] mirror engine IAM tables idempotent, down_revision=None
    versions/001_initial_snapshot.py     [DELETED] legacy visionarias snapshot (115 tablas)
  scripts/seed_test_users_link.py        [NEW] port re-temizado: 1 tenant "Agencia Demo" + owner.demo@nicolify.com + user_tenants(owner) + --clerk-sync; sin clinic branch
  tests/
    architecture/test_main_app_config.py       [NEW]
    architecture/test_response_model_required.py [NEW] mirror vitalia
    architecture/test_migrations_idempotent.py   [NEW] mirror vitalia
    architecture/test_no_secret_leak.py          [NEW]
    architecture/test_no_cross_brand_imports.py  [NEW]
    modules/nicolify/test_auth_gate.py           [NEW] /me sin JWT → 401
    modules/nicolify/test_tenant_isolation.py    [NEW] X-Tenant-ID ajeno → 403

nicolify/frontend/
  src/
    app/layout.tsx                       [MODIFIED] ClerkProvider (foundational — AD-1) + Providers + lang es + metadata
    app/providers.tsx                    [NEW] ClerkProvider + QueryClientProvider ("use client")
    app/page.tsx                         [MODIFIED] root placeholder autenticado (Server shell + Client island) + manejo BE 500 español tuteo
    app/sign-in/[[...sign-in]]/page.tsx  [NEW] Clerk <SignIn/>
    app/sign-up/[[...sign-up]]/page.tsx  [NEW] Clerk <SignUp/>
    app/globals.css                      [NEW] base Tailwind minimal (sin tokens de marca)
    lib/api/fetchClient.ts               [NEW] port re-temizado SIN X-Clinic-ID
    proxy.ts                             [NEW] clerkMiddleware + public routes allowlist (Next 16 proxy)
  e2e/
    setup/clerk.setup.ts                 [NEW] port refinado de ../luana-vitalia
    auth.fixture.ts                      [NEW] port refinado
    auth/protected-redirect.spec.ts      [NEW] Scenario 2
    auth/auth-slice.spec.ts              [NEW] Scenario 5 (corazón del DONE)
    auth/root-network-failure.spec.ts    [NEW] Scenario 7
    smoke/stack.smoke.spec.ts            [NEW] Scenario 6
  playwright.config.ts                   [REPLACED] port 3001, carga ../.env.dev, setup+smoke projects, required Clerk env vars

nicolify/.env.dev.template               [MODIFIED] bloque E2E_* (E2E_CLERK_USER_EMAIL/PASSWORD, E2E_TENANT_ID, E2E_BASE_URL)
```

## 11. Cross-Cutting Concerns

- **Tenant isolation** — provista por engine `get_current_user` (X-Tenant-ID validado contra `user_tenants`, 403 cross-tenant). nicolify wirea + testea (Scenario 4).
- **Currency** — tenant demo `default_currency: PEN` (Perú). Sin DTOs monetarios (infra). `account.currency` separation = stories CRM futuras.
- **Master data** — IAM tables usan `timestamp with time zone DEFAULT now()` (UTC).
- **Spanish neutro LatAm (TUTEO)** — strings FE en tuteo ("No pudimos conectar con el servidor. Reinténtalo en unos segundos."). NO voseo. Validar glosario `spanish-text.md`.
- **PII** — `/health` + `/api/health` exponen solo `{status,brand,version}` (cero env/secrets). OpenAPI `/docs` no lista valores env (arch test). `/me` engine retorna User domain — engine-owned, montado verbatim (AD-7). Logs sin secrets.
- **Native-first dev** — lint/tests/tsc/playwright native (`${WS}/.venv/bin/{ruff,pytest}` + `npx {tsc,playwright}`). NUNCA `docker exec` para QA. Docker solo runtime/migrate.

## 12. Architecture Fitness Impact

Gates NEW (allowlists vacíos shrink-only):

- `test_main_app_config.py` — `redirect_slashes=False` + `/health` `response_model=HealthResponse`.
- `test_response_model_required.py` — todo route nicolify con `response_model=` (AST). Allowlist `frozenset()`.
- `test_migrations_idempotent.py` — todo DDL con `IF NOT EXISTS`. Baseline limpio (legacy snapshot borrado → 1 migración).
- `test_no_secret_leak.py` — `/health` + `/api/health` allowlist + OpenAPI sin valores env.
- `test_no_cross_brand_imports.py` — `nicolify/backend/src/` nunca `from vitalia`/`from comunify`/`from lupulo`.

## 13. capability YAML + modules/{m}.md Updates Required

- **CREATE** `nicolify/docs/product/capabilities/platform/nicolify-brand-runtime-foundation.yaml` (v2, `change_log[0].type: new`).
- **UPDATE** `nicolify/docs/product/modules/platform.md` (intro + auto-block).
- `/pm-nicolify` Fase F.3 (`cap_change_type: new`).

## 14. Test Surfaces (TDD-mandatory · RED first)

- **BE arch (RED primero):** `test_main_app_config` → `test_migrations_idempotent` → `test_no_secret_leak` → `test_no_cross_brand_imports`.
- **BE module:** `test_auth_gate.py::test_me_without_jwt_401` → `test_tenant_isolation.py::test_foreign_tenant_header_rejected`.
- **FE:** contrato FE se prueba vía E2E (infra story). Opcional: smoke unit del `fetchClient` header injection.
- **E2E (RED antes de página):** `protected-redirect.spec.ts` → `auth-slice.spec.ts` (corazón DONE) → `root-network-failure.spec.ts` → `smoke/stack.smoke.spec.ts`.
- **INFRA graders:** `make dev-nicolify` verde + `curl /health` `/api/health` `:3001` 200 + `alembic upgrade head` ×2 no-op + seed ×2 idempotente.

## 15. Research Notes (date-aware)

Knowledge cutoff Opus 4.8 = Jan 2026. **CERO research externo** — todo patrón tiene precedente in-repo (accessed 2026-05-30):

- **Next.js 16 `proxy.ts` (no `middleware.ts`):** verificado en `vitalia/frontend/src/proxy.ts` (header documenta deprecación v16.0.0, mismo `config.matcher`, `clerkMiddleware()` unchanged). nicolify FE ya tiene `next@^16.2.3` + `@clerk/nextjs@^6.36.8`.
- **Clerk testing ticket strategy + freshness gate:** `../luana-vitalia/vitalia/frontend/e2e/setup/clerk.setup.ts` — `@clerk/testing@^2.0.8` `clerk.signIn` ticket strategy + `clerkSetup()` + freshness 4h + retry. nicolify FE ya tiene `@clerk/testing@^2.0.8`.
- **Engine IAM tenant gate (403):** `core/luana-core-iam/api/dependencies.py::get_current_user` — confirma que el gate Scenario 4 NO requiere código brand-local.
- **Schema-mirror migration pattern:** `vitalia/backend/alembic/versions/022_vitalia_add_engine_iam_tables.py`.

## 16. Open Questions for PM

1. **Legacy `001_initial_snapshot.py` borrado:** confirmo que el snapshot del monolito visionarias (115 tablas) se **elimina** y reemplaza por baseline IAM limpio. Si Chris quiere preservarlo arqueológicamente → mover a `nicolify/docs/archive/` en lugar de borrar. **Recomendación: borrar** (vive en branch `legacy/nicolify-original`).
2. **Clerk dev instance (dependencia externa Chris):** crear instancia Clerk dev propia + keys en `nicolify/.env.dev` + correr seed `--clerk-sync`. Sin esto, Scenarios 2/5/6/7 no corren verde. NO es ticket — pre-condición. ¿Confirmas que la creas antes del build, o el build llega hasta donde no necesita Clerk real (Scenarios 1/3 + arch tests) y queda gated el resto?
3. **Cruft legacy E2E `e2e/pages/*` + `e2e/fixtures/*`:** ¿intactos (no scope) o limpieza aprovechada? Recomiendo dejarlos (el nuevo config no los matchea); limpieza masiva = story housekeeping separada.
