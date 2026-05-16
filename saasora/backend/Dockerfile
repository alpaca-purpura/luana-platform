# saasora/backend/Dockerfile
# Placeholder minimo — SaaSora (SaaS y Productos Digitales vertical)
# NO tiene implementacion real. Usa src/main_placeholder.py con /health endpoint.
# La implementacion real llega en S-SAASORA-BOOTSTRAP (Story TBD, pendiente).
#
# Build context: monorepo root
# Port: 8005 (D6 port allocation)
#
# bootstrap brand topology — 2026-05-15
# Per guidelines F5: target dev MUST ser funcional (no comentado, no broken).
# Per guidelines F8: no referencias a codigo que no existe.

ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=0 \
    UV_LINK_MODE=copy

RUN pip install --no-cache-dir uv==0.4.18

WORKDIR /workspace

# ── dev target ──
FROM base AS dev

# Placeholder: instala dependencias minimas directamente (sin workspace completo)
# porque saasora/backend aun no es workspace member del pyproject.toml raiz.
COPY saasora/backend/pyproject.toml ./saasora/backend/pyproject.toml
COPY saasora/backend/src/ ./saasora/backend/src/

WORKDIR /workspace/saasora/backend

RUN uv pip install --system fastapi "uvicorn[standard]" starlette

EXPOSE 8005
CMD ["uvicorn", "src.main_placeholder:app", "--host", "0.0.0.0", "--port", "8005", "--reload"]

# ── final target ──
FROM base AS final

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

COPY saasora/backend/pyproject.toml ./saasora/backend/pyproject.toml
COPY saasora/backend/src/ ./saasora/backend/src/

WORKDIR /workspace/saasora/backend

RUN uv pip install --system fastapi "uvicorn[standard]" starlette

RUN chown -R appuser:appuser /workspace
USER appuser

EXPOSE 8005
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8005/health')"
CMD ["uvicorn", "src.main_placeholder:app", "--host", "0.0.0.0", "--port", "8005"]
