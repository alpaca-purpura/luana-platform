# cap: abel/icp-buyer  # noqa: ERA001
"""IcpService — application service for ICP CRUD + mark-ready.

Business rules enforced here (thin router pattern):
- RN-7: IcpLabelConflict (→ router maps to 409)
- RN-8: mark_ready validates minimum fields → IcpMarkReadyResponse(missing=[])
- RN-2: origin always MANUAL for manual creates
- telemetría best-effort (abel_icp_marked_ready icp_id hasheado)

IcpExtractionService (T-AG-1 — agentic) is a separate service.
"""

from __future__ import annotations

import hashlib
import uuid
from typing import TYPE_CHECKING
from uuid import UUID

import structlog

from src.modules.nicolify.abel.application.dtos.icp_dtos import (
    IcpCreate,
    IcpListItem,
    IcpMarkReadyResponse,
    IcpPatch,
    IcpResponse,
)
from src.modules.nicolify.abel.application.telemetry.growth_studio_emitter import (
    GrowthStudioEmitter,
)
from src.modules.nicolify.abel.domain.exceptions import IcpLabelConflict
from src.modules.nicolify.abel.domain.icp import Icp, IcpOrigin, IcpStatus
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

# RN-8: Campos mínimos para mark-ready (en ICP) + ≥1 buyer con role
_MINIMUM_ICP_FIELDS = ("vertical", "main_pain", "sales_angle")


def _icp_to_response(icp: Icp, buyer_count: int = 0) -> IcpResponse:
    """Map Icp domain entity → IcpResponse DTO."""
    return IcpResponse(
        id=icp.id,
        label=icp.label,
        description=icp.description,
        vertical=icp.vertical,
        company_size=icp.company_size,
        geo=icp.geo,
        business_model=icp.business_model,
        avg_ticket=icp.avg_ticket,
        avg_ticket_currency=icp.avg_ticket_currency,
        sales_cycle=icp.sales_cycle,
        main_pain=icp.main_pain,
        sales_angle=icp.sales_angle,
        signals=icp.signals,
        anti_pattern=icp.anti_pattern,
        status=icp.status,
        origin=icp.origin,
        buyer_count=buyer_count,
        created_at=icp.created_at,
        updated_at=icp.updated_at,
    )


def _icp_to_list_item(icp: Icp, buyer_count: int = 0) -> IcpListItem:
    """Map Icp domain entity → IcpListItem DTO."""
    return IcpListItem(
        id=icp.id,
        label=icp.label,
        vertical=icp.vertical,
        status=icp.status,
        buyer_count=buyer_count,
    )


