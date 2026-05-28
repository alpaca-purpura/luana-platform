# cap: scheduling.valeria-agenda
# atomics: TBD
# story-origin: vitalia-fase2-s1-TBD
"""Create Appointment Service — create engine appointment + brand-local clinic_map.

Rule (03-arch A12 + hipaa-lite.md):
  - Engine `appointments` table has no `clinic_id` column (single-tenant assumption).
  - Brand-local `vitalia_appointment_clinic_map` stores the clinic FK binding.
  - CREATE must persist BOTH: appointment (engine) + clinic_map (brand-local).
  - Audit log sync write BEFORE returning (PHI write = mandatory log).
  - Growth studio event emitted after audit (fire-forget).

Usage:
    service = CreateAppointmentService(
        repo=repo,
        audit_writer=audit_writer,
        growth_emitter=growth_emitter,
    )
    detail = await service.create_appointment(
        tenant_id=tenant_id,
        clinic_id=clinic_id,
        user_id=user_id,
        origin="walk_in",
        patient_id=patient_id,
        doctor_id=doctor_id,
        service_label="Limpieza dental",
        start_time=start_time,
        end_time=end_time,
    )
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

import structlog

logger = structlog.get_logger()


class CreateAppointmentService:
    """Application service: create an appointment + brand-local clinic_map.

    Orchestration flow (A12):
    1. repo.create() → engine appointment row (returns appointment_id UUID)
    2. repo.create_clinic_map() → vitalia_appointment_clinic_map row (brand-local FK)
    3. audit_writer.write() → HIPAA-lite mandatory sync write
    4. growth_emitter.emit_event() → fire-forget UX telemetry
    5. repo.get_by_id() → load full detail + return

    Both create + create_clinic_map happen in the same service call.
    If clinic_map persistence fails, caller sees exception and appointment
    is considered incomplete (compensating via explicit re-create).
    """

    def __init__(
        self,
        *,
        repo: Any,
        audit_writer: Any,
        growth_emitter: Any,
    ) -> None:
        """Initialize CreateAppointmentService.

        Args:
            repo: Implements create(), create_clinic_map(), get_by_id().
                  Typically a combined scheduling repo adapter.
            audit_writer: AsyncAuditWriter — sync write before response.
            growth_emitter: GrowthStudioEmitter — fire-forget telemetry.
        """
        self._repo = repo
        self._audit = audit_writer
        self._growth = growth_emitter

    async def create_appointment(
        self,
        *,
        tenant_id: UUID,
        clinic_id: UUID,
        user_id: UUID,
        origin: str,
        patient_id: UUID,
        doctor_id: UUID,
        service_label: str,
        start_time: datetime,
        end_time: datetime,
        notes_internal: str | None = None,
        currency_override: str | None = None,
    ) -> dict[str, Any]:
        """Create an appointment and its brand-local clinic_map entry.

        Dual persistence (A12):
        - Engine appointment row (no clinic_id column on engine).
        - Brand-local clinic_map row (vitalia_appointment_clinic_map).

        Args:
            tenant_id: Root tenant UUID.
            clinic_id: Clinic UUID (stored in brand-local clinic_map only).
            user_id: Actor user UUID (staff creating the appointment).
            origin: AppointmentOrigin string (walk_in/telefono/proactivo_adrian/portal).
            patient_id: Patient UUID.
            doctor_id: Doctor UUID.
            service_label: Human-readable service description.
            start_time: Appointment start (UTC).
            end_time: Appointment end (UTC).
            notes_internal: Optional internal staff notes (PHI-adjacent — not returned).
            currency_override: Optional ISO currency override for this appointment.

        Returns:
            Full appointment detail dict (same shape as get_detail).
        """
        # Step 1: Create engine appointment row
        appointment_id: UUID = await self._repo.create(
            tenant_id=tenant_id,
            patient_id=patient_id,
            doctor_id=doctor_id,
            service_label=service_label,
            start_time=start_time,
            end_time=end_time,
            origin=origin,
            notes_internal=notes_internal,
            currency_override=currency_override,
        )

        # Step 2: Create brand-local clinic_map row (A12)
        await self._repo.create_clinic_map(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            appointment_id=appointment_id,
            patient_id=patient_id,
            doctor_id=doctor_id,
            service_label=service_label,
            origin=origin,
            currency_override=currency_override,
        )

        # Step 3: Audit log sync write (HIPAA mandate — PHI write = mandatory log)
        await self._audit.write(
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            user_id=user_id,
            action="appointment.create",
            resource_type="appointment",
            resource_id=appointment_id,
            payload={
                "origin": origin,
                "service_label": service_label,
                # No PHI values in payload (sanitize_payload strips them in audit_writer)
            },
        )

        # Step 4: Growth studio telemetry (fire-forget)
        await self._growth.emit_event(
            event_type="create_appointment",
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            entity_id=appointment_id,
            user_id=user_id,
            props={
                "origin": origin,
            },
        )

        # Step 5: Load + return full detail
        detail = await self._repo.get_by_id(
            appointment_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
        )

        logger.info(
            "appointment_created",
            appointment_id=str(appointment_id),
            tenant_id=str(tenant_id),
            clinic_id=str(clinic_id),
            origin=origin,
        )

        return detail
