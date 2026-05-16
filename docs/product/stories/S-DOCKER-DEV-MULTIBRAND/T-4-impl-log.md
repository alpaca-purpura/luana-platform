---
ticket: T-4
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-4 impl log — Dockerfiles faltantes: vitalia + comunify + lupulo

## Deliverables completados

1. **NEW `vitalia/backend/Dockerfile`** — targets: dev (uv, hot-reload bind mount) + final (prod, usuario appuser, HEALTHCHECK). Puerto 8002. Build context raiz monorepo (accede a core/).

2. **NEW `vitalia/frontend/Dockerfile`** — targets: dev (pnpm 9.15.9, bind mount) + builder + final (Next.js standalone). Puerto 3002. Filter `@luana/vitalia-web`.

3. **NEW `comunify/backend/Dockerfile`** — idem patron vitalia. Puerto 8003. Package `luana-comunify-backend`.

4. **NEW `comunify/frontend/Dockerfile`** — idem patron vitalia. Puerto 3003. Filter `@luana/comunify-web`.

5. **NEW `lupulo/backend/Dockerfile`** — placeholder minimo. Usa `src/main_placeholder.py` (FastAPI + /health). Puerto 8004. Sin workspace uv (lupulo no es workspace member aun).

6. **NEW `lupulo/frontend/Dockerfile`** — placeholder minimo con Next.js. Puerto 3004. Sin pnpm-workspace filter (package standalone).

7. **NEW `lupulo/backend/src/main_placeholder.py`** — FastAPI app minima con `/health` y `/` routes. Primer codigo de lupulo.

8. **NEW `lupulo/backend/pyproject.toml`** — dependencias minimas (fastapi, uvicorn, starlette).

9. **NEW `lupulo/frontend/package.json`** — Next.js 15 placeholder.

10. **NEW `lupulo/frontend/src/app/page.tsx`** + `layout.tsx` — Next.js App Router placeholder.

11. **NEW `lupulo/frontend/next.config.js`** — output: standalone para produccion.

12. **NEW `lupulo/frontend/tsconfig.json`** — TypeScript strict config.

## Decisiones aplicadas

- D4: Hot-reload via bind mount source + anonymous volume .venv (vitalia, comunify)
- Build context = `.` (raiz monorepo) para vitalia y comunify (acceso a core/)
- Lupulo: Dockerfile standalone porque lupulo/backend no es workspace member uv aun
- F5: target dev funcional incluso para placeholders lupulo (no comentado)
- F8: lupulo Dockerfiles usan src que existe (main_placeholder.py) — no referencias rotas
- HEALTHCHECK en todos los targets final

## Notas

- `uv sync --frozen --no-dev --package luana-vitalia`: el nombre del package viene de `vitalia/backend/pyproject.toml::project.name`.
- `uv sync --frozen --no-dev --package luana-comunify-backend`: idem para comunify.
- lupulo/backend usa `uv pip install --system` en lugar de workspace uv sync porque lupulo no esta en `pyproject.toml` raiz `[tool.uv.workspace]` aun (Story 13 lo agrega).
- pnpm filter usa nombre de package: `@luana/vitalia-web` y `@luana/comunify-web`.
