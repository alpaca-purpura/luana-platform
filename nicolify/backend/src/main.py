"""Nicolify FastAPI application — Brand activa agentic-first (R0 rebuild 2026-05-29).

Agencias + Servicios B2B LatAm — equipo de agentes Revenue & Operaciones orquestados.
Historia: nicolify-r0-dev-stack (T-1 BE app foundation).

Architecture decisions (03-arch.md):
  - redirect_slashes=False OBLIGATORIO (arch test enforces, DDD rule — 307 POST kills body).
  - Engine IAM router montado verbatim en /api/v1/iam/users (AD-2 anti-duplication).
  - CERO /me local, CERO JWT verify local (consume luana_core_iam).
  - HealthResponse DTO con response_model= (PII gate, arch test enforces).
  - Abel router: /api/v1/abel (R1 · story nicolify-r1-abel-icp-buyer · T-BE-1)
"""

from __future__ import annotations

from fastapi import FastAPI
from luana_core_iam.api.routers import auth_router as iam_users
from pydantic import BaseModel

# Pilot B (config split) — hidrata config no-secreta de brand.yaml a os.environ.
# Side-effect import; el engine get_settings() es lazy, así que basta con cargarlo aquí
# antes del primer request. Ver src/config_bootstrap.py.
import src.config_bootstrap  # noqa: F401

# R1 T-BE-1: Abel module (ICP + Buyer + draft-first extraction stubs)
from src.modules.nicolify.abel.api.router import router as abel_router

# redirect_slashes=False es OBLIGATORIO — arch test test_main_app_config.py lo verifica.
# Default True → 307 POST → Next.js drops body (backend-ddd.md rule).
app = FastAPI(
    title="Nicolify API",
    description=(
        "Nicolify — Agencias + Servicios B2B LatAm. "
        "Equipo de agentes Revenue & Operaciones orquestados por Luana. "
        "Rebuild agentic-first (R0, 2026-05-29)."
    ),
    version="0.1.0",
    redirect_slashes=False,
)

# AD-2 — Engine IAM router montado verbatim (paridad vitalia main.py:52-57).
# CERO /me local — anti-duplication HARD. El engine provee 401 (sin token) y
# 403 (X-Tenant-ID ajeno). Arch test test_main_app_config.py verifica el mount.
app.include_router(
    iam_users.router,
    prefix="/api/v1/iam/users",
    tags=["IAM - Users"],
)

# R1 T-BE-1 · CONN notarized — abel module ICP + Buyer endpoints.
# Story: nicolify-r1-abel-icp-buyer · cap: abel/icp-buyer
app.include_router(
    abel_router,
    prefix="/api/v1/abel",
    tags=["abel"],
)


class HealthResponse(BaseModel):
    """Liveness probe response DTO.

    Exposición mínima: status + brand + version. Sin secretos, sin env vars,
    sin DSN ni ningún dato de infraestructura (arch test test_no_secret_leak.py).
    """

    status: str
    brand: str
    version: str


@app.get("/health", response_model=HealthResponse, tags=["meta"])
async def health() -> HealthResponse:
    """Liveness probe — usado por Docker HEALTHCHECK + smoke checks.

    Retorna {status:'ok', brand:'nicolify', version}. Sin auth requerida.
    Allowlist pública (Clerk middleware proxy.ts + Playwright smoke).
    """
    return HealthResponse(status="ok", brand="nicolify", version=app.version)


@app.get("/api/health", response_model=HealthResponse, tags=["meta"])
async def api_health() -> HealthResponse:
    """API-prefixed health endpoint — allowlist Clerk middleware + smoke.

    Idempotente: mismo payload que /health para compatibilidad.
    Usado por post_deploy_smoke + Clerk middleware public routes allowlist.
    Scenario 1 (stack-up-green) + Scenario 6 (smoke-green).
    """
    return HealthResponse(status="ok", brand="nicolify", version=app.version)
