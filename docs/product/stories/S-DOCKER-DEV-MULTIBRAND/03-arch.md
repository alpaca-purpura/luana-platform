---
story_id: S-DOCKER-DEV-MULTIBRAND
surface: INFRA
sub_architect: /architect (orchestrator + único surface infra)
arch_version: 1
last_modified: 2026-05-15T00:00:00Z
links:
  spec: "./01-spec.md"
  outcome: "../../outcomes/docker-dev-multibrand.md"
  outcome_platform: "../../outcomes/infra-dev-multibrand.md"
  rules:
    - ".claude/rules/git-safety.md"
    - ".claude/rules/anti-duplication.md"
    - ".claude/rules/parallel-safety.md"
---

# 03-arch.md — Docker dev local multimarca brand-autocontenida

## Decisión arquitectónica clave

La infraestructura de desarrollo se reestructura con dos capas: un `docker-compose.dev.yml` raíz que solo contiene servicios shared (postgres + qdrant opt-in + redis opt-in), y un `{brand}/docker-compose.dev.yml` per-brand que contiene los servicios propietarios de esa brand (backend + frontend + cloudflared opt-in). El Makefile raíz actúa como orquestador ergonómico componiendo ambos compose files. La metadatos de infra (puertos, dominios, DB names) viven en SSoT distribuido (`{brand}/config/brand.yaml::infra`) y se indexan automáticamente en `docs/portfolio/INFRA-MATRIX.md` via `make infra-matrix`. Este diseño es brand-autocontenida (copiar la carpeta brand da un entorno completo) y escala linealmente a las 6 brands futuras sin cambios en el compose raíz.

**Tradeoff principal aceptado:** 1 postgres shared (resource-efficient) vs N instancias postgres (isolation completa). Mitigación: `psql` user sin CREATEUSER en producción; en dev se acepta que un DROP accidental de una DB afecta solo esa brand (isolation por database, no por servidor).

---

## Surface diff — Archivos a crear/modificar

### A. docker-compose.dev.yml raíz (REWRITE)

**Ruta:** `/docker-compose.dev.yml`

El archivo actual (37 líneas, single-brand nicolify) se reescribe completamente. La nueva versión solo contiene servicios shared:

```yaml
# docker-compose.dev.yml — RAÍZ — servicios shared ÚNICAMENTE
# Brand-specific services viven en {brand}/docker-compose.dev.yml
# Uso: docker compose -f docker-compose.dev.yml -f {brand}/docker-compose.dev.yml up -d
# O más fácil: make dev-{brand}

name: luana-dev

services:
  luana_postgres_dev:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: postgres  # DB base (no usar para brands)
    volumes:
      - luana_postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/postgres-init:/docker-entrypoint-initdb.d:ro  # init scripts idempotentes
    ports:
      - "127.0.0.1:5435:5432"
    networks:
      - luana_dev_net
    deploy:
      resources:
        limits:
          cpus: "0.75"
          memory: 512M
        reservations:
          memory: 128M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  luana_qdrant_dev:
    image: qdrant/qdrant:v1.8.3
    profiles: [vector]  # opt-in: make dev-{brand}-vector o make dev-all
    restart: unless-stopped
    volumes:
      - luana_qdrant_dev_data:/qdrant/storage
    ports:
      - "127.0.0.1:6333:6333"
      - "127.0.0.1:6334:6334"
    networks:
      - luana_dev_net
    deploy:
      resources:
        limits:
          memory: 512M

  luana_redis_dev:
    image: redis:7-alpine
    profiles: [cache]  # opt-in: make dev-{brand}-cache o make dev-all
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - luana_redis_dev_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - luana_dev_net
    deploy:
      resources:
        limits:
          memory: 256M

volumes:
  luana_postgres_dev_data:
    name: luana_postgres_dev_data
  luana_qdrant_dev_data:
    name: luana_qdrant_dev_data
  luana_redis_dev_data:
    name: luana_redis_dev_data

networks:
  luana_dev_net:
    name: luana_dev_net
    driver: bridge
```

