"""Smoke tests — all 16 ComunifyXxxModel classes importable and registered to Base.metadata.

TDD RED phase: run before models exist → fail.
TDD GREEN phase: run after models created → pass.

A1: All 16 models importable + register to Base.metadata.
A2: All tenant-scoped models have tenant_id column with an index.

Tables under test (16):
  comunify_cohorts                       (tenant-scoped, soft-delete)
  comunify_cohort_members                (tenant-scoped, soft-delete)
  comunify_cohort_broadcasts             (tenant-scoped, soft-delete)
  comunify_cohort_broadcast_recipients   (tenant-scoped, no deleted_at)
  comunify_community_posts               (tenant-scoped, soft-delete)
  comunify_community_post_attachments    (tenant-scoped, no deleted_at)
  comunify_community_moderation_events   (tenant-scoped, no deleted_at)
  comunify_subscriptions                 (tenant-scoped, soft-delete)
  comunify_subscription_charges          (tenant-scoped, no deleted_at)
  comunify_offer_ladders                 (tenant-scoped, no deleted_at)
  comunify_voice_cloning_samples         (tenant-scoped, no deleted_at)
  comunify_voice_distillation_jobs       (tenant-scoped, no deleted_at)
  comunify_authority_vault_items         (tenant-scoped, soft-delete)
  comunify_lead_qualification_records    (tenant-scoped, no deleted_at)
  comunify_community_audit_log           (tenant-scoped, IMMUTABLE)
  comunify_plan_tier_configs             (CROSS-TENANT, no tenant_id)
"""

from __future__ import annotations

import pytest
from luana_core_platform.domain.base_entity import Base

# ---------------------------------------------------------------------------
# A1 — all 16 models importable and registered in Base.metadata
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def all_models() -> list:
    """Import and return all 16 ComunifyXxxModel classes."""
    from src.modules.comunify.infrastructure.models import (
        ComunifyAuthorityVaultItemModel,
        ComunifyCohortBroadcastModel,
        ComunifyCohortBroadcastRecipientModel,
        ComunifyCohortMemberModel,
        ComunifyCohortModel,
        ComunifyCommunityAuditLogModel,
        ComunifyCommunityModerationEventModel,
        ComunifyCommunityPostAttachmentModel,
        ComunifyCommunityPostModel,
        ComunifyLeadQualificationRecordModel,
        ComunifyOfferLadderModel,
        ComunifyPlanTierConfigModel,
        ComunifySubscriptionChargeModel,
        ComunifySubscriptionModel,
        ComunifyVoiceCloningSamplesModel,
        ComunifyVoiceDistillationJobModel,
    )

    return [
        ComunifyCohortModel,
        ComunifyCohortMemberModel,
        ComunifyCohortBroadcastModel,
        ComunifyCohortBroadcastRecipientModel,
        ComunifyCommunityPostModel,
        ComunifyCommunityPostAttachmentModel,
        ComunifyCommunityModerationEventModel,
        ComunifySubscriptionModel,
        ComunifySubscriptionChargeModel,
        ComunifyOfferLadderModel,
        ComunifyVoiceCloningSamplesModel,
        ComunifyVoiceDistillationJobModel,
        ComunifyAuthorityVaultItemModel,
        ComunifyLeadQualificationRecordModel,
        ComunifyCommunityAuditLogModel,
        ComunifyPlanTierConfigModel,
    ]


def test_all_16_models_importable(all_models: list) -> None:
    """A1: All 16 model classes can be imported without error."""
    assert len(all_models) == 16


EXPECTED_TABLE_NAMES = {
    "comunify_cohorts",
    "comunify_cohort_members",
    "comunify_cohort_broadcasts",
    "comunify_cohort_broadcast_recipients",
    "comunify_community_posts",
    "comunify_community_post_attachments",
    "comunify_community_moderation_events",
    "comunify_subscriptions",
    "comunify_subscription_charges",
    "comunify_offer_ladders",
    "comunify_voice_cloning_samples",
    "comunify_voice_distillation_jobs",
    "comunify_authority_vault_items",
    "comunify_lead_qualification_records",
    "comunify_community_audit_log",
    "comunify_plan_tier_configs",
}


