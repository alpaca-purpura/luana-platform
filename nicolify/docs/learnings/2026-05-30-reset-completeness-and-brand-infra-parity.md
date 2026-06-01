---
brand: nicolify
date: 2026-05-30
slug: reset-completeness-and-brand-infra-parity
promotable: candidate
applies_to_other_brands_potentially: [saasora, inmoflow, retailly, fixia, guestly, fitflow]
target_core_package: n/a (process + infra pattern)
ratified_by: chris
tags: [reset, scaffold, uv-workspace, docker, dev-stack, bootstrap, cruft]
---

# Reset completeness + brand infra parity (dev-stack)

## Contexto
Al levantar el dev-stack de Nicolify (post reset a esqueleto) el backend crash-loopeaba y `pytest tests/` no coleccionaba. Causa: el reset (be4deb44) reseteó `src/` a esqueleto pero **dejó intacto el resto del monolito legacy** (243 tests + 42 scripts + snapshot alembic 115 tablas + 105 archivos e2e) + el scaffold infra 2026-05-15 nunca estuvo wired para arrancar.

## Aprendizaje

### A. "Reset a esqueleto" debe purgar TODO lo que referencie código eliminado
Un reset que sólo toca `src/` deja cruft que rompe gates: tests que importan `src.modules.*` inexistentes, scripts legacy, migraciones snapshot, e2e de features que ya no existen. **Completar el reset = `git rm` de todo lo que importe el código purgado** (preservado en branch `legacy/{brand}-original`). Verificar con `pytest tests/ --collect-only` (debe coleccionar limpio).

### B. Paridad de infra brand para que `uv run` arranque en Docker
Para que `make dev-{brand}` levante verde, el brand necesita (paridad con vitalia):
1. `{brand}/pyproject.toml` (workspace member) declara las deps runtime+engine reales (uvicorn, sqlalchemy, asyncpg, alembic, luana-core-*) — NO `dependencies = []`. `bypass-selection = true` si no hay `{brand}/src/`.
2. `{brand}/backend/pyproject.toml` necesita `[project]` table (uv run lo exige) con `name` == el member.
3. `{brand}/backend/Dockerfile` dev target: `COPY {brand}/pyproject.toml` (el member!) + `uv sync --no-dev --package luana-{brand}`. Sin copiar el member → venv sin uvicorn.
4. `{brand}/docker-compose.dev.yml`: `UV_PROJECT_ENVIRONMENT: "/workspace/.venv"` + comando con binarios del venv root directos (`/workspace/.venv/bin/uvicorn`) — `uv run` desde `{brand}/backend` poda el venv.
5. `.env.dev` debe tener TODAS las vars del failfast de `luana_core_platform` Settings (POSTGRES_*, QDRANT_URL, WHATSAPP_*, API_URL, LOG_LEVEL, DOMAIN_NAME, TRAEFIK_NETWORK, API_SECRET_KEY).

## Aplicación práctica
- **Cuándo aplica:** bootstrap de cualquier brand nueva (saasora/inmoflow/…) o reset de una existente.
- **Cómo aplica:** seguir el checklist B verbatim + completar reset (A) en el mismo PR de bootstrap.
- **Cuándo NO aplica:** brands ya verdes (vitalia/comunify) que no se resetean.

## Referencias
- Story: nicolify/docs/archive/2026/stories/nicolify-r0-dev-stack/
- Patrón fuente: vitalia/{pyproject.toml, backend/pyproject.toml, backend/Dockerfile, docker-compose.dev.yml}
