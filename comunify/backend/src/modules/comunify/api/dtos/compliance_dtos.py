"""Compliance API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + § 6.8 + Tessl pii-sanitisation.md.
Audit log: payload_redacted field ensures PII is already sanitized at source.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuditEventItem(BaseModel):
    """Single audit log event — PII already sanitized at source (sanitize_payload)."""

    model_config = ConfigDict(from_attributes=True)

    event_id: uuid.UUID
    event_type: str
    severity: str
    member_id: uuid.UUID | None = None
    post_id: uuid.UUID | None = None
    target_member_id: uuid.UUID | None = None
    payload_redacted: dict  # PII sanitized at write time
    actor_id: uuid.UUID | None = None
    actor_type: str | None = None
    created_at: datetime


class AuditEventListResponse(BaseModel):
    """GET /community-audit/events — paginated audit log."""

    model_config = ConfigDict(from_attributes=True)

    events: list[AuditEventItem]
    total: int
    page: int = 1
    page_size: int = 50
    filters_applied: dict = Field(default_factory=dict)
