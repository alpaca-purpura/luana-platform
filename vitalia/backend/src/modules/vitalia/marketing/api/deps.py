"""FastAPI dependencies for the vitalia marketing API.

Provides:
  - TenantIdHeader / ClinicIdHeader — typed Annotated header aliases
  - verify_role() — dependency factory for RBAC enforcement (raises HTTP 403)
  - idempotency_key_dep() — dependency that reads Idempotency-Key header (raises HTTP 422)
  - get_clinic_context() — resolves Bearer JWT to ClinicContext (raises HTTP 401)

HIPAA-lite:
  - All marketing endpoints require X-Tenant-ID + X-Clinic-ID (dual filter).
  - Role enforcement uses JWT claims (role field from Clerk token).
  - Marketing data is NOT PHI — roles allowed: doctor/nurse/admin_clinic/recepcion
    for reads; admin_clinic/owner_clinic for mutations.

downstream-regression-na: brand-local marketing API deps (vitalia-only)
"""

from __future__ import annotations

from typing import Annotated

import structlog
from fastapi import Header, HTTPException

from src.modules.vitalia.iam.application.services.clinic_resolver import (
    ClinicContext,
    ClinicResolver,
    MissingAuthHeaderError,
)
from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
    ClerkJwtDecoder,
    JwtDecodeError,
)

logger = structlog.get_logger()

# ---------------------------------------------------------------------------
# Header type aliases — used on all marketing endpoints
# ---------------------------------------------------------------------------

TenantIdHeader = Annotated[str, Header(alias="X-Tenant-ID")]
ClinicIdHeader = Annotated[str, Header(alias="X-Clinic-ID")]
AuthorizationHeader = Annotated[str, Header(alias="Authorization")]
IdempotencyKeyHeader = Annotated[str | None, Header(alias="Idempotency-Key")] = None


def _build_resolver() -> ClinicResolver:
    """Construct a ClinicResolver with the Clerk JWT decoder."""
    return ClinicResolver(decoder=ClerkJwtDecoder())


def get_clinic_context(authorization: AuthorizationHeader) -> ClinicContext:
    """Resolve Bearer token to ClinicContext.

    Raises:
        HTTPException(401): Token missing or invalid.
    """
    token = authorization.removeprefix("Bearer ").strip()
    resolver = _build_resolver()
    try:
        return resolver.resolve(token)
    except MissingAuthHeaderError:
        raise HTTPException(
            status_code=401,
            detail="Token de autorización requerido.",
        )
    except JwtDecodeError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado.",
        )


def verify_role(*allowed_roles: str):
    """Dependency factory — returns a FastAPI dependency that enforces role membership.

    Usage:
        @router.get("/foo", dependencies=[Depends(verify_role("admin_clinic"))])

    Args:
        *allowed_roles: Roles allowed to access the endpoint.

    Returns:
        A sync dependency function that raises HTTP 403 when the caller role
        is not in the allowed set.
    """

    def _check(ctx: Annotated[ClinicContext, None] = None, authorization: AuthorizationHeader = None) -> None:  # type: ignore[assignment]
        """Inner dependency — resolves JWT and checks role."""
        if authorization is None:
            raise HTTPException(status_code=401, detail="Token de autorización requerido.")
        token = authorization.removeprefix("Bearer ").strip()
        resolver = _build_resolver()
        try:
            context = resolver.resolve(token)
        except MissingAuthHeaderError:
            raise HTTPException(status_code=401, detail="Token de autorización requerido.")
        except JwtDecodeError:
            raise HTTPException(status_code=401, detail="Token inválido o expirado.")

        if context.role not in allowed_roles:
            logger.warning(
                "marketing_api.role_denied",
                role=context.role,
                allowed=list(allowed_roles),
            )
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Acceso no autorizado. Tu rol '{context.role}' no tiene permisos "
                    f"para esta acción. Se requiere uno de: {list(allowed_roles)}."
                ),
            )

    return _check


def require_idempotency_key(idempotency_key: IdempotencyKeyHeader) -> str:
    """Dependency that enforces the Idempotency-Key header is present.

    Args:
        idempotency_key: Optional header value — raises 422 if missing.

    Returns:
        The idempotency key string.

    Raises:
        HTTPException(422): When Idempotency-Key header is absent.
    """
    if not idempotency_key:
        raise HTTPException(
            status_code=422,
            detail="El encabezado 'Idempotency-Key' es obligatorio para esta operación.",
        )
    return idempotency_key
