---
slug: dev-environment-multibrand
kind: outcome
brand: vitalia
status: in_progress
created: 2026-05-17
last_updated: 2026-05-17
owner: /pm-vitalia
consumes_platform_outcome: docs/product/outcomes/dev-stack-cross-brand-fixes.md
story_ids:
  - vitalia-dev-stack-functional
priority: HIGH
why_now: |
  Story 11 (luana-vitalia-bootstrap) shipped código vitalia completo 2026-05-15 pero
  la stack dev local nunca se validó end-to-end. Sin ambiente dev operativo no se
  pueden iterar features vitalia (Story 11.bis HIPAA hardening, multi-site UI,
  insurance integration, etc.). Bloquea TODO desarrollo brand-specific.
---

# Vitalia — dev-environment-multibrand

> Outcome brand-local. Consume + extiende el outcome platform [`docs/product/outcomes/dev-stack-cross-brand-fixes.md`](../../../../docs/product/outcomes/dev-stack-cross-brand-fixes.md) (`/pm-luana` owna lo cross-brand).

## Goal

Stack `vitalia` levantable end-to-end via `make dev-vitalia-tunnel` con:

- Frontend Next.js renderizando home + login Clerk en `https://dev-app.vitalialat.com/`
- Backend FastAPI respondiendo `/health` + 20 endpoints vitalia montados en port 8002
- Postgres `luana_postgres_dev` healthy + DB `vitalia_dev` con migrations aplicadas en startup
- Tunnel Cloudflare conectando 4 edges sin reconnect loops
- Hot-reload BE+FE funcional para iterar features sin restart manual

## Status — 2026-05-17

**STACK OPERATIVA END-TO-END** (validada 2026-05-17 03:50 + re-verificada 2026-05-17 mañana):

- ✅ 4 containers UP healthy (postgres + backend + frontend + cloudflared, uptime >1h sostenido)
- ✅ Frontend Next 200 sobre `https://dev-app.vitalialat.com/sign-in` con Clerk widget operativo
- ✅ Backend OpenAPI 200 con 20 endpoints vitalia registrados (bookings, medical-compliance, offer, onboarding, patients, treatments)
- ✅ Tunnel CF 200 con 4 conexiones edges estables
- ✅ DBs creadas en postgres compartido: `vitalia_dev`, `nicolify_dev`, `comunify_dev`, `lupulo_dev`
- ✅ `.env.dev` con valores reales (Clerk + OpenAI), sin placeholders
- ✅ Tenant isolation verificado (`/api/v1/vitalia/treatments` → 422 missing X-Tenant-ID)
- ✅ Memoria healthy: BE 10%/1G, FE 68%/1G — sin OOM

**Gaps residuales (issues 7+8 sumados a story por diagnóstico /pm-luana 2026-05-17):**

- 🔴 Issue 7 — `/health` endpoint 404 (4 paths probados sin éxito). Rompe smoke check CLAUDE.md + healthcheck Docker. Surface: `vitalia/backend/src/main.py`.
- 🔴 Issue 8 — `alembic current` desde container falla con `localhost:5432 connection refused`. `alembic.ini` apunta a localhost en lugar de `luana_postgres_dev`. Migrations no auto-aplicadas en startup (issue #4 original sigue abierto). Surface: `vitalia/backend/alembic.ini` + entrypoint Docker.

## Stories

| Story | State | Notas |
|---|---|---|
| [`vitalia-dev-stack-functional`](../stories/vitalia-dev-stack-functional/checkpoint.md) | `refining` | Scope ampliado 2026-05-17 con issues 7+8. Próximo: aplicar fixes → re-validar → transition refining→refined |

## Cross-brand inheritance

La **receta cementada** en bitácora de `vitalia-dev-stack-functional/checkpoint.md` (líneas 67-94) es el patrón canónico para resolver bootstrap dev de cualquier brand. Aplica a:

- `nicolify` — pendiente extender receta (gaps tracked en outcome platform)
- `comunify` — pendiente extender receta (gaps tracked en outcome platform)
- `lupulo` — al bootstrap Story 13
- Brands futuras (saasora, inmoflow, retailly, fixia, guestly, fitflow) al bootstrap

Receta clave (resumen — detalle full en story bitácora):

1. `.env.dev` con Clerk values + `CLERK_ISSUER` + URLs sign-in/up reales
2. Volumes compose: `{brand}_backend_venv:/workspace/.venv` (no `/workspace/{brand}/backend/.venv`)
3. `UV_PROJECT_ENVIRONMENT=/workspace/.venv` env force uv usar venv workspace root
4. Dockerfile BE: COPY `{brand}/pyproject.toml` + `{brand}/backend/pyproject.toml` (workspace stub + module deps)
5. `RUN uv sync --no-dev --package luana-{brand}` (no `--frozen` que falla silencioso)
6. `{brand}/pyproject.toml` con deps runtime (uvicorn, sqlalchemy, asyncpg, alembic, luana_core_*)
7. Frontend volumes: bind `./{brand}/frontend:/app/{brand}/frontend:rw` + anonymous volume para `/app/{brand}/frontend/node_modules` (mask host symlinks pnpm)

## Gaps cross-brand documentados (escalados a `/pm-luana` platform outcome)

- Issue B platform — nicolify FE Dockerfile no COPY `core/@luana/*` (workaround bind-mount, rompe CI build prod)
- Issue A platform — gap uvicorn cross-brand (vitalia fixed, nicolify+comunify defer)
- vitalia/backend/ no es workspace member (subproyecto aislado) — solución estructural diferida
- vitalia/pyproject.toml hatch build target `bypass-selection = true` (vitalia/src/ no existe)

## Drill-down

- Story principal: `vitalia/docs/product/stories/vitalia-dev-stack-functional/checkpoint.md`
- Spec: `vitalia/docs/product/stories/vitalia-dev-stack-functional/01-spec.md`
- Outcome platform parent: `docs/product/outcomes/dev-stack-cross-brand-fixes.md` (`/pm-luana`)
- Runbook docker dev: `docs/process/docker-dev-multibrand.md`
- ADR base: `docs/architecture/luana-platform/ADR-003-docker-dev-multibrand.md`
