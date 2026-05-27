"""Agenda API DTOs — PHI-masked response models for Valeria Agenda.

All DTOs carry response_model= on their corresponding routes (arch test enforces).
PHI masking applied server-side: patient_name_masked, dni_masked, phone_masked.

Per 03-arch § 4 + vitalia/.claude/rules/hipaa-lite.md § Access control:
  - response_model= is MANDATORY (PII allowlist enforcement).
  - PHI fields (raw patient.name, raw DNI) NEVER appear in response DTOs.
  - Monetary values stored as cents (int) — no float precision loss.

downstream-regression-na: brand-local DTO layer for vitalia scheduling API
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Slot + Grid DTOs
# ---------------------------------------------------------------------------


class AgendaSlotDTO(BaseModel):
    """Slot projection PHI-masked — sent to FE calendar cells.

    PHI masking applied at repo layer. This DTO is the PII allowlist boundary.
    Raw patient.name, raw DNI, raw phone NEVER appear in this DTO.
    """

    model_config = ConfigDict(from_attributes=True)

    appointment_id: UUID
    patient_id: UUID  # opaque ref (FE uses for drawer fetch only)
    patient_name_masked: str  # "P. Hernández" — never PII
    start_time: datetime  # tz-aware UTC
    end_time: datetime
    doctor_id: UUID
    doctor_label: str  # display name (NO PHI)
    service_label: str  # "Limpieza dental"
    appointment_status: str  # SCHEDULED|CANCELLED|COMPLETED|NO_SHOW
    payment_status: str  # pagado|deposito|sin_pago|no_show
    origin: str  # walk_in|telefono|proactivo_adrian|portal
    balance_due_cents: int | None = None  # nullable: appointment without payment record
    balance_paid_cents: int | None = None
    currency: str  # ISO 4217


class AgendaGridResponseDTO(BaseModel):
    """Response for GET /api/v1/scheduling/agenda/grid — full grid payload."""

    model_config = ConfigDict(from_attributes=True)

    view: str  # dia|semana|mes
    date_from: datetime
    date_to: datetime
    slots: list[AgendaSlotDTO]
    server_time: datetime  # for FreshnessIndicator ("Actualizado hace Xs")
    clinic_id: UUID
    tenant_id: UUID


class _DayAggregate(BaseModel):
    """Per-day count breakdown within a month aggregate."""

    model_config = ConfigDict(from_attributes=True)

    date: str  # YYYY-MM-DD
    total_slots: int
    status_breakdown: dict[str, int]  # {"pagado": N, "deposito": N, ...}


class AgendaAggregatesResponseDTO(BaseModel):
    """Response for GET /api/v1/scheduling/agenda/aggregates — monthly counts.

    PHI-free: only integer counts per day. Used by react-window virtualized month grid.
    """

    model_config = ConfigDict(from_attributes=True)

    month: str  # YYYY-MM
    days: list[_DayAggregate]


# ---------------------------------------------------------------------------
# Appointment Detail DTO (drawer)
# ---------------------------------------------------------------------------


class AppointmentPaymentDTO(BaseModel):
    """Individual payment record inside the drawer detail accordion."""

    model_config = ConfigDict(from_attributes=True)

    payment_id: UUID
    amount_cents: int
    currency: str
    method: str
    fiscal_doc_url: str | None = None
    fiscal_doc_type: str | None = None
    created_at: datetime
    created_by_label: str | None = None


class AppointmentDetailDTO(BaseModel):
    """Full PHI-masked appointment detail for the drawer.

    PHI fields (raw name, raw DNI, raw phone) replaced with masked variants.
    Drawer FE renders these masked values — it CANNOT unmask them.
    """

    model_config = ConfigDict(from_attributes=True)

    appointment_id: UUID
    patient_id: UUID
    patient_name_masked: str  # "P. Hernández"
    patient_dni_masked: str | None = None  # "12.***.***"
    patient_phone_masked: str | None = None  # "+51 9** *** 423"
    patient_email_masked: str | None = None  # "p***@gmail.com"
    start_time: datetime
    end_time: datetime
    doctor_id: UUID
    doctor_label: str
    service_label: str
    appointment_status: str
    payment_status: str
    origin: str
    balance_due_cents: int | None = None
    balance_paid_cents: int | None = None
    currency: str
    currency_override: str | None = None
    payments: list[AppointmentPaymentDTO] = Field(default_factory=list)
    notes_internal: str | None = None  # staff-facing (NO clinical PHI)
    last_activity_at: datetime | None = None
    last_activity_by_label: str | None = None  # staff label (NO PHI)


# ---------------------------------------------------------------------------
# Create + Patch appointment DTOs
# ---------------------------------------------------------------------------


class PatientNewDataDTO(BaseModel):
    """PHI data for new patient creation (walk-in or telefono origin).

    Validated and persisted via CRM module — NOT stored raw in scheduling.
    """

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=128)
    dni: str | None = Field(None, max_length=32)
    phone: str = Field(..., min_length=6, max_length=24)
    email: str | None = None


class CreateAppointmentRequestDTO(BaseModel):
    """Request body for POST /api/v1/scheduling/appointments.

    origin determines whether patient_id or patient_new_data is required.
    """

    model_config = ConfigDict(extra="forbid")

    origin: Literal["walk_in", "telefono", "desde_paciente_existente"]
    patient_id: UUID | None = None  # required if origin=desde_paciente_existente
    patient_new_data: PatientNewDataDTO | None = None  # required if walk_in or telefono
    doctor_id: UUID
    service_label: str = Field(..., min_length=1, max_length=128)
    start_time: datetime
    end_time: datetime
    notes_internal: str | None = Field(None, max_length=500)
    currency_override: str | None = None


class PatchAppointmentRequestDTO(BaseModel):
    """Request body for PATCH /api/v1/scheduling/appointments/{id}/status.

    Allowed transitions: CONFIRMED, CANCELLED, NO_SHOW, COMPLETED.
    Status transitions are idempotent (same to_status → no-op).
    """

    model_config = ConfigDict(extra="forbid")

    new_status: Literal["CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"]
    reason: str | None = Field(None, max_length=500)


# ---------------------------------------------------------------------------
# Suspicious request log DTO (internal — PHI URL param detection)
# ---------------------------------------------------------------------------


class SuspiciousRequestLogDTO(BaseModel):
    """Audit trail entry for queries containing PHI in URL params. Internal use.

    Written to vitalia_audit_log with action="suspicious_request" when
    ALLOWED_GRID_PARAMS whitelist is violated (e.g. ?patient_dni=12345678).
    NO PHI content in this DTO — only the param keys that were rejected.
    """

    model_config = ConfigDict(from_attributes=True)

    request_path: str
    bypass_params: list[str]  # keys of rejected query params (NOT values)
    client_ip: str | None = None
    user_agent: str | None = None


# NOTE: Notify DTOs (SendNotificationRequestDTO, NotifyResponseDTO) live in
# `scheduling/api/dtos/notify_dtos.py` (T-8 scope — out of T-6).
# agenda_dtos.py covers only T-6 endpoints: grid, aggregates, detail, create, patch_status.
