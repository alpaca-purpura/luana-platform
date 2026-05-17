# 00-research — comunify-dev-stack-functional

> Story-handoff completo. Receta canónica cementada vive en
> `vitalia/docs/archive/2026/stories/vitalia-dev-stack-functional/07-merge.md`
> (12 pasos no rompibles). Este documento sólo captura el **diff específico comunify**.

## Estado pre-ejecución (auditoría /pm-luana 2026-05-17)

| Componente | Vitalia (referencia OK) | Comunify (gap) |
|---|---|---|
| `{brand}/pyproject.toml::dependencies` | 11 deps runtime (uvicorn, fastapi, sqlalchemy, asyncpg, alembic, 5 luana_core_*) | `[]` — vacío |
| `{brand}/backend/Dockerfile` COPY pyproject | COPY ambos (`{brand}/pyproject.toml` + `{brand}/backend/pyproject.toml`) | Solo COPY `{brand}/backend/pyproject.toml` |
| `{brand}/backend/Dockerfile` uv sync | `uv sync --no-dev --package luana-vitalia` | `uv sync --frozen --no-dev \|\| uv sync --no-dev` (sin `--package`) |
| `{brand}/backend/Dockerfile` WORKDIR final | `WORKDIR /workspace/vitalia/backend` | Pendiente verificar |
| `{brand}/backend/Dockerfile` EXPOSE + CMD | `EXPOSE 8002` + `CMD ["uv","run","uvicorn",...]` | Pendiente verificar |
| `{brand}/docker-compose.dev.yml` BE env | `UV_PROJECT_ENVIRONMENT: "/workspace/.venv"` | FALTA |
| `{brand}/docker-compose.dev.yml` BE command | `sh -c "cd /workspace/vitalia/backend && uv run alembic upgrade head && uv run uvicorn src.main:app ..."` | `uv run uvicorn src.main:app ...` (sin cd + sin alembic upgrade) |
| `{brand}/backend/src/main.py` /health | Registrado con `response_model=HealthResponse` (commit 930df59) | Pendiente verificar |
| `{brand}/backend/alembic/env.py` DATABASE_URL | Lee env + asyncpg→psycopg2 swap | Pendiente verificar |
| Root `docker-compose.dev.yml` init.sql | Crea las 4 DBs brand | Pendiente verificar |

## Patches concretos (orden ejecución)

### Patch 1 — `comunify/pyproject.toml` (deps runtime)

Espejo `vitalia/pyproject.toml` adaptado a `luana-comunify`:

```toml
[project]
name = "luana-comunify"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    # ASGI server (dev compose llama `uv run uvicorn`)
    "uvicorn[standard]>=0.34.0",
    # FastAPI runtime
    "fastapi>=0.115",
    "python-multipart>=0.0.20",
    "starlette>=0.46",
    "structlog>=25.1",
    # Persistence
    "sqlalchemy>=2.0",
    "asyncpg>=0.29",
    "alembic>=1.13",
    # Engine core packages (comunify/backend/src importa luana_core_*)
    "luana-core-platform",
    "luana-core-observability",
    "luana-core-extension-sdk",
    "luana-core-channels",
    "luana-core-extraction",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
bypass-selection = true       # no comunify/src/ — solo arrastra deps editable
```

### Patch 2 — `comunify/backend/Dockerfile`

Cambios espejo vitalia/backend/Dockerfile:

```dockerfile
# Reemplazar:
COPY comunify/backend/pyproject.toml ./comunify/backend/pyproject.toml
RUN uv sync --frozen --no-dev 2>/dev/null || uv sync --no-dev

# Por (modelo vitalia):
COPY comunify/pyproject.toml ./comunify/pyproject.toml
COPY comunify/backend/pyproject.toml ./comunify/backend/pyproject.toml

RUN uv sync --no-dev --package luana-comunify 2>&1

WORKDIR /workspace/comunify/backend

EXPOSE 8003
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8003"]
```

