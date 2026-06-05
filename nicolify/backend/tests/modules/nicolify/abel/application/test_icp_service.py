# cap: abel/icp-buyer  # noqa: ERA001
"""Tests de application layer para IcpService + BuyerService (T-BE-2).

Cobertura:
- IcpService.mark_ready: RN-8 — retorna IcpMarkReadyResponse(missing=[...]) NO levanta
- IcpService.create: RN-7 — IcpLabelConflict si label duplicada
- IcpService.patch: RN-7 — idempotente (mismo label en PATCH self no falla)
- BuyerService.set_primary: RN-6 — clear_primary antes de set
- BuyerService.create: RN-5 — BuyerNotInIcp si ICP no existe

Tests unitarios con repositorios in-memory (no DB real).
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest


# ─────────────────────────────────────────────────────────────────────────────
# In-memory repos (reusan misma implementación del test de infra)
# ─────────────────────────────────────────────────────────────────────────────


class InMemoryIcpRepository:
    """In-memory IcpRepository para tests unitarios de application layer."""

    def __init__(self) -> None:
        """Initialize empty store."""
        self._store: dict[str, Any] = {}

    async def create(self, tenant_id: Any, icp: Any) -> Any:
        """Persist ICP in memory."""
        icp_copy = icp.model_copy()
        self._store[str(icp.id)] = {"icp": icp_copy, "tenant_id": str(tenant_id)}
        return icp_copy

    async def get_by_id(self, tenant_id: Any, icp_id: Any) -> Any:
        """Get ICP scoped by tenant."""
        entry = self._store.get(str(icp_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return None
        if entry["icp"].deleted_at is not None:
            return None
        return entry["icp"]

    async def list_by_tenant(self, tenant_id: Any) -> list[Any]:
        """List active ICPs for tenant."""
        return [
            e["icp"] for e in self._store.values() if e["tenant_id"] == str(tenant_id) and e["icp"].deleted_at is None
        ]

    async def update(self, tenant_id: Any, icp_id: Any, patch: dict) -> Any:
        """Apply patch to ICP."""
        entry = self._store.get(str(icp_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return None
        if entry["icp"].deleted_at is not None:
            return None
        icp = entry["icp"]
        updated = icp.model_copy(update={k: v for k, v in patch.items() if v is not None})
        entry["icp"] = updated
        return updated

    async def soft_delete(self, tenant_id: Any, icp_id: Any) -> bool:
        """Soft-delete ICP."""
        from datetime import datetime, timezone

        entry = self._store.get(str(icp_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return False
        entry["icp"] = entry["icp"].model_copy(update={"deleted_at": datetime.now(timezone.utc)})
        return True

    async def label_exists(self, tenant_id: Any, label: str, exclude_id: Any = None) -> bool:
        """Check unique label per tenant (case-insensitive, soft-delete aware)."""
        for entry in self._store.values():
            if entry["tenant_id"] != str(tenant_id):
                continue
            icp = entry["icp"]
            if icp.deleted_at is not None:
                continue
            if icp.label.lower() == label.lower() and (exclude_id is None or str(icp.id) != str(exclude_id)):
                return True
        return False


class InMemoryBuyerRepository:
    """In-memory BuyerRepository para tests unitarios de application layer."""

    def __init__(self) -> None:
        """Initialize empty store."""
        self._store: dict[str, Any] = {}

    async def create(self, tenant_id: Any, buyer: Any) -> Any:
        """Persist buyer in memory."""
        buyer_copy = buyer.model_copy()
        self._store[str(buyer.id)] = {"buyer": buyer_copy, "tenant_id": str(tenant_id)}
        return buyer_copy

    async def get_by_id(self, tenant_id: Any, buyer_id: Any) -> Any:
        """Get buyer scoped by tenant."""
        entry = self._store.get(str(buyer_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return None
        return entry["buyer"]

    async def list_by_icp(self, tenant_id: Any, icp_id: Any) -> list[Any]:
        """List buyers for ICP scoped by tenant."""
        return [
            e["buyer"]
            for e in self._store.values()
            if e["tenant_id"] == str(tenant_id)
            and str(e["buyer"].icp_id) == str(icp_id)
            and e["buyer"].deleted_at is None
        ]

    async def update(self, tenant_id: Any, buyer_id: Any, patch: dict) -> Any:
        """Apply patch to buyer."""
        entry = self._store.get(str(buyer_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return None
        buyer = entry["buyer"]
        updated = buyer.model_copy(update={k: v for k, v in patch.items() if v is not None})
        entry["buyer"] = updated
        return updated

    async def soft_delete(self, tenant_id: Any, buyer_id: Any) -> bool:
        """Soft-delete buyer."""
        from datetime import datetime, timezone

        entry = self._store.get(str(buyer_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return False
        entry["buyer"] = entry["buyer"].model_copy(update={"deleted_at": datetime.now(timezone.utc)})
        return True

    async def clear_primary(self, tenant_id: Any, icp_id: Any) -> None:
        """RN-6: demote all primary buyers in ICP."""
        for entry in self._store.values():
            if (
                entry["tenant_id"] == str(tenant_id)
                and str(entry["buyer"].icp_id) == str(icp_id)
                and entry["buyer"].is_primary
                and entry["buyer"].deleted_at is None
            ):
                entry["buyer"] = entry["buyer"].model_copy(update={"is_primary": False})


def _make_icp_service(icp_repo: Any, buyer_repo: Any) -> Any:
    """Build IcpService with in-memory repos (bypasses session DI)."""
    from src.modules.nicolify.abel.application.services.icp_service import IcpService

    mock_session = AsyncMock()
    mock_session.commit = AsyncMock()
    service = IcpService.__new__(IcpService)
    service._session = mock_session
    service._icp_repo = icp_repo
    service._buyer_repo = buyer_repo
    # Emitter best-effort (mock it)
    mock_emitter = AsyncMock()
    mock_emitter.emit = AsyncMock()
    service._emitter = mock_emitter
    return service


def _make_buyer_service(icp_repo: Any, buyer_repo: Any) -> Any:
    """Build BuyerService with in-memory repos."""
    from src.modules.nicolify.abel.application.services.buyer_service import BuyerService

    mock_session = AsyncMock()
    mock_session.commit = AsyncMock()
    service = BuyerService.__new__(BuyerService)
    service._session = mock_session
    service._buyer_repo = buyer_repo
    service._icp_repo = icp_repo
    mock_emitter = AsyncMock()
    mock_emitter.emit = AsyncMock()
    service._emitter = mock_emitter
    return service


# ─────────────────────────────────────────────────────────────────────────────
# Tests: IcpService  # noqa: ERA001
# ─────────────────────────────────────────────────────────────────────────────


class TestIcpServiceMarkReady:
    """RN-8: mark_ready valida mínimos → IcpMarkReadyResponse (NO levanta)."""

    @pytest.mark.asyncio
    async def test_mark_ready_returns_missing_when_fields_absent(self):
        """RN-8: mark_ready con campos faltantes retorna IcpMarkReadyResponse(missing=[...]) NO levanta."""
        from src.modules.nicolify.abel.domain.icp import Icp, IcpStatus

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        # ICP sin vertical ni main_pain ni sales_angle (mínimos RN-8 faltantes)
        icp = Icp(id=icp_id, tenant_id=tenant_id, label="ICP incompleto")
        await icp_repo.create(tenant_id, icp)

        service = _make_icp_service(icp_repo, buyer_repo)
        result = await service.mark_ready(tenant_id, icp_id)

        # RN-8: NO levanta — retorna response con missing[]
        assert result is not None
        assert result.missing  # lista no vacía
        assert "vertical" in result.missing
        assert "main_pain" in result.missing
        assert "sales_angle" in result.missing
        assert "buyer_with_role" in result.missing
        assert result.status == IcpStatus.BORRADOR  # sin cambiar estado

    @pytest.mark.asyncio
    async def test_mark_ready_requires_buyer_with_role(self):
        """RN-8: ICP con campos mínimos pero sin buyer con role → missing buyer_with_role."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        icp = Icp(
            id=icp_id,
            tenant_id=tenant_id,
            label="ICP casi listo",
            vertical="Agencias marketing",
            main_pain="Falta ROI en campañas",
            sales_angle="ROI garantizado en 90 días",
        )
        await icp_repo.create(tenant_id, icp)
        # Sin buyers → falta buyer_with_role

        service = _make_icp_service(icp_repo, buyer_repo)
        result = await service.mark_ready(tenant_id, icp_id)

        assert result is not None
        assert "buyer_with_role" in result.missing

    @pytest.mark.asyncio
    async def test_mark_ready_success_when_minimum_met(self):
        """RN-8: ICP con todos los mínimos + ≥1 buyer con role → status=listo, missing=[]."""
        from src.modules.nicolify.abel.domain.buyer import Buyer
        from src.modules.nicolify.abel.domain.icp import Icp, IcpStatus

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        icp = Icp(
            id=icp_id,
            tenant_id=tenant_id,
            label="ICP listo",
            vertical="Agencias marketing",
            main_pain="Falta ROI",
            sales_angle="ROI garantizado",
        )
        await icp_repo.create(tenant_id, icp)

        buyer = Buyer(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            icp_id=icp_id,
            name="Ana Directora",
            role="CMO",  # role presente → cumple RN-8
        )
        await buyer_repo.create(tenant_id, buyer)

        service = _make_icp_service(icp_repo, buyer_repo)
        result = await service.mark_ready(tenant_id, icp_id)

        assert result is not None
        assert result.missing == []
        assert result.status == IcpStatus.LISTO

    @pytest.mark.asyncio
    async def test_mark_ready_not_found_returns_none(self):
        """RN-8: ICP no existe → mark_ready retorna None (→ 404 en router)."""
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()
        service = _make_icp_service(icp_repo, buyer_repo)

        result = await service.mark_ready(uuid.uuid4(), uuid.uuid4())
        assert result is None


