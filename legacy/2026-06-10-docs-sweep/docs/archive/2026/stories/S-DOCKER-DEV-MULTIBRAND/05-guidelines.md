---
story_id: S-DOCKER-DEV-MULTIBRAND
surface: INFRA
guidelines_version: 1
last_modified: 2026-05-15T00:00:00Z
---

# 05-guidelines.md — Docker dev local multimarca brand-autocontenida

## Patterns required

### 1. Compose files — doble compose file (raíz + brand)

Los servicios NUNCA se definen todos en un único compose file. La arquitectura es siempre doble capa:

- `docker-compose.dev.yml` raíz: **solo shared infra** (postgres, qdrant opt-in, redis opt-in)
- `{brand}/docker-compose.dev.yml`: **solo servicios brand** (backend, frontend, cloudflared opt-in)

El Makefile raíz compone ambos con `docker compose -f docker-compose.dev.yml -f {brand}/docker-compose.dev.yml`.

```bash
# CORRECTO
docker compose -f docker-compose.dev.yml -f vitalia/docker-compose.dev.yml up -d

# INCORRECTO — NO agregar servicios brand al compose raíz
# INCORRECTO — NO duplicar postgres en el compose brand
```

### 2. Compose name compartido

Todos los compose files (raíz y brands) deben declarar `name: luana-dev`. Esto es necesario para compartir la network `luana_dev_net` y los volumes named entre los compose files.

```yaml
# REQUERIDO en todos los compose files (raíz y brand)
name: luana-dev
```

### 3. Dockerfile — multi-stage con target `dev` y `final`

Todos los Dockerfiles de backend y frontend deben tener al menos dos targets:
- `dev`: para desarrollo local con hot-reload. Código viene via bind mount, no via COPY.
- `final`: para producción. Código copiado, usuario no-root, HEALTHCHECK.

```dockerfile
# CORRECTO — target dev con bind mount
FROM base AS dev
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
# source viene via bind mount en compose file
CMD ["uv", "run", "uvicorn", "src.main:app", "--reload", ...]

# CORRECTO — target final producción
FROM base AS final
COPY . .
RUN uv sync --frozen --no-dev
USER appuser
HEALTHCHECK ...
CMD ["uv", "run", "uvicorn", "src.main:app"]
```

### 4. Dockerfile — uv como gestor de packages (NO pip + requirements.txt)

Los Dockerfiles nuevos (vitalia, comunify, lupulo) usan uv directamente. El patrón legacy de nicolify/backend (pip + /opt/venv) se migra en T-5.

```dockerfile
# CORRECTO — uv
RUN pip install --no-cache-dir uv==0.4.18
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# INCORRECTO — pip legacy
RUN python -m venv /opt/venv
RUN pip install -r requirements.txt
```

### 5. Build context = raíz del monorepo

El `context:` de todos los builds de brand debe ser `.` (raíz del monorepo), no `{brand}/backend/`. Esto es necesario para acceder a `core/luana-core-*/` durante el build.

```yaml
# CORRECTO en {brand}/docker-compose.dev.yml
services:
  vitalia_backend_dev:
    build:
      context: .  # raíz del monorepo
      dockerfile: vitalia/backend/Dockerfile
      target: dev

# INCORRECTO — pierde acceso a core/
services:
  vitalia_backend_dev:
    build:
      context: ./vitalia/backend
      dockerfile: Dockerfile
```

### 6. Hot-reload — bind mount con anonymous volume para .venv

El bind mount del source monorepo debe ir acompañado de un anonymous volume (named en compose file) que protege el `.venv` del container de ser sobreescrito por el host.

```yaml
# CORRECTO — bind mount + named volume protege .venv
volumes:
  - .:/workspace:rw          # bind mount source (hot-reload)
  - vitalia_backend_venv:/workspace/vitalia/backend/.venv  # protege .venv container

# INCORRECTO — bind mount sin protección del .venv
volumes:
  - .:/workspace:rw          # sobreescribirá .venv del container con el del host (si existe)
```

### 7. Bash scripts — set -euo pipefail + idempotencia

Todos los scripts bash de infra deben:
- Iniciar con `#!/usr/bin/env bash` y `set -euo pipefail`
- Ser idempotentes (ejecutables N veces con el mismo resultado)
- Usar `IF EXISTS` / `IF NOT EXISTS` equivalentes para operaciones de base de datos

