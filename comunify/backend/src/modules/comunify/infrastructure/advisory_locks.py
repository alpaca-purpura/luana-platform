"""Postgres advisory locks for comunify cohort enrollment race prevention.

Used by CohortService to prevent over-enrollment when cohort capacity is reached.
Uses pg_try_advisory_xact_lock (transaction-scoped, auto-released on commit/rollback)
to detect concurrent enrollment attempts within the same transaction window.

Pattern mirrors vitalia/backend/src/modules/vitalia/infrastructure/advisory_locks.py
but adapted for cohort enrollment semantics (key derived from cohort_id only — no
slot_iso needed; the entity being locked IS the cohort itself).

Lock key derivation: deterministic integer hash of cohort_id.bytes via hashlib.sha256
→ truncated to signed 64-bit int (Postgres bigint range [-2^63, 2^63-1]).

Usage in CohortService.enroll_member():
    acquired = await try_acquire_cohort_enrollment_lock(session, cohort_id=cohort_id)
    if not acquired:
        # Concurrent enrollment in progress — raise CohortEnrollmentRaceError
        raise CohortEnrollmentRaceError(cohort_id)
    # safe to check capacity + create CohortMember
"""

from __future__ import annotations

import hashlib
import uuid

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


def _cohort_lock_key(*, cohort_id: uuid.UUID) -> int:
    """Derive a deterministic Postgres advisory lock key for cohort_id.

    Returns a signed 64-bit integer within Postgres bigint range [-2^63, 2^63-1].
    Uses SHA-256 of cohort_id.bytes — first 8 bytes give sufficient collision resistance
    across a single tenant's cohort namespace.
    """
    digest = hashlib.sha256(cohort_id.bytes).digest()

    # Take first 8 bytes → unsigned 64-bit int → convert to signed int64
    unsigned = int.from_bytes(digest[:8], byteorder="big")
    signed = unsigned if unsigned < 2**63 else unsigned - 2**64
    return signed


async def try_acquire_cohort_enrollment_lock(
    session: AsyncSession,
    *,
    cohort_id: uuid.UUID,
) -> bool:
    """Non-blocking attempt to acquire a transaction-scoped advisory lock for cohort enrollment.

    Returns True if the lock was acquired (safe to proceed with enrollment).
    Returns False if a concurrent enrollment transaction already holds the lock.

    Lock is transaction-scoped (pg_try_advisory_xact_lock) — automatically released
    on commit or rollback. No explicit release required.

    Call this BEFORE checking cohort capacity to prevent TOCTOU race:
        1. Acquire lock → False? Raise CohortEnrollmentRaceError (fast-fail).
        2. True? Check capacity_filled < capacity_max → enroll or waitlist.
    """
    key = _cohort_lock_key(cohort_id=cohort_id)
    result = await session.execute(
        text("SELECT pg_try_advisory_xact_lock(:key)"),
        {"key": key},
    )
    acquired: bool = result.scalar_one()
    logger.debug(
        "cohort_enrollment_lock_try_acquire",
        cohort_id=str(cohort_id),
        lock_key=key,
        acquired=acquired,
    )
    return acquired
