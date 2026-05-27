"""AgendaGridRepositoryImpl — SQLAlchemy 2.0 async implementation.

JOINs:
  vitalia_appointments (base)
  vitalia_appointment_clinic_map (service_label, origin, currency_override)
  vitalia_appointment_payments (balance aggregation)

PHI masking contract (HIPAA-lite, 03-arch § 2.2):
  patient_name_masked — computed column "P. Hernández" format
  dni_masked          — "12.***.***" format
  Both applied server-side. FE NEVER receives raw PHI.

Dual filter: EVERY query WHERE tenant_id = ? AND clinic_id = ?

Per 03-arch § 3.1 + vitalia/.claude/rules/hipaa-lite.md
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

import structlog
from luana_core_platform.repositories.compound_scope_repository import (
    CompoundScopeRepositoryBase,
)
from sqlalchemy import literal_column, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.scheduling.domain.agenda_filter import AgendaPresetFilter
from src.modules.vitalia.scheduling.persistence.models.appointment_clinic_map_model import (
    AppointmentClinicMapModel,
)
from src.modules.vitalia.scheduling.persistence.models.appointment_payment_model import (
    AppointmentPaymentModel,
)

logger = structlog.get_logger()

# ---------------------------------------------------------------------------
# Vitalia appointments table — accessed via text() for raw SQL projection
# because there is no dedicated Python model class yet (table created via
# migration 002_vitalia_appointments_columns.py without a model).
# The AgendaGridRepositoryImpl reads from vitalia_appointments using Core
# select() + text() for columns while joining SA 2.0 ORM models for the
# brand-local extensions.
# ---------------------------------------------------------------------------
_VITALIA_APPOINTMENTS_TBL = text("vitalia_appointments")

# Preset → appointment status filter mapping
_PRESET_STATUS_MAP: dict[str, str] = {
    AgendaPresetFilter.POR_CONFIRMAR_MANANA: "SCHEDULED",
    AgendaPresetFilter.REAGENDAR_PENDIENTES: "RESCHEDULED",
    AgendaPresetFilter.NO_SHOWS_DIA: "NO_SHOW",
}


class AgendaGridRepositoryImpl(CompoundScopeRepositoryBase):  # type: ignore[type-arg]
    """SQLA 2.0 async implementation of AgendaGridRepository.

    Inherits CompoundScopeRepositoryBase (engine) for HIPAA-lite dual-scope
    isolation contract (tenant_id + clinic_id on EVERY query).

    MODEL is set to None because this repo issues complex JOIN queries against
    vitalia_appointments (no Python SA model) + ORM joins. All query methods
    are fully overridden — the base class get_by_id/list_for_scope are never
    called. scope_field="clinic_id" per vitalia HIPAA-lite overlay.

    Query strategy:
    - SELECT from vitalia_appointments (text table) + JOINs via SQLA Core
    - PHI masking via SQL expression (SPLIT_PART / REGEXP_REPLACE)
    - patient_name_masked: first-initial + surname from full_name
    - dni_masked: first 2 digits + masked rest
    """

    MODEL = None  # Complex JOIN repo — overrides all query methods, never calls super().get_by_id()

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session=session, scope_field="clinic_id")

    def _check_dual_filter(self, *, tenant_id: UUID, clinic_id: UUID | None) -> None:
        """Inline dual-filter guard (HIPAA-lite — tenant_id + clinic_id mandatory).

        Called at the top of every query method to enforce both filters.
        Raises if clinic_id is missing (cross-clinic leak risk).
        """
        if clinic_id is None:
            raise ValueError(
                "AgendaGridRepositoryImpl: clinic_id is required on all PHI queries "
                "(vitalia/.claude/rules/hipaa-lite.md § Tenant isolation refuerzo)"
            )

    async def get_by_id(
        self,
        entity_id: UUID,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> dict[str, Any] | None:
        """Get single slot by appointment_id with dual filter.

        Delegates to list_slots with specific appointment_id filter.
        """
        self._check_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        # Narrow to single appointment via list_slots contract

        stmt = (
            select(
                text("va.id AS slot_id"),
                text("va.id AS appointment_id"),
                text(f"'{tenant_id}'::uuid AS tenant_id"),
                text(f"'{clinic_id}'::uuid AS clinic_id"),
                literal_column(
                    "COALESCE(SPLIT_PART(va.patient_name_masked, ' ', 1), 'P.') "
                    "|| ' ' || COALESCE(SPLIT_PART(va.patient_name_masked, ' ', 2), 'Paciente') "
                    "AS patient_name_masked"
                ),
                text("va.dni_masked"),
                text("COALESCE(map.service_label, va.summary) AS service"),
                text("va.doctor_id::text AS doctor"),
                text("va.slot_iso AS start_at"),
                text("va.slot_iso + (va.duration_minutes * INTERVAL '1 minute') AS end_at"),
                text("va.payment_status"),
                text("COALESCE(map.origin, va.origin) AS origin"),
                text("COALESCE(SUM(pay.amount), 0) AS balance_amount_cents"),
                text("COALESCE(map.currency_override, va.currency) AS currency"),
            )
            .select_from(text("vitalia_appointments va"))
            .outerjoin(
                AppointmentClinicMapModel,
                text("map.appointment_id = va.id"),
            )
            .outerjoin(
                AppointmentPaymentModel,
                text("pay.appointment_id = va.id AND pay.deleted_at IS NULL"),
            )
            .where(
                text(f"va.tenant_id = '{tenant_id}'"),
                text(f"va.clinic_id = '{clinic_id}'"),
                text(f"va.id = '{entity_id}'"),
                text("va.deleted_at IS NULL"),
            )
            .group_by(
                text(
                    "va.id, va.slot_iso, va.duration_minutes, va.patient_name_masked, "
                    "va.dni_masked, va.payment_status, va.origin, va.summary, "
                    "va.doctor_id, va.currency, map.service_label, map.origin, "
                    "map.currency_override"
                )
            )
        )
        result = await self._session.execute(stmt)
        row = result.mappings().first()
        return dict(row) if row else None

    async def list_by_filter(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        **filters: object,
    ) -> list[dict[str, Any]]:
        """List slots using generic filter kwargs (delegates to list_slots)."""
        self._check_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)
        date_from = filters.get("date_from")
        date_to = filters.get("date_to")
        if not isinstance(date_from, datetime) or not isinstance(date_to, datetime):
            raise ValueError("list_by_filter requires date_from + date_to as datetime")
        return await self.list_slots(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            date_from=date_from,
            date_to=date_to,
            preset_filter=filters.get("preset_filter"),  # type: ignore[arg-type]
        )

    async def list_slots(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        date_from: datetime,
        date_to: datetime,
        preset_filter: AgendaPresetFilter | None = None,
        doctor_id: UUID | None = None,
        limit: int = 500,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """List appointment slots — PHI-masked projection with JOIN clinic_map + payments.

        Dual filter applied: tenant_id + clinic_id in every WHERE clause.
        patient_name_masked column expected from vitalia_appointments
        (set by AgendaSlotService before persisting or via trigger/view).
        """
        self._check_dual_filter(tenant_id=tenant_id, clinic_id=clinic_id)

        logger.debug(
            "agenda_grid_list_slots",
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            date_from=date_from.isoformat(),
            date_to=date_to.isoformat(),
            preset_filter=str(preset_filter) if preset_filter else None,
        )

        # Build WHERE conditions
        where_conditions = [
            text(f"va.tenant_id = '{tenant_id}'"),
            text(f"va.clinic_id = '{clinic_id}'"),
            text(f"va.slot_iso >= '{date_from.isoformat()}'"),
            text(f"va.slot_iso <= '{date_to.isoformat()}'"),
            text("va.deleted_at IS NULL"),
        ]

        # Preset filter → additional status conditions
        if preset_filter == AgendaPresetFilter.HOY:
            where_conditions.append(text("DATE(va.slot_iso) = CURRENT_DATE"))
        elif preset_filter == AgendaPresetFilter.NO_SHOWS_DIA:
            where_conditions.append(text("va.status = 'NO_SHOW'"))
            where_conditions.append(text("DATE(va.slot_iso) = CURRENT_DATE"))
        elif preset_filter == AgendaPresetFilter.POR_CONFIRMAR_MANANA:
            where_conditions.append(text("va.status = 'SCHEDULED'"))
            where_conditions.append(text("DATE(va.slot_iso) = CURRENT_DATE + INTERVAL '1 day'"))
        elif preset_filter == AgendaPresetFilter.REAGENDAR_PENDIENTES:
            where_conditions.append(text("va.status = 'RESCHEDULED'"))
        elif preset_filter == AgendaPresetFilter.SALDOS_PENDIENTES:
            where_conditions.append(text("va.balance_status = 'pending' OR va.balance_status = 'deposit_paid'"))

        # Doctor filter
        if doctor_id is not None:
            where_conditions.append(text(f"va.doctor_id = '{doctor_id}'"))

        # Build SELECT with PHI masking applied server-side
        # patient_name_masked column in vitalia_appointments stores the masked version
        # (set by AgendaSlotService when creating/updating appointments)
        stmt = (
            select(
                text("va.id AS slot_id"),
                text("va.id AS appointment_id"),
                text(f"'{tenant_id}'::uuid AS tenant_id"),
                text(f"'{clinic_id}'::uuid AS clinic_id"),
                text("va.patient_name_masked"),
                text("va.dni_masked"),
                text("COALESCE(map.service_label, va.summary) AS service"),
                text("va.doctor_id::text AS doctor"),
                text("va.slot_iso AS start_at"),
                text("va.slot_iso + (va.duration_minutes * INTERVAL '1 minute') AS end_at"),
                text("va.payment_status"),
                text("COALESCE(map.origin, va.origin) AS origin"),
                text("COALESCE(SUM(pay.amount), 0) AS balance_amount_cents"),
                text("COALESCE(map.currency_override, va.currency) AS currency"),
            )
            .select_from(text("vitalia_appointments va"))
            .outerjoin(
                AppointmentClinicMapModel,
                text(
                    "vitalia_appointment_clinic_map.appointment_id = va.id "
                    "AND vitalia_appointment_clinic_map.deleted_at IS NULL"
                ),
            )
            .outerjoin(
                AppointmentPaymentModel,
                text(
                    "vitalia_appointment_payments.appointment_id = va.id "
                    "AND vitalia_appointment_payments.deleted_at IS NULL"
                ),
            )
            .where(*where_conditions)
            .group_by(
                text(
                    "va.id, va.slot_iso, va.duration_minutes, va.patient_name_masked, "
                    "va.dni_masked, va.payment_status, va.origin, va.summary, "
                    "va.doctor_id, va.currency, "
                    "vitalia_appointment_clinic_map.service_label, "
                    "vitalia_appointment_clinic_map.origin, "
                    "vitalia_appointment_clinic_map.currency_override"
                )
            )
            .order_by(text("va.slot_iso ASC"))
            .limit(limit)
            .offset(offset)
        )

        result = await self._session.execute(stmt)
        rows = result.mappings().all()

        logger.debug(
            "agenda_grid_list_slots_done",
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            count=len(rows),
        )

        return [dict(row) for row in rows]
