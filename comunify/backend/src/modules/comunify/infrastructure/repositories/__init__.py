"""Comunify infrastructure repositories package.

Exports all 13 async repositories. Each tenant-scoped repository
receives (session, tenant_id) at construction time, ensuring every
query is automatically scoped — callers cannot accidentally omit tenant_id.

Cross-tenant exception: PlanTierConfigRepository (global catalog, no tenant_id).
"""

from src.modules.comunify.infrastructure.repositories.authority_vault_repository import (
    AuthorityVaultRepository,
)
from src.modules.comunify.infrastructure.repositories.cohort_broadcast_repository import (
    CohortBroadcastRepository,
)
from src.modules.comunify.infrastructure.repositories.cohort_member_repository import (
    CohortMemberRepository,
)
from src.modules.comunify.infrastructure.repositories.cohort_repository import (
    CohortRepository,
)
from src.modules.comunify.infrastructure.repositories.community_audit_log_repository import (
    CommunityAuditLogRepository,
)
from src.modules.comunify.infrastructure.repositories.community_moderation_repository import (
    CommunityModerationRepository,
)
from src.modules.comunify.infrastructure.repositories.community_post_repository import (
    CommunityPostRepository,
)
from src.modules.comunify.infrastructure.repositories.lead_qualification_repository import (
    LeadQualificationRepository,
)
from src.modules.comunify.infrastructure.repositories.offer_ladder_repository import (
    OfferLadderRepository,
)
from src.modules.comunify.infrastructure.repositories.plan_tier_config_repository import (
    PlanTierConfigRepository,
)
from src.modules.comunify.infrastructure.repositories.subscription_charge_repository import (
    SubscriptionChargeRepository,
)
from src.modules.comunify.infrastructure.repositories.subscription_repository import (
    SubscriptionRepository,
)
from src.modules.comunify.infrastructure.repositories.voice_cloning_samples_repository import (
    VoiceCloningSamplesRepository,
)
from src.modules.comunify.infrastructure.repositories.voice_distillation_job_repository import (
    VoiceDistillationJobRepository,
)

__all__ = [
    "AuthorityVaultRepository",
    "CohortBroadcastRepository",
    "CohortMemberRepository",
    "CohortRepository",
    "CommunityAuditLogRepository",
    "CommunityModerationRepository",
    "CommunityPostRepository",
    "LeadQualificationRepository",
    "OfferLadderRepository",
    "PlanTierConfigRepository",
    "SubscriptionChargeRepository",
    "SubscriptionRepository",
    "VoiceCloningSamplesRepository",
    "VoiceDistillationJobRepository",
]
