# cap: abel/icp-buyer  # noqa: ERA001
"""Tests RED-first para repos ICP/Buyer (T-BE-1).

Cobertura: tenant isolation (RN-1 cross-tenant→None), unique label (RN-7),
clear_primary (RN-6), soft delete.
Escenarios: SC-adversarial-tenant, SC-race-unique, SC-edge-primary, SC-edge-concurrent.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

import pytest

# ─────────────────────────────────────────────────────────────────────────────
# In-memory repo mock fixture (unit-level — no real DB)
# ─────────────────────────────────────────────────────────────────────────────


class InMemoryIcpRepository:
    """In-memory implementation of IcpRepository for unit tests."""

    def __init__(self):
        self._store: dict[str, Any] = {}

    async def create(self, tenant_id, icp):
        from src.modules.nicolify.abel.domain.icp import Icp

        icp_copy = icp.model_copy()
        self._store[str(icp.id)] = {"icp": icp_copy, "tenant_id": str(tenant_id)}
        return icp_copy

    async def get_by_id(self, tenant_id, icp_id):
        entry = self._store.get(str(icp_id))
        if entry is None:
            return None
        if entry["tenant_id"] != str(tenant_id):
            return None  # RN-1: cross-tenant → None
        return entry["icp"]

    async def list_by_tenant(self, tenant_id):
        return [
            e["icp"] for e in self._store.values() if e["tenant_id"] == str(tenant_id) and e["icp"].deleted_at is None
        ]

    async def update(self, tenant_id, icp_id, patch):
        entry = self._store.get(str(icp_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return None
        icp = entry["icp"]
        updated = icp.model_copy(update={k: v for k, v in patch.items() if v is not None})
        entry["icp"] = updated
        return updated

    async def soft_delete(self, tenant_id, icp_id):
        from datetime import datetime, timezone

        entry = self._store.get(str(icp_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return False
        entry["icp"] = entry["icp"].model_copy(update={"deleted_at": datetime.now(timezone.utc)})
        return True

    async def label_exists(self, tenant_id, label, exclude_id=None):
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
    """In-memory implementation of BuyerRepository for unit tests."""

    def __init__(self):
        self._store: dict[str, Any] = {}

    async def create(self, tenant_id, buyer):
        buyer_copy = buyer.model_copy()
        self._store[str(buyer.id)] = {"buyer": buyer_copy, "tenant_id": str(tenant_id)}
        return buyer_copy

    async def get_by_id(self, tenant_id, buyer_id):
        entry = self._store.get(str(buyer_id))
        if entry is None:
            return None
        if entry["tenant_id"] != str(tenant_id):
            return None  # RN-1
        return entry["buyer"]

    async def list_by_icp(self, tenant_id, icp_id):
        return [
            e["buyer"]
            for e in self._store.values()
            if e["tenant_id"] == str(tenant_id)
            and str(e["buyer"].icp_id) == str(icp_id)
            and e["buyer"].deleted_at is None
        ]

    async def update(self, tenant_id, buyer_id, patch):
        entry = self._store.get(str(buyer_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return None
        buyer = entry["buyer"]
        updated = buyer.model_copy(update={k: v for k, v in patch.items() if v is not None})
        entry["buyer"] = updated
        return updated

    async def soft_delete(self, tenant_id, buyer_id):
        from datetime import datetime, timezone

        entry = self._store.get(str(buyer_id))
        if entry is None or entry["tenant_id"] != str(tenant_id):
            return False
        entry["buyer"] = entry["buyer"].model_copy(update={"deleted_at": datetime.now(timezone.utc)})
        return True

    async def clear_primary(self, tenant_id, icp_id):
        """RN-6: demote all primary buyers in this ICP to is_primary=False."""
        for entry in self._store.values():
            if (
                entry["tenant_id"] == str(tenant_id)
                and str(entry["buyer"].icp_id) == str(icp_id)
                and entry["buyer"].is_primary
                and entry["buyer"].deleted_at is None
            ):
                entry["buyer"] = entry["buyer"].model_copy(update={"is_primary": False})


# ─────────────────────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────────────────────


class TestIcpRepositoryTenantIsolation:
    """SC-adversarial-tenant: get_by_id debe retornar None para tenant ajeno (RN-1)."""

    @pytest.mark.asyncio
    async def test_get_by_id_cross_tenant_returns_none(self):
        """RN-1: ICP de tenant A no visible para tenant B."""
        from src.modules.nicolify.abel.domain.icp import Icp, IcpStatus, IcpOrigin

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        icp_id = uuid.uuid4()

        repo = InMemoryIcpRepository()
        icp = Icp(id=icp_id, tenant_id=tenant_a, label="ICP privado")
        await repo.create(tenant_a, icp)

        # tenant_b trying to access tenant_a's ICP → must return None
        result = await repo.get_by_id(tenant_b, icp_id)
        assert result is None

    @pytest.mark.asyncio
    async def test_list_by_tenant_only_own_icps(self):
        """RN-1: list_by_tenant retorna solo ICPs del tenant propio."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        repo = InMemoryIcpRepository()

        icp_a = Icp(id=uuid.uuid4(), tenant_id=tenant_a, label="ICP de A")
        icp_b = Icp(id=uuid.uuid4(), tenant_id=tenant_b, label="ICP de B")
        await repo.create(tenant_a, icp_a)
        await repo.create(tenant_b, icp_b)

        result_a = await repo.list_by_tenant(tenant_a)
        result_b = await repo.list_by_tenant(tenant_b)

        assert len(result_a) == 1
        assert result_a[0].label == "ICP de A"
        assert len(result_b) == 1
        assert result_b[0].label == "ICP de B"

    @pytest.mark.asyncio
    async def test_update_cross_tenant_returns_none(self):
        """RN-1: update con tenant ajeno retorna None sin modificar nada."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        icp_id = uuid.uuid4()
        repo = InMemoryIcpRepository()

        icp = Icp(id=icp_id, tenant_id=tenant_a, label="Original")
        await repo.create(tenant_a, icp)

        result = await repo.update(tenant_b, icp_id, {"label": "Modificado"})
        assert result is None

        # Verify original is untouched
        original = await repo.get_by_id(tenant_a, icp_id)
        assert original is not None
        assert original.label == "Original"


class TestIcpRepositoryUniqueLabel:
    """SC-race-unique: label_exists enforza unicidad por tenant (RN-7)."""

    @pytest.mark.asyncio
    async def test_label_exists_same_tenant(self):
        """RN-7: label existente para mismo tenant → True."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        repo = InMemoryIcpRepository()
        icp = Icp(id=uuid.uuid4(), tenant_id=tenant_id, label="Agencias Marketing")
        await repo.create(tenant_id, icp)

        exists = await repo.label_exists(tenant_id, "Agencias Marketing")
        assert exists is True

    @pytest.mark.asyncio
    async def test_label_exists_case_insensitive(self):
        """RN-7: unicidad case-insensitive."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        repo = InMemoryIcpRepository()
        icp = Icp(id=uuid.uuid4(), tenant_id=tenant_id, label="agencias marketing")
        await repo.create(tenant_id, icp)

        exists = await repo.label_exists(tenant_id, "AGENCIAS MARKETING")
        assert exists is True

    @pytest.mark.asyncio
    async def test_label_exists_different_tenant_false(self):
        """RN-7: mismo label en otro tenant no cuenta."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        repo = InMemoryIcpRepository()
        icp = Icp(id=uuid.uuid4(), tenant_id=tenant_a, label="ICP Compartido")
        await repo.create(tenant_a, icp)

        # tenant_b can use the same label
        exists = await repo.label_exists(tenant_b, "ICP Compartido")
        assert exists is False

    @pytest.mark.asyncio
    async def test_label_exists_exclude_self(self):
        """RN-7: exclude_id permite PATCH sin falso positivo."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        repo = InMemoryIcpRepository()
        icp = Icp(id=icp_id, tenant_id=tenant_id, label="Mi ICP")
        await repo.create(tenant_id, icp)

        # Misma etiqueta pero excluimos el propio → False
        exists = await repo.label_exists(tenant_id, "Mi ICP", exclude_id=icp_id)
        assert exists is False

    @pytest.mark.asyncio
    async def test_label_not_exists_for_deleted(self):
        """RN-7: etiqueta de ICP soft-deleted no bloquea nueva creación."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        repo = InMemoryIcpRepository()
        icp = Icp(id=icp_id, tenant_id=tenant_id, label="ICP Borrado")
        await repo.create(tenant_id, icp)
        await repo.soft_delete(tenant_id, icp_id)

        # After soft-delete, label should be available
        exists = await repo.label_exists(tenant_id, "ICP Borrado")
        assert exists is False


