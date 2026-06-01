# 01-spec.md — nicolify-r0-dev-stack

> Owner: `/po`. Spec ejecutable Gherkin AI-resistant. Fuente de verdad de QUÉ debe construirse.

---
story_id: nicolify-r0-dev-stack
brand: nicolify
type: service-story
module: platform
capability: nicolify-brand-runtime-foundation
cap_target: platform/nicolify-brand-runtime-foundation     # PROPUESTO · Chris ratifica
cap_change_type: new
po_version: 2
last_modified: 2026-05-29T22:00:00-05:00
ratified_by_chris: true
release: R0
r0_order: 1
architecture_pattern: n/a                                   # service-only · ADR-nicolify-001 NO aplica (shell-feature-architecture.md § Scope)
links:
  checkpoint: "checkpoint.md"
  chris_input: "chris-input.md"
  parent_story: "../nicolify-r0-shell-organism/"
---

## Resumen ejecutivo

Levantar Nicolify como **brand activa y verde** en el monorepo: BE FastAPI :8001 + FE Next.js 16 :3001 corriendo vía `make dev-nicolify`, con el **vertical slice de auth Clerk funcionando end-to-end** (sign-in → root autenticado → `fetchClient` inyecta `X-Tenant-ID` → BE valida JWT vía `luana-core-iam`) y un **smoke Playwright verde** que prueba el loop. Es el blocker [1] de todo R0: sin este stack no hay dónde vivir el shell ni los agentes. Reusa la base madura de Vitalia re-temizada y **consume engine** (`iam`/`platform`/`observability`), sin recrear ni mirror.

## Decisiones de scope ratificadas (Chris 2026-05-29 · chris-input.md)

- **Alcance DONE = vertical slice completo + Clerk↔Playwright** (no infra pura). Incluye página raíz autenticada placeholder + smoke Playwright + creación de usuario(s) de prueba.
- **Clerk↔Playwright:** reusar la solución **reciente en disco** del worktree `../luana-vitalia` (no el branch). Pattern canónico: `clerk.setup.ts` (ticket strategy + freshness gate + retry) + `auth.fixture.ts` (testing-token re-inject) + `seed_test_users_link.py` (IAM tenants/users + `--clerk-sync`, **NO Clerk Organizations**, idempotente). El header de `clerk.setup.ts` de Vitalia indica que el pattern **nació en nicolify legacy** y Vitalia lo refinó → lo traemos de vuelta refinado.
- **Alembic = cauteloso (shallow):** solo wiring `env.py` + `alembic stamp head` sobre el esquema de **engine** (`luana-core-iam`/`platform`). **CERO tablas brand-local nicolify** en esta story — los modelos/campos no están definidos aún; nacen en sus stories de módulo.
- **DB `nicolify_dev`** se crea/asegura en esta story (postgres compartido :5435).
- **Clerk dev instance propia de Nicolify** (no compartir la de Vitalia). `nicolify/.env.dev` ya tiene los placeholders (`*.clerk.accounts.dev`, `dev-app.nicolify.com`). **Dependencia externa:** Chris crea la instancia Clerk dev + pega keys (1 vez).

## Estado de partida (skeleton post-reset 2026-05-29)

- BE: `nicolify/backend/src/main.py` solo (`/health` + `/` sin DTO). Sin `modules/nicolify/`, sin router IAM montado, sin `db.py`, sin alembic baseline wired.
- FE: `nicolify/frontend/src/app/{layout.tsx,page.tsx}` placeholder. Sin `ClerkProvider`, sin `middleware.ts`, sin `lib/api/fetchClient.ts`.
- Infra presente + correcta: `nicolify/config/brand.yaml` (puertos 8001/3001), `nicolify/docker-compose.dev.yml`, `nicolify/backend/Dockerfile`, `nicolify/.env.dev.template`.

## Prior art aplicado

| Reuse / consumo | Fuente | Cómo |
|---|---|---|
| Estructura `main.py` (redirect_slashes=False + `HealthResponse` DTO + `/health`+`/api/health` + mount IAM router) | `vitalia/backend/src/main.py` | Portar estructura re-temizada, NO mirror |
| Auth JWT + tenant resolution | `core/luana-core-iam` (`application/auth.py`, `api/routers/auth_router`) | CONSUMIR vía import. `CLERK_ISSUER` JWT verify |
| Tenants/users multi-tenant (NO Clerk Organizations) | `core/luana-core-iam` + `seed_test_users_link.py` (vitalia) | Adaptar seed a 1 demo tenant nicolify |
| Clerk↔Playwright setup + freshness + retry | `../luana-vitalia/vitalia/frontend/e2e/setup/clerk.setup.ts` + `e2e/auth.fixture.ts` | Portar refinado de vuelta a nicolify |
| `fetchClient` X-Tenant-ID auto-inject | `vitalia/frontend/src/lib/api/fetchClient.ts` | Portar re-temizado |
| Observabilidad / token metering | `core/luana-core-observability` | Wire opt-in (brand.yaml ya `token_metering: true`) — sin emitir aún |

---

## Acceptance Criteria (Gherkin AI-resistant)

