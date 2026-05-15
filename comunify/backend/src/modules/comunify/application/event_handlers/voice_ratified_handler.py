"""VoiceRatifiedV1 handler — Slot 5 BRAND_VOICE cache invalidation (T-voice-3).

R23: production_code=True AGENTIC. Opus 4.7 EXCLUSIVE (06-tickets.yaml::T-voice-3).

When ``VoiceRatifiedV1`` arrives (emitted by ``compiler_integration.
bridge_compiled_voice_to_personality_profile``), this handler invalidates
the per-tenant Slot 5 BRAND_VOICE prompt cache so the next sales-agent /
copilot turn rebuilds the cache prefix with the new ``system_instruction``.

Per 02-design-agentic.md voice cloning + slot invalidation + 03-arch-agentic.md
§ 8.3 cache invalidation triggers:

  VoiceRatifiedV1 (tenant_id, profile_version)
       │
       ▼
  voice_ratified_handler
       │
       ├── 1. Compute new Slot 5 cache key for tenant (per-tenant scope)
       ├── 2. Invalidate previous cache key via SlotCacheInvalidatorProtocol
       ├── 3. (Best-effort) Pre-warm new cache key by triggering a no-op
       │      compose call so the next live turn hits a warm cache
       └── 4. Audit log voice_ratified_cache_invalidated

Per .claude/rules/sales-agent-brand-voice.md (SSoT): Slot 5 BRAND_VOICE
cache prefix is per-tenant. Bumping ``personality_profile_version`` IS
the canonical invalidation signal — cache stores key with version in it.

Anti-duplication audit (Step 0 GATE, 2026-05-14):
  * ``grep -rn "voice_ratified_handler"`` cross codebase → zero collisions.
  * SlotCacheInvalidator Protocol is comunify-local. If vitalia later adds
    a similar invalidation handler (today vitalia voice cloning is OFF —
    Story 11 cement), lift the Protocol to shared
    ``luana_core_agentic_prompts.cache_invalidation``.

Spec sources:
  * 02-design-agentic.md voice cloning + slot invalidation
  * 03-arch-agentic.md § 8.3 cache invalidation triggers
  * 06-tickets.yaml::T-voice-3 acceptance + decision D8
  * .claude/rules/sales-agent-brand-voice.md (Slot 5 cache prefix SSoT)
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Protocol

import structlog

logger = structlog.get_logger(__name__)


# ─── Protocols ────────────────────────────────────────────────────────────


class SlotCacheInvalidatorProtocol(Protocol):
    """Surface for invalidating per-tenant Slot 5 BRAND_VOICE cache.

    Production wiring: LiteLLM proxy cache key invalidation (Anthropic
    cache_control). Stub-friendly Protocol so unit tests can inject fakes.
    """

    async def invalidate_brand_voice_slot(
        self,
        *,
        tenant_id: uuid.UUID,
        previous_version: int | None,
        new_version: int,
    ) -> None:
        """Invalidate the cache key tied to (tenant_id, previous_version).

        New version is the freshly-persisted ``personality_profile_version``
        — cache key for the next turn includes the new version and will
        rebuild naturally; this call is for proactive cleanup of the old
        key (cost saving — avoids paying for a stale ephemeral block until
        TTL expiry).
        """
        ...


class CacheInvalidationAuditProtocol(Protocol):
    """Surface for community_audit_log entry on cache invalidation."""

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        event_type: str,
        payload: dict[str, Any],
    ) -> None: ...


# ─── Handler ──────────────────────────────────────────────────────────────


@dataclass(frozen=True, slots=True)
class VoiceRatifiedV1Payload:
    """Typed view of the VoiceRatifiedV1 event payload (after JSON unwrap)."""

    tenant_id: uuid.UUID
    source_job_id: uuid.UUID
    personality_profile_version: int
    confidence_score: float
    dialecto: str
    samples_used: int


def parse_voice_ratified_payload(payload: dict[str, Any]) -> VoiceRatifiedV1Payload | None:
    """Defensively parse a VoiceRatifiedV1 payload dict.

    Returns None if payload is malformed (handler logs + skips).
    """
    try:
        return VoiceRatifiedV1Payload(
            tenant_id=uuid.UUID(payload["tenant_id"]),
            source_job_id=uuid.UUID(payload["source_job_id"]),
            personality_profile_version=int(payload["personality_profile_version"]),
            confidence_score=float(payload["confidence_score"]),
            dialecto=str(payload.get("dialecto", "")),
            samples_used=int(payload.get("samples_used", 0)),
        )
    except (KeyError, ValueError, TypeError) as exc:
        logger.warning(
            "voice_ratified_payload_parse_failed",
            error_type=type(exc).__name__,
            error_msg=str(exc)[:200],
        )
        return None


async def handle_voice_ratified(
    *,
    payload: dict[str, Any],
    cache_invalidator: SlotCacheInvalidatorProtocol,
    audit_log: CacheInvalidationAuditProtocol | None = None,
    previous_version: int | None = None,
) -> bool:
    """Handle VoiceRatifiedV1 — invalidate Slot 5 cache + audit log.

    Args:
        payload: JSON-decoded event payload.
        cache_invalidator: Slot 5 cache invalidator wired by infrastructure.
        audit_log: Optional audit log handle for cache_invalidated records.
        previous_version: Optional prior personality_profile_version for
            proactive cleanup of the old cache key. None → no cleanup, only
            new key will be built naturally on next turn.

    Returns:
        True on successful invalidation; False on parse/invalidation failure.

    Per tessl__graceful-degradation: cache invalidator failure → audit logged
    + handler returns False, but does NOT raise. The next turn will build a
    new cache key naturally (worst case: stale Slot 5 served for one turn
    until version-keyed cache rebuilds).
    """
    parsed = parse_voice_ratified_payload(payload)
    if parsed is None:
        return False

    # 1. Cache invalidation (best-effort).
    try:
        await cache_invalidator.invalidate_brand_voice_slot(
            tenant_id=parsed.tenant_id,
            previous_version=previous_version,
            new_version=parsed.personality_profile_version,
        )
        invalidated = True
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "voice_ratified_cache_invalidation_failed",
            tenant_id=str(parsed.tenant_id),
            new_version=parsed.personality_profile_version,
            error_type=type(exc).__name__,
            error_msg=str(exc)[:200],
        )
        invalidated = False

    # 2. Audit log (best-effort).
    if audit_log is not None:
        try:
            await audit_log.log(
                tenant_id=parsed.tenant_id,
                event_type="voice_ratified_cache_invalidated",
                payload={
                    "source_job_id": str(parsed.source_job_id),
                    "previous_version": previous_version,
                    "new_version": parsed.personality_profile_version,
                    "confidence_score": parsed.confidence_score,
                    "dialecto": parsed.dialecto,
                    "samples_used": parsed.samples_used,
                    "invalidation_succeeded": invalidated,
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "voice_ratified_audit_log_failed",
                tenant_id=str(parsed.tenant_id),
                error_type=type(exc).__name__,
            )

    logger.info(
        "voice_ratified_handled",
        tenant_id=str(parsed.tenant_id),
        source_job_id=str(parsed.source_job_id),
        new_version=parsed.personality_profile_version,
        previous_version=previous_version,
        invalidated=invalidated,
    )
    return invalidated


__all__ = [
    "CacheInvalidationAuditProtocol",
    "SlotCacheInvalidatorProtocol",
    "VoiceRatifiedV1Payload",
    "handle_voice_ratified",
    "parse_voice_ratified_payload",
]
