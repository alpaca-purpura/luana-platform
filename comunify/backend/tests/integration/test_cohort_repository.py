"""Integration tests — CohortRepository (A1 cross-tenant isolation).

TDD RED phase: written before CohortRepository implementation exists.

A1: Cross-tenant query test — repo(tenant_A) cannot read tenant_B rows.

Tests are skipped when Postgres is unavailable (pytest.mark.integration).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

import pytest

pytestmark = pytest.mark.integration


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


@pytest.mark.asyncio
async def test_cohort_repo_cross_tenant_isolation(db_session) -> None:
    """A1: CohortRepository(tenant_A) cannot read rows created for tenant_B."""
    from src.modules.comunify.infrastructure.models.cohort_model import ComunifyCohortModel
    from src.modules.comunify.infrastructure.repositories.cohort_repository import CohortRepository

    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()

    # Insert a cohort for tenant_b directly (bypass repo to set tenant_id)
    cohort_b = ComunifyCohortModel(
        tenant_id=tenant_b,
        name="Cohort B",
        slug="cohort-b",
        offer_id=uuid.uuid4(),
        capacity_max=10,
        capacity_filled=0,
        capacity_waitlist=0,
        start_date=date(2026, 9, 1),
        end_date=date(2026, 10, 1),
        status="draft",
        enrollment_criteria={},
        created_at=_utc_now(),
        updated_at=_utc_now(),
    )
    db_session.add(cohort_b)
    await db_session.flush()

    # Repo scoped to tenant_a must NOT see tenant_b's cohort
    repo_a = CohortRepository(session=db_session, tenant_id=tenant_a)
    result = await repo_a.get_by_id(cohort_b.id)

    assert result is None, "A1: CohortRepository(tenant_A) must not return tenant_B cohort"


@pytest.mark.asyncio
async def test_cohort_repo_save_and_get_by_id(db_session) -> None:
    """CohortRepository can save and retrieve a cohort for the same tenant."""
    from src.modules.comunify.infrastructure.models.cohort_model import ComunifyCohortModel
    from src.modules.comunify.infrastructure.repositories.cohort_repository import CohortRepository

    tenant_id = uuid.uuid4()

    cohort = ComunifyCohortModel(
        tenant_id=tenant_id,
        name="My Cohort",
        slug="my-cohort",
        offer_id=uuid.uuid4(),
        capacity_max=20,
        capacity_filled=0,
        capacity_waitlist=0,
        start_date=date(2026, 9, 1),
        end_date=date(2026, 10, 1),
        status="draft",
        enrollment_criteria={},
        created_at=_utc_now(),
        updated_at=_utc_now(),
    )
    db_session.add(cohort)
    await db_session.flush()

    repo = CohortRepository(session=db_session, tenant_id=tenant_id)
    retrieved = await repo.get_by_id(cohort.id)

    assert retrieved is not None, "Should find own cohort"
    assert retrieved.id == cohort.id
    assert retrieved.tenant_id == tenant_id


@pytest.mark.asyncio
async def test_cohort_repo_soft_deleted_not_returned(db_session) -> None:
    """Soft-deleted cohorts are excluded from get_by_id."""
    from src.modules.comunify.infrastructure.models.cohort_model import ComunifyCohortModel
    from src.modules.comunify.infrastructure.repositories.cohort_repository import CohortRepository

    tenant_id = uuid.uuid4()
    now = _utc_now()

    cohort = ComunifyCohortModel(
        tenant_id=tenant_id,
        name="Deleted Cohort",
        slug="deleted-cohort",
        offer_id=uuid.uuid4(),
        capacity_max=5,
        capacity_filled=0,
        capacity_waitlist=0,
        start_date=date(2026, 9, 1),
        end_date=date(2026, 10, 1),
        status="archived",
        enrollment_criteria={},
        created_at=now,
        updated_at=now,
        deleted_at=now,  # soft-deleted
    )
    db_session.add(cohort)
    await db_session.flush()

    repo = CohortRepository(session=db_session, tenant_id=tenant_id)
    result = await repo.get_by_id(cohort.id)

    assert result is None, "Soft-deleted cohort must not be returned by get_by_id"


@pytest.mark.asyncio
async def test_cohort_repo_list_by_tenant(db_session) -> None:
    """list_by_tenant returns only active cohorts for the given tenant."""
    from src.modules.comunify.infrastructure.models.cohort_model import ComunifyCohortModel
    from src.modules.comunify.infrastructure.repositories.cohort_repository import CohortRepository

    tenant_id = uuid.uuid4()
    other_tenant = uuid.uuid4()
    now = _utc_now()

    # Own cohort
    cohort_own = ComunifyCohortModel(
        tenant_id=tenant_id,
        name="Own Cohort",
        slug="own-cohort",
        offer_id=uuid.uuid4(),
        capacity_max=10,
        capacity_filled=0,
        capacity_waitlist=0,
        start_date=date(2026, 9, 1),
        end_date=date(2026, 10, 1),
        status="enrollment_open",
        enrollment_criteria={},
        created_at=now,
        updated_at=now,
    )
    # Other tenant cohort (must not appear)
    cohort_other = ComunifyCohortModel(
        tenant_id=other_tenant,
        name="Other Cohort",
        slug="other-cohort",
        offer_id=uuid.uuid4(),
        capacity_max=10,
        capacity_filled=0,
        capacity_waitlist=0,
        start_date=date(2026, 9, 1),
        end_date=date(2026, 10, 1),
        status="enrollment_open",
        enrollment_criteria={},
        created_at=now,
        updated_at=now,
    )
    db_session.add(cohort_own)
    db_session.add(cohort_other)
    await db_session.flush()

    repo = CohortRepository(session=db_session, tenant_id=tenant_id)
    results = await repo.list_by_tenant()

    ids_returned = {r.id for r in results}
    assert cohort_own.id in ids_returned, "Own cohort must appear"
    assert cohort_other.id not in ids_returned, "A1: Other tenant cohort must NOT appear"
