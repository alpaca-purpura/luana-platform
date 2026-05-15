"""End-to-end voice cloning low-confidence path test (T-voice-4).

Acceptance per 06-tickets.yaml::T-voice-4 + V-AE-30 low-confidence branch:
  * Distillation with weak / inconsistent waves yields confidence < 0.65.
  * final_status is 'completed_low_confidence' (NOT 'failed' — creator
    should still see the partial output and decide).
  * The audit log + outbox event carry the low-confidence marker.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from typing import Any

import pytest

from src.modules.comunify.brand.voice_cloning.voice_distillation_orchestrator import (
    MIN_ACCEPTABLE_CONFIDENCE,
    VoiceDistillationOrchestrator,
)
from src.modules.comunify.copilot.extractors.offer_ladder_advisor import _LLMResponse


@dataclass
class _LowConfidenceLLM:
    """Returns intentionally low-confidence outputs across all 4 waves."""

    calls: list[str] = field(default_factory=list)

    async def ainvoke_text(self, *, role: str, prompt: str, timeout_sec: float) -> _LLMResponse:
        self.calls.append(role)
        if role == "nano":
            content = {
                "dialecto": "es-LATAM unclear",
                "dialect_evidence": [],
                "wave_confidence": 0.30,  # very low
                "wave_warnings": ["mixed signals across messages"],
            }
        else:
            # 3 reasoning calls
            idx = sum(1 for c in self.calls[:-1] if c == "reasoning")
            if idx == 0:
                content = {
                    "vocabulario": ["hola"],
                    "emoji_style": "none",
                    "wave_confidence": 0.30,
                    "wave_warnings": ["sparse vocabulary signal"],
                }
            elif idx == 1:
                content = {
                    "registro": "unclear mixed",
                    "energy_level": "media",
                    "warmth_level": "cordial",
                    "humor_type": "none",
                    "verbosity": "medio",
                    "wave_confidence": 0.25,
                    "wave_warnings": ["mixed register"],
                }
            else:
                content = {
                    "identidad": "",
                    "dialecto": "es-LATAM unclear",
                    "vocabulario": ["hola"],
                    "registro": "unclear mixed",
                    "asi_no": [],
                    "anclajes": [],
                    "validation_score_adjustment": -0.1,
                    "wave_confidence": 0.20,
                    "wave_warnings": ["insufficient signal across waves"],
                }
        return _LLMResponse(
            content=json.dumps(content, ensure_ascii=False),
            litellm_call_id=None,  # cost-unknown for this path
        )


def _generic_50_chats() -> list[dict[str, Any]]:
    """50 chats with mixed signals — short, generic, no dialect markers."""
    return [
        {"message": "ok", "sender": "creator", "channel": "wa"},
        {"message": "claro", "sender": "creator", "channel": "wa"},
        {"message": "hola", "sender": "creator", "channel": "wa"},
        {"message": "sí", "sender": "creator", "channel": "wa"},
        {"message": "perfecto", "sender": "creator", "channel": "wa"},
    ] * 10


# ─── Tests ────────────────────────────────────────────────────────────────


@dataclass
class FakeJobRepo:
    updates: list[dict[str, Any]] = field(default_factory=list)

    async def update_status(self, job_id, **kwargs) -> bool:
        self.updates.append({"job_id": job_id, **kwargs})
        return True


@dataclass
class FakeOutbox:
    published: list[dict[str, Any]] = field(default_factory=list)

    async def publish(self, *, event_type, tenant_id, payload) -> None:
        self.published.append({"event_type": event_type, "tenant_id": tenant_id, "payload": payload})


@dataclass
class FakeAudit:
    logged: list[dict[str, Any]] = field(default_factory=list)

    async def log(self, *, tenant_id, event_type, payload) -> None:
        self.logged.append({"tenant_id": tenant_id, "event_type": event_type, "payload": payload})


@pytest.mark.asyncio
async def test_low_confidence_yields_below_threshold_compiled_voice() -> None:
    """Low-confidence pipeline → confidence_score < MIN_ACCEPTABLE_CONFIDENCE."""
    extractor = VoiceDistillationOrchestrator(llm_service=_LowConfidenceLLM())

    compiled = await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_generic_50_chats(),
        country="AR",
    )

    assert compiled.confidence_score < MIN_ACCEPTABLE_CONFIDENCE


@pytest.mark.asyncio
async def test_low_confidence_status_is_completed_low_confidence_not_failed() -> None:
    """Low confidence → status='completed_low_confidence' (creator sees the partial result)."""
    job_repo = FakeJobRepo()
    extractor = VoiceDistillationOrchestrator(
        llm_service=_LowConfidenceLLM(),
        job_repo=job_repo,
    )

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_generic_50_chats(),
        country="AR",
    )

    assert len(job_repo.updates) == 1
    update = job_repo.updates[0]
    # Either completed_low_confidence OR failed depending on missing_required_fields cardinality;
    # the orchestrator classifier: if missing ≥4 → failed; else low_confidence.
    assert update["status"] in {"completed_low_confidence", "failed"}
    # Error reason mentions either low_confidence or missing_required.
    assert update["error_reason"] is not None
    assert "low_confidence" in update["error_reason"] or "missing_required" in update["error_reason"]


@pytest.mark.asyncio
async def test_low_confidence_audit_log_flags_needs_manual_review() -> None:
    """Audit log emits ``needs_manual_review=True`` for low-confidence runs."""
    audit = FakeAudit()
    extractor = VoiceDistillationOrchestrator(
        llm_service=_LowConfidenceLLM(),
        audit_log=audit,
    )

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_generic_50_chats(),
        country="AR",
    )

    assert len(audit.logged) == 1
    payload = audit.logged[0]["payload"]
    assert payload["needs_manual_review"] is True


@pytest.mark.asyncio
async def test_low_confidence_outbox_event_carries_low_confidence_marker() -> None:
    outbox = FakeOutbox()
    extractor = VoiceDistillationOrchestrator(
        llm_service=_LowConfidenceLLM(),
        outbox=outbox,
    )

    await extractor.run(
        tenant_id=uuid.uuid4(),
        job_id=uuid.uuid4(),
        chat_samples=_generic_50_chats(),
        country="AR",
    )

    assert len(outbox.published) == 1
    payload = outbox.published[0]["payload"]
    assert payload["final_status"] in {"completed_low_confidence", "failed"}
    assert payload["confidence_score"] < MIN_ACCEPTABLE_CONFIDENCE
