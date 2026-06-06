# cap: abel/icp-buyer  # noqa: ERA001
"""API wiring tests for the draft-first extract endpoints (T-AG-1 · CONN notarized).

Asserts the router consumes IcpExtractionService (no longer a stub):
- POST /icp/extract → {job_id, status=analizando} (RN-3 start)
- GET  /icp/extract/{job_id} → poll status; cross-tenant / unknown → 404 (RN-1)
- response_model present on both routes (PII gate)
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.modules.nicolify.abel.application.dtos.extraction_dtos import IcpExtractJobResponse

TENANT_ID = str(uuid.uuid4())


async def _make_client(app):
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def _mock_service():
    service = MagicMock()
    service.start = AsyncMock()
    service.get_job = AsyncMock()
    return service


class TestExtractApiWiring:
    """POST/GET extract routes call the real service (not the old stub)."""

    @pytest.mark.asyncio
    async def test_post_extract_starts_job(self) -> None:
        """POST /icp/extract → 200 with status=analizando + a job_id (service.start called)."""
        from src.main import app
        import src.modules.nicolify.abel.api.router as abel_router_module

        job_id = uuid.uuid4()
        service = _mock_service()
        service.start.return_value = IcpExtractJobResponse(job_id=job_id, status="analizando", icp_id=None)

        app.dependency_overrides[abel_router_module._get_extraction_service] = lambda: service
        try:
            async with await _make_client(app) as client:
                resp = await client.post(
                    "/api/v1/abel/icp/extract",
                    headers={"Authorization": "Bearer fake", "X-Tenant-ID": TENANT_ID},
                    json={"seed_type": "text", "payload": "una agencia B2B"},
                )
            assert resp.status_code == 200
            body = resp.json()
            assert body["status"] == "analizando"
            # DTO is snake_case (T-BE-2 extraction_dtos); FE mirrors to camelCase client-side.
            assert body.get("job_id", body.get("jobId")) == str(job_id)
            service.start.assert_awaited_once()
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_job_unknown_returns_404(self) -> None:
        """GET an unknown/cross-tenant job → 404 (service.get_job returns None · RN-1)."""
        from src.main import app
        import src.modules.nicolify.abel.api.router as abel_router_module

        service = _mock_service()
        service.get_job.return_value = None  # cross-tenant / unknown → None → 404

        app.dependency_overrides[abel_router_module._get_extraction_service] = lambda: service
        try:
            async with await _make_client(app) as client:
                resp = await client.get(
                    f"/api/v1/abel/icp/extract/{uuid.uuid4()}",
                    headers={"Authorization": "Bearer fake", "X-Tenant-ID": TENANT_ID},
                )
            assert resp.status_code == 404
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_job_done_returns_icp_id(self) -> None:
        """GET a finished job → 200 with status=done + icp_id."""
        from src.main import app
        import src.modules.nicolify.abel.api.router as abel_router_module

        job_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        service = _mock_service()
        service.get_job.return_value = IcpExtractJobResponse(job_id=job_id, status="done", icp_id=icp_id)

        app.dependency_overrides[abel_router_module._get_extraction_service] = lambda: service
        try:
            async with await _make_client(app) as client:
                resp = await client.get(
                    f"/api/v1/abel/icp/extract/{job_id}",
                    headers={"Authorization": "Bearer fake", "X-Tenant-ID": TENANT_ID},
                )
            assert resp.status_code == 200
            body = resp.json()
            assert body["status"] == "done"
            assert body.get("icp_id", body.get("icpId")) == str(icp_id)
        finally:
            app.dependency_overrides.clear()

    def test_extract_routes_have_response_model(self) -> None:
        """response_model present on both extract routes (PII gate · arch test parity)."""
        from fastapi.routing import APIRoute

        from src.modules.nicolify.abel.api.router import router

        extract_routes = [r for r in router.routes if isinstance(r, APIRoute) and "extract" in r.path]
        assert len(extract_routes) == 2
        for route in extract_routes:
            assert route.response_model is not None
