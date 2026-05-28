# cap: crm.crm-consent-optout
# atomics: TBD
# story-origin: TBD
"""Lead domain entity — NOT PHI.

Domain layer — pure Python dataclass, no ORM imports.

Per arch spec § T-infra-9: Lead is NOT PHI. Single tenant_id filter only.
No dual filter required. Marketing role can access leads.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Lead:
    """Lead domain entity — marketing prospect, non-PHI.

    Only tenant_id isolation required (no clinic_id dual filter).
    Marketing, receptionist, and admin roles can access lead data.
    """

    id: UUID
    tenant_id: UUID

    # Contact info (not PHI in the lead context — no clinical data)
    name: str
    email: str | None = None
    phone: str | None = None
    source: str | None = None  # e.g., "website", "referral", "instagram"

    # Lead qualification
    status: str = "new"  # new | contacted | qualified | lost | converted
    notes: str | None = None

    # Soft delete
    deleted_at: datetime | None = None

    # Timestamps
    created_at: datetime = field(default_factory=lambda: datetime.now())
    updated_at: datetime = field(default_factory=lambda: datetime.now())
