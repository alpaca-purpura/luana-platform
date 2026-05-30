# nicolify/backend/Dockerfile
# Reescrito en T-5 (S-DOCKER-DEV-MULTIBRAND) para uv-workspace-friendly + hot-reload target.
# Build context: raiz del monorepo (accede a core/ y nicolify/backend/).
#
# CAMBIOS de T-5 vs Dockerfile legacy:
# - Reemplazado python -m venv /opt/venv + pip install → uv sync --frozen (D4)
# - Agregado target dev con hot-reload uvicorn --reload
# - Mantenido target final para produccion (no regresion)
# - WORKDIR cambiado a /workspace/nicolify/backend (consistencia con compose raiz)
# - Python 3.11 → 3.12 (alineado con workspace luana-platform)
# - Puerto 8001 (D6 port allocation) — el legacy usaba 8000
#
# S-DOCKER-DEV-MULTIBRAND T-5 — 2026-05-15

ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=0 \
    UV_LINK_MODE=copy

# Instalar dependencias del sistema para psycopg2/asyncpg
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar uv
RUN pip install --no-cache-dir uv==0.4.18

WORKDIR /workspace

# ── dev target ── (usado en nicolify/docker-compose.dev.yml via bind mount)
FROM base AS dev

# En dev, el source viene via bind mount (no COPY).
# Pre-instalamos dependencias usando pyproject.toml del workspace raiz.
# El .venv es protegido por named volume en compose file (D4).
COPY pyproject.toml uv.lock ./
COPY core/ ./core/
# nicolify/pyproject.toml = workspace member (declara deps runtime backend incl. uvicorn/alembic/engine).
# nicolify/backend/pyproject.toml = subproyecto aislado (mismo nombre luana-nicolify).
COPY nicolify/pyproject.toml ./nicolify/pyproject.toml
COPY nicolify/backend/pyproject.toml ./nicolify/backend/pyproject.toml

# `--package luana-nicolify` filtra al member que importa las runtime deps backend
# (uvicorn, sqlalchemy, asyncpg, alembic, luana_core_*). Sin --frozen porque el lock
# puede regenerarse si un member referenciado no está en el build context.
# Mismo patrón que vitalia/backend/Dockerfile.
RUN uv sync --no-dev --package luana-nicolify 2>&1

WORKDIR /workspace/nicolify/backend

EXPOSE 8001
# CMD sobreescrito en compose file (uvicorn --reload con --reload-dir)
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]

# ── final target ── (produccion — usado por CI/CD)
FROM base AS final

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser
RUN mkdir -p /home/appuser/.cache && chown -R appuser:appuser /home/appuser

COPY pyproject.toml uv.lock ./
COPY core/ ./core/
COPY nicolify/backend/ ./nicolify/backend/

RUN uv sync --frozen --no-dev --package luana-nicolify 2>/dev/null || \
    uv sync --frozen --no-dev

WORKDIR /workspace/nicolify/backend
RUN chown -R appuser:appuser /workspace
USER appuser

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -f http://localhost:8001/health || exit 1
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