### Scenario 1 — `stack-up-green` (`type: happy`)

**Given:**
- `nicolify/.env.dev` poblado (DB + Clerk keys reales de la instancia dev nicolify).
- Postgres compartido dev arriba (`:5435`), DB `nicolify_dev` creada/asegurada.

**When:**
- Se ejecuta `make dev-nicolify`.

**Then:**
- Contenedores `luana-nicolify-backend-dev` + `luana-nicolify-frontend-dev` quedan `running` + `healthy`.
- `curl http://127.0.0.1:8001/health` → `200` con `{status:"ok", brand:"nicolify", version:"..."}` (DTO `HealthResponse`, `response_model=`).
- `curl http://127.0.0.1:8001/api/health` → `200` (mismo payload — usado por Clerk middleware allowlist + smoke).
- `curl http://127.0.0.1:3001` → `200` (FE bootea).
- `docker exec luana-nicolify-backend-dev alembic upgrade head` → sin error (baseline aplica).

**playwright_required:** false
**Graders:**
- { type: shell, cmd: "curl -fsS http://127.0.0.1:8001/health | grep '\"brand\":\"nicolify\"'" }
- { type: shell, cmd: "curl -fsS http://127.0.0.1:8001/api/health" }
- { type: shell, cmd: "curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:3001 | grep 200" }
- { type: shell, cmd: "docker exec luana-nicolify-backend-dev alembic upgrade head" }
- { type: contract_test, path: "nicolify/backend/tests/architecture/test_main_app_config.py", function: "test_redirect_slashes_false + test_health_has_response_model" }

---

### Scenario 2 — `protected-route-requires-auth` (`type: negative`)

**Given:**
- Stack arriba. Existe al menos 1 ruta BE protegida (ej. el router IAM `/api/v1/iam/users/me`) + la ruta FE root `/` está detrás de Clerk middleware.

**When:**
- Se hace `GET /api/v1/iam/users/me` **sin** header `Authorization` / JWT válido.
- Un browser sin sesión navega a `/`.

**Then:**
- BE responde `401 Unauthorized` (no `500`, no leak de stack trace).
- FE redirige a `/sign-in` (Clerk middleware), no renderiza el root.
- `/health`, `/api/health`, `/sign-in`, `/sign-up` permanecen públicos (allowlist).

**playwright_required:** true
**Graders:**
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/test_auth_gate.py", function: "test_me_without_jwt_401" }
- { type: e2e, path: "nicolify/frontend/e2e/auth/protected-redirect.spec.ts", function: "test_root_redirects_to_signin_when_anon" }

---

### Scenario 3 — `migration-idempotency` (`type: edge`)

**Given:**
- Stack arriba, `alembic upgrade head` ya aplicado una vez.

**When:**
- Se ejecuta `alembic upgrade head` **una segunda vez**.
- Se re-ejecuta el seed `seed_test_users_link.py` (nicolify) **dos veces**.

**Then:**
- Segundo `upgrade head` → no-op limpio (sin error, sin duplicar objetos). Migraciones idempotentes (`IF NOT EXISTS` / stamp).
- Seed re-run → `ON CONFLICT DO NOTHING/UPDATE`: 1 sola fila por tenant/user, sin duplicados (idempotente).

**playwright_required:** false
**Graders:**
- { type: shell, cmd: "docker exec luana-nicolify-backend-dev bash -c 'alembic upgrade head && alembic upgrade head'" }
- { type: state_check, target: db, query: "SELECT count(*) FROM users WHERE clerk_id IS NOT NULL AND email LIKE '%@nicolify%'", expect: "estable tras 2 corridas (sin crecer)" }
- { type: contract_test, path: "nicolify/backend/tests/architecture/test_migrations_idempotent.py" }

---

### Scenario 4 — `cross-tenant-isolation` (`type: adversarial`)

> AI-resistant: tenant cross-leak + secrets + JWT forjado.

**Given:**
- Stack arriba. Tenant demo nicolify `T_DEMO` seedeado. Usuario de prueba ligado SOLO a `T_DEMO`.

**When:**
- Se hace una request autenticada (JWT válido del user demo) pero con header `X-Tenant-ID` apuntando a un **tenant ajeno** (`T_OTRO`).
- Se intenta leer un secreto (`/health` no debe exponer env vars; OpenAPI no debe filtrar `CLERK_SECRET_KEY`/`DATABASE_URL`).

**Then:**
- BE rechaza la request con tenant ajeno → `403` (el binding tenant viene del JWT/`user_tenants`, no se confía en el header solo). Sin leak de datos de `T_OTRO`.
- Ninguna respuesta expone secrets ni stack traces. `/docs` no lista valores de env.
- (Si aplica) audit row del intento.

**playwright_required:** false
**Graders:**
- { type: contract_test, path: "nicolify/backend/tests/modules/nicolify/test_tenant_isolation.py", function: "test_foreign_tenant_header_rejected" }
- { type: contract_test, path: "nicolify/backend/tests/architecture/test_no_secret_leak.py", function: "test_health_and_openapi_no_secrets" }

---

## ★ Sub-categorías mandatory aplicables