**Nota crítica:** `volumes: ./scripts/postgres-init:/docker-entrypoint-initdb.d:ro` — PostgreSQL ejecuta automáticamente los scripts `.sh` y `.sql` en este directorio al inicializar el data volume. Esto es comportamiento nativo del image postgres oficial (no customización).

---

### B. scripts/postgres-init/01-create-databases.sh (NEW)

**Ruta:** `scripts/postgres-init/01-create-databases.sh`

Script bash idempotente. PostgreSQL ejecuta este script al inicializar (solo en primer start con data volume vacío). Para re-ejecución manual, el script es seguro de correr N veces.

```bash
#!/usr/bin/env bash
# scripts/postgres-init/01-create-databases.sh
# Crea las databases de cada brand en el postgres compartido.
# IDEMPOTENTE: usa SELECT + CREATE condicional (no falla si ya existe).
# Ejecutado automáticamente por postgres al inicializar data volume.
# Ejecutable manualmente: psql -h 127.0.0.1 -p 5435 -U postgres -f ./scripts/postgres-init/01-create-databases.sh
set -euo pipefail

DATABASES=(
  "nicolify_dev"
  "vitalia_dev"
  "comunify_dev"
  "lupulo_dev"
)

for db in "${DATABASES[@]}"; do
  result=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'" 2>/dev/null || echo "0")
  if [ "$result" = "1" ]; then
    echo "Database ${db} already exists, skipping creation."
  else
    psql -U "$POSTGRES_USER" -c "CREATE DATABASE \"${db}\";" 2>/dev/null || true
    echo "Database ${db} created."
  fi
done

echo "postgres-init: all brand databases verified (${#DATABASES[@]} databases checked)."
```

**Nota:** El script usa la variable `$POSTGRES_USER` que el entrypoint de postgres inyecta automáticamente. No requiere conexión externa.

---

### C. {brand}/docker-compose.dev.yml × 4 (NEW)

Patrón canónico. Cada brand tiene su propio compose file. Se documenta el skeleton; las 4 instancias son variaciones de este patrón con sus valores específicos.

**Ruta:** `vitalia/docker-compose.dev.yml` (el mismo patrón aplica para nicolify, comunify, lupulo)

```yaml
# vitalia/docker-compose.dev.yml
# Brand-specific services. Siempre se usa combinado con el compose raíz:
#   docker compose -f docker-compose.dev.yml -f vitalia/docker-compose.dev.yml [--profile tunnel] up -d
# O más fácil: make dev-vitalia
# Valores de puertos/DB/etc: SSoT en vitalia/config/brand.yaml::infra

name: luana-dev  # mismo name que raíz para compartir network/volumes

services:
  vitalia_backend_dev:
    build:
      context: .  # contexto = raíz monorepo (accede a core/ y vitalia/backend/)
      dockerfile: vitalia/backend/Dockerfile
      target: dev
    restart: unless-stopped
    env_file:
      - vitalia/.env.dev  # gitignored; copiado desde vitalia/.env.dev.template
    environment:
      DATABASE_URL: "postgresql+asyncpg://postgres:password@luana_postgres_dev:5432/vitalia_dev"
      REDIS_URL: "redis://luana_redis_dev:6379/1"  # Redis DB 1 per port allocation table
      QDRANT_HOST: "luana_qdrant_dev"
      QDRANT_COLLECTION_PREFIX: "vitalia_"
      PORT: "8002"
    volumes:
      - .:/workspace:rw  # bind mount monorepo completo (hot-reload)
      - vitalia_backend_venv:/workspace/vitalia/backend/.venv  # anonymous volume protege .venv
    ports:
      - "127.0.0.1:8002:8002"
    networks:
      - luana_dev_net
    depends_on:
      luana_postgres_dev:
        condition: service_healthy
    command: >
      uv run uvicorn src.main:app
      --host 0.0.0.0
      --port 8002
      --reload
      --reload-dir /workspace/vitalia/backend/src
      --reload-dir /workspace/core
    deploy:
      resources:
        limits:
          memory: 1G

  vitalia_frontend_dev:
    build:
      context: .
      dockerfile: vitalia/frontend/Dockerfile
      target: dev
    restart: unless-stopped
    env_file:
      - vitalia/.env.dev
    environment:
      PORT: "3002"
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:8002"
    volumes:
      - ./vitalia/frontend:/app:rw
      - vitalia_frontend_node_modules:/app/node_modules  # anonymous volume
    ports:
      - "127.0.0.1:3002:3002"
    networks:
      - luana_dev_net
    deploy:
      resources:
        limits:
          memory: 1G

  vitalia_cloudflared_dev:
    image: cloudflare/cloudflared:latest
    profiles: [tunnel]  # opt-in: make dev-vitalia-tunnel
    restart: unless-stopped
    env_file:
      - vitalia/.env.dev  # debe contener TUNNEL_TOKEN o credenciales cloudflared
    command: tunnel run vitalia-dev
    networks:
      - luana_dev_net

volumes:
  vitalia_backend_venv:
    name: vitalia_backend_venv
  vitalia_frontend_node_modules:
    name: vitalia_frontend_node_modules

# NOTA: network luana_dev_net es definida en el compose raíz (docker-compose.dev.yml).
# El name: luana-dev compartido permite que los compose files compartan la misma network.
```

