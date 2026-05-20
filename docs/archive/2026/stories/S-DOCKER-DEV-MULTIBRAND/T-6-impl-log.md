---
ticket: T-6
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-6 impl log — Makefile raíz

## Deliverables completados

**MODIFY `Makefile` (raíz)** — reescrito para incluir todos los targets de dev multibrand, preservando los targets de ci-parity existentes (BRANDS, ci-parity-%, portfolio, scan-promotables).

## Targets agregados

| Target | Descripcion |
|---|---|
| `dev-{brand}` × 4 | Levanta brand-specific compose + shared compose |
| `dev-{brand}-tunnel` × 4 | Idem + profile=tunnel (cloudflared) |
| `dev-all` | Levanta las 4 brands simultaneamente |
| `dev-all-vector` | Levanta las 4 brands + qdrant (profile=vector) |
| `dev-all-cache` | Levanta las 4 brands + redis (profile=cache) |
| `dev-down-{brand}` × 4 | Para brand-specific containers |
| `dev-down-all` | Para todas las brands |
| `dev-clean-{brand}` × 4 | Para + elimina volumes brand |
| `dev-clean-all` | Para + elimina todos los volumes |
| `infra-matrix` | Regenera INFRA-MATRIX.md |
| `install-hooks` | Instala git hooks (pre-commit) |

## Targets preservados

- `ci-parity` / `ci-parity-%` (con BRANDS ahora expandido a las 4 brands)
- `portfolio` / `portfolio-check`
- `scan-promotables`
- `help` (expandido con nuevos targets)

## Notas

- COMPOSE_BASE variable centraliza `-f docker-compose.dev.yml` para no repetir.
- Todos los targets están en `.PHONY`.
- `make dev-all` usa multi-line compose (4 -f flags) para compatibilidad con docker compose v2.
- `install-hooks` crea symlink `.git/hooks/pre-commit → scripts/git-hooks/pre-commit`.
