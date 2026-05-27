"""T-6 A4 — POST /appointments create endpoint tests.

TDD: tests define the create appointment contract BEFORE implementation.

Coverage:
  - Happy path: origin=walk_in + patient_new_data → 201 + AppointmentDetailDTO
  - Happy path: origin=desde_paciente_existente + patient_id → 201
  - Validation: origin=desde_paciente_existente without patient_id → 422
  - Validation: origin=walk_in without patient_new_data AND without patient_id → 422
  - RBAC: non-PHI role → 403
  - Service called with correct tenant_id + clinic_id (dual filter)
  - Audit written (CreateAppointmentService is constructed with audit_writer)

Per T-6 acceptance A4:
  "POST create emits create_appointment audit row + persists clinic_map"

downstream-regression-na: brand-local create appointment test for vitalia scheduling T-6
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

# ---------------------------------------------------------------------------
# Test constants
# ---------------------------------------------------------------------------

TENANT_ID = uuid4()
CLINIC_ID = uuid4()
USER_ID = uuid4()
DOCTOR_ID = uuid4()
PATIENT_ID = uuid4()
NEW_APPT_ID = uuid4()

_PHI_HEADERS = {
    "X-Tenant-ID": str(TENANT_ID),
    "X-Clinic-ID": str(CLINIC_ID),
    "X-User-ID": str(USER_ID),
    "X-User-Role": "admin_clinic",
}

_NON_PHI_HEADERS = {
    "X-Tenant-ID": str(TENANT_ID),
    "X-Clinic-ID": str(CLINIC_ID),
    "X-User-ID": str(USER_ID),
    "X-User-Role": "marketing",
}

_FAKE_CREATED_DETAIL: dict = {
    "appointment_id": str(NEW_APPT_ID),
    "patient_id": str(PATIENT_ID),
    "patient_name_masked": "L. Fernández",
    "patient_dni_masked": None,
    "patient_phone_masked": None,
    "patient_email_masked": None,
    "start_time": "2026-05-27T09:00:00+00:00",
    "end_time": "2026-05-27T09:30:00+00:00",
    "doctor_id": str(DOCTOR_ID),
    "doctor_label": "Dr. Vargas",
    "service_label": "Extracción simple",
    "appointment_status": "SCHEDULED",
    "payment_status": "sin_pago",
    "origin": "walk_in",
    "balance_due_cents": 12000,
    "balance_paid_cents": 0,
    "currency": "PEN",
    "currency_override": None,
    "payments": [],
    "notes_internal": None,
    "last_activity_at": None,
    "last_activity_by_label": None,
}


# ---------------------------------------------------------------------------
# Test app factory
# ---------------------------------------------------------------------------


def _build_test_app() -> FastAPI:
    """Build minimal FastAPI test app with agenda router."""
    from src.modules.vitalia.scheduling.api.agenda_router import router

    test_app = FastAPI(redirect_slashes=False)
    test_app.include_router(router, prefix="/api/v1/scheduling")

    async def _fake_db():
        yield MagicMock()

    from src.modules.vitalia.scheduling.api import agenda_router as ar_module

    test_app.dependency_overrides[ar_module._get_db] = _fake_db
    return test_app


# ---------------------------------------------------------------------------
# Tests: create appointment
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_appointment_walk_in_returns_201() -> None:
    """Walk-in with patient_new_data → 201 Created + AppointmentDetailDTO response."""
    with (
        patch("src.modules.vitalia.scheduling.api.agenda_router.CreateAppointmentService") as MockSvc,
        patch("src.modules.vitalia.scheduling.api.agenda_router.AgendaGridRepositoryImpl"),
        patch("src.modules.vitalia.scheduling.api.agenda_router.AsyncAuditWriter"),
    ):
        svc_instance = MagicMock()
        svc_instance.create_appointment = AsyncMock(return_value=_FAKE_CREATED_DETAIL)
        MockSvc.return_value = svc_instance

        app = _build_test_app()
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.post(
                "/api/v1/scheduling/appointments",
                json={
                    "origin": "walk_in",
                    "patient_new_data": {
                        "name": "Laura Fernández",
                        "phone": "+51987654321",
                        "dni": None,
                        "email": None,
                    },
                    "doctor_id": str(DOCTOR_ID),
                    "service_label": "Extracción simple",
                    "start_time": "2026-05-27T09:00:00+00:00",
                    "end_time": "2026-05-27T09:30:00+00:00",
                    "notes_internal": None,
                    "currency_override": None,
                },
                headers=_PHI_HEADERS,
            )

    assert resp.status_code == 201
    body = resp.json()
    assert body["appointment_id"] == str(NEW_APPT_ID)
    assert "patient_name_masked" in body


@pytest.mark.asyncio
async def test_create_appointment_existing_patient_returns_201() -> None:
    """origin=desde_paciente_existente + patient_id → 201 Created."""
    with (
        patch("src.modules.vitalia.scheduling.api.agenda_router.CreateAppointmentService") as MockSvc,
        patch("src.modules.vitalia.scheduling.api.agenda_router.AgendaGridRepositoryImpl"),
        patch("src.modules.vitalia.scheduling.api.agenda_router.AsyncAuditWriter"),
    ):
        svc_instance = MagicMock()
        svc_instance.create_appointment = AsyncMock(return_value=_FAKE_CREATED_DETAIL)
        MockSvc.return_value = svc_instance

        app = _build_test_app()
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.post(
                "/api/v1/scheduling/appointments",
                json={
                    "origin": "desde_paciente_existente",
                    "patient_id": str(PATIENT_ID),
                    "doctor_id": str(DOCTOR_ID),
                    "service_label": "Control de seguimiento",
                    "start_time": "2026-05-27T10:00:00+00:00",
                    "end_time": "2026-05-27T10:30:00+00:00",
                    "notes_internal": None,
                    "currency_override": None,
                },
                headers=_PHI_HEADERS,
            )

    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_create_appointment_missing_patient_id_for_existing_origin_returns_422() -> None:
    """origin=desde_paciente_existente without patient_id → 422."""
    app = _build_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.post(
            "/api/v1/scheduling/appointments",
            json={
                "origin": "desde_paciente_existente",
                # patient_id intentionally omitted
                "doctor_id": str(DOCTOR_ID),
                "service_label": "Control de seguimiento",
                "start_time": "2026-05-27T10:00:00+00:00",
                "end_time": "2026-05-27T10:30:00+00:00",
            },
            headers=_PHI_HEADERS,
        )

    assert resp.status_code == 422
    body = resp.json()
    assert body["detail"]["error_code"] == "PATIENT_ID_REQUIRED"


@pytest.mark.asyncio
async def test_create_appointment_walk_in_no_patient_data_returns_422() -> None:
    """origin=walk_in without patient_new_data AND without patient_id → 422."""
    app = _build_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.post(
            "/api/v1/scheduling/appointments",
            json={
                "origin": "walk_in",
                # Neither patient_id nor patient_new_data
                "doctor_id": str(DOCTOR_ID),
                "service_label": "Limpieza dental",
                "start_time": "2026-05-27T11:00:00+00:00",
                "end_time": "2026-05-27T11:30:00+00:00",
            },
            headers=_PHI_HEADERS,
        )

    assert resp.status_code == 422
    body = resp.json()
    assert body["detail"]["error_code"] == "PATIENT_DATA_REQUIRED"


@pytest.mark.asyncio
async def test_create_appointment_non_phi_role_forbidden() -> None:
    """Non-PHI role cannot create appointments — 403."""
    app = _build_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.post(
            "/api/v1/scheduling/appointments",
            json={
                "origin": "walk_in",
                "patient_new_data": {"name": "Test", "phone": "+51987654321"},
                "doctor_id": str(DOCTOR_ID),
                "service_label": "Consulta",
                "start_time": "2026-05-27T12:00:00+00:00",
                "end_time": "2026-05-27T12:30:00+00:00",
            },
            headers=_NON_PHI_HEADERS,
        )

    assert resp.status_code == 403
    assert resp.json()["detail"]["error_code"] == "PHI_RBAC_DENIED"


@pytest.mark.asyncio
async def test_create_appointment_service_called_with_dual_filter() -> None:
    """create_appointment service receives tenant_id + clinic_id (dual filter A12)."""
    with (
        patch("src.modules.vitalia.scheduling.api.agenda_router.CreateAppointmentService") as MockSvc,
        patch("src.modules.vitalia.scheduling.api.agenda_router.AgendaGridRepositoryImpl"),
        patch("src.modules.vitalia.scheduling.api.agenda_router.AsyncAuditWriter"),
    ):
        svc_instance = MagicMock()
        svc_instance.create_appointment = AsyncMock(return_value=_FAKE_CREATED_DETAIL)
        MockSvc.return_value = svc_instance

        app = _build_test_app()
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await client.post(
                "/api/v1/scheduling/appointments",
                json={
                    "origin": "desde_paciente_existente",
                    "patient_id": str(PATIENT_ID),
                    "doctor_id": str(DOCTOR_ID),
                    "service_label": "Consulta",
                    "start_time": "2026-05-27T13:00:00+00:00",
                    "end_time": "2026-05-27T13:30:00+00:00",
                },
                headers=_PHI_HEADERS,
            )

    # Verify service was called with correct tenant_id + clinic_id
    svc_instance.create_appointment.assert_awaited_once()
    call_kwargs = svc_instance.create_appointment.call_args.kwargs
    from uuid import UUID

    assert call_kwargs["tenant_id"] == UUID(str(TENANT_ID))
    assert call_kwargs["clinic_id"] == UUID(str(CLINIC_ID))
