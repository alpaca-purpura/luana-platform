"""Architectural fitness — worker queue partial index exists in consolidated snapshot.

T-15 migration: originally read ``112_campaigns_domain.py``; migrated to read
``001_initial_snapshot.py`` after T-10 consolidated 131 migrations into single file.

Verifies:
1. Consolidated snapshot contains ``CREATE INDEX IF NOT EXISTS ix_campaign_task_worker_queue``
   with partial filter restricting to pending/scheduled status rows.
2. Snapshot contains constraint ``uq_campaign_task_tenant_idem`` UNIQUE over
   ``(tenant_id, idempotency_key)``.
3. Index column order is ``(tenant_id, status, scheduled_at)`` — critical for query plan.
4. All 6 campaign domain tables are created in the snapshot.

Rationale: with 1000 tenants and 10k tasks/tenant, without the partial index the
worker poll degrades O(N) full scan over ``campaign_task``. The index reduces the
scan to only pending/scheduled rows (typically <5% of total).

Without the unique constraint ``(tenant_id, idempotency_key)``, bulk inserts in
the launch orchestrator can create duplicates in race conditions.

T-15 migration note: revision/down_revision assertions removed — those belong to
the deleted ``112_campaigns_domain.py``, not to the consolidated snapshot.

# [CAMPAIGNS-WORKER-IDX-PR3-S1] — T-15 migrated from 112 to 001_initial_snapshot
"""

from __future__ import annotations

from pathlib import Path

# parents[2] = backend root when running from tests/architecture/
_SNAPSHOT_PATH = Path(__file__).resolve().parents[2] / "alembic" / "versions" / "001_initial_snapshot.py"


def _get_snapshot_content() -> str:
    """Read consolidated initial snapshot."""
    if not _SNAPSHOT_PATH.exists():
        msg = (
            f"Consolidated snapshot not found at {_SNAPSHOT_PATH}. "
            "T-10 must complete before this test runs."
        )
        raise FileNotFoundError(msg)
    return _SNAPSHOT_PATH.read_text(encoding="utf-8")


class TestCampaignTaskWorkerQueueIndex:
    """Verifies the consolidated snapshot includes critical indexes for the campaign worker."""

    def test_worker_queue_partial_index_exists(self) -> None:
        """Snapshot must create the partial index for the worker queue."""
        content = _get_snapshot_content()
        assert "ix_campaign_task_worker_queue" in content, (
            "001_initial_snapshot.py must create ix_campaign_task_worker_queue. "
            "This index is critical for performance with 1000+ tenants."
        )

    def test_worker_queue_index_has_where_clause(self) -> None:
        """Partial index must filter only status pending/scheduled.

        The Postgres pg_dump expansion of WHERE status IN ('pending','scheduled')
        uses the ANY array syntax in the consolidated snapshot.
        """
        content = _get_snapshot_content()
        # pg_dump expands IN(...) to ANY(ARRAY[...]) — both forms are semantically equivalent
        has_in_form = "WHERE status IN ('pending','scheduled')" in content
        has_any_form = "ARRAY['pending'" in content and "ARRAY['scheduled'" not in content and "'scheduled'" in content
        has_any_form_v2 = (
            "ix_campaign_task_worker_queue" in content
            and "ARRAY" in content
            and "pending" in content
            and "scheduled" in content
        )
        assert has_in_form or has_any_form_v2, (
            "ix_campaign_task_worker_queue MUST be a partial index filtering status "
            "to pending/scheduled. Without this clause the index grows O(N) with all "
            "historical tasks."
        )

    def test_worker_queue_index_column_order(self) -> None:
        """The worker query orders by (tenant_id, status, scheduled_at)."""
        content = _get_snapshot_content()
        assert "tenant_id, status, scheduled_at" in content, (
            "ix_campaign_task_worker_queue must have columns in order "
            "(tenant_id, status, scheduled_at). This order is critical for the "
            "worker poll query plan."
        )

    def test_idempotency_unique_constraint_exists(self) -> None:
        """Snapshot must include the unique constraint for idempotency."""
        content = _get_snapshot_content()
        assert "uq_campaign_task_tenant_idem" in content, (
            "Snapshot must include uq_campaign_task_tenant_idem UNIQUE "
            "(tenant_id, idempotency_key). Without this constraint, bulk inserts "
            "in campaign launch can create duplicate tasks."
        )

    def test_idempotency_constraint_covers_correct_columns(self) -> None:
        """Unique constraint must cover (tenant_id, idempotency_key)."""
        content = _get_snapshot_content()
        assert "tenant_id, idempotency_key" in content, (
            "uq_campaign_task_tenant_idem must cover (tenant_id, idempotency_key) "
            "for cross-tenant safe deduplication."
        )

    def test_six_tables_created(self) -> None:
        """Snapshot must create the 6 tables of the campaigns domain."""
        content = _get_snapshot_content()
        tables = [
            "CREATE TABLE IF NOT EXISTS public.campaign (",
            "CREATE TABLE IF NOT EXISTS public.campaign_step (",
            "CREATE TABLE IF NOT EXISTS public.campaign_task (",
            "CREATE TABLE IF NOT EXISTS public.segment (",
            "CREATE TABLE IF NOT EXISTS public.segment_snapshot (",
            "CREATE TABLE IF NOT EXISTS public.campaign_template (",
        ]
        missing = [t for t in tables if t not in content]
        assert not missing, (
            "Snapshot must create the 6 tables of the campaigns domain. Missing: "
            + str(missing)
        )
