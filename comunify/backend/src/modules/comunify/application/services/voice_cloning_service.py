"""VoiceCloningService — samples upload + distillation kick + ratify + Slot 5 invalidate.

Per 03-arch-be.md § 9.5 + D1/D15:

  upload_samples(request) → UploadSamplesResult
    1. Load (or create) samples record for tenant.
    2. Increment chats_count + voice_notes_count.
    3. Return current total vs 50 threshold.

  kick_distillation() → DistillationJobResult
    1. Validate samples_count >= 50 (InsufficientSamplesError).
    2. Create ComunifyVoiceDistillationJobModel status=queued.
    3. Call VoiceDistillationWorkflowProtocol.enqueue() (stub — T-voice-1 wires real LangGraph).
    4. Return job_id for polling.

  ratify_distilled_voice(job_id) → None
    1. Load job. Validate status=completed.
    2. Mark job ratified_at.
    3. Emit VoiceProfileRatified domain event → triggers Slot 5 cache invalidation (T-voice-3).

WORKFLOW INSTANTIATION ONLY:
  Real LangGraph VoiceDistillationWorkflow wired in T-voice-1 (Opus).
  VoiceDistillationWorkflowProtocol is a stub Protocol — callers inject real impl.

D1: VoiceCloningService receives repos + workflow + event_bus via DI.
D15: VoiceDistillationWorkflowProtocol = stub — T-voice-1 provides real 4-wave pipeline.

Anti-duplication (anti-duplication.md):
  grep cross-codebase found no existing VoiceCloningService — NEW.

References:
  - 03-arch-be.md § 9.5 + § 9.7
  - 02-design-agentic.md § 5.3 voice cloning pipeline
  - 01-spec.md § 3.7 (voice cloning)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Protocol

import structlog
from pydantic import BaseModel, ConfigDict

from src.modules.comunify.infrastructure.models.voice_cloning_samples_model import (
    ComunifyVoiceCloningSamplesModel,
)
from src.modules.comunify.infrastructure.models.voice_distillation_job_model import (
    ComunifyVoiceDistillationJobModel,
)

logger = structlog.get_logger()

_MINIMUM_SAMPLES_THRESHOLD = 50


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ── Exceptions ─────────────────────────────────────────────────────────────


class InsufficientSamplesError(Exception):
    """Raised when chats_count < 50 threshold for distillation."""

    def __init__(self, current_count: int) -> None:
        self.current_count = current_count
        super().__init__(
            f"Insufficient samples for distillation: {current_count} < {_MINIMUM_SAMPLES_THRESHOLD} required"
        )


class DistillationJobNotFoundError(Exception):
    """Raised when distillation job_id is not found for this tenant."""

    def __init__(self, job_id: uuid.UUID) -> None:
        self.job_id = job_id
        super().__init__(f"Distillation job {job_id} not found for this tenant")


class DistillationNotCompletedError(Exception):
    """Raised when ratification is attempted on a non-completed job."""

    def __init__(self, job_id: uuid.UUID, status: str) -> None:
        self.job_id = job_id
        self.status = status
        super().__init__(f"Distillation job {job_id} cannot be ratified: status={status!r} (expected 'completed')")


# ── Domain event ───────────────────────────────────────────────────────────


class VoiceProfileRatified:
    """Domain event emitted when a voice profile is ratified.

    Downstream: T-voice-3 subscribes and invalidates Slot 5 cache
    for this tenant's sales_agent personality_profile.
    """

    def __init__(self, *, tenant_id: uuid.UUID, voice_profile_id: uuid.UUID) -> None:
        self.tenant_id = tenant_id
        self.voice_profile_id = voice_profile_id
        self.occurred_at = _utc_now()


# ── Protocol (stub — real LangGraph in T-voice-1) ─────────────────────────


class VoiceDistillationWorkflowProtocol(Protocol):
    """Injected voice distillation orchestration protocol.

    Real 4-wave LangGraph pipeline wired in T-voice-1 (Opus).
    Stub: enqueue() is a no-op that returns immediately.
    """

    async def enqueue(
        self,
        *,
        job_id: uuid.UUID,
        tenant_id: uuid.UUID,
        samples_count: int,
    ) -> None:
        """Enqueue an async distillation job (4-wave pipeline stub)."""
        ...


# ── DTOs ───────────────────────────────────────────────────────────────────


class UploadSamplesRequest(BaseModel):
    """Input DTO for upload_samples."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    chats_count: int = 0
    voice_notes_count: int = 0
    upload_history_entry: dict | None = None


class UploadSamplesResult(BaseModel):
    """Output DTO for upload_samples."""

    model_config = ConfigDict(from_attributes=True)

    total_chats_count: int
    total_voice_notes_count: int
    threshold: int = _MINIMUM_SAMPLES_THRESHOLD
    ready_for_distillation: bool = False


class DistillationJobResult(BaseModel):
    """Output DTO for kick_distillation."""

    model_config = ConfigDict(from_attributes=True)

    job_id: uuid.UUID
    status: str
    samples_count: int


# ── Service ────────────────────────────────────────────────────────────────


