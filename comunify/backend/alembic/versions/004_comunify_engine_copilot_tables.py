"""Comunify — materialize luana-core-copilot engine persistence tables.

comunify is the FIRST brand to wire the Luana sidebar to the engine chat
orchestrator (`stream_chat` → copilot_conversations). No other brand uses the
engine's copilot persistence (vitalia's "conversations" are its own crm tables),
so these 13 engine tables had never been created in any brand DB. The engine
package (`core/luana-core-copilot`) ships NO alembic migrations — its schema is
defined purely by the SQLAlchemy ORM models and materialized via
``Base.metadata.create_all``. This migration does exactly that, scoped to the
``copilot_*`` tables, idempotently (``checkfirst=True`` skips existing tables).

Schema-mirror exception (per backend-ddd.md): a brand migration MAY create
engine tables; no promotion proposal needed. The ORM is the SSoT — create_all
keeps comunify's schema in lock-step with the engine models (no hand-written DDL
to drift).

Tables created (13):
    copilot_conversations · copilot_events · copilot_routing_log ·
    copilot_mutation_journal · copilot_pinned_memory · copilot_channel_links ·
    copilot_link_tokens · copilot_trace_event · copilot_llm_call ·
    copilot_tenant_limits · copilot_tenant_limits_audit · copilot_inspiration ·
    copilot_workflow_metric

Discovered live 2026-06-17: the authenticated chat reached the orchestrator
(tenant + user resolved from the Clerk token) then 500'd on
``relation "copilot_conversations" does not exist``.

Revision ID: 004_comunify_engine_copilot
Revises: 003_comunify_engine_iam
Create Date: 2026-06-17
"""

from __future__ import annotations

import importlib

from alembic import op

revision = "004_comunify_engine_copilot"
down_revision = "003_comunify_engine_iam"
branch_labels = None
depends_on = None

# Engine copilot model modules — importing each registers its table(s) on the
# shared ``luana_core_platform.domain.base_entity.Base.metadata``. The package
# ``__init__`` files do NOT import the submodules, so each must be named.
_COPILOT_MODEL_MODULES = (
    "luana_core_copilot.infrastructure.models.conversation_model",
    "luana_core_copilot.infrastructure.models.routing_log_model",
    "luana_core_copilot.infrastructure.models.event_model",
    "luana_core_copilot.infrastructure.models.tenant_limits_audit_model",
    "luana_core_copilot.infrastructure.models.inspiration_model",
    "luana_core_copilot.infrastructure.models.pinned_memory_model",
    "luana_core_copilot.infrastructure.models.mutation_journal_model",
    "luana_core_copilot.infrastructure.models.trace_event_model",
    "luana_core_copilot.infrastructure.models.tenant_limits_model",
    "luana_core_copilot.infrastructure.models.workflow_metric_model",
    "luana_core_copilot.infrastructure.models.telegram_models",
    "luana_core_copilot.observability.persistence.models.llm_call_model",
)


def _copilot_tables():
    """Import engine copilot models + return their Table objects (copilot_* only)."""
    for module in _COPILOT_MODEL_MODULES:
        importlib.import_module(module)

    from luana_core_platform.domain.base_entity import Base

    return [table for name, table in Base.metadata.tables.items() if name.startswith("copilot_")]


def upgrade() -> None:
    tables = _copilot_tables()
    bind = op.get_bind()
    # checkfirst=True → idempotent (skips tables that already exist).
    from luana_core_platform.domain.base_entity import Base

    Base.metadata.create_all(bind=bind, tables=tables, checkfirst=True)


def downgrade() -> None:
    tables = _copilot_tables()
    bind = op.get_bind()
    from luana_core_platform.domain.base_entity import Base

    Base.metadata.drop_all(bind=bind, tables=tables, checkfirst=True)