### Scenario 5 — `auth-vertical-slice` (`type: edge`, sub: integration_point)

> El corazón del DONE option-C: el loop de auth completo end-to-end.

**Given:**
- Stack arriba. Clerk dev instance nicolify configurada. Usuario de prueba `owner.demo@nicolify.com` creado en Clerk (`--clerk-sync`) + ligado a `T_DEMO` en `user_tenants` (role owner) + `publicMetadata.{role, tenant_id}` seteado.

**When:**
- El usuario inicia sesión vía Clerk (programático en tests: `clerk.signIn` ticket strategy) y navega a `/`.
- El FE hace una llamada autenticada al BE vía `fetchClient`.

**Then:**
- Root `/` renderiza la página placeholder autenticada del tenant (no redirige a `/sign-in`).
- `fetchClient` inyecta automáticamente `X-Tenant-ID` (de Clerk `publicMetadata.tenant_id`) + `Authorization: Bearer <jwt>`.
- BE valida el JWT vía `luana-core-iam` (`CLERK_ISSUER`) y resuelve el tenant → `200`.
- `GET /api/v1/iam/users/me` con el JWT del demo → `200` con el user correcto.

**playwright_required:** true
**Graders:**
- { type: e2e, path: "nicolify/frontend/e2e/auth/auth-slice.spec.ts", function: "test_signin_then_authenticated_root_and_me" }
- { type: state_check, target: network, expect: "request a BE lleva header X-Tenant-ID == T_DEMO" }

---

### Scenario 6 — `smoke-green` (`type: edge`, sub: ci_readiness)

**Given:**
- Stack arriba en `:3001`. Clerk E2E env vars presentes (`E2E_CLERK_USER_EMAIL/PASSWORD`, `E2E_TENANT_ID`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).

**When:**
- Se corre `cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke`.

**Then:**
- Project `setup` (`clerk.setup.ts`) autentica + guarda `playwright/.clerk/user.json` (freshness gate 4h, retry 2x). 
- Project `smoke` corre verde: (a) `/health` reachable, (b) root autenticado renderiza con `storageState`.
- `auth.fixture.ts` re-inyecta testing token por spec (no import directo de `@playwright/test` en specs autenticados).

**playwright_required:** true
**Graders:**
- { type: shell, cmd: "cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke" }
- { type: e2e, path: "nicolify/frontend/e2e/setup/clerk.setup.ts" }

`not_applicable_reason (race-condition / concurrent-users): N/A — story infra/auth, sin create/update de recurso con unique constraint ni list multi-tenant todavía (nacen en stories de módulo).`

---

### Scenario 7 — `fe-network-failure` (`type: edge`, sub: network_failure)

**Given:**
- Usuario autenticado en root `/`.

**When:**
- La llamada del `fetchClient` al BE falla (`500`/`503`/timeout).

**Then:**
- El root no crashea (no white-screen). Muestra estado de error legible en **español neutro (tuteo)** ("No pudimos conectar con el servidor. Reintenta en unos segundos.").
- El error se loguea (consola), no se traga silenciosamente.

**playwright_required:** true
**Graders:**
- { type: e2e, path: "nicolify/frontend/e2e/auth/root-network-failure.spec.ts", function: "test_root_handles_be_500_gracefully" }

---

## Out of scope (esta story)

- Tablas brand-local nicolify (`nicolify_*`) — Alembic shallow, modelos no definidos (Chris: "sé precavido").
- Cualquier UI del shell (TopBar, Ribbon, Luana chat) → stories `nicolify-r0-{topbar,shell-layout-splitter,luana-chat,ribbon-subtabs,routing-empty-states}`.
- Lógica de agentes (Luana/Abel/Brenda/Christian/Norvil).
- Token metering activo / cost recording emitido (solo se deja wired el package).
- Visual goldens (no hay componentes de marca aún → tras `nicolify-r0-design-system-tokens`).

## Dependencias / pre-condiciones

- **Externa (Chris):** crear Clerk dev instance Nicolify + pegar keys en `nicolify/.env.dev` + (vía seed `--clerk-sync`) crear el/los usuario(s) de prueba. Sin esto, los scenarios de auth (2,5,6,7) no corren.
- Postgres compartido dev (`:5435`) arriba.

## Decisiones ratificadas (Chris 2026-05-29)

- **cap_target** = `platform/nicolify-brand-runtime-foundation` · `cap_change_type: new`. ✓
- **Usuario de prueba** = **1 owner demo** (`owner.demo@nicolify.com`, role `owner`) sobre el tenant demo. La matriz por tier (Básico/Pro/Enterprise) se difiere a la story de tier-gating/billing. ✓
- **Tenant demo** = nombre **"Agencia Demo"** · slug `agencia-demo` · moneda `PEN` · país `PE` (mercado base Perú). ✓ → el seed `seed_test_users_link.py` (nicolify) crea este tenant + el owner demo + `user_tenants(role=owner)` + (con `--clerk-sync`) el usuario Clerk con `publicMetadata.{role:"owner", tenant_id:<T_DEMO>}`. `E2E_TENANT_ID` = uuid5 determinístico de `agencia-demo`.
