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
from luana_core_iam.api.routers import auth_router as iam_users
from pydantic import BaseModel

from src.modules.vitalia.admin.api.admin_helpers_router import router as admin_helpers_router
from src.modules.vitalia.api.routes import router as vitalia_router
from src.modules.vitalia.api.webhook_routes import webhook_router
from src.modules.vitalia.brand_studio.api.routers.marca_router import router as marca_router
from src.modules.vitalia.clinics.api.router import router as clinics_router
from src.modules.vitalia.copilot.api.routes.wizard_onboarding_routes import (
    router as wizard_onboarding_router,
)
from src.modules.vitalia.crm.api.router import router as crm_router
from src.modules.vitalia.fidelizacion.api.router import fidelizacion_router
from src.modules.vitalia.fiscal.api.emit_router import router as emit_router
from src.modules.vitalia.inbox.api.router import router as inbox_router
from src.modules.vitalia.marketing.api.routes import router as marketing_router
from src.modules.vitalia.payments.api.charge_router import router as charge_router
from src.modules.vitalia.scheduling.api.agenda_router import router as agenda_router
from src.modules.vitalia.scheduling.api.notify_router import router as notify_router

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
# F1-S9: REUSE core IAM auth router (anti-duplication — deleted vitalia local /me stub).
app.include_router(
    iam_users.router,
    prefix="/api/v1/iam/users",
    tags=["IAM - Users"],
)
app.include_router(crm_router, prefix="/api/v1/crm")
# T-be-services-1: Valeria wizard onboarding (copilot)
app.include_router(wizard_onboarding_router, prefix="/api/v1/vitalia/onboarding")
# T-be-clinics-extension: Clinic branches CRUD (brand extension)
app.include_router(clinics_router, prefix="/api/v1/vitalia/clinics")
# T-be-clinics-extension: Admin helper API (internal, not in OpenAPI schema)
app.include_router(admin_helpers_router, prefix="/api/v1/vitalia/admin")
# T-inbox-be-5: Inbox module — 8 endpoints (send, retract, mode, pause, tools, activity, transcribe, proactive)
app.include_router(inbox_router, prefix="/api/v1/vitalia/inbox")
# T-7 fidelizacion: 9 API endpoints (re_engagement + nps + summary + activity_stream)
app.include_router(fidelizacion_router, prefix="/api/v1/vitalia/fidelizacion")
# T-mk-be-5: Marketing module — 11 endpoints (bowtie + channel + recommendations + attribution + referrals)
app.include_router(marketing_router, prefix="/api/v1/vitalia/marketing")
# T-6 F2-S1: Scheduling agenda router — 5 endpoints (grid, aggregates, detail, create, patch_status)
app.include_router(agenda_router, prefix="/api/v1/scheduling")
# T-8 F2-S1: Scheduling notify — template-only WhatsApp + ComplianceService guard + audit log
app.include_router(notify_router, prefix="/api/v1/scheduling")
# T-7 F2-S1: Payments charge router — CobrarSaldo saga (payment + fiscal + audit + idempotency)
app.include_router(charge_router, prefix="/api/v1/payments")
# T-7 F2-S1: Fiscal emit router — standalone fiscal emission retry (saga compensation A6)
app.include_router(emit_router, prefix="/api/v1/fiscal")
# T-2 F2-S7: Brand Studio marca router — 21 endpoints Lisa > Marca sub-tab
app.include_router(marca_router, prefix="/api/v1/lisa/marca", tags=["brand_studio"])


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