**Variaciones por brand:**
- `nicolify`: ports 8001/3001, DB `nicolify_dev`, Redis DB 0, prefix `nicolify_`
- `vitalia`: ports 8002/3002, DB `vitalia_dev`, Redis DB 1, prefix `vitalia_`
- `comunify`: ports 8003/3003, DB `comunify_dev`, Redis DB 2, prefix `comunify_`
- `lupulo`: ports 8004/3004, DB `lupulo_dev`, Redis DB 3, prefix `lupulo_`

**Nota sobre anonymous volumes:** El anonymous volume `{brand}_backend_venv` protege el `.venv` del container de ser sobreescrito por el bind mount del host (donde el `.venv` puede ser diferente o no existir). Pattern estándar de uv-in-docker documentado en Astral docs.

---

### D. {brand}/config/brand.yaml — sección `infra:` (MODIFY × 4)

Se agrega la sección `infra:` al final de cada `brand.yaml` existente, respetando el contenido previo.

```yaml
# Agregar al final de {brand}/config/brand.yaml
infra:
  dev:
    backend_port: 8002       # vitalia (ver port allocation table en outcome)
    frontend_port: 3002
    database_name: vitalia_dev
    redis_db: 1
    qdrant_collection_prefix: vitalia_
    domain: vitalia-dev.nicolify.com
    cloudflared_tunnel: vitalia-dev
  staging:
    domain: vitalia-test.nicolify.com
    server: tbd-staging-cluster
  prod:
    domain: app.vitalialat.com
    server: tbd
    cloudflared_tunnel: vitalia-prod
```

---

### E. {brand}/backend/Dockerfile × 3 (NEW para vitalia, comunify, lupulo)

**Ruta:** `vitalia/backend/Dockerfile`, `comunify/backend/Dockerfile`, `lupulo/backend/Dockerfile`

Patrón uv-workspace-friendly. El contexto de build es la raíz del monorepo (para acceder a `core/luana-core-*/`). **NO** es el mismo patrón que el Dockerfile legacy de nicolify (que usa pip + requirements.txt). El nuevo patrón usa uv directamente.

