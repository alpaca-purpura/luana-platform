"""Unit tests — CommunityPostService.

TDD RED-then-GREEN phase per tdd-mandatory.md.
Tests drive the contract per 03-arch-be.md § 9.3 + spec § 3.6 + § 14.4.

Covers:
  - P1: create_post happy path — active member, pre_moderation_count=3 → pending_moderation + counter decremented
  - P2: create_post new member, counter at 1 → pending_moderation + counter reaches 0
  - P3: create_post member out of pre-moderation window (count=0) → pending_moderation (classifier async)
  - P4: create_post waitlisted member → pending_moderation (vetted, no decrement)
  - P5: create_post high-engagement member (score >= 80) → pending_moderation (bypass pre-mod)
  - P6: create_post member not found → MemberNotFoundError
  - P7: create_post cohort_id=None (community-wide post) → saved with cohort_id=None
  - P8: create_post post row persisted with correct tenant_id + author_member_id
  - P9: pre_moderation_count decrement failure is silent (best-effort)

D1: CommunityPostService receives repos via DI constructor injection.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.community_post_service import (
    CommunityPostService,
    CreatePostRequest,
    CreatePostResult,
    MemberNotFoundError,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _make_member_model(
    *,
    member_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    status: str = "active",
    engagement_score: int = 50,
    pre_moderation_count: int = 3,
) -> MagicMock:
    """Build a minimal mock ComunifyCohortMemberModel."""
    model = MagicMock()
    model.id = member_id or uuid.uuid4()
    model.tenant_id = tenant_id or uuid.uuid4()
    model.status = status
    model.engagement_score = engagement_score
    model.pre_moderation_count = pre_moderation_count
    model.deleted_at = None
    return model


def _make_service(
    *,
    tenant_id: uuid.UUID | None = None,
    member_model: MagicMock | None = None,
) -> tuple[CommunityPostService, MagicMock, MagicMock]:
    """Build a CommunityPostService with mocked repos.

    Returns (service, post_repo_mock, member_repo_mock).
    The member_repo._session is a MagicMock with execute + flush as AsyncMock.
    """
    tid = tenant_id or uuid.uuid4()

    post_repo = MagicMock()
    post_repo.save = AsyncMock()

    # Build a member_repo with a fake session so _decrement_pre_moderation_count works
    session_mock = MagicMock()
    session_mock.execute = AsyncMock(return_value=MagicMock())
    session_mock.flush = AsyncMock()

    member_repo = MagicMock()
    member_repo.get_by_id = AsyncMock(return_value=member_model)
    member_repo._session = session_mock

    svc = CommunityPostService(
        post_repo=post_repo,
        member_repo=member_repo,
        tenant_id=tid,
    )
    return svc, post_repo, member_repo


# ─────────────────────────────────────────────────────────────────────────────
# Tests: initial status routing
# ─────────────────────────────────────────────────────────────────────────────


class TestCreatePostStatusRouting:
    """Verifies initial_status routing based on member state."""

    async def test_p1_new_member_with_count_3_gets_pending_moderation(self) -> None:
        """P1: active member pre_moderation_count=3 → pending_moderation + counter 2."""
        tid = uuid.uuid4()
        member_id = uuid.uuid4()
        cohort_id = uuid.uuid4()
        member = _make_member_model(
            member_id=member_id,
            tenant_id=tid,
            status="active",
            pre_moderation_count=3,
        )
        svc, post_repo, member_repo = _make_service(tenant_id=tid, member_model=member)

        req = CreatePostRequest(
            author_member_id=member_id,
            tenant_id=tid,
            content="Mi primera actualización del cohorte",
            cohort_id=cohort_id,
        )
        result = await svc.create_post(req)

        assert isinstance(result, CreatePostResult)
        assert result.initial_status == "pending_moderation"
        assert result.pre_moderation_count_remaining == 2
        post_repo.save.assert_called_once()

    async def test_p2_new_member_last_pre_mod_post_counter_reaches_zero(self) -> None:
        """P2: pre_moderation_count=1 → pending_moderation + counter reaches 0."""
        tid = uuid.uuid4()
        member = _make_member_model(status="active", pre_moderation_count=1)
        svc, post_repo, _ = _make_service(tenant_id=tid, member_model=member)

        req = CreatePostRequest(
            author_member_id=member.id,
            tenant_id=tid,
            content="Tercer post en pre-mod",
        )
        result = await svc.create_post(req)

        assert result.initial_status == "pending_moderation"
        assert result.pre_moderation_count_remaining == 0

    async def test_p3_member_out_of_pre_mod_window_gets_pending_moderation(self) -> None:
        """P3: pre_moderation_count=0 → pending_moderation (classifier handles async)."""
        tid = uuid.uuid4()
        member = _make_member_model(status="active", pre_moderation_count=0)
        svc, post_repo, _ = _make_service(tenant_id=tid, member_model=member)

        req = CreatePostRequest(
            author_member_id=member.id,
            tenant_id=tid,
            content="Regular post from established member",
        )
        result = await svc.create_post(req)

        assert result.initial_status == "pending_moderation"
        assert result.pre_moderation_count_remaining == 0

    async def test_p4_waitlisted_member_skips_pre_moderation(self) -> None:
        """P4: waitlisted member → pending_moderation but NO counter decrement (already vetted)."""
        tid = uuid.uuid4()
        member = _make_member_model(
            status="waitlisted",
            pre_moderation_count=3,  # still has count but should not decrement
        )
        svc, _, member_repo = _make_service(tenant_id=tid, member_model=member)

        req = CreatePostRequest(
            author_member_id=member.id,
            tenant_id=tid,
            content="Post from waitlisted member",
        )
        result = await svc.create_post(req)

        assert result.initial_status == "pending_moderation"
        # No decrement: pre_moderation_count_remaining stays None (no decrement path taken)
        assert result.pre_moderation_count_remaining is None
        # Session execute should NOT have been called (no decrement update)
        member_repo._session.execute.assert_not_called()

    async def test_p5_high_engagement_member_bypasses_pre_moderation(self) -> None:
        """P5: engagement_score >= 80 → pending_moderation + no counter decrement."""
        tid = uuid.uuid4()
        member = _make_member_model(
            status="active",
            engagement_score=85,
            pre_moderation_count=3,
        )
        svc, _, member_repo = _make_service(tenant_id=tid, member_model=member)

        req = CreatePostRequest(
            author_member_id=member.id,
            tenant_id=tid,
            content="High-engagement member post",
        )
        result = await svc.create_post(req)

        assert result.initial_status == "pending_moderation"
        assert result.pre_moderation_count_remaining is None
        # No decrement called
        member_repo._session.execute.assert_not_called()


# ─────────────────────────────────────────────────────────────────────────────
# Tests: error paths
# ─────────────────────────────────────────────────────────────────────────────


class TestCreatePostErrors:
    """Error handling for create_post."""

    async def test_p6_member_not_found_raises(self) -> None:
        """P6: member_repo.get_by_id returns None → MemberNotFoundError."""
        tid = uuid.uuid4()
        member_id = uuid.uuid4()

        post_repo = MagicMock()
        member_repo = MagicMock()
        member_repo.get_by_id = AsyncMock(return_value=None)

        svc = CommunityPostService(
            post_repo=post_repo,
            member_repo=member_repo,
            tenant_id=tid,
        )

        req = CreatePostRequest(
            author_member_id=member_id,
            tenant_id=tid,
            content="Post from non-existent member",
        )
        with pytest.raises(MemberNotFoundError) as exc_info:
            await svc.create_post(req)

        assert exc_info.value.member_id == member_id

    async def test_p9_pre_mod_count_decrement_failure_is_silent(self) -> None:
        """P9: if session.execute raises, create_post still returns result without raising."""
        tid = uuid.uuid4()
        member = _make_member_model(status="active", pre_moderation_count=2)

        post_repo = MagicMock()
        post_repo.save = AsyncMock()

        session_mock = MagicMock()
        session_mock.execute = AsyncMock(side_effect=Exception("DB timeout"))
        session_mock.flush = AsyncMock()

        member_repo = MagicMock()
        member_repo.get_by_id = AsyncMock(return_value=member)
        member_repo._session = session_mock

        svc = CommunityPostService(
            post_repo=post_repo,
            member_repo=member_repo,
            tenant_id=tid,
        )

        req = CreatePostRequest(
            author_member_id=member.id,
            tenant_id=tid,
            content="Post where decrement fails",
        )
        # Should NOT raise
        result = await svc.create_post(req)

        assert result.initial_status == "pending_moderation"
        # Post was still saved
        post_repo.save.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# Tests: persistence
# ─────────────────────────────────────────────────────────────────────────────


class TestCreatePostPersistence:
    """Verifies post row persisted with correct fields."""

    async def test_p7_community_wide_post_has_no_cohort_id(self) -> None:
        """P7: cohort_id=None → post saved with cohort_id=None."""
        tid = uuid.uuid4()
        member = _make_member_model(status="active", pre_moderation_count=0)
        svc, post_repo, _ = _make_service(tenant_id=tid, member_model=member)

        req = CreatePostRequest(
            author_member_id=member.id,
            tenant_id=tid,
            content="Community-wide post (no cohort scope)",
            cohort_id=None,
        )
        result = await svc.create_post(req)

        assert result.post_id is not None
        post_repo.save.assert_called_once()
        saved_post = post_repo.save.call_args.args[0]
        assert saved_post.cohort_id is None
        assert saved_post.tenant_id == tid

    async def test_p8_post_persisted_with_correct_fields(self) -> None:
        """P8: post model has correct tenant_id, author_member_id, content, status."""
        tid = uuid.uuid4()
        member_id = uuid.uuid4()
        cohort_id = uuid.uuid4()
        member = _make_member_model(
            member_id=member_id,
            tenant_id=tid,
            status="active",
            pre_moderation_count=1,
        )
        svc, post_repo, _ = _make_service(tenant_id=tid, member_model=member)

        content = "Quería compartir que cerré mi primera clienta este mes."
        req = CreatePostRequest(
            author_member_id=member_id,
            tenant_id=tid,
            content=content,
            cohort_id=cohort_id,
        )
        result = await svc.create_post(req)

        post_repo.save.assert_called_once()
        saved_post = post_repo.save.call_args.args[0]
        assert saved_post.tenant_id == tid
        assert saved_post.author_member_id == member_id
        assert saved_post.content == content
        assert saved_post.status == "pending_moderation"
        assert saved_post.cohort_id == cohort_id
        assert result.post_id == saved_post.id
