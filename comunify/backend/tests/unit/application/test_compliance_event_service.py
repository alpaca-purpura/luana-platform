"""Unit tests — ComplianceEventService.

TDD RED phase: written before implementation exists.
Tests drive the contract per 03-arch-be.md § 9.8.

Covers:
  - B1: log_event writes to audit_repo.save() on success
  - B2: best-effort — repo.save() exception NEVER propagates to caller
  - B3: PII sanitized before persist (sanitize_payload called)
  - B4: all required fields populated in audit log model
  - B5: structlog.warning emitted on failure (not silenced)

D1: ComplianceEventService receives audit_repo via DI constructor injection.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.modules.comunify.application.services.compliance_event_service import (
    ComplianceEventService,
)

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_audit_repo() -> MagicMock:
    """Mock CommunityAuditLogRepository."""
    repo = MagicMock()
    repo.save = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def compliance_service(mock_audit_repo: MagicMock) -> ComplianceEventService:
    """ComplianceEventService with mocked audit repo."""
    return ComplianceEventService(audit_repo=mock_audit_repo)


@pytest.fixture
def tenant_id() -> uuid.UUID:
    return uuid.uuid4()


# ─────────────────────────────────────────────────────────────────────────────
# B1 — Successful write
# ─────────────────────────────────────────────────────────────────────────────


async def test_log_event_calls_repo_save(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B1: log_event() calls audit_repo.save() once on success."""
    await compliance_service.log_event(
        event_type="spam_blocked",
        severity="medium",
        payload={"post_id": "abc123", "score": 0.92},
        tenant_id=tenant_id,
    )

    mock_audit_repo.save.assert_called_once()


async def test_log_event_passes_correct_event_type(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B1: saved model has event_type matching the call argument."""
    await compliance_service.log_event(
        event_type="doxxing_blocked",
        severity="high",
        payload={"content": "some text"},
        tenant_id=tenant_id,
    )

    saved_model = mock_audit_repo.save.call_args[0][0]
    assert saved_model.event_type == "doxxing_blocked"
    assert saved_model.severity == "high"
    assert saved_model.tenant_id == tenant_id


# ─────────────────────────────────────────────────────────────────────────────
# B2 — Best-effort (NEVER raises)
# ─────────────────────────────────────────────────────────────────────────────


async def test_log_event_does_not_raise_on_repo_failure(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B2: repo.save() raises RuntimeError → log_event() swallows it, returns None."""
    mock_audit_repo.save = AsyncMock(side_effect=RuntimeError("DB connection lost"))

    # Must NOT raise
    result = await compliance_service.log_event(
        event_type="spam_blocked",
        severity="info",
        payload={"test": "data"},
        tenant_id=tenant_id,
    )

    assert result is None  # best-effort — returns None even on failure


async def test_log_event_does_not_raise_on_any_exception(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B2: any exception in repo (including unexpected) is swallowed."""
    mock_audit_repo.save = AsyncMock(side_effect=Exception("unexpected"))

    # Must NOT raise
    await compliance_service.log_event(
        event_type="nsfw_blocked",
        severity="high",
        payload={},
        tenant_id=tenant_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# B3 — PII sanitization before persist
# ─────────────────────────────────────────────────────────────────────────────


async def test_log_event_sanitizes_payload_before_persist(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B3: payload passed through sanitize_payload before being persisted."""
    raw_payload = {"content": "test@example.com hizo spam", "member_id": "abc"}

    with patch(
        "src.modules.comunify.application.services.compliance_event_service.sanitize_payload",
        return_value={"content": "[REDACTED]@example.com hizo spam", "member_id": "abc"},
    ) as mock_sanitize:
        await compliance_service.log_event(
            event_type="spam_blocked",
            severity="medium",
            payload=raw_payload,
            tenant_id=tenant_id,
        )

        mock_sanitize.assert_called_once_with(raw_payload)


# ─────────────────────────────────────────────────────────────────────────────
# B4 — Optional fields
# ─────────────────────────────────────────────────────────────────────────────


async def test_log_event_accepts_optional_member_id(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B4: log_event() accepts optional member_id, post_id, actor_id, actor_type."""
    member_id = uuid.uuid4()
    post_id = uuid.uuid4()
    actor_id = uuid.uuid4()

    await compliance_service.log_event(
        event_type="post_removed",
        severity="medium",
        payload={"reason": "spam"},
        tenant_id=tenant_id,
        member_id=member_id,
        post_id=post_id,
        actor_id=actor_id,
        actor_type="creator",
    )

    saved_model = mock_audit_repo.save.call_args[0][0]
    assert saved_model.member_id == member_id
    assert saved_model.post_id == post_id
    assert saved_model.actor_id == actor_id
    assert saved_model.actor_type == "creator"


async def test_log_event_none_optionals_persist_as_none(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B4: optional fields default to None when not provided."""
    await compliance_service.log_event(
        event_type="spam_blocked",
        severity="info",
        payload={},
        tenant_id=tenant_id,
    )

    saved_model = mock_audit_repo.save.call_args[0][0]
    assert saved_model.member_id is None
    assert saved_model.post_id is None
    assert saved_model.actor_id is None
    assert saved_model.actor_type is None


# ─────────────────────────────────────────────────────────────────────────────
# B5 — structlog.warning on failure
# ─────────────────────────────────────────────────────────────────────────────


async def test_log_event_emits_structlog_warning_on_failure(
    compliance_service: ComplianceEventService,
    mock_audit_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """B5: structlog.warning emitted when repo.save() fails."""
    mock_audit_repo.save = AsyncMock(side_effect=RuntimeError("disk full"))

    with patch("src.modules.comunify.application.services.compliance_event_service.logger") as mock_logger:
        await compliance_service.log_event(
            event_type="spam_blocked",
            severity="medium",
            payload={},
            tenant_id=tenant_id,
        )

        mock_logger.warning.assert_called_once()
        warning_call_kwargs = mock_logger.warning.call_args
        assert "compliance_event_persist_failed" in str(warning_call_kwargs)