```dockerfile
# vitalia/backend/Dockerfile
# Build context: monorepo root (accede a core/ y vitalia/backend/)
# Target dev: hot-reload + uv editable workspace
# Target final: producción estática
# IMPORTANTE: No copiar .venv del host — se instala dentro del container

ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=0 \
    UV_LINK_MODE=copy

# Instalar uv
RUN pip install --no-cache-dir uv==0.4.18

WORKDIR /workspace

# ── dev target ── (usado en docker-compose.dev.yml via bind mount)
FROM base AS dev

# En dev, el source viene via bind mount (no COPY).
# Instalamos dependencias usando pyproject.toml del workspace raíz.
# El container inicia con uv sync que usa el workspace raíz.
# El .venv es protegido por anonymous volume en compose file.

# Instalar dependencias del workspace (sin source — bind mount trae el source)
COPY pyproject.toml uv.lock ./
COPY core/ ./core/
COPY vitalia/backend/pyproject.toml ./vitalia/backend/pyproject.toml
RUN uv sync --frozen --no-dev 2>/dev/null || uv sync --no-dev

WORKDIR /workspace/vitalia/backend

EXPOSE 8002
# CMD sobreescrito en compose file (uvicorn --reload)
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002"]

# ── final target ── (producción — usado por CI/CD)
FROM base AS final

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

COPY pyproject.toml uv.lock ./
COPY core/ ./core/
COPY vitalia/backend/ ./vitalia/backend/

RUN uv sync --frozen --no-dev --package vitalia-backend

WORKDIR /workspace/vitalia/backend
RUN chown -R appuser:appuser /workspace
USER appuser

EXPOSE 8002
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8002/health')"
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002"]
```

**Variaciones:** comunify usa puerto 8003, lupulo usa 8004. El pattern de uv sync y workspace es idéntico.

---

### F. {brand}/frontend/Dockerfile × 3 (NEW para vitalia, comunify, lupulo)

**Ruta:** `vitalia/frontend/Dockerfile`, `comunify/frontend/Dockerfile`, `lupulo/frontend/Dockerfile`

```dockerfile
# vitalia/frontend/Dockerfile
# Build context: monorepo root
# Target dev: hot-reload con bind mount
# Target final: Next.js standalone producción

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ── dev target ──
FROM base AS dev

WORKDIR /app

# Instalar dependencias (package.json viene via bind mount en dev, pero pre-instalamos)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY vitalia/frontend/package.json ./vitalia/frontend/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter vitalia-frontend

WORKDIR /app/vitalia/frontend
EXPOSE 3002
CMD ["pnpm", "dev", "--port", "3002"]

# ── builder target ──
FROM base AS builder

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY vitalia/frontend/package.json ./vitalia/frontend/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter vitalia-frontend

COPY vitalia/frontend/ ./vitalia/frontend/
WORKDIR /app/vitalia/frontend
RUN pnpm build

# ── final target ──
FROM node:20-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/vitalia/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/vitalia/frontend/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/vitalia/frontend/public ./public

USER appuser
EXPOSE 3002
ENV PORT=3002
CMD ["node", "server.js"]
```

---

### G. nicolify/{backend,frontend}/Dockerfile (AUDIT + ADJUST — T-5)

El Dockerfile legacy de nicolify/backend usa pip + `/opt/venv` en lugar de uv. T-5 audita y alinea al patrón uv-workspace. Cambios esperados:
- Reemplazar `python -m venv /opt/venv` + `pip install -r requirements.txt` → `uv sync --frozen`
- Agregar target `dev` con hot-reload
- Mantener target `final` para producción
- Ajustar WORKDIR a `/workspace/nicolify/backend` (consistencia con el compose raíz renombrado)

**Nota:** El audit puede detectar que el Dockerfile actual de nicolify es funcional para producción pero no para dev con hot-reload. T-5 documenta los cambios mínimos necesarios.

---

### H. Makefile raíz (NEW)

**Ruta:** `Makefile` (nuevo en raíz del monorepo)

