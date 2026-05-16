---
ticket: T-5
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-5 impl log — Audit + ajuste nicolify Dockerfiles

## Accion

Audit de nicolify/{backend,frontend}/Dockerfile para alinear con patron uv-workspace (D4).
Findings documentados en T-5-result.md.

## Cambios aplicados

### nicolify/backend/Dockerfile

- REWRITE completo: pip+/opt/venv → uv sync --frozen
- Agregado target `dev` con hot-reload (D4)
- Python 3.11 → 3.12
- Puerto 8000 → 8001 (D6)
- WORKDIR /workspace/nicolify/backend

### nicolify/frontend/Dockerfile

- REWRITE completo: npm+Node22 → pnpm 9.15.9+Node20
- Puerto 3000 → 3001 (D6)
- Target dev alineado con patron vitalia/comunify
- HEALTHCHECK agregado en target final
- e2e target mantenido para CI existente

## Ver T-5-result.md para findings completos y riesgos.