class VoiceCloningService:
    """Voice cloning pipeline — samples upload + distillation kick + ratification.

    Real LangGraph distillation wiring deferred to T-voice-1 (Opus).
    Slot 5 cache invalidation triggered via VoiceProfileRatified domain event (T-voice-3).

    Usage (D1 — receive deps via DI):
        svc = VoiceCloningService(
            samples_repo=VoiceCloningSamplesRepository(session=db, tenant_id=tid),
            job_repo=VoiceDistillationJobRepository(session=db, tenant_id=tid),
            distillation_workflow=distillation_workflow_instance,
            event_bus=event_bus_instance,
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        samples_repo: Any,
        job_repo: Any,
        distillation_workflow: VoiceDistillationWorkflowProtocol,
        event_bus: Any,
        tenant_id: uuid.UUID,
    ) -> None:
        self._samples_repo = samples_repo
        self._job_repo = job_repo
        self._distillation_workflow = distillation_workflow
        self._event_bus = event_bus
        self._tenant_id = tenant_id

    async def upload_samples(
        self,
        request: UploadSamplesRequest,
    ) -> UploadSamplesResult:
        """Upload new voice cloning samples and update counters.

        Creates samples record if none exists for tenant.
        Increments chats_count + voice_notes_count atomically.

        Args:
            request: UploadSamplesRequest with count deltas.

        Returns:
            UploadSamplesResult with current totals + readiness flag.
        """
        now = _utc_now()
        existing = await self._samples_repo.get_for_tenant()

        if existing is None:
            # Create new samples record
            samples_id = uuid.uuid4()
            new_record = ComunifyVoiceCloningSamplesModel(
                id=samples_id,
                tenant_id=self._tenant_id,
                chats_count=request.chats_count,
                voice_notes_count=request.voice_notes_count,
                upload_history=[request.upload_history_entry] if request.upload_history_entry else [],
                created_at=now,
                updated_at=now,
            )
            await self._samples_repo.save(new_record)

            total_chats = request.chats_count
            total_voice = request.voice_notes_count

            logger.info(
                "voice_cloning_samples_created",
                tenant_id=str(self._tenant_id),
                samples_id=str(samples_id),
                chats_count=total_chats,
            )
        else:
            # Increment existing record
            await self._samples_repo.increment_counts(
                chats_delta=request.chats_count,
                voice_notes_delta=request.voice_notes_count,
                upload_history_entry=request.upload_history_entry,
            )
            total_chats = existing.chats_count + request.chats_count
            total_voice = existing.voice_notes_count + request.voice_notes_count

            logger.info(
                "voice_cloning_samples_incremented",
                tenant_id=str(self._tenant_id),
                chats_delta=request.chats_count,
                new_total_chats=total_chats,
            )

        ready = total_chats >= _MINIMUM_SAMPLES_THRESHOLD
        return UploadSamplesResult(
            total_chats_count=total_chats,
            total_voice_notes_count=total_voice,
            threshold=_MINIMUM_SAMPLES_THRESHOLD,
            ready_for_distillation=ready,
        )

    async def kick_distillation(self) -> DistillationJobResult:
        """Kick async distillation job for this tenant.

        Algorithm:
        1. Validate samples_count >= 50 (InsufficientSamplesError if not).
        2. Create distillation job status=queued.
        3. Call VoiceDistillationWorkflowProtocol.enqueue() (stub; T-voice-1 real pipeline).
        4. Return job_id for polling.

        Returns:
            DistillationJobResult with job_id + status=queued.

        Raises:
            InsufficientSamplesError: If chats_count < 50.
        """
        samples = await self._samples_repo.get_for_tenant()

        current_count = samples.chats_count if samples is not None else 0
        if current_count < _MINIMUM_SAMPLES_THRESHOLD:
            raise InsufficientSamplesError(current_count)

        now = _utc_now()
        job_id = uuid.uuid4()
        job = ComunifyVoiceDistillationJobModel(
            id=job_id,
            tenant_id=self._tenant_id,
            status="queued",
            samples_count=current_count,
            created_at=now,
        )
        await self._job_repo.save(job)

        # Call stub workflow (T-voice-1 wires real 4-wave LangGraph pipeline)
        await self._distillation_workflow.enqueue(
            job_id=job_id,
            tenant_id=self._tenant_id,
            samples_count=current_count,
        )

        logger.info(
            "voice_distillation_kicked",
            tenant_id=str(self._tenant_id),
            job_id=str(job_id),
            samples_count=current_count,
        )

        return DistillationJobResult(
            job_id=job_id,
            status="queued",
            samples_count=current_count,
        )

    async def ratify_distilled_voice(self, job_id: uuid.UUID) -> None:
        """Ratify a completed distillation job.

        Algorithm:
        1. Load job — raise DistillationJobNotFoundError if not found.
        2. Validate status=completed — raise DistillationNotCompletedError otherwise.
        3. Mark job with ratified_at timestamp.
        4. Emit VoiceProfileRatified event → Slot 5 cache invalidation (T-voice-3).

        Args:
            job_id: UUID of the distillation job to ratify.

        Raises:
            DistillationJobNotFoundError: If job not found for this tenant.
            DistillationNotCompletedError: If job status is not 'completed'.
        """
        job = await self._job_repo.get_by_id(job_id)
        if job is None:
            raise DistillationJobNotFoundError(job_id)

        if job.status != "completed":
            raise DistillationNotCompletedError(job_id=job_id, status=job.status)

        now = _utc_now()

        # Update job with ratified_at
        await self._job_repo.update_status(
            job_id,
            status="ratified",
            ratified_at=now,
        )

        # Emit VoiceProfileRatified domain event (T-voice-3 handles Slot 5 invalidation)
        event = VoiceProfileRatified(
            tenant_id=self._tenant_id,
            voice_profile_id=job_id,
        )
        try:
            await self._event_bus.publish(event)
        except Exception as exc:
            # Best-effort event emission — never block ratification on bus failure
            logger.warning(
                "voice_profile_ratified_event_publish_failed",
                tenant_id=str(self._tenant_id),
                job_id=str(job_id),
                error=str(exc),
            )

        logger.info(
            "voice_profile_ratified",
            tenant_id=str(self._tenant_id),
            job_id=str(job_id),
        )
