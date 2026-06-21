# cap: scheduling.mateo-agenda
# story-origin: TBD
"""Scheduling domain exceptions — vitalia brand-local.

Pure domain layer: no framework imports.

Per 03-arch A7 (SC-5 optimistic lock race condition prevention).
"""

from __future__ import annotations

from uuid import UUID


class SchedulingDomainError(Exception):
    """Base exception for vitalia scheduling domain errors."""


class BalanceAlreadyChargedError(SchedulingDomainError):
    """Raised when optimistic lock version mismatch is detected on charge.

    Indicates that another request already charged this payment record
    (balance_version changed between read and update attempt).

    Compensation: caller should reload the payment record and re-evaluate
    whether the charge is still needed (idempotency key lookup first).

    Per 03-arch A7 — SC-5 race condition prevention.
    """

    def __init__(
        self,
        payment_id: UUID,
        expected_version: int,
        message: str | None = None,
    ) -> None:
        self.payment_id = payment_id
        self.expected_version = expected_version
        default = (
            f"Payment {payment_id} already charged — "
            f"balance_version mismatch (expected {expected_version}). "
            "Check idempotency key before retrying."
        )
        super().__init__(message or default)


class AppointmentNotFoundError(SchedulingDomainError):
    """Raised when appointment is not found for the given tenant + clinic scope."""

    def __init__(
        self,
        appointment_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> None:
        self.appointment_id = appointment_id
        self.tenant_id = tenant_id
        self.clinic_id = clinic_id
        super().__init__(f"Appointment {appointment_id} not found for tenant={tenant_id}, clinic={clinic_id}")


class InvalidPresetFilterError(SchedulingDomainError):
    """Raised when an unknown preset filter value is supplied."""

    def __init__(self, value: str) -> None:
        self.value = value
        super().__init__(
            f"Invalid preset filter '{value}'. "
            "Valid values: hoy, por_confirmar_manana, reagendar_pendientes, "
            "no_shows_dia, saldos_pendientes"
        )


class NotificationBlockedError(SchedulingDomainError):
    """Raised when ComplianceService blocks an outbound notification.

    Per HIPAA-lite: ComplianceService.validate_outbound_message blocks
    messages containing PHI over non-encrypted channels (WhatsApp free tier,
    SMS plaintext, etc.).

    The blocked event is still audit-logged (suspicious access pattern).
    """

    def __init__(
        self,
        appointment_id: UUID | None = None,
        reason: str = "PHI detected in outbound channel",
    ) -> None:
        self.appointment_id = appointment_id
        self.reason = reason
        super().__init__(
            f"Notification blocked by compliance guard: {reason}. "
            "Use portal link instead of direct PHI in channel message."
        )


class FreeTextNotificationError(SchedulingDomainError):
    """Raised when a free-text message body is provided instead of template_id.

    Per HIPAA-lite + 03-arch § 5: only pre-approved template_id values are
    allowed in notifications. Free-text risks PHI leakage in channel body.
    """

    def __init__(self, detail: str = "template_id required; free text prohibited") -> None:
        super().__init__(detail)


class AppointmentStatusInvalidError(SchedulingDomainError):
    """Raised when a status transition is invalid for the current appointment state."""

    def __init__(self, current: str, requested: str) -> None:
        self.current = current
        self.requested = requested
        super().__init__(f"Cannot transition appointment from '{current}' to '{requested}'.")
