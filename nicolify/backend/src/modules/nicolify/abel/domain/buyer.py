# cap: abel/icp-buyer  # noqa: ERA001
"""Buyer domain entity — stakeholder B2B brand-local async.

Replicates engine BuyerPersona schema by reference (import engine types for
field slugs), adds icp_id FK that the engine doesn't have.

Architecture decisions:
- Engine BuyerPersona: SYNC, no icp_id → INCOMPATIBLE for brand-local grouping
- Buyer: brand-local async replica + icp_id FK (RN-5)
- JSONB fields: same slugs as engine BuyerPersona (demographics, psychographics,
  pain_points, desires, objections, buyer_journey, purchase_triggers, preferred_channels)
- Extends engine with preferred_channels (B2B: LinkedIn, email, WhatsApp, phone)
- is_primary: ≤1 true per icp_id (RN-6 enforced by BuyerService.set_primary)
- tenant_id raíz OBLIGATORIO (RN-1)
- deleted_at soft delete OBLIGATORIO

DDD: pure Python domain entity. CERO framework imports.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from luana_core_platform.domain.base_entity import BaseEntity
from pydantic import Field


class DecisionPower(StrEnum):
    """Poder de decisión del buyer en el proceso de compra B2B.

    Modelo B2B enterprise: múltiples roles influyen en la compra.
    Basado en el modelo MEDDIC/SPIN para agencias y servicios profesionales.
    """

    DECISOR_ECONOMICO = "decisor_economico"  # Firma el contrato/presupuesto
    CHAMPION = "champion"  # Defensor interno del proyecto
    INFLUENCER_TECNICO = "influencer_tecnico"  # Evalúa la solución técnica
    APROBADOR = "aprobador"  # Aprueba sin decidir el proveedor
    USUARIO = "usuario"  # Usa el servicio día a día
    BLOQUEADOR = "bloqueador"  # Puede vetar la decisión


class Buyer(BaseEntity):
    """Stakeholder/Contacto B2B — persona que influye en la compra de la cuenta.

    Brand-local async replica de BuyerPersona engine con icp_id FK.
    N buyers por ICP (N:1 Buyer → ICP).

    JSONB field slugs: idénticos al engine BuyerPersona (field-contract compatible).
    Extensión B2B: preferred_channels (LinkedIn, email, WhatsApp, phone).

    consumer_agent (RN-4):
    - role, decision_power → Christian (calificación prospecto)
    - pain_points, desires → Abel (estrategia oferta) + Brenda (copy pauta)
    - preferred_channels → Christian (outbound channel selection)
    """

    id: UUID
    tenant_id: UUID  # RN-1 — raíz tenant isolation
    icp_id: UUID  # RN-5 FK → ICP (buyer siempre cuelga de un ICP)
    name: str  # Nombre del stakeholder
    role: str | None = None  # Cargo/título en la empresa
    decision_power: DecisionPower | None = None  # Poder de decisión (modelo B2B)
    is_primary: bool = False  # RN-6 — ≤1 true per icp_id (enforced en service)
    # JSONB fields — mismos slugs que engine BuyerPersona (consume-by-reference)
    demographics: dict = Field(default_factory=dict)  # age_range, location, occupation, income
    psychographics: dict = Field(default_factory=dict)  # values, aspirations, lifestyle
    pain_points: list[dict] = Field(default_factory=list)  # {description, emotional_impact}
    desires: list[dict] = Field(default_factory=list)  # {description, urgency}
    objections: list[dict] = Field(default_factory=list)  # {description, how_to_handle}
    buyer_journey: dict = Field(default_factory=dict)  # awareness, consideration, decision
    purchase_triggers: list[str] = Field(default_factory=list)
    preferred_channels: list[dict] = Field(default_factory=list)  # B2B: {channel, frequency, tone}
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None  # soft delete OBLIGATORIO — nunca hard delete
