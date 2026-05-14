"""E2E tests — cohort enrollment journey (V-F-8).

Covers spec § 3.5 cohort enrollment + capacity + waitlist scenarios.

These tests exercise CohortService end-to-end using mocked repos (no real DB required for V-F-8).
The advisory lock function is mocked to simulate lock acquisition/race conditions.

V-F-8 scenarios:
  - E1: happy enrollment (capacity available → status=active)
  - E2: capacity full → waitlisted (status=waitlisted, waitlist_position set)
  - E3: idempotency (same cohort_id + subscriber_id → cached result returned)
  - E4: concurrent enrollment race → CohortEnrollmentRaceError

These tests mirror the spec 3.5.A and 3.5.B scenarios.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.cohort_service import (
    CohortEnrollmentRaceError,
    CohortNotFoundError,
    CohortService,
    EnrollMemberRequest,
    EnrollMemberResult,
)


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _make_cohort_mock(
    *,
    cohort_id: uuid.UUID,
    tenant_id: uuid.UUID,
    capacity_max: int = 10,
    capacity_filled: int = 0,
    capacity_waitlist: int = 0,
) -> MagicMock:
    model = MagicMock()
    model.id = cohort_id
    model.tenant_id = tenant_id
    model.capacity_max = capacity_max
    model.capacity_filled = capacity_filled
    model.capacity_waitlist = capacity_waitlist
    model.status = "active"
    model.name = "Cohorte E2E Test"
    model.slug = "cohorte-e2e-test"
    model.offer_id = uuid.uuid4()
    model.start_date = _utc_now()
    model.end_date = _utc_now()
    model.enrollment_criteria = {}
    model.created_at = _utc_now()
    model.updated_at = _utc_now()
    model.deleted_at = None
    return model


def _build_service(
    *,
    tenant_id: uuid.UUID,
    cohort_model: MagicMock | None = None,
    existing_member: MagicMock | None = None,
    idempotency_hit: dict | None = None,
    lock_acquired: bool = True,
) -> CohortService:
    """Build CohortService with configurable mocks for E2E scenarios."""
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()

    cohort_repo = MagicMock()
    cohort_repo.get_by_id = AsyncMock(return_value=cohort_model)
    cohort_repo.save = AsyncMock()
    cohort_repo.update_capacity = AsyncMock(return_value=True)

    member_repo = MagicMock()
    member_repo.find_by_cohort_and_subscriber = AsyncMock(return_value=existing_member)
    member_repo.save = AsyncMock()
    member_repo.list_by_cohort = AsyncMock(return_value=[])

    idempotency_store = MagicMock()
    idempotency_store.get = AsyncMock(return_value=idempotency_hit)
    idempotency_store.set = AsyncMock()

    advisory_lock_fn = AsyncMock(return_value=lock_acquired)

    return CohortService(
        session=session,
        cohort_repo=cohort_repo,
        member_repo=member_repo,
        idempotency_store=idempotency_store,
        advisory_lock_fn=advisory_lock_fn,
        tenant_id=tenant_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# E1 — Happy enrollment (spec § 3.5.A)
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_enrollment_happy_path() -> None:
    """E1: spec § 3.5.A — creator views roster + enrolls new subscriber.

    Creator Anabella adds subscriber to Cohorte Q2. Capacity 15/15 → not full.
    Result: active membership, no waitlist.
    """
    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()

    cohort = _make_cohort_mock(
        cohort_id=cohort_id,
        tenant_id=tenant_id,
        capacity_max=15,
        capacity_filled=12,
    )
    service = _build_service(tenant_id=tenant_id, cohort_model=cohort)

    request = EnrollMemberRequest(
        cohort_id=cohort_id,
        subscriber_id=subscriber_id,
        tenant_id=tenant_id,
    )
    result = await service.enroll_member(request)

    assert isinstance(result, EnrollMemberResult)
    assert result.is_waitlisted is False
    assert result.waitlist_position is None
    assert result.is_idempotent_hit is False
    assert result.member_id is not None


# ─────────────────────────────────────────────────────────────────────────────
# E2 — Capacity full → waitlisted (spec § 3.5.A roster + waitlist scenario)
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_enrollment_waitlist_when_capacity_full() -> None:
    """E2: cohort at full capacity → subscriber goes to waitlist.

    Capacity 15/15 filled. Next subscriber → waitlisted at position 1.
    """
    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()

    cohort = _make_cohort_mock(
        cohort_id=cohort_id,
        tenant_id=tenant_id,
        capacity_max=15,
        capacity_filled=15,  # FULL
        capacity_waitlist=0,
    )
    service = _build_service(tenant_id=tenant_id, cohort_model=cohort)

    request = EnrollMemberRequest(
        cohort_id=cohort_id,
        subscriber_id=subscriber_id,
        tenant_id=tenant_id,
    )
    result = await service.enroll_member(request)

    assert result.is_waitlisted is True
    assert result.waitlist_position == 1  # first on waitlist


# ─────────────────────────────────────────────────────────────────────────────
# E3 — Idempotency (same subscriber, same cohort → cached hit)
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_enrollment_idempotent_repeat() -> None:
    """E3: same (cohort_id, subscriber_id) within 24h window → cached result.

    No double enrollment — idempotency store returns cached member_id.
    """
    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    existing_member_id = uuid.uuid4()

    idempotency_hit = {
        "member_id": str(existing_member_id),
        "cohort_id": str(cohort_id),
        "subscriber_id": str(subscriber_id),
        "is_waitlisted": False,
        "waitlist_position": None,
    }
    # Cohort model not needed — hits cache before DB
    service = _build_service(
        tenant_id=tenant_id,
        cohort_model=None,
        idempotency_hit=idempotency_hit,
    )

    request = EnrollMemberRequest(
        cohort_id=cohort_id,
        subscriber_id=subscriber_id,
        tenant_id=tenant_id,
    )
    result = await service.enroll_member(request)

    assert result.is_idempotent_hit is True
    assert result.member_id == existing_member_id


# ─────────────────────────────────────────────────────────────────────────────
# E4 — Concurrent enrollment race (advisory lock prevents double enrollment)
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_enrollment_race_raises_error() -> None:
    """E4: concurrent enrollment same cohort → lock not acquired → CohortEnrollmentRaceError.

    Simulates two concurrent requests for the same cohort at capacity=1.
    First wins (lock=True), second fails (lock=False).
    """
    tenant_id = uuid.uuid4()
    cohort_id = uuid.uuid4()

    cohort = _make_cohort_mock(
        cohort_id=cohort_id,
        tenant_id=tenant_id,
        capacity_max=1,
        capacity_filled=0,
    )

    # Second concurrent request — lock not acquired
    service = _build_service(
        tenant_id=tenant_id,
        cohort_model=cohort,
        lock_acquired=False,
    )

    request = EnrollMemberRequest(
        cohort_id=cohort_id,
        subscriber_id=uuid.uuid4(),
        tenant_id=tenant_id,
    )
    with pytest.raises(CohortEnrollmentRaceError):
        await service.enroll_member(request)


# ─────────────────────────────────────────────────────────────────────────────
# E5 — Cohort not found
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_enrollment_cohort_not_found() -> None:
    """E5: cohort_id not found in tenant → CohortNotFoundError."""
    tenant_id = uuid.uuid4()

    service = _build_service(
        tenant_id=tenant_id,
        cohort_model=None,  # not found
    )

    request = EnrollMemberRequest(
        cohort_id=uuid.uuid4(),
        subscriber_id=uuid.uuid4(),
        tenant_id=tenant_id,
    )
    with pytest.raises(CohortNotFoundError):
        await service.enroll_member(request)
