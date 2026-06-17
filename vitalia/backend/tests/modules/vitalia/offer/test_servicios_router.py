# cap: lisa.servicios
"""Router happy-path tests for /api/v1/offer/servicios (T-2 § 9).

httpx.AsyncClient against the real FastAPI app with the service bundle mocked
(no Postgres). Pins the HTTP contract: list / detail / create-from-template /
create-custom / patch / activate, each returning its declared response_model.

Pattern mirrors brand_studio test_marca_router_identity.py: patch the router's
``_build_service`` factory with an AsyncMock bundle so no DB session is touched
for the service calls. X-User-ID values are UUIDs so _resolve_audit_actor never
hits the DB.
"""

from __future__ import annotations

from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from luana_core_offer_studio.domain.enums import OfferStatus

from src.modules.vitalia.offer.application.services.biblioteca_service import PresetSuggestion
from src.modules.vitalia.offer.application.services.catalog_service import ServiceView
from src.modules.vitalia.offer.domain.enums import ServiceModality

pytestmark = pytest.mark.integration

_TENANT_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
_OWNER_ID = "11111111-1111-1111-1111-111111111111"
_BASE = "/api/v1/offer/servicios"

_OFFER_ID = uuid4()


def _view(*, is_active: bool = False, status: OfferStatus = OfferStatus.DRAFT) -> ServiceView:
    return ServiceView(
        offer_id=_OFFER_ID,
        public_name="Limpieza dental",
        price=Decimal("120"),
        currency="PEN",
        status=status,
        is_active=is_active,
        modality=ServiceModality.UNICA,
        category="Odontología general",
        canonical_service_ref=None,
    )


def _bundle(*, catalog: AsyncMock | None = None) -> AsyncMock:
    bundle = AsyncMock()
    bundle.catalog = catalog or AsyncMock()
    bundle.biblioteca = AsyncMock()
    bundle.specialists = AsyncMock()
    bundle.proof = AsyncMock()
    bundle.sales_brief = AsyncMock()
    bundle.autocomplete = AsyncMock()
    # Detail composition reads (empty by default).
    bundle.sales_brief.get.return_value = None
    bundle.specialists.list_for_offer.return_value = []
    bundle.proof.list_cases.return_value = []
    bundle.proof.list_testimonials.return_value = []
    return bundle


@pytest.fixture
def app():
    from src.main import app as vitalia_app

    return vitalia_app


def _patch():
    return patch("src.modules.vitalia.offer.api.servicios_router._build_service")


@pytest.mark.asyncio
async def test_list_services_returns_200(app) -> None:
    catalog = AsyncMock()
    catalog.list_services.return_value = ([_view()], None)
    with _patch() as mock_build:
        mock_build.return_value = _bundle(catalog=catalog)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(_BASE, headers={"X-Tenant-ID": _TENANT_A})
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["items"][0]["public_name"] == "Limpieza dental"
    assert data["next_cursor"] is None


@pytest.mark.asyncio
async def test_list_services_missing_tenant_returns_422(app) -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(_BASE)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_detail_returns_200(app) -> None:
    catalog = AsyncMock()
    catalog.get_service.return_value = _view()
    with _patch() as mock_build:
        mock_build.return_value = _bundle(catalog=catalog)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(f"{_BASE}/{_OFFER_ID}", headers={"X-Tenant-ID": _TENANT_A})
    assert resp.status_code == 200
    assert resp.json()["public_name"] == "Limpieza dental"


@pytest.mark.asyncio
async def test_get_detail_not_found_returns_404(app) -> None:
    catalog = AsyncMock()
    catalog.get_service.return_value = None
    with _patch() as mock_build:
        mock_build.return_value = _bundle(catalog=catalog)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(f"{_BASE}/{uuid4()}", headers={"X-Tenant-ID": _TENANT_A})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_from_template_returns_201(app) -> None:
    catalog = AsyncMock()
    catalog.create_service.return_value = _view()
    bib = AsyncMock()
    bundle = _bundle(catalog=catalog)
    bundle.biblioteca = bib
    bib.get_template = lambda **kw: PresetSuggestion(  # sync method
        canonical_ref="diseno_de_sonrisa",
        name="Diseño de sonrisa",
        clinic_type="dental",
        category="Estética dental",
        modality="sesiones",
        synonyms=["fundas"],
        keywords=["sonrisa"],
    )
    with _patch() as mock_build:
        mock_build.return_value = bundle
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                f"{_BASE}/from-template",
                headers={"X-Tenant-ID": _TENANT_A, "X-User-ID": _OWNER_ID, "X-User-Role": "owner"},
                json={"canonical_service_ref": "diseno_de_sonrisa", "clinic_type": "dental"},
            )
    assert resp.status_code == 201
    assert resp.json()["public_name"] == "Limpieza dental"


