"""Community API DTOs — Pydantic v2.

Per 03-arch-be.md § 7 + § 6.6 + Tessl pii-sanitisation.md.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ── Community feed + posts ────────────────────────────────────────────────────


class CommunityPostItem(BaseModel):
    """Single community post item — PII allowlist enforced.

    author_member_id is exposed as opaque UUID (no name/email/phone).
    content is the post text. No PII fields exposed.
    """

    model_config = ConfigDict(from_attributes=True)

    post_id: uuid.UUID
    author_member_id: uuid.UUID
    cohort_id: uuid.UUID | None = None
    content: str
    status: str
    likes_count: int = 0
    replies_count: int = 0
    created_at: datetime


class CommunityFeedResponse(BaseModel):
    """GET /community/feed — cross-cohort feed."""

    model_config = ConfigDict(from_attributes=True)

    posts: list[CommunityPostItem]
    total: int
    page: int = 1
    page_size: int = 20


class CreatePostRequest(BaseModel):
    """POST /community/posts — create community post."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    author_member_id: uuid.UUID
    cohort_id: uuid.UUID | None = Field(None, description="Null = community-wide post")
    content: str = Field(..., min_length=1, max_length=2000)


class CreatePostResponse(BaseModel):
    """POST /community/posts — created post response."""

    model_config = ConfigDict(from_attributes=True)

    post_id: uuid.UUID
    status: str
    author_member_id: uuid.UUID
    moderation_pending: bool
    created_at: datetime


# ── Moderation ────────────────────────────────────────────────────────────────


class ModerationInboxItem(BaseModel):
    """Single item in moderation inbox — PII allowlist."""

    model_config = ConfigDict(from_attributes=True)

    post_id: uuid.UUID
    author_member_id: uuid.UUID
    cohort_id: uuid.UUID | None = None
    content: str
    spam_score: float | None = None
    nsfw_score: float | None = None
    doxxing_detected: bool = False
    created_at: datetime


class ModerationInboxResponse(BaseModel):
    """GET /community/moderation/inbox — pending posts for creator review."""

    model_config = ConfigDict(from_attributes=True)

    posts: list[ModerationInboxItem]
    total: int
    page: int = 1


class ModerationActionRequest(BaseModel):
    """POST /community/moderation/{post_id}/action — creator moderation action."""

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    action: Literal["approve", "reject", "delete_and_ban"]
    actor_id: uuid.UUID = Field(..., description="Creator/moderator UUID performing action")
    reason: str | None = Field(None, max_length=512)


class ModerationActionResponse(BaseModel):
    """POST /community/moderation/{post_id}/action — moderation result."""

    model_config = ConfigDict(from_attributes=True)

    post_id: uuid.UUID
    action_taken: str
    new_status: str
    actor_id: uuid.UUID
    acted_at: datetime
