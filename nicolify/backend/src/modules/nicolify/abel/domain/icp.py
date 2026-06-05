# cap: abel/icp-buyer  # noqa: ERA001
"""ICP (Ideal Customer Profile) domain entity — brand-local, net-new B2B concept.

Account-level entity (empresa prospecto/cliente ideal). No engine equivalent.
Lift candidate: post-merge cuando saasora/inmoflow arranquen (N≥2 B2B brands).

Architecture decisions:
- IcpStatus: borrador (draft-first RN-2) → listo (mark-ready RN-8)
- IcpOrigin: manual vs draft (extraído por Abel T-AG-1)
- tenant_id raíz OBLIGATORIO (RN-1 tenant isolation)
- deleted_at soft delete OBLIGATORIO (no hard deletes)
- avg_ticket_currency preservado sin convertir (RN-11 currency-handling)
- signals[]: consumer Christian (outbound prospecting)
- consumer_agent fields: main_pain+sales_angle → Brenda+Christian

DDD: pure Python domain entity. CERO framework imports (SQLAlchemy, FastAPI).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from luana_core_platform.domain.base_entity import BaseEntity
from pydantic import Field


class IcpStatus(StrEnum):
    """Estado del ICP — draft-first (RN-2)."""

    BORRADOR = "borrador"
    LISTO = "listo"


class IcpOrigin(StrEnum):
    """Origen del ICP — manual vs extraído por Abel (T-AG-1)."""

    MANUAL = "manual"
    DRAFT = "draft"


class Icp(BaseEntity):
    """Ideal Customer Profile — entidad de cuenta B2B brand-local.

    Representa la empresa/vertical ideal que la agencia busca como cliente.
    Un ICP agrupa N Buyers (stakeholders de la empresa).

    Campos consumer_agent (RN-4 WhatForChip):
    - main_pain, sales_angle → consumer: Brenda (pauta) + Christian (outbound)
    - signals → consumer: Christian (prospecting triggers)
    - anti_pattern → consumer: Christian (calificación negativa)
    """

    id: UUID
    tenant_id: UUID  # RN-1 — raíz tenant isolation
    label: str  # RN-7 único por tenant (case-insensitive, soft-delete aware)
    description: str | None = None
    vertical: str | None = None  # RN-8 mínimo para mark-ready
    company_size: str | None = None
    geo: str | None = None
    business_model: str | None = None
    avg_ticket: Decimal | None = None  # RN-11 — no convertir on-write
    avg_ticket_currency: str | None = None  # RN-11 — preservar moneda original
    sales_cycle: str | None = None
    main_pain: str | None = None  # RN-8 mínimo · consumer: brenda + christian
    sales_angle: str | None = None  # RN-8 mínimo · consumer: brenda + christian
    signals: list[str] = Field(default_factory=list)  # consumer: christian
    anti_pattern: str | None = None  # consumer: christian (calificación negativa)
    status: IcpStatus = IcpStatus.BORRADOR  # RN-2 draft-first — siempre nace borrador
    origin: IcpOrigin = IcpOrigin.MANUAL  # se sobreescribe a DRAFT en extracción T-AG-1
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None  # soft delete OBLIGATORIO — nunca hard delete