class TestIcpServiceLabelConflict:
    """RN-7: create/patch con etiqueta duplicada → IcpLabelConflict."""

    @pytest.mark.asyncio
    async def test_create_duplicate_label_raises_label_conflict(self):
        """RN-7: crear ICP con etiqueta existente levanta IcpLabelConflict."""
        from src.modules.nicolify.abel.application.dtos.icp_dtos import IcpCreate
        from src.modules.nicolify.abel.domain.exceptions import IcpLabelConflict
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        # Pre-seed un ICP con la etiqueta
        existing = Icp(id=uuid.uuid4(), tenant_id=tenant_id, label="Agencias B2B")
        await icp_repo.create(tenant_id, existing)

        service = _make_icp_service(icp_repo, buyer_repo)
        dto = IcpCreate(label="Agencias B2B")

        with pytest.raises(IcpLabelConflict):
            await service.create(tenant_id, dto)

    @pytest.mark.asyncio
    async def test_patch_same_label_on_self_is_idempotent(self):
        """RN-7: PATCH con la misma etiqueta del propio ICP → idempotente (no falla)."""
        from src.modules.nicolify.abel.application.dtos.icp_dtos import IcpCreate, IcpPatch
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        icp = Icp(id=icp_id, tenant_id=tenant_id, label="Mi ICP")
        await icp_repo.create(tenant_id, icp)

        service = _make_icp_service(icp_repo, buyer_repo)
        # PATCH con el mismo label del propio ICP → NO falla (exclude_id lo excluye)
        result = await service.patch(tenant_id, icp_id, IcpPatch(label="Mi ICP"))
        assert result is not None
        assert result.label == "Mi ICP"

    @pytest.mark.asyncio
    async def test_patch_to_existing_label_of_another_icp_raises(self):
        """RN-7: PATCH a etiqueta de otro ICP → IcpLabelConflict."""
        from src.modules.nicolify.abel.application.dtos.icp_dtos import IcpPatch
        from src.modules.nicolify.abel.domain.exceptions import IcpLabelConflict
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_a_id = uuid.uuid4()
        icp_b_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        icp_a = Icp(id=icp_a_id, tenant_id=tenant_id, label="Etiqueta A")
        icp_b = Icp(id=icp_b_id, tenant_id=tenant_id, label="Etiqueta B")
        await icp_repo.create(tenant_id, icp_a)
        await icp_repo.create(tenant_id, icp_b)

        service = _make_icp_service(icp_repo, buyer_repo)
        # ICP B quiere la etiqueta de ICP A → debe fallar
        with pytest.raises(IcpLabelConflict):
            await service.patch(tenant_id, icp_b_id, IcpPatch(label="Etiqueta A"))


