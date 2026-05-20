"""Referral domain entity — patient referral program tracking.

Per HIPAA-lite: patient_id is stored as UUID reference (no name/DNI/PHI).
Referral codes contain NO PHI.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime

from src.modules.vitalia.marketing.domain.enums import ReferralStatus


@dataclass
class Referral:
    """A patient referral record linking referrer to referred patient.

    Uniquely identified by the referral code.
    PHI-free: uses patient_id UUID reference only, no name/DNI stored here.
    """

    id: uuid.UUID
    tenant_id: uuid.UUID
    clinic_id: uuid.UUID
    patient_id: uuid.UUID
    code: str
    status: ReferralStatus
    created_at: datetime
    updated_at: datetime

    # Conversion tracking
    referred_patient_id: uuid.UUID | None = None
    converted_at: datetime | None = None
    expires_at: datetime | None = None
    deleted_at: datetime | None = None

    def convert(self, *, referred_patient_id: uuid.UUID, now: datetime) -> None:
        """Mark this referral as converted.

        Args:
            referred_patient_id: UUID of the newly registered patient.
            now: current UTC datetime.
        """
        self.status = ReferralStatus.CONVERTED
        self.referred_patient_id = referred_patient_id
        self.converted_at = now
        self.updated_at = now

    def expire(self, now: datetime) -> None:
        """Mark this referral as expired (cron job action)."""
        if self.status == ReferralStatus.PENDING:
            self.status = ReferralStatus.EXPIRED
            self.updated_at = now
