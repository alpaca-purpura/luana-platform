---
story_id: comunify-dev-stack-functional
outcome: dev-stack-cross-brand-fixes              # platform outcome (docs/product/outcomes/), comunify consumer milestone
merged_at: 2026-05-17T20:15:00Z
merged_by: /pm-comunify
ratified_by_chris: true                           # implicit — Chris invocó cierre con Playwright smoke como gate
review_final_path: null                           # hotfix track — sin /auditor formal porque scope quirúrgico + smoke verde
shipped_commits:
  # patches 1-5 ya stagged en wip de sesión 2026-05-17 (comunify/pyproject.toml + Dockerfile + compose + main.py + alembic/env.py)
  # bug 14 (named volume staleness) fix runtime — no requirió code change, sí learning
  # bug 15 (Playwright runner gap) fix — package.json devDep + scripts mirroring nicolify pattern
state_transition: refining → done (skip refined/ready/developing/developed/reviewing — hotfix track + smoke_verified gate)
capability_yaml_written: false                    # infra/bootstrap, no surface user-facing tied a un módulo
adr_written: false                                # receta cementada en bitácora + outcome platform parent
canonical_recipe: vitalia/docs/archive/2026/stories/vitalia-dev-stack-functional/07-merge.md
---

# comunify-dev-stack-functional — merge

> Story de bootstrap dev-stack comunify. Cierre directo refining → done (skip cadena intermedia).
> Trabajo basado en receta canónica `vitalia-dev-stack-functional/07-merge.md` (12 pasos)
> + extensiones de receta (bugs 14-15 descubiertos durante replicación).

## Scope cerrado (8 bugs originales + 2 nuevos descubiertos)

### Bugs 1-13 originales (per checkpoint.md pre-repro)

| # | Issue | Fix shipped | Verificación live 2026-05-17T20:00 |
|---|---|---|---|
| 1 | FE `next: not found` (named volume shadow) | Fix C inline en compose (anonymous `node_modules`) ya aplicado pre-story | container `luana-dev-comunify_frontend_dev-1` Up · `curl 127.0.0.1:3003/sign-in → 200` |
| 2 | BE `.venv` incompatible | `UV_PROJECT_ENVIRONMENT=/workspace/.venv` + named volume `comunify_backend_venv:/workspace/.venv` (compose env paso 3) + Dockerfile `RUN uv sync --no-dev --package luana-comunify` | container Up healthy 8003 |
| 3 | DB `comunify_dev` no auto-creada | Root `scripts/postgres-init/01-create-databases.sh` ya crea las 4 DBs idempotente (verificado) | `\l` postgres lista `comunify_dev` |
| 4 | Migrations no aplicadas first start | Compose BE service `command: sh -c "cd /workspace/comunify/backend && uv run alembic upgrade head && uv run uvicorn src.main:app ..."` | `alembic_version.version_num = 001_comunify` (head) — 17 tables creadas |
| 5 | Clerk authorized origin | `dev-app.comunifyagents.com` ya en tenant Clerk `climbing-lioness-56` (manual dashboard pre-story, 2026-05-16) | FE `/sign-in` renderiza widget Clerk OK |
| 6 | `.env.dev` placeholders | Rellenado por Chris 2026-05-16 (Clerk values + `CLERK_ISSUER`) | Stack levanta sin loops |
| 7 | `/health` endpoint 404 | `comunify/backend/src/main.py` + `GET /health` con `HealthResponse` DTO (per arch test V-AE-2 response_model mandatory) | `curl 127.0.0.1:8003/health → 200 {"status":"ok","brand":"comunify","version":"0.1.0"}` |
| 8 | `alembic.ini` localhost | `comunify/backend/alembic/env.py` prioriza `DATABASE_URL` env del compose, convierte `asyncpg→psycopg2` driver sync | `alembic current → 001_comunify (head)` desde container |
| 9 | `comunify/pyproject.toml` minimal `dependencies = []` | Espejo vitalia: 5 deps base (uvicorn[standard], fastapi, python-multipart, starlette, structlog) + 3 persistence (sqlalchemy, asyncpg, alembic) + 5 luana-core-* (platform, observability, extension-sdk, channels, extraction) | container uv sync resuelve transitivamente `psycopg2-binary` desde luana-core-platform |
| 10 | `comunify/backend/Dockerfile` NO COPY `comunify/pyproject.toml` | COPY ambos (`comunify/pyproject.toml` + `comunify/backend/pyproject.toml`) per paso 4 receta vitalia | Build context sees workspace member stub con deps runtime |
| 11 | Dockerfile `uv sync --frozen --no-dev` sin `--package luana-comunify` | `RUN uv sync --no-dev --package luana-comunify` (sin `--frozen` per receta vitalia — uv regen lock dentro container) | Build sin warnings silenciosos |
| 12 | Compose BE env falta `UV_PROJECT_ENVIRONMENT=/workspace/.venv` | Agregado a `environment:` del service `comunify_backend_dev` | `uv run` desde `/workspace/comunify/backend` usa venv root |
| 13 | Compose BE command sin `cd /workspace/comunify/backend &&` prefix | Agregado al `sh -c` command (junto a alembic upgrade) | Uvicorn arranca con WORKDIR correcto |