```bash
#!/usr/bin/env bash
set -euo pipefail

# CORRECTO — idempotente
result=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='vitalia_dev'")
if [ "$result" != "1" ]; then
  psql -U "$POSTGRES_USER" -c "CREATE DATABASE vitalia_dev;"
fi

# INCORRECTO — falla si DB ya existe
psql -U "$POSTGRES_USER" -c "CREATE DATABASE vitalia_dev;"
```

### 8. Makefile — .PHONY declarado + no cd && cmd

Todos los targets del Makefile deben estar listados en `.PHONY`. Los recipes no deben usar `cd && cmd` (usar workdir nativo de Make o subshell con `$(MAKE)`).

```makefile
# CORRECTO
.PHONY: dev-vitalia infra-matrix

dev-vitalia:
	docker compose -f docker-compose.dev.yml -f vitalia/docker-compose.dev.yml up -d

# INCORRECTO — cd && cmd es frágil
dev-vitalia:
	cd vitalia && docker compose up -d
```

### 9. INFRA-MATRIX — solo auto-generado

El archivo `docs/portfolio/INFRA-MATRIX.md` es SIEMPRE generado por `make infra-matrix` (`scripts/generate_infra_matrix.py`). Nunca se edita manualmente. La primera línea del archivo es el header `<!-- AUTO-GENERATED ... -->`.

```bash
# CORRECTO — regenerar
make infra-matrix

# INCORRECTO — editar directamente
vim docs/portfolio/INFRA-MATRIX.md
```

### 10. {brand}/config/brand.yaml::infra — schema fijo

La sección `infra:` en cada `brand.yaml` sigue el schema exacto definido en el outcome:

```yaml
infra:
  dev:
    backend_port: 8002       # integer, no string
    frontend_port: 3002      # integer, no string
    database_name: vitalia_dev
    redis_db: 1              # integer 0-15 (Redis DB number)
    qdrant_collection_prefix: vitalia_  # incluye underscore final
    domain: vitalia-dev.nicolify.com
    cloudflared_tunnel: vitalia-dev
  staging:
    domain: vitalia-test.nicolify.com
    server: tbd-staging-cluster        # placeholder OK, no dejar vacío
  prod:
    domain: app.vitalialat.com
    server: tbd                        # placeholder OK, no dejar vacío
    cloudflared_tunnel: vitalia-prod
```

Campos requeridos en `dev:`: `backend_port`, `frontend_port`, `database_name`, `redis_db`, `qdrant_collection_prefix`, `domain`. Sin estos, `generate_infra_matrix.py` muestra `n/a`.

### 11. Port allocation — tabla cementada (no modificar sin actualizar outcome)

Los puertos están cementados en el outcome `docker-dev-multibrand.md`. Ningún compose file ni brand.yaml debe usar un puerto diferente al asignado:

| Brand | Backend | Frontend | Redis DB |
|---|---|---|---|
| nicolify | 8001 | 3001 | 0 |
| vitalia | 8002 | 3002 | 1 |
| comunify | 8003 | 3003 | 2 |
| lupulo | 8004 | 3004 | 3 |
| (futuros 8005-8010 / 3005-3010 / Redis 4-9) | | | |

Postgres compartido: `127.0.0.1:5435:5432`. Qdrant: `6333/6334`. Redis: `6379`.

---

## Patterns forbidden

### F1 — NO hardcoded ports en compose files (usa env_file o valores de brand.yaml)

Los puertos en el compose file de brand sí están hardcodeados (son el SSoT del port allocation), pero no deben duplicarse en otros lugares. Si el frontend necesita saber el puerto del backend, usa una variable de entorno.

```yaml
# ACEPTABLE — puerto hardcodeado en compose file (SSoT del port allocation)
ports:
  - "127.0.0.1:8002:8002"

# INCORRECTO — duplicar el puerto en env_file Y en compose
environment:
  BACKEND_PORT: "8002"  # redundante si compose file ya declara el puerto
```

### F2 — NO container_name fijo en compose files

Los containers no deben tener `container_name:` estático. Docker auto-genera nombres únicos basados en `name: luana-dev` + service name. El `container_name:` fijo causaría conflict entre sesiones paralelas.

```yaml
# INCORRECTO
services:
  vitalia_backend_dev:
    container_name: vitalia_backend_dev  # fijo — conflicto si ya existe

# CORRECTO — sin container_name (Docker auto-genera)
services:
  vitalia_backend_dev:
    image: ...
```

