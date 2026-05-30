# 05-guidelines.md — nicolify-r0-dev-stack

> Owner: `/architect`. Patterns required/forbidden + files in scope + skills a cargar por ticket. Builders leen esto + 03-arch.md antes de codear.

---
story_id: nicolify-r0-dev-stack
brand: nicolify
arch_version: 1
---

## Files in scope (por surface)

### BE (`builder-backend`)
```
nicolify/backend/src/main.py                              [MODIFIED]
nicolify/backend/src/db.py                                [NEW]
nicolify/backend/src/modules/nicolify/__init__.py         [NEW]
nicolify/backend/alembic/env.py                           [MODIFIED]
nicolify/backend/alembic/versions/001_nicolify_iam_baseline.py [NEW]
nicolify/backend/alembic/versions/001_initial_snapshot.py [DELETED — legacy visionarias 115 tablas]
nicolify/backend/scripts/seed_test_users_link.py          [NEW]
nicolify/backend/tests/architecture/test_main_app_config.py        [NEW]
nicolify/backend/tests/architecture/test_response_model_required.py [NEW]
nicolify/backend/tests/architecture/test_migrations_idempotent.py   [NEW]
nicolify/backend/tests/architecture/test_no_secret_leak.py          [NEW]
nicolify/backend/tests/architecture/test_no_cross_brand_imports.py  [NEW]
nicolify/backend/tests/modules/nicolify/test_auth_gate.py           [NEW]
nicolify/backend/tests/modules/nicolify/test_tenant_isolation.py    [NEW]
```

### FE (`builder-frontend`)
```
nicolify/frontend/src/app/layout.tsx                      [MODIFIED]
nicolify/frontend/src/app/providers.tsx                   [NEW]
nicolify/frontend/src/app/page.tsx                        [MODIFIED]
nicolify/frontend/src/app/sign-in/[[...sign-in]]/page.tsx [NEW]
nicolify/frontend/src/app/sign-up/[[...sign-up]]/page.tsx [NEW]
nicolify/frontend/src/app/globals.css                     [NEW]
nicolify/frontend/src/lib/api/fetchClient.ts              [NEW]
nicolify/frontend/src/proxy.ts                            [NEW]
```

### E2E + INFRA (`builder-frontend` e2e · `builder-backend` infra/seed)
```
nicolify/frontend/e2e/setup/clerk.setup.ts                [NEW — port refinado ../luana-vitalia]
nicolify/frontend/e2e/auth.fixture.ts                     [NEW — port refinado]
nicolify/frontend/e2e/auth/protected-redirect.spec.ts     [NEW]
nicolify/frontend/e2e/auth/auth-slice.spec.ts             [NEW]
nicolify/frontend/e2e/auth/root-network-failure.spec.ts   [NEW]
nicolify/frontend/e2e/smoke/stack.smoke.spec.ts           [NEW]
nicolify/frontend/playwright.config.ts                    [REPLACED]
nicolify/.env.dev.template                                [MODIFIED — bloque E2E_*]
```

## Forbidden to touch (HARD)
- `core/luana-core-*/src/**` — engine READ-ONLY. Si algo "falta" → escalation `/pm-luana`, NUNCA ticket. (Auth, tenant gate, db session ya existen — CONSUMIR vía import.)
- `vitalia/**`, `comunify/**`, `lupulo/**` — otros brands. SOLO leer como referencia (vitalia scaffold + ../luana-vitalia sibling). NUNCA editar.
- `../luana-vitalia/**` — worktree hermano READ-ONLY. Port → re-tematizar en nicolify, NO editar la fuente.
- `nicolify/frontend/src/components/ui/`, `nicolify/frontend/src/components/shared/` — primitivos/shell (no existen aún, NO crearlos: eso es design-system + shell stories).
- `nicolify/backend/src/modules/nicolify/{copilot,sales_agent}/` — agentic (no existe; no crear).

## Patterns required

### BE
1. **`FastAPI(redirect_slashes=False)`** mandatory en `main.py` (arch test). NUNCA `True`.
2. **`response_model=`** en TODA route (`HealthResponse` para health). El IAM router montado ya lo trae (engine).
3. **Mount engine IAM router verbatim** — `from luana_core_iam.api.routers import auth_router; app.include_router(auth_router.router, prefix="/api/v1/iam/users", tags=["IAM - Users"])`. NUNCA crear `/me` local.
4. **`structlog`** — no `print`/`logging` en código BE.
5. **Alembic raw SQL idempotente** — `op.execute("CREATE TABLE IF NOT EXISTS ...")`. NUNCA `op.create_table()` / `sa.Enum(create_type=True)`. Mirror DDL de `022_vitalia_add_engine_iam_tables.py`.
6. **`db.py` async** — `create_async_engine` + `async_sessionmaker` + `get_async_session` (SQLA 2.0). DSN: prioridad `DATABASE_URL` (asyncpg) → fallback `POSTGRES_*`. Port de `vitalia/backend/src/db.py` re-temizado.
7. **`env.py`** — prioridad `DATABASE_URL` (asyncpg→psycopg sync) → fallback `POSTGRES_*`. `target_metadata = None`.
8. **Seed idempotente** — `ON CONFLICT DO NOTHING/UPDATE`. uuid5 determinístico (namespace URL `6ba7b810-9dad-11d1-80b4-00c04fd430c8`). `E2E_TENANT_ID = uuid5(NAMESPACE, "agencia-demo")`. Tenant "Agencia Demo"/`agencia-demo`/`PEN`/`PE`. 1 user `owner.demo@nicolify.com` role `owner` + `user_tenants(owner)` + `--clerk-sync` (publicMetadata `{role:"owner", tenant_id}`). SIN clinic branch (no PHI).
9. **Tenant isolation** — toda query brand-local filtra `tenant_id`. En esta story el gate lo provee el engine (no hay queries brand-local). Los tests verifican 401/403 del engine montado.

