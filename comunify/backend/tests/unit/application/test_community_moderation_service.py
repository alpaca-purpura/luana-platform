"""Unit tests — CommunityModerationService.

TDD RED-then-GREEN phase per tdd-mandatory.md.
Tests drive the contract per 03-arch-be.md § 9.3 + spec § 3.6.

Covers:
  - M1: classify_post auto_approved (low spam + nsfw scores → auto_approved)
  - M2: classify_post pending_moderation (spam_score >= 0.85 → pending_moderation)
  - M3: classify_post rejected_spam (spam_score >= 0.95 → rejected_spam)
  - M4: classify_post rejected_nsfw (nsfw_score >= 0.85 → rejected_nsfw)
  - M5: classify_post rejected_doxxing (doxxing_detected=True → rejected_doxxing)
  - M6: classify_post doxxing heuristic (phone number in content → rejected_doxxing)
  - M7: classify_post doxxing heuristic (email in content → rejected_doxxing)
  - M8: classify_post moderation_event row persisted (best-effort)
  - M9: classify_post moderation_event persist failure is silent (best-effort)
  - M10: handle_creator_action approve → post status=approved
  - M11: handle_creator_action reject → post status=rejected
  - M12: handle_creator_action delete_and_ban → post status=removed_by_creator
  - M13: handle_creator_action invalid action → InvalidModerationActionError
  - M14: handle_creator_action post not found → PostNotFoundError
  - M15: handle_creator_action moderation_event row persisted with actor_type=creator

D1: CommunityModerationService receives repos via DI constructor injection.
D16: ContentClassifierProtocol stub — mocked in unit tests.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.community_moderation_service import (
    ClassifyPostResult,
    CommunityModerationService,
    ContentClassifierProtocol,
    CreatorActionRequest,
    CreatorActionResult,
    InvalidModerationActionError,
    ModerationClassifierScore,
    PostNotFoundError,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _make_post_model(
    *,
    post_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    status: str = "pending_moderation",
    content: str = "Test post content",
) -> MagicMock:
    """Build a minimal mock ComunifyCommunityPostModel."""
    model = MagicMock()
    model.id = post_id or uuid.uuid4()
    model.tenant_id = tenant_id or uuid.uuid4()
    model.status = status
    model.content = content
    model.spam_score = None
    model.nsfw_score = None
    model.doxxing_detected = False
    model.moderation_result = None
    model.deleted_at = None
    return model


class StubClassifier:
    """Stub ContentClassifier returning configurable scores.

    Conforms to ContentClassifierProtocol.
    """

    def __init__(
        self,
        *,
        spam_score: float = 0.0,
        nsfw_score: float = 0.0,
        doxxing_detected: bool = False,
        confidence: float = 1.0,
    ) -> None:
        self._spam_score = spam_score
        self._nsfw_score = nsfw_score
        self._doxxing_detected = doxxing_detected
        self._confidence = confidence

    async def classify(
        self,
        content: str,
        tenant_id: uuid.UUID,
    ) -> ModerationClassifierScore:
        return ModerationClassifierScore(
            spam_score=self._spam_score,
            nsfw_score=self._nsfw_score,
            doxxing_detected=self._doxxing_detected,
            confidence=self._confidence,
        )


def _make_service(
    *,
    tenant_id: uuid.UUID | None = None,
    post_model: MagicMock | None = None,
    classifier: ContentClassifierProtocol | None = None,
) -> tuple[CommunityModerationService, MagicMock, MagicMock]:
    """Build a CommunityModerationService with mocked repos + optional stub classifier.

    Returns (service, post_repo_mock, moderation_repo_mock).
    """
    tid = tenant_id or uuid.uuid4()

    post_repo = MagicMock()
    post_repo.get_by_id = AsyncMock(return_value=post_model)
    post_repo.update_status = AsyncMock(return_value=True)

    moderation_repo = MagicMock()
    moderation_repo.save = AsyncMock()

    clf = classifier or StubClassifier()

    svc = CommunityModerationService(
        post_repo=post_repo,
        moderation_repo=moderation_repo,
        classifier=clf,
        compliance_svc=None,
        tenant_id=tid,
    )
    return svc, post_repo, moderation_repo


# ─────────────────────────────────────────────────────────────────────────────
# Tests: classify_post status routing
# ─────────────────────────────────────────────────────────────────────────────


class TestClassifyPostStatusRouting:
    """Verifies the 4-bucket status routing from classifier scores."""

    async def test_m1_auto_approved_on_low_scores(self) -> None:
        """M1: spam=0.02 + nsfw=0.0 → auto_approved."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        svc, post_repo, moderation_repo = _make_service(
            tenant_id=tid,
            classifier=StubClassifier(spam_score=0.02, nsfw_score=0.0),
        )

        result = await svc.classify_post(post_id, "Compartí mi primera venta. ¡Genial!")

        assert isinstance(result, ClassifyPostResult)
        assert result.post_id == post_id
        assert result.final_status == "auto_approved"
        post_repo.update_status.assert_called_once_with(
            post_id,
            status="auto_approved",
            moderation_result=result.score.model_dump()
            | {"final_status": "auto_approved", "classifier_version": "stub_v0"},
        )

    async def test_m2_pending_moderation_on_spam_threshold(self) -> None:
        """M2: spam_score=0.87 (>= 0.85) → pending_moderation (not auto-reject)."""
        svc, post_repo, _ = _make_service(
            classifier=StubClassifier(spam_score=0.87, nsfw_score=0.0),
        )

        result = await svc.classify_post(uuid.uuid4(), "Some borderline spam-ish content")

        assert result.final_status == "pending_moderation"

    async def test_m3_rejected_spam_on_high_spam_score(self) -> None:
        """M3: spam_score=0.95 (>= 0.95 auto_reject threshold) → rejected_spam."""
        svc, _, _ = _make_service(
            classifier=StubClassifier(spam_score=0.95, nsfw_score=0.0),
        )

        result = await svc.classify_post(uuid.uuid4(), "Buy now at 50% off! Limited time offer!")

        assert result.final_status == "rejected_spam"

    async def test_m4_rejected_nsfw_on_high_nsfw_score(self) -> None:
        """M4: nsfw_score=0.85 (>= 0.85) → rejected_nsfw."""
        svc, _, _ = _make_service(
            classifier=StubClassifier(spam_score=0.0, nsfw_score=0.85),
        )

        result = await svc.classify_post(uuid.uuid4(), "NSFW image description")

        assert result.final_status == "rejected_nsfw"

    async def test_m5_rejected_doxxing_when_classifier_flags(self) -> None:
        """M5: classifier returns doxxing_detected=True → rejected_doxxing (highest priority)."""
        svc, _, _ = _make_service(
            # Even with low spam/nsfw, doxxing overrides
            classifier=StubClassifier(spam_score=0.0, nsfw_score=0.0, doxxing_detected=True),
        )

        result = await svc.classify_post(uuid.uuid4(), "Here is someone's contact: +5491154321234")

        assert result.final_status == "rejected_doxxing"
        assert result.score.doxxing_detected is True

    async def test_m6_rejected_doxxing_via_phone_heuristic(self) -> None:
        """M6: phone number in content triggers doxxing heuristic → rejected_doxxing."""
        svc, _, _ = _make_service(
            # Classifier says no doxxing, but heuristic finds phone
            classifier=StubClassifier(doxxing_detected=False),
        )
        content = "Acá el WhatsApp de María: +54 9 11 5555-1234 si querés contratarla"

        result = await svc.classify_post(uuid.uuid4(), content)

        assert result.final_status == "rejected_doxxing"
        assert result.score.doxxing_detected is True

    async def test_m7_rejected_doxxing_via_email_heuristic(self) -> None:
        """M7: email pattern in content triggers doxxing heuristic → rejected_doxxing."""
        svc, _, _ = _make_service(
            classifier=StubClassifier(doxxing_detected=False),
        )
        content = "Contacta a María en privado: maria.ramirez@gmail.com"

        result = await svc.classify_post(uuid.uuid4(), content)

        assert result.final_status == "rejected_doxxing"
        assert result.score.doxxing_detected is True

    async def test_doxxing_priority_over_spam(self) -> None:
        """Doxxing overrides spam even when spam_score >= auto_reject."""
        svc, _, _ = _make_service(
            classifier=StubClassifier(spam_score=0.97, nsfw_score=0.0, doxxing_detected=True),
        )

        result = await svc.classify_post(uuid.uuid4(), "Buy now +54 9 11 5555-1234")

        assert result.final_status == "rejected_doxxing"


