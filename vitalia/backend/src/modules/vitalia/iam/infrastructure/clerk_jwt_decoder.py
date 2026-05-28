# cap: iam.iam-scaffold-slice-1
# atomics: TBD
# story-origin: TBD
"""Clerk JWT decoder — Slice 1 stub implementation.

Infrastructure layer — parses stub tokens in dev/test environments.

Stub token format:
    "stub:{tenant_id}:{clinic_id}:{role}:{user_id}"

Production (Slice 2): replace with real Clerk JWKS validation.
"""

from __future__ import annotations

from dataclasses import dataclass

from src.modules.vitalia.iam.domain.role import VitaliaRole


class JwtDecodeError(Exception):
    """Raised when a JWT token cannot be decoded or validated."""


@dataclass(frozen=True)
class ClerkJwtPayload:
    """Parsed payload from a Clerk JWT token.

    Value object — immutable after construction.
    """

    user_id: str
    tenant_id: str
    clinic_id: str
    role: str
    email: str
    name: str


_STUB_PREFIX = "stub:"


class ClerkJwtDecoder:
    """Decodes Clerk JWT tokens.

    Slice 1 stub: only handles the test stub format.
    Slice 2: replace `decode()` body with JWKS verification.
    """

    def decode(self, token: str) -> ClerkJwtPayload:
        """Decode a token and return its payload.

        Args:
            token: Bearer token string.

        Returns:
            ClerkJwtPayload with extracted claims.

        Raises:
            JwtDecodeError: If the token is empty, malformed, or has an unknown role.
        """
        if not token:
            raise JwtDecodeError("Token is empty.")

        if token.startswith(_STUB_PREFIX):
            return self._decode_stub(token)

        raise JwtDecodeError("Unsupported token format (Slice 1 stub-only).")

    def _decode_stub(self, token: str) -> ClerkJwtPayload:
        """Parse stub token: stub:{tenant_id}:{clinic_id}:{role}:{user_id}."""
        parts = token[len(_STUB_PREFIX) :].split(":")
        if len(parts) != 4:
            raise JwtDecodeError(f"Stub token must have 4 parts after 'stub:' prefix, got {len(parts)}: '{token}'")

        tenant_id, clinic_id, role_str, user_id = parts

        # Validate role
        try:
            VitaliaRole(role_str)
        except ValueError:
            raise JwtDecodeError(
                f"Unknown role '{role_str}' in stub token. Valid roles: {[r.value for r in VitaliaRole]}"
            )

        return ClerkJwtPayload(
            user_id=user_id,
            tenant_id=tenant_id,
            clinic_id=clinic_id,
            role=role_str,
            email=f"{user_id}@stub.vitalia.test",
            name=f"Stub User ({role_str})",
        )
