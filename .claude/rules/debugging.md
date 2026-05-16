---
globs: "**/*"
description: Luana platform debug commands + error patterns (multibrand)
---

# Debugging

Docker-compose ahora **per-brand** (post 2026-05-15 reorg, S-DOCKER-DEV-MULTIBRAND). Stack: `make dev-{brand}` o `make dev-all`.

## Diagnóstico

Containers naming convention: `luana-{brand}-{service}-dev` (ej: `luana-nicolify-backend-dev`, `luana-vitalia-frontend-dev`).

```bash
WS=$(git rev-parse --show-toplevel)
BRAND=nicolify   # o vitalia/comunify/lupulo

# BE logs
docker logs luana-${BRAND}-backend-dev --tail 100
docker logs luana-${BRAND}-backend-dev --tail 200 2>&1 | grep -iE 'error|traceback|exception'

# FE logs
docker logs luana-${BRAND}-frontend-dev --tail 100

# Health stack per brand
docker compose -f ${WS}/${BRAND}/docker-compose.dev.yml ps

# Migration (per brand alembic config)
docker exec -t luana-${BRAND}-backend-dev bash -c "cd /app && alembic current"
```

- TSC/lint/tests: ver CLAUDE.md (native, `${WS}/.venv/bin/...` o `npx`).

**Legacy containers** `visionarias_brain_dev` / `visionarias_client_dev` ya no existen — eran single-brand pre-reorg.

## Top patterns (~80% bugs)
1. Missing `tenant_id` filter → empty/cross-tenant leak
2. SA 1.x `session.query()` → debe `select(Model).where(...)`
3. Docker volume stale → `docker compose -f ${WS}/${BRAND}/docker-compose.dev.yml up -d --build <svc>`
4. Migration no aplicada → `alembic current` vs `history` (per-brand)
5. Clerk token expired → 401
6. Cross-module import → viola DDD (o cross-brand mirror — ver `anti-duplication.md`)
7. Next.js build (standalone + Pages Router 404) — pre-existing
8. ETL credential expiry (Meta/GA4)
9. Missing env var (silencioso) — verify `{brand}/.env.dev` vs `{brand}/docker-compose.dev.yml`
10. Qdrant unavailable → vector search falla silencioso
11. Wrong brand port: nicolify=8001/3001, vitalia=8002/3002, comunify=8003/3003, lupulo=8004/3004
12. Engine package not editable in venv → `cd ${WS} && uv sync` desde root (NUNCA dentro de `{brand}/backend/`)

## Fix Quality
Root cause only. Leave file better (cleanup tech debt mismo file). No new debt (TODO/HACK/`any`/disabled lint). Verify native antes claim. Una hipótesis por fix. **Regression test FIRST** (RED reproduce bug → fix GREEN).

## Multibrand awareness (post reorg 2026-05-15)

- Stack levantado per brand via `make dev-{brand}` (postgres compartido 127.0.0.1:5435 + backend+frontend brand-specific).
- Engine bugs (`core/luana-core-*/`) afectan a **todas** las brands consumer — reproducir en cada brand activa.
- Brand-specific bug → solo afecta `{brand}/backend/` o `{brand}/frontend/`.
- Runbook completo: `docs/process/docker-dev-multibrand.md`.
