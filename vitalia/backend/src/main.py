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

from src.modules.vitalia.api.routes import router as vitalia_router
from src.modules.vitalia.api.webhook_routes import webhook_router

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
