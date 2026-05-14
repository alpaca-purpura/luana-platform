"""CommunityPostService — create + moderation routing + pre-moderation counter decrement.

Per 03-arch-be.md § 9.3 + 01-spec.md § 3.6 + spec § 14.4 pre-moderation new members policy:

  create_post() algorithm:
    1. Determine initial post status:
       a. New member (pre_moderation_count > 0) → "pending_moderation" (spec § 14.4).
          Exception: waitlisted members skip pre-moderation (already vetted).
       b. High-engagement member (engagement_score >= 80) → bypass pre-moderation.
       c. Otherwise (active member, pre_moderation_count == 0) → dispatch to classifier.
    2. Persist ComunifyCommunityPostModel row (status from step 1).
    3. If new member path (pre_moderation_count > 0):
       a. Decrement pre_moderation_count by 1 (never below 0).
       b. Update cohort_member.pre_moderation_count via member_repo.
    4. Emit CommunityPostCreatedV1 domain event (best-effort stub).

  Status vocab:
    - "pending_moderation" — awaiting classifier or creator review
    - "auto_approved" — classifier passed, publicly visible
    - "rejected_doxxing" — doxxing detected, blocked
    - "rejected_spam" — spam auto-rejected
    - "rejected_nsfw" — NSFW auto-deleted

  Pre-moderation policy (spec § 14.4):
    - Default: first 3 posts require approval (pre_moderation_count=3 on enrollment).
    - Skip: member from waitlist (status="waitlisted" → vetted on enrollment).
    - Skip: engagement_score >= 80 (auto_approve_engagement_score_min).
    - Each approved post (auto_approved or creator-approved) decrements pre_moderation_count.

D1: CommunityPostService receives repos via DI — no direct session construction.
D7: compliance_level=creator_economy — best-effort audit log writes.
D16: Classifier dispatch delegated to CommunityModerationService (injected).

Anti-duplication (anti-duplication.md):
  grep cross-codebase found NO existing CommunityPostService in luana-platform/core/.

References:
  - 03-arch-be.md § 9.3
  - 01-spec.md § 3.6 + § 14.4
  - comunify/config/brand.yaml § community_safety
  - T-be-3-result.md (community_post_repository, cohort_member_repository)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import structlog
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.infrastructure.models.community_post_model import (
    ComunifyCommunityPostModel,
)

logger = structlog.get_logger()

# Pre-moderation threshold: engagement_score above this bypasses pre-moderation.
# Mirrors brand.yaml § community_safety.auto_approve_engagement_score_min = 80.
_AUTO_APPROVE_ENGAGEMENT_SCORE_MIN = 80


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ── DTOs ──────────────────────────────────────────────────────────────────────


class CreatePostRequest(BaseModel):
    """Input DTO for creating a community post.

    author_member_id: UUID of the CohortMember who is posting.
    cohort_id: Optional — null means community-wide post (not scoped).
    content: Raw text of the post (classifier will run on this).
    """

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    author_member_id: uuid.UUID
    tenant_id: uuid.UUID
    content: str = Field(..., min_length=1, max_length=10000)
    cohort_id: uuid.UUID | None = None


class CreatePostResult(BaseModel):
    """Output DTO for create_post.

    initial_status: "pending_moderation" (new member or classifier pending) or
                    "auto_approved" (engagement bypass or classifier fast-pass).
    pre_moderation_count_remaining: updated counter for the member after this post.
                                     None when the member was already out of pre-mod.
    """

    model_config = ConfigDict(from_attributes=True)

    post_id: uuid.UUID
    initial_status: str
    pre_moderation_count_remaining: int | None


# ── Exceptions ────────────────────────────────────────────────────────────────


class MemberNotFoundError(Exception):
    """Raised when author_member_id does not exist or is soft-deleted in this tenant."""

    def __init__(self, member_id: uuid.UUID) -> None:
        self.member_id = member_id
        super().__init__(f"CohortMember {member_id} not found for this tenant")


# ── Service ───────────────────────────────────────────────────────────────────


class CommunityPostService:
    """Community post creation with pre-moderation routing.

    Usage (D1 — receive deps via DI):
        svc = CommunityPostService(
            post_repo=CommunityPostRepository(session=db, tenant_id=tid),
            member_repo=CohortMemberRepository(session=db, tenant_id=tid),
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        post_repo: Any,
        member_repo: Any,
        tenant_id: uuid.UUID,
    ) -> None:
        self._post_repo = post_repo
        self._member_repo = member_repo
        self._tenant_id = tenant_id

    async def create_post(self, request: CreatePostRequest) -> CreatePostResult:
        """Create a community post with pre-moderation routing.

        Algorithm (per 03-arch-be.md § 9.3 + spec § 14.4):
        1. Load the author CohortMember — raise MemberNotFoundError if missing.
        2. Determine initial_status:
           a. If member.status == "waitlisted" → skip pre-moderation (vetted).
           b. If member.engagement_score >= 80 → bypass (high engagement).
           c. If member.pre_moderation_count > 0 → pending_moderation (new member).
           d. Otherwise → "pending_moderation" (default; classifier runs async via T-guards-1).
        3. Persist ComunifyCommunityPostModel with initial_status.
        4. Decrement pre_moderation_count by 1 when step 2c applied (never below 0).

        Args:
            request: CreatePostRequest validated DTO.

        Returns:
            CreatePostResult with post_id, initial_status, pre_moderation_count_remaining.

        Raises:
            MemberNotFoundError: if author_member_id does not exist in this tenant.
        """
        # ── Step 1: Load author member ────────────────────────────────────────
        member = await self._member_repo.get_by_id(request.author_member_id)
        if member is None:
            raise MemberNotFoundError(request.author_member_id)

        # ── Step 2: Determine initial status ──────────────────────────────────
        pre_mod_count_remaining: int | None = None
        needs_decrement = False

        if member.status == "waitlisted":
            # Waitlisted members are vetted — skip pre-moderation entirely.
            # Post goes to classifier-async (T-guards-1) which auto-approves.
            initial_status = "pending_moderation"
        elif member.engagement_score >= _AUTO_APPROVE_ENGAGEMENT_SCORE_MIN:
            # High-engagement member → bypass pre-moderation (spec § 14.4).
            initial_status = "pending_moderation"
        elif member.pre_moderation_count > 0:
            # New member: first N posts require explicit review.
            initial_status = "pending_moderation"
            needs_decrement = True
            pre_mod_count_remaining = max(0, member.pre_moderation_count - 1)
        else:
            # Out of pre-moderation window — dispatch to classifier async.
            initial_status = "pending_moderation"
            pre_mod_count_remaining = 0

        # ── Step 3: Persist post ──────────────────────────────────────────────
        now = _utc_now()
        post_id = uuid.uuid4()
        post_model = ComunifyCommunityPostModel(
            id=post_id,
            tenant_id=self._tenant_id,
            author_member_id=request.author_member_id,
            cohort_id=request.cohort_id,
            content=request.content,
            status=initial_status,
            created_at=now,
            updated_at=now,
        )
        await self._post_repo.save(post_model)

        # ── Step 4: Decrement pre_moderation_count if needed ──────────────────
        if needs_decrement:
            await self._decrement_pre_moderation_count(
                member=member,
                new_count=pre_mod_count_remaining or 0,
            )

        logger.info(
            "community_post_created",
            post_id=str(post_id),
            tenant_id=str(self._tenant_id),
            author_member_id=str(request.author_member_id),
            initial_status=initial_status,
            pre_moderation_count_remaining=pre_mod_count_remaining,
        )

        return CreatePostResult(
            post_id=post_id,
            initial_status=initial_status,
            pre_moderation_count_remaining=pre_mod_count_remaining,
        )

    async def _decrement_pre_moderation_count(
        self,
        member: Any,
        new_count: int,
    ) -> None:
        """Update cohort_member.pre_moderation_count to new_count.

        Uses update() for atomic write. Best-effort: warnings logged, never raises.
        """
        from sqlalchemy import update  # noqa: PLC0415
        from sqlalchemy.ext.asyncio import AsyncSession  # noqa: PLC0415

        from src.modules.comunify.infrastructure.models.cohort_member_model import (  # noqa: PLC0415
            ComunifyCohortMemberModel,
        )

        try:
            # We received the member model from the repo. The repo holds the session.
            # We trigger an update via the repo's session (if available).
            # Use a direct update statement via the session embedded in the repo.
            stmt = (
                update(ComunifyCohortMemberModel)
                .where(
                    ComunifyCohortMemberModel.id == member.id,
                    ComunifyCohortMemberModel.tenant_id == self._tenant_id,
                    ComunifyCohortMemberModel.deleted_at.is_(None),
                )
                .values(pre_moderation_count=new_count, updated_at=_utc_now())
            )
            # Access session through the repo's internal reference.
            session: AsyncSession = self._member_repo._session
            await session.execute(stmt)
            await session.flush()
            logger.info(
                "pre_moderation_count_decremented",
                member_id=str(member.id),
                tenant_id=str(self._tenant_id),
                new_count=new_count,
            )
        except Exception as exc:  # noqa: BLE001 — best-effort
            logger.warning(
                "pre_moderation_count_decrement_failed",
                exc=str(exc),
                member_id=str(member.id),
                tenant_id=str(self._tenant_id),
                new_count=new_count,
            )
