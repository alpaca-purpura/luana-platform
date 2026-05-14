"""Guardrail tests — `community_safety_no_nsfw` (comunify AGENTIC, R23 Opus 4.7).

Story 12 T-guards-2 (luana-comunify-bootstrap).

Acceptance:
  V-AE-3: 5 NSFW image uploads — 4+/5 blocked (spec § 15.3).
  V-AE-11: audit_log fires on every block (severity medium).

Scope:
  - Image vision classifier per attachment (score > 0.85 → block_pre_persist).
  - Text NSFW classifier Haiku (score > 0.80 → pending_moderation).
  - Image block has higher precedence + form error chrome response.
  - Audit log: community_safety_no_nsfw_fired (severity medium).
  - Best-effort observability: vision + text classifier outage degrade gracefully.
  - Tenant isolation.

Anti-duplication: Step 0 GATE grep returned zero collisions; vision +
text classifier protocols injected via DI.
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest

from src.modules.comunify.agentic.guardrails.community_safety_no_nsfw import (
    IMAGE_FALLBACK_RESPONSE,
    Attachment,
    community_safety_no_nsfw_input_check,
)

# ── Fixtures ──────────────────────────────────────────────────────────────


_TENANT_ID = uuid.uuid4()
_MEMBER_ID = uuid.uuid4()
_POST_ID = uuid.uuid4()


class _FakeAuditLog:
    def __init__(self, *, raise_on_log: bool = False) -> None:
        self._raise_on_log = raise_on_log
        self.entries: list[dict[str, Any]] = []

    async def log_event(
        self,
        event_type: str,
        severity: str,
        payload: dict[str, Any],
        tenant_id: uuid.UUID,
        member_id: uuid.UUID | None = None,
        post_id: uuid.UUID | None = None,
        target_member_id: uuid.UUID | None = None,
        actor_id: uuid.UUID | None = None,
        actor_type: str | None = None,
    ) -> None:
        if self._raise_on_log:
            raise RuntimeError("audit_log unavailable — fake failure")
        self.entries.append(
            {
                "event_type": event_type,
                "severity": severity,
                "payload": payload,
                "tenant_id": tenant_id,
                "member_id": member_id,
                "post_id": post_id,
            }
        )


class _FakeVisionClassifier:
    """In-memory vision classifier with programmable per-URL scores."""

    def __init__(
        self,
        *,
        default_score: float = 0.0,
        raise_on_call: bool = False,
    ) -> None:
        self.default_score = default_score
        self.raise_on_call = raise_on_call
        self.calls: list[dict[str, Any]] = []
        self.scores_by_url: dict[str, float] = {}

    async def score(
        self,
        *,
        url: str,
        label: str,
        raw_bytes: bytes | None = None,
        timeout_sec: float = 5.0,
    ) -> float:
        if self.raise_on_call:
            raise TimeoutError("vision classifier timeout — fake")
        self.calls.append({"url": url, "label": label, "timeout_sec": timeout_sec})
        return self.scores_by_url.get(url, self.default_score)


class _FakeLLMClassifier:
    def __init__(
        self,
        *,
        default_score: float = 0.0,
        raise_on_call: bool = False,
    ) -> None:
        self.default_score = default_score
        self.raise_on_call = raise_on_call
        self.calls: list[dict[str, Any]] = []

    async def aclassify_score(
        self,
        *,
        text: str,
        prompt: str,
        timeout_sec: float = 5.0,
    ) -> float:
        if self.raise_on_call:
            raise TimeoutError("text classifier timeout — fake")
        self.calls.append({"text": text, "prompt": prompt})
        return self.default_score


@pytest.fixture
def audit_log() -> _FakeAuditLog:
    return _FakeAuditLog()


@pytest.fixture
def audit_log_failing() -> _FakeAuditLog:
    return _FakeAuditLog(raise_on_log=True)


@pytest.fixture
def vision_clean() -> _FakeVisionClassifier:
    return _FakeVisionClassifier(default_score=0.0)


@pytest.fixture
def vision_nsfw() -> _FakeVisionClassifier:
    """Score 0.95 — above 0.85 threshold for any URL."""
    return _FakeVisionClassifier(default_score=0.95)


@pytest.fixture
def vision_failing() -> _FakeVisionClassifier:
    return _FakeVisionClassifier(raise_on_call=True)


@pytest.fixture
def text_clean() -> _FakeLLMClassifier:
    return _FakeLLMClassifier(default_score=0.0)


@pytest.fixture
def text_nsfw() -> _FakeLLMClassifier:
    """Score 0.90 — above 0.80 text threshold."""
    return _FakeLLMClassifier(default_score=0.90)


@pytest.fixture
def text_failing() -> _FakeLLMClassifier:
    return _FakeLLMClassifier(raise_on_call=True)


# ── V-AE-3 IMAGE vision classifier ────────────────────────────────────────


@pytest.mark.asyncio
async def test_image_above_threshold_blocks_pre_persist(
    audit_log: _FakeAuditLog,
    vision_nsfw: _FakeVisionClassifier,
    text_clean: _FakeLLMClassifier,
) -> None:
    """V-AE-3: image score > 0.85 → block_pre_persist + chrome fallback."""
    attachment = Attachment(url="https://s3.example.com/upload/img1.jpg", is_image=True)
    result = await community_safety_no_nsfw_input_check(
        user_msg="Mira esto",
        tenant_id=_TENANT_ID,
        member_id=_MEMBER_ID,
        post_id=_POST_ID,
        attachments=[attachment],
        vision_classifier=vision_nsfw,
        text_classifier=text_clean,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert result.action == "block_pre_persist"
    assert result.fallback_response == IMAGE_FALLBACK_RESPONSE
    assert result.detection_source == "image_vision"
    assert result.blocked_attachment_url == "https://s3.example.com/upload/img1.jpg"
    assert result.classifier_score == 0.95
    # Text classifier NOT consulted — image block short-circuits
    assert text_clean.calls == []
    # Audit log fired
    assert len(audit_log.entries) == 1
    entry = audit_log.entries[0]
    assert entry["event_type"] == "community_safety_no_nsfw_fired"
    assert entry["severity"] == "medium"
    assert entry["payload"]["detection_source"] == "image_vision"
    assert entry["payload"]["attachment_url"] == "https://s3.example.com/upload/img1.jpg"


@pytest.mark.asyncio
async def test_image_below_threshold_passes(
    audit_log: _FakeAuditLog,
    vision_clean: _FakeVisionClassifier,
    text_clean: _FakeLLMClassifier,
) -> None:
    """V-AE-3: image score below 0.85 → pass to text classifier."""
    attachment = Attachment(url="https://s3.example.com/upload/safe.jpg", is_image=True)
    result = await community_safety_no_nsfw_input_check(
        user_msg="Foto del workshop de ayer",
        tenant_id=_TENANT_ID,
        attachments=[attachment],
        vision_classifier=vision_clean,
        text_classifier=text_clean,
        audit_log=audit_log,
    )
    assert result.fired is False
    assert result.attachment_scores == {"https://s3.example.com/upload/safe.jpg": 0.0}
    # Text classifier WAS consulted (text path runs since image safe)
    assert len(text_clean.calls) == 1
    assert audit_log.entries == []


@pytest.mark.asyncio
async def test_multiple_attachments_first_nsfw_blocks(
    audit_log: _FakeAuditLog,
    text_clean: _FakeLLMClassifier,
) -> None:
    """V-AE-3: multiple attachments — first match blocks (short-circuit)."""
    vision = _FakeVisionClassifier(default_score=0.0)
    vision.scores_by_url["https://s3.example.com/a.jpg"] = 0.10
    vision.scores_by_url["https://s3.example.com/b.jpg"] = 0.95  # NSFW
    vision.scores_by_url["https://s3.example.com/c.jpg"] = 0.0
    result = await community_safety_no_nsfw_input_check(
        user_msg="",
        tenant_id=_TENANT_ID,
        attachments=[
            Attachment(url="https://s3.example.com/a.jpg", is_image=True),
            Attachment(url="https://s3.example.com/b.jpg", is_image=True),
            Attachment(url="https://s3.example.com/c.jpg", is_image=True),
        ],
        vision_classifier=vision,
        text_classifier=text_clean,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert result.blocked_attachment_url == "https://s3.example.com/b.jpg"
    # 3rd attachment not scored — short-circuited
    assert len(vision.calls) == 2


@pytest.mark.asyncio
async def test_non_image_attachment_skipped(
    audit_log: _FakeAuditLog,
    vision_nsfw: _FakeVisionClassifier,
    text_clean: _FakeLLMClassifier,
) -> None:
    """V-AE-3: PDF / doc attachment skips vision classifier (is_image=False)."""
    attachment = Attachment(url="https://s3.example.com/doc.pdf", is_image=False)
    result = await community_safety_no_nsfw_input_check(
        user_msg="Adjunto el PDF",
        tenant_id=_TENANT_ID,
        attachments=[attachment],
        vision_classifier=vision_nsfw,
        text_classifier=text_clean,
        audit_log=audit_log,
    )
    assert result.fired is False
    # Vision classifier NOT called (is_image=False)
    assert vision_nsfw.calls == []


# ── V-AE-3 TEXT NSFW classifier ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_text_above_threshold_pending_moderation(
    audit_log: _FakeAuditLog,
    vision_clean: _FakeVisionClassifier,
    text_nsfw: _FakeLLMClassifier,
) -> None:
    """V-AE-3: text score > 0.80 → pending_moderation."""
    result = await community_safety_no_nsfw_input_check(
        user_msg="(text with NSFW content placeholder for test)",
        tenant_id=_TENANT_ID,
        member_id=_MEMBER_ID,
        attachments=None,
        vision_classifier=vision_clean,
        text_classifier=text_nsfw,
        audit_log=audit_log,
    )
    assert result.fired is True
    assert result.action == "pending_moderation"
    assert result.detection_source == "text_classifier"
    assert result.classifier_score == 0.90
    assert audit_log.entries[0]["payload"]["detection_source"] == "text_classifier"


@pytest.mark.asyncio
async def test_text_below_threshold_passes(
    audit_log: _FakeAuditLog,
    vision_clean: _FakeVisionClassifier,
) -> None:
    """V-AE-3: text score 0.5 (below 0.80) → no fire."""
    text = _FakeLLMClassifier(default_score=0.5)
    result = await community_safety_no_nsfw_input_check(
        user_msg="Hola, quiero saber del próximo evento",
        tenant_id=_TENANT_ID,
        attachments=None,
        vision_classifier=vision_clean,
        text_classifier=text,
        audit_log=audit_log,
    )
    assert result.fired is False


# ── V-AE-3 Best-effort observability + graceful degradation ───────────────


@pytest.mark.asyncio
async def test_vision_classifier_outage_degrades_gracefully(
    audit_log: _FakeAuditLog,
    vision_failing: _FakeVisionClassifier,
    text_clean: _FakeLLMClassifier,
) -> None:
    """V-AE-3: vision timeout → skip + continue to text classifier."""
    attachment = Attachment(url="https://s3.example.com/img.jpg", is_image=True)
    result = await community_safety_no_nsfw_input_check(
        user_msg="Compartiendo foto",
        tenant_id=_TENANT_ID,
        attachments=[attachment],
        vision_classifier=vision_failing,
        text_classifier=text_clean,
        audit_log=audit_log,
    )
    # Vision outage → not blocked + text classifier consulted on text
    assert result.fired is False
    # Text classifier was still consulted
    assert len(text_clean.calls) == 1


@pytest.mark.asyncio
async def test_text_classifier_outage_degrades_gracefully(
    audit_log: _FakeAuditLog,
    vision_clean: _FakeVisionClassifier,
    text_failing: _FakeLLMClassifier,
) -> None:
    """V-AE-3: text classifier timeout → pass-through."""
    result = await community_safety_no_nsfw_input_check(
        user_msg="Hola",
        tenant_id=_TENANT_ID,
        attachments=None,
        vision_classifier=vision_clean,
        text_classifier=text_failing,
        audit_log=audit_log,
    )
    assert result.fired is False


@pytest.mark.asyncio
async def test_fires_even_if_audit_log_raises(
    audit_log_failing: _FakeAuditLog,
    vision_nsfw: _FakeVisionClassifier,
    text_clean: _FakeLLMClassifier,
) -> None:
    """V-AE-3: audit_log failure MUST NOT prevent block decision."""
    attachment = Attachment(url="https://s3.example.com/x.jpg", is_image=True)
    result = await community_safety_no_nsfw_input_check(
        user_msg="",
        tenant_id=_TENANT_ID,
        attachments=[attachment],
        vision_classifier=vision_nsfw,
        text_classifier=text_clean,
        audit_log=audit_log_failing,
    )
    assert result.fired is True
    assert result.action == "block_pre_persist"


@pytest.mark.asyncio
async def test_works_without_audit_log(
    vision_nsfw: _FakeVisionClassifier,
    text_clean: _FakeLLMClassifier,
) -> None:
    """V-AE-3: audit_log optional."""
    attachment = Attachment(url="https://s3.example.com/x.jpg", is_image=True)
    result = await community_safety_no_nsfw_input_check(
        user_msg="",
        tenant_id=_TENANT_ID,
        attachments=[attachment],
        vision_classifier=vision_nsfw,
        text_classifier=text_clean,
        audit_log=None,
    )
    assert result.fired is True


# ── Cross-tenant isolation ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_audit_log_carries_tenant_id(
    audit_log: _FakeAuditLog,
    vision_nsfw: _FakeVisionClassifier,
    text_clean: _FakeLLMClassifier,
) -> None:
    other_tenant = uuid.uuid4()
    attachment = Attachment(url="https://s3.example.com/x.jpg", is_image=True)
    await community_safety_no_nsfw_input_check(
        user_msg="",
        tenant_id=other_tenant,
        attachments=[attachment],
        vision_classifier=vision_nsfw,
        text_classifier=text_clean,
        audit_log=audit_log,
    )
    assert audit_log.entries[0]["tenant_id"] == other_tenant
