"""Voice Cloning API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + § 6.2.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UploadSamplesRequest(BaseModel):
    """POST /voice-cloning/samples — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    chats_count: int = Field(0, ge=0, description="Number of chat messages uploaded")
    voice_notes_count: int = Field(0, ge=0, description="Number of voice notes uploaded")
    upload_history_entry: dict | None = Field(
        None,
        description="Optional metadata about this upload batch",
    )


class UploadSamplesResponse(BaseModel):
    """POST /voice-cloning/samples — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    total_chats_count: int
    total_voice_notes_count: int
    threshold: int
    ready_for_distillation: bool


class SamplesStatusResponse(BaseModel):
    """GET /voice-cloning/samples/status — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    total_chats_count: int
    total_voice_notes_count: int
    threshold: int
    ready_for_distillation: bool
    last_distillation_at: datetime | None = None


class DistillRequest(BaseModel):
    """POST /voice-cloning/distill — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")


class DistillJobResponse(BaseModel):
    """POST /voice-cloning/distill — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    job_id: uuid.UUID
    status: str
    samples_count: int


class DistillJobStatusResponse(BaseModel):
    """GET /voice-cloning/distillation/{job_id} — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    job_id: uuid.UUID
    status: str
    samples_count: int
    confidence_score: float | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_reason: str | None = None
    ratified_at: datetime | None = None


class RatifyRequest(BaseModel):
    """POST /voice-cloning/ratify — request DTO."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    job_id: uuid.UUID = Field(..., description="UUID of the completed distillation job")


class RatifyResponse(BaseModel):
    """POST /voice-cloning/ratify — response DTO."""

    model_config = ConfigDict(from_attributes=True)

    job_id: uuid.UUID
    ratified_at: datetime
    slot_5_invalidation_queued: bool = True
