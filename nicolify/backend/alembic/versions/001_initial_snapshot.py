"""Consolidated initial schema snapshot (Story 10 T-10).

Single source-of-truth migration consolidating 131 prior alembic versions
(086_llm_call_cost_usd_nullable + 127_add_eval_simulator_grade_tables heads)
into one idempotent snapshot. Generated from `pg_dump --schema-only -U postgres
visionarias_logs` on 2026-05-14.

Includes (alembic_version table excluded — managed by alembic itself):
- 2 extensions (pg_trgm, uuid-ossp)
- 5 enum types (identitytype, lifecyclestage, paymentmethod, identitysource, conversationstate)
- 114 tables (all public schema except alembic_version)
- ~290 indexes (incl. constraint-implicit)
- ~130 unique/check constraints
- 73 foreign-key constraints
- 1 PL/pgSQL function (compute_cycle_start)
- 2 materialized views (mv_daily_llm_cost_per_tenant + v2)

Order (DAG-safe): EXTENSION → TYPE → SEQUENCE → TABLE → FUNCTION →
MATERIALIZED VIEW → DEFAULT → INDEX → CONSTRAINT → FK CONSTRAINT.

Idempotency strategy (per backend-migrations.md):
- CREATE TABLE → CREATE TABLE IF NOT EXISTS
- CREATE INDEX → CREATE [UNIQUE] INDEX IF NOT EXISTS
- CREATE SEQUENCE → CREATE SEQUENCE IF NOT EXISTS
- CREATE TYPE → DO $$ BEGIN ... EXCEPTION WHEN duplicate_object $$
- ADD CONSTRAINT → DO $$ IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ...) $$
- CREATE FUNCTION → CREATE OR REPLACE FUNCTION
- CREATE MATERIALIZED VIEW → CREATE MATERIALIZED VIEW IF NOT EXISTS

Revision ID: 001_initial_snapshot
Revises:
Create Date: 2026-05-14
"""
from alembic import op

# revision identifiers
revision = "001_initial_snapshot"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply consolidated schema snapshot."""
    op.execute("""
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
""")
    op.execute("""
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
""")
    op.execute("""