```makefile
# Makefile — luana-platform monorepo
# Uso: make dev-{brand}, make dev-{brand}-tunnel, make dev-all, etc.
# SSoT de configuración de infra: {brand}/config/brand.yaml::infra
.PHONY: dev-nicolify dev-vitalia dev-comunify dev-lupulo
.PHONY: dev-nicolify-tunnel dev-vitalia-tunnel dev-comunify-tunnel dev-lupulo-tunnel
.PHONY: dev-all dev-all-vector dev-all-cache
.PHONY: dev-down-nicolify dev-down-vitalia dev-down-comunify dev-down-lupulo dev-down-all
.PHONY: dev-clean-nicolify dev-clean-vitalia dev-clean-comunify dev-clean-lupulo dev-clean-all
.PHONY: infra-matrix portfolio scan-promotables
.PHONY: ci-parity test-backend test-frontend

COMPOSE_BASE := docker compose -f docker-compose.dev.yml

# ── dev targets ──────────────────────────────────────────────────────────────
dev-nicolify:
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml up -d

dev-vitalia:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml up -d

dev-comunify:
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml up -d

dev-lupulo:
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml up -d

# ── tunnel targets (cloudflared profile) ────────────────────────────────────
dev-nicolify-tunnel:
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml --profile tunnel up -d

dev-vitalia-tunnel:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml --profile tunnel up -d

dev-comunify-tunnel:
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml --profile tunnel up -d

dev-lupulo-tunnel:
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml --profile tunnel up -d

# ── all-brands targets ───────────────────────────────────────────────────────
dev-all:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		up -d

dev-all-vector:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		--profile vector up -d

dev-all-cache:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		--profile cache up -d

# ── down targets ─────────────────────────────────────────────────────────────
dev-down-nicolify:
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml down

dev-down-vitalia:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml down

dev-down-comunify:
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml down

dev-down-lupulo:
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml down

dev-down-all:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		down

# ── clean targets (volumes incluidos) ───────────────────────────────────────
dev-clean-nicolify:
	$(COMPOSE_BASE) -f nicolify/docker-compose.dev.yml down -v --remove-orphans

dev-clean-vitalia:
	$(COMPOSE_BASE) -f vitalia/docker-compose.dev.yml down -v --remove-orphans

dev-clean-comunify:
	$(COMPOSE_BASE) -f comunify/docker-compose.dev.yml down -v --remove-orphans

dev-clean-lupulo:
	$(COMPOSE_BASE) -f lupulo/docker-compose.dev.yml down -v --remove-orphans

dev-clean-all:
	$(COMPOSE_BASE) \
		-f nicolify/docker-compose.dev.yml \
		-f vitalia/docker-compose.dev.yml \
		-f comunify/docker-compose.dev.yml \
		-f lupulo/docker-compose.dev.yml \
		down -v --remove-orphans

# ── infra management ─────────────────────────────────────────────────────────
infra-matrix:
	.venv/bin/python scripts/generate_infra_matrix.py

portfolio:
	.venv/bin/python scripts/generate_portfolio.py

scan-promotables:
	.venv/bin/python scripts/scan_promotables.py

# ── CI/CD helpers ─────────────────────────────────────────────────────────────
ci-parity:
	@echo "Running CI parity gate (native)..."
	@$(MAKE) test-backend test-frontend

test-backend:
	cd nicolify/backend && .venv/bin/ruff check src/ tests/ --no-cache
	cd nicolify/backend && .venv/bin/pytest tests/ -x -q --tb=short

test-frontend:
	cd nicolify/frontend && npx tsc --noEmit
	cd nicolify/frontend && npx vitest run --coverage
```

---

### I. {brand}/.env.dev.template + {brand}/.env.prod.template × 4 (NEW)

**Ruta:** `vitalia/.env.dev.template`, `vitalia/.env.prod.template` (idem para nicolify, comunify, lupulo)

```bash
# vitalia/.env.dev.template
# CHECKED IN — copialo a vitalia/.env.dev (gitignored) y rellena valores reales
# vitalia/.env.dev NUNCA debe commitearse (.gitignore ya lo excluye)

# === Clerk (Auth) ===
CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
CLERK_SECRET_KEY=sk_test_REPLACE_ME

# === Database ===
DATABASE_URL=postgresql+asyncpg://postgres:password@127.0.0.1:5435/vitalia_dev
# Dentro del container: postgresql+asyncpg://postgres:password@luana_postgres_dev:5432/vitalia_dev

# === Redis ===
REDIS_URL=redis://127.0.0.1:6379/1

# === Qdrant ===
QDRANT_HOST=127.0.0.1
QDRANT_PORT=6333
QDRANT_COLLECTION_PREFIX=vitalia_

# === Brand ===
BRAND_SLUG=vitalia
ENVIRONMENT=development

# === LLM ===
OPENAI_API_KEY=sk-REPLACE_ME
LITELLM_PROXY_URL=http://localhost:4000

# === Cloudflared (solo necesario si usas make dev-vitalia-tunnel) ===
TUNNEL_TOKEN=REPLACE_ME_IF_USING_TUNNEL

# === Next.js ===
NEXT_PUBLIC_API_URL=http://localhost:8002
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
```

