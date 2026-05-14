"""Comunify infrastructure ORM models.

Exports all 16 SQLAlchemy 2.0 Mapped[] model classes.
All models inherit from luana_core_platform.domain.base_entity.Base,
registering their tables in the shared metadata singleton.

Usage:
    from src.modules.comunify.infrastructure.models import ComunifyCohortModel, ...

Tables (16):
  comunify_cohorts                       — tenant-scoped, soft-delete
  comunify_cohort_members                — tenant-scoped, soft-delete
  comunify_cohort_broadcasts             — tenant-scoped, soft-delete
  comunify_cohort_broadcast_recipients   — tenant-scoped, no deleted_at
  comunify_community_posts               — tenant-scoped, soft-delete
  comunify_community_post_attachments    — tenant-scoped, no deleted_at
  comunify_community_moderation_events   — tenant-scoped, no deleted_at
  comunify_subscriptions                 — tenant-scoped, soft-delete
  comunify_subscription_charges          — tenant-scoped, no deleted_at
  comunify_offer_ladders                 — tenant-scoped, no deleted_at
  comunify_voice_cloning_samples         — tenant-scoped, no deleted_at
  comunify_voice_distillation_jobs       — tenant-scoped, no deleted_at
  comunify_authority_vault_items         — tenant-scoped, soft-delete
  comunify_lead_qualification_records    — tenant-scoped, no deleted_at
  comunify_community_audit_log           — tenant-scoped, IMMUTABLE
  comunify_plan_tier_configs             — CROSS-TENANT, no tenant_id
"""

from __future__ import annotations

from src.modules.comunify.infrastructure.models.authority_vault_item_model import (
    ComunifyAuthorityVaultItemModel,
)
from src.modules.comunify.infrastructure.models.cohort_broadcast_model import (
    ComunifyCohortBroadcastModel,
)
from src.modules.comunify.infrastructure.models.cohort_broadcast_recipient_model import (
    ComunifyCohortBroadcastRecipientModel,
)
from src.modules.comunify.infrastructure.models.cohort_member_model import (
    ComunifyCohortMemberModel,
)
from src.modules.comunify.infrastructure.models.cohort_model import (
    ComunifyCohortModel,
)
from src.modules.comunify.infrastructure.models.community_audit_log_model import (
    ComunifyCommunityAuditLogModel,
)
from src.modules.comunify.infrastructure.models.community_moderation_event_model import (
    ComunifyCommunityModerationEventModel,
)
from src.modules.comunify.infrastructure.models.community_post_attachment_model import (
    ComunifyCommunityPostAttachmentModel,
)
from src.modules.comunify.infrastructure.models.community_post_model import (
    ComunifyCommunityPostModel,
)
from src.modules.comunify.infrastructure.models.lead_qualification_record_model import (
    ComunifyLeadQualificationRecordModel,
)
from src.modules.comunify.infrastructure.models.offer_ladder_model import (
    ComunifyOfferLadderModel,
)
from src.modules.comunify.infrastructure.models.plan_tier_config_model import (
    ComunifyPlanTierConfigModel,
)
from src.modules.comunify.infrastructure.models.subscription_charge_model import (
    ComunifySubscriptionChargeModel,
)
from src.modules.comunify.infrastructure.models.subscription_model import (
    ComunifySubscriptionModel,
)
from src.modules.comunify.infrastructure.models.voice_cloning_samples_model import (
    ComunifyVoiceCloningSamplesModel,
)
from src.modules.comunify.infrastructure.models.voice_distillation_job_model import (
    ComunifyVoiceDistillationJobModel,
)

__all__ = [
    "ComunifyCohortModel",
    "ComunifyCohortMemberModel",
    "ComunifyCohortBroadcastModel",
    "ComunifyCohortBroadcastRecipientModel",
    "ComunifyCommunityPostModel",
    "ComunifyCommunityPostAttachmentModel",
    "ComunifyCommunityModerationEventModel",
    "ComunifySubscriptionModel",
    "ComunifySubscriptionChargeModel",
    "ComunifyOfferLadderModel",
    "ComunifyVoiceCloningSamplesModel",
    "ComunifyVoiceDistillationJobModel",
    "ComunifyAuthorityVaultItemModel",
    "ComunifyLeadQualificationRecordModel",
    "ComunifyCommunityAuditLogModel",
    "ComunifyPlanTierConfigModel",
]