**Nota:** El compose raíz legacy de nicolify tiene `container_name: nicolify_postgres_dev`. T-1 elimina esto en el rewrite del compose raíz.

### F3 — NO network bridge default

Todos los servicios deben usar la network nombrada `luana_dev_net`. La network `bridge` default de Docker no permite cross-compose communication.

```yaml
# INCORRECTO
services:
  vitalia_backend_dev:
    # sin networks: → usa bridge default, no puede resolver luana_postgres_dev

# CORRECTO
services:
  vitalia_backend_dev:
    networks:
      - luana_dev_net
```

### F4 — NO rutas absolutas /home/chris/* en configs

Los compose files y scripts bash no deben contener rutas absolutas con el home del usuario. Usar `$PWD`, rutas relativas al contexto de compose, o variables de entorno.

```yaml
# INCORRECTO
volumes:
  - /home/chris/Proyectos/luana-platform:/workspace:rw

# CORRECTO
volumes:
  - .:/workspace:rw   # relativo al directorio donde se ejecuta docker compose
```

### F5 — NO Dockerfile sin target `dev` funcional (incluso en placeholders)

Los Dockerfiles de lupulo (que no tiene backend/frontend implementados) deben tener un target `dev` mínimo funcional que responda `/health`. No deben estar broken o comentados.

```dockerfile
# CORRECTO para lupulo (placeholder)
FROM python:3.12-slim AS dev
WORKDIR /app
# Placeholder minimal — lupulo sin implementación real
RUN pip install fastapi uvicorn
COPY lupulo/backend/src/main_placeholder.py ./main.py
EXPOSE 8004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004", "--reload"]

# INCORRECTO — Dockerfile que no buildea
FROM python:3.12-slim AS dev
# TODO: implement
```

### F6 — NO editar INFRA-MATRIX.md manualmente

El archivo `docs/portfolio/INFRA-MATRIX.md` contiene `<!-- AUTO-GENERATED ... -->` en línea 1. Cualquier edición manual será sobreescrita en el siguiente `make infra-matrix`. Si necesitas cambiar los valores, edita el `{brand}/config/brand.yaml::infra` correspondiente y re-genera.

### F7 — NO docker compose sin profiles explícitos para qdrant/redis (a menos que sea make dev-all-vector/cache)

Los targets `make dev-{brand}` base NO activan los profiles `vector` ni `cache`. Activarlos accidentalmente consume recursos innecesarios. Solo activar si:
- El brand.yaml declara que necesita qdrant/redis
- O el usuario pide `make dev-{brand}-vector` / `make dev-{brand}-cache`

### F8 — NO lupulo backend/frontend Dockerfile apuntando a código inexistente

Lupulo actualmente solo tiene `docs/`, `package.json`, `pyproject.toml`, `README.md`, `src/`. Los Dockerfiles de lupulo/backend y lupulo/frontend deben usar un placeholder mínimo que no falle en el build, no referencias a código que no existe.

---

## Archivos en scope (según 03-arch.md)

### Archivos REWRITE
- `docker-compose.dev.yml` (raíz)

### Archivos NEW — scripts e infra
- `scripts/postgres-init/01-create-databases.sh`
- `scripts/tests/test_postgres_init.sh`
- `Makefile` (raíz)
- `scripts/generate_infra_matrix.py`

### Archivos NEW — brand compose files × 4
- `nicolify/docker-compose.dev.yml`
- `vitalia/docker-compose.dev.yml`
- `comunify/docker-compose.dev.yml`
- `lupulo/docker-compose.dev.yml`

### Archivos NEW — Dockerfiles × 6 (backend + frontend para vitalia, comunify, lupulo)
- `vitalia/backend/Dockerfile`
- `vitalia/frontend/Dockerfile`
- `comunify/backend/Dockerfile`
- `comunify/frontend/Dockerfile`
- `lupulo/backend/Dockerfile`
- `lupulo/frontend/Dockerfile`

### Archivos MODIFY — brand.yaml × 4 (agregar sección infra:)
- `nicolify/config/brand.yaml` (crear si no existe, o agregar sección)
- `vitalia/config/brand.yaml` (ya existe — agregar sección infra: al final)
- `comunify/config/brand.yaml` (ya existe — agregar sección infra: al final)
- `lupulo/config/brand.yaml` (crear si no existe, o agregar sección)

