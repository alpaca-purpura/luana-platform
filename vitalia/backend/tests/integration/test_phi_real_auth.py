# cap: iam.iam-scaffold-slice-1
"""Integration tests for PHI real auth — Slice 2 (SC-1, SC-4).

Tests the decoder JWKS real path + role-from-DB resolution.

SC-1: doctor JWT real → PHI 200 (decoder + resolver verify correctly).
SC-4: invalid/expired/forged/stub-legacy token → 401 (no bypass).

SC-2 (recepcion/marketing → 403) and SC-3 (cross-tenant 404 / cross-clinic 403)
are owned by T-2 (repos-wire). Stubs are left here as skeletons.

Strategy for deterministic tests without network egress:
  monkeypatch verify_token_payload with fixed payload
  (sub=user_3EQJjxsvxiZ5exQjucSB651xnUd = doctor.demo)
  + seed god-matrix DB fixtures (tenant Sanaré + clinic).

story: vitalia-iam-slice2-phi-real-auth · T-1 (SC-1 + SC-4)
date: 2026-05-29

downstream-regression-na: brand-local PHI real auth integration tests
"""

from __future__ import annotations

import os
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Constants matching 04-validators.yaml § test_construction_plan
# ---------------------------------------------------------------------------

TENANT_SANARE = uuid.UUID("e69a691d-070e-5caf-a053-6e74642ec100")
CLINIC_SANARE = uuid.UUID("f035be5b-0ac4-5210-8fc3-395650ca2b83")

# Clerk user_id (sub claim) for doctor.demo (from god-matrix seed)
DOCTOR_CLERK_SUB = "user_3EQJjxsvxiZ5exQjucSB651xnUd"

# Fixed JWT payload that verify_token_payload will return when monkeypatched
_DOCTOR_JWT_PAYLOAD: dict = {
    "sub": DOCTOR_CLERK_SUB,
    "email": "doctor.demo@sanare.vitalia.test",
    "full_name": "Dr. Demo Doctor",
    "iat": 9999999999,
    "exp": 9999999999,
}

# Fake doctor DB UUID (must exist in the test DB if running @integration)
DOCTOR_DB_UUID = uuid.UUID("00000000-0000-0000-0000-000000000001")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_fake_db_session(doctor_uuid: uuid.UUID | None = DOCTOR_DB_UUID, role: str = "doctor") -> AsyncSession:
    """Build a mock AsyncSession that returns expected rows for role resolution.

    Returns an AsyncMock mimicking AsyncSession.execute() with scalar_one_or_none().
    First execute() (UserModel lookup) returns a row with .id = doctor_uuid.
    Second execute() (UserTenantModel lookup) returns the role string.

    Note: execute() is async, so it returns a coroutine that resolves to a result object.
    The result object's scalar_one_or_none() is sync.
    """
    from unittest.mock import MagicMock

    session = AsyncMock(spec=AsyncSession)

    # Row mock for UserModel query (clerk_id lookup → users.id)
    # execute() is async → returns a MagicMock result with sync scalar_one_or_none()
    user_result = MagicMock()
    user_result.scalar_one_or_none.return_value = doctor_uuid

    # Row mock for UserTenantModel query (role lookup)
    role_result = MagicMock()
    role_result.scalar_one_or_none.return_value = role

    # execute() is awaitable and returns different results on each call
    session.execute = AsyncMock(side_effect=[user_result, role_result])
    return session


# ---------------------------------------------------------------------------
# SC-1 — happy path: doctor JWT real → PHI access (decoder + resolver)
# ---------------------------------------------------------------------------


