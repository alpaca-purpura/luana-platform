"""Tests for CRM API — patients and leads endpoints.

TDD: RED tests defined before implementation (T-infra-9).

Uses httpx.AsyncClient with ASGITransport (no live server needed).

downstream-regression-na: brand-local CRM API tests
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
class TestPatientsEndpoints:
    """CRM patients endpoints — RBAC + response_model enforcement."""

    async def test_get_patient_returns_403_for_marketing_role(self) -> None:
        """Marketing role must not access PHI endpoints."""
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        patient_id = str(uuid4())
        token = f"stub:{tenant_id}:{clinic_id}:marketing:user_mkt"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/crm/patients/{patient_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "X-Clinic-ID": clinic_id,
                },
            )
        assert response.status_code == 403

    async def test_get_patient_returns_403_for_receptionist_role(self) -> None:
        """Receptionist role must not access PHI endpoints."""
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        patient_id = str(uuid4())
        token = f"stub:{tenant_id}:{clinic_id}:receptionist:user_recep"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/crm/patients/{patient_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "X-Clinic-ID": clinic_id,
                },
            )
        assert response.status_code == 403

    async def test_get_patient_requires_auth_header(self) -> None:
        """Request without Authorization header returns 422 or 401."""
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        patient_id = str(uuid4())

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/crm/patients/{patient_id}",
                headers={"X-Tenant-ID": tenant_id, "X-Clinic-ID": clinic_id},
            )
        assert response.status_code in (422, 401, 400)

    async def test_opt_out_requires_clinic_header(self) -> None:
        """POST /patients/{id}/opt-out must require X-Clinic-ID header."""
        from src.main import app

        tenant_id = str(uuid4())
        patient_id = str(uuid4())
        token = f"stub:{tenant_id}:{uuid4()}:admin_clinic:user_admin"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/crm/patients/{patient_id}/opt-out",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    # X-Clinic-ID intentionally absent
                },
                json={"reason": "requested"},
            )
        # Missing required header → 422
        assert response.status_code in (422, 400)

    async def test_patch_patient_blocked_for_marketing(self) -> None:
        """PATCH /patients/{id} blocked for marketing role."""
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        patient_id = str(uuid4())
        token = f"stub:{tenant_id}:{clinic_id}:marketing:user_mkt2"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/v1/crm/patients/{patient_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "X-Clinic-ID": clinic_id,
                },
                json={"phone": "555-1234"},
            )
        assert response.status_code == 403


@pytest.mark.anyio
class TestLeadsEndpoints:
    """CRM leads endpoints — non-PHI, single tenant filter."""

    async def test_get_lead_requires_auth_header(self) -> None:
        """Request without Authorization returns 422/401."""
        from src.main import app

        tenant_id = str(uuid4())
        lead_id = str(uuid4())

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/crm/leads/{lead_id}",
                headers={"X-Tenant-ID": tenant_id},
            )
        assert response.status_code in (422, 401, 400)

    async def test_get_lead_accessible_without_clinic_header(self) -> None:
        """Lead is non-PHI — X-Clinic-ID is optional (no dual filter required)."""
        from src.main import app

        tenant_id = str(uuid4())
        lead_id = str(uuid4())
        token = f"stub:{tenant_id}:{uuid4()}:marketing:user_mkt3"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/crm/leads/{lead_id}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    # X-Clinic-ID intentionally absent
                },
            )
        # Expect 404 (lead not found) not 422/403 — lead endpoint accessible without clinic_id
        assert response.status_code in (404, 200)
