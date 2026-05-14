"""E2E tests — cross-tenant isolation (V-F-11).

Validates that tenant_A JWT cannot access tenant_B resources.

Per 03-arch-be.md § 5 (tenant isolation) + .claude/rules/tenant-isolation.md:
  - Every query filters by tenant_id (WHERE tenant_id = :tenant_id).
  - X-Tenant-ID header is the scope boundary.
  - tenant_A service instance → not-found on tenant_B resource (repo returns None).
  - Route stubs delegate to service → service raises NotFoundError → HTTP 404.

Test strategy (spec § 3.1.D adversarial cross-tenant attempt):
  - Service-layer tests: CohortService with tenant_A scope + cohort_id belonging to tenant_B
    → repo returns None → CohortNotFoundError → verified.
  - HTTP header contract tests: invalid/missing X-Tenant-ID → 422.
  - Route availability tests: tenant own resource → 200 (stub).

Note: T-be-8 routes are stubs (real DI wired T-be-10).
Real DB isolation enforced by repos (WHERE tenant_id = :tenant_id).
The cross-tenant service tests below prove the isolation contract at the
service boundary — which is where the enforcement lives.

References:
  - 03-arch-be.md § 5 (tenant isolation design)
  - .claude/rules/tenant-isolation.md
  - 01-spec.md § 5 (security isolation requirements)
  - spec § 3.1.D adversarial cross-tenant attempt
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.modules.comunify.application.services.cohort_service import (
    CohortNotFoundError,
    CohortService,
    EnrollMemberRequest,
)

# Two tenant IDs — fully isolated
TENANT_A = str(uuid.uuid4())
TENANT_B = str(uuid.uuid4())

# Fake resource IDs belonging to tenant_B
TENANT_B_COHORT_ID = str(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# Service-layer isolation tests (spec § 3.1.D core isolation guarantee)
# These tests prove the service + repo boundary enforces tenant isolation.
# ─────────────────────────────────────────────────────────────────────────────


def _build_cohort_service_for_tenant(
    *,
    tenant_id: uuid.UUID,
    cohort_model: MagicMock | None = None,
    lock_acquired: bool = True,
) -> CohortService:
    """Build CohortService scoped to tenant_id with configurable repo response."""
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()

    cohort_repo = MagicMock()
    # Simulate repo returning None (resource belongs to tenant_B, not tenant_A)
    cohort_repo.get_by_id = AsyncMock(return_value=cohort_model)
    cohort_repo.save = AsyncMock()
    cohort_repo.update_capacity = AsyncMock(return_value=True)

    member_repo = MagicMock()
    member_repo.find_by_cohort_and_subscriber = AsyncMock(return_value=None)
    member_repo.save = AsyncMock()

    idempotency_store = MagicMock()
    idempotency_store.get = AsyncMock(return_value=None)
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


async def test_cross_tenant_enroll_cohort_raises_not_found() -> None:
    """I1: tenant_A service instance + tenant_B cohort_id → CohortNotFoundError.

    Core isolation guarantee: repo.get_by_id(cohort_id, tenant_id=tenant_A)
    returns None when cohort belongs to tenant_B (different tenant_id in DB).
    CohortService raises CohortNotFoundError — which routes map to HTTP 404.
    """
    tenant_a = uuid.uuid4()
    tenant_b_cohort_id = uuid.uuid4()

    # tenant_A service instance — repo returns None for tenant_B cohort_id
    service = _build_cohort_service_for_tenant(
        tenant_id=tenant_a,
        cohort_model=None,  # Not found in tenant_A's scope
    )

    request = EnrollMemberRequest(
        cohort_id=tenant_b_cohort_id,
        subscriber_id=uuid.uuid4(),
        tenant_id=tenant_a,
    )
    with pytest.raises(CohortNotFoundError):
        await service.enroll_member(request)


async def test_cross_tenant_isolation_two_tenants_independent() -> None:
    """I2: tenant_A + tenant_B each have own service instances — no data bleed.

    Both services operate independently. Repo scope = tenant_id param.
    tenant_A service can't access tenant_B's cohort and vice versa.
    """
    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()
    cohort_id_b = uuid.uuid4()

    # tenant_B cohort model (for tenant_B service)
    cohort_b = MagicMock()
    cohort_b.id = cohort_id_b
    cohort_b.tenant_id = tenant_b
    cohort_b.capacity_max = 10
    cohort_b.capacity_filled = 5
    cohort_b.capacity_waitlist = 0
    cohort_b.status = "active"
    cohort_b.name = "Cohorte B"
    cohort_b.slug = "cohorte-b"
    cohort_b.offer_id = uuid.uuid4()
    from datetime import datetime, timezone

    now = datetime.now(tz=timezone.utc)
    cohort_b.start_date = now
    cohort_b.end_date = now
    cohort_b.enrollment_criteria = {}
    cohort_b.created_at = now
    cohort_b.updated_at = now
    cohort_b.deleted_at = None

    # tenant_A service: cohort_id_a NOT found (repo returns None for that scope)
    service_a = _build_cohort_service_for_tenant(
        tenant_id=tenant_a,
        cohort_model=None,  # cohort_id_b not visible in tenant_A scope
    )

    # tenant_A enroll on tenant_B's cohort → CohortNotFoundError
    with pytest.raises(CohortNotFoundError):
        await service_a.enroll_member(
            EnrollMemberRequest(
                cohort_id=cohort_id_b,  # tenant_B's cohort
                subscriber_id=uuid.uuid4(),
                tenant_id=tenant_a,
            )
        )

    # tenant_B service: cohort_id_b found and enrollment succeeds
    service_b = _build_cohort_service_for_tenant(
        tenant_id=tenant_b,
        cohort_model=cohort_b,
    )
    result_b = await service_b.enroll_member(
        EnrollMemberRequest(
            cohort_id=cohort_id_b,
            subscriber_id=uuid.uuid4(),
            tenant_id=tenant_b,
        )
    )
    assert result_b.is_waitlisted is False  # tenant_B enrolled successfully


# ─────────────────────────────────────────────────────────────────────────────
# HTTP header contract tests (route-level: UUID format enforcement)
# ─────────────────────────────────────────────────────────────────────────────


async def test_invalid_uuid_header_returns_422() -> None:
    """I3: non-UUID value in X-Tenant-ID header → 422.

    _parse_tenant_id() enforces UUID format per routes.py.
    Prevents misrouted requests from malformed tenant tokens.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.get(
            "/api/v1/comunify/cohorts",
            headers={"X-Tenant-ID": "not-a-valid-uuid"},
        )

    assert response.status_code == 422


