"""Comunify — materialize luana-core-llm + observability cost/pricing tables.

After the copilot tables (004), the live chat reached the LLM (kimi/kimi-k2 via
the gateway) and responded — but the post-LLM cost recording crashed on
``relation "model_pricing_snapshot" does not exist``, aborting the turn's
transaction (cascade). comunify lacks the engine LLM-config + observability
cost tables (same root as iam/copilot: Story 12 never adopted the full engine
schema; these are ORM-defined with no engine alembic migration).

Created via ``Base.metadata.create_all`` (idempotent, checkfirst) — the ORM is
the SSoT. Empty tables are fine: the cost lookup returns no pricing row → 0 cost,
no crash.

Tables created (4):
    llm_config_audit · llm_role_binding · model_pricing_snapshot ·
    tenant_billing_config

Discovered live 2026-06-17.

Revision ID: 005_comunify_engine_llm_obs
Revises: 004_comunify_engine_copilot
Create Date: 2026-06-17
"""

from __future__ import annotations

import importlib

from alembic import op

revision = "005_comunify_engine_llm_obs"
down_revision = "004_comunify_engine_copilot"
branch_labels = None
depends_on = None

_LLM_OBS_MODEL_MODULES = (
    "luana_core_llm.infrastructure.audit_model",
    "luana_core_llm.infrastructure.role_binding_model",
    "luana_core_observability.persistence.models.pricing_snapshot_model",
    "luana_core_observability.persistence.models.tenant_billing_config_model",
)

_TABLE_NAMES = frozenset(
    {
        "llm_config_audit",
        "llm_role_binding",
        "model_pricing_snapshot",
        "tenant_billing_config",
    }
)


def _tables():
    for module in _LLM_OBS_MODEL_MODULES:
        importlib.import_module(module)

    from luana_core_platform.domain.base_entity import Base

    return [t for n, t in Base.metadata.tables.items() if n in _TABLE_NAMES]


def upgrade() -> None:
    from luana_core_platform.domain.base_entity import Base

    Base.metadata.create_all(bind=op.get_bind(), tables=_tables(), checkfirst=True)


def downgrade() -> None:
    from luana_core_platform.domain.base_entity import Base

    Base.metadata.drop_all(bind=op.get_bind(), tables=_tables(), checkfirst=True)
