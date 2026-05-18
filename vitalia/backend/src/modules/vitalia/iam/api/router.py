"""Vitalia IAM API router — GET /api/v1/iam/me.

API layer — thin: validate headers → call resolver → map exceptions → response.
No business logic here.

response_model= is MANDATORY on every endpoint (PII gate + arch fitness).
redirect_slashes=False is set on the FastAPI *app* in main.py, NOT here.
"""

from __future__ import annotations

from typing import Annotated

import structlog
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict

from src.modules.vitalia.iam.application.services.clinic_resolver import (
    ClinicResolver,
    MissingAuthHeaderError,
)
from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
    ClerkJwtDecoder,
    JwtDecodeError,
)

logger = structlog.get_logger()

router = APIRouter(tags=["iam"])


class MeResponse(BaseModel):
    """Response model for GET /iam/me — PII allowlist enforced via response_model=."""

    model_config = ConfigDict(from_attributes=True)

    user_id: str
    tenant_id: str
    clinic_id: str
    role: str
    email: str
    name: str


def _get_resolver() -> ClinicResolver:
    """Create a ClinicResolver with the default decoder.

    Slice 1: uses ClerkJwtDecoder stub.
    Slice 2: inject production Clerk JWKS decoder.
    """
    return ClinicResolver(decoder=ClerkJwtDecoder())


AuthorizationHeader = Annotated[str, Header(alias="Authorization")]
TenantIdHeader = Annotated[str, Header(alias="X-Tenant-ID")]
OptionalClinicIdHeader = Annotated[str | None, Header(alias="X-Clinic-ID")]


@router.get("/me", response_model=MeResponse)
async def get_me(
    authorization: AuthorizationHeader,
    x_tenant_id: TenantIdHeader,
    x_clinic_id: OptionalClinicIdHeader = None,
) -> MeResponse:
    """Return the current authenticated user context.

    Parses the Authorization bearer token to resolve tenant + clinic + role.

    Args:
        authorization: Bearer token (format: "Bearer stub:...").
        x_tenant_id: Tenant ID from X-Tenant-ID header.
        x_clinic_id: Optional Clinic ID from X-Clinic-ID header.

    Returns:
        MeResponse with user identity fields (PII allowlisted via response_model).

    Raises:
        401: If Authorization header is missing or token cannot be decoded.
        422: If required headers are missing (FastAPI validation).
    """
    # Strip "Bearer " prefix if present
    token = authorization.removeprefix("Bearer ").strip()

    resolver = _get_resolver()
    try:
        ctx = resolver.resolve(token)
    except MissingAuthHeaderError as exc:
        logger.warning("iam.me.missing_auth", error=str(exc))
        raise HTTPException(status_code=401, detail="Token de autorización requerido.")
    except JwtDecodeError as exc:
        logger.warning("iam.me.decode_error", error=str(exc))
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    logger.info(
        "iam.me.resolved",
        user_id=ctx.user_id,
        tenant_id=str(ctx.tenant_id),
        role=ctx.role,
    )

    return MeResponse(
        user_id=ctx.user_id,
        tenant_id=str(ctx.tenant_id),
        clinic_id=str(ctx.clinic_id),
        role=ctx.role,
        email=ctx.email,
        name=ctx.name,
    )
