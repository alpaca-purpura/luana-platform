"""Integration tests — cohort enrollment advisory lock (A2 acceptance criterion).

TDD RED phase: written before advisory_locks.py implementation exists.

A2: Advisory lock prevents cohort enrollment race.
    - Concurrent enrollments for same cohort when cap=1 → only 1 wins.
    - pg_try_advisory_xact_lock is used (transaction-scoped, auto-released on commit/rollback).
    - Lock key derived from cohort_id bytes → deterministic signed 64-bit int.

Tests are skipped when Postgres is unavailable (pytest.mark.integration).
"""

from __future__ import annotations

import uuid

import pytest

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_cohort_lock_key_is_deterministic() -> None:
    """Same cohort_id always produces the same lock key."""
    from src.modules.comunify.infrastructure.advisory_locks import _cohort_lock_key

    cohort_id = uuid.uuid4()

    key1 = _cohort_lock_key(cohort_id=cohort_id)
    key2 = _cohort_lock_key(cohort_id=cohort_id)

    assert key1 == key2, "Lock key must be deterministic for same cohort_id"


@pytest.mark.asyncio
async def test_different_cohorts_get_different_lock_keys() -> None:
    """Different cohort IDs produce different lock keys (collision resistance)."""
    from src.modules.comunify.infrastructure.advisory_locks import _cohort_lock_key

    cohort_a = uuid.uuid4()
    cohort_b = uuid.uuid4()

    key_a = _cohort_lock_key(cohort_id=cohort_a)
    key_b = _cohort_lock_key(cohort_id=cohort_b)

    assert key_a != key_b, "Different cohort IDs must produce different lock keys"


@pytest.mark.asyncio
async def test_lock_key_within_postgres_bigint_range() -> None:
    """Lock key must be a signed 64-bit integer (Postgres bigint range)."""
    from src.modules.comunify.infrastructure.advisory_locks import _cohort_lock_key

    cohort_id = uuid.uuid4()
    key = _cohort_lock_key(cohort_id=cohort_id)

    assert isinstance(key, int), "Lock key must be int"
    assert -(2**63) <= key < 2**63, f"Lock key {key} outside Postgres bigint range"


@pytest.mark.asyncio
async def test_try_acquire_cohort_lock_returns_true_when_free(db_session) -> None:
    """pg_try_advisory_xact_lock returns True when cohort lock is not held."""
    from src.modules.comunify.infrastructure.advisory_locks import try_acquire_cohort_enrollment_lock

    cohort_id = uuid.uuid4()  # unique per test — not held

    acquired = await try_acquire_cohort_enrollment_lock(db_session, cohort_id=cohort_id)

    assert acquired is True, "A2: try_acquire_cohort_enrollment_lock must return True when cohort lock is free"


@pytest.mark.asyncio
async def test_enrollment_race_prevented(db_session) -> None:
    """A2 acceptance: same cohort, same session — second try returns False.

    Since xact locks are held for the transaction duration (auto-released on commit/rollback),
    within the same session/connection the second call on the same key returns False,
    simulating the race condition that would occur in concurrent transactions.
    """
    from src.modules.comunify.infrastructure.advisory_locks import try_acquire_cohort_enrollment_lock

    cohort_id = uuid.uuid4()

    # First acquire succeeds
    acquired_1 = await try_acquire_cohort_enrollment_lock(db_session, cohort_id=cohort_id)
    assert acquired_1 is True, "A2: First lock acquisition must succeed"

    # Second attempt on the same connection for the same lock key must return False
    # (pg_try_advisory_xact_lock is NOT re-entrant — same session, same key → False)
    acquired_2 = await try_acquire_cohort_enrollment_lock(db_session, cohort_id=cohort_id)
    assert acquired_2 is False, (
        "A2 enrollment_race_prevented: second try_advisory_xact_lock on same cohort must return False"
    )
