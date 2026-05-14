"""Unit tests — OnboardingService.

TDD RED phase: written before implementation exists.
Tests drive the contract per 03-arch-be.md § 9.1.

Covers:
  - A1: idempotency (same clerk_user_id within TTL returns cached result, is_new=False)
  - A2: handle uniqueness validation
  - A3: niche validation against ALLOWED_NICHES catalog
  - A4: plan tier validation against brand.yaml plan_tiers
  - A5: new tenant creation (is_new=True on cache miss)

D1: OnboardingService receives repositories via DI constructor injection.
No direct DB access in tests — all repos mocked.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.comunify.application.services.onboarding_service import (
    ALLOWED_NICHES,
    ALLOWED_PLAN_TIERS,
    CreateCreatorProfileRequest,
    DuplicateHandleError,
    InvalidNicheError,
    InvalidPlanTierError,
    OnboardingResult,
    OnboardingService,
)

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_idempotency_store() -> MagicMock:
    """In-memory idempotency store mock."""
    store = MagicMock()
    store.get = AsyncMock(return_value=None)  # default: cache miss
    store.set = AsyncMock(return_value=None)
    return store


@pytest.fixture
def mock_plan_tier_repo() -> MagicMock:
    """Mock PlanTierConfigRepository — cross-tenant catalog."""
    repo = MagicMock()
    repo.get_by_slug = AsyncMock(return_value=MagicMock(plan_tier_slug="creator", is_active=True))
    return repo


@pytest.fixture
def mock_audit_log_repo() -> MagicMock:
    """Mock CommunityAuditLogRepository — audit writes."""
    repo = MagicMock()
    repo.save = AsyncMock(return_value=None)
    return repo


@pytest.fixture
def mock_session() -> MagicMock:
    """Mock AsyncSession."""
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def onboarding_service(
    mock_session: MagicMock,
    mock_plan_tier_repo: MagicMock,
    mock_audit_log_repo: MagicMock,
    mock_idempotency_store: MagicMock,
) -> OnboardingService:
    """OnboardingService with all dependencies mocked."""
    return OnboardingService(
        session=mock_session,
        plan_tier_repo=mock_plan_tier_repo,
        audit_log_repo=mock_audit_log_repo,
        idempotency_store=mock_idempotency_store,
    )


@pytest.fixture
def valid_request() -> CreateCreatorProfileRequest:
    """Valid CreateCreatorProfileRequest for happy path."""
    return CreateCreatorProfileRequest(
        clerk_user_id="user_test_abc123",
        creator_handle="anabella_conexion",
        display_name="Anabella Conexión",
        niche="business_coaching",
        country="AR",
        plan_tier="creator",
    )


# ─────────────────────────────────────────────────────────────────────────────
# A1 — Idempotency
# ─────────────────────────────────────────────────────────────────────────────


async def test_idempotency_cache_hit_returns_existing_tenant(
    onboarding_service: OnboardingService,
    valid_request: CreateCreatorProfileRequest,
    mock_idempotency_store: MagicMock,
    mock_session: MagicMock,
) -> None:
    """A1: same clerk_user_id within TTL → returns cached result, is_new=False, NO DB write."""
    tenant_id = uuid.uuid4()
    mock_idempotency_store.get = AsyncMock(
        return_value={
            "tenant_id": str(tenant_id),
            "clerk_user_id": valid_request.clerk_user_id,
            "creator_handle": valid_request.creator_handle,
            "display_name": valid_request.display_name,
            "niche": valid_request.niche,
            "plan_tier": valid_request.plan_tier,
            "is_new": True,
        }
    )

    result = await onboarding_service.create_creator_profile(valid_request)

    assert result.is_new is False
    assert result.tenant_id == tenant_id
    assert result.clerk_user_id == valid_request.clerk_user_id
    # No DB write when idempotency cache hit
    mock_session.add.assert_not_called()


async def test_idempotency_cache_miss_creates_new_tenant(
    onboarding_service: OnboardingService,
    valid_request: CreateCreatorProfileRequest,
    mock_idempotency_store: MagicMock,
    mock_session: MagicMock,
) -> None:
    """A1: cache miss → new tenant created, is_new=True, session.flush() called."""
    mock_idempotency_store.get = AsyncMock(return_value=None)

    result = await onboarding_service.create_creator_profile(valid_request)

    assert result.is_new is True
    assert isinstance(result.tenant_id, uuid.UUID)
    assert result.clerk_user_id == valid_request.clerk_user_id
    # Idempotency key stored post-creation
    mock_idempotency_store.set.assert_called_once()
    # Session flush called
    mock_session.flush.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# A2 — Handle uniqueness
# ─────────────────────────────────────────────────────────────────────────────


async def test_create_profile_raises_on_duplicate_handle(
    mock_session: MagicMock,
    mock_plan_tier_repo: MagicMock,
    mock_audit_log_repo: MagicMock,
    mock_idempotency_store: MagicMock,
    valid_request: CreateCreatorProfileRequest,
) -> None:
    """A2: duplicate creator_handle → DuplicateHandleError raised."""
    # handle_exists_fn returns True (duplicate)
    service = OnboardingService(
        session=mock_session,
        plan_tier_repo=mock_plan_tier_repo,
        audit_log_repo=mock_audit_log_repo,
        idempotency_store=mock_idempotency_store,
        handle_exists_fn=AsyncMock(return_value=True),
    )

    with pytest.raises(DuplicateHandleError) as exc_info:
        await service.create_creator_profile(valid_request)

    assert "anabella_conexion" in str(exc_info.value)


async def test_create_profile_proceeds_when_handle_unique(
    mock_session: MagicMock,
    mock_plan_tier_repo: MagicMock,
    mock_audit_log_repo: MagicMock,
    mock_idempotency_store: MagicMock,
    valid_request: CreateCreatorProfileRequest,
) -> None:
    """A2: unique handle → no error, creation proceeds."""
    service = OnboardingService(
        session=mock_session,
        plan_tier_repo=mock_plan_tier_repo,
        audit_log_repo=mock_audit_log_repo,
        idempotency_store=mock_idempotency_store,
        handle_exists_fn=AsyncMock(return_value=False),
    )

    result = await service.create_creator_profile(valid_request)

    assert result.is_new is True


# ─────────────────────────────────────────────────────────────────────────────
# A3 — Niche validation
# ─────────────────────────────────────────────────────────────────────────────


async def test_invalid_niche_raises_error(
    onboarding_service: OnboardingService,
) -> None:
    """A3: niche not in ALLOWED_NICHES → InvalidNicheError raised."""
    request = CreateCreatorProfileRequest(
        clerk_user_id="user_niche_test",
        creator_handle="test_creator",
        display_name="Test Creator",
        niche="INVALID_NICHE_NOT_IN_CATALOG",
        country="MX",
        plan_tier="creator",
    )

    with pytest.raises(InvalidNicheError) as exc_info:
        await onboarding_service.create_creator_profile(request)

    assert "INVALID_NICHE_NOT_IN_CATALOG" in str(exc_info.value)


@pytest.mark.parametrize("valid_niche", list(ALLOWED_NICHES)[:3])
async def test_valid_niche_does_not_raise(
    onboarding_service: OnboardingService,
    valid_niche: str,
) -> None:
    """A3: valid niche from ALLOWED_NICHES → no error."""
    request = CreateCreatorProfileRequest(
        clerk_user_id=f"user_{valid_niche[:8]}",
        creator_handle=f"creator_{valid_niche[:10]}",
        display_name="Valid Creator",
        niche=valid_niche,
        country="CL",
        plan_tier="creator",
    )

    result = await onboarding_service.create_creator_profile(request)
    assert result is not None


# ─────────────────────────────────────────────────────────────────────────────
# A4 — Plan tier validation
# ─────────────────────────────────────────────────────────────────────────────


async def test_invalid_plan_tier_raises_error(
    onboarding_service: OnboardingService,
) -> None:
    """A4: plan_tier not in brand.yaml plan_tiers → InvalidPlanTierError raised."""
    request = CreateCreatorProfileRequest(
        clerk_user_id="user_tier_test",
        creator_handle="tier_test_creator",
        display_name="Tier Test",
        niche="business_coaching",
        country="MX",
        plan_tier="invalid_tier_xyz",
    )

    with pytest.raises(InvalidPlanTierError) as exc_info:
        await onboarding_service.create_creator_profile(request)

    assert "invalid_tier_xyz" in str(exc_info.value)


@pytest.mark.parametrize("valid_tier", list(ALLOWED_PLAN_TIERS)[:2])
async def test_valid_plan_tier_does_not_raise(
    onboarding_service: OnboardingService,
    valid_tier: str,
) -> None:
    """A4: valid plan_tier from brand.yaml → no error."""
    request = CreateCreatorProfileRequest(
        clerk_user_id=f"user_{valid_tier[:8]}",
        creator_handle=f"creator_{valid_tier[:10]}",
        display_name="Tier Creator",
        niche="business_coaching",
        country="AR",
        plan_tier=valid_tier,
    )

    result = await onboarding_service.create_creator_profile(request)
    assert result is not None


# ─────────────────────────────────────────────────────────────────────────────
# A5 — OnboardingResult shape
# ─────────────────────────────────────────────────────────────────────────────


async def test_result_fields_populated_correctly(
    onboarding_service: OnboardingService,
    valid_request: CreateCreatorProfileRequest,
) -> None:
    """A5: OnboardingResult contains all required fields on creation."""
    result = await onboarding_service.create_creator_profile(valid_request)

    assert isinstance(result, OnboardingResult)
    assert isinstance(result.tenant_id, uuid.UUID)
    assert result.clerk_user_id == valid_request.clerk_user_id
    assert result.creator_handle == valid_request.creator_handle
    assert result.display_name == valid_request.display_name
    assert result.niche == valid_request.niche
    assert result.plan_tier == valid_request.plan_tier
    assert result.is_new is True


# ─────────────────────────────────────────────────────────────────────────────
# A6 — ALLOWED_NICHES catalog non-empty
# ─────────────────────────────────────────────────────────────────────────────


def test_allowed_niches_catalog_non_empty() -> None:
    """A6: ALLOWED_NICHES catalog must have at least 8 entries (spec § 2)."""
    assert len(ALLOWED_NICHES) >= 8, f"Expected at least 8 niches, got {len(ALLOWED_NICHES)}: {ALLOWED_NICHES}"


def test_allowed_plan_tiers_catalog_matches_brand_yaml() -> None:
    """A6: ALLOWED_PLAN_TIERS must include 'creator', 'pro', 'agency' from brand.yaml."""
    assert "creator" in ALLOWED_PLAN_TIERS
    assert "pro" in ALLOWED_PLAN_TIERS
    assert "agency" in ALLOWED_PLAN_TIERS


def test_creator_handle_validator_rejects_empty() -> None:
    """A2 Pydantic: creator_handle must not be empty."""
    with pytest.raises(ValueError):
        CreateCreatorProfileRequest(
            clerk_user_id="user_x",
            creator_handle="",
            display_name="Test",
            niche="business_coaching",
            country="AR",
            plan_tier="creator",
        )


def test_creator_handle_validator_rejects_spaces() -> None:
    """A2 Pydantic: creator_handle must not contain spaces."""
    with pytest.raises(ValueError):
        CreateCreatorProfileRequest(
            clerk_user_id="user_x",
            creator_handle="invalid handle",
            display_name="Test",
            niche="business_coaching",
            country="AR",
            plan_tier="creator",
        )
