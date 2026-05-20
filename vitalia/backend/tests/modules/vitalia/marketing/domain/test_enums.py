"""Tests for marketing domain enums — all enum values must be defined."""

from __future__ import annotations

from src.modules.vitalia.marketing.domain.enums import (
    BowtieStage,
    ProviderSlug,
    RecommendationStatus,
    ReferralStatus,
    RejectReason,
    SyncStatus,
)


class TestProviderSlug:
    """ProviderSlug enum covers all supported ad providers."""

    def test_google_ads_value(self) -> None:
        assert ProviderSlug.GOOGLE_ADS.value == "google_ads"

    def test_meta_ads_value(self) -> None:
        assert ProviderSlug.META_ADS.value == "meta_ads"

    def test_has_exactly_two_providers(self) -> None:
        assert len(ProviderSlug) == 2


class TestSyncStatus:
    """SyncStatus enum covers sync states."""

    def test_ok_value(self) -> None:
        assert SyncStatus.OK.value == "ok"

    def test_error_value(self) -> None:
        assert SyncStatus.ERROR.value == "error"

    def test_pending_value(self) -> None:
        assert SyncStatus.PENDING.value == "pending"

    def test_has_exactly_three_statuses(self) -> None:
        assert len(SyncStatus) == 3


class TestRecommendationStatus:
    """RecommendationStatus enum covers lifecycle states."""

    def test_open_value(self) -> None:
        assert RecommendationStatus.OPEN.value == "open"

    def test_approved_value(self) -> None:
        assert RecommendationStatus.APPROVED.value == "approved"

    def test_rejected_value(self) -> None:
        assert RecommendationStatus.REJECTED.value == "rejected"

    def test_expired_value(self) -> None:
        assert RecommendationStatus.EXPIRED.value == "expired"

    def test_has_exactly_four_statuses(self) -> None:
        assert len(RecommendationStatus) == 4


class TestReferralStatus:
    """ReferralStatus enum covers referral lifecycle."""

    def test_pending_value(self) -> None:
        assert ReferralStatus.PENDING.value == "pending"

    def test_converted_value(self) -> None:
        assert ReferralStatus.CONVERTED.value == "converted"

    def test_expired_value(self) -> None:
        assert ReferralStatus.EXPIRED.value == "expired"

    def test_has_exactly_three_statuses(self) -> None:
        assert len(ReferralStatus) == 3


class TestBowtieStage:
    """BowtieStage enum covers the bowtie marketing funnel stages."""

    def test_attract_value(self) -> None:
        assert BowtieStage.ATTRACT.value == "attract"

    def test_convert_value(self) -> None:
        assert BowtieStage.CONVERT.value == "convert"

    def test_retain_value(self) -> None:
        assert BowtieStage.RETAIN.value == "retain"

    def test_has_exactly_three_stages(self) -> None:
        assert len(BowtieStage) == 3


class TestRejectReason:
    """RejectReason enum covers reasons a recommendation can be rejected."""

    def test_not_relevant_value(self) -> None:
        assert RejectReason.NOT_RELEVANT.value == "not_relevant"

    def test_too_expensive_value(self) -> None:
        assert RejectReason.TOO_EXPENSIVE.value == "too_expensive"

    def test_already_done_value(self) -> None:
        assert RejectReason.ALREADY_DONE.value == "already_done"

    def test_other_value(self) -> None:
        assert RejectReason.OTHER.value == "other"

    def test_has_exactly_four_reasons(self) -> None:
        assert len(RejectReason) == 4