class TestBuyerRepositoryClearPrimary:
    """SC-edge-primary: clear_primary demota todos los primarios del ICP (RN-6)."""

    @pytest.mark.asyncio
    async def test_clear_primary_demotes_all(self):
        """RN-6: clear_primary demota todos los buyers primarios del ICP."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        repo = InMemoryBuyerRepository()

        buyer_a = Buyer(id=uuid.uuid4(), tenant_id=tenant_id, icp_id=icp_id, name="Ana", is_primary=True)
        buyer_b = Buyer(id=uuid.uuid4(), tenant_id=tenant_id, icp_id=icp_id, name="Pedro", is_primary=False)
        await repo.create(tenant_id, buyer_a)
        await repo.create(tenant_id, buyer_b)

        await repo.clear_primary(tenant_id, icp_id)

        buyers = await repo.list_by_icp(tenant_id, icp_id)
        for b in buyers:
            assert b.is_primary is False

    @pytest.mark.asyncio
    async def test_clear_primary_only_affects_own_icp(self):
        """RN-6: clear_primary no afecta buyers de otro ICP."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        tenant_id = uuid.uuid4()
        icp_a = uuid.uuid4()
        icp_b = uuid.uuid4()
        repo = InMemoryBuyerRepository()

        buyer_a = Buyer(id=uuid.uuid4(), tenant_id=tenant_id, icp_id=icp_a, name="A", is_primary=True)
        buyer_b = Buyer(id=uuid.uuid4(), tenant_id=tenant_id, icp_id=icp_b, name="B", is_primary=True)
        await repo.create(tenant_id, buyer_a)
        await repo.create(tenant_id, buyer_b)

        await repo.clear_primary(tenant_id, icp_a)

        buyers_b = await repo.list_by_icp(tenant_id, icp_b)
        assert buyers_b[0].is_primary is True

    @pytest.mark.asyncio
    async def test_get_by_id_cross_tenant_buyer_returns_none(self):
        """RN-1: buyer de tenant A no visible para tenant B."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        buyer_id = uuid.uuid4()
        repo = InMemoryBuyerRepository()

        buyer = Buyer(id=buyer_id, tenant_id=tenant_a, icp_id=uuid.uuid4(), name="Privado")
        await repo.create(tenant_a, buyer)

        result = await repo.get_by_id(tenant_b, buyer_id)
        assert result is None

    @pytest.mark.asyncio
    async def test_list_by_icp_cross_tenant_returns_empty(self):
        """RN-1: list_by_icp con tenant ajeno retorna vacío."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        icp_id = uuid.uuid4()
        repo = InMemoryBuyerRepository()

        buyer = Buyer(id=uuid.uuid4(), tenant_id=tenant_a, icp_id=icp_id, name="Buyer")
        await repo.create(tenant_a, buyer)

        result = await repo.list_by_icp(tenant_b, icp_id)
        assert result == []


