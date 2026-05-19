"""Vitalia FastAPI application entry point.

Per 03-arch-be.md § 3 + 05-guidelines § 1.1:
  - FastAPI(redirect_slashes=False) MANDATORY (arch test enforces).
    Default True → 307 POST → Next.js drops body.
  - Vitalia router mounted at /api/v1/vitalia prefix.
  - No business logic here — thin mount only.

Arch tests verify:
  - redirect_slashes=False present in main.py app instantiation.
  - All endpoints have response_model= (V-AE-2 PII gate).
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from src.modules.vitalia.api.routes import router as vitalia_router
from src.modules.vitalia.api.webhook_routes import webhook_router
from src.modules.vitalia.copilot.api.routes.wizard_onboarding_routes import (
    router as wizard_onboarding_router,
)
from src.modules.vitalia.crm.api.router import router as crm_router
from src.modules.vitalia.iam.api.router import router as iam_router

# redirect_slashes=False is MANDATORY — arch test test_vitalia_response_models_required.py
# also verifies this flag. Default True → 307 POST → Next.js drops body (DDD rule).
app = FastAPI(
    title="Vitalia API",
    description=(
        "Vitalia medical/dental/wellness clinic vertical — Luana Platform brand bootstrap. "
        "Story 11 luana-vitalia-bootstrap."
    ),
    version="0.1.0",
    redirect_slashes=False,
)

app.include_router(vitalia_router)
# T-be-8: 5 webhook receivers (Stripe + MercadoPago + Clerk + WhatsApp + ManyChat)
app.include_router(webhook_router)
# T-infra-9: IAM + CRM modules (Slice 1 scaffold)
app.include_router(iam_router, prefix="/api/v1/iam")
app.include_router(crm_router, prefix="/api/v1/crm")
# T-be-services-1: Valeria wizard onboarding (copilot)
app.include_router(wizard_onboarding_router, prefix="/api/v1/vitalia/onboarding")


class HealthResponse(BaseModel):
    """Liveness probe response DTO."""

    status: str
    brand: str
    version: str


@app.get("/health", response_model=HealthResponse, tags=["meta"])
async def health() -> HealthResponse:
    """Liveness probe — used by Docker HEALTHCHECK + smoke checks."""
    return HealthResponse(status="ok", brand="vitalia", version=app.version)


@app.get("/api/health", response_model=HealthResponse, tags=["meta"])
async def api_health() -> HealthResponse:
    """API-prefixed health endpoint — used by post_deploy_smoke.sh + Clerk middleware public routes.

    Clerk middleware whitelist includes /api/health (no redirect).
    Idempotent: returns same payload as /health for compatibility.
    T-5 vitalia-auth-base-functional — SC-17 post-deploy smoke verify.
    """
    return HealthResponse(status="ok", brand="vitalia", version=app.version)