class IcpService:
    """Business logic for ICP lifecycle — CRUD + mark-ready.

    Thin: validates, delegates to repos, emits telemetry.
    No business logic in router (DDD rule).
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize IcpService with database session."""
        self._session = session
        self._icp_repo: IcpRepository = SqlAlchemyIcpRepository(session)
        self._buyer_repo: BuyerRepository = SqlAlchemyBuyerRepository(session)
        self._emitter = GrowthStudioEmitter(session)

    async def list(self, tenant_id: UUID) -> list[IcpListItem]:
        """List active ICPs with buyer count."""
        icps = await self._icp_repo.list_by_tenant(tenant_id)
        # Cannot use list comprehension: async await inside loop requires explicit for loop
        result: list[IcpListItem] = []
        for icp in icps:
            buyers = await self._buyer_repo.list_by_icp(tenant_id, icp.id)
            result.append(_icp_to_list_item(icp, buyer_count=len(buyers)))
        return result

    async def get(self, tenant_id: UUID, icp_id: UUID) -> IcpResponse | None:
        """Get ICP by id. Returns None for cross-tenant (→ 404 in router)."""
        icp = await self._icp_repo.get_by_id(tenant_id, icp_id)
        if icp is None:
            return None
        buyers = await self._buyer_repo.list_by_icp(tenant_id, icp_id)
        return _icp_to_response(icp, buyer_count=len(buyers))

    async def create(self, tenant_id: UUID, dto: IcpCreate) -> IcpResponse:
        """Create ICP. Raises IcpLabelConflict (→ 409) if label exists (RN-7)."""
        if await self._icp_repo.label_exists(tenant_id, dto.label):
            raise IcpLabelConflict(dto.label)

        icp = Icp(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            label=dto.label,
            description=dto.description,
            vertical=dto.vertical,
            company_size=dto.company_size,
            geo=dto.geo,
            business_model=dto.business_model,
            avg_ticket=dto.avg_ticket,
            avg_ticket_currency=dto.avg_ticket_currency,
            sales_cycle=dto.sales_cycle,
            main_pain=dto.main_pain,
            sales_angle=dto.sales_angle,
            signals=dto.signals,
            anti_pattern=dto.anti_pattern,
            status=IcpStatus.BORRADOR,  # RN-2 draft-first
            origin=IcpOrigin.MANUAL,  # manual create
        )
        created = await self._icp_repo.create(tenant_id, icp)
        await self._session.commit()
        return _icp_to_response(created, buyer_count=0)

    async def patch(self, tenant_id: UUID, icp_id: UUID, dto: IcpPatch) -> IcpResponse | None:
        """Autosave patch. RN-8: never blocks save.

        If label is changed, re-checks uniqueness (exclude_id = icp_id).
        Returns None if icp_id not found or cross-tenant (→ 404 in router).
        """
        if dto.label is not None and await self._icp_repo.label_exists(tenant_id, dto.label, exclude_id=icp_id):
            raise IcpLabelConflict(dto.label)

        patch_dict = dto.model_dump(exclude_none=True)
        updated = await self._icp_repo.update(tenant_id, icp_id, patch_dict)
        if updated is None:
            return None
        await self._session.commit()
        buyers = await self._buyer_repo.list_by_icp(tenant_id, icp_id)
        return _icp_to_response(updated, buyer_count=len(buyers))

    async def mark_ready(self, tenant_id: UUID, icp_id: UUID) -> IcpMarkReadyResponse | None:
        """RN-8: validate minimum fields → status=listo OR missing[].

        Returns None if icp_id not found (→ 404 in router).
        Returns IcpMarkReadyResponse(status=borrador, missing=[...]) if not met (router returns 422).
        Returns IcpMarkReadyResponse(status=listo, missing=[]) if met (router returns 200).
        """
        icp = await self._icp_repo.get_by_id(tenant_id, icp_id)
        if icp is None:
            return None

        missing: list[str] = [field for field in _MINIMUM_ICP_FIELDS if not getattr(icp, field)]

        # RN-8 also requires ≥1 buyer with role
        buyers = await self._buyer_repo.list_by_icp(tenant_id, icp_id)
        buyers_with_role = [b for b in buyers if b.role]
        if not buyers_with_role:
            missing.append("buyer_with_role")

        if missing:
            return IcpMarkReadyResponse(status=IcpStatus.BORRADOR, missing=missing)

        # Mark as ready
        await self._icp_repo.update(tenant_id, icp_id, {"status": IcpStatus.LISTO.value})
        await self._session.commit()

        # Telemetría: icp_id hasheado (no PII)
        hashed_id = hashlib.sha256(str(icp_id).encode()).hexdigest()[:16]
        await self._emitter.emit(
            tenant_id=tenant_id,
            event_name="abel_icp_marked_ready",
            props={"icp_id_hash": hashed_id},
        )
        logger.info("icp_marked_ready", icp_id=str(icp_id), tenant_id=str(tenant_id))
        return IcpMarkReadyResponse(status=IcpStatus.LISTO, missing=[])

    async def soft_delete(self, tenant_id: UUID, icp_id: UUID) -> bool:
        """Soft delete ICP. Returns False if not found (→ 404 in router)."""
        result = await self._icp_repo.soft_delete(tenant_id, icp_id)
        if result:
            await self._session.commit()
        return result
