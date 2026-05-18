---
story_id: comunify-dev-stack-functional
outcome: dev-stack-cross-brand-fixes              # consumer outcome platform (docs/product/outcomes/)
state: done                                       # 2026-05-17T20:15Z transition refining→done (hotfix track skip cadena ready/developing/etc)
phase: MERGED
last_artifact: 07-merge.md
last_modified: 2026-05-17T20:15:00Z
next_action: "Archived. Brand retoma comunify-design-system-cement."
ratified_by_chris: true                          # implicit — Chris invocó cierre con Playwright smoke como gate
spawned_at: 2026-05-17T18:00:00Z
spawned_by: /pm-luana                            # cross-skill override autorizado Chris sesión auditoría harness 2026-05-17
merged_at: 2026-05-17T20:15:00Z
merged_by: /pm-comunify
parallel_safe: true
blocked_reason: null
audit_iterations: 0
hotfix_metadata:
  repro_verified: true                           # repro live 2026-05-17T19:30: bugs 1-13 confirmados estructuralmente + bugs 14-15 descubiertos durante ejecución (named volume staleness + Playwright runner gap)
  repro_command: "make dev-comunify && docker logs luana-dev-comunify_backend_dev-1 (reproduce bug 14 crash loop)"
  diagnosis_validates_handoff: true              # receta vitalia mecánicamente replicada + 2 addenda nuevos
  smoke_verified: true                           # Playwright 3/3 GREEN 2026-05-17T20:10 — `e2e/specs/smoke/dev-stack.smoke.spec.ts`
canonical_recipe: vitalia/docs/archive/2026/stories/vitalia-dev-stack-functional/07-merge.md  # 12 pasos no rompibles + addendum bugs 14-15 cementado en este 07-merge.md
---

# comunify-dev-stack-functional — checkpoint

## Goal

Dejar la stack `comunify` levantable end-to-end vía `make dev-comunify-tunnel` con dominio público `https://dev-app.comunifyagents.com/` sirviendo:
- Frontend Next.js renderizando home + login Clerk (instance `climbing-lioness-56`)
- Backend FastAPI respondiendo `/health` + endpoints comunify montados (puerto 8003)
- Postgres `luana_postgres_dev` saludable + DB `comunify_dev` con migrations aplicadas
- Tunnel Cloudflare conectando 4 edges sin reconnect loops

## Contexto

Story 12 (`luana-comunify-bootstrap`, shipped 2026-05-15) entregó código comunify completo (102 BE tests pasando, 17 capabilities en 11 módulos), pero la **stack de dev local NUNCA se validó end-to-end**. Auditoría `/pm-luana` 2026-05-17 (harness comunify) detectó gaps exactos a los que vitalia descubrió 2026-05-16/17 y resolvió con receta de 12 pasos en `vitalia-dev-stack-functional`.

**Pre-repro (gaps estructurales detectados por inspección estática):**

| # | Bug esperado | Evidence inspección |
|---|---|---|
| 1 | FE `next: not found` (named volume shadow) | `comunify/docker-compose.dev.yml` ya tiene fix C inline (`/app/comunify/frontend/node_modules` anonymous) — debería NO reproducir |
| 2 | BE `.venv` incompatible | `comunify/docker-compose.dev.yml` ya tiene fix C inline (`comunify_backend_venv:/workspace/.venv`) — debería NO reproducir |
| 3 | DB `comunify_dev` no auto-creada | Verificar root `docker-compose.dev.yml` init.sql crea comunify_dev (per paso 10 vitalia) |
| 4 | Migrations no aplicadas first start | `comunify/docker-compose.dev.yml` BE service `command:` NO tiene `uv run alembic upgrade head &&` prefix — REPRODUCIRÁ |
| 5 | Clerk authorized origin | `dev-app.comunifyagents.com` ya en allowed list (confirmado 2026-05-16 22:30 verification — 200 OK al sign-in) |
| 6 | `.env.dev` placeholders | Ya rellenado 2026-05-16 (Clerk values + `CLERK_ISSUER`) |
| 7 | `/health` endpoint 404 | Verificar `comunify/backend/src/main.py` registra `GET /health` con `response_model=HealthResponse` |
| 8 | `alembic.ini` localhost | Verificar `comunify/backend/alembic/env.py` lee `DATABASE_URL` env + `asyncpg→psycopg2` swap |