def test_all_16_tables_registered_in_base_metadata(all_models: list) -> None:
    """A1: All 16 tables appear in Base.metadata after model import."""
    registered = set(Base.metadata.tables.keys())
    missing = EXPECTED_TABLE_NAMES - registered
    assert not missing, f"Tables not registered in Base.metadata: {missing}"


# ---------------------------------------------------------------------------
# A2 — tenant_id index present on all tenant-scoped models
# ---------------------------------------------------------------------------

# comunify_plan_tier_configs is CROSS-TENANT (no tenant_id)
TENANT_SCOPED_TABLE_NAMES = EXPECTED_TABLE_NAMES - {"comunify_plan_tier_configs"}


@pytest.mark.parametrize("table_name", sorted(TENANT_SCOPED_TABLE_NAMES))
def test_tenant_scoped_models_have_tenant_id_column(table_name: str) -> None:
    """A2 (part 1): Each tenant-scoped table has a tenant_id column."""
    table = Base.metadata.tables[table_name]
    assert "tenant_id" in table.c, f"{table_name} missing tenant_id column (tenant isolation rule)"


@pytest.mark.parametrize("table_name", sorted(TENANT_SCOPED_TABLE_NAMES))
def test_tenant_scoped_models_have_tenant_id_index(table_name: str) -> None:
    """A2 (part 2): Each tenant-scoped table has an index covering tenant_id."""
    table = Base.metadata.tables[table_name]
    indexed_columns = set()
    for idx in table.indexes:
        for col in idx.columns:
            indexed_columns.add(col.name)
    assert "tenant_id" in indexed_columns, f"{table_name} missing index on tenant_id (tenant isolation rule)"


# ---------------------------------------------------------------------------
# Soft-delete tables have deleted_at column
# ---------------------------------------------------------------------------

SOFT_DELETE_TABLE_NAMES = {
    "comunify_cohorts",
    "comunify_cohort_members",
    "comunify_cohort_broadcasts",
    "comunify_community_posts",
    "comunify_subscriptions",
    "comunify_authority_vault_items",
}


@pytest.mark.parametrize("table_name", sorted(SOFT_DELETE_TABLE_NAMES))
def test_soft_delete_tables_have_deleted_at(table_name: str) -> None:
    """Soft-delete tables must carry a deleted_at nullable TIMESTAMPTZ column."""
    table = Base.metadata.tables[table_name]
    assert "deleted_at" in table.c, f"{table_name} missing deleted_at (soft-delete required per backend-ddd.md)"
    col = table.c["deleted_at"]
    assert col.nullable, f"{table_name}.deleted_at must be nullable"


# ---------------------------------------------------------------------------
# Immutable / no-deleted_at tables must NOT have deleted_at
# ---------------------------------------------------------------------------

NO_DELETED_AT_TABLE_NAMES = {
    "comunify_cohort_broadcast_recipients",
    "comunify_community_post_attachments",
    "comunify_community_moderation_events",
    "comunify_subscription_charges",
    "comunify_offer_ladders",
    "comunify_voice_cloning_samples",
    "comunify_voice_distillation_jobs",
    "comunify_lead_qualification_records",
    "comunify_community_audit_log",
    "comunify_plan_tier_configs",
}


@pytest.mark.parametrize("table_name", sorted(NO_DELETED_AT_TABLE_NAMES))
def test_immutable_tables_have_no_deleted_at(table_name: str) -> None:
    """Audit trail / immutable tables must NOT have deleted_at column."""
    table = Base.metadata.tables[table_name]
    assert "deleted_at" not in table.c, f"{table_name} must NOT have deleted_at (immutable record per arch spec)"


# ---------------------------------------------------------------------------
# Cross-tenant table must not have tenant_id
# ---------------------------------------------------------------------------


def test_plan_tier_configs_has_no_tenant_id() -> None:
    """comunify_plan_tier_configs is CROSS-TENANT — must not have tenant_id."""
    table = Base.metadata.tables["comunify_plan_tier_configs"]
    assert "tenant_id" not in table.c, "comunify_plan_tier_configs is a global catalog — tenant_id must not exist"
