"""E2E tests — community post creation + moderation journey (V-F-9).

Covers spec § 3.6 scenarios using mocked repos (no real DB required for V-F-9).
Tests exercise the full service layer end-to-end with mocked repo DI.

V-F-9 scenarios:
  - E-MOD-1: spec § 3.6.A happy — member post auto_approved (low scores)
  - E-MOD-2: spec § 3.6.B negative — spam detected → pending_moderation
  - E-MOD-3: spec § 3.6.D adversarial — doxxing attempt → rejected_doxxing
  - E-MOD-4: new member pre-moderation → counter decremented
  - E-MOD-5: creator approve action → post status=approved
  - E-MOD-6: creator reject+reason action → post status=rejected
  - E-MOD-7: creator delete_and_ban action → post status=removed_by_creator
  - E-MOD-8: cross-tenant isolation — post from other tenant not found

These tests combine CommunityPostService + CommunityModerationService
to verify the full create → classify → creator_action flow.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.community_moderation_service import (
    CommunityModerationService,
    ContentClassifierProtocol,
    CreatorActionRequest,
    ModerationClassifierScore,
    PostNotFoundError,
)
from src.modules.comunify.application.services.community_post_service import (
    CommunityPostService,
    CreatePostRequest,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


class ConfigurableClassifier:
    """Test classifier returning configurable scores per call.

    Conforms to ContentClassifierProtocol.
    Call configure() before each test to set return scores.
    """

    def __init__(self) -> None:
        self._score = ModerationClassifierScore(spam_score=0.0, nsfw_score=0.0, doxxing_detected=False)

    def configure(
        self,
        *,
        spam_score: float = 0.0,
        nsfw_score: float = 0.0,
        doxxing_detected: bool = False,
        confidence: float = 1.0,
    ) -> None:
        self._score = ModerationClassifierScore(
            spam_score=spam_score,
            nsfw_score=nsfw_score,
            doxxing_detected=doxxing_detected,
            confidence=confidence,
        )

    async def classify(self, content: str, tenant_id: uuid.UUID) -> ModerationClassifierScore:
        return self._score


def _make_member(
    *,
    member_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    status: str = "active",
    engagement_score: int = 50,
    pre_moderation_count: int = 0,
) -> MagicMock:
    m = MagicMock()
    m.id = member_id or uuid.uuid4()
    m.tenant_id = tenant_id or uuid.uuid4()
    m.status = status
    m.engagement_score = engagement_score
    m.pre_moderation_count = pre_moderation_count
    m.deleted_at = None
    return m


def _make_post_mock(
    *,
    post_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    status: str = "pending_moderation",
) -> MagicMock:
    m = MagicMock()
    m.id = post_id or uuid.uuid4()
    m.tenant_id = tenant_id or uuid.uuid4()
    m.status = status
    m.deleted_at = None
    return m


def _make_post_service(
    *,
    tenant_id: uuid.UUID,
    member: MagicMock,
) -> tuple[CommunityPostService, MagicMock, MagicMock]:
    """Build CommunityPostService with mocked repos."""
    post_repo = MagicMock()
    post_repo.save = AsyncMock()

    session_mock = MagicMock()
    session_mock.execute = AsyncMock(return_value=MagicMock())
    session_mock.flush = AsyncMock()

    member_repo = MagicMock()
    member_repo.get_by_id = AsyncMock(return_value=member)
    member_repo._session = session_mock

    svc = CommunityPostService(
        post_repo=post_repo,
        member_repo=member_repo,
        tenant_id=tenant_id,
    )
    return svc, post_repo, member_repo


def _make_mod_service(
    *,
    tenant_id: uuid.UUID,
    classifier: ContentClassifierProtocol,
    post_mock: MagicMock | None = None,
) -> tuple[CommunityModerationService, MagicMock, MagicMock]:
    """Build CommunityModerationService with mocked repos."""
    post_repo = MagicMock()
    post_repo.get_by_id = AsyncMock(return_value=post_mock)
    post_repo.update_status = AsyncMock(return_value=True)

    moderation_repo = MagicMock()
    moderation_repo.save = AsyncMock()

    svc = CommunityModerationService(
        post_repo=post_repo,
        moderation_repo=moderation_repo,
        classifier=classifier,
        compliance_svc=None,
        tenant_id=tenant_id,
    )
    return svc, post_repo, moderation_repo


# ─────────────────────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────────────────────


class TestCommunityPostModerationE2E:
    """End-to-end scenarios combining post creation + moderation classification."""

    async def test_e_mod_1_happy_member_post_auto_approved(self) -> None:
        """E-MOD-1: spec § 3.6.A — post from established member → auto_approved.

        Member is active with pre_moderation_count=0 (out of window).
        Classifier returns low spam + nsfw scores → auto_approved.
        """
        tid = uuid.uuid4()
        member_id = uuid.uuid4()
        member = _make_member(member_id=member_id, tenant_id=tid, pre_moderation_count=0)

        # Step 1: create post
        post_svc, post_repo, _ = _make_post_service(tenant_id=tid, member=member)
        req = CreatePostRequest(
            author_member_id=member_id,
            tenant_id=tid,
            content="Quería compartir que cerré mi primera clienta de USD 800/mes. ¡Gracias cohorte!",
        )
        create_result = await post_svc.create_post(req)
        assert create_result.initial_status == "pending_moderation"

        # Step 2: classify (simulate agentic moderator)
        classifier = ConfigurableClassifier()
        classifier.configure(spam_score=0.02, nsfw_score=0.0)
        mod_svc, _, _ = _make_mod_service(tenant_id=tid, classifier=classifier)

        classify_result = await mod_svc.classify_post(create_result.post_id, req.content)

        assert classify_result.final_status == "auto_approved"
        assert classify_result.score.spam_score == 0.02
        assert classify_result.score.nsfw_score == 0.0

    async def test_e_mod_2_spam_detected_post_pending_moderation(self) -> None:
        """E-MOD-2: spec § 3.6.B — spam detected → pending_moderation.

        Classifier returns spam_score=0.91 (>= 0.85, < 0.95) → pending_moderation.
        """
        tid = uuid.uuid4()
        member_id = uuid.uuid4()
        member = _make_member(member_id=member_id, tenant_id=tid, pre_moderation_count=0)

        post_svc, _, _ = _make_post_service(tenant_id=tid, member=member)
        spam_content = "Aplicá descuento 50% en mi web! Click ahora https://my-spam-link.tk"
        req = CreatePostRequest(
            author_member_id=member_id,
            tenant_id=tid,
            content=spam_content,
        )
        create_result = await post_svc.create_post(req)

        # Classifier flags spam (score 0.91)
        classifier = ConfigurableClassifier()
        classifier.configure(spam_score=0.91, nsfw_score=0.0)
        mod_svc, mod_post_repo, _ = _make_mod_service(tenant_id=tid, classifier=classifier)

        classify_result = await mod_svc.classify_post(create_result.post_id, spam_content)

        assert classify_result.final_status == "pending_moderation"
        # Verify post status was updated
        mod_post_repo.update_status.assert_called_once_with(
            create_result.post_id,
            status="pending_moderation",
            moderation_result=classify_result.score.model_dump()
            | {"final_status": "pending_moderation", "classifier_version": "stub_v0"},
        )

    async def test_e_mod_3_doxxing_attempt_rejected(self) -> None:
        """E-MOD-3: spec § 3.6.D — doxxing attempt → rejected_doxxing.

        Post contains member phone number → doxxing heuristic fires → rejected_doxxing.
        """
        tid = uuid.uuid4()
        member_id = uuid.uuid4()
        _make_member(member_id=member_id, pre_moderation_count=0)

        # Classifier returns low scores (doxxing detected via heuristic, not classifier)
        classifier = ConfigurableClassifier()
        classifier.configure(spam_score=0.0, nsfw_score=0.0, doxxing_detected=False)
        mod_svc, mod_post_repo, _ = _make_mod_service(tenant_id=tid, classifier=classifier)

        post_id = uuid.uuid4()
        doxxing_content = "Acá el WhatsApp de María D. +54 9 11 5555-1234 si querés contratarla privado"

        classify_result = await mod_svc.classify_post(post_id, doxxing_content)

        # Heuristic detected phone number → doxxing
        assert classify_result.final_status == "rejected_doxxing"
        assert classify_result.score.doxxing_detected is True
        mod_post_repo.update_status.assert_called_once_with(
            post_id,
            status="rejected_doxxing",
            moderation_result=classify_result.score.model_dump()
            | {"final_status": "rejected_doxxing", "classifier_version": "stub_v0"},
        )

    async def test_e_mod_4_new_member_pre_moderation_counter_decremented(self) -> None:
        """E-MOD-4: new member pre_moderation_count=2 → decremented to 1."""
        tid = uuid.uuid4()
        member_id = uuid.uuid4()
        member = _make_member(
            member_id=member_id,
            tenant_id=tid,
            status="active",
            pre_moderation_count=2,
        )
        post_svc, post_repo, member_repo = _make_post_service(tenant_id=tid, member=member)

        req = CreatePostRequest(
            author_member_id=member_id,
            tenant_id=tid,
            content="Primer post de miembro nuevo en el cohorte",
        )
        result = await post_svc.create_post(req)

        assert result.initial_status == "pending_moderation"
        assert result.pre_moderation_count_remaining == 1
        # Session update was executed to decrement counter
        member_repo._session.execute.assert_called_once()
        post_repo.save.assert_called_once()

    async def test_e_mod_5_creator_approve_action(self) -> None:
        """E-MOD-5: creator approves a pending post → status=approved."""
        tid = uuid.uuid4()
        creator_id = uuid.uuid4()
        post_id = uuid.uuid4()
        post_mock = _make_post_mock(post_id=post_id, tenant_id=tid, status="pending_moderation")

        classifier = ConfigurableClassifier()
        mod_svc, mod_post_repo, _ = _make_mod_service(tenant_id=tid, classifier=classifier, post_mock=post_mock)

        req = CreatorActionRequest(
            post_id=post_id,
            action="approve",
            actor_id=creator_id,
            tenant_id=tid,
        )
        result = await mod_svc.handle_creator_action(req)

        assert result.post_id == post_id
        assert result.new_status == "approved"
        mod_post_repo.update_status.assert_called_once_with(
            post_id,
            status="approved",
            moderation_result={
                "creator_action": "approve",
                "new_status": "approved",
                "reason": "",
            },
        )

    async def test_e_mod_6_creator_reject_with_reason(self) -> None:
        """E-MOD-6: creator rejects with reason → status=rejected."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        post_mock = _make_post_mock(post_id=post_id, tenant_id=tid)
        classifier = ConfigurableClassifier()
        mod_svc, mod_post_repo, _ = _make_mod_service(tenant_id=tid, classifier=classifier, post_mock=post_mock)

        req = CreatorActionRequest(
            post_id=post_id,
            action="reject",
            actor_id=uuid.uuid4(),
            tenant_id=tid,
            reason="Contenido irrelevante para la comunidad",
        )
        result = await mod_svc.handle_creator_action(req)

        assert result.new_status == "rejected"
        call_kwargs = mod_post_repo.update_status.call_args.kwargs
        assert call_kwargs["moderation_result"]["reason"] == "Contenido irrelevante para la comunidad"

    async def test_e_mod_7_creator_delete_and_ban(self) -> None:
        """E-MOD-7: creator deletes and bans → status=removed_by_creator."""
        tid = uuid.uuid4()
        post_id = uuid.uuid4()
        post_mock = _make_post_mock(post_id=post_id, tenant_id=tid)
        classifier = ConfigurableClassifier()
        mod_svc, mod_post_repo, _ = _make_mod_service(tenant_id=tid, classifier=classifier, post_mock=post_mock)

        req = CreatorActionRequest(
            post_id=post_id,
            action="delete_and_ban",
            actor_id=uuid.uuid4(),
            tenant_id=tid,
        )
        result = await mod_svc.handle_creator_action(req)

        assert result.new_status == "removed_by_creator"
        mod_post_repo.update_status.assert_called_once()

    async def test_e_mod_8_cross_tenant_post_not_visible(self) -> None:
        """E-MOD-8: post from another tenant → PostNotFoundError (tenant isolation).

        Simulates tenant_B attempting to moderate tenant_A's post.
        repo returns None (tenant_id filter rejects cross-tenant lookup).
        """
        tenant_b = uuid.uuid4()
        post_id_a = uuid.uuid4()  # belongs to tenant_A

        # CommunityModerationService for tenant_B
        post_repo_b = MagicMock()
        post_repo_b.get_by_id = AsyncMock(return_value=None)  # tenant_B cannot see tenant_A post
        post_repo_b.update_status = AsyncMock()

        moderation_repo_b = MagicMock()
        moderation_repo_b.save = AsyncMock()

        mod_svc_b = CommunityModerationService(
            post_repo=post_repo_b,
            moderation_repo=moderation_repo_b,
            classifier=ConfigurableClassifier(),
            tenant_id=tenant_b,
        )

        req = CreatorActionRequest(
            post_id=post_id_a,
            action="approve",
            actor_id=uuid.uuid4(),
            tenant_id=tenant_b,
        )
        with pytest.raises(PostNotFoundError) as exc_info:
            await mod_svc_b.handle_creator_action(req)

        assert exc_info.value.post_id == post_id_a
        # post_repo.update_status must NOT have been called (isolation enforced)
        post_repo_b.update_status.assert_not_called()