# ─────────────────────────────────────────────────────────────────────────────
# Tests: moderation_event persistence
# ─────────────────────────────────────────────────────────────────────────────


class TestModerationEventPersistence:
    """Verifies moderation_event row persisted + best-effort behavior."""

    async def test_m8_moderation_event_row_persisted(self) -> None:
        """M8: moderation_event row is saved with correct post_id + action."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        svc, _, moderation_repo = _make_service(
            tenant_id=tid,
            classifier=StubClassifier(spam_score=0.01),
        )

        result = await svc.classify_post(post_id, "Clean content")

        moderation_repo.save.assert_called_once()
        saved_event = moderation_repo.save.call_args.args[0]
        assert saved_event.post_id == post_id
        assert saved_event.tenant_id == tid
        assert saved_event.actor_type == "system"
        assert saved_event.action == "auto_approved"
        assert result.moderation_event_id == saved_event.id

    async def test_m9_persist_failure_is_silent(self) -> None:
        """M9: if moderation_event.save() raises, classify_post still returns result."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()

        post_repo = MagicMock()
        post_repo.update_status = AsyncMock(return_value=True)

        moderation_repo = MagicMock()
        moderation_repo.save = AsyncMock(side_effect=Exception("DB timeout"))

        svc = CommunityModerationService(
            post_repo=post_repo,
            moderation_repo=moderation_repo,
            classifier=StubClassifier(spam_score=0.01),
            tenant_id=tid,
        )

        # Should NOT raise despite save() failing
        result = await svc.classify_post(post_id, "Clean content")

        assert result.post_id == post_id
        assert result.final_status == "auto_approved"
        # post_repo.update_status still called
        post_repo.update_status.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# Tests: handle_creator_action
