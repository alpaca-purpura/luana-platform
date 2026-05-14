"""Unit tests — CohortService.

TDD RED phase: written before implementation exists.
Tests drive the contract per 03-arch-be.md § 9.2.

Covers:
  - A1: enroll_member happy path (capacity available → active member created)
  - A2: enroll_member capacity full → waitlisted (status='waitlisted', waitlist_position set)
  - A3: enroll_member idempotency (same cohort_id + subscriber_id within 24h → cached hit)
  - A4: enroll_member advisory lock race → CohortEnrollmentRaceError raised
  - A5: create_cohort happy path (slug derived from name)
  - A6: get_cohort_detail returns cohort with roster summary
  - A7: send_broadcast delegates to CohortBroadcastService (covered in separate test file)

D1: CohortService receives repos via DI constructor injection.
D2: pg_try_advisory_xact_lock via advisory_locks module (mocked in unit tests).
D3: Idempotency store protocol (async get/set) — mocked in unit tests.
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
    CreateCohortRequest,
    EnrollMemberRequest,
    EnrollMemberResult,
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _make_cohort_model(
    *,
    cohort_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    capacity_max: int = 10,
    capacity_filled: int = 0,
    capacity_waitlist: int = 0,
    status: str = "active",
) -> MagicMock:
    """Build a minimal mock ComunifyCohortModel."""
    model = MagicMock()
    model.id = cohort_id or uuid.uuid4()
    model.tenant_id = tenant_id or uuid.uuid4()
    model.capacity_max = capacity_max
    model.capacity_filled = capacity_filled
    model.capacity_waitlist = capacity_waitlist
    model.status = status
    model.name = "Cohorte Q2 2026"
    model.slug = "cohorte-q2-2026"
    model.offer_id = uuid.uuid4()
    model.start_date = _utc_now()
    model.end_date = _utc_now()
    model.enrollment_criteria = {}
    model.created_at = _utc_now()
    model.updated_at = _utc_now()
    model.deleted_at = None
    return model


def _make_member_model(
    *,
    member_id: uuid.UUID | None = None,
    cohort_id: uuid.UUID | None = None,
    subscriber_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID | None = None,
    status: str = "active",
    waitlist_position: int | None = None,
) -> MagicMock:
    """Build a minimal mock ComunifyCohortMemberModel."""
    model = MagicMock()
    model.id = member_id or uuid.uuid4()
    model.cohort_id = cohort_id or uuid.uuid4()
    model.subscriber_id = subscriber_id or uuid.uuid4()
    model.tenant_id = tenant_id or uuid.uuid4()
    model.status = status
    model.waitlist_position = waitlist_position
    model.tier = "regular"
    model.engagement_score = 50
    model.enrollment_at = _utc_now()
    model.created_at = _utc_now()
    model.updated_at = _utc_now()
    model.deleted_at = None
    return model


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def tenant_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def mock_cohort_repo() -> MagicMock:
    """Mock CohortRepository."""
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=None)
    repo.save = AsyncMock(return_value=None)
    repo.update_capacity = AsyncMock(return_value=True)
    repo.list_by_tenant = AsyncMock(return_value=[])
    return repo


@pytest.fixture
def mock_member_repo() -> MagicMock:
    """Mock CohortMemberRepository."""
    repo = MagicMock()
    repo.find_by_cohort_and_subscriber = AsyncMock(return_value=None)
    repo.save = AsyncMock(return_value=None)
    repo.list_by_cohort = AsyncMock(return_value=[])
    repo.count_active_by_cohort = AsyncMock(return_value=0)
    return repo


@pytest.fixture
def mock_idempotency_store() -> MagicMock:
    """Mock idempotency store — default cache miss."""
    store = MagicMock()
    store.get = AsyncMock(return_value=None)
    store.set = AsyncMock(return_value=None)
    return store


@pytest.fixture
def mock_advisory_lock_fn() -> AsyncMock:
    """Mock advisory lock function — default returns True (lock acquired)."""
    return AsyncMock(return_value=True)


@pytest.fixture
def mock_session() -> MagicMock:
    """Mock AsyncSession."""
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def cohort_service(
    tenant_id: uuid.UUID,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_idempotency_store: MagicMock,
    mock_advisory_lock_fn: AsyncMock,
    mock_session: MagicMock,
) -> CohortService:
    """CohortService with all dependencies mocked."""
    return CohortService(
        session=mock_session,
        cohort_repo=mock_cohort_repo,
        member_repo=mock_member_repo,
        idempotency_store=mock_idempotency_store,
        advisory_lock_fn=mock_advisory_lock_fn,
        tenant_id=tenant_id,
    )


@pytest.fixture
def valid_enroll_request(tenant_id: uuid.UUID) -> EnrollMemberRequest:
    """Valid enrollment request fixture."""
    return EnrollMemberRequest(
        cohort_id=uuid.uuid4(),
        subscriber_id=uuid.uuid4(),
        tenant_id=tenant_id,
    )


@pytest.fixture
def valid_create_request(tenant_id: uuid.UUID) -> CreateCohortRequest:
    """Valid create cohort request fixture."""
    return CreateCohortRequest(
        name="Cohorte Business Q2 2026",
        offer_id=uuid.uuid4(),
        capacity_max=15,
        start_date=_utc_now(),
        end_date=_utc_now(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# A1 — Happy enrollment (capacity available)
# ─────────────────────────────────────────────────────────────────────────────


async def test_enroll_member_happy_path(
    cohort_service: CohortService,
    valid_enroll_request: EnrollMemberRequest,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_advisory_lock_fn: AsyncMock,
    tenant_id: uuid.UUID,
) -> None:
    """A1: capacity available → member created with status='active', waitlist_position=None."""
    cohort = _make_cohort_model(
        cohort_id=valid_enroll_request.cohort_id,
        tenant_id=tenant_id,
        capacity_max=10,
        capacity_filled=5,
    )
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.find_by_cohort_and_subscriber = AsyncMock(return_value=None)

    result = await cohort_service.enroll_member(valid_enroll_request)

    assert isinstance(result, EnrollMemberResult)
    assert result.is_waitlisted is False
    assert result.waitlist_position is None
    assert result.is_idempotent_hit is False
    # Verify advisory lock was acquired
    mock_advisory_lock_fn.assert_awaited_once()
    # Verify member was saved
    mock_member_repo.save.assert_awaited_once()
    # Verify cohort capacity updated
    mock_cohort_repo.update_capacity.assert_awaited_once()


# ─────────────────────────────────────────────────────────────────────────────
# A2 — Capacity full → waitlisted
# ─────────────────────────────────────────────────────────────────────────────


async def test_enroll_member_capacity_full_creates_waitlist_entry(
    cohort_service: CohortService,
    valid_enroll_request: EnrollMemberRequest,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """A2: cohort capacity_filled == capacity_max → waitlisted entry (status='waitlisted')."""
    cohort = _make_cohort_model(
        cohort_id=valid_enroll_request.cohort_id,
        tenant_id=tenant_id,
        capacity_max=10,
        capacity_filled=10,  # FULL
        capacity_waitlist=3,
    )
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.find_by_cohort_and_subscriber = AsyncMock(return_value=None)

    result = await cohort_service.enroll_member(valid_enroll_request)

    assert result.is_waitlisted is True
    assert result.waitlist_position == 4  # 4th on waitlist (existing 3 + 1)
    assert result.is_idempotent_hit is False
    # Member saved with waitlisted status
    mock_member_repo.save.assert_awaited_once()
    # waitlist counter incremented
    mock_cohort_repo.update_capacity.assert_awaited_once()


# ─────────────────────────────────────────────────────────────────────────────
# A3 — Idempotency (same cohort_id + subscriber_id within 24h)
# ─────────────────────────────────────────────────────────────────────────────


async def test_enroll_member_idempotency_cache_hit(
    cohort_service: CohortService,
    valid_enroll_request: EnrollMemberRequest,
    mock_idempotency_store: MagicMock,
    mock_advisory_lock_fn: AsyncMock,
    mock_member_repo: MagicMock,
) -> None:
    """A3: same (cohort_id, subscriber_id) within 24h → cached result returned, no DB write."""
    member_id = uuid.uuid4()
    mock_idempotency_store.get = AsyncMock(
        return_value={
            "member_id": str(member_id),
            "cohort_id": str(valid_enroll_request.cohort_id),
            "subscriber_id": str(valid_enroll_request.subscriber_id),
            "is_waitlisted": False,
            "waitlist_position": None,
        }
    )

    result = await cohort_service.enroll_member(valid_enroll_request)

    assert result.is_idempotent_hit is True
    assert result.member_id == member_id
    # No advisory lock acquired on idempotent hit
    mock_advisory_lock_fn.assert_not_awaited()
    # No DB write
    mock_member_repo.save.assert_not_awaited()


# ─────────────────────────────────────────────────────────────────────────────
# A4 — Advisory lock race → CohortEnrollmentRaceError
# ─────────────────────────────────────────────────────────────────────────────


async def test_enroll_member_race_raises_error(
    tenant_id: uuid.UUID,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    mock_idempotency_store: MagicMock,
    mock_session: MagicMock,
    valid_enroll_request: EnrollMemberRequest,
) -> None:
    """A4: advisory lock returns False → CohortEnrollmentRaceError raised."""
    cohort = _make_cohort_model(
        cohort_id=valid_enroll_request.cohort_id,
        tenant_id=tenant_id,
    )
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)

    # Lock NOT acquired
    lock_fn_fails = AsyncMock(return_value=False)
    service = CohortService(
        session=mock_session,
        cohort_repo=mock_cohort_repo,
        member_repo=mock_member_repo,
        idempotency_store=mock_idempotency_store,
        advisory_lock_fn=lock_fn_fails,
        tenant_id=tenant_id,
    )

    with pytest.raises(CohortEnrollmentRaceError) as exc_info:
        await service.enroll_member(valid_enroll_request)

    assert str(valid_enroll_request.cohort_id) in str(exc_info.value)
    # No DB write on race
    mock_member_repo.save.assert_not_awaited()


# ─────────────────────────────────────────────────────────────────────────────
# A5 — Cohort not found → CohortNotFoundError
# ─────────────────────────────────────────────────────────────────────────────


async def test_enroll_member_cohort_not_found(
    cohort_service: CohortService,
    valid_enroll_request: EnrollMemberRequest,
    mock_cohort_repo: MagicMock,
) -> None:
    """A5: cohort does not exist or is deleted → CohortNotFoundError raised."""
    mock_cohort_repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(CohortNotFoundError) as exc_info:
        await cohort_service.enroll_member(valid_enroll_request)

    assert str(valid_enroll_request.cohort_id) in str(exc_info.value)


# ─────────────────────────────────────────────────────────────────────────────
# A6 — Already enrolled → idempotent return existing member
# ─────────────────────────────────────────────────────────────────────────────


async def test_enroll_member_already_enrolled_returns_existing(
    cohort_service: CohortService,
    valid_enroll_request: EnrollMemberRequest,
    mock_cohort_repo: MagicMock,
    mock_member_repo: MagicMock,
    tenant_id: uuid.UUID,
) -> None:
    """A6: subscriber already active in cohort → return existing member without duplicating."""
    cohort = _make_cohort_model(
        cohort_id=valid_enroll_request.cohort_id,
        tenant_id=tenant_id,
        capacity_max=10,
        capacity_filled=5,
    )
    existing_member = _make_member_model(
        cohort_id=valid_enroll_request.cohort_id,
        subscriber_id=valid_enroll_request.subscriber_id,
        tenant_id=tenant_id,
        status="active",
    )
    mock_cohort_repo.get_by_id = AsyncMock(return_value=cohort)
    mock_member_repo.find_by_cohort_and_subscriber = AsyncMock(return_value=existing_member)

    result = await cohort_service.enroll_member(valid_enroll_request)

    # Already enrolled — return existing without re-saving
    assert result.member_id == existing_member.id
    assert result.is_idempotent_hit is True
    mock_member_repo.save.assert_not_awaited()


# ─────────────────────────────────────────────────────────────────────────────
# A7 — Create cohort slug derivation
# ─────────────────────────────────────────────────────────────────────────────


async def test_create_cohort_derives_slug_from_name(
    cohort_service: CohortService,
    valid_create_request: CreateCohortRequest,
) -> None:
    """A7: create_cohort derives slug from name (lower, spaces→hyphens, special chars stripped)."""
    result = await cohort_service.create_cohort(valid_create_request)

    assert result.slug is not None
    assert " " not in result.slug
    assert result.slug == result.slug.lower()


async def test_create_cohort_sets_initial_status_draft(
    cohort_service: CohortService,
    valid_create_request: CreateCohortRequest,
) -> None:
    """A7: newly created cohort has status='draft'."""
    result = await cohort_service.create_cohort(valid_create_request)

    assert result.status == "draft"
    assert result.capacity_filled == 0
