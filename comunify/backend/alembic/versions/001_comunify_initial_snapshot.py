"""Comunify initial snapshot — all 16 tables idempotent (Story 12 T-be-1).

Single consolidated migration per Story 10/11 T-10 cement pattern.
Raw SQL IF NOT EXISTS everywhere — NEVER op.create_table() / sa.Enum(create_type=True).

Tables (16):
  comunify_cohorts                        — tenant-scoped, soft-delete
  comunify_cohort_members                 — tenant-scoped, soft-delete
  comunify_cohort_broadcasts              — tenant-scoped, soft-delete
  comunify_cohort_broadcast_recipients    — tenant-scoped, no deleted_at (delivery record)
  comunify_community_posts                — tenant-scoped, soft-delete
  comunify_community_post_attachments     — tenant-scoped, no deleted_at (asset record)
  comunify_community_moderation_events    — tenant-scoped, no deleted_at (audit trail)
  comunify_subscriptions                  — tenant-scoped, soft-delete
  comunify_subscription_charges          — tenant-scoped, no deleted_at (financial record)
  comunify_offer_ladders                  — tenant-scoped, 1-per-tenant
  comunify_voice_cloning_samples         — tenant-scoped, 1-per-tenant
  comunify_voice_distillation_jobs        — tenant-scoped, no deleted_at (job audit)
  comunify_authority_vault_items          — tenant-scoped, soft-delete
  comunify_lead_qualification_records     — tenant-scoped, no deleted_at (snapshot record)
  comunify_community_audit_log            — tenant-scoped, IMMUTABLE (no deleted_at, 5-year retention)
  comunify_plan_tier_configs              — CROSS-TENANT (global catalog, no tenant_id)

Decisions honored: D1 (brand isolation independent chain), D7 (idempotent snapshot),
D15 (raw SQL IF NOT EXISTS), D18 (independent alembic chain — down_revision=None).

Revision ID: 001_comunify
Revises: None  (independent comunify alembic chain)
Create Date: 2026-05-15
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "001_comunify"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all 16 comunify tables idempotent — IF NOT EXISTS everywhere."""

    # ─────────────────────────────────────────────────────────────────────────
    # ENUM TYPES (idempotent via DO $$ BEGIN ... EXCEPTION WHEN duplicate_object)
    # NEVER sa.Enum(create_type=True) — broken SA 2.0.27
    # ─────────────────────────────────────────────────────────────────────────

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_cohort_status AS ENUM (
                'draft',
                'enrollment_open',
                'enrollment_closed',
                'active',
                'completed',
                'archived'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_member_status AS ENUM (
                'active',
                'suspended',
                'dropped',
                'waitlisted'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_post_status AS ENUM (
                'pending_moderation',
                'approved',
                'rejected',
                'removed_by_creator'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_subscription_status AS ENUM (
                'active',
                'past_due',
                'suspended',
                'cancelled',
                'cancelled_pending_end_of_period'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_charge_status AS ENUM (
                'succeeded',
                'failed',
                'pending',
                'refunded'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_distillation_status AS ENUM (
                'queued',
                'running_wave_1',
                'running_wave_2',
                'running_wave_3',
                'completed',
                'failed'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_authority_vault_kind AS ENUM (
                'credentials',
                'case_studies',
                'press_mentions',
                'awards'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_audit_severity AS ENUM (
                'info',
                'medium',
                'high'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE comunify_payment_gateway AS ENUM (
                'mercadopago',
                'stripe_connect',
                'tokenized_recurring'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. comunify_cohorts
    #    Aggregate root for cohort lifecycle. Tenant-scoped + soft-delete.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_cohorts (
            id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL,
            name                VARCHAR(120)    NOT NULL,
            slug                VARCHAR(80)     NOT NULL,
            offer_id            UUID            NOT NULL,
            capacity_max        INTEGER         NOT NULL,
            capacity_filled     INTEGER         NOT NULL DEFAULT 0,
            capacity_waitlist   INTEGER         NOT NULL DEFAULT 0,
            start_date          DATE            NOT NULL,
            end_date            DATE            NOT NULL,
            status              VARCHAR(32)     NOT NULL DEFAULT 'draft',
            enrollment_criteria JSONB           NOT NULL DEFAULT '{}'::jsonb,
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            deleted_at          TIMESTAMPTZ,
            CONSTRAINT pk_comunify_cohorts PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohorts_tenant_id"
        " ON comunify_cohorts (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohorts_tenant_status"
        " ON comunify_cohorts (tenant_id, status);"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_comunify_cohorts_tenant_slug"
        " ON comunify_cohorts (tenant_id, slug);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 2. comunify_cohort_members
    #    Per-subscriber enrollment within a cohort. Soft-delete.
    #    UNIQUE (tenant_id, cohort_id, subscriber_id) — no double enrollments.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_cohort_members (
            id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id               UUID            NOT NULL,
            cohort_id               UUID            NOT NULL,
            subscriber_id           UUID            NOT NULL,
            tier                    VARCHAR(32)     NOT NULL DEFAULT 'regular',
            status                  VARCHAR(32)     NOT NULL DEFAULT 'active',
            engagement_score        INTEGER         NOT NULL DEFAULT 50,
            last_active_at          TIMESTAMPTZ,
            enrollment_at           TIMESTAMPTZ     NOT NULL,
            waitlist_position       INTEGER,
            pre_moderation_count    INTEGER         NOT NULL DEFAULT 3,
            created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            deleted_at              TIMESTAMPTZ,
            CONSTRAINT pk_comunify_cohort_members PRIMARY KEY (id),
            CONSTRAINT uq_cohort_member UNIQUE (tenant_id, cohort_id, subscriber_id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohort_members_tenant_id"
        " ON comunify_cohort_members (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohort_members_tenant_cohort"
        " ON comunify_cohort_members (tenant_id, cohort_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohort_members_subscriber"
        " ON comunify_cohort_members (subscriber_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 3. comunify_cohort_broadcasts
    #    Broadcast message metadata (content + audience). Soft-delete.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_cohort_broadcasts (
            id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL,
            cohort_id           UUID            NOT NULL,
            content             TEXT            NOT NULL,
            audience_filter     JSONB           NOT NULL DEFAULT '{}'::jsonb,
            sent_at             TIMESTAMPTZ,
            sent_count          INTEGER         NOT NULL DEFAULT 0,
            recipients_count    INTEGER         NOT NULL DEFAULT 0,
            status              VARCHAR(32)     NOT NULL DEFAULT 'draft',
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            deleted_at          TIMESTAMPTZ,
            CONSTRAINT pk_comunify_cohort_broadcasts PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohort_broadcasts_tenant_id"
        " ON comunify_cohort_broadcasts (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohort_broadcasts_tenant_cohort"
        " ON comunify_cohort_broadcasts (tenant_id, cohort_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_cohort_broadcasts_tenant_status"
        " ON comunify_cohort_broadcasts (tenant_id, status);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 4. comunify_cohort_broadcast_recipients
    #    Per-recipient delivery tracking. No deleted_at (delivery audit record).
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_cohort_broadcast_recipients (
            id              UUID        NOT NULL DEFAULT gen_random_uuid(),
            tenant_id       UUID        NOT NULL,
            broadcast_id    UUID        NOT NULL,
            member_id       UUID        NOT NULL,
            channel         VARCHAR(32) NOT NULL,
            delivered_at    TIMESTAMPTZ,
            opened_at       TIMESTAMPTZ,
            replied_at      TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_cohort_broadcast_recipients PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_broadcast_recipients_tenant_id"
        " ON comunify_cohort_broadcast_recipients (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_broadcast_recipients_broadcast"
        " ON comunify_cohort_broadcast_recipients (broadcast_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_broadcast_recipients_member"
        " ON comunify_cohort_broadcast_recipients (member_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 5. comunify_community_posts
    #    Community post aggregate. Tenant-scoped + soft-delete.
    #    cohort_id=NULL means community-wide post.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_community_posts (
            id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL,
            author_member_id    UUID            NOT NULL,
            cohort_id           UUID,
            content             TEXT            NOT NULL,
            status              VARCHAR(32)     NOT NULL DEFAULT 'pending_moderation',
            spam_score          NUMERIC(5, 4),
            nsfw_score          NUMERIC(5, 4),
            doxxing_detected    BOOLEAN         NOT NULL DEFAULT FALSE,
            moderation_result   JSONB,
            likes_count         INTEGER         NOT NULL DEFAULT 0,
            replies_count       INTEGER         NOT NULL DEFAULT 0,
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            deleted_at          TIMESTAMPTZ,
            CONSTRAINT pk_comunify_community_posts PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_posts_tenant_id"
        " ON comunify_community_posts (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_posts_tenant_status_created"
        " ON comunify_community_posts (tenant_id, status, created_at);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_posts_tenant_author"
        " ON comunify_community_posts (tenant_id, author_member_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 6. comunify_community_post_attachments
    #    Image/video asset metadata per post. No deleted_at (asset record).
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_community_post_attachments (
            id          UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id   UUID            NOT NULL,
            post_id     UUID            NOT NULL,
            url         TEXT            NOT NULL,
            mime_type   VARCHAR(64)     NOT NULL,
            size_bytes  INTEGER         NOT NULL,
            nsfw_score  NUMERIC(5, 4),
            created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_community_post_attachments PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_post_attachments_tenant_id"
        " ON comunify_community_post_attachments (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_post_attachments_post_id"
        " ON comunify_community_post_attachments (post_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 7. comunify_community_moderation_events
    #    Classifier history per post. No deleted_at (audit trail, immutable).
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_community_moderation_events (
            id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL,
            post_id             UUID            NOT NULL,
            classifier_version  VARCHAR(32)     NOT NULL,
            scores              JSONB           NOT NULL DEFAULT '{}'::jsonb,
            action              VARCHAR(64)     NOT NULL,
            actor_id            UUID,
            actor_type          VARCHAR(32),
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_community_moderation_events PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_moderation_events_tenant_id"
        " ON comunify_community_moderation_events (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_moderation_events_post_id"
        " ON comunify_community_moderation_events (post_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 8. comunify_subscriptions
    #    Recurring subscription aggregate root. Tenant-scoped + soft-delete.
    #    Handles both cohort_installments and monthly_membership plan kinds.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_subscriptions (
            id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id               UUID            NOT NULL,
            subscriber_id           UUID            NOT NULL,
            offer_id                UUID            NOT NULL,
            plan_kind               VARCHAR(32)     NOT NULL,
            status                  VARCHAR(32)     NOT NULL DEFAULT 'active',
            dunning_state           VARCHAR(32),
            started_at              TIMESTAMPTZ     NOT NULL,
            next_charge_at          TIMESTAMPTZ,
            access_until            TIMESTAMPTZ,
            cancellation_at         TIMESTAMPTZ,
            cancellation_reason     VARCHAR(512),
            installments_total      INTEGER,
            installments_completed  INTEGER         NOT NULL DEFAULT 0,
            monthly_amount          NUMERIC(14, 2),
            currency                CHAR(3)         NOT NULL,
            gateway                 VARCHAR(32)     NOT NULL,
            gateway_customer_id     VARCHAR(255),
            payment_method_token    VARCHAR(512),
            idempotency_key         VARCHAR(128)    UNIQUE,
            created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            deleted_at              TIMESTAMPTZ,
            CONSTRAINT pk_comunify_subscriptions PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_subscriptions_tenant_id"
        " ON comunify_subscriptions (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_subs_tenant_status"
        " ON comunify_subscriptions (tenant_id, status);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_subs_tenant_next_charge"
        " ON comunify_subscriptions (tenant_id, next_charge_at);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_subs_subscriber"
        " ON comunify_subscriptions (subscriber_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 9. comunify_subscription_charges
    #    Per-charge financial record. No deleted_at (financial record).
    #    UNIQUE (subscription_id, billing_period, installment_n) prevents dup charges.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_subscription_charges (
            id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL,
            subscription_id     UUID            NOT NULL,
            installment_n       INTEGER,
            billing_period      VARCHAR(7)      NOT NULL,
            amount              NUMERIC(14, 2)  NOT NULL,
            currency            CHAR(3)         NOT NULL,
            status              VARCHAR(32)     NOT NULL,
            gateway_charge_id   VARCHAR(255)    UNIQUE,
            failure_reason      VARCHAR(255),
            attempted_at        TIMESTAMPTZ     NOT NULL,
            succeeded_at        TIMESTAMPTZ,
            idempotency_key     VARCHAR(128)    UNIQUE,
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_subscription_charges PRIMARY KEY (id),
            CONSTRAINT uq_charge_period_installment
                UNIQUE (subscription_id, billing_period, installment_n)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_charges_tenant_id"
        " ON comunify_subscription_charges (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_charges_subscription_id"
        " ON comunify_subscription_charges (subscription_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_charges_tenant_status_attempted"
        " ON comunify_subscription_charges (tenant_id, status, attempted_at);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 10. comunify_offer_ladders
    #     4-level offer ladder per tenant (1 row per tenant, UNIQUE tenant_id).
    #     No deleted_at — singleton configuration record.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_offer_ladders (
            id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID        NOT NULL UNIQUE,
            level_1_offer_id    UUID,
            level_2_offer_id    UUID,
            level_3_offer_id    UUID,
            level_4_offer_id    UUID,
            gap_acknowledged    BOOLEAN     NOT NULL DEFAULT FALSE,
            completeness_score  INTEGER     NOT NULL DEFAULT 0,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_offer_ladders PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_offer_ladders_tenant_id"
        " ON comunify_offer_ladders (tenant_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 11. comunify_voice_cloning_samples
    #     Aggregate upload state (1 row per tenant, UNIQUE tenant_id).
    #     raw_samples_deleted_at tracks privacy deletion of raw upload files.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_voice_cloning_samples (
            id                          UUID        NOT NULL DEFAULT gen_random_uuid(),
            tenant_id                   UUID        NOT NULL UNIQUE,
            chats_count                 INTEGER     NOT NULL DEFAULT 0,
            voice_notes_count           INTEGER     NOT NULL DEFAULT 0,
            upload_history              JSONB       NOT NULL DEFAULT '[]'::jsonb,
            statistics_post_distill     JSONB,
            raw_samples_deleted_at      TIMESTAMPTZ,
            last_distillation_at        TIMESTAMPTZ,
            created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_voice_cloning_samples PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_voice_samples_tenant_id"
        " ON comunify_voice_cloning_samples (tenant_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 12. comunify_voice_distillation_jobs
    #     Async distillation job tracking. No deleted_at (job audit trail).
    #     cost_usd tracked for billing + budget guard integration.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_voice_distillation_jobs (
            id              UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id       UUID            NOT NULL,
            status          VARCHAR(32)     NOT NULL DEFAULT 'queued',
            samples_count   INTEGER         NOT NULL,
            started_at      TIMESTAMPTZ,
            completed_at    TIMESTAMPTZ,
            confidence_score NUMERIC(5, 4),
            compiled_blocks JSONB,
            error_reason    VARCHAR(512),
            cost_usd        NUMERIC(8, 4),
            ratified_at     TIMESTAMPTZ,
            created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_voice_distillation_jobs PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_voice_jobs_tenant_id"
        " ON comunify_voice_distillation_jobs (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_voice_jobs_tenant_status"
        " ON comunify_voice_distillation_jobs (tenant_id, status);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 13. comunify_authority_vault_items
    #     Polymorphic kind (credentials | case_studies | press_mentions | awards).
    #     Tenant-scoped + soft-delete. content JSONB per kind.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_authority_vault_items (
            id          UUID        NOT NULL DEFAULT gen_random_uuid(),
            tenant_id   UUID        NOT NULL,
            kind        VARCHAR(32) NOT NULL,
            title       VARCHAR(255) NOT NULL,
            content     JSONB       NOT NULL DEFAULT '{}'::jsonb,
            url         TEXT,
            display_order INTEGER   NOT NULL DEFAULT 0,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at  TIMESTAMPTZ,
            CONSTRAINT pk_comunify_authority_vault_items PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_authority_vault_tenant_id"
        " ON comunify_authority_vault_items (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_authority_vault_tenant_kind"
        " ON comunify_authority_vault_items (tenant_id, kind);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 14. comunify_lead_qualification_records
    #     Qualify-for-cohort snapshot. No deleted_at (snapshot record).
    #     lead_data JSONB preserves intake form at qualification time.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_lead_qualification_records (
            id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID            NOT NULL,
            lead_id             UUID            NOT NULL,
            cohort_id           UUID            NOT NULL,
            fit                 VARCHAR(32)     NOT NULL,
            recommended_tier    VARCHAR(32)     NOT NULL DEFAULT 'regular',
            fit_score           INTEGER         NOT NULL,
            lead_data           JSONB           NOT NULL DEFAULT '{}'::jsonb,
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_lead_qualification_records PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_lead_qual_tenant_id"
        " ON comunify_lead_qualification_records (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_lead_qual_tenant_cohort"
        " ON comunify_lead_qualification_records (tenant_id, cohort_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_lead_qual_lead_id"
        " ON comunify_lead_qualification_records (lead_id);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 15. comunify_community_audit_log
    #     Compliance + security events. IMMUTABLE — NO deleted_at.
    #     5-year retention. PII sanitized in payload_redacted (best-effort).
    #     append-only; actor_type: creator | sales_agent | moderator | system
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_community_audit_log (
            id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
            tenant_id           UUID        NOT NULL,
            event_type          VARCHAR(64) NOT NULL,
            severity            VARCHAR(16) NOT NULL,
            member_id           UUID,
            post_id             UUID,
            target_member_id    UUID,
            payload_redacted    JSONB       NOT NULL DEFAULT '{}'::jsonb,
            actor_id            UUID,
            actor_type          VARCHAR(32),
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_community_audit_log PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_audit_tenant_id"
        " ON comunify_community_audit_log (tenant_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_audit_event_type"
        " ON comunify_community_audit_log (event_type);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_audit_tenant_event_created"
        " ON comunify_community_audit_log (tenant_id, event_type, created_at);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_audit_tenant_severity_created"
        " ON comunify_community_audit_log (tenant_id, severity, created_at);"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 16. comunify_plan_tier_configs
    #     CROSS-TENANT catalog (global config, no tenant_id).
    #     plan_tier_slug: free | creator_starter | creator_pro | creator_business
    #     features_enabled JSONB: frozen set of enabled capability slugs.
    # ─────────────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS comunify_plan_tier_configs (
            id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
            plan_tier_slug      VARCHAR(64)     NOT NULL UNIQUE,
            display_name_es     VARCHAR(128)    NOT NULL,
            features_enabled    JSONB           NOT NULL DEFAULT '[]'::jsonb,
            price_usd_monthly   NUMERIC(12, 2)  NOT NULL,
            currency            CHAR(3)         NOT NULL DEFAULT 'USD',
            is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
            sort_order          INTEGER         NOT NULL DEFAULT 0,
            created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_comunify_plan_tier_configs PRIMARY KEY (id)
        );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_comunify_plan_tier_configs_is_active"
        " ON comunify_plan_tier_configs (is_active);"
    )


def downgrade() -> None:
    """Drop all comunify tables — dev iteration only; prod uses snapshot rebuild."""
    # Drop in reverse dependency order
    op.execute("DROP TABLE IF EXISTS comunify_plan_tier_configs;")
    op.execute("DROP TABLE IF EXISTS comunify_community_audit_log;")
    op.execute("DROP TABLE IF EXISTS comunify_lead_qualification_records;")
    op.execute("DROP TABLE IF EXISTS comunify_authority_vault_items;")
    op.execute("DROP TABLE IF EXISTS comunify_voice_distillation_jobs;")
    op.execute("DROP TABLE IF EXISTS comunify_voice_cloning_samples;")
    op.execute("DROP TABLE IF EXISTS comunify_offer_ladders;")
    op.execute("DROP TABLE IF EXISTS comunify_subscription_charges;")
    op.execute("DROP TABLE IF EXISTS comunify_subscriptions;")
    op.execute("DROP TABLE IF EXISTS comunify_community_moderation_events;")
    op.execute("DROP TABLE IF EXISTS comunify_community_post_attachments;")
    op.execute("DROP TABLE IF EXISTS comunify_community_posts;")
    op.execute("DROP TABLE IF EXISTS comunify_cohort_broadcast_recipients;")
    op.execute("DROP TABLE IF EXISTS comunify_cohort_broadcasts;")
    op.execute("DROP TABLE IF EXISTS comunify_cohort_members;")
    op.execute("DROP TABLE IF EXISTS comunify_cohorts;")

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS comunify_payment_gateway;")
    op.execute("DROP TYPE IF EXISTS comunify_audit_severity;")
    op.execute("DROP TYPE IF EXISTS comunify_authority_vault_kind;")
    op.execute("DROP TYPE IF EXISTS comunify_distillation_status;")
    op.execute("DROP TYPE IF EXISTS comunify_charge_status;")
    op.execute("DROP TYPE IF EXISTS comunify_subscription_status;")
    op.execute("DROP TYPE IF EXISTS comunify_post_status;")
    op.execute("DROP TYPE IF EXISTS comunify_member_status;")
    op.execute("DROP TYPE IF EXISTS comunify_cohort_status;")
