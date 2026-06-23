# cap: scheduling.mateo-agenda
"""AvailabilityQueryRepository — concrete implementation of AvailabilitySourcePort.

Data sources:
  get_working_hours → vitalia_availability_slots (slot_date, start_ts, end_ts)
    created by AvailabilityProjectionService from clinics availability blocks.
    Filter: tenant_id + clinic_id + doctor_id + slot_date (dual filter L1+L2).
    Deleted slots excluded (deleted_at IS NULL).

  get_busy_ranges → vitalia_appointment_clinic_map (start_time, end_time, status)
    Mirror columns added by migration 050 (T-BE-2).
    Filter: tenant_id + clinic_id + doctor_id + start_time::date (dual filter).
    Excludes CANCELLED (RN-6 — cancelled slots must not block availability).
    Excludes deleted rows (deleted_at IS NULL).

  list_active_doctors → raw SQL over vitalia_appointment_clinic_map distinct doctor_id
    Uses DoctorService.list_active (read-only, no PHI in result).

HIPAA-lite: every query dual-filters tenant_id + clinic_id (hipaa-lite.md).
PHI: NO patient PHI in any query or result here. Availability = scheduling metadata only.

03-arch-be.md § 5 + D-B port pattern.
"""

from __future__ import annotations

from datetime import date
from uuid import UUID

import structlog
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.clinics.infrastructure.models.availability_slot_model import (
    VitaliaAvailabilitySlotModel,
)
from src.modules.vitalia.scheduling.domain.availability_check import TimeRange
from src.modules.vitalia.scheduling.persistence.models.appointment_clinic_map_model import (
    AppointmentClinicMapModel,
)

logger = structlog.get_logger()

# Appointment statuses that block a slot (all except CANCELLED — RN-6)
_BLOCKING_STATUSES: frozenset[str] = frozenset({"SCHEDULED", "CONFIRMED", "COMPLETED", "NO_SHOW"})


class AvailabilityQueryRepository:
    """Read-only implementation of AvailabilitySourcePort.

    All queries use SQLAlchemy 2.0 select() patterns (no session.query()).
    Dual filter applied on every method (tenant_id + clinic_id).
    """

    def __init__(self, *, session: AsyncSession) -> None:
        """Initialise with SQLAlchemy async session.

        Args:
            session: Bound async DB session (injected by FastAPI dependency).
        """
        self._session = session

    async def get_working_hours(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        doctor_id: UUID,
        day: date,
    ) -> list[TimeRange]:
        """Return working-hour windows from vitalia_availability_slots.

        Reads materialized slots projected by AvailabilityProjectionService
        (clinics module). Does NOT import clinics domain directly — consumes
        the pre-projected table (D-B pattern, 03-arch-be.md § 4).

        Args:
            tenant_id: Tenant scope (dual filter L1).
            clinic_id: Clinic scope (dual filter L2 — HIPAA-lite).
            doctor_id: Doctor whose working blocks to read.
            day: Calendar date to query.

        Returns:
            List of TimeRange objects for working windows. Empty = no schedule.
        """
        stmt = (
            select(
                VitaliaAvailabilitySlotModel.start_ts,
                VitaliaAvailabilitySlotModel.end_ts,
            )
            .where(
                VitaliaAvailabilitySlotModel.tenant_id == tenant_id,
                VitaliaAvailabilitySlotModel.clinic_id == clinic_id,
                VitaliaAvailabilitySlotModel.doctor_id == doctor_id,
                VitaliaAvailabilitySlotModel.slot_date == day,
                VitaliaAvailabilitySlotModel.deleted_at.is_(None),
            )
            .order_by(VitaliaAvailabilitySlotModel.start_ts)
        )

        rows = (await self._session.execute(stmt)).all()

        logger.debug(
            "availability_working_hours_loaded",
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            doctor_id=str(doctor_id),
            day=str(day),
            count=len(rows),
        )

        return [TimeRange(start=row.start_ts, end=row.end_ts) for row in rows]

    async def get_busy_ranges(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        doctor_id: UUID,
        day: date,
    ) -> list[TimeRange]:
        """Return booked appointment ranges from vitalia_appointment_clinic_map.

        Uses mirror columns (start_time, end_time, status) added in migration 050.
        Excludes CANCELLED appointments (RN-6: cancelled slots don't block).

        Args:
            tenant_id: Tenant scope (dual filter L1).
            clinic_id: Clinic scope (dual filter L2 — HIPAA-lite).
            doctor_id: Doctor whose booked slots to read.
            day: Calendar date to query.

        Returns:
            List of TimeRange objects for booked appointments (non-cancelled).
        """
        # Cast start_time::date for day-range query (mirror column is UTC datetime)
        stmt = (
            select(
                AppointmentClinicMapModel.start_time,
                AppointmentClinicMapModel.end_time,
            )
            .where(
                AppointmentClinicMapModel.tenant_id == tenant_id,
                AppointmentClinicMapModel.clinic_id == clinic_id,
                AppointmentClinicMapModel.doctor_id == doctor_id,
                # Filter to the requested calendar day (UTC)
                text("DATE(vitalia_appointment_clinic_map.start_time AT TIME ZONE 'UTC') = :day").bindparams(day=day),
                AppointmentClinicMapModel.status.notin_(["CANCELLED"]),
                AppointmentClinicMapModel.start_time.isnot(None),
                AppointmentClinicMapModel.end_time.isnot(None),
                AppointmentClinicMapModel.deleted_at.is_(None),
            )
            .order_by(AppointmentClinicMapModel.start_time)
        )

        rows = (await self._session.execute(stmt)).all()

        logger.debug(
            "availability_busy_ranges_loaded",
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            doctor_id=str(doctor_id),
            day=str(day),
            count=len(rows),
        )

        return [
            TimeRange(start=row.start_time, end=row.end_time)
            for row in rows
            if row.start_time is not None and row.end_time is not None
        ]

    async def list_active_doctors(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
    ) -> list[tuple[UUID, str]]:
        """Return (doctor_id, label) for doctors with slots in this clinic.

        Queries distinct doctor_ids from vitalia_availability_slots as a proxy
        for "active doctors with a configured schedule". Returns doctor_id + a
        placeholder label — the caller (free_doctors endpoint) decorates with
        actual staff names via DoctorService if needed.

        Note: label is synthesised as "Dr. {doctor_id[:8]}" here since staff
        names live in the clinics module (cross-module boundary). The router
        layer can enrich this via a separate DoctorService call. For the
        AvailabilityCheckService the label is only used for FreeDoctorItem
        display — full name enrichment is a FE concern.

        Args:
            tenant_id: Tenant scope (dual filter L1).
            clinic_id: Clinic scope (dual filter L2 — HIPAA-lite).

        Returns:
            List of (UUID, label_str) tuples.
        """
        stmt = (
            select(VitaliaAvailabilitySlotModel.doctor_id)
            .where(
                VitaliaAvailabilitySlotModel.tenant_id == tenant_id,
                VitaliaAvailabilitySlotModel.clinic_id == clinic_id,
                VitaliaAvailabilitySlotModel.deleted_at.is_(None),
            )
            .distinct()
        )

        rows = (await self._session.execute(stmt)).all()

        logger.debug(
            "availability_active_doctors_loaded",
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            count=len(rows),
        )

        # ponytail: label is a placeholder — router enriches via staff name lookup
        return [(row.doctor_id, f"Dr. {str(row.doctor_id)[:8]}") for row in rows]
