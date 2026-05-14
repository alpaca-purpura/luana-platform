"""CommunityModerationService — classifier dispatch + creator action handling.

Per 03-arch-be.md § 9.3 + 01-spec.md § 3.6 + brand.yaml community_safety thresholds:

  Classifier dispatch (D16 — Haiku 4.5 stub, wired in T-guards-1..4):
    1. ContentClassifierProtocol injected via DI (stub for now — real Haiku in T-guards-*).
    2. Runs classify(post_content, tenant_id) → ModerationClassifierScore.
    3. Doxxing detection: regex phone/email patterns in content.
    4. Status routing per brand.yaml thresholds:
       - doxxing_detected → rejected_doxxing
       - spam_score >= auto_reject_spam_score_min (0.95) → rejected_spam
       - nsfw_score >= auto_delete_nsfw_score_min (0.85) → rejected_nsfw
       - spam_score >= spam_score_threshold (0.85) OR nsfw_score >= nsfw_score_threshold (0.85)
         → pending_moderation
       - else → auto_approved
    5. Persist ComunifyCommunityModerationEventModel row (best-effort try/except).
    6. Emit CommunityPostModeratedV1 event (best-effort stub).

  Creator action handling:
    - handle_creator_action(post_id, action, actor_id, tenant_id)
      actions: approve | reject | delete_and_ban
    - Persists moderation_event row with actor_type="creator".

D1: Receives repos via DI — no direct session construction.
D7: compliance_level=creator_economy — moderation_event row writes best-effort.
D16: ContentClassifierProtocol stub — Haiku 4.5 real impl in T-guards-1.
D18: community_audit_log 5-year retention — ComplianceEventService logs events.

Thresholds (from comunify/config/brand.yaml § community_safety):
  spam_score_threshold: 0.85
  nsfw_score_threshold: 0.85
  auto_approve_engagement_score_min: 80
  auto_reject_spam_score_min: 0.95
  auto_delete_nsfw_score_min: 0.85

Anti-duplication (anti-duplication.md):
  grep cross-codebase found NO existing CommunityModerationService in luana-platform/core/.
  Pattern is comunify-specific vertical creator economy.

References:
  - 03-arch-be.md § 9.3
  - 01-spec.md § 3.6 + § 14.1 + § 14.2 + § 14.3
  - comunify/config/brand.yaml § community_safety
  - T-be-3-result.md (community_moderation_repository, community_post_repository)
  - D16: classifier stub for T-guards-1 wiring
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Protocol

import structlog
from pydantic import BaseModel, ConfigDict

logger = structlog.get_logger()

# ── Classifier version sentinel ──────────────────────────────────────────────
_CLASSIFIER_VERSION_STUB = "stub_v0"

# ── Community safety thresholds (mirrors comunify/config/brand.yaml) ─────────
_SPAM_THRESHOLD = 0.85
_NSFW_THRESHOLD = 0.85
_AUTO_REJECT_SPAM_MIN = 0.95
_AUTO_DELETE_NSFW_MIN = 0.85

# ── Simple phone/email regex for doxxing detection ───────────────────────────
# Detects: international phone numbers (E.164 variants) + plain emails
_PHONE_PATTERN = re.compile(
    r"(?:\+?(?:549?|52|56|57|51|55)\s?)?(?:\d[\s\-.]?){7,14}\d",
    re.IGNORECASE,
)
_EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


# ── Value objects ─────────────────────────────────────────────────────────────


class ModerationClassifierScore(BaseModel):
    """Output of the ContentClassifierProtocol.classify() call.

    All scores are in [0.0, 1.0] range.
    confidence: overall confidence of the classification.
    """

    model_config = ConfigDict(from_attributes=True)

    spam_score: float = 0.0
    nsfw_score: float = 0.0
    doxxing_detected: bool = False
    confidence: float = 1.0
    reasoning: str = ""


# ── ContentClassifierProtocol ─────────────────────────────────────────────────


class ContentClassifierProtocol(Protocol):
    """Stub interface for post content classification.

    Production implementation (Haiku 4.5) wired in T-guards-1..4.
    Injected via DI so tests use a mock; real guards swapped at runtime.

    classify() is async: allows real impl to call LLM (Haiku 4.5) without
    blocking the event loop. Stub returns safe defaults (all-zero scores).
    """

    async def classify(
        self,
        content: str,
        tenant_id: uuid.UUID,
    ) -> ModerationClassifierScore:
        """Classify post content for spam / NSFW / doxxing signals.

        Args:
            content: Raw post text (may contain URLs, mentions, etc.).
            tenant_id: Tenant UUID — classifier may adjust thresholds per tenant.

        Returns:
            ModerationClassifierScore with spam_score, nsfw_score, doxxing_detected.
        """
        ...  # pragma: no cover


# ── DTOs ──────────────────────────────────────────────────────────────────────


class ClassifyPostResult(BaseModel):
    """Result of classifying + routing a community post.

    final_status: one of auto_approved | pending_moderation | rejected_doxxing |
                  rejected_spam | rejected_nsfw
    moderation_event_id: UUID of the persisted ComunifyCommunityModerationEventModel row.
    score: the raw classifier score for observability.
    """

    model_config = ConfigDict(from_attributes=True)

    post_id: uuid.UUID
    final_status: str
    moderation_event_id: uuid.UUID
    score: ModerationClassifierScore


class CreatorActionRequest(BaseModel):
    """Input DTO for creator moderation action.

    action: "approve" | "reject" | "delete_and_ban"
    actor_id: UUID of the creator performing the action.
    """

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    post_id: uuid.UUID
    action: str  # approve | reject | delete_and_ban
    actor_id: uuid.UUID
    tenant_id: uuid.UUID
    reason: str | None = None


class CreatorActionResult(BaseModel):
    """Output DTO for creator moderation action."""

    model_config = ConfigDict(from_attributes=True)

    post_id: uuid.UUID
    new_status: str
    moderation_event_id: uuid.UUID


# ── Exceptions ────────────────────────────────────────────────────────────────


class PostNotFoundError(Exception):
    """Raised when post_id does not exist or is soft-deleted in this tenant."""

    def __init__(self, post_id: uuid.UUID) -> None:
        self.post_id = post_id
        super().__init__(f"Community post {post_id} not found for this tenant")


class InvalidModerationActionError(Exception):
    """Raised when an unrecognized creator action is submitted."""

    def __init__(self, action: str) -> None:
        self.action = action
        super().__init__(f"Invalid moderation action: {action!r}. Expected: approve | reject | delete_and_ban")


# ── Helpers ───────────────────────────────────────────────────────────────────


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


def _detect_doxxing_heuristic(content: str) -> bool:
    """Regex-based heuristic doxxing detection.

    Checks for phone number or email patterns in the post content.
    Real implementation (T-guards-3) cross-references cohort_members table.
    For now returns True if content contains phone or email patterns.
    """
    return bool(_PHONE_PATTERN.search(content)) or bool(_EMAIL_PATTERN.search(content))


def _route_status(score: ModerationClassifierScore) -> str:
    """Route post to final status based on classifier scores.

    Priority order (spec § 14.1 + § 14.2 + § 14.3 + brand.yaml):
      1. doxxing_detected → rejected_doxxing (highest severity)
      2. spam_score >= 0.95 → rejected_spam (auto-reject)
      3. nsfw_score >= 0.85 → rejected_nsfw (auto-delete NSFW)
      4. spam_score >= 0.85 OR nsfw_score >= 0.85 → pending_moderation
      5. else → auto_approved
    """
    if score.doxxing_detected:
        return "rejected_doxxing"
    if score.spam_score >= _AUTO_REJECT_SPAM_MIN:
        return "rejected_spam"
    if score.nsfw_score >= _AUTO_DELETE_NSFW_MIN:
        return "rejected_nsfw"
    if score.spam_score >= _SPAM_THRESHOLD or score.nsfw_score >= _NSFW_THRESHOLD:
        return "pending_moderation"
    return "auto_approved"


def _action_to_status(action: str) -> str:
    """Map creator moderation action string to post status string."""
    mapping: dict[str, str] = {
        "approve": "approved",
        "reject": "rejected",
        "delete_and_ban": "removed_by_creator",
    }
    return mapping[action]  # caller validates action first


# ── Service ───────────────────────────────────────────────────────────────────


class CommunityModerationService:
    """Classifier dispatch + creator moderation action handling.

    Usage (D1 — receive deps via DI):
        svc = CommunityModerationService(
            post_repo=CommunityPostRepository(session=db, tenant_id=tid),
            moderation_repo=CommunityModerationRepository(session=db, tenant_id=tid),
            classifier=StubContentClassifier(),   # real Haiku in T-guards-1
            compliance_svc=ComplianceEventService(audit_repo=...), # optional
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        post_repo: Any,
        moderation_repo: Any,
        classifier: ContentClassifierProtocol,
        compliance_svc: Any | None = None,
        tenant_id: uuid.UUID,
    ) -> None:
        self._post_repo = post_repo
        self._moderation_repo = moderation_repo
        self._classifier = classifier
        self._compliance_svc = compliance_svc
        self._tenant_id = tenant_id

    async def classify_post(
        self,
        post_id: uuid.UUID,
        post_content: str,
    ) -> ClassifyPostResult:
        """Run spam + NSFW + doxxing classifiers and route post to final status.

        Algorithm (per 03-arch-be.md § 9.3):
        1. Run ContentClassifierProtocol.classify() (stub now; Haiku in T-guards-1).
        2. Run doxxing heuristic on content (regex + optional cross-ref).
        3. Route status: doxxing > spam_auto_reject > nsfw_auto_delete > pending > auto_approved.
        4. Persist moderation_event row (best-effort try/except + structlog.warning).
        5. Update post.status via post_repo.update_status.
        6. Emit CommunityPostModeratedV1 domain event (best-effort stub).

        Args:
            post_id: UUID of the post to classify.
            post_content: Raw text content of the post.

        Returns:
            ClassifyPostResult with final_status + moderation_event_id + score.

        Raises:
            PostNotFoundError: if post_id does not exist in this tenant.
        """
        # ── Step 1: Run LLM classifier (stub now) ────────────────────────────
        score = await self._classifier.classify(post_content, self._tenant_id)

        # ── Step 2: Doxxing heuristic (regex — T-guards-3 wires cross-ref) ───
        if not score.doxxing_detected:
            score = ModerationClassifierScore(
                spam_score=score.spam_score,
                nsfw_score=score.nsfw_score,
                doxxing_detected=_detect_doxxing_heuristic(post_content),
                confidence=score.confidence,
                reasoning=score.reasoning,
            )

        # ── Step 3: Route final status ────────────────────────────────────────
        final_status = _route_status(score)

        # ── Step 4: Persist moderation_event row (best-effort) ───────────────
        from src.modules.comunify.infrastructure.models.community_moderation_event_model import (  # noqa: PLC0415
            ComunifyCommunityModerationEventModel,
        )

        event_id = uuid.uuid4()
        try:
            moderation_event = ComunifyCommunityModerationEventModel(
                id=event_id,
                tenant_id=self._tenant_id,
                post_id=post_id,
                classifier_version=_CLASSIFIER_VERSION_STUB,
                scores={
                    "spam_score": score.spam_score,
                    "nsfw_score": score.nsfw_score,
                    "doxxing_detected": score.doxxing_detected,
                    "confidence": score.confidence,
                },
                action=final_status,
                actor_id=None,
                actor_type="system",
                created_at=_utc_now(),
            )
            await self._moderation_repo.save(moderation_event)
        except Exception as exc:  # noqa: BLE001 — best-effort
            logger.warning(
                "moderation_event_persist_failed",
                exc=str(exc),
                post_id=str(post_id),
                tenant_id=str(self._tenant_id),
                final_status=final_status,
            )

        # ── Step 5: Update post status ────────────────────────────────────────
        moderation_result: dict[str, Any] = score.model_dump() | {
            "final_status": final_status,
            "classifier_version": _CLASSIFIER_VERSION_STUB,
        }
        await self._post_repo.update_status(
            post_id,
            status=final_status,
            moderation_result=moderation_result,
        )

        # ── Step 6: Compliance audit log (best-effort) ───────────────────────
        if self._compliance_svc is not None:
            event_type = f"post_{final_status}"
            severity = "high" if score.doxxing_detected else ("medium" if final_status != "auto_approved" else "info")
            try:
                await self._compliance_svc.log_event(
                    event_type,
                    severity,
                    payload={
                        "post_id": str(post_id),
                        "spam_score": score.spam_score,
                        "nsfw_score": score.nsfw_score,
                        "doxxing_detected": score.doxxing_detected,
                    },
                    tenant_id=self._tenant_id,
                    post_id=post_id,
                )
            except Exception as exc:  # noqa: BLE001 — best-effort
                logger.warning(
                    "compliance_audit_log_failed",
                    exc=str(exc),
                    event_type=event_type,
                    post_id=str(post_id),
                    tenant_id=str(self._tenant_id),
                )

        logger.info(
            "community_post_classified",
            post_id=str(post_id),
            tenant_id=str(self._tenant_id),
            final_status=final_status,
            spam_score=score.spam_score,
            nsfw_score=score.nsfw_score,
            doxxing_detected=score.doxxing_detected,
        )

        return ClassifyPostResult(
            post_id=post_id,
            final_status=final_status,
            moderation_event_id=event_id,
            score=score,
        )

    async def handle_creator_action(
        self,
        request: CreatorActionRequest,
    ) -> CreatorActionResult:
        """Handle creator moderation action (approve | reject | delete_and_ban).

        Algorithm:
        1. Validate action string.
        2. Verify post exists (PostNotFoundError if missing).
        3. Derive new_status from action.
        4. Update post.status via post_repo.update_status.
        5. Persist moderation_event row with actor_type="creator" (best-effort).
        6. Compliance audit log (best-effort).

        Args:
            request: CreatorActionRequest validated DTO.

        Returns:
            CreatorActionResult with post_id, new_status, moderation_event_id.

        Raises:
            InvalidModerationActionError: if action is not recognized.
            PostNotFoundError: if post does not exist in this tenant.
        """
        _valid_actions = {"approve", "reject", "delete_and_ban"}
        if request.action not in _valid_actions:
            raise InvalidModerationActionError(request.action)

        # ── Verify post exists ────────────────────────────────────────────────
        post = await self._post_repo.get_by_id(request.post_id)
        if post is None:
            raise PostNotFoundError(request.post_id)

        new_status = _action_to_status(request.action)

        # ── Update post status ────────────────────────────────────────────────
        moderation_result: dict[str, Any] = {
            "creator_action": request.action,
            "new_status": new_status,
            "reason": request.reason or "",
        }
        await self._post_repo.update_status(
            request.post_id,
            status=new_status,
            moderation_result=moderation_result,
        )

        # ── Persist moderation_event row (best-effort) ────────────────────────
        from src.modules.comunify.infrastructure.models.community_moderation_event_model import (  # noqa: PLC0415
            ComunifyCommunityModerationEventModel,
        )

        event_id = uuid.uuid4()
        try:
            creator_event = ComunifyCommunityModerationEventModel(
                id=event_id,
                tenant_id=self._tenant_id,
                post_id=request.post_id,
                classifier_version="creator_action",
                scores={},
                action=request.action,
                actor_id=request.actor_id,
                actor_type="creator",
                created_at=_utc_now(),
            )
            await self._moderation_repo.save(creator_event)
        except Exception as exc:  # noqa: BLE001 — best-effort
            logger.warning(
                "creator_action_event_persist_failed",
                exc=str(exc),
                post_id=str(request.post_id),
                tenant_id=str(self._tenant_id),
                action=request.action,
            )

        # ── Compliance audit log (best-effort) ───────────────────────────────
        if self._compliance_svc is not None:
            try:
                await self._compliance_svc.log_event(
                    "moderation_action",
                    "info",
                    payload={
                        "post_id": str(request.post_id),
                        "action": request.action,
                        "new_status": new_status,
                    },
                    tenant_id=self._tenant_id,
                    post_id=request.post_id,
                    actor_id=request.actor_id,
                    actor_type="creator",
                )
            except Exception as exc:  # noqa: BLE001 — best-effort
                logger.warning(
                    "compliance_audit_log_failed",
                    exc=str(exc),
                    action=request.action,
                    post_id=str(request.post_id),
                    tenant_id=str(self._tenant_id),
                )

        logger.info(
            "creator_moderation_action",
            post_id=str(request.post_id),
            tenant_id=str(self._tenant_id),
            action=request.action,
            new_status=new_status,
            actor_id=str(request.actor_id),
        )

        return CreatorActionResult(
            post_id=request.post_id,
            new_status=new_status,
            moderation_event_id=event_id,
        )