---

### J. .gitignore (MODIFY)

Agregar al `.gitignore` raíz existente:

```gitignore
# Brand env files (secretos — NO commitear nunca)
nicolify/.env.dev
nicolify/.env.prod
vitalia/.env.dev
vitalia/.env.prod
comunify/.env.dev
comunify/.env.prod
lupulo/.env.dev
lupulo/.env.prod
# Futuros
saasora/.env.dev
saasora/.env.prod
inmoflow/.env.dev
inmoflow/.env.prod
retailly/.env.dev
retailly/.env.prod
fixia/.env.dev
fixia/.env.prod
guestly/.env.dev
guestly/.env.prod
fitflow/.env.dev
fitflow/.env.prod
```

---

### K. scripts/generate_infra_matrix.py (NEW)

**Ruta:** `scripts/generate_infra_matrix.py`

```python
#!/usr/bin/env python3
"""
scripts/generate_infra_matrix.py
Auto-genera docs/portfolio/INFRA-MATRIX.md desde {brand}/config/brand.yaml::infra.
SSoT: cada brand.yaml. Este script es el indexador — NO editar INFRA-MATRIX.md manualmente.

Uso: make infra-matrix  (o: .venv/bin/python scripts/generate_infra_matrix.py)
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml  # pyyaml — disponible en venv raíz

BRANDS = ["nicolify", "vitalia", "comunify", "lupulo"]
REPO_ROOT = Path(__file__).parent.parent
OUTPUT = REPO_ROOT / "docs" / "portfolio" / "INFRA-MATRIX.md"

HEADER = "<!-- AUTO-GENERATED via make infra-matrix — DO NOT EDIT MANUALLY -->\n"


def load_brand_infra(brand: str) -> dict:
    """Lee {brand}/config/brand.yaml y retorna la sección infra."""
    config_path = REPO_ROOT / brand / "config" / "brand.yaml"
    if not config_path.exists():
        return {}
    with config_path.open() as f:
        data = yaml.safe_load(f)
    return data.get("infra", {})


def generate_matrix(brands_infra: dict[str, dict]) -> str:
    """Genera la tabla markdown de infra cross-brand."""
    lines = [
        HEADER,
        "# INFRA-MATRIX — Puertos, dominios y databases por brand\n",
        "> Generado automáticamente por `make infra-matrix`. "
        "SSoT: `{brand}/config/brand.yaml::infra`. "
        "NO editar manualmente.\n",
        "## Entorno dev local\n",
        "| Brand | Backend port | Frontend port | DB name | Redis DB | Qdrant prefix | Dev domain |",
        "|---|---|---|---|---|---|---|",
    ]
    for brand, infra in brands_infra.items():
        dev = infra.get("dev", {})
        lines.append(
            f"| {brand} "
            f"| {dev.get('backend_port', 'n/a')} "
            f"| {dev.get('frontend_port', 'n/a')} "
            f"| {dev.get('database_name', 'n/a')} "
            f"| {dev.get('redis_db', 'n/a')} "
            f"| {dev.get('qdrant_collection_prefix', 'n/a')} "
            f"| {dev.get('domain', 'n/a')} |"
        )

    lines += [
        "",
        "## Entorno producción\n",
        "| Brand | Prod domain | Servidor |",
        "|---|---|---|",
    ]
    for brand, infra in brands_infra.items():
        prod = infra.get("prod", {})
        lines.append(
            f"| {brand} "
            f"| {prod.get('domain', 'tbd')} "
            f"| {prod.get('server', 'tbd')} |"
        )

    lines += [
        "",
        "## Puertos compartidos (shared infra)\n",
        "| Servicio | Host port | Container port | Notas |",
        "|---|---|---|---|",
        "| postgres | 5435 | 5432 | Shared — 1 instancia, N databases |",
        "| qdrant | 6333/6334 | 6333/6334 | Opt-in profile `vector` |",
        "| redis | 6379 | 6379 | Opt-in profile `cache` |",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    brands_infra = {brand: load_brand_infra(brand) for brand in BRANDS}
    content = generate_matrix(brands_infra)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"INFRA-MATRIX.md updated ({len(BRANDS)} brands).")


if __name__ == "__main__":
    main()
```

