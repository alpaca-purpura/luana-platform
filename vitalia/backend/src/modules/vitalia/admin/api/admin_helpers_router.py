"""Vitalia Admin Helper API — internal endpoints for DB state verification.

These endpoints are consumed by:
  - Playwright E2E tests (admin-smoke project)
  - Streamlit admin health checks
  - Integration tests (verify audit_log rows written after admin mutations)

Security:
  - VITALIA_INTERNAL_API_TOKEN required in X-Internal-Token header
  - Token loaded from env var ONLY (never hardcoded)
  - NOT exposed in OpenAPI docs (include_in_schema=False)
  - These endpoints do NOT use Clerk auth (admin super-admin context)

HIPAA-lite:
  - No PHI returned in any response
  - Audit log verification returns count/exists — no payload content
  - Tenant isolation enforced (X-Tenant-ID header + tenant filter)
"""

from __future__ import annotations

import os
from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel

logger = structlog.get_logger()

router = APIRouter(tags=["admin-internal"])

_INTERNAL_TOKEN_SCHEME = APIKeyHeader(name="X-Internal-Token", auto_error=False)


def _require_internal_token(
    token: Annotated[str | None, Depends(_INTERNAL_TOKEN_SCHEME)] = None,
) -> None:
    """Dependency: validate VITALIA_INTERNAL_API_TOKEN from env.

    Raises 403 if token is missing or invalid.
    Raises 500 if VITALIA_INTERNAL_API_TOKEN env var is not set.
    """
    expected = os.environ.get("VITALIA_INTERNAL_API_TOKEN", "")
    if not expected:
        logger.error("vitalia_internal_token_not_configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "configuration_error", "message": "Internal token not configured."},
        )
    if not token or token != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "forbidden", "message": "Token interno requerido."},
        )


class AuditLogCountResponse(BaseModel):
    """Response for audit log count endpoint."""

    tenant_id: str
    action: str
    count: int


class TenantExistsResponse(BaseModel):
    """Response for tenant exists check endpoint."""

    tenant_id: str | None
    slug: str
    exists: bool


class ClinicExistsResponse(BaseModel):
    """Response for clinic exists check endpoint."""

    clinic_id: str | None
    tenant_id: str
    slug: str
    exists: bool


@router.get(
    "/audit-log/count",
    response_model=AuditLogCountResponse,
    include_in_schema=False,
)
async def get_audit_log_count(
    action: str,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    _: None = Depends(_require_internal_token),
) -> AuditLogCountResponse:
    """Count audit log rows for a tenant + action.

    Used by E2E tests to verify audit log was written after mutations.
    Returns count only — no payload content (HIPAA).
    """
    from luana_core_platform.core.database import get_db  # noqa: PLC0415
    from sqlalchemy import text  # noqa: PLC0415

    try:
        async for db in get_db():
            result = await db.execute(
                text("""
                    SELECT COUNT(*) FROM vitalia_audit_log
                    WHERE tenant_id = :tenant_id::uuid
                      AND action = :action
                """),
                {"tenant_id": tenant_id, "action": action},
            )
            count_val = result.scalar() or 0
            break
    except Exception as exc:  # noqa: BLE001
        logger.error("admin_helpers_audit_count_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "db_error", "message": str(exc)},
        ) from exc

    return AuditLogCountResponse(tenant_id=tenant_id, action=action, count=int(count_val))


@router.get(
    "/tenants/exists",
    response_model=TenantExistsResponse,
    include_in_schema=False,
)
async def check_tenant_exists(
    slug: str,
    _: None = Depends(_require_internal_token),
) -> TenantExistsResponse:
    """Check if a tenant with given slug exists in the engine IAM table.

    Used by E2E tests to verify admin create operations succeeded.
    """
    from luana_core_platform.core.database import get_db  # noqa: PLC0415

    try:
        async for db in get_db():
            # TenantRepository uses sync Session; adapt for async context
            from luana_core_iam.infrastructure.models.tenant_model import TenantModel  # noqa: PLC0415
            from sqlalchemy import select  # noqa: PLC0415

            result = await db.execute(select(TenantModel).where(TenantModel.slug == slug))
            model = result.scalars().first()
            break
    except Exception as exc:  # noqa: BLE001
        logger.error("admin_helpers_tenant_exists_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "db_error", "message": str(exc)},
        ) from exc

    return TenantExistsResponse(
        tenant_id=str(model.id) if model else None,
        slug=slug,
        exists=model is not None,
    )


@router.get(
    "/clinics/exists",
    response_model=ClinicExistsResponse,
    include_in_schema=False,
)
async def check_clinic_exists(
    slug: str,
    tenant_id: str = Header(alias="X-Tenant-ID"),
    _: None = Depends(_require_internal_token),
) -> ClinicExistsResponse:
    """Check if a clinic branch with given slug exists for tenant.

    Used by E2E tests to verify clinic create operations succeeded.
    HIPAA: tenant_id filter enforced (dual filter with slug).
    """
    from luana_core_platform.core.database import get_db  # noqa: PLC0415
    from sqlalchemy import select  # noqa: PLC0415

    from src.modules.vitalia.clinics.infrastructure.models.clinic_model import (  # noqa: PLC0415
        ClinicModel,
    )

    try:
        async for db in get_db():
            result = await db.execute(
                select(ClinicModel)
                .where(ClinicModel.tenant_id == UUID(tenant_id))
                .where(ClinicModel.slug == slug)
                .where(ClinicModel.deleted_at.is_(None))
            )
            model = result.scalars().first()
            break
    except Exception as exc:  # noqa: BLE001
        logger.error("admin_helpers_clinic_exists_error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "db_error", "message": str(exc)},
        ) from exc

    return ClinicExistsResponse(
        clinic_id=str(model.id) if model else None,
        tenant_id=tenant_id,
        slug=slug,
        exists=model is not None,
    )
