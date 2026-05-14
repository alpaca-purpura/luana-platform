"""Unit tests — VoiceCloningService.

TDD RED phase: written before implementation to drive contract per 03-arch-be.md § 9.5.

Covers:
  - V1: upload_samples persists samples metadata + increments chats_count
  - V2: upload_samples creates new samples record when none exists
  - V3: kick_distillation creates distillation job with status=queued
  - V4: kick_distillation raises InsufficientSamplesError when count < 50
  - V5: ratify_distilled_voice marks job ratified + emits VoiceProfileRatified domain event
  - V6: ratify_distilled_voice raises DistillationJobNotFoundError for unknown job_id
  - V7: ratify_distilled_voice raises DistillationNotCompletedError if job not completed

D1: VoiceCloningService receives repos + event_bus via DI constructor injection.
D15: VoiceDistillationWorkflow = stub protocol — real LangGraph wiring T-voice-1 (Opus).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.voice_cloning_service import (
    DistillationJobNotFoundError,
    DistillationNotCompletedError,
    InsufficientSamplesError,
    UploadSamplesRequest,
    VoiceCloningService,
    VoiceDistillationWorkflowProtocol,
)
from src.modules.comunify.infrastructure.models.voice_cloning_samples_model import (
    ComunifyVoiceCloningSamplesModel,
)
from src.modules.comunify.infrastructure.models.voice_distillation_job_model import (
    ComunifyVoiceDistillationJobModel,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

TENANT_ID = uuid.uuid4()
_MINIMUM_SAMPLES = 50


def _make_samples(chats_count: int = 60) -> ComunifyVoiceCloningSamplesModel:
    return ComunifyVoiceCloningSamplesModel(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        chats_count=chats_count,
        voice_notes_count=0,
        upload_history=[],
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _make_job(status: str = "completed") -> ComunifyVoiceDistillationJobModel:
    return ComunifyVoiceDistillationJobModel(
        id=uuid.uuid4(),
        tenant_id=TENANT_ID,
        status=status,
        samples_count=60,
        compiled_blocks={"identidad": "test", "dialecto": "neutro"},
        confidence_score=0.87,
        created_at=datetime.now(timezone.utc),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_samples_repo() -> MagicMock:
    repo = MagicMock()
    repo.get_for_tenant = AsyncMock(return_value=None)
    repo.save = AsyncMock(return_value=None)
    repo.increment_counts = AsyncMock(return_value=True)
    repo.mark_raw_samples_deleted = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_job_repo() -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.save = AsyncMock(return_value=None)
    repo.update_status = AsyncMock(return_value=True)
    return repo


@pytest.fixture
def mock_distillation_workflow() -> MagicMock:
    """Stub VoiceDistillationWorkflowProtocol — real LangGraph wiring T-voice-1."""
    wf = MagicMock(spec=VoiceDistillationWorkflowProtocol)
    wf.enqueue = AsyncMock(return_value=None)
    return wf


@pytest.fixture
def mock_event_bus() -> MagicMock:
    """Stub event bus for VoiceProfileRatified emission."""
    bus = MagicMock()
    bus.publish = AsyncMock(return_value=None)
    return bus


@pytest.fixture
def service(
    mock_samples_repo: MagicMock,
    mock_job_repo: MagicMock,
    mock_distillation_workflow: MagicMock,
    mock_event_bus: MagicMock,
) -> VoiceCloningService:
    return VoiceCloningService(
        samples_repo=mock_samples_repo,
        job_repo=mock_job_repo,
        distillation_workflow=mock_distillation_workflow,
        event_bus=mock_event_bus,
        tenant_id=TENANT_ID,
    )


# ─────────────────────────────────────────────────────────────────────────────
# V1 — upload_samples persists metadata + increments
# ─────────────────────────────────────────────────────────────────────────────


async def test_upload_samples_increments_existing_record(
    service: VoiceCloningService,
    mock_samples_repo: MagicMock,
) -> None:
    """V1: upload_samples increments chats_count when samples record exists."""
    existing = _make_samples(chats_count=30)
    mock_samples_repo.get_for_tenant = AsyncMock(return_value=existing)

    req = UploadSamplesRequest(chats_count=10, voice_notes_count=0)
    result = await service.upload_samples(req)

    mock_samples_repo.increment_counts.assert_called_once()
    assert result.total_chats_count >= 30


# ─────────────────────────────────────────────────────────────────────────────
# V2 — upload_samples creates new record when none exists
# ─────────────────────────────────────────────────────────────────────────────


async def test_upload_samples_creates_new_record(
    service: VoiceCloningService,
    mock_samples_repo: MagicMock,
) -> None:
    """V2: upload_samples creates new samples record when tenant has none."""
    mock_samples_repo.get_for_tenant = AsyncMock(return_value=None)

    req = UploadSamplesRequest(chats_count=20, voice_notes_count=0)
    result = await service.upload_samples(req)

    mock_samples_repo.save.assert_called_once()
    assert result.total_chats_count == 20


# ─────────────────────────────────────────────────────────────────────────────
# V3 — kick_distillation creates job with status=queued
# ─────────────────────────────────────────────────────────────────────────────


async def test_kick_distillation_creates_queued_job(
    service: VoiceCloningService,
    mock_samples_repo: MagicMock,
    mock_job_repo: MagicMock,
    mock_distillation_workflow: MagicMock,
) -> None:
    """V3: kick_distillation creates job status=queued + calls workflow.enqueue()."""
    samples = _make_samples(chats_count=60)
    mock_samples_repo.get_for_tenant = AsyncMock(return_value=samples)

    await service.kick_distillation()

    mock_job_repo.save.assert_called_once()
    mock_distillation_workflow.enqueue.assert_called_once()
    saved_job = mock_job_repo.save.call_args[0][0]
    assert saved_job.status == "queued"


# ─────────────────────────────────────────────────────────────────────────────
# V4 — kick_distillation raises InsufficientSamplesError when count < 50
# ─────────────────────────────────────────────────────────────────────────────


async def test_kick_distillation_insufficient_samples_raises(
    service: VoiceCloningService,
    mock_samples_repo: MagicMock,
) -> None:
    """V4: kick_distillation raises InsufficientSamplesError when chats_count < 50."""
    samples = _make_samples(chats_count=30)
    mock_samples_repo.get_for_tenant = AsyncMock(return_value=samples)

    with pytest.raises(InsufficientSamplesError):
        await service.kick_distillation()


async def test_kick_distillation_no_samples_raises(
    service: VoiceCloningService,
    mock_samples_repo: MagicMock,
) -> None:
    """V4b: kick_distillation raises InsufficientSamplesError when no samples record."""
    mock_samples_repo.get_for_tenant = AsyncMock(return_value=None)

    with pytest.raises(InsufficientSamplesError):
        await service.kick_distillation()


# ─────────────────────────────────────────────────────────────────────────────
# V5 — ratify emits VoiceProfileRatified event
# ─────────────────────────────────────────────────────────────────────────────


async def test_ratify_emits_domain_event(
    service: VoiceCloningService,
    mock_job_repo: MagicMock,
    mock_event_bus: MagicMock,
) -> None:
    """V5: ratify_distilled_voice marks job as ratified + emits VoiceProfileRatified event."""
    job = _make_job(status="completed")
    mock_job_repo.get_by_id = AsyncMock(return_value=job)

    await service.ratify_distilled_voice(job.id)

    mock_event_bus.publish.assert_called_once()
    event_arg = mock_event_bus.publish.call_args[0][0]
    assert "VoiceProfileRatified" in type(event_arg).__name__


async def test_ratify_marks_job_ratified_at(
    service: VoiceCloningService,
    mock_job_repo: MagicMock,
    mock_event_bus: MagicMock,
) -> None:
    """V5b: ratify_distilled_voice updates job with ratified_at timestamp."""
    job = _make_job(status="completed")
    mock_job_repo.get_by_id = AsyncMock(return_value=job)

    await service.ratify_distilled_voice(job.id)

    mock_job_repo.update_status.assert_called_once()
    update_kwargs = mock_job_repo.update_status.call_args.kwargs
    assert update_kwargs.get("ratified_at") is not None


# ─────────────────────────────────────────────────────────────────────────────
# V6 — ratify raises DistillationJobNotFoundError for unknown job_id
# ─────────────────────────────────────────────────────────────────────────────


async def test_ratify_not_found_raises(
    service: VoiceCloningService,
    mock_job_repo: MagicMock,
) -> None:
    """V6: ratify_distilled_voice raises DistillationJobNotFoundError for unknown job_id."""
    mock_job_repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(DistillationJobNotFoundError):
        await service.ratify_distilled_voice(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# V7 — ratify raises DistillationNotCompletedError if job not completed
# ─────────────────────────────────────────────────────────────────────────────


async def test_ratify_not_completed_raises(
    service: VoiceCloningService,
    mock_job_repo: MagicMock,
) -> None:
    """V7: ratify_distilled_voice raises DistillationNotCompletedError if job is still running."""
    job = _make_job(status="running_wave_1")
    mock_job_repo.get_by_id = AsyncMock(return_value=job)

    with pytest.raises(DistillationNotCompletedError):
        await service.ratify_distilled_voice(job.id)