class TestIcpRepositorySoftDelete:
    """Soft delete behavior."""

    @pytest.mark.asyncio
    async def test_soft_delete_sets_deleted_at(self):
        """Soft delete pone deleted_at, no borra la fila."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_id = uuid.uuid4()
        icp_id = uuid.uuid4()
        repo = InMemoryIcpRepository()

        icp = Icp(id=icp_id, tenant_id=tenant_id, label="Para borrar")
        await repo.create(tenant_id, icp)

        result = await repo.soft_delete(tenant_id, icp_id)
        assert result is True

        # After soft delete, not in list
        icps = await repo.list_by_tenant(tenant_id)
        assert not any(i.id == icp_id for i in icps)

    @pytest.mark.asyncio
    async def test_soft_delete_cross_tenant_returns_false(self):
        """Soft delete en tenant ajeno retorna False."""
        from src.modules.nicolify.abel.domain.icp import Icp

        tenant_a = uuid.uuid4()
        tenant_b = uuid.uuid4()
        icp_id = uuid.uuid4()
        repo = InMemoryIcpRepository()

        icp = Icp(id=icp_id, tenant_id=tenant_a, label="Test")
        await repo.create(tenant_a, icp)

        result = await repo.soft_delete(tenant_b, icp_id)
        assert result is False
