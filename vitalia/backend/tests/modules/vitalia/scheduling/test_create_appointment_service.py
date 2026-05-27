"""RED tests — CreateAppointmentService: clinic_map persist + audit log + telemetry.

TDD: tests define expected interface BEFORE implementation.
All tests use in-memory mocks — no Postgres required (pure unit tests).

Contract (03-arch A12 + § 5 + hipaa-lite.md):
- Create persists appointment + clinic_map (A12 brand-local FK)
- Audit log sync write (HIPAA PHI write = mandatory log)
- Telemetry growth_studio_event emitted (create_appointment)

Per 05-guidelines TDD-mandatory + vitalia/.claude/rules/hipaa-lite.md
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

# ---------------------------------------------------------------------------
# Import helpers
# ---------------------------------------------------------------------------


def _import_service():
    from src.modules.vitalia.scheduling.application.services.create_appointment_service import (  # noqa: PLC0415
        CreateAppointmentService,
    )

    return CreateAppointmentService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

TENANT_ID = uuid4()
CLINIC_ID = uuid4()
PATIENT_ID = uuid4()
DOCTOR_ID = uuid4()
APPT_ID = uuid4()
USER_ID = uuid4()


def _make_create_request() -> dict:
    return {
        "origin": "walk_in",
        "patient_id": PATIENT_ID,
        "doctor_id": DOCTOR_ID,
        "service_label": "Limpieza dental",
        "start_time": datetime(2026, 5, 28, 9, 0, tzinfo=timezone.utc),
        "end_time": datetime(2026, 5, 28, 9, 30, tzinfo=timezone.utc),
        "notes_internal": None,
        "currency_override": None,
    }


def _make_mock_scheduling_repo() -> MagicMock:
    """Mock scheduling repo that returns a detail dict after creation."""
    repo = MagicMock()
    detail = {
        "appointment_id": str(APPT_ID),
        "patient_id": str(PATIENT_ID),
        "tenant_id": str(TENANT_ID),
        "clinic_id": str(CLINIC_ID),
        "patient_name_masked": "P. Paciente",
        "dni_masked": "12.***.***",
        "service": "Limpieza dental",
        "doctor_id": str(DOCTOR_ID),
        "start_at": datetime(2026, 5, 28, 9, 0, tzinfo=timezone.utc),
        "end_at": datetime(2026, 5, 28, 9, 30, tzinfo=timezone.utc),
        "duration_minutes": 30,
        "status": "SCHEDULED",
        "payment_status": "sin_pago",
        "origin": "walk_in",
        "currency": "PEN",
        "currency_override": None,
        "booking_metadata": {},
        "created_at": datetime(2026, 5, 26, tzinfo=timezone.utc),
        "updated_at": None,
        "payments": [],
    }
    repo.create = AsyncMock(return_value=APPT_ID)
    repo.create_clinic_map = AsyncMock(return_value=None)
    repo.get_by_id = AsyncMock(return_value=detail)
    return repo


def _make_mock_audit_writer() -> MagicMock:
    writer = MagicMock()
    writer.write = AsyncMock(return_value=None)
    return writer


def _make_mock_growth_emitter() -> MagicMock:
    emitter = MagicMock()
    emitter.emit_event = AsyncMock(return_value=None)
    return emitter


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestCreateAppointmentServiceClinicMap:
    """A12: Create persists clinic_map (brand-local FK)."""

    @pytest.mark.asyncio
    async def test_create_persists_clinic_map(self):
        """create_appointment() must call repo.create_clinic_map() after creating appointment.

        Per 03-arch A12: brand-local clinic_id binding is stored in
        vitalia_appointment_clinic_map, not in the engine appointments table.
        The service MUST persist both: appointment + clinic_map in same transaction.
        """
        CreateAppointmentService = _import_service()
        repo = _make_mock_scheduling_repo()
        audit_writer = _make_mock_audit_writer()
        growth_emitter = _make_mock_growth_emitter()
        service = CreateAppointmentService(
            repo=repo,
            audit_writer=audit_writer,
            growth_emitter=growth_emitter,
        )

        await service.create_appointment(
            tenant_id=TENANT_ID,
            clinic_id=CLINIC_ID,
            user_id=USER_ID,
            **_make_create_request(),
        )

        # clinic_map must have been persisted
        repo.create_clinic_map.assert_called_once()
        map_kwargs = repo.create_clinic_map.call_args.kwargs
        assert map_kwargs.get("tenant_id") == TENANT_ID
        assert map_kwargs.get("clinic_id") == CLINIC_ID
        assert map_kwargs.get("appointment_id") == APPT_ID or str(map_kwargs.get("appointment_id")) == str(APPT_ID)

    @pytest.mark.asyncio
    async def test_create_returns_appointment_id(self):
        """create_appointment() must return the created appointment detail."""
        CreateAppointmentService = _import_service()
        repo = _make_mock_scheduling_repo()
        audit_writer = _make_mock_audit_writer()
        growth_emitter = _make_mock_growth_emitter()
        service = CreateAppointmentService(
            repo=repo,
            audit_writer=audit_writer,
            growth_emitter=growth_emitter,
        )

        result = await service.create_appointment(
            tenant_id=TENANT_ID,
            clinic_id=CLINIC_ID,
            user_id=USER_ID,
            **_make_create_request(),
        )

        assert result is not None
        appt_id = result.get("appointment_id")
        assert appt_id is not None


class TestCreateAppointmentServiceAuditLog:
    """Audit log sync write on create."""

    @pytest.mark.asyncio
    async def test_create_emits_audit_log(self):
        """create_appointment() must write audit log row before returning.

        HIPAA-lite mandate: creating a PHI-adjacent record requires audit row.
        """
        CreateAppointmentService = _import_service()
        repo = _make_mock_scheduling_repo()
        audit_writer = _make_mock_audit_writer()
        growth_emitter = _make_mock_growth_emitter()
        service = CreateAppointmentService(
            repo=repo,
            audit_writer=audit_writer,
            growth_emitter=growth_emitter,
        )

        await service.create_appointment(
            tenant_id=TENANT_ID,
            clinic_id=CLINIC_ID,
            user_id=USER_ID,
            **_make_create_request(),
        )

        audit_writer.write.assert_called_once()
        call_kwargs = audit_writer.write.call_args.kwargs
        assert call_kwargs.get("tenant_id") == TENANT_ID
        assert call_kwargs.get("clinic_id") == CLINIC_ID
        # Action should reference appointment creation
        action = call_kwargs.get("action", "")
        assert "appointment" in action.lower() or "create" in action.lower()


class TestCreateAppointmentServiceTelemetry:
    """Growth studio event emitted on create."""

    @pytest.mark.asyncio
    async def test_create_emits_telemetry_event(self):
        """create_appointment() must emit create_appointment growth_studio_event.

        7 critical telemetry events per 03-arch § 10.
        create_appointment is one of them.
        """
        CreateAppointmentService = _import_service()
        repo = _make_mock_scheduling_repo()
        audit_writer = _make_mock_audit_writer()
        growth_emitter = _make_mock_growth_emitter()
        service = CreateAppointmentService(
            repo=repo,
            audit_writer=audit_writer,
            growth_emitter=growth_emitter,
        )

        await service.create_appointment(
            tenant_id=TENANT_ID,
            clinic_id=CLINIC_ID,
            user_id=USER_ID,
            **_make_create_request(),
        )

        growth_emitter.emit_event.assert_called_once()
        call_kwargs = growth_emitter.emit_event.call_args.kwargs
        event_type = call_kwargs.get("event_type", "")
        assert "create" in event_type.lower() or "appointment" in event_type.lower()

    @pytest.mark.asyncio
    async def test_telemetry_tenant_and_clinic_passed(self):
        """Growth event must include tenant_id and clinic_id."""
        CreateAppointmentService = _import_service()
        repo = _make_mock_scheduling_repo()
        audit_writer = _make_mock_audit_writer()
        growth_emitter = _make_mock_growth_emitter()
        service = CreateAppointmentService(
            repo=repo,
            audit_writer=audit_writer,
            growth_emitter=growth_emitter,
        )

        await service.create_appointment(
            tenant_id=TENANT_ID,
            clinic_id=CLINIC_ID,
            user_id=USER_ID,
            **_make_create_request(),
        )

        call_kwargs = growth_emitter.emit_event.call_args.kwargs
        assert call_kwargs.get("tenant_id") == TENANT_ID
        assert call_kwargs.get("clinic_id") == CLINIC_ID