DO $$ BEGIN
    CREATE TYPE public.identitytype AS ENUM (
    'EMAIL',
    'PHONE',
    'COOKIE_ID',
    'USER_ID',
    'DEVICE_ID',
    'SOCIAL_HANDLE',
    'EXTERNAL_ID',
    'whatsapp',
    'telegram',
    'instagram',
    'tiktok',
    'TELEGRAM',
    'WHATSAPP',
    'INSTAGRAM',
    'TIKTOK',
    'email',
    'phone',
    'cookie_id',
    'user_id',
    'device_id',
    'social_handle',
    'external_id'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    CREATE TYPE public.lifecyclestage AS ENUM (
    'STAGE_VISITOR',
    'STAGE_LEAD',
    'STAGE_MQL',
    'STAGE_SQL',
    'STAGE_OPPORTUNITY',
    'STAGE_CUSTOMER',
    'STAGE_EVANGELIST',
    'SUBSCRIBER',
    'LEAD',
    'MQL',
    'SQL',
    'OPPORTUNITY',
    'CUSTOMER',
    'EVANGELIST',
    'CHURNED',
    'subscriber',
    'lead',
    'mql',
    'sql',
    'opportunity',
    'customer',
    'evangelist',
    'churned'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    CREATE TYPE public.paymentmethod AS ENUM (
    'CREDIT_CARD',
    'WIRE',
    'CASH',
    'STRIPE',
    'PAYPAL',
    'MANUAL'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    CREATE TYPE public.salestage AS ENUM (
    'CONVERSION',
    'EXPANSION'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    CREATE TYPE public.salestatus AS ENUM (
    'COMPLETED',
    'REFUNDED',
    'PENDING',
    'FAILED'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.ad_campaign_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    offer_archetype character varying(50) NOT NULL,
    offer_onboarding_action character varying(50),
    offer_is_lead_magnet boolean,
    name character varying(255) NOT NULL,
    description text,
    recommended_objective character varying(50) NOT NULL,
    recommended_optimization_goal character varying(100),
    recommended_destination_type character varying(100),
    structure_hints jsonb DEFAULT '{}'::jsonb,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying(50) DEFAULT 'meta'::character varying NOT NULL,
    external_id character varying(255) NOT NULL,
    name character varying(500) NOT NULL,
    objective character varying(100),
    status character varying(50),
    effective_status character varying(50),
    bid_strategy character varying(100),
    daily_budget bigint,
    lifetime_budget bigint,
    budget_remaining bigint,
    buying_type character varying(50) DEFAULT 'AUCTION'::character varying,
    special_ad_categories jsonb DEFAULT '[]'::jsonb,
    start_time timestamp with time zone,
    stop_time timestamp with time zone,
    external_created_time timestamp with time zone,
    external_updated_time timestamp with time zone,
    extra jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.ad_offer_associations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying(50) DEFAULT 'meta'::character varying NOT NULL,
    target_type character varying(20) NOT NULL,
    target_external_id character varying(255) NOT NULL,
    offer_id uuid,
    association_type character varying(50) NOT NULL,
    confidence character varying(20),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.ad_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying(50) DEFAULT 'meta'::character varying NOT NULL,
    source character varying(50) DEFAULT 'account'::character varying NOT NULL,
    recommendation_type character varying(100) NOT NULL,
    object_ids jsonb DEFAULT '[]'::jsonb,
    title character varying(500),
    body text,
    blame_field character varying(100),
    importance character varying(20),
    confidence character varying(20),
    lift_estimate character varying(100),
    opportunity_score double precision,
    url text,
    recommendation_signature character varying(500),
    extra jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.ad_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying(50) DEFAULT 'meta'::character varying NOT NULL,
    external_id character varying(255) NOT NULL,
    campaign_external_id character varying(255) NOT NULL,
    name character varying(500) NOT NULL,
    status character varying(50),
    effective_status character varying(50),
    optimization_goal character varying(100),
    billing_event character varying(100),
    bid_strategy character varying(100),
    daily_budget bigint,
    lifetime_budget bigint,
    budget_remaining bigint,
    targeting jsonb DEFAULT '{}'::jsonb,
    destination_type character varying(100),
    learning_stage character varying(50),
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    extra jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying(50) DEFAULT 'meta'::character varying NOT NULL,
    external_id character varying(255) NOT NULL,
    campaign_external_id character varying(255) NOT NULL,
    ad_set_external_id character varying(255) NOT NULL,
    name character varying(500) NOT NULL,
    status character varying(50),
    effective_status character varying(50),
    creative_id character varying(255),
    creative_thumbnail_url text,
    creative_image_url text,
    creative_video_id character varying(255),
    creative_title character varying(500),
    creative_body text,
    creative_cta character varying(100),
    creative_link_url text,
    preview_shareable_link text,
    extra jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.agent_state_checkpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying(255) NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    customer_profile_id uuid,
    channel_type character varying(50),
    current_stage character varying(50) DEFAULT 'rapport'::character varying NOT NULL,
    lead_score integer DEFAULT 0 NOT NULL,
    lead_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    buying_signals jsonb DEFAULT '[]'::jsonb NOT NULL,
    objection_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    qualification_answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    turn_count integer DEFAULT 0 NOT NULL,
    last_specialist character varying(50),
    close_strategy character varying(50),
    metadata_info jsonb,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    handler_mode character varying(20) DEFAULT 'ai'::character varying NOT NULL,
    paused_at timestamp with time zone,
    paused_by uuid,
    resume_objective text,
    frozen_reason character varying(100),
    frozen_at timestamp with time zone,
    frozen_diagnosis jsonb,
    last_human_message_at timestamp with time zone,
    unread_count integer DEFAULT 0 NOT NULL,
    consecutive_questions integer DEFAULT 0 NOT NULL,
    follow_up_cadence jsonb,
    scheduled_meetings jsonb DEFAULT '[]'::jsonb NOT NULL,
    payment_state jsonb DEFAULT '[]'::jsonb NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.agent_traces (
    id uuid NOT NULL,
    user_id uuid,
    session_id character varying,
    node_name character varying NOT NULL,
    input_state jsonb,
    output_state jsonb,
    execution_time_ms double precision,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid,
    action character varying,
    reward double precision,
    feedback text
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid NOT NULL,
    user_id uuid,
    product_id uuid,
    start_time timestamp with time zone NOT NULL,
    status character varying,
    meeting_link character varying,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid,
    lead_id uuid,
    summary character varying DEFAULT ''::character varying NOT NULL,
    end_time timestamp with time zone NOT NULL,
    external_event_id character varying,
    metadata_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.asset_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    entity_type character varying(40) NOT NULL,
    entity_id uuid NOT NULL,
    role character varying(40) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    offer_id uuid,
    type character varying DEFAULT 'IMAGE'::character varying,
    filename character varying NOT NULL,
    mime_type character varying,
    storage_provider character varying DEFAULT 'LOCAL'::character varying,
    storage_path character varying,
    public_url character varying NOT NULL,
    file_path character varying DEFAULT ''::character varying,
    user_description text,
    ai_metadata jsonb DEFAULT '{}'::jsonb,
    ai_description text,
    ai_colors jsonb DEFAULT '[]'::jsonb,
    status character varying DEFAULT 'processing'::character varying,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    scope character varying(20) DEFAULT 'ephemeral'::character varying NOT NULL,
    purpose character varying(40) DEFAULT 'context_extract'::character varying NOT NULL,
    extracted_text text,
    extracted_summary character varying(500),
    extracted_at timestamp with time zone,
    extraction_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    extraction_error text,
    expires_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.authority_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    entity_name character varying(255) NOT NULL,
    authority_type character varying(40) NOT NULL,
    context text,
    proof_url text,
    logo_url text,
    obtained_at date,
    expires_at date,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.avatar_definitions (
    id uuid NOT NULL,
    user_id uuid,
    name character varying NOT NULL,
    is_default boolean,
    scope character varying,
    icp_description text,
    anti_avatar text,
    voice_tone_config jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.avatars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    user_id uuid,
    name character varying NOT NULL,
    scope character varying DEFAULT 'GLOBAL'::character varying,
    icp_description text,
    anti_avatar text,
    voice_tone_config jsonb DEFAULT '{}'::jsonb,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.booking_links (
    id uuid NOT NULL,
    tenant_id uuid,
    lead_id uuid NOT NULL,
    event_slug character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    status character varying,
    created_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.brand_extraction_traces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    job_id character varying NOT NULL,
    mode character varying NOT NULL,
    profile_name character varying NOT NULL,
    url text,
    include_visuals character varying DEFAULT 'false'::character varying,
    include_assets character varying DEFAULT 'false'::character varying,
    status character varying DEFAULT 'running'::character varying NOT NULL,
    content_length integer DEFAULT 0,
    sections_total integer DEFAULT 0,
    sections_succeeded integer DEFAULT 0,
    total_duration_s double precision,
    error_message text,
    events jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.brand_summary (
    tenant_id uuid NOT NULL,
    summary text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    model_used text NOT NULL,
    chars_count integer NOT NULL,
    last_section_changed text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT brand_summary_chars_count_check CHECK ((chars_count <= 1000))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.buyer_personas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    tagline text,
    scope character varying(20) DEFAULT 'GLOBAL'::character varying NOT NULL,
    offer_id uuid,
    is_primary boolean DEFAULT false NOT NULL,
    demographics jsonb DEFAULT '{}'::jsonb NOT NULL,
    psychographics jsonb DEFAULT '{}'::jsonb NOT NULL,
    pain_points jsonb DEFAULT '[]'::jsonb NOT NULL,
    desires jsonb DEFAULT '[]'::jsonb NOT NULL,
    buyer_journey jsonb DEFAULT '{}'::jsonb NOT NULL,
    purchase_triggers jsonb DEFAULT '[]'::jsonb NOT NULL,
    anti_patterns jsonb DEFAULT '[]'::jsonb NOT NULL,
    completeness_score double precision DEFAULT 0.0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.campaign (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(2000),
    campaign_type character varying(32) NOT NULL,
    status character varying(16) DEFAULT 'draft'::character varying NOT NULL,
    segment_id uuid,
    segment_snapshot_id uuid,
    channel_priority jsonb DEFAULT '[]'::jsonb NOT NULL,
    offer_id uuid,
    brand_summary_id uuid,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    scheduled_at timestamp with time zone,
    launched_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_by_user_id uuid,
    created_by_source character varying(32) DEFAULT 'api'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_campaign_status_values CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'scheduled'::character varying, 'running'::character varying, 'paused'::character varying, 'completed'::character varying, 'canceled'::character varying])::text[]))),
    CONSTRAINT chk_campaign_type_values CHECK (((campaign_type)::text = ANY ((ARRAY['agent_conversation'::character varying, 'email_drip'::character varying, 'email_broadcast'::character varying, 'event_trigger'::character varying, 'push_notification'::character varying, 'retargeting_export'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.campaign_audit (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    campaign_id uuid,
    campaign_task_id uuid,
    event_type character varying(50) NOT NULL,
    actor character varying(50) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_campaign_audit_actor_nonempty CHECK ((length((actor)::text) > 0)),
    CONSTRAINT ck_campaign_audit_event_type_nonempty CHECK ((length((event_type)::text) > 0))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.campaign_llm_call (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    channel_type character varying(32) NOT NULL,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    role character varying(32) NOT NULL,
    provider character varying(32) NOT NULL,
    model_requested character varying(128) NOT NULL,
    model_responded character varying(128) NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    cached_read_tokens integer DEFAULT 0 NOT NULL,
    cached_write_tokens integer DEFAULT 0 NOT NULL,
    reasoning_tokens integer DEFAULT 0 NOT NULL,
    pricing_version_id uuid NOT NULL,
    input_unit_cost_usd numeric(14,12) NOT NULL,
    output_unit_cost_usd numeric(14,12) NOT NULL,
    cached_read_unit_cost_usd numeric(14,12) DEFAULT 0 NOT NULL,
    cost_usd numeric(16,10) NOT NULL,
    tenant_currency character(3),
    fx_rate_to_tenant numeric(16,8),
    fx_rate_source character varying(32),
    cost_tenant_currency numeric(16,8),
    started_at timestamp with time zone NOT NULL,
    duration_ms integer NOT NULL,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    error_type character varying(64),
    occurred_on date GENERATED ALWAYS AS (((started_at AT TIME ZONE 'UTC'::text))::date) STORED,
    occurred_year_month character varying(7) GENERATED ALWAYS AS (((((EXTRACT(year FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text || '-'::text) || lpad(((EXTRACT(month FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text, 2, '0'::text))) STORED
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.campaign_step (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    step_type character varying(32) NOT NULL,
    step_index integer NOT NULL,
    label character varying(128),
    next_step_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    step_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_step_index_nonneg CHECK ((step_index >= 0)),
    CONSTRAINT chk_step_type_values CHECK (((step_type)::text = ANY ((ARRAY['send_message'::character varying, 'wait_delay'::character varying, 'branch_on_condition'::character varying, 'call_subagent_brief'::character varying, 'mark_complete'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.campaign_task (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    step_id uuid,
    status character varying(16) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    dispatched_at timestamp with time zone,
    sent_at timestamp with time zone,
    executed_at timestamp with time zone,
    channel_used character varying(32),
    external_message_id character varying(255),
    attempt_count integer DEFAULT 0 NOT NULL,
    last_error character varying(2000),
    compliance_check jsonb,
    outbox_event_id uuid,
    idempotency_key character varying(256) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_task_attempt_count_nonneg CHECK ((attempt_count >= 0)),
    CONSTRAINT chk_task_status_values CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'scheduled'::character varying, 'dispatched'::character varying, 'sent'::character varying, 'failed'::character varying, 'skipped'::character varying, 'bounced'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.campaign_template (
    id uuid NOT NULL,
    tenant_id uuid,
    slug character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    description character varying(2000) NOT NULL,
    campaign_type character varying(32) NOT NULL,
    template_body jsonb DEFAULT '{}'::jsonb NOT NULL,
    recommended_segment_slugs jsonb DEFAULT '[]'::jsonb NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_tpl_slug_format CHECK (((slug)::text ~ '^[a-z0-9_-]+$'::text)),
    CONSTRAINT chk_tpl_type_values CHECK (((campaign_type)::text = ANY ((ARRAY['agent_conversation'::character varying, 'email_drip'::character varying, 'email_broadcast'::character varying, 'event_trigger'::character varying, 'push_notification'::character varying, 'retargeting_export'::character varying])::text[]))),
    CONSTRAINT chk_tpl_version_pos CHECK ((version >= 1))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.campaign_trace_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    channel_type character varying(32) NOT NULL,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    event_type character varying(32) NOT NULL,
    name character varying(128),
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    duration_ms integer,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.channel_blacklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    channel character varying(32) NOT NULL,
    identifier character varying(255) NOT NULL,
    reason character varying(255),
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.channel_connections (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    channel_type character varying NOT NULL,
    credentials jsonb,
    config jsonb,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.channel_cost_settings (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    channel_slug character varying NOT NULL,
    cost_type character varying NOT NULL,
    monthly_amount double precision NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    proration_category character varying,
    description character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.commercial_calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    country_code character varying(2) NOT NULL,
    date date NOT NULL,
    year integer NOT NULL,
    week_number integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_backfill_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    run_id uuid NOT NULL,
    tenant_id uuid,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    mode text NOT NULL,
    convs_scanned integer DEFAULT 0 NOT NULL,
    convs_updated integer DEFAULT 0 NOT NULL,
    msgs_legacy_converted integer DEFAULT 0 NOT NULL,
    convs_skipped_corrupt integer DEFAULT 0 NOT NULL,
    failed_conv_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text NOT NULL,
    error_message text,
    git_sha text,
    CONSTRAINT copilot_backfill_runs_mode_check CHECK ((mode = ANY (ARRAY['dry_run'::text, 'apply'::text]))),
    CONSTRAINT copilot_backfill_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'completed'::text, 'aborted'::text, 'failed'::text])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_channel_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    channel_type character varying(32) NOT NULL,
    channel_user_id character varying(64) NOT NULL,
    channel_username character varying(64),
    role character varying(32) DEFAULT 'owner'::character varying NOT NULL,
    linked_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone,
    revoked_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255),
    messages jsonb DEFAULT '[]'::jsonb NOT NULL,
    client_context jsonb,
    summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    deleted_at timestamp with time zone,
    summary_updated_at timestamp with time zone,
    summary_dirty_at timestamp with time zone,
    message_count integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    last_tier_used text,
    title_auto_generated boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    procedure_id uuid,
    procedure_state jsonb,
    plan_state jsonb,
    workflow_state jsonb,
    channel_type character varying(32),
    channel_chat_id character varying(64)
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    conversation_id uuid,
    event_type character varying(50) NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    route character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_inspiration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    slug text NOT NULL,
    url text NOT NULL,
    why text DEFAULT ''::text NOT NULL,
    domain text NOT NULL,
    title text,
    summary text NOT NULL,
    sub_elements jsonb DEFAULT '{}'::jsonb NOT NULL,
    brand_relevance_score numeric(3,2) DEFAULT 0.5 NOT NULL,
    content_md text NOT NULL,
    og_image text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_link_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_hash character varying(128) NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_llm_call (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    conversation_id uuid,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    role character varying(32) NOT NULL,
    provider character varying(32) NOT NULL,
    model_requested character varying(128) NOT NULL,
    model_responded character varying(128) NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    cached_read_tokens integer DEFAULT 0 NOT NULL,
    cached_write_tokens integer DEFAULT 0 NOT NULL,
    reasoning_tokens integer DEFAULT 0 NOT NULL,
    pricing_version_id uuid NOT NULL,
    input_unit_cost_usd numeric(14,12) NOT NULL,
    output_unit_cost_usd numeric(14,12) NOT NULL,
    cached_read_unit_cost_usd numeric(14,12) DEFAULT 0 NOT NULL,
    cost_usd numeric(16,10),
    tenant_currency character(3),
    fx_rate_to_tenant numeric(16,8),
    fx_rate_source character varying(32),
    cost_tenant_currency numeric(16,8),
    started_at timestamp with time zone NOT NULL,
    duration_ms integer NOT NULL,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    error_type character varying(64),
    occurred_on date GENERATED ALWAYS AS (((started_at AT TIME ZONE 'UTC'::text))::date) STORED,
    occurred_year_month character varying(7) GENERATED ALWAYS AS (((((EXTRACT(year FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text || '-'::text) || lpad(((EXTRACT(month FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text, 2, '0'::text))) STORED
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_mutation_journal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    message_id uuid NOT NULL,
    domain text NOT NULL,
    entity_id uuid,
    field_path text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    reverted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_pinned_memory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    path text NOT NULL,
    content text NOT NULL,
    pinned_from_conversation_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_routing_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    message_id uuid NOT NULL,
    role_selected text NOT NULL,
    classifier_used text NOT NULL,
    reason text NOT NULL,
    confidence numeric(4,3),
    user_msg_length integer NOT NULL,
    tools_available integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_tenant_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    voice_rpm_override integer,
    media_max_bytes_override bigint,
    updated_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_copilot_tenant_limits_media_bytes_positive CHECK (((media_max_bytes_override IS NULL) OR (media_max_bytes_override > 0))),
    CONSTRAINT chk_copilot_tenant_limits_media_bytes_upper CHECK (((media_max_bytes_override IS NULL) OR (media_max_bytes_override <= 104857600))),
    CONSTRAINT chk_copilot_tenant_limits_voice_rpm_cap CHECK (((voice_rpm_override IS NULL) OR (voice_rpm_override <= 1000))),
    CONSTRAINT chk_copilot_tenant_limits_voice_rpm_positive CHECK (((voice_rpm_override IS NULL) OR (voice_rpm_override > 0)))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_tenant_limits_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    action character varying(16) NOT NULL,
    voice_rpm_before integer,
    voice_rpm_after integer,
    media_max_bytes_before bigint,
    media_max_bytes_after bigint,
    changed_by_user_id uuid,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_copilot_tenant_limits_audit_action CHECK (((action)::text = ANY ((ARRAY['upsert'::character varying, 'soft_delete'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_trace_event (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    conversation_id uuid,
    message_id uuid,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    event_type character varying(32) NOT NULL,
    name character varying(128),
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    duration_ms integer,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.copilot_workflow_metric (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    workflow_id text NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    started_count integer DEFAULT 0 NOT NULL,
    completed_count integer DEFAULT 0 NOT NULL,
    abandoned_count integer DEFAULT 0 NOT NULL,
    avg_turns_to_completion double precision,
    accept_rate numeric(4,3),
    abandon_node text,
    judge_avg_score numeric(4,2),
    judge_sample_size integer DEFAULT 0 NOT NULL,
    extra_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.customer_identities (
    id uuid NOT NULL,
    profile_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    type public.identitytype NOT NULL,
    value character varying NOT NULL,
    is_primary boolean,
    is_verified boolean,
    verified_at timestamp with time zone,
    source character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    verification_status character varying DEFAULT 'unverified'::character varying,
    last_seen_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    lifecycle_stage public.lifecyclestage,
    last_seen_at timestamp with time zone,
    total_sessions integer,
    total_ltv integer,
    properties jsonb,
    tags character varying[],
    computed_traits jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    full_name character varying,
    primary_email character varying,
    primary_phone character varying,
    rfm_segment character varying,
    traits jsonb DEFAULT '{}'::jsonb,
    lead_score double precision DEFAULT 0.0,
    lifetime_value double precision DEFAULT 0,
    last_activity_at timestamp with time zone,
    is_inactive boolean DEFAULT false,
    first_conversion_at timestamp with time zone,
    first_seen_at timestamp with time zone,
    lead_source character varying,
    lead_source_detail character varying
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid NOT NULL,
    filename character varying NOT NULL,
    collection_name character varying NOT NULL,
    category character varying,
    chunk_count integer,
    upload_date timestamp with time zone DEFAULT now(),
    status character varying,
    metadata_info jsonb,
    scope character varying,
    product_id uuid,
    marketing_asset_id uuid,
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.domain_event_outbox (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    event_name character varying(128) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    idempotency_key character varying(256) NOT NULL,
    status character varying(16) DEFAULT 'pending'::character varying NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    dispatched_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    edition_id uuid,
    contact_id uuid NOT NULL,
    conversation_id uuid,
    status character varying(32) DEFAULT 'intent'::character varying NOT NULL,
    pricing_tier_label character varying(64),
    pricing_amount double precision,
    currency character varying(8),
    payment_provider character varying(32),
    payment_transaction_id character varying(256),
    payment_link_url text,
    paid_at timestamp with time zone,
    source_channel character varying(64),
    notes text,
    extra jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.eval_simulator_grade (
    schema_version smallint DEFAULT 1 NOT NULL,
    simulation_id uuid NOT NULL,
    turn_n integer NOT NULL,
    rubric_id character varying(64) NOT NULL,
    rubric_version smallint NOT NULL,
    tenant_slug character varying(64) NOT NULL,
    persona_kind character varying(32) NOT NULL,
    actor_profile_id character varying(128) NOT NULL,
    judges jsonb NOT NULL,
    round_1_score numeric(4,3) NOT NULL,
    round_2_score numeric(4,3),
    final_score numeric(4,3) NOT NULL,
    round_1_variance numeric(4,3) NOT NULL,
    round_2_variance numeric(4,3),
    debate_triggered boolean DEFAULT false NOT NULL,
    unconverged boolean DEFAULT false NOT NULL,
    r2_partial boolean DEFAULT false NOT NULL,
    suspicious boolean DEFAULT false NOT NULL,
    injection_attempt_detected boolean DEFAULT false NOT NULL,
    cost_usd_total numeric(10,6) DEFAULT 0 NOT NULL,
    latency_ms_total integer NOT NULL,
    cache_hit_count smallint DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.eval_simulator_grade_cache (
    cache_key character varying(64) NOT NULL,
    schema_version smallint DEFAULT 1 NOT NULL,
    transcript_hash character varying(64) NOT NULL,
    rubric_id character varying(64) NOT NULL,
    rubric_version smallint NOT NULL,
    tenant_voice_hash character varying(64) NOT NULL,
    judge_set_hash character varying(64) NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_hit_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.eval_simulator_llm_call (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid,
    channel_type character varying(32) DEFAULT 'eval_simulator'::character varying NOT NULL,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    role character varying(32) NOT NULL,
    provider character varying(32) NOT NULL,
    model_requested character varying(128) NOT NULL,
    model_responded character varying(128) NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    cached_read_tokens integer DEFAULT 0 NOT NULL,
    cached_write_tokens integer DEFAULT 0 NOT NULL,
    reasoning_tokens integer DEFAULT 0 NOT NULL,
    pricing_version_id uuid NOT NULL,
    input_unit_cost_usd numeric(14,12) NOT NULL,
    output_unit_cost_usd numeric(14,12) NOT NULL,
    cached_read_unit_cost_usd numeric(14,12) DEFAULT 0 NOT NULL,
    cost_usd numeric(16,10),
    tenant_currency character(3),
    fx_rate_to_tenant numeric(16,8),
    fx_rate_source character varying(32),
    cost_tenant_currency numeric(16,8),
    started_at timestamp with time zone NOT NULL,
    duration_ms integer NOT NULL,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    error_type character varying(64),
    eval_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    occurred_on date GENERATED ALWAYS AS (((started_at AT TIME ZONE 'UTC'::text))::date) STORED,
    occurred_year_month character varying(7) GENERATED ALWAYS AS (((((EXTRACT(year FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text || '-'::text) || lpad(((EXTRACT(month FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text, 2, '0'::text))) STORED
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.eval_simulator_trace_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid,
    channel_type character varying(32) DEFAULT 'eval_simulator'::character varying NOT NULL,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    event_type character varying(32) NOT NULL,
    name character varying(128),
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    duration_ms integer,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    eval_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.eval_synthetic_tenants (
    tenant_id uuid NOT NULL,
    archetype_slug character varying(64) NOT NULL,
    seeded_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.external_product_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    source character varying NOT NULL,
    external_id character varying NOT NULL,
    external_name character varying,
    external_variant_id character varying,
    metadata_info jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.extraction_runs (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error text,
    metrics_count integer DEFAULT 0,
    duration_seconds double precision,
    rows_extracted integer DEFAULT 0,
    rate_limit_headroom double precision,
    created_at timestamp with time zone DEFAULT now(),
    sub_extractor_failures jsonb DEFAULT '[]'::jsonb,
    extraction_type character varying DEFAULT 'daily'::character varying,
    period_start date,
    period_end date
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id uuid NOT NULL,
    tenant_id uuid,
    filename character varying NOT NULL,
    file_path character varying NOT NULL,
    public_url character varying NOT NULL,
    user_description text,
    ai_description text,
    ai_colors jsonb,
    status character varying,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    offer_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.journey_events (
    id uuid NOT NULL,
    profile_id uuid,
    tenant_id uuid NOT NULL,
    event_type character varying NOT NULL,
    event_name character varying,
    channel character varying,
    session_id character varying,
    url character varying,
    properties jsonb,
    occurred_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    context jsonb DEFAULT '{}'::jsonb
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.journey_progress (
    id uuid NOT NULL,
    user_id uuid,
    product_id uuid,
    status character varying,
    stage character varying,
    lead_score integer,
    objections jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    tenant_id uuid,
    product_line character varying,
    funnel_entry_point character varying,
    deal_value_potential double precision DEFAULT '0'::double precision,
    objection_status character varying
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id uuid NOT NULL,
    tenant_id uuid,
    offer_id uuid,
    slug character varying NOT NULL,
    config jsonb,
    is_published boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    generated_at timestamp with time zone,
    offer_snapshot_version character varying,
    generation_job_id uuid,
    generation_job_status character varying,
    generation_error text,
    edition_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.launch_editions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    offer_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    edition_name character varying NOT NULL,
    edition_number integer NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    registration_start timestamp with time zone,
    registration_end timestamp with time zone,
    timezone character varying DEFAULT 'UTC'::character varying,
    pricing_override jsonb,
    capacity integer,
    enrollment_count integer DEFAULT 0,
    status character varying DEFAULT 'draft'::character varying,
    location_override jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    visibility character varying(20) DEFAULT 'private'::character varying NOT NULL,
    cloned_from_edition_id uuid,
    pricing_tiers jsonb,
    variant_structure text DEFAULT 'temporal_cohort'::text NOT NULL,
    structure_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_rank integer
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.lead_opt_ins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    channel character varying(32) NOT NULL,
    opted_in_at timestamp with time zone,
    opted_out_at timestamp with time zone,
    source character varying(24) NOT NULL,
    evidence jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lead_opt_ins_source_check CHECK (((source)::text = ANY ((ARRAY['webhook'::character varying, 'manual'::character varying, 'imported'::character varying, 'inferred_message'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid NOT NULL,
    full_name character varying,
    email character varying,
    phone character varying,
    telegram_id character varying,
    whatsapp_id character varying,
    instagram_id character varying,
    tiktok_id character varying,
    profile_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    style_profile jsonb DEFAULT '{}'::jsonb,
    custom_system_instruction character varying,
    tenant_id uuid,
    api_id character varying,
    social_handle_main character varying,
    timezone character varying,
    fit_score integer,
    intent_score integer,
    temperature character varying,
    is_blacklisted boolean,
    last_interaction_date timestamp with time zone,
    next_scheduled_action timestamp with time zone,
    conversation_summary text,
    key_objections_history jsonb,
    customer_id uuid,
    country character varying(2),
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.lifecycle_transitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    from_stage public.lifecyclestage,
    to_stage public.lifecyclestage NOT NULL,
    reason character varying NOT NULL,
    triggered_by character varying NOT NULL,
    score_at_transition double precision,
    metadata jsonb DEFAULT '{}'::jsonb,
    occurred_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.llm_call_logs (
    id uuid NOT NULL,
    trace_id uuid,
    model character varying,
    prompt_template character varying,
    prompt_rendered text,
    response_text text,
    tokens_input integer,
    tokens_output integer,
    metadata_info jsonb,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.llm_config_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor character varying(128) NOT NULL,
    action character varying(32) NOT NULL,
    role character varying(32) NOT NULL,
    tenant_id uuid,
    before jsonb,
    after jsonb,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_llm_config_audit_action CHECK (((action)::text = ANY ((ARRAY['create'::character varying, 'activate'::character varying, 'deactivate'::character varying, 'update_config'::character varying, 'test_ping'::character varying, 'rollback'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.llm_eval_gate_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role character varying(32) NOT NULL,
    candidate_model character varying(128) NOT NULL,
    candidate_provider character varying(64) NOT NULL,
    baseline_model character varying(128),
    score numeric(5,4) NOT NULL,
    threshold numeric(5,4) NOT NULL,
    passed boolean NOT NULL,
    details jsonb,
    ran_by character varying(128) NOT NULL,
    ran_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_llm_eval_gate_role CHECK (((role)::text = ANY ((ARRAY['NANO'::character varying, 'FAST'::character varying, 'REASONING'::character varying, 'AGENT'::character varying, 'VISION'::character varying, 'EMBEDDING'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.llm_eval_gate_threshold (
    role character varying(32) NOT NULL,
    threshold numeric(5,4) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(128),
    CONSTRAINT ck_llm_eval_gate_threshold_range CHECK (((threshold >= (0)::numeric) AND (threshold <= (1)::numeric))),
    CONSTRAINT ck_llm_eval_gate_threshold_role CHECK (((role)::text = ANY ((ARRAY['NANO'::character varying, 'FAST'::character varying, 'REASONING'::character varying, 'AGENT'::character varying, 'VISION'::character varying, 'EMBEDDING'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.llm_logs (
    id uuid NOT NULL,
    trace_id uuid,
    model character varying NOT NULL,
    prompt_template character varying,
    prompt_rendered text NOT NULL,
    response_text text NOT NULL,
    tokens_input integer,
    tokens_output integer,
    metadata_info jsonb,
    created_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.llm_role_binding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role character varying(32) NOT NULL,
    provider character varying(64) NOT NULL,
    model character varying(128) NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    tenant_id uuid,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    eval_score numeric(5,4),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying(128),
    activated_at timestamp with time zone,
    deactivated_at timestamp with time zone,
    CONSTRAINT ck_llm_role_binding_role CHECK (((role)::text = ANY ((ARRAY['nano'::character varying, 'fast'::character varying, 'reasoning'::character varying, 'agent'::character varying, 'vision'::character varying, 'embedding'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.marketing_assets (
    id uuid NOT NULL,
    product_id uuid,
    name character varying NOT NULL,
    type character varying NOT NULL,
    url character varying,
    transcript_summary text,
    hook_points jsonb,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid NOT NULL,
    user_id uuid,
    role character varying NOT NULL,
    content text NOT NULL,
    channel character varying,
    product_context_id uuid,
    metadata_log jsonb,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid,
    sender_source character varying(20) DEFAULT 'auto'::character varying NOT NULL,
    external_id character varying
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.metric_aggregations (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    channel_slug character varying NOT NULL,
    metric_name character varying NOT NULL,
    period_type character varying NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    value double precision NOT NULL,
    unit character varying NOT NULL,
    currency character varying,
    cost_type character varying,
    computed_at timestamp with time zone DEFAULT now(),
    extraction_run_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.model_pricing_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider character varying(32) NOT NULL,
    model character varying(128) NOT NULL,
    input_cost_per_token numeric(14,12) NOT NULL,
    output_cost_per_token numeric(14,12) NOT NULL,
    cache_read_cost_per_token numeric(14,12) DEFAULT 0,
    cache_write_cost_per_token numeric(14,12) DEFAULT 0,
    batch_input_cost_per_token numeric(14,12),
    source character varying(32) NOT NULL,
    source_etag character varying(64),
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    raw_payload jsonb NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.model_pricing_snapshot_backup_pre_t3 (
    id uuid,
    provider character varying(32),
    model character varying(128),
    input_cost_per_token numeric(14,12),
    output_cost_per_token numeric(14,12),
    cache_read_cost_per_token numeric(14,12),
    cache_write_cost_per_token numeric(14,12),
    batch_input_cost_per_token numeric(14,12),
    source character varying(32),
    source_etag character varying(64),
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    raw_payload jsonb
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.sales_agent_llm_call (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    channel_type character varying(32) NOT NULL,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    role character varying(32) NOT NULL,
    provider character varying(32) NOT NULL,
    model_requested character varying(128) NOT NULL,
    model_responded character varying(128) NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    cached_read_tokens integer DEFAULT 0 NOT NULL,
    cached_write_tokens integer DEFAULT 0 NOT NULL,
    reasoning_tokens integer DEFAULT 0 NOT NULL,
    pricing_version_id uuid NOT NULL,
    input_unit_cost_usd numeric(14,12) NOT NULL,
    output_unit_cost_usd numeric(14,12) NOT NULL,
    cached_read_unit_cost_usd numeric(14,12) DEFAULT 0 NOT NULL,
    cost_usd numeric(16,10),
    tenant_currency character(3),
    fx_rate_to_tenant numeric(16,8),
    fx_rate_source character varying(32),
    cost_tenant_currency numeric(16,8),
    started_at timestamp with time zone NOT NULL,
    duration_ms integer NOT NULL,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    error_type character varying(64),
    occurred_on date GENERATED ALWAYS AS (((started_at AT TIME ZONE 'UTC'::text))::date) STORED,
    occurred_year_month character varying(7) GENERATED ALWAYS AS (((((EXTRACT(year FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text || '-'::text) || lpad(((EXTRACT(month FROM (started_at AT TIME ZONE 'UTC'::text)))::integer)::text, 2, '0'::text))) STORED
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.mv_refresh_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mv_name character varying(64) NOT NULL,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL,
    refresh_duration_ms integer,
    rows_affected integer,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    CONSTRAINT mv_refresh_log_status_check CHECK (((status)::text = ANY ((ARRAY['ok'::character varying, 'error'::character varying, 'skipped'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.nps_responses (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    survey_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    score integer NOT NULL,
    feedback_text character varying,
    testimonial_text character varying,
    testimonial_audio_url character varying,
    consent_public_use boolean DEFAULT false,
    responded_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.nps_surveys (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    token character varying NOT NULL,
    offer_id uuid,
    customer_id uuid,
    delivery_channel character varying DEFAULT 'universal_link'::character varying,
    status character varying DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    sent_at timestamp with time zone,
    expires_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.objections (
    id uuid NOT NULL,
    product_id uuid,
    trigger_phrase character varying NOT NULL,
    rebuttal_strategy text,
    script text,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.offer_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    source character varying NOT NULL,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    file_url character varying,
    thumbnail_url character varying,
    mime_type character varying,
    size_bytes integer,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    prompt_params jsonb,
    editable_in_puck boolean DEFAULT false NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    edition_id uuid,
    shared_across_editions boolean DEFAULT false NOT NULL,
    CONSTRAINT offer_assets_source_check CHECK (((source)::text = ANY ((ARRAY['ai'::character varying, 'external'::character varying])::text[]))),
    CONSTRAINT offer_assets_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'processing'::character varying, 'ready'::character varying, 'error'::character varying])::text[]))),
    CONSTRAINT offer_assets_type_check CHECK (((type)::text = ANY ((ARRAY['flyer'::character varying, 'video'::character varying, 'carousel'::character varying, 'document'::character varying, 'image'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.offer_extraction_traces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    job_id character varying NOT NULL,
    mode character varying NOT NULL,
    url text,
    status character varying DEFAULT 'running'::character varying NOT NULL,
    content_length integer DEFAULT 0,
    sections_total integer DEFAULT 0,
    sections_succeeded integer DEFAULT 0,
    total_duration_s double precision,
    error_message text,
    events jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.offer_knowledge_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    status character varying DEFAULT 'queued'::character varying NOT NULL,
    source_url character varying,
    file_url character varying,
    mime_type character varying,
    size_bytes integer,
    indexed_chunk_count integer DEFAULT 0 NOT NULL,
    last_indexed_at timestamp with time zone,
    qdrant_collection character varying,
    qdrant_point_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT offer_knowledge_sources_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'processing'::character varying, 'indexed'::character varying, 'error'::character varying])::text[]))),
    CONSTRAINT offer_knowledge_sources_type_check CHECK (((type)::text = ANY ((ARRAY['pdf'::character varying, 'docx'::character varying, 'txt'::character varying, 'markdown'::character varying, 'video'::character varying, 'url_youtube'::character varying, 'url_article'::character varying, 'url_google_doc'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.offer_logs (
    id uuid NOT NULL,
    user_id uuid,
    product_id uuid,
    offered_at timestamp with time zone DEFAULT now(),
    pitch_type character varying,
    response character varying,
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.official_metrics (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying NOT NULL,
    channel_slug character varying NOT NULL,
    metric_name character varying NOT NULL,
    value double precision NOT NULL,
    unit character varying NOT NULL,
    currency character varying,
    metric_date date NOT NULL,
    spend jsonb,
    revenue jsonb,
    campaign_id character varying,
    ad_set_id character varying,
    ad_id character varying,
    cost_type character varying,
    extra jsonb DEFAULT '{}'::jsonb,
    source_extraction_run_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    iso_week_start date,
    month_key character varying(7),
    quarter_key character varying(7)
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.payment_grant_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    payment_id uuid NOT NULL,
    channels jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'granted'::text NOT NULL,
    failure_detail jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.payment_link (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    provider text NOT NULL,
    external_id text NOT NULL,
    url text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character(3) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.payment_webhook_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    provider text NOT NULL,
    external_id text NOT NULL,
    event_type text NOT NULL,
    occurred_at timestamp with time zone NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.period_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying NOT NULL,
    channel_slug character varying NOT NULL,
    metric_name character varying NOT NULL,
    value double precision NOT NULL,
    unit character varying NOT NULL,
    currency character varying,
    period_type character varying NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    campaign_id character varying,
    ad_set_id character varying,
    ad_id character varying,
    cost_type character varying,
    extra jsonb DEFAULT '{}'::jsonb,
    source_extraction_run_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.personality_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid,
    avatar_id uuid,
    name character varying(255) NOT NULL,
    profile_type character varying(20) DEFAULT 'preset'::character varying NOT NULL,
    preset_key character varying(50),
    is_active boolean DEFAULT false NOT NULL,
    dimensions jsonb DEFAULT '{}'::jsonb NOT NULL,
    linguistic_patterns jsonb DEFAULT '{}'::jsonb NOT NULL,
    sample_exchanges jsonb DEFAULT '[]'::jsonb NOT NULL,
    negative_constraints jsonb DEFAULT '[]'::jsonb NOT NULL,
    system_instruction text,
    source_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    qdrant_collection character varying(100),
    anchor_count integer DEFAULT 0 NOT NULL,
    llm_provider character varying(50),
    llm_model character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.plan_config (
    plan_id character varying(32) NOT NULL,
    display_name character varying(64) NOT NULL,
    llm_budget_total_usd numeric(10,2) NOT NULL,
    sales_agent_reserved_pct numeric(4,3) DEFAULT 0.500 NOT NULL,
    max_outbound_msg_per_day integer,
    max_campaigns_active integer,
    max_segment_size integer,
    max_contacts_total integer,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_plan_config_budget_positive CHECK ((llm_budget_total_usd > (0)::numeric)),
    CONSTRAINT ck_plan_config_outbound_nonneg CHECK (((max_outbound_msg_per_day IS NULL) OR (max_outbound_msg_per_day >= 0))),
    CONSTRAINT ck_plan_config_sa_pct_range CHECK (((sales_agent_reserved_pct >= (0)::numeric) AND (sales_agent_reserved_pct <= (1)::numeric)))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL,
    name character varying NOT NULL,
    status character varying,
    pricing jsonb,
    dates jsonb,
    metadata_info jsonb,
    downsell_product_id uuid,
    avatar_id uuid,
    tenant_id uuid,
    internal_sku character varying,
    delivery_model character varying,
    headline_promise character varying,
    target_avatar_match jsonb,
    requires_application boolean,
    min_financial_capacity character varying,
    currency character varying,
    guarantee_type character varying,
    upsell_product_id uuid,
    primary_outcome character varying,
    time_to_value character varying,
    prerequisites jsonb,
    guarantee_terms text,
    includes_offers jsonb,
    deliverables jsonb,
    specific_details jsonb,
    offer_value_level character varying,
    access_duration character varying,
    access_duration_text character varying,
    landing_page_config jsonb,
    marketing_pain_points jsonb,
    marketing_desires jsonb,
    support_duration_days integer,
    onboarding_action character varying,
    onboarding_url character varying,
    calendar_type_id character varying,
    checkout_page_url character varying,
    vsl_link character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    anti_avatar_keywords jsonb DEFAULT '[]'::jsonb,
    objections jsonb DEFAULT '[]'::jsonb,
    archetype character varying NOT NULL,
    format_hint character varying,
    is_lead_magnet boolean DEFAULT false,
    archived_at timestamp with time zone,
    deleted_at timestamp with time zone,
    paused_at timestamp with time zone,
    status_changed_at timestamp with time zone,
    completion_percentage double precision,
    has_editions boolean DEFAULT true NOT NULL,
    preset_id text,
    before_state text,
    after_state text,
    why_now text,
    measurable_outcomes jsonb DEFAULT '[]'::jsonb NOT NULL,
    cultural_trust_barriers jsonb DEFAULT '[]'::jsonb NOT NULL,
    emotional_triggers jsonb DEFAULT '[]'::jsonb NOT NULL,
    status_drivers jsonb DEFAULT '[]'::jsonb NOT NULL,
    regret_scenarios jsonb DEFAULT '[]'::jsonb NOT NULL,
    refund_process_description text,
    urgency_drivers jsonb DEFAULT '[]'::jsonb NOT NULL,
    scarcity_reason_honest text,
    bonus_if_act_now text,
    final_push_copy text,
    tax_included boolean,
    installments_available text,
    accepted_payment_providers jsonb DEFAULT '[]'::jsonb NOT NULL,
    authority_positioning_for_sales text,
    authority_notes text,
    total_perceived_value_anchor numeric(12,2),
    stack_positioning_statement text,
    platform_details jsonb,
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'archived'::character varying, 'waitlist'::character varying, 'sold_out'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.prompt_versions (
    id uuid NOT NULL,
    key character varying NOT NULL,
    version integer NOT NULL,
    content text NOT NULL,
    is_active boolean,
    change_reason character varying NOT NULL,
    author_id character varying,
    metadata_info jsonb,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    code character varying NOT NULL,
    source character varying DEFAULT 'internal'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    transaction_id character varying,
    amount double precision NOT NULL,
    currency character varying DEFAULT 'USD'::character varying,
    status public.salestatus DEFAULT 'PENDING'::public.salestatus,
    stage public.salestage NOT NULL,
    source character varying DEFAULT 'MANUAL'::character varying,
    payment_method public.paymentmethod,
    metadata_info jsonb DEFAULT '{}'::jsonb,
    occurred_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.sales_agent_routing_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    channel_type character varying(32) NOT NULL,
    turn_id uuid NOT NULL,
    stage character varying(32) NOT NULL,
    lead_score integer,
    tier_selected text NOT NULL,
    specialist_routed text NOT NULL,
    reason text NOT NULL,
    confidence numeric(4,3),
    user_msg_length integer NOT NULL,
    tools_available integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.sales_agent_trace_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    lead_id uuid NOT NULL,
    channel_type character varying(32) NOT NULL,
    turn_id uuid NOT NULL,
    span_id uuid NOT NULL,
    parent_span_id uuid,
    event_type character varying(32) NOT NULL,
    name character varying(128),
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    duration_ms integer,
    status character varying(16) DEFAULT 'ok'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.sales_agent_workflow_metric (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    bucket_id text NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    started_count integer DEFAULT 0 NOT NULL,
    completed_count integer DEFAULT 0 NOT NULL,
    abandoned_count integer DEFAULT 0 NOT NULL,
    avg_turns_to_completion double precision,
    judge_avg_score numeric(4,2),
    judge_sample_size integer DEFAULT 0 NOT NULL,
    extra_metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.scheduler_webhook_event (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider character varying(50) NOT NULL,
    tracking_id character varying(255),
    event_type character varying(50) NOT NULL,
    occurred_at timestamp with time zone NOT NULL,
    tenant_id uuid,
    lead_id uuid,
    payload_raw jsonb NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.segment (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(128) NOT NULL,
    description character varying(1000),
    segment_type character varying(16) DEFAULT 'dynamic'::character varying NOT NULL,
    filter_dsl jsonb DEFAULT '{}'::jsonb NOT NULL,
    estimated_size integer,
    last_calculated_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_segment_estimated_size_nonneg CHECK (((estimated_size IS NULL) OR (estimated_size >= 0))),
    CONSTRAINT chk_segment_type_values CHECK (((segment_type)::text = ANY ((ARRAY['dynamic'::character varying, 'static'::character varying])::text[])))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.segment_snapshot (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    segment_id uuid NOT NULL,
    snapshotted_at timestamp with time zone NOT NULL,
    lead_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    lead_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_snapshot_lead_count_nonneg CHECK ((lead_count >= 0))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.sensitive_data (
    id uuid NOT NULL,
    pattern character varying NOT NULL,
    replacement character varying NOT NULL,
    category character varying NOT NULL,
    description character varying,
    is_active boolean,
    context_instruction text,
    scope character varying,
    product_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id uuid
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.sensitive_data_logs (
    id uuid NOT NULL,
    tenant_id uuid,
    source character varying NOT NULL,
    detected_pattern character varying NOT NULL,
    original_text_hash character varying,
    redacted_text text,
    action_taken character varying,
    created_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.shareable_links (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    token character varying NOT NULL,
    target_type character varying NOT NULL,
    params jsonb,
    is_active boolean,
    expires_at timestamp with time zone,
    created_by uuid,
    visit_count integer,
    last_visited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.social_proof_placements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    source_table character varying(30) NOT NULL,
    source_id uuid NOT NULL,
    surface_type character varying(30) NOT NULL,
    surface_ref_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.staging_metrics (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    provider character varying NOT NULL,
    channel_slug character varying NOT NULL,
    metric_name character varying NOT NULL,
    value double precision NOT NULL,
    unit character varying NOT NULL,
    currency character varying,
    metric_date date NOT NULL,
    spend jsonb,
    revenue jsonb,
    campaign_id character varying,
    ad_set_id character varying,
    ad_id character varying,
    extra jsonb DEFAULT '{}'::jsonb,
    extraction_run_id uuid,
    created_at timestamp with time zone DEFAULT now()
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255),
    bio text,
    headshot_url text,
    is_primary_voice boolean DEFAULT false NOT NULL,
    gender character varying(20),
    communication_style character varying(40),
    personal_website text,
    personal_linkedin text,
    personal_instagram text,
    personal_tiktok text,
    personal_facebook text,
    work_whatsapp character varying(40),
    gallery jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.tenant_billing_config (
    tenant_id uuid NOT NULL,
    billing_cycle_anchor_day smallint DEFAULT 25 NOT NULL,
    billing_currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    fx_source character varying(32) DEFAULT 'frankfurter'::character varying NOT NULL,
    flat_fee_amount numeric(14,2),
    cost_alert_threshold_usd numeric(14,2),
    notes text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.tenant_domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    hostname character varying NOT NULL,
    domain_type character varying NOT NULL,
    status character varying DEFAULT 'pending_verification'::character varying NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    cloudflare_hostname_id character varying,
    ssl_status character varying,
    verification_method character varying,
    verification_cname_target character varying,
    verification_txt_name character varying,
    verification_txt_value character varying,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
    tenant_id uuid NOT NULL,
    business_types text[] DEFAULT '{}'::text[] NOT NULL,
    declared_at timestamp with time zone,
    last_business_types_change_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.tenant_subscription (
    tenant_id uuid NOT NULL,
    plan_id character varying(32) NOT NULL,
    cycle_anchor_day integer DEFAULT 1 NOT NULL,
    custom_overrides jsonb DEFAULT '{}'::jsonb NOT NULL,
    trial_ends_at timestamp with time zone,
    activated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT ck_tenant_subscription_anchor_range CHECK (((cycle_anchor_day >= 1) AND (cycle_anchor_day <= 28)))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    config_json jsonb,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    gemini_api_key character varying,
    can_use_platform_keys boolean DEFAULT false,
    webhook_secret character varying,
    clerk_org_id character varying,
    default_currency character varying DEFAULT 'USD'::character varying,
    timezone character varying DEFAULT 'UTC'::character varying,
    extraction_priority integer DEFAULT 0 NOT NULL,
    tracking_config jsonb DEFAULT '{}'::jsonb,
    weekly_start_day integer DEFAULT 0,
    fiscal_year_start_month integer DEFAULT 1,
    fiscal_year_start_day integer DEFAULT 1
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    author_name character varying(255) NOT NULL,
    author_role character varying(255),
    author_avatar_url text,
    content text,
    media_type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    media_url text,
    rating smallint,
    source_url text,
    captured_at timestamp with time zone,
    language character varying(8) DEFAULT 'es'::character varying NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_testimonials_rating CHECK (((rating IS NULL) OR ((rating >= 1) AND (rating <= 5))))
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.user_tenants (
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    role character varying,
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true NOT NULL
);
""")
    op.execute("""
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL,
    full_name character varying,
    email character varying NOT NULL,
    phone character varying,
    role character varying,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    clerk_id character varying
);
""")
    op.execute("""
CREATE OR REPLACE FUNCTION public.compute_cycle_start(p_tenant uuid, p_date date) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    AS $$
        DECLARE
            anchor SMALLINT;
            safe_anchor SMALLINT;
            month_last_day SMALLINT;
            cycle_year INT;
            cycle_month INT;
        BEGIN
            -- Resolve the anchor: tenant override or default 25.
            SELECT billing_cycle_anchor_day
              INTO anchor
              FROM tenant_billing_config
             WHERE tenant_id = p_tenant;
            IF anchor IS NULL THEN
                anchor := 25;
            END IF;

            -- Clamp to the last day of the current month (handles Feb).
            month_last_day := EXTRACT(DAY FROM
                (date_trunc('month', p_date) + INTERVAL '1 month' - INTERVAL '1 day')
            )::SMALLINT;
            safe_anchor := LEAST(anchor, month_last_day);

            IF EXTRACT(DAY FROM p_date)::SMALLINT >= safe_anchor THEN
                RETURN make_date(
                    EXTRACT(YEAR  FROM p_date)::INT,
                    EXTRACT(MONTH FROM p_date)::INT,
                    safe_anchor
                );
            END IF;

            -- Otherwise roll back to the anchor in the previous month.
            cycle_year  := EXTRACT(YEAR  FROM (p_date - INTERVAL '1 month'))::INT;
            cycle_month := EXTRACT(MONTH FROM (p_date - INTERVAL '1 month'))::INT;
            month_last_day := EXTRACT(DAY FROM (
                date_trunc('month', make_date(cycle_year, cycle_month, 1))
                + INTERVAL '1 month' - INTERVAL '1 day'
            ))::SMALLINT;
            safe_anchor := LEAST(anchor, month_last_day);
            RETURN make_date(cycle_year, cycle_month, safe_anchor);
        END
        $$;


SET default_tablespace = '';

SET default_table_access_method = heap;
""")
    op.execute("""
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_llm_cost_per_tenant AS
 SELECT copilot_llm_call.tenant_id,
    copilot_llm_call.occurred_on,
    copilot_llm_call.model_responded,
    copilot_llm_call.provider,
    copilot_llm_call.role,
    count(*) AS call_count,
    count(DISTINCT copilot_llm_call.turn_id) AS turn_count,
    count(DISTINCT copilot_llm_call.conversation_id) AS conversation_count,
    sum(copilot_llm_call.input_tokens) AS input_tokens,
    sum(copilot_llm_call.output_tokens) AS output_tokens,
    sum(copilot_llm_call.cached_read_tokens) AS cached_read_tokens,
    sum(copilot_llm_call.cost_usd) AS cost_usd,
    sum(copilot_llm_call.cost_tenant_currency) AS cost_tenant_currency,
    (avg(copilot_llm_call.duration_ms))::integer AS avg_duration_ms,
    count(*) FILTER (WHERE ((copilot_llm_call.status)::text = 'error'::text)) AS error_count,
    max(copilot_llm_call.tenant_currency) AS tenant_currency
   FROM public.copilot_llm_call
  GROUP BY copilot_llm_call.tenant_id, copilot_llm_call.occurred_on, copilot_llm_call.model_responded, copilot_llm_call.provider, copilot_llm_call.role
  WITH NO DATA;
""")
    op.execute("""
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_llm_cost_per_tenant_v2 AS
 SELECT 'copilot'::character varying(32) AS agent_kind,
    copilot_llm_call.tenant_id,
    copilot_llm_call.occurred_on,
    count(*) AS call_count,
    count(DISTINCT copilot_llm_call.turn_id) AS turn_count,
    sum(copilot_llm_call.cost_usd) AS cost_usd,
    sum(copilot_llm_call.cost_tenant_currency) AS cost_tenant_currency,
    max(copilot_llm_call.tenant_currency) AS tenant_currency,
    count(*) FILTER (WHERE ((copilot_llm_call.status)::text = 'error'::text)) AS error_count
   FROM public.copilot_llm_call
  GROUP BY copilot_llm_call.tenant_id, copilot_llm_call.occurred_on
UNION ALL
 SELECT 'sales_agent'::character varying(32) AS agent_kind,
    sales_agent_llm_call.tenant_id,
    sales_agent_llm_call.occurred_on,
    count(*) AS call_count,
    count(DISTINCT sales_agent_llm_call.turn_id) AS turn_count,
    sum(sales_agent_llm_call.cost_usd) AS cost_usd,
    sum(sales_agent_llm_call.cost_tenant_currency) AS cost_tenant_currency,
    max(sales_agent_llm_call.tenant_currency) AS tenant_currency,
    count(*) FILTER (WHERE ((sales_agent_llm_call.status)::text = 'error'::text)) AS error_count
   FROM public.sales_agent_llm_call
  GROUP BY sales_agent_llm_call.tenant_id, sales_agent_llm_call.occurred_on
  WITH NO DATA;
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS idx_copilot_events_tenant_created ON public.copilot_events USING btree (tenant_id, created_at DESC) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS idx_copilot_events_tenant_type ON public.copilot_events USING btree (tenant_id, event_type) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS idx_copilot_events_tenant_user_created ON public.copilot_events USING btree (tenant_id, user_id, created_at DESC) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS idx_products_archetype ON public.products USING btree (archetype);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_business_types ON public.tenant_profiles USING gin (business_types);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_declared_at ON public.tenant_profiles USING btree (declared_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ad_campaigns_tenant ON public.ad_campaigns USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ad_offer_associations_tenant_id ON public.ad_offer_associations USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ad_offer_tenant_offer ON public.ad_offer_associations USING btree (tenant_id, offer_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_ad_offer_tenant_target ON public.ad_offer_associations USING btree (tenant_id, target_type, target_external_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ad_recs_tenant ON public.ad_recommendations USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ad_recs_tenant_type ON public.ad_recommendations USING btree (tenant_id, recommendation_type) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ad_sets_campaign ON public.ad_sets USING btree (tenant_id, campaign_external_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ad_sets_tenant ON public.ad_sets USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ads_adset ON public.ads USING btree (tenant_id, ad_set_external_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_ads_tenant ON public.ads USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_agent_traces_tenant_id ON public.agent_traces USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_agg_tenant_channel_period ON public.metric_aggregations USING btree (tenant_id, channel_slug, period_type, period_start);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_appointments_lead_id ON public.appointments USING btree (lead_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_appointments_tenant_id ON public.appointments USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_asset_links_asset ON public.asset_links USING btree (asset_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_asset_links_entity ON public.asset_links USING btree (tenant_id, entity_type, entity_id, role) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_assets_deleted_at ON public.assets USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_assets_ephemeral_expires ON public.assets USING btree (expires_at) WHERE (((scope)::text = 'ephemeral'::text) AND (deleted_at IS NULL));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_assets_offer_id ON public.assets USING btree (offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_assets_tenant_id ON public.assets USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_assets_tenant_scope ON public.assets USING btree (tenant_id, scope) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_authority_items_tenant_active ON public.authority_items USING btree (tenant_id, is_active, deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_authority_items_tenant_id ON public.authority_items USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_authority_items_tenant_type ON public.authority_items USING btree (tenant_id, authority_type);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_avatar_definitions_tenant_id ON public.avatar_definitions USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_avatars_deleted_at ON public.avatars USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_avatars_tenant_id ON public.avatars USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_booking_links_tenant_id ON public.booking_links USING btree (tenant_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_booking_links_token ON public.booking_links USING btree (token);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_brand_extraction_traces_created_at ON public.brand_extraction_traces USING btree (created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_brand_extraction_traces_job_id ON public.brand_extraction_traces USING btree (job_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_brand_extraction_traces_tenant_id ON public.brand_extraction_traces USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_buyer_personas_tenant_id ON public.buyer_personas USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_buyer_personas_tenant_scope ON public.buyer_personas USING btree (tenant_id, scope);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_cal_cc_year_date ON public.commercial_calendar_events USING btree (country_code, year, date);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_cal_country ON public.commercial_calendar_events USING btree (country_code);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_cal_deleted_at ON public.commercial_calendar_events USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_cal_tenant ON public.commercial_calendar_events USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_cal_week ON public.commercial_calendar_events USING btree (week_number);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_cal_year ON public.commercial_calendar_events USING btree (year);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_audit_created ON public.campaign_audit USING btree (created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_audit_task ON public.campaign_audit USING btree (campaign_task_id) WHERE (campaign_task_id IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_audit_tenant_campaign_created ON public.campaign_audit USING btree (tenant_id, campaign_id, created_at DESC) WHERE (campaign_id IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_llm_call_errors ON public.campaign_llm_call USING btree (tenant_id, started_at DESC) WHERE ((status)::text = 'error'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_llm_call_lead ON public.campaign_llm_call USING btree (tenant_id, lead_id, started_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_llm_call_tenant_day ON public.campaign_llm_call USING btree (tenant_id, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_llm_call_tenant_model_day ON public.campaign_llm_call USING btree (tenant_id, model_responded, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_llm_call_turn ON public.campaign_llm_call USING btree (turn_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_segment ON public.campaign USING btree (segment_id) WHERE (segment_id IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_step_tenant_campaign ON public.campaign_step USING btree (tenant_id, campaign_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_task_lead ON public.campaign_task USING btree (lead_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_task_tenant_campaign_status ON public.campaign_task USING btree (tenant_id, campaign_id, status);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_task_worker_queue ON public.campaign_task USING btree (tenant_id, status, scheduled_at) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'scheduled'::character varying])::text[]));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_tenant_created ON public.campaign USING btree (tenant_id, created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_tenant_scheduled ON public.campaign USING btree (tenant_id, scheduled_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_tenant_status ON public.campaign USING btree (tenant_id, status);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_trace_event_errors ON public.campaign_trace_event USING btree (tenant_id, created_at DESC) WHERE ((status)::text = 'error'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_trace_event_lead ON public.campaign_trace_event USING btree (tenant_id, lead_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_trace_event_tenant_time ON public.campaign_trace_event USING btree (tenant_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_campaign_trace_event_turn ON public.campaign_trace_event USING btree (turn_id, created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_channel_blacklist_lookup ON public.channel_blacklist USING btree (tenant_id, channel, identifier) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_channel_connections_deleted_at ON public.channel_connections USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_channel_connections_tenant_id ON public.channel_connections USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_channel_cost_settings_tenant_id ON public.channel_cost_settings USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_checkpoint_frozen ON public.agent_state_checkpoints USING btree (tenant_id, frozen_at, is_active);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_checkpoint_handler_mode ON public.agent_state_checkpoints USING btree (tenant_id, handler_mode, is_active);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_checkpoint_lead ON public.agent_state_checkpoints USING btree (lead_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_checkpoint_session ON public.agent_state_checkpoints USING btree (session_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_checkpoint_tenant ON public.agent_state_checkpoints USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_checkpoint_tenant_lead_active ON public.agent_state_checkpoints USING btree (tenant_id, lead_id, is_active);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_backfill_runs_run_id ON public.copilot_backfill_runs USING btree (run_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_backfill_runs_tenant_started ON public.copilot_backfill_runs USING btree (tenant_id, started_at DESC) WHERE (tenant_id IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_channel_links_lookup ON public.copilot_channel_links USING btree (channel_type, channel_user_id) WHERE (revoked_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_channel_links_tenant ON public.copilot_channel_links USING btree (tenant_id) WHERE (revoked_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_channel_links_user ON public.copilot_channel_links USING btree (user_id) WHERE (revoked_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conv_has_blocks ON public.copilot_conversations USING btree (((messages @? '$[*]."blocks"'::jsonpath))) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conv_summary_dirty ON public.copilot_conversations USING btree (summary_dirty_at) WHERE (summary_dirty_at IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conv_tenant_user_active ON public.copilot_conversations USING btree (tenant_id, user_id, updated_at DESC) WHERE (archived_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conversations_channel ON public.copilot_conversations USING btree (channel_type, channel_chat_id) WHERE (channel_type IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conversations_deleted_at ON public.copilot_conversations USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conversations_expires_at ON public.copilot_conversations USING btree (expires_at) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conversations_tenant_id ON public.copilot_conversations USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conversations_tenant_user_updated ON public.copilot_conversations USING btree (tenant_id, user_id, updated_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conversations_title_trgm ON public.copilot_conversations USING gin (title public.gin_trgm_ops) WHERE (title IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_conversations_user_id ON public.copilot_conversations USING btree (user_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_inspiration_conv_created ON public.copilot_inspiration USING btree (conversation_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_inspiration_tenant ON public.copilot_inspiration USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_link_tokens_lookup ON public.copilot_link_tokens USING btree (token_hash, expires_at) WHERE (used_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_link_tokens_tenant ON public.copilot_link_tokens USING btree (tenant_id, user_id, expires_at) WHERE (used_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_mutation_journal_conv_time ON public.copilot_mutation_journal USING btree (conversation_id, applied_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_mutation_journal_tenant_active ON public.copilot_mutation_journal USING btree (tenant_id, applied_at DESC) WHERE (reverted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_pinned_memory_tenant ON public.copilot_pinned_memory USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_routing_log_conv ON public.copilot_routing_log USING btree (conversation_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_routing_log_tenant_time ON public.copilot_routing_log USING btree (tenant_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_tenant_limits_audit_changed_at ON public.copilot_tenant_limits_audit USING btree (changed_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_tenant_limits_audit_tenant_id ON public.copilot_tenant_limits_audit USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_tenant_limits_tenant_id ON public.copilot_tenant_limits USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_tenant_limits_updated_at ON public.copilot_tenant_limits USING btree (updated_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_trace_event_conversation ON public.copilot_trace_event USING btree (conversation_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_trace_event_errors ON public.copilot_trace_event USING btree (tenant_id, created_at DESC) WHERE ((status)::text = 'error'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_trace_event_tenant_time ON public.copilot_trace_event USING btree (tenant_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_copilot_trace_event_turn ON public.copilot_trace_event USING btree (turn_id, created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_identities_profile_id ON public.customer_identities USING btree (profile_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_identities_tenant_id ON public.customer_identities USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_identities_value ON public.customer_identities USING btree (value);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_profiles_last_activity_at ON public.customer_profiles USING btree (last_activity_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_profiles_lead_source ON public.customer_profiles USING btree (lead_source);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_profiles_lifecycle_stage ON public.customer_profiles USING btree (lifecycle_stage);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_profiles_primary_email ON public.customer_profiles USING btree (primary_email);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_customer_profiles_tenant_id ON public.customer_profiles USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_documents_tenant_id ON public.documents USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_enrollments_contact ON public.enrollments USING btree (tenant_id, contact_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_enrollments_conversation ON public.enrollments USING btree (conversation_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_enrollments_edition ON public.enrollments USING btree (tenant_id, edition_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_enrollments_offer ON public.enrollments USING btree (tenant_id, offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_enrollments_status ON public.enrollments USING btree (tenant_id, status);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_enrollments_tenant ON public.enrollments USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_enrollments_waitlist ON public.enrollments USING btree (tenant_id, offer_id) WHERE ((status)::text = 'waitlist'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_grade_actor_profile ON public.eval_simulator_grade USING btree (actor_profile_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_grade_cache_rubric ON public.eval_simulator_grade_cache USING btree (rubric_id, rubric_version);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_grade_cache_transcript ON public.eval_simulator_grade_cache USING btree (transcript_hash);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_grade_rubric ON public.eval_simulator_grade USING btree (rubric_id, rubric_version);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_grade_tenant_persona ON public.eval_simulator_grade USING btree (tenant_slug, persona_kind);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_grade_unconverged ON public.eval_simulator_grade USING btree (unconverged) WHERE (unconverged = true);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_llm_call_run_id ON public.eval_simulator_llm_call USING btree (((eval_metadata ->> 'run_id'::text)));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_llm_call_sim_id ON public.eval_simulator_llm_call USING btree (((eval_metadata ->> 'simulation_id'::text)));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_llm_call_tenant_day ON public.eval_simulator_llm_call USING btree (tenant_id, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_llm_call_turn ON public.eval_simulator_llm_call USING btree (turn_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_trace_event_sim_id ON public.eval_simulator_trace_event USING btree (((eval_metadata ->> 'simulation_id'::text)));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_simulator_trace_event_tenant_turn ON public.eval_simulator_trace_event USING btree (tenant_id, turn_id, created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_eval_synthetic_tenants_slug ON public.eval_synthetic_tenants USING btree (archetype_slug) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_external_product_mappings_tenant_id ON public.external_product_mappings USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_extraction_runs_tenant_id ON public.extraction_runs USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_extraction_tenant_provider_status ON public.extraction_runs USING btree (tenant_id, provider, status);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_gallery_images_offer_id ON public.gallery_images USING btree (offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_journey_events_event_type ON public.journey_events USING btree (event_type);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_journey_events_message_id ON public.journey_events USING btree (((properties ->> 'message_id'::text))) WHERE ((properties ->> 'message_id'::text) IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_journey_events_occurred_at ON public.journey_events USING btree (occurred_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_journey_events_profile_id ON public.journey_events USING btree (profile_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_journey_events_tenant_id ON public.journey_events USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_journey_progress_tenant_id ON public.journey_progress USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_landing_pages_deleted_at ON public.landing_pages USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_landing_pages_edition ON public.landing_pages USING btree (edition_id) WHERE ((edition_id IS NOT NULL) AND (deleted_at IS NULL));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_landing_pages_tenant_id ON public.landing_pages USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_launch_editions_cloned_from ON public.launch_editions USING btree (cloned_from_edition_id) WHERE (cloned_from_edition_id IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_launch_editions_offer_structure ON public.launch_editions USING btree (offer_id, variant_structure);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_launch_editions_public_by_offer ON public.launch_editions USING btree (offer_id, status, start_date) WHERE ((visibility)::text = 'public'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_launch_editions_sort_rank ON public.launch_editions USING btree (offer_id, variant_structure, sort_rank) WHERE (sort_rank IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_launch_editions_structure_data_gin ON public.launch_editions USING gin (structure_data jsonb_path_ops);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_launch_editions_tenant_offer_status ON public.launch_editions USING btree (tenant_id, offer_id, status);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_lead_opt_ins_lookup ON public.lead_opt_ins USING btree (tenant_id, lead_id, channel, opted_in_at, opted_out_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_leads_country ON public.leads USING btree (tenant_id, country) WHERE (country IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_leads_customer_id ON public.leads USING btree (customer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_leads_deleted_at ON public.leads USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_leads_tenant_id ON public.leads USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_lifecycle_transitions_profile_id ON public.lifecycle_transitions USING btree (profile_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_lifecycle_transitions_tenant_id ON public.lifecycle_transitions USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_call_errors ON public.copilot_llm_call USING btree (tenant_id, started_at DESC) WHERE ((status)::text = 'error'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_call_logs_tenant_id ON public.llm_call_logs USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_call_tenant_day ON public.copilot_llm_call USING btree (tenant_id, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_call_tenant_model_day ON public.copilot_llm_call USING btree (tenant_id, model_responded, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_call_turn ON public.copilot_llm_call USING btree (turn_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_config_audit_role_created ON public.llm_config_audit USING btree (role, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_config_audit_tenant_created ON public.llm_config_audit USING btree (tenant_id, created_at DESC) WHERE (tenant_id IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_eval_gate_runs_role_ran_at ON public.llm_eval_gate_runs USING btree (role, ran_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_llm_role_binding_role_tenant_active ON public.llm_role_binding USING btree (role, tenant_id, is_active);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_marketing_assets_tenant_id ON public.marketing_assets USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_messages_tenant_id ON public.messages USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_metric_aggregations_tenant_id ON public.metric_aggregations USING btree (tenant_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_mv_daily_llm_cost_per_tenant_pk ON public.mv_daily_llm_cost_per_tenant USING btree (tenant_id, occurred_on, model_responded, provider, role);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_mv_daily_v2_pk ON public.mv_daily_llm_cost_per_tenant_v2 USING btree (agent_kind, tenant_id, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_mv_refresh_log_mv_name_recent ON public.mv_refresh_log USING btree (mv_name, refreshed_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_nps_responses_customer_id ON public.nps_responses USING btree (customer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_nps_responses_tenant_id ON public.nps_responses USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_nps_responses_tenant_survey ON public.nps_responses USING btree (tenant_id, survey_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_nps_surveys_tenant_customer ON public.nps_surveys USING btree (tenant_id, customer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_nps_surveys_tenant_id ON public.nps_surveys USING btree (tenant_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_nps_surveys_token ON public.nps_surveys USING btree (token);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_objections_tenant_id ON public.objections USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_assets_deleted_at ON public.offer_assets USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_assets_edition ON public.offer_assets USING btree (tenant_id, offer_id, edition_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_assets_offer_id ON public.offer_assets USING btree (offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_assets_shared ON public.offer_assets USING btree (tenant_id, offer_id) WHERE ((deleted_at IS NULL) AND (shared_across_editions = true));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_assets_tenant_id ON public.offer_assets USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_assets_tenant_offer ON public.offer_assets USING btree (tenant_id, offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_extraction_traces_job_id ON public.offer_extraction_traces USING btree (job_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_extraction_traces_tenant_id ON public.offer_extraction_traces USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_knowledge_sources_deleted_at ON public.offer_knowledge_sources USING btree (deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_knowledge_sources_offer_id ON public.offer_knowledge_sources USING btree (offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_knowledge_sources_tenant_id ON public.offer_knowledge_sources USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_knowledge_sources_tenant_offer ON public.offer_knowledge_sources USING btree (tenant_id, offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_offer_logs_tenant_id ON public.offer_logs USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_official_metrics_metric_date ON public.official_metrics USING btree (metric_date);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_official_metrics_tenant_id ON public.official_metrics USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_official_month ON public.official_metrics USING btree (tenant_id, month_key);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_official_quarter ON public.official_metrics USING btree (tenant_id, quarter_key);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_official_tenant_channel_date ON public.official_metrics USING btree (tenant_id, channel_slug, metric_date);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_official_week ON public.official_metrics USING btree (tenant_id, iso_week_start);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_outbox_pending ON public.domain_event_outbox USING btree (status, created_at) WHERE ((status)::text = 'pending'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_outbox_tenant_created ON public.domain_event_outbox USING btree (tenant_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_payment_grant_audit_tenant ON public.payment_grant_audit USING btree (tenant_id, created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_payment_link_status ON public.payment_link USING btree (tenant_id, status) WHERE (status = 'pending'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_payment_link_tenant_lead ON public.payment_link USING btree (tenant_id, lead_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_payment_webhook_tenant_received ON public.payment_webhook_event USING btree (tenant_id, received_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_period_metrics_tenant_period ON public.period_metrics USING btree (tenant_id, channel_slug, period_type, period_start);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_personality_profiles_tenant ON public.personality_profiles USING btree (tenant_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_placements_by_source ON public.social_proof_placements USING btree (source_table, source_id, deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_placements_for_surface ON public.social_proof_placements USING btree (tenant_id, surface_type, surface_ref_id, is_visible, deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_placements_tenant_id ON public.social_proof_placements USING btree (tenant_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_pricing_active ON public.model_pricing_snapshot USING btree (provider, model) WHERE (valid_to IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_pricing_lookup ON public.model_pricing_snapshot USING btree (provider, model, valid_from DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_products_active_by_tenant ON public.products USING btree (tenant_id) WHERE ((archived_at IS NULL) AND (deleted_at IS NULL));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_products_archived_by_tenant ON public.products USING btree (tenant_id, archived_at DESC) WHERE ((archived_at IS NOT NULL) AND (deleted_at IS NULL));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_products_name_trgm ON public.products USING gin (name public.gin_trgm_ops);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_products_tenant_id ON public.products USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_products_tenant_preset ON public.products USING btree (tenant_id, preset_id) WHERE (preset_id IS NOT NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_prompt_versions_key ON public.prompt_versions USING btree (key);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_prompt_versions_tenant_id ON public.prompt_versions USING btree (tenant_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_referral_codes_code ON public.referral_codes USING btree (code);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_referral_codes_customer_id ON public.referral_codes USING btree (customer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_referral_codes_tenant_customer ON public.referral_codes USING btree (tenant_id, customer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_referral_codes_tenant_id ON public.referral_codes USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_llm_call_errors ON public.sales_agent_llm_call USING btree (tenant_id, started_at DESC) WHERE ((status)::text = 'error'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_llm_call_lead ON public.sales_agent_llm_call USING btree (tenant_id, lead_id, started_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_llm_call_tenant_day ON public.sales_agent_llm_call USING btree (tenant_id, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_llm_call_tenant_model_day ON public.sales_agent_llm_call USING btree (tenant_id, model_responded, occurred_on);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_llm_call_turn ON public.sales_agent_llm_call USING btree (turn_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_routing_log_lead ON public.sales_agent_routing_log USING btree (tenant_id, lead_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_routing_log_tenant_time ON public.sales_agent_routing_log USING btree (tenant_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_routing_log_turn ON public.sales_agent_routing_log USING btree (turn_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_trace_event_errors ON public.sales_agent_trace_event USING btree (tenant_id, created_at DESC) WHERE ((status)::text = 'error'::text);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_trace_event_lead ON public.sales_agent_trace_event USING btree (tenant_id, lead_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_trace_event_tenant_time ON public.sales_agent_trace_event USING btree (tenant_id, created_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_trace_event_turn ON public.sales_agent_trace_event USING btree (turn_id, created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_agent_workflow_metric_tenant_period ON public.sales_agent_workflow_metric USING btree (tenant_id, period_start DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_customer_id ON public.sales USING btree (customer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_offer_id ON public.sales USING btree (offer_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_tenant_id ON public.sales USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sales_transaction_id ON public.sales USING btree (transaction_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_scheduler_webhook_tenant ON public.scheduler_webhook_event USING btree (tenant_id, received_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_segment_snapshot_tenant_segment_at ON public.segment_snapshot USING btree (tenant_id, segment_id, snapshotted_at DESC);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_segment_tenant_created ON public.segment USING btree (tenant_id, created_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sensitive_data_logs_tenant_id ON public.sensitive_data_logs USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_sensitive_data_tenant_id ON public.sensitive_data USING btree (tenant_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_shareable_links_token ON public.shareable_links USING btree (token);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_staging_metrics_metric_date ON public.staging_metrics USING btree (metric_date);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_staging_metrics_provider ON public.staging_metrics USING btree (provider);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_staging_metrics_tenant_id ON public.staging_metrics USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_staging_tenant_provider_date ON public.staging_metrics USING btree (tenant_id, provider, metric_date);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ix_team_members_primary_voice_unique ON public.team_members USING btree (tenant_id) WHERE ((is_primary_voice = true) AND (deleted_at IS NULL));
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_team_members_tenant_id ON public.team_members USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_team_members_tenant_sort ON public.team_members USING btree (tenant_id, sort_order);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_tenant_domains_hostname ON public.tenant_domains USING btree (hostname);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_tenant_domains_tenant_id ON public.tenant_domains USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_tenant_subscription_active ON public.tenant_subscription USING btree (tenant_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_tenant_subscription_plan_id ON public.tenant_subscription USING btree (plan_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_tenants_clerk_org_id ON public.tenants USING btree (clerk_org_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_testimonials_tags ON public.testimonials USING gin (tags);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_testimonials_tenant_active ON public.testimonials USING btree (tenant_id, is_active, deleted_at);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_testimonials_tenant_id ON public.testimonials USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_user_tenants_tenant_id ON public.user_tenants USING btree (tenant_id);
""")
    op.execute("""
CREATE INDEX IF NOT EXISTS ix_workflow_metric_tenant_period ON public.copilot_workflow_metric USING btree (tenant_id, period_start DESC);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_ad_campaigns_tenant_provider_ext ON public.ad_campaigns USING btree (tenant_id, provider, external_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_ad_sets_tenant_provider_ext ON public.ad_sets USING btree (tenant_id, provider, external_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_ads_tenant_provider_ext ON public.ads USING btree (tenant_id, provider, external_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_template_global_slug_alive ON public.campaign_template USING btree (slug) WHERE ((tenant_id IS NULL) AND (deleted_at IS NULL));
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_template_tenant_slug_alive ON public.campaign_template USING btree (tenant_id, slug) WHERE ((tenant_id IS NOT NULL) AND (deleted_at IS NULL));
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_channel_blacklist_tenant_channel_identifier ON public.channel_blacklist USING btree (tenant_id, channel, identifier) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_copilot_pinned_memory_tenant_user_path ON public.copilot_pinned_memory USING btree (tenant_id, user_id, path);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_external_product_mapping_tenant_source_ext ON public.external_product_mappings USING btree (tenant_id, source, external_id);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_landing_pages_tenant_slug ON public.landing_pages USING btree (tenant_id, slug) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_landing_per_offer_edition ON public.landing_pages USING btree (tenant_id, offer_id, edition_id) WHERE ((deleted_at IS NULL) AND (edition_id IS NOT NULL));
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_opt_ins_tenant_lead_channel ON public.lead_opt_ins USING btree (tenant_id, lead_id, channel);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_llm_role_binding_active_per_role ON public.llm_role_binding USING btree (role, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE (is_active = true);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_metric_agg_natural_key ON public.metric_aggregations USING btree (tenant_id, channel_slug, metric_name, period_type, period_start);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_official_metrics_natural_key ON public.official_metrics USING btree (tenant_id, provider, channel_slug, metric_name, metric_date, COALESCE(campaign_id, ''::character varying), COALESCE(ad_set_id, ''::character varying), COALESCE(ad_id, ''::character varying));
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_tenant_idem ON public.domain_event_outbox USING btree (tenant_id, idempotency_key);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_period_metrics_natural_key ON public.period_metrics USING btree (tenant_id, provider, channel_slug, metric_name, period_type, period_start, COALESCE(campaign_id, ''::character varying), COALESCE(ad_set_id, ''::character varying), COALESCE(ad_id, ''::character varying));
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_personality_profiles_active ON public.personality_profiles USING btree (tenant_id) WHERE ((is_active = true) AND (deleted_at IS NULL) AND (offer_id IS NULL) AND (avatar_id IS NULL));
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_placement_source_surface_alive ON public.social_proof_placements USING btree (source_table, source_id, surface_type, COALESCE(surface_ref_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_config_one_default ON public.plan_config USING btree (is_default) WHERE (is_default = true);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_agent_workflow_metric_period ON public.sales_agent_workflow_metric USING btree (tenant_id, bucket_id, period_start);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_scheduler_webhook_dedup ON public.scheduler_webhook_event USING btree (provider, tracking_id, event_type, occurred_at);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_segment_tenant_name_alive ON public.segment USING btree (tenant_id, name) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_staging_metrics_natural_key ON public.staging_metrics USING btree (tenant_id, provider, channel_slug, metric_name, metric_date, COALESCE(campaign_id, ''::character varying), COALESCE(ad_set_id, ''::character varying), COALESCE(ad_id, ''::character varying));
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_domains_tenant_hostname ON public.tenant_domains USING btree (tenant_id, hostname) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_metric_period ON public.copilot_workflow_metric USING btree (tenant_id, workflow_id, period_start);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ux_asset_links_unique_active ON public.asset_links USING btree (tenant_id, asset_id, entity_type, entity_id, role) WHERE (deleted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ux_copilot_mutation_journal_active_natural_key ON public.copilot_mutation_journal USING btree (tenant_id, conversation_id, message_id, field_path) WHERE (reverted_at IS NULL);
""")
    op.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS ux_copilot_tenant_limits_tenant_alive ON public.copilot_tenant_limits USING btree (tenant_id) WHERE (deleted_at IS NULL);
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_campaign_templates_pkey' AND conrelid = 'public.ad_campaign_templates'::regclass) THEN
        ALTER TABLE public.ad_campaign_templates ADD CONSTRAINT ad_campaign_templates_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_campaigns_pkey' AND conrelid = 'public.ad_campaigns'::regclass) THEN
        ALTER TABLE public.ad_campaigns ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_offer_associations_pkey' AND conrelid = 'public.ad_offer_associations'::regclass) THEN
        ALTER TABLE public.ad_offer_associations ADD CONSTRAINT ad_offer_associations_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_recommendations_pkey' AND conrelid = 'public.ad_recommendations'::regclass) THEN
        ALTER TABLE public.ad_recommendations ADD CONSTRAINT ad_recommendations_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ad_sets_pkey' AND conrelid = 'public.ad_sets'::regclass) THEN
        ALTER TABLE public.ad_sets ADD CONSTRAINT ad_sets_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ads_pkey' AND conrelid = 'public.ads'::regclass) THEN
        ALTER TABLE public.ads ADD CONSTRAINT ads_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_state_checkpoints_pkey' AND conrelid = 'public.agent_state_checkpoints'::regclass) THEN
        ALTER TABLE public.agent_state_checkpoints ADD CONSTRAINT agent_state_checkpoints_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_traces_pkey' AND conrelid = 'public.agent_traces'::regclass) THEN
        ALTER TABLE public.agent_traces ADD CONSTRAINT agent_traces_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_pkey' AND conrelid = 'public.appointments'::regclass) THEN
        ALTER TABLE public.appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_links_pkey' AND conrelid = 'public.asset_links'::regclass) THEN
        ALTER TABLE public.asset_links ADD CONSTRAINT asset_links_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_pkey' AND conrelid = 'public.assets'::regclass) THEN
        ALTER TABLE public.assets ADD CONSTRAINT assets_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'authority_items_pkey' AND conrelid = 'public.authority_items'::regclass) THEN
        ALTER TABLE public.authority_items ADD CONSTRAINT authority_items_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avatar_definitions_pkey' AND conrelid = 'public.avatar_definitions'::regclass) THEN
        ALTER TABLE public.avatar_definitions ADD CONSTRAINT avatar_definitions_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avatars_pkey' AND conrelid = 'public.avatars'::regclass) THEN
        ALTER TABLE public.avatars ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_links_pkey' AND conrelid = 'public.booking_links'::regclass) THEN
        ALTER TABLE public.booking_links ADD CONSTRAINT booking_links_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_extraction_traces_pkey' AND conrelid = 'public.brand_extraction_traces'::regclass) THEN
        ALTER TABLE public.brand_extraction_traces ADD CONSTRAINT brand_extraction_traces_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_summary_pkey' AND conrelid = 'public.brand_summary'::regclass) THEN
        ALTER TABLE public.brand_summary ADD CONSTRAINT brand_summary_pkey PRIMARY KEY (tenant_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buyer_personas_pkey' AND conrelid = 'public.buyer_personas'::regclass) THEN
        ALTER TABLE public.buyer_personas ADD CONSTRAINT buyer_personas_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_audit_pkey' AND conrelid = 'public.campaign_audit'::regclass) THEN
        ALTER TABLE public.campaign_audit ADD CONSTRAINT campaign_audit_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_llm_call_pkey' AND conrelid = 'public.campaign_llm_call'::regclass) THEN
        ALTER TABLE public.campaign_llm_call ADD CONSTRAINT campaign_llm_call_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_pkey' AND conrelid = 'public.campaign'::regclass) THEN
        ALTER TABLE public.campaign ADD CONSTRAINT campaign_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_step_pkey' AND conrelid = 'public.campaign_step'::regclass) THEN
        ALTER TABLE public.campaign_step ADD CONSTRAINT campaign_step_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_task_pkey' AND conrelid = 'public.campaign_task'::regclass) THEN
        ALTER TABLE public.campaign_task ADD CONSTRAINT campaign_task_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_template_pkey' AND conrelid = 'public.campaign_template'::regclass) THEN
        ALTER TABLE public.campaign_template ADD CONSTRAINT campaign_template_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_trace_event_pkey' AND conrelid = 'public.campaign_trace_event'::regclass) THEN
        ALTER TABLE public.campaign_trace_event ADD CONSTRAINT campaign_trace_event_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'channel_blacklist_pkey' AND conrelid = 'public.channel_blacklist'::regclass) THEN
        ALTER TABLE public.channel_blacklist ADD CONSTRAINT channel_blacklist_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'channel_connections_pkey' AND conrelid = 'public.channel_connections'::regclass) THEN
        ALTER TABLE public.channel_connections ADD CONSTRAINT channel_connections_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'channel_cost_settings_pkey' AND conrelid = 'public.channel_cost_settings'::regclass) THEN
        ALTER TABLE public.channel_cost_settings ADD CONSTRAINT channel_cost_settings_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commercial_calendar_events_pkey' AND conrelid = 'public.commercial_calendar_events'::regclass) THEN
        ALTER TABLE public.commercial_calendar_events ADD CONSTRAINT commercial_calendar_events_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_backfill_runs_pkey' AND conrelid = 'public.copilot_backfill_runs'::regclass) THEN
        ALTER TABLE public.copilot_backfill_runs ADD CONSTRAINT copilot_backfill_runs_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_channel_links_pkey' AND conrelid = 'public.copilot_channel_links'::regclass) THEN
        ALTER TABLE public.copilot_channel_links ADD CONSTRAINT copilot_channel_links_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_conversations_pkey' AND conrelid = 'public.copilot_conversations'::regclass) THEN
        ALTER TABLE public.copilot_conversations ADD CONSTRAINT copilot_conversations_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_events_pkey' AND conrelid = 'public.copilot_events'::regclass) THEN
        ALTER TABLE public.copilot_events ADD CONSTRAINT copilot_events_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_inspiration_pkey' AND conrelid = 'public.copilot_inspiration'::regclass) THEN
        ALTER TABLE public.copilot_inspiration ADD CONSTRAINT copilot_inspiration_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_link_tokens_pkey' AND conrelid = 'public.copilot_link_tokens'::regclass) THEN
        ALTER TABLE public.copilot_link_tokens ADD CONSTRAINT copilot_link_tokens_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_llm_call_pkey' AND conrelid = 'public.copilot_llm_call'::regclass) THEN
        ALTER TABLE public.copilot_llm_call ADD CONSTRAINT copilot_llm_call_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_mutation_journal_pkey' AND conrelid = 'public.copilot_mutation_journal'::regclass) THEN
        ALTER TABLE public.copilot_mutation_journal ADD CONSTRAINT copilot_mutation_journal_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_pinned_memory_pkey' AND conrelid = 'public.copilot_pinned_memory'::regclass) THEN
        ALTER TABLE public.copilot_pinned_memory ADD CONSTRAINT copilot_pinned_memory_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_routing_log_pkey' AND conrelid = 'public.copilot_routing_log'::regclass) THEN
        ALTER TABLE public.copilot_routing_log ADD CONSTRAINT copilot_routing_log_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_tenant_limits_audit_pkey' AND conrelid = 'public.copilot_tenant_limits_audit'::regclass) THEN
        ALTER TABLE public.copilot_tenant_limits_audit ADD CONSTRAINT copilot_tenant_limits_audit_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_tenant_limits_pkey' AND conrelid = 'public.copilot_tenant_limits'::regclass) THEN
        ALTER TABLE public.copilot_tenant_limits ADD CONSTRAINT copilot_tenant_limits_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_trace_event_pkey' AND conrelid = 'public.copilot_trace_event'::regclass) THEN
        ALTER TABLE public.copilot_trace_event ADD CONSTRAINT copilot_trace_event_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'copilot_workflow_metric_pkey' AND conrelid = 'public.copilot_workflow_metric'::regclass) THEN
        ALTER TABLE public.copilot_workflow_metric ADD CONSTRAINT copilot_workflow_metric_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_identities_pkey' AND conrelid = 'public.customer_identities'::regclass) THEN
        ALTER TABLE public.customer_identities ADD CONSTRAINT customer_identities_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_profiles_pkey' AND conrelid = 'public.customer_profiles'::regclass) THEN
        ALTER TABLE public.customer_profiles ADD CONSTRAINT customer_profiles_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_pkey' AND conrelid = 'public.documents'::regclass) THEN
        ALTER TABLE public.documents ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'domain_event_outbox_pkey' AND conrelid = 'public.domain_event_outbox'::regclass) THEN
        ALTER TABLE public.domain_event_outbox ADD CONSTRAINT domain_event_outbox_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_pkey' AND conrelid = 'public.journey_progress'::regclass) THEN
        ALTER TABLE public.journey_progress ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_pkey1' AND conrelid = 'public.enrollments'::regclass) THEN
        ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_pkey1 PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eval_simulator_grade_cache_pkey' AND conrelid = 'public.eval_simulator_grade_cache'::regclass) THEN
        ALTER TABLE public.eval_simulator_grade_cache ADD CONSTRAINT eval_simulator_grade_cache_pkey PRIMARY KEY (cache_key);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eval_simulator_llm_call_pkey' AND conrelid = 'public.eval_simulator_llm_call'::regclass) THEN
        ALTER TABLE public.eval_simulator_llm_call ADD CONSTRAINT eval_simulator_llm_call_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eval_simulator_trace_event_pkey' AND conrelid = 'public.eval_simulator_trace_event'::regclass) THEN
        ALTER TABLE public.eval_simulator_trace_event ADD CONSTRAINT eval_simulator_trace_event_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eval_synthetic_tenants_pkey' AND conrelid = 'public.eval_synthetic_tenants'::regclass) THEN
        ALTER TABLE public.eval_synthetic_tenants ADD CONSTRAINT eval_synthetic_tenants_pkey PRIMARY KEY (tenant_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'external_product_mappings_pkey' AND conrelid = 'public.external_product_mappings'::regclass) THEN
        ALTER TABLE public.external_product_mappings ADD CONSTRAINT external_product_mappings_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extraction_runs_pkey' AND conrelid = 'public.extraction_runs'::regclass) THEN
        ALTER TABLE public.extraction_runs ADD CONSTRAINT extraction_runs_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gallery_images_pkey' AND conrelid = 'public.gallery_images'::regclass) THEN
        ALTER TABLE public.gallery_images ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journey_events_pkey' AND conrelid = 'public.journey_events'::regclass) THEN
        ALTER TABLE public.journey_events ADD CONSTRAINT journey_events_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'landing_pages_pkey' AND conrelid = 'public.landing_pages'::regclass) THEN
        ALTER TABLE public.landing_pages ADD CONSTRAINT landing_pages_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'launch_editions_pkey' AND conrelid = 'public.launch_editions'::regclass) THEN
        ALTER TABLE public.launch_editions ADD CONSTRAINT launch_editions_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lead_opt_ins_pkey' AND conrelid = 'public.lead_opt_ins'::regclass) THEN
        ALTER TABLE public.lead_opt_ins ADD CONSTRAINT lead_opt_ins_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_api_id_key' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT leads_api_id_key UNIQUE (api_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lifecycle_transitions_pkey' AND conrelid = 'public.lifecycle_transitions'::regclass) THEN
        ALTER TABLE public.lifecycle_transitions ADD CONSTRAINT lifecycle_transitions_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_call_logs_pkey' AND conrelid = 'public.llm_call_logs'::regclass) THEN
        ALTER TABLE public.llm_call_logs ADD CONSTRAINT llm_call_logs_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_config_audit_pkey' AND conrelid = 'public.llm_config_audit'::regclass) THEN
        ALTER TABLE public.llm_config_audit ADD CONSTRAINT llm_config_audit_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_eval_gate_runs_pkey' AND conrelid = 'public.llm_eval_gate_runs'::regclass) THEN
        ALTER TABLE public.llm_eval_gate_runs ADD CONSTRAINT llm_eval_gate_runs_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_eval_gate_threshold_pkey' AND conrelid = 'public.llm_eval_gate_threshold'::regclass) THEN
        ALTER TABLE public.llm_eval_gate_threshold ADD CONSTRAINT llm_eval_gate_threshold_pkey PRIMARY KEY (role);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_logs_pkey' AND conrelid = 'public.llm_logs'::regclass) THEN
        ALTER TABLE public.llm_logs ADD CONSTRAINT llm_logs_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_role_binding_pkey' AND conrelid = 'public.llm_role_binding'::regclass) THEN
        ALTER TABLE public.llm_role_binding ADD CONSTRAINT llm_role_binding_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_assets_pkey' AND conrelid = 'public.marketing_assets'::regclass) THEN
        ALTER TABLE public.marketing_assets ADD CONSTRAINT marketing_assets_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_pkey' AND conrelid = 'public.messages'::regclass) THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'metric_aggregations_pkey' AND conrelid = 'public.metric_aggregations'::regclass) THEN
        ALTER TABLE public.metric_aggregations ADD CONSTRAINT metric_aggregations_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'model_pricing_snapshot_pkey' AND conrelid = 'public.model_pricing_snapshot'::regclass) THEN
        ALTER TABLE public.model_pricing_snapshot ADD CONSTRAINT model_pricing_snapshot_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mv_refresh_log_pkey' AND conrelid = 'public.mv_refresh_log'::regclass) THEN
        ALTER TABLE public.mv_refresh_log ADD CONSTRAINT mv_refresh_log_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nps_responses_pkey' AND conrelid = 'public.nps_responses'::regclass) THEN
        ALTER TABLE public.nps_responses ADD CONSTRAINT nps_responses_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nps_surveys_pkey' AND conrelid = 'public.nps_surveys'::regclass) THEN
        ALTER TABLE public.nps_surveys ADD CONSTRAINT nps_surveys_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nps_surveys_token_key' AND conrelid = 'public.nps_surveys'::regclass) THEN
        ALTER TABLE public.nps_surveys ADD CONSTRAINT nps_surveys_token_key UNIQUE (token);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'objections_pkey' AND conrelid = 'public.objections'::regclass) THEN
        ALTER TABLE public.objections ADD CONSTRAINT objections_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_assets_pkey' AND conrelid = 'public.offer_assets'::regclass) THEN
        ALTER TABLE public.offer_assets ADD CONSTRAINT offer_assets_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_extraction_traces_pkey' AND conrelid = 'public.offer_extraction_traces'::regclass) THEN
        ALTER TABLE public.offer_extraction_traces ADD CONSTRAINT offer_extraction_traces_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_knowledge_sources_pkey' AND conrelid = 'public.offer_knowledge_sources'::regclass) THEN
        ALTER TABLE public.offer_knowledge_sources ADD CONSTRAINT offer_knowledge_sources_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_logs_pkey' AND conrelid = 'public.offer_logs'::regclass) THEN
        ALTER TABLE public.offer_logs ADD CONSTRAINT offer_logs_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'official_metrics_pkey' AND conrelid = 'public.official_metrics'::regclass) THEN
        ALTER TABLE public.official_metrics ADD CONSTRAINT official_metrics_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_grant_audit_pkey' AND conrelid = 'public.payment_grant_audit'::regclass) THEN
        ALTER TABLE public.payment_grant_audit ADD CONSTRAINT payment_grant_audit_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_link_pkey' AND conrelid = 'public.payment_link'::regclass) THEN
        ALTER TABLE public.payment_link ADD CONSTRAINT payment_link_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_webhook_event_pkey' AND conrelid = 'public.payment_webhook_event'::regclass) THEN
        ALTER TABLE public.payment_webhook_event ADD CONSTRAINT payment_webhook_event_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'period_metrics_pkey' AND conrelid = 'public.period_metrics'::regclass) THEN
        ALTER TABLE public.period_metrics ADD CONSTRAINT period_metrics_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'personality_profiles_pkey' AND conrelid = 'public.personality_profiles'::regclass) THEN
        ALTER TABLE public.personality_profiles ADD CONSTRAINT personality_profiles_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pk_eval_simulator_grade' AND conrelid = 'public.eval_simulator_grade'::regclass) THEN
        ALTER TABLE public.eval_simulator_grade ADD CONSTRAINT pk_eval_simulator_grade PRIMARY KEY (simulation_id, turn_n, rubric_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plan_config_pkey' AND conrelid = 'public.plan_config'::regclass) THEN
        ALTER TABLE public.plan_config ADD CONSTRAINT plan_config_pkey PRIMARY KEY (plan_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_pkey' AND conrelid = 'public.products'::regclass) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prompt_versions_pkey' AND conrelid = 'public.prompt_versions'::regclass) THEN
        ALTER TABLE public.prompt_versions ADD CONSTRAINT prompt_versions_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_codes_code_key' AND conrelid = 'public.referral_codes'::regclass) THEN
        ALTER TABLE public.referral_codes ADD CONSTRAINT referral_codes_code_key UNIQUE (code);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_codes_pkey' AND conrelid = 'public.referral_codes'::regclass) THEN
        ALTER TABLE public.referral_codes ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_agent_llm_call_pkey' AND conrelid = 'public.sales_agent_llm_call'::regclass) THEN
        ALTER TABLE public.sales_agent_llm_call ADD CONSTRAINT sales_agent_llm_call_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_agent_routing_log_pkey' AND conrelid = 'public.sales_agent_routing_log'::regclass) THEN
        ALTER TABLE public.sales_agent_routing_log ADD CONSTRAINT sales_agent_routing_log_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_agent_trace_event_pkey' AND conrelid = 'public.sales_agent_trace_event'::regclass) THEN
        ALTER TABLE public.sales_agent_trace_event ADD CONSTRAINT sales_agent_trace_event_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_agent_workflow_metric_pkey' AND conrelid = 'public.sales_agent_workflow_metric'::regclass) THEN
        ALTER TABLE public.sales_agent_workflow_metric ADD CONSTRAINT sales_agent_workflow_metric_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_pkey' AND conrelid = 'public.sales'::regclass) THEN
        ALTER TABLE public.sales ADD CONSTRAINT sales_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduler_webhook_event_pkey' AND conrelid = 'public.scheduler_webhook_event'::regclass) THEN
        ALTER TABLE public.scheduler_webhook_event ADD CONSTRAINT scheduler_webhook_event_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'segment_pkey' AND conrelid = 'public.segment'::regclass) THEN
        ALTER TABLE public.segment ADD CONSTRAINT segment_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'segment_snapshot_pkey' AND conrelid = 'public.segment_snapshot'::regclass) THEN
        ALTER TABLE public.segment_snapshot ADD CONSTRAINT segment_snapshot_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensitive_data_logs_pkey' AND conrelid = 'public.sensitive_data_logs'::regclass) THEN
        ALTER TABLE public.sensitive_data_logs ADD CONSTRAINT sensitive_data_logs_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensitive_data_pkey' AND conrelid = 'public.sensitive_data'::regclass) THEN
        ALTER TABLE public.sensitive_data ADD CONSTRAINT sensitive_data_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shareable_links_pkey' AND conrelid = 'public.shareable_links'::regclass) THEN
        ALTER TABLE public.shareable_links ADD CONSTRAINT shareable_links_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_proof_placements_pkey' AND conrelid = 'public.social_proof_placements'::regclass) THEN
        ALTER TABLE public.social_proof_placements ADD CONSTRAINT social_proof_placements_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staging_metrics_pkey' AND conrelid = 'public.staging_metrics'::regclass) THEN
        ALTER TABLE public.staging_metrics ADD CONSTRAINT staging_metrics_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_pkey' AND conrelid = 'public.team_members'::regclass) THEN
        ALTER TABLE public.team_members ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_billing_config_pkey' AND conrelid = 'public.tenant_billing_config'::regclass) THEN
        ALTER TABLE public.tenant_billing_config ADD CONSTRAINT tenant_billing_config_pkey PRIMARY KEY (tenant_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_domains_pkey' AND conrelid = 'public.tenant_domains'::regclass) THEN
        ALTER TABLE public.tenant_domains ADD CONSTRAINT tenant_domains_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_profiles_pkey' AND conrelid = 'public.tenant_profiles'::regclass) THEN
        ALTER TABLE public.tenant_profiles ADD CONSTRAINT tenant_profiles_pkey PRIMARY KEY (tenant_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_subscription_pkey' AND conrelid = 'public.tenant_subscription'::regclass) THEN
        ALTER TABLE public.tenant_subscription ADD CONSTRAINT tenant_subscription_pkey PRIMARY KEY (tenant_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_pkey' AND conrelid = 'public.tenants'::regclass) THEN
        ALTER TABLE public.tenants ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_pkey' AND conrelid = 'public.testimonials'::regclass) THEN
        ALTER TABLE public.testimonials ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_campaign_task_tenant_idem' AND conrelid = 'public.campaign_task'::regclass) THEN
        ALTER TABLE public.campaign_task ADD CONSTRAINT uq_campaign_task_tenant_idem UNIQUE (tenant_id, idempotency_key);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_channel_cost_tenant_slug_type' AND conrelid = 'public.channel_cost_settings'::regclass) THEN
        ALTER TABLE public.channel_cost_settings ADD CONSTRAINT uq_channel_cost_tenant_slug_type UNIQUE (tenant_id, channel_slug, cost_type);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_copilot_channel_link_chat' AND conrelid = 'public.copilot_channel_links'::regclass) THEN
        ALTER TABLE public.copilot_channel_links ADD CONSTRAINT uq_copilot_channel_link_chat UNIQUE (tenant_id, channel_type, channel_user_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_copilot_inspiration_conversation_slug' AND conrelid = 'public.copilot_inspiration'::regclass) THEN
        ALTER TABLE public.copilot_inspiration ADD CONSTRAINT uq_copilot_inspiration_conversation_slug UNIQUE (conversation_id, slug);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_copilot_link_token_hash' AND conrelid = 'public.copilot_link_tokens'::regclass) THEN
        ALTER TABLE public.copilot_link_tokens ADD CONSTRAINT uq_copilot_link_token_hash UNIQUE (token_hash);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_launch_editions_offer_number' AND conrelid = 'public.launch_editions'::regclass) THEN
        ALTER TABLE public.launch_editions ADD CONSTRAINT uq_launch_editions_offer_number UNIQUE (offer_id, edition_number);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_payment_grant_natural_key' AND conrelid = 'public.payment_grant_audit'::regclass) THEN
        ALTER TABLE public.payment_grant_audit ADD CONSTRAINT uq_payment_grant_natural_key UNIQUE (tenant_id, lead_id, offer_id, payment_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_payment_link_provider_external' AND conrelid = 'public.payment_link'::regclass) THEN
        ALTER TABLE public.payment_link ADD CONSTRAINT uq_payment_link_provider_external UNIQUE (tenant_id, provider, external_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_payment_webhook_dedup' AND conrelid = 'public.payment_webhook_event'::regclass) THEN
        ALTER TABLE public.payment_webhook_event ADD CONSTRAINT uq_payment_webhook_dedup UNIQUE (provider, external_id, event_type, occurred_at);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenants_pkey' AND conrelid = 'public.user_tenants'::regclass) THEN
        ALTER TABLE public.user_tenants ADD CONSTRAINT user_tenants_pkey PRIMARY KEY (user_id, tenant_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_instagram_id_key' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT users_instagram_id_key UNIQUE (instagram_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_pkey' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_pkey1' AND conrelid = 'public.users'::regclass) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_pkey1 PRIMARY KEY (id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_telegram_id_key' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_tiktok_id_key' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT users_tiktok_id_key UNIQUE (tiktok_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_whatsapp_id_key' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT users_whatsapp_id_key UNIQUE (whatsapp_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_traces_tenant_id_fkey' AND conrelid = 'public.agent_traces'::regclass) THEN
        ALTER TABLE public.agent_traces ADD CONSTRAINT agent_traces_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_traces_user_id_fkey' AND conrelid = 'public.agent_traces'::regclass) THEN
        ALTER TABLE public.agent_traces ADD CONSTRAINT agent_traces_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_lead_id_fkey' AND conrelid = 'public.appointments'::regclass) THEN
        ALTER TABLE public.appointments ADD CONSTRAINT appointments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_product_id_fkey' AND conrelid = 'public.appointments'::regclass) THEN
        ALTER TABLE public.appointments ADD CONSTRAINT appointments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_tenant_id_fkey' AND conrelid = 'public.appointments'::regclass) THEN
        ALTER TABLE public.appointments ADD CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_user_id_fkey' AND conrelid = 'public.appointments'::regclass) THEN
        ALTER TABLE public.appointments ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_links_asset_id_fkey' AND conrelid = 'public.asset_links'::regclass) THEN
        ALTER TABLE public.asset_links ADD CONSTRAINT asset_links_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_offer_id_fkey' AND conrelid = 'public.assets'::regclass) THEN
        ALTER TABLE public.assets ADD CONSTRAINT assets_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_tenant_id_fkey' AND conrelid = 'public.assets'::regclass) THEN
        ALTER TABLE public.assets ADD CONSTRAINT assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avatar_definitions_tenant_id_fkey' AND conrelid = 'public.avatar_definitions'::regclass) THEN
        ALTER TABLE public.avatar_definitions ADD CONSTRAINT avatar_definitions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avatar_definitions_user_id_fkey' AND conrelid = 'public.avatar_definitions'::regclass) THEN
        ALTER TABLE public.avatar_definitions ADD CONSTRAINT avatar_definitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avatars_tenant_id_fkey' AND conrelid = 'public.avatars'::regclass) THEN
        ALTER TABLE public.avatars ADD CONSTRAINT avatars_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_links_lead_id_fkey' AND conrelid = 'public.booking_links'::regclass) THEN
        ALTER TABLE public.booking_links ADD CONSTRAINT booking_links_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_links_tenant_id_fkey' AND conrelid = 'public.booking_links'::regclass) THEN
        ALTER TABLE public.booking_links ADD CONSTRAINT booking_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'channel_connections_tenant_id_fkey' AND conrelid = 'public.channel_connections'::regclass) THEN
        ALTER TABLE public.channel_connections ADD CONSTRAINT channel_connections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_identities_profile_id_fkey' AND conrelid = 'public.customer_identities'::regclass) THEN
        ALTER TABLE public.customer_identities ADD CONSTRAINT customer_identities_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_tenant_id_fkey' AND conrelid = 'public.documents'::regclass) THEN
        ALTER TABLE public.documents ADD CONSTRAINT documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_edition_id_fkey' AND conrelid = 'public.enrollments'::regclass) THEN
        ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_edition_id_fkey FOREIGN KEY (edition_id) REFERENCES public.launch_editions(id) ON DELETE SET NULL;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_offer_id_fkey' AND conrelid = 'public.enrollments'::regclass) THEN
        ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_product_id_fkey' AND conrelid = 'public.journey_progress'::regclass) THEN
        ALTER TABLE public.journey_progress ADD CONSTRAINT enrollments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_tenant_id_fkey' AND conrelid = 'public.journey_progress'::regclass) THEN
        ALTER TABLE public.journey_progress ADD CONSTRAINT enrollments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_user_id_fkey' AND conrelid = 'public.journey_progress'::regclass) THEN
        ALTER TABLE public.journey_progress ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'external_product_mappings_offer_id_fkey' AND conrelid = 'public.external_product_mappings'::regclass) THEN
        ALTER TABLE public.external_product_mappings ADD CONSTRAINT external_product_mappings_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_edition' AND conrelid = 'public.offer_assets'::regclass) THEN
        ALTER TABLE public.offer_assets ADD CONSTRAINT fk_asset_edition FOREIGN KEY (edition_id) REFERENCES public.launch_editions(id) ON DELETE SET NULL NOT VALID;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_marketing_asset_id' AND conrelid = 'public.documents'::regclass) THEN
        ALTER TABLE public.documents ADD CONSTRAINT fk_documents_marketing_asset_id FOREIGN KEY (marketing_asset_id) REFERENCES public.marketing_assets(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_product_id' AND conrelid = 'public.documents'::regclass) THEN
        ALTER TABLE public.documents ADD CONSTRAINT fk_documents_product_id FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_edition_cloned_from' AND conrelid = 'public.launch_editions'::regclass) THEN
        ALTER TABLE public.launch_editions ADD CONSTRAINT fk_edition_cloned_from FOREIGN KEY (cloned_from_edition_id) REFERENCES public.launch_editions(id) ON DELETE SET NULL NOT VALID;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_gallery_images_offer_id' AND conrelid = 'public.gallery_images'::regclass) THEN
        ALTER TABLE public.gallery_images ADD CONSTRAINT fk_gallery_images_offer_id FOREIGN KEY (offer_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_landing_edition' AND conrelid = 'public.landing_pages'::regclass) THEN
        ALTER TABLE public.landing_pages ADD CONSTRAINT fk_landing_edition FOREIGN KEY (edition_id) REFERENCES public.launch_editions(id) ON DELETE CASCADE NOT VALID;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_customer_id' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT fk_leads_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_avatar_id' AND conrelid = 'public.products'::regclass) THEN
        ALTER TABLE public.products ADD CONSTRAINT fk_products_avatar_id FOREIGN KEY (avatar_id) REFERENCES public.avatar_definitions(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gallery_images_tenant_id_fkey' AND conrelid = 'public.gallery_images'::regclass) THEN
        ALTER TABLE public.gallery_images ADD CONSTRAINT gallery_images_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journey_events_profile_id_fkey' AND conrelid = 'public.journey_events'::regclass) THEN
        ALTER TABLE public.journey_events ADD CONSTRAINT journey_events_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'landing_pages_offer_id_fkey' AND conrelid = 'public.landing_pages'::regclass) THEN
        ALTER TABLE public.landing_pages ADD CONSTRAINT landing_pages_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'landing_pages_tenant_id_fkey' AND conrelid = 'public.landing_pages'::regclass) THEN
        ALTER TABLE public.landing_pages ADD CONSTRAINT landing_pages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'launch_editions_offer_id_fkey' AND conrelid = 'public.launch_editions'::regclass) THEN
        ALTER TABLE public.launch_editions ADD CONSTRAINT launch_editions_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lead_opt_ins_lead_id_fkey' AND conrelid = 'public.lead_opt_ins'::regclass) THEN
        ALTER TABLE public.lead_opt_ins ADD CONSTRAINT lead_opt_ins_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lifecycle_transitions_profile_id_fkey' AND conrelid = 'public.lifecycle_transitions'::regclass) THEN
        ALTER TABLE public.lifecycle_transitions ADD CONSTRAINT lifecycle_transitions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_call_logs_tenant_id_fkey' AND conrelid = 'public.llm_call_logs'::regclass) THEN
        ALTER TABLE public.llm_call_logs ADD CONSTRAINT llm_call_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_call_logs_trace_id_fkey' AND conrelid = 'public.llm_call_logs'::regclass) THEN
        ALTER TABLE public.llm_call_logs ADD CONSTRAINT llm_call_logs_trace_id_fkey FOREIGN KEY (trace_id) REFERENCES public.agent_traces(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'llm_logs_trace_id_fkey' AND conrelid = 'public.llm_logs'::regclass) THEN
        ALTER TABLE public.llm_logs ADD CONSTRAINT llm_logs_trace_id_fkey FOREIGN KEY (trace_id) REFERENCES public.agent_traces(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_assets_product_id_fkey' AND conrelid = 'public.marketing_assets'::regclass) THEN
        ALTER TABLE public.marketing_assets ADD CONSTRAINT marketing_assets_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketing_assets_tenant_id_fkey' AND conrelid = 'public.marketing_assets'::regclass) THEN
        ALTER TABLE public.marketing_assets ADD CONSTRAINT marketing_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_product_context_id_fkey' AND conrelid = 'public.messages'::regclass) THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_product_context_id_fkey FOREIGN KEY (product_context_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_tenant_id_fkey' AND conrelid = 'public.messages'::regclass) THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_user_id_fkey' AND conrelid = 'public.messages'::regclass) THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nps_responses_customer_id_fkey' AND conrelid = 'public.nps_responses'::regclass) THEN
        ALTER TABLE public.nps_responses ADD CONSTRAINT nps_responses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nps_responses_survey_id_fkey' AND conrelid = 'public.nps_responses'::regclass) THEN
        ALTER TABLE public.nps_responses ADD CONSTRAINT nps_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.nps_surveys(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nps_surveys_customer_id_fkey' AND conrelid = 'public.nps_surveys'::regclass) THEN
        ALTER TABLE public.nps_surveys ADD CONSTRAINT nps_surveys_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'objections_product_id_fkey' AND conrelid = 'public.objections'::regclass) THEN
        ALTER TABLE public.objections ADD CONSTRAINT objections_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'objections_tenant_id_fkey' AND conrelid = 'public.objections'::regclass) THEN
        ALTER TABLE public.objections ADD CONSTRAINT objections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_assets_offer_id_fkey' AND conrelid = 'public.offer_assets'::regclass) THEN
        ALTER TABLE public.offer_assets ADD CONSTRAINT offer_assets_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_knowledge_sources_offer_id_fkey' AND conrelid = 'public.offer_knowledge_sources'::regclass) THEN
        ALTER TABLE public.offer_knowledge_sources ADD CONSTRAINT offer_knowledge_sources_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_logs_product_id_fkey' AND conrelid = 'public.offer_logs'::regclass) THEN
        ALTER TABLE public.offer_logs ADD CONSTRAINT offer_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_logs_tenant_id_fkey' AND conrelid = 'public.offer_logs'::regclass) THEN
        ALTER TABLE public.offer_logs ADD CONSTRAINT offer_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offer_logs_user_id_fkey' AND conrelid = 'public.offer_logs'::regclass) THEN
        ALTER TABLE public.offer_logs ADD CONSTRAINT offer_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.leads(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_downsell_product_id_fkey' AND conrelid = 'public.products'::regclass) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_downsell_product_id_fkey FOREIGN KEY (downsell_product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_id_fkey' AND conrelid = 'public.products'::regclass) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_upsell_product_id_fkey' AND conrelid = 'public.products'::regclass) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_upsell_product_id_fkey FOREIGN KEY (upsell_product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prompt_versions_tenant_id_fkey' AND conrelid = 'public.prompt_versions'::regclass) THEN
        ALTER TABLE public.prompt_versions ADD CONSTRAINT prompt_versions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_codes_customer_id_fkey' AND conrelid = 'public.referral_codes'::regclass) THEN
        ALTER TABLE public.referral_codes ADD CONSTRAINT referral_codes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_customer_id_fkey' AND conrelid = 'public.sales'::regclass) THEN
        ALTER TABLE public.sales ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_offer_id_fkey' AND conrelid = 'public.sales'::regclass) THEN
        ALTER TABLE public.sales ADD CONSTRAINT sales_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensitive_data_product_id_fkey' AND conrelid = 'public.sensitive_data'::regclass) THEN
        ALTER TABLE public.sensitive_data ADD CONSTRAINT sensitive_data_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensitive_data_tenant_id_fkey' AND conrelid = 'public.sensitive_data'::regclass) THEN
        ALTER TABLE public.sensitive_data ADD CONSTRAINT sensitive_data_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shareable_links_created_by_fkey' AND conrelid = 'public.shareable_links'::regclass) THEN
        ALTER TABLE public.shareable_links ADD CONSTRAINT shareable_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shareable_links_tenant_id_fkey' AND conrelid = 'public.shareable_links'::regclass) THEN
        ALTER TABLE public.shareable_links ADD CONSTRAINT shareable_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staging_metrics_extraction_run_id_fkey' AND conrelid = 'public.staging_metrics'::regclass) THEN
        ALTER TABLE public.staging_metrics ADD CONSTRAINT staging_metrics_extraction_run_id_fkey FOREIGN KEY (extraction_run_id) REFERENCES public.extraction_runs(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_profiles_tenant_id_fkey' AND conrelid = 'public.tenant_profiles'::regclass) THEN
        ALTER TABLE public.tenant_profiles ADD CONSTRAINT tenant_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_subscription_plan_id_fkey' AND conrelid = 'public.tenant_subscription'::regclass) THEN
        ALTER TABLE public.tenant_subscription ADD CONSTRAINT tenant_subscription_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plan_config(plan_id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenants_tenant_id_fkey' AND conrelid = 'public.user_tenants'::regclass) THEN
        ALTER TABLE public.user_tenants ADD CONSTRAINT user_tenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenants_user_id_fkey' AND conrelid = 'public.user_tenants'::regclass) THEN
        ALTER TABLE public.user_tenants ADD CONSTRAINT user_tenants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END $$;
""")
    op.execute("""
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_id_fkey' AND conrelid = 'public.leads'::regclass) THEN
        ALTER TABLE public.leads ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
    END IF;
END $$;
""")


def downgrade() -> None:
    """Downgrade not supported for initial snapshot."""
    raise NotImplementedError(
        "Downgrade of initial_snapshot is not supported. For development resets, "
        "use: DROP SCHEMA public CASCADE; CREATE SCHEMA public; alembic upgrade head."
    )