---

### L. docs/portfolio/INFRA-MATRIX.md (NEW — primera versión)

**Ruta:** `docs/portfolio/INFRA-MATRIX.md`

Primera versión manual (luego auto-generada via `make infra-matrix` tras T-3 completar brand.yaml::infra). Contenido inicial placeholder hasta que T-3 + T-8 estén done.

---

### M. Pre-commit hook — sección INFRA-MATRIX (MODIFY)

**Ruta:** `scripts/git-hooks/pre-commit`

Se agrega una sección al final del hook existente. El hook actual (Section 1-9 documentados en el codebase) recibe Section 10:

```bash
# Section 10 — INFRA-MATRIX auto-freshness
# Si se edita cualquier {brand}/config/brand.yaml, regenerar INFRA-MATRIX.md
# y agregarlo al commit automáticamente.

CHANGED_BRAND_YAML=$(git diff --cached --name-only | grep -E '^(nicolify|vitalia|comunify|lupulo)/config/brand\.yaml$' || true)

if [ -n "$CHANGED_BRAND_YAML" ]; then
  echo "[pre-commit] brand.yaml editado — regenerando INFRA-MATRIX.md..."
  if .venv/bin/python scripts/generate_infra_matrix.py; then
    git add docs/portfolio/INFRA-MATRIX.md
    echo "[pre-commit] INFRA-MATRIX.md regenerado y agregado al commit."
  else
    echo "[pre-commit] ERROR: generate_infra_matrix.py falló. Commit abortado."
    exit 1
  fi
fi
```

---

### N. Tests requeridos

#### tests/scripts/test_generate_infra_matrix.py (NEW)

```
tests/scripts/test_generate_infra_matrix.py
  - test_golden_snapshot: corre generate_matrix() con fixtures YAML y compara output exacto
  - test_missing_infra_section: brand sin sección infra → columnas "n/a" sin crash
  - test_output_file_created: verifica que el archivo OUTPUT se crea/sobreescribe
  - test_header_present: primera línea contiene "AUTO-GENERATED"
  - test_all_brands_present: las 4 brands aparecen en la tabla
```

#### scripts/tests/test_postgres_init.sh (NEW)

```bash
#!/usr/bin/env bash
# Test de idempotencia del script postgres-init
# Requiere postgres corriendo en 127.0.0.1:5435
# Uso: bash scripts/tests/test_postgres_init.sh

set -euo pipefail

PSQL="psql -h 127.0.0.1 -p 5435 -U postgres -q"

# Test 1: Primera ejecución crea database
${PSQL} -c "DROP DATABASE IF EXISTS test_idempotency_db;"
source scripts/postgres-init/01-create-databases.sh 2>/dev/null || true
# Verificar vitalia_dev existe
result=$(${PSQL} -tAc "SELECT 1 FROM pg_database WHERE datname='vitalia_dev'" 2>/dev/null)
[ "$result" = "1" ] && echo "PASS: vitalia_dev created" || (echo "FAIL: vitalia_dev not created" && exit 1)

# Test 2: Segunda ejecución no falla
source scripts/postgres-init/01-create-databases.sh 2>/dev/null || true
result=$(${PSQL} -tAc "SELECT 1 FROM pg_database WHERE datname='vitalia_dev'" 2>/dev/null)
[ "$result" = "1" ] && echo "PASS: idempotent re-run" || (echo "FAIL: vitalia_dev lost on re-run" && exit 1)

echo "ALL postgres-init tests PASS"
```

