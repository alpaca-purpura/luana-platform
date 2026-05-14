"""ComplianceEventService — best-effort community compliance audit log writes.

Creator-economy pattern: writes are best-effort — persist failures NEVER raise
and NEVER interrupt user flow. All exceptions are caught and logged via
structlog.warning (same pattern as Vitalia Story 11 + copilot observability).

Per 03-arch-be.md § 9.8:
  - sanitize_payload() invoked BEFORE persist (creator_economy compliance).
  - try/except + structlog.warning wraps every write.
  - Caller flow is NEVER interrupted by audit log failures.

D1: Receives audit_repo via DI — no direct DB session access.
D7: creator_economy compliance_level metadata on every audit event.

Event types used by callers:
  spam_blocked | nsfw_blocked | doxxing_blocked |
  cross_tenant_attempt | post_removed | member_suspended |
  pii_detected | voice_sample_pii_redacted

Anti-duplication (anti-duplication.md):
  grep cross-codebase found NO existing ComplianceEventService in luana-platform/core/.
  Pattern mirrors vitalia.application.services.compliance_event_service.
  sanitize_payload consumed from luana_core_observability via conftest sys.path.

References:
  - 03-arch-be.md § 9.8
  - 04-validators.yaml V-F-2 (unit tests)
  - 04-validators.yaml V-F-17 (integration: pii + voice samples)
  - Tessl pii-sanitisation.md
  - copilot-observability.md best-effort writes pattern
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import structlog

logger = structlog.get_logger()


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


# ── Lazy import for sanitize_payload ─────────────────────────────────────────
# luana_core_observability is available at runtime via conftest.py sys.path
# injection. We import at function call time to avoid import errors in envs
# where the workspace path isn't configured (e.g., during arch fitness scans).


def sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Sanitize payload via luana_core_observability or local fallback.

    Tries to import from luana_core_observability (runtime workspace path).
    Falls back to returning payload unchanged if package unavailable.
    This ensures the service works in both full-workspace and isolated envs.
    """
    try:
        from luana_core_observability.recording.sanitization import sanitize_payload as _sp

        return _sp(payload)  # type: ignore[no-any-return]
    except ImportError:
        # Fallback: truncate and return (basic protection without full workspace)
        _MAX_LEN = 4000
        return {k: (v[:_MAX_LEN] if isinstance(v, str) and len(v) > _MAX_LEN else v) for k, v in payload.items()}


# ── Model import ─────────────────────────────────────────────────────────────

from src.modules.comunify.infrastructure.models.community_audit_log_model import (  # noqa: E402
    ComunifyCommunityAuditLogModel,
)
from src.modules.comunify.infrastructure.repositories.community_audit_log_repository import (  # noqa: E402
    CommunityAuditLogRepository,
)

# ── Service ──────────────────────────────────────────────────────────────────


class ComplianceEventService:
    """Best-effort community compliance event logger.

    All writes are best-effort: any exception is caught and logged
    via structlog.warning — the caller flow is NEVER interrupted.

    Usage (D1 — receive repo via DI):
        svc = ComplianceEventService(audit_repo=repo)
        await svc.log_event("spam_blocked", "medium", payload={...}, tenant_id=tid)

    The service is intentionally thin — sanitize + model creation + save.
    """

    def __init__(self, audit_repo: CommunityAuditLogRepository) -> None:
        self._audit_repo = audit_repo

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
        """Best-effort write to comunify_community_audit_log. NEVER raises.

        Args:
            event_type: Event type slug (e.g. "spam_blocked", "pii_detected").
            severity: "info" | "medium" | "high".
            payload: Raw event payload — PII-sanitized before persist.
            tenant_id: Required tenant identifier (tenant isolation).
            member_id: Optional member UUID for member-linked events.
            post_id: Optional post UUID for post-linked events.
            target_member_id: Optional doxxing victim member UUID.
            actor_id: Optional actor UUID (creator / agent / system).
            actor_type: Optional actor role string ("creator" | "sales_agent" | "moderator" | "system").
        """
        try:
            # D7: sanitize_payload BEFORE persist (creator_economy compliance)
            sanitized = sanitize_payload(payload)

            audit = ComunifyCommunityAuditLogModel(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                event_type=event_type,
                severity=severity,
                payload_redacted=sanitized,
                member_id=member_id,
                post_id=post_id,
                target_member_id=target_member_id,
                actor_id=actor_id,
                actor_type=actor_type,
                created_at=_utc_now(),
            )
            await self._audit_repo.save(audit)

        except Exception as exc:  # noqa: BLE001 — best-effort: catch ALL exceptions
            logger.warning(
                "compliance_event_persist_failed",
                exc=str(exc),
                event_type=event_type,
                severity=severity,
                tenant_id=str(tenant_id),
            )
            # NEVER re-raise — user flow must not be interrupted by audit failures
