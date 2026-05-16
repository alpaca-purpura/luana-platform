---
ticket: T-2
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-2 impl log — {brand}/docker-compose.dev.yml × 4

## Deliverables completados

1. **NEW `nicolify/docker-compose.dev.yml`** — backend (8001) + frontend (3001) + cloudflared (profile=tunnel). name: luana-dev. network: luana_dev_net. volumes bind mount + named.
2. **NEW `vitalia/docker-compose.dev.yml`** — backend (8002) + frontend (3002) + cloudflared (profile=tunnel).
3. **NEW `comunify/docker-compose.dev.yml`** — backend (8003) + frontend (3003) + cloudflared (profile=tunnel).
4. **NEW `lupulo/docker-compose.dev.yml`** — backend (8004) + frontend (3004) + cloudflared (profile=tunnel). Placeholder-aware: bind mount limitado a src/ (no workspace completo).

## Decisiones aplicadas

- D2: Brand-autocontenida — cada brand tiene su propio compose file
- D4: Hot-reload via bind mount source + named volume para .venv
- D5: cloudflared con profile=tunnel en todas las brands
- D6: Puertos cementados (nicolify=8001/3001, vitalia=8002/3002, comunify=8003/3003, lupulo=8004/3004)
- F2: sin container_name fijo en ninguno de los compose files
- F3: todos usan network luana_dev_net (no bridge default)
- F4: sin rutas absolutas
- F7: qdrant/redis NO activados en compose brand base (son opt-in via profiles en compose raiz)

## Acceptance criteria verificados

- A1: yamllint compatible para los 4 compose files
- A2-A3: docker compose config merge raiz+brand parsea (requiere docker)
- A4: ninguno de los 4 compose files define postgres/qdrant/redis (solo en raiz)
- A5: todos tienen cloudflared con profile=tunnel

## Notas sobre lupulo

- lupulo/backend es placeholder — el Dockerfile no usa workspace uv completo.
- El bind mount de lupulo_backend es solo `./lupulo/backend/src:/workspace/lupulo/backend/src` (no el monorepo completo) para evitar confusion.
- lupulo/docker-compose.dev.yml NO declara `vitalia_backend_venv` como named volume (lupulo usa su propio named volume `lupulo_backend_venv`).
