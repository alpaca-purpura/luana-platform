# cap: iam.iam-scaffold-slice-1
# story-origin: TBD
"""ClinicResolver — extracts ClinicContext from a JWT token.

Application layer — orchestrates IAM domain + infrastructure.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from src.modules.vitalia.iam.infrastructure.clerk_jwt_decoder import (
    ClerkJwtDecoder,  # re-exported for callers
)


class MissingAuthHeaderError(Exception):
    """Raised when no Authorization token is provided."""


@dataclass(frozen=True)
class ClinicContext:
    """Resolved clinic-scoped user context.

    Returned by ClinicResolver after validating the JWT.
    All IDs are typed as UUID to prevent injection of raw strings.
    """

    user_id: str
    tenant_id: UUID
    clinic_id: UUID
    role: str
    email: str
    name: str


class ClinicResolver:
    """Resolves a bearer token into a ClinicContext.

    Validates the token via ClerkJwtDecoder and converts string IDs to UUIDs.
    """

    def __init__(self, decoder: ClerkJwtDecoder) -> None:
        """Initialize with a JWT decoder.

        Args:
            decoder: ClerkJwtDecoder instance (or mock in tests).
        """
        self._decoder = decoder

    def resolve(self, token: str | None) -> ClinicContext:
        """Extract and validate clinic context from a bearer token.

        Args:
            token: Raw bearer token string. May be None or empty.

        Returns:
            ClinicContext with validated claims and UUID-typed IDs.

        Raises:
            MissingAuthHeaderError: If token is None or empty.
            JwtDecodeError: If the token cannot be decoded (propagated from decoder).
            ValueError: If tenant_id or clinic_id are not valid UUIDs.
        """
        if not token:
            raise MissingAuthHeaderError("Authorization token is required.")

        payload = self._decoder.decode(token)

        return ClinicContext(
            user_id=payload.user_id,
            tenant_id=UUID(payload.tenant_id),
            clinic_id=UUID(payload.clinic_id),
            role=payload.role,
            email=payload.email,
            name=payload.name,
        )
