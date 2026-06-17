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
from luana_core_iam.api.routers import auth_router as iam_users
from pydantic import BaseModel

from src.modules.comunify.api.routes import offer_router
from src.modules.comunify.api.routes import router as comunify_router
from src.modules.comunify.api.webhook_routes import webhook_router

logger = structlog.get_logger(__name__)

# copilot_router: thin mount of engine core/luana-core-copilot /chat (comunify-shell-organism T-agentic).
# Unblocked 2026-06-17 by the engine "Settings lazy" fix (proposal 2026-06-16-copilot-chat-brand-mountable,
# e9f16d06): luana_core_platform now exposes ``@lru_cache get_settings()`` so importing the engine chat
# router no longer instantiates the legacy monolithic Settings at import-time. comunify (multibrand config:
# DATABASE_URL / QDRANT_HOST+PORT / LITELLM_*) mounts it cleanly. The try/except is KEPT as defense in depth
# — an optional engine mount must never crash brand boot — but the import now succeeds and the router mounts
# (verified: tests/modules/comunify/copilot/test_chat_mount.py 4-pass + live boot health 200).
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
# IAM router: /api/v1/iam/users/* (engine luana-core-iam — REUSE, no local /me stub).
# Enables GET /api/v1/iam/users/me/tenants used by the FE shell login→tenant resolution
# (useTenantId hook, mirrors vitalia/nicolify pattern). Unblocked 2026-06-17 by the
# engine Settings-lazy fix (proposal 2026-06-16-copilot-chat-brand-mountable, e9f16d06).
app.include_router(
    iam_users.router,
    prefix="/api/v1/iam/users",
    tags=["IAM - Users"],
)
# webhook_router: /api/v1/comunify/webhooks/* (T-be-9 — unauthenticated by Clerk, HMAC only)
app.include_router(webhook_router)
# copilot_router: /api/v1/comunify/copilot/chat (comunify-shell-organism T-agentic —
# thin reexport of engine core/luana-core-copilot /chat). Mounted when the import
# succeeded (guard above) — now active post engine Settings-lazy fix.
if copilot_router is not None:
    app.include_router(copilot_router, prefix="/api/v1/comunify/copilot", tags=["copilot"])
else:
    logger.warning("copilot_router_not_mounted", endpoint="/api/v1/comunify/copilot/chat")
