"""002_abel_icp_buyer — abel_icps, abel_buyers, nicolify_growth_studio_event.

Idempotent raw SQL pattern (IF NOT EXISTS per table/index).
Pattern: op.execute("CREATE TABLE IF NOT EXISTS ...") — NUNCA DDL directo no-idempotente.

Tables:
  abel_icps           — ICP (Ideal Customer Profile) brand-local B2B
  abel_buyers         — Buyer/Stakeholder brand-local async (icp_id FK)
  nicolify_growth_studio_event — telemetría brand-local (NF-sec-pii: sin PII)

Revision ID: 002_abel
Revises: 001_nicolify
Create Date: 2026-06-04
Story: nicolify-r1-abel-icp-buyer (T-BE-1)
Cap: abel/icp-buyer
"""

from __future__ import annotations

from alembic import op

revision = "002_abel"
down_revision = "001_nicolify"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create abel tables — idempotent (IF NOT EXISTS)."""
    # ── abel_icps ─────────────────────────────────────────────────────────────
    # ICP (Ideal Customer Profile) — account-level B2B entity brand-local nicolify.
    # Lift candidate to core/luana-core-b2b/ post-merge (N≥2 B2B brands).
    # RN-7: unique (tenant_id, lower(label)) partial WHERE deleted_at IS NULL.
    # RN-11: avg_ticket_currency preservado sin convertir (no DEFAULT currency).
    op.execute("""
        CREATE TABLE IF NOT EXISTS abel_icps (
            id              UUID NOT NULL PRIMARY KEY,
            tenant_id       UUID NOT NULL,
            label           VARCHAR(160) NOT NULL,
            description     TEXT,
            vertical        VARCHAR(120),
            company_size    VARCHAR(120),
            geo             VARCHAR(160),
            business_model  VARCHAR(200),
            avg_ticket      NUMERIC(14, 2),
            avg_ticket_currency VARCHAR(3),
            sales_cycle     VARCHAR(120),
            main_pain       TEXT,
            sales_angle     TEXT,
            signals         JSONB NOT NULL DEFAULT '[]'::jsonb,
            anti_pattern    TEXT,
            status          VARCHAR(16) NOT NULL DEFAULT 'borrador',
            origin          VARCHAR(16) NOT NULL DEFAULT 'manual',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at      TIMESTAMPTZ
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_abel_icps_tenant ON abel_icps (tenant_id)")

    # RN-7: partial unique index (case-insensitive label per tenant, soft-delete aware)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_abel_icps_tenant_label
        ON abel_icps (tenant_id, lower(label))
        WHERE deleted_at IS NULL
    """)

    # ── abel_buyers ───────────────────────────────────────────────────────────
    # Buyer/Stakeholder — brand-local async replica of engine BuyerPersona.
    # Adds icp_id FK (engine has no icp_id — account-level grouping B2B).
    # RN-6: is_primary ≤1 per icp_id (optional partial unique — service enforces).
    # JSONB fields: same slugs as engine BuyerPersona (field-contract compatible).
    op.execute("""
        CREATE TABLE IF NOT EXISTS abel_buyers (
            id              UUID NOT NULL PRIMARY KEY,
            tenant_id       UUID NOT NULL,
            icp_id          UUID NOT NULL,
            name            VARCHAR(200) NOT NULL,
            role            VARCHAR(160),
            decision_power  VARCHAR(32),
            is_primary      BOOLEAN NOT NULL DEFAULT false,
            demographics    JSONB NOT NULL DEFAULT '{}'::jsonb,
            psychographics  JSONB NOT NULL DEFAULT '{}'::jsonb,
            pain_points     JSONB NOT NULL DEFAULT '[]'::jsonb,
            desires         JSONB NOT NULL DEFAULT '[]'::jsonb,
            objections      JSONB NOT NULL DEFAULT '[]'::jsonb,
            buyer_journey   JSONB NOT NULL DEFAULT '{}'::jsonb,
            purchase_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
            preferred_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at      TIMESTAMPTZ
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_abel_buyers_tenant_icp ON abel_buyers (tenant_id, icp_id)")

    # RN-6 optional DB-level enforcement for is_primary ≤1 per icp_id.
    # Service layer (BuyerService.set_primary + clear_primary) is the primary gate.
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_abel_buyers_icp_primary
        ON abel_buyers (icp_id)
        WHERE is_primary = true AND deleted_at IS NULL
    """)

    # ── nicolify_growth_studio_event ──────────────────────────────────────────
    # Brand-local telemetry (NOT engine copilot_trace_event).
    # NF-sec-pii: props JSONB sin PII (montos bucketeados, ids hasheados).
    # ADR-nicolify-001 §8: account_id (nullable) — NOT clinic_id (eso es Vitalia).
    op.execute("""
        CREATE TABLE IF NOT EXISTS nicolify_growth_studio_event (
            id          UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   UUID NOT NULL,
            account_id  UUID,
            user_id     UUID,
            event_name  VARCHAR(80) NOT NULL,
            props       JSONB NOT NULL DEFAULT '{}'::jsonb,
            occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_nicolify_gse_tenant
        ON nicolify_growth_studio_event (tenant_id, occurred_at)
    """)


def downgrade() -> None:
    """Drop abel tables (order: buyers before icps due to FK concept)."""
    op.execute("DROP TABLE IF EXISTS nicolify_growth_studio_event")
    op.execute("DROP TABLE IF EXISTS abel_buyers")
    op.execute("DROP TABLE IF EXISTS abel_icps")
