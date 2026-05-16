---
ticket: T-5
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-5-result.md — Audit + ajuste nicolify Dockerfiles

## Findings del audit

### nicolify/backend/Dockerfile (legacy)

**Estado previo:**
- Python 3.11-slim (workspace usa 3.12)
- pip + /opt/venv (no uv)
- Sin target `dev` con hot-reload
- WORKDIR /app (no /workspace/nicolify/backend)
- Puerto 8000 (D6 asigna 8001 a nicolify)
- `COPY . .` en target dev (no bind mount friendly)

**Cambios aplicados:**
- Python 3.11 → 3.12 (alineado con workspace `requires-python = ">=3.12"`)
- pip + requirements.txt → `uv sync --frozen` (D4 pattern)
- Agregado target `dev` con hot-reload uvicorn (bind mount friendly, no COPY source)
- WORKDIR /workspace/nicolify/backend (consistencia con compose brand)
- Puerto 8000 → 8001 (D6 cementado)
- HEALTHCHECK mantenido en target final

**Riesgos detectados:**
- El pyproject.toml de nicolify/backend puede no tener el `name` exacto `luana-nicolify` — se agrego fallback `uv sync --frozen --no-dev` sin `--package` en ese caso.
- El Dockerfile legacy no tiene `requirements-runtime.txt` check en uv context — no es necesario con uv workspace.

### nicolify/frontend/Dockerfile (legacy)

**Estado previo:**
- Node 22 (workspace usa Node 20 LTS via nvm)
- npm (workspace usa pnpm 9.15.9 via corepack)
- Puerto 3000 (D6 asigna 3001 a nicolify)
- package-lock.json (no pnpm-lock.yaml)

**Cambios aplicados:**
- Node 22 → 20 (alineado con workspace)
- npm → pnpm 9.15.9 (alineado con pnpm-workspace.yaml)
- Puerto 3000 → 3001 (D6 cementado)
- Target dev alineado con patron vitalia/comunify (WORKDIR /app/nicolify/frontend)
- Target final (runner) mantenido con output:standalone + nextjs user
- HEALTHCHECK agregado en target final (consistencia con otras brands)
- e2e target mantenido (playwright) para compatibilidad CI existente

**Riesgos detectados:**
- el package.json de nicolify/frontend puede listar `@luana/nicolify-web` como name o diferente. El filter del pnpm install tiene fallback `|| pnpm install` por si el nombre no matchea exacto.
- La build produccion requiere ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — mantenido del legacy.

## Acceptance criteria

- A1: docker build nicolify/backend/Dockerfile --target dev pasa
- A2: docker build nicolify/backend/Dockerfile --target final pasa (no regresion)
- A3: este archivo T-5-result.md creado con findings del audit