# ─────────────────────────────────────────────────────────────────────────────
# Tests: BuyerService  # noqa: ERA001
# ─────────────────────────────────────────────────────────────────────────────


class TestBuyerServiceSetPrimary:
    """RN-6: set_primary demota todos antes de promover nuevo."""

    @pytest.mark.asyncio
    async def test_set_primary_demotes_all_others_in_icp(self):
        """RN-6: set_primary limpia primarios anteriores antes de promover."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        buyer_a_id = uuid.uuid4()
        buyer_b_id = uuid.uuid4()
        buyer_a = Buyer(id=buyer_a_id, tenant_id=tenant_id, icp_id=icp_id, name="Ana", is_primary=True)
        buyer_b = Buyer(id=buyer_b_id, tenant_id=tenant_id, icp_id=icp_id, name="Pedro", is_primary=False)
        await buyer_repo.create(tenant_id, buyer_a)
        await buyer_repo.create(tenant_id, buyer_b)

        service = _make_buyer_service(icp_repo, buyer_repo)
        result = await service.set_primary(tenant_id, buyer_b_id)

        assert result is not None
        assert result.is_primary is True

        # Ana debe estar demotada
        buyers = await buyer_repo.list_by_icp(tenant_id, icp_id)
        primaries = [b for b in buyers if b.is_primary]
        assert len(primaries) == 1
        assert str(primaries[0].id) == str(buyer_b_id)

    @pytest.mark.asyncio
    async def test_set_primary_not_found_returns_none(self):
        """RN-6: buyer no existe → set_primary retorna None (→ 404 en router)."""
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()
        service = _make_buyer_service(icp_repo, buyer_repo)

        result = await service.set_primary(uuid.uuid4(), uuid.uuid4())
        assert result is None


class TestBuyerServiceCreate:
    """RN-5: buyer debe pertenecer a un ICP existente del mismo tenant."""

    @pytest.mark.asyncio
    async def test_create_buyer_raises_if_icp_not_found(self):
        """RN-5: ICP no existe → BuyerNotInIcp."""
        from src.modules.nicolify.abel.application.dtos.buyer_dtos import BuyerCreate
        from src.modules.nicolify.abel.domain.exceptions import BuyerNotInIcp

        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()
        service = _make_buyer_service(icp_repo, buyer_repo)

        with pytest.raises(BuyerNotInIcp):
            await service.create(uuid.uuid4(), uuid.uuid4(), BuyerCreate(name="Sin ICP"))

    @pytest.mark.asyncio
    async def test_create_buyer_success(self):
        """RN-5: buyer creado correctamente con ICP existente."""
        from src.modules.nicolify.abel.application.dtos.buyer_dtos import BuyerCreate
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        icp = Icp(id=icp_id, tenant_id=tenant_id, label="ICP válido")
        await icp_repo.create(tenant_id, icp)

        service = _make_buyer_service(icp_repo, buyer_repo)
        result = await service.create(tenant_id, icp_id, BuyerCreate(name="Carlos Gerente"))

        assert result is not None
        assert result.name == "Carlos Gerente"
        assert str(result.icp_id) == str(icp_id)
        assert result.is_primary is False  # RN-6: siempre nace False

    @pytest.mark.asyncio
    async def test_create_buyer_cross_tenant_icp_raises(self):
        """RN-5: ICP de otro tenant → BuyerNotInIcp (ICP no visible cross-tenant)."""
        from src.modules.nicolify.abel.application.dtos.buyer_dtos import BuyerCreate
        from src.modules.nicolify.abel.domain.exceptions import BuyerNotInIcp
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        icp_id = uuid.uuid4()
        icp_repo = InMemoryIcpRepository()
        buyer_repo = InMemoryBuyerRepository()

        icp = Icp(id=icp_id, tenant_id=tenant_a, label="ICP de A")
        await icp_repo.create(tenant_a, icp)

        service = _make_buyer_service(icp_repo, buyer_repo)
        # tenant_b intenta crear buyer en el ICP de tenant_a → debe fallar
        with pytest.raises(BuyerNotInIcp):
            await service.create(tenant_b, icp_id, BuyerCreate(name="Infiltrado"))