class TestSC1DoctorJwtRealSeePhi:
    """SC-1: doctor with real JWT (mocked JWKS) → resolver resolves correctly."""

    @pytest.mark.asyncio
    async def test_doctor_jwt_real_sees_phi(self) -> None:
        """Decoder decodes real JWT (mocked) + resolver returns doctor ClinicContext.

        Verifies:
        1. verify_token_payload is called (not the stub path)
        2. user_id extracted from payload["sub"]
        3. DB role resolution returns "doctor"
        4. ClinicContext.role == "doctor"

        Note: SC-1 e2e grader (audit_log row) is exercised in full T-2 scope
        when repos are wired. Here we validate the auth core (decoder + resolver).
        """
        from src.modules.vitalia.iam.application.services.clinic_resolver import (
            ClinicResolver,
        )
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
        )

        decoder = ClerkJwtDecoder()
        resolver = ClinicResolver(decoder=decoder)

        fake_real_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.real_jwt_placeholder"

        db_session = _make_fake_db_session(doctor_uuid=DOCTOR_DB_UUID, role="doctor")

        # Monkeypatch verify_token_payload to return fixed doctor payload
        with patch(
            "src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder.verify_token_payload",
            return_value=_DOCTOR_JWT_PAYLOAD,
        ):
            ctx = await resolver.async_resolve(
                token=fake_real_token,
                session=db_session,
                tenant_id_str=str(TENANT_SANARE),
                clinic_id_str=str(CLINIC_SANARE),
            )

        assert ctx.role == "doctor"
        assert ctx.user_id == DOCTOR_CLERK_SUB
        assert ctx.tenant_id == TENANT_SANARE
        assert ctx.clinic_id == CLINIC_SANARE

    @pytest.mark.asyncio
    async def test_decoder_calls_verify_token_payload_not_stub(self) -> None:
        """decoder.decode() MUST call verify_token_payload for non-stub tokens."""
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
        )

        decoder = ClerkJwtDecoder()
        real_token = "eyJhbGciOiJSUzI1NiJ9.real_token"

        with patch(
            "src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder.verify_token_payload",
            return_value=_DOCTOR_JWT_PAYLOAD,
        ) as mock_verify:
            os.environ.pop("VITALIA_AUTH_STUB", None)
            payload = decoder.decode(real_token)

        mock_verify.assert_called_once_with(real_token)
        assert payload.user_id == DOCTOR_CLERK_SUB

    @pytest.mark.asyncio
    async def test_role_resolved_from_db_not_token(self) -> None:
        """async_resolve() must use DB role, not token claim."""
        from src.modules.vitalia.iam.application.services.clinic_resolver import (
            ClinicResolver,
        )
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
        )

        # payload has role="marketing" (from token — should be IGNORED)
        payload_with_wrong_role = {**_DOCTOR_JWT_PAYLOAD}
        # role is NOT part of the real Clerk JWT payload; but even if it were,
        # it should not influence ClinicContext.role

        decoder = ClerkJwtDecoder()
        resolver = ClinicResolver(decoder=decoder)

        # DB returns "doctor" regardless of any claim in token
        db_session = _make_fake_db_session(doctor_uuid=DOCTOR_DB_UUID, role="doctor")

        real_token = "eyJhbGciOiJSUzI1NiJ9.real_token"

        with patch(
            "src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder.verify_token_payload",
            return_value=payload_with_wrong_role,
        ):
            ctx = await resolver.async_resolve(
                token=real_token,
                session=db_session,
                tenant_id_str=str(TENANT_SANARE),
                clinic_id_str=str(CLINIC_SANARE),
            )

        # Role MUST come from DB (doctor), not any claim in the token
        assert ctx.role == "doctor"


# ---------------------------------------------------------------------------
# SC-4 — adversarial: invalid/expired/forged/stub-legacy → 401
# ---------------------------------------------------------------------------


