# cap: scheduling.valeria-agenda
# story-origin: TBD
"""AppointmentDetailRepository — appointment detail view with PHI masking.

Returns full detail projection for the appointment drawer (right panel):
  - PHI-masked patient name + DNI
  - Service label from clinic_map
  - Payment history (list of payments)
  - Doctor + slot + status

Dual filter HIPAA: EVERY query filters tenant_id + clinic_id.
PHI masking: patient_name_masked + dni_masked (server-side).

Per 03-arch § 3.2 + vitalia/.claude/rules/hipaa-lite.md
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import structlog
from luana_core_platform.repositories.compound_scope_repository import (
    CompoundScopeRepositoryBase,
)
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.scheduling.persistence.models.appointment_clinic_map_model import (
    AppointmentClinicMapModel,
)
from src.modules.vitalia.scheduling.persistence.models.appointment_payment_model import (
    AppointmentPaymentModel,
)

logger = structlog.get_logger()


class AppointmentDetailRepository(CompoundScopeRepositoryBase):  # type: ignore[type-arg]
    """Async repository for appointment detail views.

    Inherits CompoundScopeRepositoryBase (engine) for HIPAA-lite dual-scope
    isolation (tenant_id + clinic_id). MODEL is None because this repo issues
    JOIN queries across vitalia_appointments (no Python SA model) + ORM models.
    All query methods are fully overridden. scope_field="clinic_id".

    Detail view = appointment + clinic_map (service + origin) + payment history.
    """

    MODEL = None  # Complex JOIN repo — all query methods overridden, never calls super().get_by_id()

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session=session, scope_field="clinic_id")

    async def get_by_id(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> dict[str, Any] | None:
        """Get appointment detail by ID with dual filter + PHI masking.

        Args:
            entity_id: Appointment UUID.
            tenant_id: Tenant UUID (dual filter key 1).
            clinic_id: Clinic UUID (HIPAA-lite dual filter key 2).

        Returns:
            Appointment detail dict with PHI-masked fields, or None if not found.
        """
        if clinic_id is None:
            raise ValueError("AppointmentDetailRepository: clinic_id required (HIPAA-lite dual filter)")

        logger.info(
            "appointment_detail_get",
            appointment_id=str(entity_id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
        )

        stmt = (
            select(
                text("va.id AS appointment_id"),
                text(f"'{tenant_id}'::uuid AS tenant_id"),
                text(f"'{clinic_id}'::uuid AS clinic_id"),
                text("va.patient_name_masked"),
                text("va.dni_masked"),
                text("va.patient_id"),
                text("COALESCE(map.service_label, va.summary) AS service"),
                text("va.doctor_id"),
                text("va.slot_iso AS start_at"),
                text("va.slot_iso + (va.duration_minutes * INTERVAL '1 minute') AS end_at"),
                text("va.duration_minutes"),
                text("va.status"),
                text("va.payment_status"),
                text("COALESCE(map.origin, va.origin) AS origin"),
                text("COALESCE(map.currency_override, va.currency) AS currency"),
                text("va.booking_metadata"),
                text("va.created_at"),
                text("va.updated_at"),
            )
            .select_from(text("vitalia_appointments va"))
            .outerjoin(
                AppointmentClinicMapModel,
                text(
                    "vitalia_appointment_clinic_map.appointment_id = va.id "
                    "AND vitalia_appointment_clinic_map.deleted_at IS NULL"
                ),
            )
            .where(
                text(f"va.tenant_id = '{tenant_id}'"),
                text(f"va.clinic_id = '{clinic_id}'"),
                text(f"va.id = '{entity_id}'"),
                text("va.deleted_at IS NULL"),
            )
        )

        result = await self._session.execute(stmt)
        row = result.mappings().first()
        if row is None:
            return None
        detail = dict(row)

        # Fetch payment history
        payments = await self._get_payments(
            appointment_id=entity_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
        )
        detail["payments"] = payments

        return detail

    async def list_by_filter(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        **filters: object,
    ) -> list[dict[str, Any]]:
        """List appointments by filter (stub — use AgendaGridRepository for grid queries)."""
        if clinic_id is None:
            raise ValueError("AppointmentDetailRepository: clinic_id required (HIPAA-lite dual filter)")
        return []

    async def _get_payments(
        self,
        appointment_id: UUID,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> list[dict[str, Any]]:
        """Fetch payment records for an appointment (dual filter applied)."""
        stmt = (
            select(AppointmentPaymentModel)
            .where(
                AppointmentPaymentModel.appointment_id == appointment_id,
                AppointmentPaymentModel.tenant_id == tenant_id,
                AppointmentPaymentModel.clinic_id == clinic_id,
                AppointmentPaymentModel.deleted_at.is_(None),
            )
            .order_by(AppointmentPaymentModel.created_at.asc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [
            {
                "id": str(m.id),
                "amount": m.amount,
                "currency": m.currency,
                "method": m.method,
                "external_payment_id": m.external_payment_id,
                "fiscal_doc_id": str(m.fiscal_doc_id) if m.fiscal_doc_id else None,
                "notes": m.notes,
                "balance_version": m.balance_version,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in models
        ]