### Bugs 14-15 nuevos (descubiertos durante repro live 2026-05-17T19:45)

| # | Bug | Síntoma | Fix | Verificación |
|---|---|---|---|---|
| **14** | **Named volume staleness post pyproject bump** | Volumen `comunify_backend_venv` creado en sesión previa (cuando `comunify/pyproject.toml::dependencies = []`) tenía `.venv` vacía sin `psycopg2-binary`. Docker NO repopula named volumes no-vacíos desde image's `/workspace/.venv` — el primer `make dev-comunify` post-fix bugs 9-13 mantuvo el venv stale. Backend crash loop: `ModuleNotFoundError: No module named 'psycopg2'` durante alembic upgrade | `docker compose rm -fsv comunify_backend_dev && docker volume rm comunify_backend_venv && docker compose up -d --build comunify_backend_dev` — volumen recreado vacío → Docker init populate desde image's venv que SÍ tiene psycopg2-binary transitivo | `curl 127.0.0.1:8003/health → 200` después del rebuild |
| **15** | **Playwright runner gap parity nicolify** | `comunify/frontend/package.json` declaraba script `test:e2e:smoke` + tenía `playwright.config.ts` + 5 specs `*.smoke.spec.ts` scaffolded — pero `@playwright/test` NUNCA fue agregado a `devDependencies`. Scripts referenciaban `npx playwright test` que fallaba `playwright: not found`. Vitalia tiene mismo gap (pendiente fix separado) | Add `@playwright/test ^1.59.1` a `devDependencies` + replicar scripts pattern nicolify (`test:e2e`, `test:e2e:smoke`, `test:e2e:report`, `test:e2e:ui`) — lockfile resolvió a `@playwright/test@1.60.0` ya pinned por nicolify (cero version drift) | `pnpm exec playwright --version → 1.60.0` |

## Verification gate (Playwright smoke verbatim 2026-05-17T20:10)

Reemplaza los 7 `curl` manuales del 00-research.md por suite Playwright reproducible. Path: `comunify/frontend/e2e/specs/smoke/dev-stack.smoke.spec.ts`.

```text
$ E2E_BASE_URL=http://127.0.0.1:3003 pnpm exec playwright test \
    e2e/specs/smoke/dev-stack.smoke.spec.ts --project=smoke --reporter=list

Running 3 tests using 3 workers

  ✓  2 [smoke] › dev-stack.smoke.spec.ts:24 › backend /health responde 200 con shape canonical (19ms)
  ✓  3 [smoke] › dev-stack.smoke.spec.ts:40 › frontend /sign-in renderiza 200 (next.js mount + Clerk widget area) (703ms)
  ✓  1 [smoke] › dev-stack.smoke.spec.ts:49 › frontend root / renderiza 200 (no crash inicial) (716ms)

  3 passed (2.5s)
```

Cobertura:
- **T1** `backend /health responde 200 con shape canonical` — valida bugs 4, 7, 8, 9-13, 14 (stack BE up + alembic head + psycopg2 transitive disponible + /health endpoint funcional)
- **T2** `frontend /sign-in renderiza 200` — valida bugs 1, 5, 6 (FE next dev OK + Clerk authorized origin + .env.dev rellenado)
- **T3** `frontend root / renderiza 200` — valida arranque sin crash inicial (no JS errors fatales)

DB tables verbatim:

```text
$ docker exec luana-dev-luana_postgres_dev-1 psql -U postgres -d comunify_dev \
    -c "SELECT version_num FROM alembic_version;"
 version_num
-------------
 001_comunify
(1 row)

$ docker exec luana-dev-luana_postgres_dev-1 psql -U postgres -d comunify_dev \
    -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
 tables
--------
     17
```

## Recetas no rompibles — addendum cross-brand (bugs 14-15)

Cuando se levante stack nicolify (pendiente — gap parity P14) o lupulo (story 13 pendiente):

### Recipe addendum paso 13 — Named volume re-population

Si modificás `{brand}/pyproject.toml` (deps runtime) post primer `make dev-{brand}` exitoso:

```bash
docker compose -f docker-compose.dev.yml -f {brand}/docker-compose.dev.yml stop {brand}_backend_dev
docker compose -f docker-compose.dev.yml -f {brand}/docker-compose.dev.yml rm -fsv {brand}_backend_dev
docker volume rm {brand}_backend_venv
docker compose -f docker-compose.dev.yml -f {brand}/docker-compose.dev.yml up -d --build {brand}_backend_dev
```

(NO uses `make dev-clean-{brand}` — nukea volumen postgres compartido + impacta sesiones paralelas de otras brands).

### Recipe addendum paso 14 — Playwright runner setup

Cada brand con `playwright.config.ts` debe declarar `@playwright/test ^1.59.1` en `devDependencies` + mirror scripts nicolify pattern:

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:smoke": "playwright test --project=smoke",
  "test:e2e:report": "playwright show-report --host 0.0.0.0",
  "test:e2e:ui": "playwright test --ui --ui-host 0.0.0.0"
}
```

Lockfile resuelve a versión ya pinned por nicolify (1.60.0 hoy) — cero drift cross-brand. Browser cache compartido `~/.cache/ms-playwright/` (instalable per-brand vía `pnpm exec playwright install chromium`).

## Cambios al producto

### `comunify/docs/product/checkpoint.md`

```diff
 active_stories:
   - id: comunify-design-system-cement
     state: idea
     surface: [frontend]
     opened: 2026-05-16
-  - id: comunify-dev-stack-functional        # spawned 2026-05-17 por /pm-luana cross-skill override (auditoría harness)
-    state: refining
-    surface: [backend, devops]
-    opened: 2026-05-17
```

### `comunify/docs/product/stories/comunify-dev-stack-functional/` → `comunify/docs/archive/2026/stories/comunify-dev-stack-functional/`

Snapshot inmutable archivado.

### `comunify/frontend/package.json` (bug 15 fix)

```diff
+    "test:e2e": "playwright test",
-    "test:e2e:smoke": "E2E_BASE_URL=http://localhost:3000 npx playwright test --project=smoke"
+    "test:e2e:smoke": "playwright test --project=smoke",
+    "test:e2e:report": "playwright show-report --host 0.0.0.0",
+    "test:e2e:ui": "playwright test --ui --ui-host 0.0.0.0"

   "devDependencies": {
     "@eslint/js": "^9.29.0",
+    "@playwright/test": "^1.59.1",
     "@testing-library/react": "^16.3.2",
```

### `comunify/frontend/e2e/specs/smoke/dev-stack.smoke.spec.ts` (nuevo)

3 tests Playwright cubriendo BE /health + FE /sign-in + FE root. Auth-less (no Clerk dependency — dev-stack gate). Total runtime 2.5s.

### Sin capability YAML

Trabajo es infra/bootstrap (dev-stack containers + tunnel + migrations + health endpoint + Playwright runner setup), no surface user-facing tied a un módulo del SSoT funcional. Receta cementada en este 07-merge.md + outcome platform parent `docs/product/outcomes/dev-stack-cross-brand-fixes.md`.

### Sin ADR

Decisiones técnicas son consecuencia de constraints uv workspace + pnpm + Docker bind mount semantics + Alembic env.py contract + Playwright pnpm hoisting. No hay tradeoff arquitectónico cross-cutting que justifique ADR — receta prescriptiva mecánica.

### Learning local (promotable=yes)

Escrito `comunify/docs/learnings/2026-05-17-named-volume-staleness-post-pyproject-bump.md` (bug 14 — pattern aplicable cross-brand, ping `/pm-luana` candidato addendum receta) y `comunify/docs/learnings/2026-05-17-playwright-runner-parity-gap.md` (bug 15 — vitalia tiene mismo gap, candidato para fix-forward sweep cross-brand).

## Gaps cross-brand pendientes (no scope esta story)

Documentados en outcome platform `docs/product/outcomes/dev-stack-cross-brand-fixes.md` (owner `/pm-luana`):

- **Nicolify dev-stack functional:** mismo bootstrap pendiente. Bugs 1-15 esperables (mismo patrón replicable mecánicamente). Ya tiene `@playwright/test` ✅.
- **Lupulo dev-stack functional:** story 13 pendiente bootstrap completo.
- **Vitalia gap bug 15:** Playwright runner NO instalado (mismo gap que comunify pre-fix). Fix-forward sweep candidato.
- **Tunnel CF (`make dev-comunify-tunnel`):** verificado 2026-05-16 (sign-in 200 OK vía `dev-app.comunifyagents.com`) — fuera scope esta story de smoke gate.

## Próximo paso

Outcome platform `dev-stack-cross-brand-fixes` permanece active hasta nicolify + lupulo cierren stories análogas. Brand comunify retoma camino crítico via `comunify-design-system-cement` (next: Chris dice "refinemos" → `/po-ux` para spec UI tokens brandbook).
