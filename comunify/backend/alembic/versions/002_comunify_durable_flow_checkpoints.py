"""Migration 002: durable-flow checkpoint namespace (comunify).

Story: empleados-ia-auto-extension (platform) · L1 durable-flows-engine.
Proposal: docs/promotion-protocol/proposals/2026-06-02-durable-flows-engine.md (accepted).

The comunify durable graphs (community engagement, cohort enrollment) now persist
their LangGraph state via the shared engine provider
``luana_core_flows.make_durable_checkpointer`` → ``AsyncPostgresSaver``.

Table ownership (O-2, 03-arch.md § L1.6):
  - ``langgraph-checkpoint-postgres`` 3.1.0 OWNS the checkpoint table DDL and
    creates its FIXED-name tables idempotently at app lifespan startup via
    ``AsyncPostgresSaver.setup()``:
        checkpoints · checkpoint_blobs · checkpoint_writes · checkpoint_migrations
    (no ``table_prefix`` in 3.1.0 — brand isolation is the comunify Postgres DB;
    tenant isolation is the ``thread_id`` tenant segment).
  - This migration therefore does NOT ``CREATE TABLE`` the checkpoint internals
    (would drift from LangGraph's owned schema). It only records the durable-flow
    namespace in alembic history. comunify is non-PHI → no ``EncryptedSerializer``
    and no ``pgcrypto`` requirement.

Idempotency: no DDL beyond a re-runnable namespace marker. Safe to re-apply
(``alembic upgrade head`` twice = no error — validator ``v_migration_idempotent``).

Revision ID: 002_comunify
Revises: 001_comunify
Create Date: 2026-06-02
"""

from __future__ import annotations

from alembic import op

revision = "002_comunify"
down_revision = "001_comunify"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Record the durable-flow checkpoint namespace (idempotent, no-op DDL).

    LangGraph's ``AsyncPostgresSaver.setup()`` creates the fixed-name checkpoint
    tables at app startup. This migration is a thin alembic-history marker — there
    is no comunify-owned checkpoint DDL to apply (comunify is non-PHI; no pgcrypto).
    """
    # Namespace marker only — checkpoint tables owned by AsyncPostgresSaver.setup().
    op.execute("SELECT 1")


def downgrade() -> None:
    """No-op — checkpoint tables are LangGraph-owned."""
    # Intentionally empty: nothing comunify-owned to drop.
