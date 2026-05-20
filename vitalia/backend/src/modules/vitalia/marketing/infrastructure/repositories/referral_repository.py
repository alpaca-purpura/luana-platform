"""ReferralRepository — dual-scope async repository.

Subclasses ``CompoundScopeRepositoryBase`` from engine (luana-core-platform v0.4.0).
scope_field="clinic_id" enforces HIPAA-lite dual filter (tenant_id + clinic_id).

No PHI in referral table: patient_id and referred_patient_id are UUID references only.
Full patient data lives in crm module with HIPAA-lite protections.

downstream-regression-na: brand-local marketing repository (vitalia-only module)
"""

from __future__ import annotations

from typing import ClassVar
from uuid import UUID

import structlog
from luana_core_platform.repositories.compound_scope_repository import CompoundScopeRepositoryBase
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.vitalia.marketing.infrastructure.models.referral_model import ReferralModel

logger = structlog.get_logger()


class ReferralRepository(CompoundScopeRepositoryBase[ReferralModel, UUID]):
    """Async repository for Referral (patient referral program tracking).

    Dual-scope isolation: tenant_id (multitenant) + clinic_id (HIPAA-lite).
    scope_field="clinic_id" per vitalia brand convention.

    No PHI stored: patient_id and referred_patient_id are UUID references only.
    The base class provides get_by_id and list_for_scope with dual filter built-in.
    """

    MODEL: ClassVar[type[ReferralModel]] = ReferralModel

    def __init__(self, *, session: AsyncSession) -> None:
        """Initialize with clinic_id as the secondary scope axis."""
        super().__init__(session=session, scope_field="clinic_id")

    async def save(self, model: ReferralModel) -> ReferralModel:
        """Persist a ReferralModel (insert or update).

        Uses session.merge() to handle both new and existing records.
        Commit is handled by the FastAPI dependency (per-request transaction).

        Args:
            model: ReferralModel to persist.

        Returns:
            Merged (refreshed) model instance.
        """
        merged = await self._session.merge(model)
        await self._session.flush()
        logger.info(
            "referral.saved",
            referral_id=str(merged.id),
            tenant_id=str(merged.tenant_id),
            status=merged.status,
        )
        return merged
