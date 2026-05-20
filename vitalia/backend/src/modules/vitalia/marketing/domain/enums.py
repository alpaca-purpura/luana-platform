"""Marketing domain enums for vitalia brand.

Covers ad provider slugs, sync states, recommendation lifecycle,
referral lifecycle, bowtie funnel stages, and rejection reasons.
"""

from __future__ import annotations

from enum import Enum


class ProviderSlug(str, Enum):
    """Supported advertising channel providers."""

    GOOGLE_ADS = "google_ads"
    META_ADS = "meta_ads"


class SyncStatus(str, Enum):
    """OAuth sync state for a channel connection."""

    OK = "ok"
    ERROR = "error"
    PENDING = "pending"


class RecommendationStatus(str, Enum):
    """Lifecycle states of a LucasRecommendation."""

    OPEN = "open"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ReferralStatus(str, Enum):
    """Lifecycle states of a patient referral."""

    PENDING = "pending"
    CONVERTED = "converted"
    EXPIRED = "expired"


class BowtieStage(str, Enum):
    """Bowtie marketing funnel stages relevant to clinic growth."""

    ATTRACT = "attract"
    CONVERT = "convert"
    RETAIN = "retain"


class RejectReason(str, Enum):
    """Reasons a user can reject a Lucas recommendation."""

    NOT_RELEVANT = "not_relevant"
    TOO_EXPENSIVE = "too_expensive"
    ALREADY_DONE = "already_done"
    OTHER = "other"
