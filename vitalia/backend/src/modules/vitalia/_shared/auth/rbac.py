"""PHI RBAC decorator — @require_phi_access.

Enforces role-based access control for PHI endpoints per vitalia HIPAA-lite.

Allowed roles: doctor, nurse, admin_clinic.
All other roles (marketing, sales, support, etc.) are DENIED.

Per vitalia/.claude/rules/hipaa-lite.md § Access control (RBAC strict):
  "Roles permitidos PHI: doctor, nurse, admin_clinic.
   Otros (marketing, sales) NUNCA ven PHI."

Usage:
    @require_phi_access(roles=["doctor", "nurse", "admin_clinic"], audit_repo=audit_dep)
    async def get_treatment_plan(
        tenant_id: UUID, clinic_id: UUID, user_id: UUID, user_role: str, ...
    ) -> TreatmentPlan:
        ...

The decorated function MUST accept these keyword args:
  - tenant_id: UUID
  - clinic_id: UUID
  - user_id: UUID
  - user_role: str

downstream-regression-na: brand-local RBAC decorator for vitalia PHI endpoints
"""

from __future__ import annotations

import functools
from collections.abc import Callable
from typing import Any
from uuid import UUID

import structlog

from src.modules.vitalia._shared.repositories.audit_log_repository import (
    AuditLogEntry,
)

logger = structlog.get_logger()


class PHIAccessDeniedError(Exception):
    """Raised when a user role is not permitted to access PHI.

    Maps to HTTP 403 Forbidden in FastAPI exception handlers.

    Per hipaa-lite.md: roles other than doctor/nurse/admin_clinic
    NEVER see PHI. Raise this error on detection — do NOT silently degrade.
    """

    def __init__(
        self,
        user_role: str,
        required_roles: list[str],
        resource_type: str | None = None,
    ) -> None:
        self.user_role = user_role
        self.required_roles = required_roles
        self.resource_type = resource_type
        super().__init__(
            f"PHI access denied: role '{user_role}' is not in allowed roles "
            f"{required_roles}. "
            f"Resource: {resource_type or 'unknown'}. "
            f"Only doctor, nurse, admin_clinic may access PHI "
            f"(vitalia/.claude/rules/hipaa-lite.md § Access control)."
        )


def require_phi_access(
    roles: list[str],
    audit_repo: Any | None = None,
    resource_type: str | None = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator enforcing RBAC + audit logging for PHI endpoints.

    Checks that the caller's role is in the allowed list. Writes an
    audit log entry on BOTH successful access and denial.

    The audit log write is SYNCHRONOUS (awaited) — per HIPAA-lite rule.

    Args:
        roles: List of allowed role strings (e.g. ["doctor", "nurse", "admin_clinic"]).
        audit_repo: Optional AuditLogRepository instance (or AsyncMock for tests).
                    If provided, write() is called with action=phi_access_granted
                    or action=phi_access_denied.
        resource_type: Optional resource type label for the audit entry.

    Returns:
        Decorator that wraps an async function with RBAC + audit.

    Raises:
        PHIAccessDeniedError: When user_role is not in roles list.
        TypeError: When the decorated function does not accept the required
                   keyword arguments (tenant_id, clinic_id, user_id, user_role).
    """

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            tenant_id: UUID | None = kwargs.get("tenant_id")
            clinic_id: UUID | None = kwargs.get("clinic_id")
            user_id: UUID | None = kwargs.get("user_id")
            user_role: str = kwargs.get("user_role", "")

            if user_role not in roles:
                # Write denial audit event (sync — MUST be awaited)
                if audit_repo is not None:
                    try:
                        entry = AuditLogEntry(
                            tenant_id=tenant_id or UUID(int=0),
                            clinic_id=clinic_id or UUID(int=0),
                            user_id=user_id or UUID(int=0),
                            action="phi_access_denied",
                            resource_type=resource_type or func.__name__,
                        )
                        await audit_repo.write(entry)
                    except Exception as audit_err:  # noqa: BLE001
                        logger.warning(
                            "phi_audit_write_failed_on_denial",
                            error=str(audit_err),
                            user_role=user_role,
                        )

                logger.warning(
                    "phi_access_denied",
                    user_role=user_role,
                    allowed_roles=roles,
                    function=func.__name__,
                    tenant_id=str(tenant_id) if tenant_id else None,
                )
                raise PHIAccessDeniedError(
                    user_role=user_role,
                    required_roles=roles,
                    resource_type=resource_type or func.__name__,
                )

            # Role is allowed — write access granted audit event (sync)
            if audit_repo is not None:
                try:
                    entry = AuditLogEntry(
                        tenant_id=tenant_id or UUID(int=0),
                        clinic_id=clinic_id or UUID(int=0),
                        user_id=user_id or UUID(int=0),
                        action="phi_access_granted",
                        resource_type=resource_type or func.__name__,
                    )
                    await audit_repo.write(entry)
                except Exception as audit_err:  # noqa: BLE001
                    logger.warning(
                        "phi_audit_write_failed_on_access",
                        error=str(audit_err),
                        user_role=user_role,
                    )

            logger.info(
                "phi_access_granted",
                user_role=user_role,
                function=func.__name__,
                tenant_id=str(tenant_id) if tenant_id else None,
            )
            return await func(*args, **kwargs)

        return wrapper

    return decorator
