# cap: abel/icp-buyer  # noqa: ERA001
"""Pydantic v2 DTOs for ICP — request/response shapes.

PII gate: response DTOs NO exponen tenant_id ni semilla cruda del intake.
RN-11: avg_ticket_currency preservado en IcpResponse (no convertir).
RN-8: IcpMarkReadyResponse retorna missing[] (no raise HTTP).
buyer_count: derivado (count buyers no-deleted) — no se persiste en DB.

Pydantic v2 patterns:
- model_config = ConfigDict(from_attributes=True) en todos los response models
- No inner class Config (Pydantic v1 legacy — forbidden)
- No Any salvo JSONB flexibles (precedente engine BuyerPersona)
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.modules.nicolify.abel.domain.icp import IcpOrigin, IcpStatus


class IcpCreate(BaseModel):
    """DTO para crear ICP (POST /abel/icp).

    Solo label requerido. Todos los demás opcionales (draft-first — RN-2).
    origin se setea server-side (siempre MANUAL en creación manual).
    """

    model_config = ConfigDict(from_attributes=True)

    label: str = Field(min_length=1, max_length=160)
    description: str | None = None
    vertical: str | None = None
    company_size: str | None = None
    geo: str | None = None
    business_model: str | None = None
    avg_ticket: Decimal | None = None
    avg_ticket_currency: str | None = Field(None, max_length=3)  # RN-11
    sales_cycle: str | None = None
    main_pain: str | None = None
    sales_angle: str | None = None
    signals: list[str] = Field(default_factory=list)
    anti_pattern: str | None = None


class IcpPatch(BaseModel):
    """DTO para PATCH ICP (autosave por campo · RN-8 nunca bloquea guardar).

    Todos opcionales — se aplica merge por campo (last-write semántica simple).
    Autosave 600ms debounce en FE (spec §Happy path step 5).
    """

    model_config = ConfigDict(from_attributes=True)

    label: str | None = Field(None, min_length=1, max_length=160)
    description: str | None = None
    vertical: str | None = None
    company_size: str | None = None
    geo: str | None = None
    business_model: str | None = None
    avg_ticket: Decimal | None = None
    avg_ticket_currency: str | None = Field(None, max_length=3)  # RN-11
    sales_cycle: str | None = None
    main_pain: str | None = None
    sales_angle: str | None = None
    signals: list[str] | None = None
    anti_pattern: str | None = None


class IcpResponse(BaseModel):
    """DTO de respuesta ICP — PII gate: sin tenant_id, sin semilla cruda.

    buyer_count: derivado vía IcpService (count buyers no-deleted).
    RN-11: avg_ticket_currency incluido para que FE aplique formatMoney(amount, currency).
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    description: str | None
    vertical: str | None
    company_size: str | None
    geo: str | None
    business_model: str | None
    avg_ticket: Decimal | None
    avg_ticket_currency: str | None  # RN-11 — moneda capturada sin convertir
    sales_cycle: str | None
    main_pain: str | None
    sales_angle: str | None
    signals: list[str]
    anti_pattern: str | None
    status: IcpStatus
    origin: IcpOrigin
    buyer_count: int = 0  # derivado (count buyers activos)
    created_at: datetime | None
    updated_at: datetime | None


class IcpListItem(BaseModel):
    """DTO de lista para tarjetas ICP (IcpCard en FE — sin completeness ring · RN-8)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    vertical: str | None
    status: IcpStatus
    buyer_count: int = 0


class IcpMarkReadyResponse(BaseModel):
    """Respuesta de mark-ready: 200 listo ó campos faltantes (RN-8).

    NO lanza HTTPException — devuelve missing[] para que FE muestre inline.
    HTTP 200 con missing=[] → ICP marcado listo.
    HTTP 422 con missing=[...] → ICP sigue borrador, muestra qué falta.
    """

    model_config = ConfigDict(from_attributes=True)

    status: IcpStatus
    missing: list[str] = Field(default_factory=list)  # RN-8 campos mínimos faltantes
