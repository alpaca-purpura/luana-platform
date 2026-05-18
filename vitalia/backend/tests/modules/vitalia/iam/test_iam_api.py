"""Tests for IAM API — GET /api/v1/iam/me endpoint.

TDD: RED tests defined before implementation (T-infra-9).

Tests use httpx.AsyncClient with ASGITransport (no live server needed).

downstream-regression-na: brand-local IAM API tests
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
class TestIamMeEndpoint:
    """GET /api/v1/iam/me — return current user context."""

    async def test_me_returns_200_with_valid_stub_token(self) -> None:
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        token = f"stub:{tenant_id}:{clinic_id}:doctor:user_test_doc"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/iam/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "X-Clinic-ID": clinic_id,
                },
            )
        assert response.status_code == 200

    async def test_me_response_contains_role(self) -> None:
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        token = f"stub:{tenant_id}:{clinic_id}:nurse:user_nurse_123"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/iam/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "X-Clinic-ID": clinic_id,
                },
            )
        assert response.status_code == 200
        body = response.json()
        assert body["role"] == "nurse"

    async def test_me_response_contains_tenant_and_clinic_ids(self) -> None:
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        token = f"stub:{tenant_id}:{clinic_id}:admin_clinic:user_admin"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/iam/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "X-Clinic-ID": clinic_id,
                },
            )
        assert response.status_code == 200
        body = response.json()
        assert body["tenant_id"] == tenant_id
        assert body["clinic_id"] == clinic_id

    async def test_me_returns_422_without_auth_header(self) -> None:
        from src.main import app

        tenant_id = str(uuid4())
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/iam/me",
                headers={"X-Tenant-ID": tenant_id},
            )
        # No Authorization header — expect 422 (missing required header)
        assert response.status_code in (422, 401, 400)

    async def test_me_does_not_leak_unknown_fields(self) -> None:
        """Response must only contain whitelisted fields (response_model= PII gate)."""
        from src.main import app

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        token = f"stub:{tenant_id}:{clinic_id}:doctor:user_phi_test"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/iam/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Tenant-ID": tenant_id,
                    "X-Clinic-ID": clinic_id,
                },
            )
        assert response.status_code == 200
        body = response.json()
        allowed_keys = {"user_id", "tenant_id", "clinic_id", "role", "email", "name"}
        extra_keys = set(body.keys()) - allowed_keys
        assert extra_keys == set(), f"Response contains unexpected keys: {extra_keys}"