**Bugs estructurales adicionales detectados en inspección (NO presentes en vitalia post-fix):**

| # | Bug | Evidence |
|---|---|---|
| 9 | `comunify/pyproject.toml` minimal — `dependencies = []` | Falta uvicorn/fastapi/sqlalchemy/asyncpg/alembic/luana_core_* (paso 6 receta vitalia) |
| 10 | `comunify/backend/Dockerfile` NO COPY `comunify/pyproject.toml` | Solo COPY `comunify/backend/pyproject.toml` (paso 4 receta — falta workspace stub) |
| 11 | Dockerfile `uv sync --frozen --no-dev` sin `--package luana-comunify` | Falla silenciosa per paso 5 receta |
| 12 | `docker-compose.dev.yml` BE env falta `UV_PROJECT_ENVIRONMENT=/workspace/.venv` | Paso 3 receta |
| 13 | `docker-compose.dev.yml` BE command sin `cd /workspace/comunify/backend &&` prefix | Paso 7 receta |

## Out of scope (no tocar este story)

- Cualquier feature funcional comunify nueva (este story solo fix bootstrap dev stack)
- HIPAA-hardening (compliance_level=creator_economy NOT hipaa_lite per D7)
- Voice cloning pipeline runtime (shipped Story 12, NO scope acá)
- Community moderation pipeline runtime (shipped Story 12, NO scope acá)
- Production deploy (cloudflared prod tunnel + K8s deploy)

## Plan ejecución (12 pasos vitalia receta — adaptados a comunify)

1. `comunify/.env.dev` Clerk values + `CLERK_ISSUER` (✅ ya rellenado 2026-05-16)
2. Compose volumes `comunify_backend_venv:/workspace/.venv` + `./comunify/frontend:/app/comunify/frontend:rw` + `/app/comunify/frontend/node_modules` anonymous (✅ ya aplicado fixes C+D)
3. Compose env BE: `UV_PROJECT_ENVIRONMENT=/workspace/.venv` (❌ FALTA — bug 12)
4. Dockerfile backend: COPY `comunify/pyproject.toml` además `comunify/backend/pyproject.toml` (❌ FALTA — bug 10)
5. Dockerfile backend: `RUN uv sync --no-dev --package luana-comunify` (❌ FALTA — bug 11)
6. `comunify/pyproject.toml`: agregar deps runtime (❌ FALTA — bug 9)
7. Compose BE `command:` `sh -c "cd /workspace/comunify/backend && uv run alembic upgrade head && uv run uvicorn src.main:app ..."` (❌ FALTA — bugs 4+13)
8. `comunify/backend/alembic/env.py` lee `DATABASE_URL` env con `asyncpg→psycopg2` swap (verificar — bug 8)
9. `comunify/backend/src/main.py` registra `GET /health` con `response_model=HealthResponse` (verificar — bug 7)
10. Postgres root init.sql crea `comunify_dev` (verificar — bug 3)
11. `comunify/deploy/cloudflared/dev-config.yml` + credentials JSON (✅ confirmado 2026-05-16 — tunnel funcional)
12. Clerk tenant `dev-app.comunifyagents.com` (✅ confirmado 2026-05-16 — sign-in 200 OK)

**Patches concretos:** ver `00-research.md` (diff por archivo).

## Bitácora

- 2026-05-17T18:00: story creada por `/pm-luana` modo Portfolio (cross-skill override autorizado Chris) tras auditoría harness comunify detectó gaps estructurales 9-13 + esperar reproducción runtime gaps 4+7+8 (vitalia ya cementó receta — comunify aplica mecánicamente)
- Pendiente: Chris ratifica scope + `/dev-team` (o cross-skill override) aplica patches 3-10 + smoke verification + cierre directo refining→done (hotfix track per `.claude/rules/hotfix-repro-mandatory.md`)