### FE
1. **Server-First** — Server Components default. `"use client"` SOLO en hojas con estado (`providers.tsx`, island de root con fetch). `page.tsx` root = Server shell + Client island para la llamada autenticada.
2. **`proxy.ts` (Next 16)** — NUNCA `middleware.ts` (deprecado v16). `clerkMiddleware()` + `createRouteMatcher` public allowlist: `/sign-in(.*)`, `/sign-up(.*)`, `/api/health`, `/__clerk/(.*)`. Root `/` protegida. Port de `vitalia/frontend/src/proxy.ts` re-temizado (sin `/public`, `/marketing`, `/test-stack`, webhooks vitalia).
3. **`ClerkProvider`** en `app/providers.tsx` (`"use client"`) envuelve `QueryClientProvider`. `layout.tsx` lo monta (excepción foundational — AD-1).
4. **`fetchClient.ts`** — port re-temizado SIN `X-Clinic-ID`. Inyecta `Authorization: Bearer <token>` + `X-Tenant-ID: <tenantId>` + `Content-Type`. `ApiError` class. timeout default 30s. NUNCA inyectar X-Tenant-ID manual en componentes.
5. **Sign-in/sign-up** — Clerk `<SignIn/>`/`<SignUp/>` con catch-all routing (`[[...sign-in]]`).
6. **Manejo error BE** — root maneja 500/503/timeout SIN white-screen. Mensaje español tuteo legible. Loguea en consola (no traga silencioso).
7. **No `any`** — `unknown` + type guards. No default exports (excepto Next pages).
8. **Spanish neutro tuteo** — "No pudimos conectar con el servidor. Reinténtalo en unos segundos." NUNCA voseo.

### E2E
1. **Port refinado de ../luana-vitalia** — `clerk.setup.ts` (ticket strategy `clerk.signIn({page,emailAddress})` + `clerkSetup()` + freshness 4h + cf_bm + retry 2x + storageState `playwright/.clerk/user.json`). `auth.fixture.ts` (testing-token re-inject + console filter). Re-tematizar: nicolify, port 3001, tenant agencia-demo.
2. **NUNCA import directo de `@playwright/test`** en specs autenticados — usar `auth.fixture`.
3. **`playwright.config.ts` REPLACED** — port 3001, `dotenv.config({path: "../.env.dev"})`, required Clerk env vars fail-fast, projects `setup` (serial) + `smoke` (storageState, dependencies:[setup]). NO referencias a `/home/chris/AISALESHT/.env`.
4. **Native** — `cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke`. NUNCA `make e2e`.

## Patterns forbidden
- ❌ Crear `/me` / auth / JWT verify / tenant resolution local (CONSUMIR `core/luana-core-iam`).
- ❌ `X-Clinic-ID` en fetchClient (PHI dual-filter es vitalia-only).
- ❌ Encadenar el legacy `001_initial_snapshot.py` (115 tablas visionarias) — REEMPLAZAR por baseline IAM limpio.
- ❌ Crear tablas `nicolify_*` (precavido — modelos no definidos).
- ❌ `middleware.ts` (Next 16 usa `proxy.ts`).
- ❌ `op.create_table()` / `sa.Enum(create_type=True)` en migraciones.
- ❌ Voseo en strings FE user-facing.
- ❌ `docker exec` para lint/tests/tsc/playwright (native-first).
- ❌ Tokens de marca / componentes Shadcn / shell (eso es design-system + shell stories).
- ❌ Editar `core/`, otros brands, o `../luana-vitalia`.

## must_load_skills (por ticket — verbatim, builder cita estos)

### T-1, T-2 (BE) → `builder-backend`
- backend-expert
- tessl__fastapi
- tessl__pytest-api-testing
- .claude/rules/tenant-isolation.md
- .claude/rules/backend-ddd.md
- .claude/rules/backend-migrations.md
- .claude/rules/anti-duplication.md
- .claude/rules/tdd-mandatory.md
- nicolify/.claude/rules/agent-revenue-engine.md  (token economy + CRM account model context — no se implementa aún, pero el builder respeta el paradigma)

### T-3 (FE) → `builder-frontend`
- frontend-expert
- tessl__react-patterns
- tessl__nextjs-app-router-modularization
- tessl__shadcn-ui
- tessl__tailwind
- tessl__zod
- .claude/rules/frontend-fsd.md
- .claude/rules/spanish-text.md
- .claude/rules/tenant-isolation.md

### T-4 (E2E) → `builder-frontend`
- frontend-expert
- playwright-expert
- .claude/rules/e2e-testing.md
- .claude/rules/tdd-mandatory.md

### T-5 (INFRA) → `builder-backend`
- backend-expert
- .claude/rules/backend-migrations.md
- nicolify/.claude/rules/agent-revenue-engine.md
- docs/process/docker-dev-multibrand.md (referencia stack)

## Verification gate (native, antes de spawn auditor)
```bash
WS=$(git rev-parse --show-toplevel)
# BE
cd ${WS}/nicolify/backend && ${WS}/.venv/bin/ruff check src/ tests/ && ${WS}/.venv/bin/pytest tests/architecture/ tests/modules/nicolify/ -x -q
# FE
cd ${WS}/nicolify/frontend && npx tsc --noEmit && npx eslint src/ --cache
# Stack + E2E (requiere Clerk dev instance + keys en .env.dev)
make dev-nicolify
curl -fsS http://127.0.0.1:8001/health
cd ${WS}/nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke
```