### Archivos MODIFY — audit + ajuste Dockerfiles nicolify
- `nicolify/backend/Dockerfile` (T-5: audit + ajuste uv-workspace-friendly)
- `nicolify/frontend/Dockerfile` (T-5: audit + ajuste si necesario)

### Archivos NEW — env templates × 4 brands
- `nicolify/.env.dev.template`
- `nicolify/.env.prod.template`
- `vitalia/.env.dev.template`
- `vitalia/.env.prod.template`
- `comunify/.env.dev.template`
- `comunify/.env.prod.template`
- `lupulo/.env.dev.template`
- `lupulo/.env.prod.template`

### Archivos MODIFY — gitignore + hook + docs
- `.gitignore` (raíz — agregar {brand}/.env.dev y .env.prod)
- `scripts/git-hooks/pre-commit` (Section 10 — INFRA-MATRIX auto-freshness)
- `CLAUDE.md` (workspace bootstrap section actualizada)
- `.claude/skills/pm-luana/SKILL.md` (cementar pattern "metadata-en-su-lugar + auto-gen index")

### Archivos NEW — tests
- `tests/scripts/test_generate_infra_matrix.py`
- `tests/scripts/test_docker_dev_integration.py`

### Archivos NEW — docs
- `docs/portfolio/INFRA-MATRIX.md` (auto-gen, primera versión)
- `docs/process/docker-dev-multibrand.md` (runbook)
- `docs/architecture/luana-platform/ADR-003-docker-dev-multibrand.md`

### Archivos OUT OF SCOPE (no tocar en esta story)
- `{brand}/backend/src/` — código de aplicación (no es scope de esta story)
- `{brand}/frontend/src/` — código de aplicación (no es scope de esta story)
- `.github/workflows/` — CI/CD (scope de S-CICD-DEPLOY)
- `core/luana-core-*/` — packages core (no se modifican)
- Cualquier archivo en `docs/product/` excepto esta story folder

---

## Skills a cargar en /dev-team

- `backend-expert` — para patrones uv-workspace en Dockerfiles (uv sync, editable installs, build context monorepo)
- `.claude/rules/git-safety.md` — commit conventions, no git add -A
- `.claude/rules/anti-duplication.md` — Dockerfiles vitalia/comunify/lupulo extend pattern nicolify (no mirror)
- `.claude/rules/anti-default-flip-audit.md` — no aplica directamente (no hay feature flags) pero útil como reminder de verificar ambos estados de scripts
- `.claude/rules/parallel-safety.md` — esta story puede correr en paralelo con S-CICD-DEPLOY en worktrees distintos (post S-GIT-STRATEGY-CORE done)

## Notas para /dev-team

1. **Orden de tickets:** T-1 y T-7 pueden correr en paralelo. T-2 depende de T-1. T-3 depende de T-2. T-4 y T-5 son independientes entre sí pero T-5 se hace después de T-4 para consistencia. T-6 depende de T-1 y T-2. T-8 depende de T-3. T-9 depende de T-8. T-10 es último (docs al cierre).

2. **Lupulo placeholder:** Lupulo solo tiene `docs/`, `package.json`, `pyproject.toml`, `README.md`, `src/`. Los Dockerfiles de lupulo deben crear un placeholder mínimo (`src/main_placeholder.py` con FastAPI + `/health` route) para que el compose file no falle. Este placeholder es técnicamente el primer código de lupulo — documentar en `lupulo/README.md`.

3. **Build context monorepo:** El argumento `context: .` en el compose file asume que `docker compose` se ejecuta desde la raíz del monorepo (lo que `make dev-{brand}` garantiza). Si el usuario ejecuta `docker compose` desde `vitalia/`, el context fallará. Documentar en runbook (T-10).

4. **nicolify/backend/Dockerfile legacy:** El Dockerfile actual usa `python:3.11-slim` (no 3.12) y pip + /opt/venv. T-5 audita si es necesario migrar o si puede coexistir. El criterio es: ¿funciona el hot-reload con el bind mount? Si no, migrar mínimamente.

5. **pre-commit hook:** La Section 10 agrega regeneración de INFRA-MATRIX.md. El hook preexistente tiene Sections 1-9. Verificar con `bash scripts/git-hooks/pre-commit --test` (si existe ese flag) o revisando el archivo antes de agregar.
