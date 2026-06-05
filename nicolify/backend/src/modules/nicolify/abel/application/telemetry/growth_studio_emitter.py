# cap: abel/icp-buyer  # noqa: ERA001
"""GrowthStudioEmitter — telemetría brand-local nicolify.

Emite eventos nicolify_growth_studio_event (NF-sec-pii: sin PII).
Patrón vitalia GrowthStudioEmitter re-temizado a nicolify (account_id no clinic_id).

best-effort: try/except + structlog — no rompe la respuesta primaria.
props sin PII: montos en buckets, ids hasheados, NO emails/phones/nombres.

ADR-nicolify-001 §8: account_id (nullable) — NOT clinic_id (eso es Vitalia-only).
"""

from __future__ import annotations

import hashlib
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import structlog

from src.modules.nicolify.abel.infrastructure.models.growth_studio_event_model import (
    GrowthStudioEventModel,
)

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


def _hash_id(id_val: UUID | str | None) -> str | None:
    """SHA-256 hash (first 16 hex chars) de un ID — para props sin PII."""
    if id_val is None:
        return None
    return hashlib.sha256(str(id_val).encode()).hexdigest()[:16]


def _bucket_amount(amount: float | None) -> str | None:
    """Bucket amount en rangos para props sin PII monetaria.

    Ranges (USD equivalente aproximado para LatAm B2B):
    - 0-500: micro
    - 500-2000: small
    - 2000-10000: medium
    - 10000+: enterprise
    """
    if amount is None:
        return None
    if amount < 500:
        return "0-500"
    if amount < 2000:
        return "500-2000"
    if amount < 10000:
        return "2000-10000"
    return "10000+"


class GrowthStudioEmitter:
    """Emite eventos de telemetría brand-local nicolify.

    NF-sec-pii: props JSONB sin PII — ids hasheados, montos en buckets,
    event_name slugs. Sin emails, phones, nombres reales.

    Uso:
        emitter = GrowthStudioEmitter(session)
        await emitter.emit(
            tenant_id=tenant_id,
            event_name="abel_icp_intake_started",
            props={"seed_type": "url"},
        )
    """

    def __init__(self, session: AsyncSession) -> None:
        """Initialize GrowthStudioEmitter with database session."""
        self._session = session

    async def emit(
        self,
        tenant_id: UUID,
        event_name: str,
        props: dict | None = None,
        account_id: UUID | None = None,
        user_id: UUID | None = None,
    ) -> None:
        """Emit event best-effort (try/except — no rompe respuesta primaria).

        account_id: nullable (ADR-nicolify-001 §8 — NOT clinic_id, eso es Vitalia).
        props: MUST NOT contain PII (arch test test_growth_studio_event_no_pii enforces).
        """
        try:
            event = GrowthStudioEventModel(
                id=uuid4(),
                tenant_id=tenant_id,
                account_id=account_id,
                user_id=user_id,
                event_name=event_name,
                props=props or {},
            )
            self._session.add(event)
            await self._session.flush()
            logger.info(
                "growth_studio_event_emitted",
                event_name=event_name,
                tenant_id=str(tenant_id),
            )
        except Exception:  # noqa: BLE001
            # best-effort: log warning but don't propagate (no rompe la respuesta primaria)
            logger.warning(
                "growth_studio_event_failed",
                event_name=event_name,
                tenant_id=str(tenant_id),
            )
