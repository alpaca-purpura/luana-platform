"""E2E tests — creator onboarding journey (V-F-5).

Covers spec § 1.3 onboarding wizard flow:
  signup → handle → niche → plan → first offer

These tests exercise OnboardingService end-to-end using mocked repos
(no real DB required for V-F-5). Services receive mocked deps via DI.

V-F-5 scenarios:
  - O1: happy path new creator — creates profile, returns tenant_id + is_new=True
  - O2: duplicate handle → DuplicateHandleError
  - O3: invalid niche → InvalidNicheError
  - O4: invalid plan_tier → InvalidPlanTierError
  - O5: idempotent repeat (same clerk_user_id within TTL) → is_new=False (cached)
  - O6: via HTTP route — POST /api/v1/comunify/onboarding/creator 200 + response DTO

Spec reference:
  - 01-spec.md § 1.3 (onboarding wizard)
  - 03-arch-be.md § 6.1 + § 9.1 (OnboardingService + idempotency)
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
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


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _build_onboarding_service(
    *,
    handle_exists: bool = False,
    idempotency_hit: dict[str, Any] | None = None,
) -> OnboardingService:
    """Build OnboardingService with configurable mocks for E2E scenarios."""
    session = MagicMock()
    session.add = MagicMock()
    session.flush = AsyncMock()

    plan_tier_repo = MagicMock()
    audit_log_repo = MagicMock()
    audit_log_repo.append = AsyncMock()

    idempotency_store = MagicMock()
    idempotency_store.get = AsyncMock(return_value=idempotency_hit)
    idempotency_store.set = AsyncMock()

    async def _handle_exists_fn(handle: str) -> bool:  # noqa: ARG001
        return handle_exists

    return OnboardingService(
        session=session,
        plan_tier_repo=plan_tier_repo,
        audit_log_repo=audit_log_repo,
        idempotency_store=idempotency_store,
        handle_exists_fn=_handle_exists_fn,
    )


# ─────────────────────────────────────────────────────────────────────────────
# O1 — Happy path new creator (spec § 1.3 full journey)
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_onboarding_new_creator_happy_path() -> None:
    """O1: spec § 1.3 — creator Anabella completes onboarding signup → handle → niche → plan.

    Validates end-to-end journey: new tenant_id assigned, is_new=True,
    niche + plan_tier returned as submitted.
    """
    service = _build_onboarding_service()

    request = CreateCreatorProfileRequest(
        clerk_user_id="user_2aBcDeFgHiJkL",
        creator_handle="anabella_coaching",
        display_name="Anabella García",
        niche="business_coaching",
        country="AR",
        plan_tier="creator",
    )
    result = await service.create_creator_profile(request=request)

    assert isinstance(result, OnboardingResult)
    assert result.is_new is True
    assert result.creator_handle == "anabella_coaching"
    assert result.niche == "business_coaching"
    assert result.plan_tier == "creator"
    assert result.clerk_user_id == "user_2aBcDeFgHiJkL"
    assert isinstance(result.tenant_id, uuid.UUID)


# ─────────────────────────────────────────────────────────────────────────────
# O2 — Duplicate handle → DuplicateHandleError
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_onboarding_duplicate_handle_raises() -> None:
    """O2: creator_handle already taken → DuplicateHandleError.

    Spec § 1.3: handle uniqueness enforced during onboarding.
    """
    service = _build_onboarding_service(handle_exists=True)

    request = CreateCreatorProfileRequest(
        clerk_user_id="user_new_creator_xyz",
        creator_handle="taken_handle",
        display_name="Nuevo Creador",
        niche="life_coaching",
        country="CL",
        plan_tier="pro",
    )
    with pytest.raises(DuplicateHandleError) as exc_info:
        await service.create_creator_profile(request=request)

    assert "taken_handle" in str(exc_info.value)


# ─────────────────────────────────────────────────────────────────────────────
# O3 — Invalid niche → InvalidNicheError
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_onboarding_invalid_niche_raises() -> None:
    """O3: niche not in ALLOWED_NICHES catalog → InvalidNicheError.

    Validates catalog enforcement (spec § 2.1 niche catalog).
    """
    service = _build_onboarding_service()

    request = CreateCreatorProfileRequest(
        clerk_user_id="user_bad_niche_test",
        creator_handle="creator_bad_niche",
        display_name="Creador Test",
        niche="invalid_niche_xyz",  # Not in ALLOWED_NICHES
        country="MX",
        plan_tier="creator",
    )
    with pytest.raises(InvalidNicheError) as exc_info:
        await service.create_creator_profile(request=request)

    assert "invalid_niche_xyz" in str(exc_info.value)


# ─────────────────────────────────────────────────────────────────────────────
# O4 — Invalid plan tier → InvalidPlanTierError
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_onboarding_invalid_plan_tier_raises() -> None:
    """O4: plan_tier not in ALLOWED_PLAN_TIERS → InvalidPlanTierError.

    Validates plan tier validation (spec § 2.2 plan tiers).
    """
    service = _build_onboarding_service()

    request = CreateCreatorProfileRequest(
        clerk_user_id="user_bad_tier_test",
        creator_handle="creator_bad_tier",
        display_name="Creador Test",
        niche="fitness_bienestar",
        country="PE",
        plan_tier="enterprise",  # Not in ALLOWED_PLAN_TIERS
    )
    with pytest.raises(InvalidPlanTierError) as exc_info:
        await service.create_creator_profile(request=request)

    assert "enterprise" in str(exc_info.value)


# ─────────────────────────────────────────────────────────────────────────────
# O5 — Idempotent repeat within TTL (same clerk_user_id → cached result)
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_onboarding_idempotent_repeat_returns_cached() -> None:
    """O5: same clerk_user_id within 1s TTL → idempotency store returns cached.

    is_new=False returned. No second DB write. Per 03-arch-be.md § 9.1.
    """
    cached_tenant_id = uuid.uuid4()
    idempotency_hit: dict[str, Any] = {
        "tenant_id": str(cached_tenant_id),
        "clerk_user_id": "user_repeat_test",
        "creator_handle": "repeat_creator",
        "display_name": "Creador Repetido",
        "niche": "marketing_digital",
        "plan_tier": "pro",
        "is_new": True,
    }
    service = _build_onboarding_service(idempotency_hit=idempotency_hit)

    request = CreateCreatorProfileRequest(
        clerk_user_id="user_repeat_test",
        creator_handle="repeat_creator",
        display_name="Creador Repetido",
        niche="marketing_digital",
        country="CO",
        plan_tier="pro",
    )
    result = await service.create_creator_profile(request=request)

    assert result.is_new is False  # Idempotent hit
    assert result.tenant_id == cached_tenant_id
    assert result.creator_handle == "repeat_creator"


# ─────────────────────────────────────────────────────────────────────────────
# O6 — Via HTTP route (ASGI) — POST /api/v1/comunify/onboarding/creator
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_onboarding_via_http_route_returns_stub_response() -> None:
    """O6: POST /api/v1/comunify/onboarding/creator via ASGI transport.

    Validates route is mounted correctly, returns 200 + JSON response
    matching CreateCreatorProfileResponse DTO shape.

    Note: route is a stub (T-be-8 wires DI in integration layer — D1).
    This test validates: (a) route exists, (b) response_model= enforced,
    (c) X-Tenant-ID header accepted.
    """
    tenant_id = str(uuid.uuid4())

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post(
            "/api/v1/comunify/onboarding/creator-profile",
            headers={"X-Tenant-ID": tenant_id, "X-Clerk-User-ID": "user_http_test"},
            json={
                "clerk_user_id": "user_http_test",
                "creator_handle": "http_test_creator",
                "display_name": "Creator Via HTTP",
                "niche": "business_coaching",
                "country": "AR",
                "plan_tier": "creator",
            },
        )

    # Stub returns 201 with well-formed DTO (response_model= enforced)
    assert response.status_code == 201
    body = response.json()
    assert "tenant_id" in body
    assert "creator_handle" in body
    assert "plan_tier" in body


# ─────────────────────────────────────────────────────────────────────────────
# O7 — Catalog coverage (all ALLOWED_NICHES valid)
# ─────────────────────────────────────────────────────────────────────────────


async def test_e2e_onboarding_all_allowed_niches_accepted() -> None:
    """O7: every niche in ALLOWED_NICHES catalog must be accepted without error.

    Validates no silent catalog drift — if ALLOWED_NICHES grows, test covers it.
    """
    for niche in ALLOWED_NICHES:
        service = _build_onboarding_service()
        request = CreateCreatorProfileRequest(
            clerk_user_id=f"user_niche_{niche[:8]}",
            creator_handle=f"creator_{niche[:15].replace('_', '')}",
            display_name="Creador Test",
            niche=niche,
            country="AR",
            plan_tier="creator",
        )
        result = await service.create_creator_profile(request=request)
        assert result.niche == niche, f"Niche '{niche}' rejected unexpectedly"


async def test_e2e_onboarding_all_allowed_plan_tiers_accepted() -> None:
    """O8: every plan_tier in ALLOWED_PLAN_TIERS must be accepted without error."""
    for plan_tier in ALLOWED_PLAN_TIERS:
        service = _build_onboarding_service()
        request = CreateCreatorProfileRequest(
            clerk_user_id=f"user_tier_{plan_tier}",
            creator_handle=f"creator_{plan_tier}_test",
            display_name="Creador Test",
            niche="business_coaching",
            country="CL",
            plan_tier=plan_tier,
        )
        result = await service.create_creator_profile(request=request)
        assert result.plan_tier == plan_tier, f"Plan tier '{plan_tier}' rejected unexpectedly"