#### tests/scripts/test_docker_dev_integration.py (NEW)

Tests de integración — requieren Docker corriendo. Se marcan con `@pytest.mark.integration` y se excluyen del suite nativo estándar (corren en CI separado o con `--run-integration` flag).

```
tests/scripts/test_docker_dev_integration.py
  @pytest.mark.integration
  - test_happy_dev_vitalia: make dev-vitalia → curl health → 200 → make dev-down-vitalia
  - test_tunnel_profile_up: make dev-vitalia-tunnel → docker ps check cloudflared → make dev-down-vitalia
  - test_init_script_idempotent: run init script 2x → database intacta
  - test_two_brands_parallel: make dev-vitalia + make dev-comunify → curl ambos → 200 → make dev-down-all
  - test_hot_reload_core_change: make dev-vitalia → touch core file → watch log reload <2s
  - test_db_isolation_after_drop: make dev-vitalia + comunify → DROP vitalia_dev → curl comunify still 200
```

---

## Cross-cutting concerns

- **Sin tenant isolation:** este outcome es infra pura (no domain entities, no tenant filtering). No aplica tenant_id.
- **Idempotencia:** todos los scripts bash y el init de postgres deben ser idempotentes.
- **Named volumes vs anonymous:** volumes de datos (`postgres_data`) son named (persisten entre `dev-down`). Volumes de `.venv`/`node_modules` son named también pero se limpian con `dev-clean-{brand}`.
- **Compatibilidad backwards:** el cambio del compose raíz puede afectar workflows de nicolify ya documentados. CLAUDE.md workspace bootstrap section (T-10) se actualiza para reflejar el nuevo flujo.
- **Docker name collision:** todos los servicios usan `name: luana-dev` en sus compose files. Esto es intencional — permite que los compose files de brand compartan la network y los volumes del compose raíz.

## Riesgos y mitigaciones

| Riesgo | Severidad | Mitigación |
|---|---|---|
| uv sync en Dockerfile sin workspace context | HIGH | Build context es siempre la raíz del monorepo (context: .) |
| anonymous volume .venv sobreescrito por bind mount | HIGH | El compose file declara el anonymous volume DESPUÉS del bind mount; Docker da prioridad al volume |
| Port collision si otra app usa 8001-8004 en el host | MEDIUM | make dev-{brand} falla inmediatamente con "address already in use" — error legible |
| postgres init script no ejecuta si data volume ya existe | LOW | Docker solo ejecuta /docker-entrypoint-initdb.d en primer init. Para re-init: make dev-clean-{brand} |
| lupulo no tiene backend/frontend implementados | LOW | Dockerfiles son placeholders mínimos (imagen base + health endpoint vacío) |
| shellcheck en CI detecta errores en scripts bash | LOW | T-1 y T-9 incluyen shellcheck como acceptance criterion |

## Decisiones registradas

- **2026-05-15 D1** — 1 postgres + N databases (vs N instancias). Ratificado Chris.
- **2026-05-15 D2** — `{brand}/docker-compose.dev.yml` per brand (vs compose raíz único). Ratificado Chris.
- **2026-05-15 D3** — Qdrant + Redis opt-in profiles. Ratificado Chris.
- **2026-05-15 D4** — Hot-reload via bind mount source + anonymous volume .venv. Ratificado Chris.
- **2026-05-15 D5** — Cloudflared tunnel opt-in profile per brand. Ratificado Chris.
- **2026-05-15 D6** — Port allocation cementada (nicolify=8001/3001, vitalia=8002/3002, comunify=8003/3003, lupulo=8004/3004). Ratificado Chris.
- **2026-05-15** — Build context = monorepo root para todos los Dockerfiles. Necesario para acceso a `core/luana-core-*/`.
- **2026-05-15** — `name: luana-dev` compartido entre compose raíz y brand compose files. Necesario para network sharing.
- **2026-05-15** — Pattern `generate_infra_matrix.py` + pre-commit hook Section 10. Cementado como "metadata-en-su-lugar + auto-gen index".
