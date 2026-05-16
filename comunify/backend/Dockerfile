# comunify/backend/Dockerfile
# Build context: monorepo root (accede a core/ y comunify/backend/)
# Target dev: hot-reload + uv editable workspace via bind mount
# Target final: produccion estatica
#
# S-DOCKER-DEV-MULTIBRAND T-4 — 2026-05-15
# Port: 8003 (D6 port allocation)

ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=0 \
    UV_LINK_MODE=copy

# Instalar uv
RUN pip install --no-cache-dir uv==0.4.18

WORKDIR /workspace

# ── dev target ── (usado en comunify/docker-compose.dev.yml via bind mount)
FROM base AS dev

# En dev, el source viene via bind mount (no COPY).
# Pre-instalamos dependencias usando pyproject.toml del workspace raiz.
# El .venv es protegido por named volume en compose file.
COPY pyproject.toml uv.lock ./
COPY core/ ./core/
COPY comunify/backend/pyproject.toml ./comunify/backend/pyproject.toml

RUN uv sync --frozen --no-dev 2>/dev/null || uv sync --no-dev

WORKDIR /workspace/comunify/backend

EXPOSE 8003
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8003"]

# ── final target ── (produccion — usado por CI/CD)
FROM base AS final

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

COPY pyproject.toml uv.lock ./
COPY core/ ./core/
COPY comunify/backend/ ./comunify/backend/

RUN uv sync --frozen --no-dev --package luana-comunify-backend

WORKDIR /workspace/comunify/backend
RUN chown -R appuser:appuser /workspace
USER appuser

EXPOSE 8003
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8003/health')"
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8003"]
