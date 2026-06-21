# cap: scheduling.mateo-agenda
# story-origin: TBD
"""SQLAlchemy 2.0 model — vitalia_appointment_clinic_map.

Brand-local extension for appointment metadata (03-arch A12).
Stores service_label, origin, currency_override, patient_id, doctor_id
without modifying the core vitalia_appointments record.

HIPAA-lite dual filter: tenant_id + clinic_id required on all queries.

Per 03-arch § 2.5 + vitalia/.clone/rules/hipaa-lite.md
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from luana_core_platform.domain.base_entity import Base
from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column


class AppointmentClinicMapModel(Base):
    """SQLAlchemy 2.0 model for vitalia_appointment_clinic_map.

    One-to-one with vitalia_appointments (appointment_id is PK + FK).
    Stores brand-local metadata: service_label, origin badge, currency_override.

    Architecture decision A12: brand-local FK avoids modifying engine appointment record.
    """

    __tablename__ = "vitalia_appointment_clinic_map"

    appointment_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("vitalia_appointments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tenant_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    clinic_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    patient_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    doctor_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    service_label: Mapped[str] = mapped_column(String(128), nullable=False)
    # AppointmentOrigin enum value: walk_in | telefono | proactivo_adrian | portal
    origin: Mapped[str] = mapped_column(String(32), nullable=False)
    # Per-appointment currency override (tenant default otherwise) — currency-handling.md
    # ISO 4217 code: PEN/ARS/MXN/USD/... — None means use tenant locale default
    currency_override: Mapped[str | None] = mapped_column(String(3), nullable=True)
    # Soft delete (brand consistency per backend-ddd.md)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )
