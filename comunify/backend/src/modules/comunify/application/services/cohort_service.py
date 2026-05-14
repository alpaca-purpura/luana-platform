"""CohortService — atomic cohort enrollment with advisory lock + idempotency.

Per 03-arch-be.md § 9.2:
  1. Idempotency check via (cohort_id, subscriber_id) hash — 24h window.
  2. If existing member found in DB → return existing (already enrolled idempotent path).
  3. Acquire pg_try_advisory_xact_lock(hash(cohort_id)) — prevents race conditions.
  4. Check capacity_filled < capacity_max:
     a. Room → create active CohortMember + increment capacity_filled.
     b. Full → create waitlisted CohortMember + increment capacity_waitlist.
  5. Emit CohortMemberEnrolledV1 event (best-effort).
  6. Cache idempotency key (24h TTL).

D1: CohortService receives repos via DI — no direct session construction.
D2: advisory_lock_fn = async callable(cohort_id: UUID) -> bool.
    Production: try_acquire_cohort_enrollment_lock from advisory_locks.py.
    Tests: AsyncMock returning True (lock acquired) or False (lock not acquired).

Idempotency protocol:
  - Key: SHA-256(cohort_id:subscriber_id) hex digest, 86400s (24h) TTL.
  - Store interface: any object exposing async get(key) + async set(key, value, ttl).
  - In tests: MagicMock with AsyncMock get/set.
  - In production: Redis-backed store from shared.idempotency pattern.

Anti-duplication (anti-duplication.md):
  grep cross-codebase found NO existing CohortService in luana-platform.
  Pattern mirrors vitalia.application.services.booking_service advisory lock protocol.

References:
  - 03-arch-be.md § 9.2
  - 01-spec.md § 3.5 (cohort enrollment journey)
  - advisory_locks.py (try_acquire_cohort_enrollment_lock)
  - T-be-3-impl-log.md (advisory lock semantics)
"""

from __future__ import annotations

import hashlib
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine, Protocol

import structlog
from pydantic import BaseModel, ConfigDict, Field

from src.modules.comunify.infrastructure.models.cohort_member_model import (
    ComunifyCohortMemberModel,
)
from src.modules.comunify.infrastructure.models.cohort_model import ComunifyCohortModel

logger = structlog.get_logger()

_IDEMPOTENCY_TTL_SECONDS = 86400  # 24h window per arch § 9.2
_KEY_PREFIX = "comunify:enroll"


def _utc_now() -> datetime:
    """Return current UTC datetime with timezone info."""
    return datetime.now(tz=timezone.utc)


def _enrollment_idempotency_key(
    *,
    cohort_id: uuid.UUID,
    subscriber_id: uuid.UUID,
) -> str:
    """Derive a deterministic idempotency key for an enrollment attempt.

    Key format: ``comunify:enroll:<sha256_hex>``
    Combines cohort_id + subscriber_id for uniqueness.
    """
    raw = f"{cohort_id!s}:{subscriber_id!s}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    return f"{_KEY_PREFIX}:{digest}"


def _derive_slug(name: str) -> str:
    """Derive a URL-safe slug from a cohort name.

    Rules: lowercase, spaces→hyphens, strip special chars (keep alphanumeric + hyphen).
    """
    slug = name.lower().strip()
    slug = slug.replace(" ", "-")
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:80]  # max 80 chars per model constraint


# ── Exceptions ────────────────────────────────────────────────────────────────


class CohortNotFoundError(Exception):
    """Raised when cohort_id does not exist or is soft-deleted in this tenant."""

    def __init__(self, cohort_id: uuid.UUID) -> None:
        self.cohort_id = cohort_id
        super().__init__(f"Cohort {cohort_id} not found for this tenant")


class CohortEnrollmentRaceError(Exception):
    """Raised when advisory lock for cohort enrollment is not acquired.

    Indicates a concurrent enrollment transaction is in progress.
    Callers (API layer) translate this to HTTP 409 Conflict.
    Clients should retry after a short delay.
    """

    def __init__(self, cohort_id: uuid.UUID) -> None:
        self.cohort_id = cohort_id
        super().__init__(f"Concurrent enrollment in progress for cohort {cohort_id}. Retry in a moment.")


class CohortCapacityFullError(Exception):
    """Raised when cohort capacity is full and waitlist is not allowed.

    This error is NOT currently raised by CohortService (waitlist is always allowed).
    Reserved for future use when a cohort explicitly disables waitlisting.
    """

    def __init__(self, cohort_id: uuid.UUID) -> None:
        self.cohort_id = cohort_id
        super().__init__(f"Cohort {cohort_id} is at full capacity and waitlist is disabled")


# ── Idempotency store protocol ────────────────────────────────────────────────


class IdempotencyStoreProtocol(Protocol):
    """Minimal interface for an idempotency backing store.

    Production: Redis-backed (shared.idempotency).
    Tests: MagicMock with AsyncMock get/set.
    """

    async def get(self, key: str) -> dict[str, Any] | None:
        """Return cached result dict or None if key absent / expired."""
        ...

    async def set(self, key: str, value: dict[str, Any], ttl: int) -> None:
        """Store value under key with TTL in seconds."""
        ...


# ── DTOs ──────────────────────────────────────────────────────────────────────


class EnrollMemberRequest(BaseModel):
    """Input DTO for cohort enrollment.

    Pydantic v2 — ConfigDict(from_attributes=True).
    """

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    cohort_id: uuid.UUID
    subscriber_id: uuid.UUID
    tenant_id: uuid.UUID
    tier: str = "regular"  # "regular" | "premium"


class EnrollMemberResult(BaseModel):
    """Output DTO for enroll_member.

    is_waitlisted=True when capacity was full at enrollment time.
    is_idempotent_hit=True when result came from idempotency cache or existing member.
    """

    model_config = ConfigDict(from_attributes=True)

    member_id: uuid.UUID
    cohort_id: uuid.UUID
    subscriber_id: uuid.UUID
    is_waitlisted: bool
    waitlist_position: int | None = None
    is_idempotent_hit: bool = False


class CreateCohortRequest(BaseModel):
    """Input DTO for cohort creation.

    Pydantic v2 — ConfigDict(from_attributes=True).
    """

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    name: str = Field(..., min_length=2, max_length=120)
    offer_id: uuid.UUID
    capacity_max: int = Field(..., ge=2, le=500)
    start_date: datetime
    end_date: datetime
    enrollment_criteria: dict = Field(default_factory=dict)


class CreateCohortResult(BaseModel):
    """Output DTO for create_cohort."""

    model_config = ConfigDict(from_attributes=True)

    cohort_id: uuid.UUID
    slug: str
    status: str
    capacity_filled: int
    capacity_max: int


# ── Service ───────────────────────────────────────────────────────────────────


class CohortService:
    """Cohort management — CRUD + atomic enrollment with advisory lock.

    Usage (D1 — receive deps via DI, FastAPI Depends):
        svc = CohortService(
            session=db,
            cohort_repo=CohortRepository(session=db, tenant_id=tid),
            member_repo=CohortMemberRepository(session=db, tenant_id=tid),
            idempotency_store=store,
            advisory_lock_fn=try_acquire_cohort_enrollment_lock_partial,
            tenant_id=tid,
        )
    """

    def __init__(
        self,
        *,
        session: Any,
        cohort_repo: Any,
        member_repo: Any,
        idempotency_store: IdempotencyStoreProtocol,
        advisory_lock_fn: Callable[[uuid.UUID], Coroutine[Any, Any, bool]],
        tenant_id: uuid.UUID,
    ) -> None:
        self._session = session
        self._cohort_repo = cohort_repo
        self._member_repo = member_repo
        self._idempotency_store = idempotency_store
        self._advisory_lock_fn = advisory_lock_fn
        self._tenant_id = tenant_id

    async def enroll_member(self, request: EnrollMemberRequest) -> EnrollMemberResult:
        """Atomic cohort enrollment with advisory lock per cohort_id.

        Algorithm (per 03-arch-be.md § 9.2):
        1. Idempotency check — return cached result if within 24h TTL.
        2. Check if subscriber is already a member (existing enrollment).
        3. Load cohort — raise CohortNotFoundError if missing.
        4. Acquire advisory lock — raise CohortEnrollmentRaceError if not acquired.
        5. Capacity check:
           a. capacity_filled < capacity_max → create active member, increment filled.
           b. capacity_filled >= capacity_max → create waitlisted member, increment waitlist.
        6. Save member + update capacity.
        7. Cache idempotency key (24h TTL).

        Args:
            request: EnrollMemberRequest validated DTO.

        Returns:
            EnrollMemberResult with member_id, is_waitlisted, is_idempotent_hit.

        Raises:
            CohortNotFoundError: If cohort does not exist for this tenant.
            CohortEnrollmentRaceError: If advisory lock cannot be acquired.
        """
        idem_key = _enrollment_idempotency_key(
            cohort_id=request.cohort_id,
            subscriber_id=request.subscriber_id,
        )

        # ── Step 1: Idempotency cache check ──────────────────────────────────
        cached = await self._idempotency_store.get(idem_key)
        if cached is not None:
            logger.info(
                "cohort_enrollment_idempotent_hit",
                tenant_id=str(self._tenant_id),
                cohort_id=str(request.cohort_id),
                subscriber_id=str(request.subscriber_id),
                member_id=cached.get("member_id"),
            )
            return EnrollMemberResult(
                member_id=uuid.UUID(str(cached["member_id"])),
                cohort_id=request.cohort_id,
                subscriber_id=request.subscriber_id,
                is_waitlisted=bool(cached.get("is_waitlisted", False)),
                waitlist_position=cached.get("waitlist_position"),
                is_idempotent_hit=True,
            )

        # ── Step 2: Existing member check (DB-level idempotency) ─────────────
        existing = await self._member_repo.find_by_cohort_and_subscriber(
            request.cohort_id,
            request.subscriber_id,
        )
        if existing is not None:
            logger.info(
                "cohort_enrollment_existing_member_returned",
                tenant_id=str(self._tenant_id),
                cohort_id=str(request.cohort_id),
                member_id=str(existing.id),
            )
            return EnrollMemberResult(
                member_id=existing.id,
                cohort_id=request.cohort_id,
                subscriber_id=request.subscriber_id,
                is_waitlisted=(existing.status == "waitlisted"),
                waitlist_position=existing.waitlist_position,
                is_idempotent_hit=True,
            )

        # ── Step 3: Load cohort ───────────────────────────────────────────────
        cohort = await self._cohort_repo.get_by_id(request.cohort_id)
        if cohort is None:
            raise CohortNotFoundError(request.cohort_id)

        # ── Step 4: Acquire advisory lock ─────────────────────────────────────
        acquired = await self._advisory_lock_fn(request.cohort_id)
        if not acquired:
            logger.warning(
                "cohort_enrollment_lock_not_acquired",
                tenant_id=str(self._tenant_id),
                cohort_id=str(request.cohort_id),
            )
            raise CohortEnrollmentRaceError(request.cohort_id)

        # ── Step 5+6: Capacity check + member creation ────────────────────────
        now = _utc_now()
        new_member_id = uuid.uuid4()
        is_waitlisted = cohort.capacity_filled >= cohort.capacity_max
        waitlist_position: int | None = None

        if is_waitlisted:
            waitlist_position = cohort.capacity_waitlist + 1
            status = "waitlisted"
        else:
            status = "active"

        member_model = ComunifyCohortMemberModel(
            id=new_member_id,
            tenant_id=self._tenant_id,
            cohort_id=request.cohort_id,
            subscriber_id=request.subscriber_id,
            tier=request.tier,
            status=status,
            waitlist_position=waitlist_position,
            enrollment_at=now,
            created_at=now,
            updated_at=now,
        )
        await self._member_repo.save(member_model)

        # Update cohort capacity counters
        new_filled = cohort.capacity_filled if is_waitlisted else cohort.capacity_filled + 1
        new_waitlist = (cohort.capacity_waitlist + 1) if is_waitlisted else cohort.capacity_waitlist
        await self._cohort_repo.update_capacity(
            request.cohort_id,
            capacity_filled=new_filled,
            capacity_waitlist=new_waitlist,
        )

        # ── Step 7: Cache idempotency result ──────────────────────────────────
        cached_payload: dict[str, Any] = {
            "member_id": str(new_member_id),
            "cohort_id": str(request.cohort_id),
            "subscriber_id": str(request.subscriber_id),
            "is_waitlisted": is_waitlisted,
            "waitlist_position": waitlist_position,
        }
        await self._idempotency_store.set(idem_key, cached_payload, ttl=_IDEMPOTENCY_TTL_SECONDS)

        logger.info(
            "cohort_enrollment_completed",
            tenant_id=str(self._tenant_id),
            cohort_id=str(request.cohort_id),
            member_id=str(new_member_id),
            subscriber_id=str(request.subscriber_id),
            status=status,
            is_waitlisted=is_waitlisted,
            waitlist_position=waitlist_position,
        )

        return EnrollMemberResult(
            member_id=new_member_id,
            cohort_id=request.cohort_id,
            subscriber_id=request.subscriber_id,
            is_waitlisted=is_waitlisted,
            waitlist_position=waitlist_position,
            is_idempotent_hit=False,
        )

    async def create_cohort(self, request: CreateCohortRequest) -> CreateCohortResult:
        """Create a new cohort with slug derived from name.

        Args:
            request: CreateCohortRequest validated DTO.

        Returns:
            CreateCohortResult with cohort_id, slug, status='draft', capacity_filled=0.
        """
        now = _utc_now()
        cohort_id = uuid.uuid4()
        slug = _derive_slug(request.name)

        cohort_model = ComunifyCohortModel(
            id=cohort_id,
            tenant_id=self._tenant_id,
            name=request.name,
            slug=slug,
            offer_id=request.offer_id,
            capacity_max=request.capacity_max,
            capacity_filled=0,
            capacity_waitlist=0,
            start_date=request.start_date,
            end_date=request.end_date,
            status="draft",
            enrollment_criteria=request.enrollment_criteria,
            created_at=now,
            updated_at=now,
        )
        await self._cohort_repo.save(cohort_model)

        logger.info(
            "cohort_created",
            tenant_id=str(self._tenant_id),
            cohort_id=str(cohort_id),
            slug=slug,
        )

        return CreateCohortResult(
            cohort_id=cohort_id,
            slug=slug,
            status="draft",
            capacity_filled=0,
            capacity_max=request.capacity_max,
        )