# ─────────────────────────────────────────────────────────────────────────────


class TestHandleCreatorAction:
    """Verifies creator moderation action handling."""

    async def test_m10_approve_sets_status_approved(self) -> None:
        """M10: action=approve → post status=approved."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        actor_id = uuid.uuid4()
        post_model = _make_post_model(post_id=post_id, tenant_id=tid)

        svc, post_repo, moderation_repo = _make_service(
            tenant_id=tid,
            post_model=post_model,
        )

        req = CreatorActionRequest(
            post_id=post_id,
            action="approve",
            actor_id=actor_id,
            tenant_id=tid,
        )
        result = await svc.handle_creator_action(req)

        assert isinstance(result, CreatorActionResult)
        assert result.post_id == post_id
        assert result.new_status == "approved"
        post_repo.update_status.assert_called_once_with(
            post_id,
            status="approved",
            moderation_result={
                "creator_action": "approve",
                "new_status": "approved",
                "reason": "",
            },
        )

    async def test_m11_reject_sets_status_rejected(self) -> None:
        """M11: action=reject → post status=rejected."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        post_model = _make_post_model(post_id=post_id, tenant_id=tid)
        svc, post_repo, _ = _make_service(tenant_id=tid, post_model=post_model)

        req = CreatorActionRequest(
            post_id=post_id,
            action="reject",
            actor_id=uuid.uuid4(),
            tenant_id=tid,
        )
        result = await svc.handle_creator_action(req)

        assert result.new_status == "rejected"
        post_repo.update_status.assert_called_once()
        call_kwargs = post_repo.update_status.call_args.kwargs
        assert call_kwargs["status"] == "rejected"

    async def test_m12_delete_and_ban_sets_removed(self) -> None:
        """M12: action=delete_and_ban → post status=removed_by_creator."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        post_model = _make_post_model(post_id=post_id, tenant_id=tid)
        svc, post_repo, _ = _make_service(tenant_id=tid, post_model=post_model)

        req = CreatorActionRequest(
            post_id=post_id,
            action="delete_and_ban",
            actor_id=uuid.uuid4(),
            tenant_id=tid,
        )
        result = await svc.handle_creator_action(req)

        assert result.new_status == "removed_by_creator"

    async def test_m13_invalid_action_raises(self) -> None:
        """M13: unknown action → InvalidModerationActionError."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        post_model = _make_post_model(post_id=post_id, tenant_id=tid)
        svc, _, _ = _make_service(tenant_id=tid, post_model=post_model)

        req = CreatorActionRequest(
            post_id=post_id,
            action="teleport",  # not valid
            actor_id=uuid.uuid4(),
            tenant_id=tid,
        )
        with pytest.raises(InvalidModerationActionError) as exc_info:
            await svc.handle_creator_action(req)

        assert "teleport" in str(exc_info.value)

    async def test_m14_post_not_found_raises(self) -> None:
        """M14: post_repo.get_by_id returns None → PostNotFoundError."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()

        post_repo = MagicMock()
        post_repo.get_by_id = AsyncMock(return_value=None)  # post not found

        moderation_repo = MagicMock()
        moderation_repo.save = AsyncMock()

        svc = CommunityModerationService(
            post_repo=post_repo,
            moderation_repo=moderation_repo,
            classifier=StubClassifier(),
            tenant_id=tid,
        )

        req = CreatorActionRequest(
            post_id=post_id,
            action="approve",
            actor_id=uuid.uuid4(),
            tenant_id=tid,
        )
        with pytest.raises(PostNotFoundError) as exc_info:
            await svc.handle_creator_action(req)

        assert exc_info.value.post_id == post_id

    async def test_m15_creator_action_event_persisted_with_correct_actor_type(self) -> None:
        """M15: moderation_event row saved with actor_type='creator' + actor_id."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        actor_id = uuid.uuid4()
        post_model = _make_post_model(post_id=post_id, tenant_id=tid)

        svc, _, moderation_repo = _make_service(tenant_id=tid, post_model=post_model)

        req = CreatorActionRequest(
            post_id=post_id,
            action="reject",
            actor_id=actor_id,
            tenant_id=tid,
            reason="Spam promotion",
        )
        result = await svc.handle_creator_action(req)

        moderation_repo.save.assert_called_once()
        saved_event = moderation_repo.save.call_args.args[0]
        assert saved_event.actor_type == "creator"
        assert saved_event.actor_id == actor_id
        assert saved_event.action == "reject"
        assert result.moderation_event_id == saved_event.id

    async def test_m15b_creator_action_event_persist_failure_is_silent(self) -> None:
        """Creator action event persist failure does not raise."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        post_model = _make_post_model(post_id=post_id, tenant_id=tid)

        post_repo = MagicMock()
        post_repo.get_by_id = AsyncMock(return_value=post_model)
        post_repo.update_status = AsyncMock(return_value=True)

        moderation_repo = MagicMock()
        moderation_repo.save = AsyncMock(side_effect=Exception("DB write fail"))

        svc = CommunityModerationService(
            post_repo=post_repo,
            moderation_repo=moderation_repo,
            classifier=StubClassifier(),
            tenant_id=tid,
        )

        req = CreatorActionRequest(
            post_id=post_id,
            action="approve",
            actor_id=uuid.uuid4(),
            tenant_id=tid,
        )
        # Must not raise
        result = await svc.handle_creator_action(req)
        assert result.new_status == "approved"
        post_repo.update_status.assert_called_once()
