"""Comunify FastAPI application entry point.

Per 03-arch-be.md § 3 + 05-guidelines § 1.1:
  - FastAPI(redirect_slashes=False) MANDATORY (arch test enforces).
    Default True → 307 POST → Next.js drops body.
  - Comunify router mounted at /api/v1/comunify prefix.
  - Offer router mounted at /api/v1 prefix (offer endpoints per § 6.4).
  - No business logic here — thin mount only.

Arch tests verify:
  - redirect_slashes=False present in main.py app instantiation.
  - All endpoints have response_model= (PII gate).
"""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from src.modules.comunify.api.routes import offer_router, router as comunify_router
from src.modules.comunify.api.webhook_routes import webhook_router

# redirect_slashes=False is MANDATORY — Default True → 307 POST → Next.js drops body (DDD rule).
app = FastAPI(
    title="Comunify API",
    description=(
        "Comunify creator community vertical — Luana Platform brand bootstrap. Story 12 luana-comunify-bootstrap."
    ),
    version="0.1.0",
    redirect_slashes=False,
)


class HealthResponse(BaseModel):
    """Health-check response (cementado en comunify-dev-stack-functional bug 7 — espejo vitalia)."""

    status: str
    brand: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness probe — used by Docker healthcheck + tunnel verification."""
    return HealthResponse(status="ok", brand="comunify", version="0.1.0")


app.include_router(comunify_router)
# offer_router: /api/v1/offers/* (per 03-arch-be.md § 6.4 — no /comunify prefix)
app.include_router(offer_router)
# webhook_router: /api/v1/comunify/webhooks/* (T-be-9 — unauthenticated by Clerk, HMAC only)
app.include_router(webhook_router)
