# cap: abel/icp-buyer  # noqa: ERA001
"""BuyerService — application service for Buyer CRUD + set-primary.

Business rules enforced here:
- RN-5: buyer must hang from an existing ICP of the same tenant (BuyerNotInIcp → 404)
- RN-6: set_primary clears previous primary first (one transaction via clear_primary)
- telemetría best-effort (abel_buyer_added)
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from uuid import UUID

import structlog

from src.modules.nicolify.abel.application.dtos.buyer_dtos import (
    BuyerCreate,
    BuyerPatch,
    BuyerResponse,
)
from src.modules.nicolify.abel.application.telemetry.growth_studio_emitter import (
    GrowthStudioEmitter,
)
from src.modules.nicolify.abel.domain.buyer import Buyer
from src.modules.nicolify.abel.domain.exceptions import BuyerNotInIcp
from src.modules.nicolify.abel.infrastructure.repositories.buyer_repository import (
    BuyerRepository,
    SqlAlchemyBuyerRepository,
)
from src.modules.nicolify.abel.infrastructure.repositories.icp_repository import (
    IcpRepository,
    SqlAlchemyIcpRepository,
)

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


def _buyer_to_response(buyer: Buyer) -> BuyerResponse:
    """Map Buyer domain entity → BuyerResponse DTO."""
    return BuyerResponse(
        id=buyer.id,
        icp_id=buyer.icp_id,
        name=buyer.name,
        role=buyer.role,
        decision_power=buyer.decision_power,
        is_primary=buyer.is_primary,
        demographics=buyer.demographics,
        psychographics=buyer.psychographics,
        pain_points=buyer.pain_points,
        desires=buyer.desires,
        objections=buyer.objections,
        buyer_journey=buyer.buyer_journey,
        purchase_triggers=buyer.purchase_triggers,
        preferred_channels=buyer.preferred_channels,
        created_at=buyer.created_at,
        updated_at=buyer.updated_at,
    )


class BuyerService:
    """Business logic for Buyer lifecycle — CRUD + set-primary.

    Thin: validates ICP ownership, delegates to repos, emits telemetry.
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize BuyerService with database session."""
        self._session = session
        self._buyer_repo: BuyerRepository = SqlAlchemyBuyerRepository(session)
        self._icp_repo: IcpRepository = SqlAlchemyIcpRepository(session)
        self._emitter = GrowthStudioEmitter(session)

    async def list_by_icp(self, tenant_id: UUID, icp_id: UUID) -> list[BuyerResponse]:
        """List buyers for an ICP (scoped tenant_id ∧ icp_id)."""
        buyers = await self._buyer_repo.list_by_icp(tenant_id, icp_id)
        return [_buyer_to_response(b) for b in buyers]

    async def get(self, tenant_id: UUID, buyer_id: UUID) -> BuyerResponse | None:
        """Get buyer by id. Returns None for cross-tenant (→ 404 in router)."""
        buyer = await self._buyer_repo.get_by_id(tenant_id, buyer_id)
        return _buyer_to_response(buyer) if buyer else None

    async def create(self, tenant_id: UUID, icp_id: UUID, dto: BuyerCreate) -> BuyerResponse:
        """Create Buyer. Raises BuyerNotInIcp if ICP doesn't exist/cross-tenant (RN-5)."""
        # RN-5: verify ICP exists and belongs to this tenant
        icp = await self._icp_repo.get_by_id(tenant_id, icp_id)
        if icp is None:
            raise BuyerNotInIcp(uuid.uuid4(), icp_id)

        buyer = Buyer(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            icp_id=icp_id,
            name=dto.name,
            role=dto.role,
            decision_power=dto.decision_power,
            is_primary=False,  # always starts False (RN-6)
            demographics=dto.demographics,
            psychographics=dto.psychographics,
            pain_points=dto.pain_points,
            desires=dto.desires,
            objections=dto.objections,
            buyer_journey=dto.buyer_journey,
            purchase_triggers=dto.purchase_triggers,
            preferred_channels=dto.preferred_channels,
        )
        created = await self._buyer_repo.create(tenant_id, buyer)
        await self._session.commit()

        # Telemetría best-effort
        await self._emitter.emit(
            tenant_id=tenant_id,
            event_name="abel_buyer_added",
            props={"icp_id_hash": str(icp_id)[:8]},  # partial hash, no PII
        )
        return _buyer_to_response(created)

    async def patch(self, tenant_id: UUID, buyer_id: UUID, dto: BuyerPatch) -> BuyerResponse | None:
        """Autosave patch. Returns None if not found (→ 404 in router)."""
        patch_dict = dto.model_dump(exclude_none=True)
        # Serialize decision_power to string for DB
        if "decision_power" in patch_dict and patch_dict["decision_power"] is not None:
            patch_dict["decision_power"] = patch_dict["decision_power"].value
        updated = await self._buyer_repo.update(tenant_id, buyer_id, patch_dict)
        if updated is None:
            return None
        await self._session.commit()
        return _buyer_to_response(updated)

    async def set_primary(self, tenant_id: UUID, buyer_id: UUID) -> BuyerResponse | None:
        """RN-6: set buyer as primary, demoting all others in same ICP.

        One transaction: clear_primary + set is_primary=True.
        Returns None if buyer not found (→ 404 in router).
        """
        buyer = await self._buyer_repo.get_by_id(tenant_id, buyer_id)
        if buyer is None:
            return None

        # Clear all primaries in this ICP first (RN-6)
        await self._buyer_repo.clear_primary(tenant_id, buyer.icp_id)

        # Set this buyer as primary
        updated = await self._buyer_repo.update(tenant_id, buyer_id, {"is_primary": True})
        await self._session.commit()
        logger.info(
            "buyer_set_primary",
            buyer_id=str(buyer_id),
            icp_id=str(buyer.icp_id),
            tenant_id=str(tenant_id),
        )
        return _buyer_to_response(updated) if updated else None

    async def soft_delete(self, tenant_id: UUID, buyer_id: UUID) -> bool:
        """Soft delete Buyer. Returns False if not found (→ 404 in router)."""
        result = await self._buyer_repo.soft_delete(tenant_id, buyer_id)
        if result:
            await self._session.commit()
        return result
