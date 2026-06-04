# cap: abel/icp-buyer  # noqa: ERA001
"""Tests RED-first para domain entities Icp y Buyer (T-BE-1).

Cobertura: invariantes de dominio, status default, FK icp_id, RN-6 helper.
Escenarios: SC-edge-primary (set_primary logic).
"""

from __future__ import annotations

import uuid
from decimal import Decimal

import pytest


class TestIcpDomain:
    """Icp entity invariants (domain pure, no framework deps)."""

    def test_icp_default_status_is_borrador(self):
        """ICP nace siempre en borrador (RN-2 draft-first)."""
        from src.modules.nicolify.abel.domain.icp import Icp, IcpStatus

        icp = Icp(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            label="Agencias marketing LatAm",
        )
        assert icp.status == IcpStatus.BORRADOR

    def test_icp_default_origin_is_manual(self):
        """ICP manual nace con origin=manual."""
        from src.modules.nicolify.abel.domain.icp import Icp, IcpOrigin

        icp = Icp(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            label="Test ICP",
        )
        assert icp.origin == IcpOrigin.MANUAL

    def test_icp_label_required(self):
        """ICP sin label debe fallar validación."""
        from pydantic import ValidationError
        from src.modules.nicolify.abel.domain.icp import Icp

        with pytest.raises((ValidationError, TypeError)):
            Icp(
                id=uuid.uuid4(),
                tenant_id=uuid.uuid4(),
                # label missing
            )

    def test_icp_tenant_id_required(self):
        """ICP sin tenant_id debe fallar validación."""
        from pydantic import ValidationError
        from src.modules.nicolify.abel.domain.icp import Icp

        with pytest.raises((ValidationError, TypeError)):
            Icp(
                id=uuid.uuid4(),
                label="Test",
                # tenant_id missing
            )

    def test_icp_signals_default_empty_list(self):
        """ICP signals default es lista vacía."""
        from src.modules.nicolify.abel.domain.icp import Icp

        icp = Icp(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            label="Test",
        )
        assert icp.signals == []

    def test_icp_deleted_at_default_none(self):
        """ICP deleted_at nace en None (soft delete)."""
        from src.modules.nicolify.abel.domain.icp import Icp

        icp = Icp(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            label="Test",
        )
        assert icp.deleted_at is None

    def test_icp_avg_ticket_currency_preserved(self):
        """RN-11: avg_ticket_currency preservado (no convertir on-write)."""
        from src.modules.nicolify.abel.domain.icp import Icp

        icp = Icp(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            label="ICP con moneda",
            avg_ticket=Decimal("5000.00"),
            avg_ticket_currency="MXN",
        )
        assert icp.avg_ticket_currency == "MXN"
        assert icp.avg_ticket == Decimal("5000.00")

    def test_icp_status_enum_values(self):
        """IcpStatus tiene borrador y listo."""
        from src.modules.nicolify.abel.domain.icp import IcpStatus

        assert IcpStatus.BORRADOR == "borrador"
        assert IcpStatus.LISTO == "listo"

    def test_icp_origin_enum_values(self):
        """IcpOrigin tiene manual y draft."""
        from src.modules.nicolify.abel.domain.icp import IcpOrigin

        assert IcpOrigin.MANUAL == "manual"
        assert IcpOrigin.DRAFT == "draft"


class TestBuyerDomain:
    """Buyer entity invariants (domain pure, no framework deps)."""

    def test_buyer_requires_icp_id(self):
        """RN-5: Buyer debe tener icp_id (FK al ICP)."""
        from pydantic import ValidationError
        from src.modules.nicolify.abel.domain.buyer import Buyer

        with pytest.raises((ValidationError, TypeError)):
            Buyer(
                id=uuid.uuid4(),
                tenant_id=uuid.uuid4(),
                name="Carlos Directivo",
                # icp_id missing
            )

    def test_buyer_default_is_primary_false(self):
        """RN-6: Buyer nace con is_primary=False."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        buyer = Buyer(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            icp_id=uuid.uuid4(),
            name="Ana Gerente",
        )
        assert buyer.is_primary is False

    def test_buyer_deleted_at_default_none(self):
        """Buyer deleted_at nace en None (soft delete)."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        buyer = Buyer(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            icp_id=uuid.uuid4(),
            name="Pedro Jefe",
        )
        assert buyer.deleted_at is None

    def test_buyer_decision_power_enum(self):
        """DecisionPower tiene los valores del modelo B2B."""
        from src.modules.nicolify.abel.domain.buyer import DecisionPower

        assert DecisionPower.DECISOR_ECONOMICO == "decisor_economico"
        assert DecisionPower.CHAMPION == "champion"
        assert DecisionPower.INFLUENCER_TECNICO == "influencer_tecnico"
        assert DecisionPower.APROBADOR == "aprobador"
        assert DecisionPower.USUARIO == "usuario"
        assert DecisionPower.BLOQUEADOR == "bloqueador"

    def test_buyer_jsonb_fields_default_empty(self):
        """Campos JSONB del buyer default en estructuras vacías."""
        from src.modules.nicolify.abel.domain.buyer import Buyer

        buyer = Buyer(
            id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            icp_id=uuid.uuid4(),
            name="Sandra",
        )
        assert buyer.demographics == {}
        assert buyer.psychographics == {}
        assert buyer.pain_points == []
        assert buyer.desires == []
        assert buyer.objections == []
        assert buyer.buyer_journey == {}
        assert buyer.purchase_triggers == []
        assert buyer.preferred_channels == []

    def test_buyer_tenant_id_required(self):
        """Buyer sin tenant_id debe fallar."""
        from pydantic import ValidationError
        from src.modules.nicolify.abel.domain.buyer import Buyer

        with pytest.raises((ValidationError, TypeError)):
            Buyer(
                id=uuid.uuid4(),
                icp_id=uuid.uuid4(),
                name="Sin tenant",
            )

    def test_buyer_name_required(self):
        """Buyer sin name debe fallar."""
        from pydantic import ValidationError
        from src.modules.nicolify.abel.domain.buyer import Buyer

        with pytest.raises((ValidationError, TypeError)):
            Buyer(
                id=uuid.uuid4(),
                tenant_id=uuid.uuid4(),
                icp_id=uuid.uuid4(),
            )


class TestDomainExceptions:
    """Domain exceptions existen y son instanciables."""

    def test_icp_label_conflict_exception(self):
        """IcpLabelConflict es importable y tiene mensaje."""
        from src.modules.nicolify.abel.domain.exceptions import IcpLabelConflict

        exc = IcpLabelConflict("agencias-mx")
        assert "agencias-mx" in str(exc)

    def test_icp_minimum_not_met_exception(self):
        """IcpMinimumNotMet lleva la lista de campos faltantes."""
        from src.modules.nicolify.abel.domain.exceptions import IcpMinimumNotMet

        exc = IcpMinimumNotMet(["vertical", "main_pain"])
        assert "vertical" in str(exc)

    def test_buyer_not_in_icp_exception(self):
        """BuyerNotInIcp es importable."""
        from src.modules.nicolify.abel.domain.exceptions import BuyerNotInIcp

        exc = BuyerNotInIcp(uuid.uuid4(), uuid.uuid4())
        assert exc is not None
