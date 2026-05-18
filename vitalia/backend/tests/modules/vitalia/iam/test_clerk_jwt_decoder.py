"""Tests for ClerkJwtDecoder stub — Slice 1 JWT parsing.

TDD: RED tests defined before implementation (T-infra-9).

downstream-regression-na: brand-local IAM JWT decoder tests
"""

from __future__ import annotations

import pytest

from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
    ClerkJwtDecoder,
    ClerkJwtPayload,
    JwtDecodeError,
)


class TestClerkJwtPayload:
    """ClerkJwtPayload dataclass shape."""

    def test_payload_has_user_id(self) -> None:
        from uuid import uuid4

        p = ClerkJwtPayload(
            user_id="user_abc123",
            tenant_id=str(uuid4()),
            clinic_id=str(uuid4()),
            role="doctor",
            email="doc@clinic.com",
            name="Dr. Garcia",
        )
        assert p.user_id == "user_abc123"

    def test_payload_has_role(self) -> None:
        from uuid import uuid4

        p = ClerkJwtPayload(
            user_id="user_abc123",
            tenant_id=str(uuid4()),
            clinic_id=str(uuid4()),
            role="nurse",
            email="nurse@clinic.com",
            name="Enfermera Lopez",
        )
        assert p.role == "nurse"

    def test_payload_email_optional(self) -> None:
        from uuid import uuid4

        p = ClerkJwtPayload(
            user_id="user_xyz",
            tenant_id=str(uuid4()),
            clinic_id=str(uuid4()),
            role="receptionist",
            email=None,
            name=None,
        )
        assert p.email is None


class TestClerkJwtDecoder:
    """ClerkJwtDecoder stub — Slice 1 behaviour."""

    def setup_method(self) -> None:
        self.decoder = ClerkJwtDecoder()

    def test_decode_returns_payload_for_valid_token(self) -> None:
        """Stub decoder accepts any 'Bearer ...' token and returns payload from claims."""
        from uuid import uuid4

        tenant_id = str(uuid4())
        clinic_id = str(uuid4())
        # Stub token format: "stub:<tenant_id>:<clinic_id>:<role>:<user_id>"
        token = f"stub:{tenant_id}:{clinic_id}:doctor:user_test123"
        payload = self.decoder.decode(token)
        assert payload.tenant_id == tenant_id
        assert payload.clinic_id == clinic_id
        assert payload.role == "doctor"
        assert payload.user_id == "user_test123"

    def test_decode_raises_on_empty_token(self) -> None:
        with pytest.raises(JwtDecodeError):
            self.decoder.decode("")

    def test_decode_raises_on_invalid_format(self) -> None:
        with pytest.raises(JwtDecodeError):
            self.decoder.decode("Bearer invalid_not_parseable")

    def test_decode_raises_for_unknown_role(self) -> None:
        from uuid import uuid4

        token = f"stub:{uuid4()}:{uuid4()}:superuser:user_999"
        with pytest.raises(JwtDecodeError, match="Unknown role"):
            self.decoder.decode(token)
