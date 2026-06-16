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

import structlog
from fastapi import FastAPI
from pydantic import BaseModel

from src.modules.comunify.api.routes import offer_router
from src.modules.comunify.api.routes import router as comunify_router
from src.modules.comunify.api.webhook_routes import webhook_router

logger = structlog.get_logger(__name__)

# copilot_router: thin mount of engine core/luana-core-copilot /chat (comunify-shell-organism T-agentic).
# ⚠️ BLOCKED — live-verify 2026-06-16: importing the engine chat router transitively instantiates the
# LEGACY monolithic ``luana_core_platform.core.config.Settings`` (POSTGRES_*/WHATSAPP_*/TRAEFIK_NETWORK/
# QDRANT_URL — "Visionarias Brain" pre-multibrand config). comunify is configured the multibrand way
# (DATABASE_URL / QDRANT_HOST+PORT / LITELLM_*) and never provides those → the import raised pydantic
# ValidationError at app boot and bricked the whole comunify BE. No brand actually thin-mounts the engine
# chat router (vitalia writes its OWN copilot routes). Guarded so an optional mount never crashes the
# brand app. Re-enable when the engine exposes a brand-mountable chat router (decision pending /pm-luana —
# see comunify/docs/product/stories/comunify-shell-organism/checkpoint.md § Blocker).
try:
    from src.modules.comunify.copilot.api import copilot_router
except Exception as exc:  # noqa: BLE001 — an optional engine mount must never crash brand app boot
    copilot_router = None
    logger.warning("copilot_mount_skipped", reason=str(exc))

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
# copilot_router: /api/v1/comunify/copilot/chat (comunify-shell-organism T-agentic —
# thin reexport of engine core/luana-core-copilot /chat). Mounted ONLY if the import
# succeeded (see guard above). BLOCKED on the engine legacy-config dependency.
if copilot_router is not None:
    app.include_router(copilot_router, prefix="/api/v1/comunify/copilot", tags=["copilot"])
else:
    logger.warning("copilot_router_not_mounted", endpoint="/api/v1/comunify/copilot/chat")