### Patch 3 — `comunify/docker-compose.dev.yml` BE service

```yaml
# En environment: agregar
UV_PROJECT_ENVIRONMENT: "/workspace/.venv"

# Reemplazar command:
command: >
  uv run uvicorn src.main:app
  --host 0.0.0.0
  --port 8003
  --proxy-headers
  --forwarded-allow-ips *
  --reload
  --reload-dir /workspace/comunify/backend/src
  --reload-dir /workspace/core

# Por:
command: >
  sh -c "cd /workspace/comunify/backend &&
  uv run alembic upgrade head &&
  uv run uvicorn src.main:app
  --host 0.0.0.0
  --port 8003
  --proxy-headers
  --forwarded-allow-ips '*'
  --reload
  --reload-dir /workspace/comunify/backend/src
  --reload-dir /workspace/core"
```

### Patch 4 — `comunify/backend/src/main.py` /health (si falta)

Espejo vitalia main.py:

```python
from fastapi import FastAPI
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    brand: str
    version: str

app = FastAPI(redirect_slashes=False)

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", brand="comunify", version="0.1.0")
```

### Patch 5 — `comunify/backend/alembic/env.py` DATABASE_URL swap (si falta)

```python
import os
# en run_migrations_online():
database_url = os.environ.get("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql+psycopg2://")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)
```

### Patch 6 — Root `docker-compose.dev.yml` init.sql (si falta `comunify_dev`)

Verificar que postgres service tiene init.sql que crea las 4 DBs:

```sql
CREATE DATABASE vitalia_dev;
CREATE DATABASE nicolify_dev;
CREATE DATABASE comunify_dev;
CREATE DATABASE lupulo_dev;
```

Si está montado vía `volumes: ./scripts/postgres-init.sql:/docker-entrypoint-initdb.d/init.sql:ro` → ya está. Si no → agregar.

## Verification gate (post-patches)

Smoke test análogo vitalia:

```bash
make dev-clean-comunify              # nuke volumes stale
make dev-comunify-tunnel             # rebuild + up
sleep 30
docker logs luana-dev-comunify_backend_dev-1 --tail 50   # uvicorn running 8003 + alembic head
docker logs luana-dev-comunify_frontend_dev-1 --tail 50  # next ready 3003
curl http://127.0.0.1:8003/health    # {"status":"ok","brand":"comunify","version":"0.1.0"}
curl http://127.0.0.1:3003/sign-in   # 200 + Clerk widget climbing-lioness-56
curl https://dev-app.comunifyagents.com/sign-in -L  # 200 via CF tunnel
docker exec luana-postgres-dev psql -U postgres -c "\l" | grep comunify_dev
docker exec luana-postgres-dev psql -U postgres -d comunify_dev -c "SELECT version_num FROM alembic_version;"  # head
```

Si los 7 checks pasan → state refining→done (skip refined/ready/developing/developed/reviewing per `.claude/rules/hotfix-repro-mandatory.md` hotfix track + repro_verified ratchet).

## Decisiones Chris pending

- [ ] Ratifica receta replicar mecánica (no necesita /architect — receta ya cementada en vitalia 07-merge.md)
- [ ] Autoriza cross-skill override (`/pm-luana` ejecuta patches) o handoff a `/dev-team` con builder-backend
- [ ] Hot-fix track (skip cadena ready/developing/etc) si los 12 pasos no introducen tradeoffs nuevos

## Referencias

- Receta canónica: `vitalia/docs/archive/2026/stories/vitalia-dev-stack-functional/07-merge.md`
- Checkpoint vitalia: `vitalia/docs/archive/2026/stories/vitalia-dev-stack-functional/checkpoint.md`
- Outcome platform parent: `docs/product/outcomes/dev-stack-cross-brand-fixes.md`
- Hotfix rule: `.claude/rules/hotfix-repro-mandatory.md`
- Anti-default-flip rule: NO aplica (no flips de flag side-effect)