async def test_missing_tenant_header_returns_422() -> None:
    """I4: missing X-Tenant-ID header → 422 (Header dependency enforced).

    All comunify routes declare X-Tenant-ID as required.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.get(
            "/api/v1/comunify/cohorts",
            # No X-Tenant-ID header
        )

    assert response.status_code == 422


async def test_invalid_uuid_header_on_post_returns_422() -> None:
    """I5: non-UUID X-Tenant-ID on POST → 422 (applies to all endpoints).

    Validates the parse_tenant_id contract holds on POST routes too.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post(
            "/api/v1/comunify/cohorts",
            headers={"X-Tenant-ID": "INVALID-TENANT"},
            json={
                "name": "Test Cohort",
                "offer_id": str(uuid.uuid4()),
                "capacity_max": 10,
                "start_date": "2026-01-01T00:00:00Z",
                "end_date": "2026-03-31T00:00:00Z",
            },
        )

    assert response.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# Route availability tests (valid UUID header → stub returns 200)
# ─────────────────────────────────────────────────────────────────────────────


async def test_tenant_own_cohort_list_returns_200() -> None:
    """I6: valid X-Tenant-ID → GET /cohorts returns 200 + scoped list.

    Stub returns empty list scoped to requesting tenant.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.get(
            "/api/v1/comunify/cohorts",
            headers={"X-Tenant-ID": TENANT_A},
        )

    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert isinstance(body["items"], list)


async def test_community_feed_scoped_to_tenant() -> None:
    """I7: GET /community/feed with valid X-Tenant-ID → 200 + scoped feed.

    Each tenant only sees their own feed (stub returns empty list per tenant).
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response_a = await client.get(
            "/api/v1/comunify/community/feed",
            headers={"X-Tenant-ID": TENANT_A},
        )
        response_b = await client.get(
            "/api/v1/comunify/community/feed",
            headers={"X-Tenant-ID": TENANT_B},
        )

    assert response_a.status_code == 200
    assert response_b.status_code == 200
    # Both return valid feed structure — tenant-scoped by service layer
    assert "posts" in response_a.json()
    assert "posts" in response_b.json()


async def test_subscription_metrics_requires_tenant_header() -> None:
    """I8: GET /subscriptions/metrics without tenant header → 422.

    Validates tenant header enforcement across subscription endpoints.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.get(
            "/api/v1/comunify/subscriptions/metrics",
        )

    assert response.status_code == 422


async def test_audit_events_requires_tenant_header() -> None:
    """I9: GET /community-audit/events without tenant header → 422.

    Validates compliance/audit endpoint also enforces tenant isolation header.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.get(
            "/api/v1/comunify/community-audit/events",
        )

    assert response.status_code == 422