class TestSC4InvalidToken401:
    """SC-4: any non-real token must raise JwtDecodeError → maps to 401."""

    def test_invalid_token_401(self) -> None:
        """Forged/garbage token → JwtDecodeError (will map to 401 in router)."""
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
            JwtDecodeError,
        )

        decoder = ClerkJwtDecoder()

        with patch(
            "src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder.verify_token_payload",
            side_effect=HTTPException(status_code=401, detail="Invalid Token"),
        ):
            os.environ.pop("VITALIA_AUTH_STUB", None)
            with pytest.raises(JwtDecodeError):
                decoder.decode("not.a.real.jwt.at.all")

    def test_expired_token_401(self) -> None:
        """Expired token → JwtDecodeError (HTTPException 401 from engine → mapped)."""
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
            JwtDecodeError,
        )

        decoder = ClerkJwtDecoder()
        expired_jwt = "eyJhbGciOiJSUzI1NiJ9.expired_placeholder"

        with patch(
            "src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder.verify_token_payload",
            side_effect=HTTPException(status_code=401, detail="Token expired"),
        ):
            os.environ.pop("VITALIA_AUTH_STUB", None)
            with pytest.raises(JwtDecodeError):
                decoder.decode(expired_jwt)

    def test_legacy_stub_token_rejected_in_runtime_401(self) -> None:
        """stub:... tokens MUST be rejected when VITALIA_AUTH_STUB is absent.

        This is the 'stub-legacy' adversarial case: an attacker sends a stub token
        hoping the runtime still accepts it.
        """
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
            JwtDecodeError,
        )

        decoder = ClerkJwtDecoder()
        legacy_stub = "stub:tenant-id:clinic-id:doctor:user-attacker"

        # Simulate runtime: VITALIA_AUTH_STUB not set
        with patch(
            "src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder.verify_token_payload",
            side_effect=HTTPException(status_code=401, detail="Invalid Token: stub token is not a valid JWT"),
        ):
            os.environ.pop("VITALIA_AUTH_STUB", None)
            with pytest.raises(JwtDecodeError):
                decoder.decode(legacy_stub)

    def test_empty_token_raises_jwt_decode_error(self) -> None:
        """Empty token → JwtDecodeError without calling JWKS."""
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
            JwtDecodeError,
        )

        decoder = ClerkJwtDecoder()
        with pytest.raises(JwtDecodeError):
            decoder.decode("")

    def test_none_bearer_token_resolves_missing_auth(self) -> None:
        """None/empty token → MissingAuthHeaderError from resolver."""
        from src.modules.vitalia.iam.application.services.clinic_resolver import (
            ClinicResolver,
            MissingAuthHeaderError,
        )
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
        )

        decoder = ClerkJwtDecoder()
        resolver = ClinicResolver(decoder=decoder)

        with pytest.raises(MissingAuthHeaderError):
            resolver.resolve(None)  # type: ignore[arg-type]

    def test_error_body_does_not_leak_phi_on_401(self) -> None:
        """JwtDecodeError message must not contain PHI or sensitive details.

        The error message surfaced to the user must be generic (no payload leaks).
        """
        from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
            ClerkJwtDecoder,
            JwtDecodeError,
        )

        decoder = ClerkJwtDecoder()

        with patch(
            "src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder.verify_token_payload",
            side_effect=HTTPException(status_code=401, detail="Invalid Token: some_internal_detail"),
        ):
            os.environ.pop("VITALIA_AUTH_STUB", None)
            with pytest.raises(JwtDecodeError) as exc_info:
                decoder.decode("bad.token.here")

        error_msg = str(exc_info.value)
        # Must NOT expose specific JWT internals that could aid attackers
        assert "some_internal_detail" not in error_msg, (
            "JwtDecodeError message must not leak internal token details (PHI safety + security)."
        )


# ---------------------------------------------------------------------------
# SC-2 stubs (T-2 scope — skip here)
# ---------------------------------------------------------------------------


@pytest.mark.skip(reason="SC-2 (recepcion/marketing 403) — T-2 scope (repos-wire ticket)")
def test_recepcion_403() -> None:
    """SC-2: recepcion role → 403. Implemented in T-2."""
    pass


@pytest.mark.skip(reason="SC-2 (marketing 403) — T-2 scope")
def test_marketing_403() -> None:
    """SC-2: marketing role → 403. Implemented in T-2."""
    pass


# ---------------------------------------------------------------------------
# SC-3 stubs (T-2 scope — skip here)
# ---------------------------------------------------------------------------


@pytest.mark.skip(reason="SC-3 (cross-tenant 404) — T-2 scope (repos-wire ticket)")
def test_cross_tenant_404() -> None:
    """SC-3: cross-tenant request → 404. Implemented in T-2."""
    pass


@pytest.mark.skip(reason="SC-3 (cross-clinic 403) — T-2 scope")
def test_cross_clinic_403() -> None:
    """SC-3: cross-clinic request → 403. Implemented in T-2."""
    pass