@pytest.mark.asyncio
async def test_create_custom_returns_201(app) -> None:
    catalog = AsyncMock()
    catalog.create_service.return_value = _view()
    with _patch() as mock_build:
        mock_build.return_value = _bundle(catalog=catalog)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                f"{_BASE}/custom",
                headers={"X-Tenant-ID": _TENANT_A, "X-User-ID": _OWNER_ID, "X-User-Role": "admin_clinic"},
                json={
                    "public_name": "Limpieza dental",
                    "price": "120",
                    "currency": "PEN",
                    "modality": "unica",
                    "category": "Odontología general",
                },
            )
    assert resp.status_code == 201
    catalog.create_service.assert_awaited()
    assert catalog.create_service.await_args.kwargs["canonical_ref"] is None


@pytest.mark.asyncio
async def test_patch_service_returns_200(app) -> None:
    catalog = AsyncMock()
    catalog.patch_service.return_value = _view()
    with _patch() as mock_build:
        mock_build.return_value = _bundle(catalog=catalog)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.patch(
                f"{_BASE}/{_OFFER_ID}",
                headers={"X-Tenant-ID": _TENANT_A, "X-User-ID": _OWNER_ID, "X-User-Role": "owner"},
                json={"public_name": "Limpieza dental premium"},
            )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_activate_returns_200(app) -> None:
    catalog = AsyncMock()
    catalog.set_active.return_value = _view(is_active=True, status=OfferStatus.ACTIVE)
    with _patch() as mock_build:
        mock_build.return_value = _bundle(catalog=catalog)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                f"{_BASE}/{_OFFER_ID}/activate",
                headers={"X-Tenant-ID": _TENANT_A, "X-User-ID": _OWNER_ID, "X-User-Role": "owner"},
                json={"is_active": True},
            )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True
    catalog.set_active.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_service_returns_204(app) -> None:
    catalog = AsyncMock()
    catalog.get_service.return_value = _view()
    catalog.soft_delete.return_value = None
    with _patch() as mock_build:
        mock_build.return_value = _bundle(catalog=catalog)
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.delete(
                f"{_BASE}/{_OFFER_ID}",
                headers={"X-Tenant-ID": _TENANT_A, "X-User-ID": _OWNER_ID, "X-User-Role": "owner"},
            )
    assert resp.status_code == 204
    catalog.soft_delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_biblioteca_search_returns_200(app) -> None:
    bib = AsyncMock()
    bib.search = lambda **kw: [
        PresetSuggestion(
            canonical_ref="carillas_porcelana",
            name="Carillas de porcelana",
            clinic_type="dental",
            category="Estética dental",
            modality="sesiones",
            synonyms=["fundas"],
            keywords=["carillas"],
        )
    ]
    bundle = _bundle()
    bundle.biblioteca = bib
    with _patch() as mock_build:
        mock_build.return_value = bundle
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/offer/biblioteca/search",
                params={"q": "fundas", "clinic_type": "dental"},
                headers={"X-Tenant-ID": _TENANT_A},
            )
    assert resp.status_code == 200
    assert resp.json()["items"][0]["name"] == "Carillas de porcelana"


@pytest.mark.asyncio
async def test_invalid_tenant_uuid_returns_422(app) -> None:
    with _patch() as mock_build:
        mock_build.return_value = _bundle()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(_BASE, headers={"X-Tenant-ID": "not-a-uuid"})
    assert resp.status_code == 422
    assert isinstance(UUID(_TENANT_A), UUID)  # guard: constant is a valid uuid
