"""Workflow test — CommunityEngagement durable resume via the SHARED engine provider.

Comunify parallel to vitalia's ``v_replay_safety`` (story empleados-ia-auto-extension,
L1 durable-flows). Proves the comunify durable provider
(``copilot.workflows.durable_checkpointer.get_comunify_durable_checkpointer`` →
``luana_core_flows.make_durable_checkpointer`` → ``AsyncPostgresSaver``) persists a
real workflow checkpoint to Postgres and resumes it across a FRESH connection pool —
something the unit-level ``MemorySaver`` resume tests (same file family) cannot prove.

This is also the CONN (anti-orphan) consumer of ``get_comunify_durable_checkpointer``:
the comunify cron scheduler that wires it into the handlers lands in T-deploy-1, so
this downstream test is the provider's first real consumer + durable-persistence proof.

Requires real Postgres + libpq (marker ``integration``). Skips gracefully when the DB
is unreachable or ``psycopg[binary]`` is missing (native runs).
"""

from __future__ import annotations

import os
import socket
import uuid
from typing import Any

import pytest

pytestmark = pytest.mark.integration

_SQLALCHEMY_DRIVER_TAGS = (
    "postgresql+asyncpg://",
    "postgresql+psycopg://",
    "postgresql+psycopg2://",
)


def _normalize(dsn: str) -> str:
    for tag in _SQLALCHEMY_DRIVER_TAGS:
        if dsn.startswith(tag):
            return "postgresql://" + dsn.split("://", 1)[1]
    return dsn


def _db_dsn_or_skip() -> str:
    """Resolve a reachable Postgres DSN for the comunify durable test, else skip."""
    dsn = _normalize(os.getenv("POSTGRES_DSN") or os.getenv("DATABASE_URL") or "")
    if not dsn:
        pytest.skip("POSTGRES_DSN/DATABASE_URL not set (needs dev stack)")
    # Reachability probe (host:port) — skip when the DB is down.
    try:
        tail = dsn.split("@", 1)[-1].split("/", 1)[0]
        host, _, port = tail.partition(":")
        with socket.create_connection((host, int(port or "5432")), timeout=1):
            pass
    except OSError:
        pytest.skip(f"Postgres unreachable at {dsn}")
    return dsn


async def _durable_checkpointer_or_skip():
    """Consume the comunify accessor (CONN consumer); skip if psycopg/libpq missing."""
    dsn = _db_dsn_or_skip()
    # The accessor resolves its DSN from DATABASE_URL — point it at the test DB.
    os.environ["DATABASE_URL"] = dsn
    from src.modules.comunify.copilot.workflows.durable_checkpointer import (
        get_comunify_durable_checkpointer,
        reset_comunify_durable_checkpointer,
    )

    await reset_comunify_durable_checkpointer()
    try:
        return await get_comunify_durable_checkpointer()
    except RuntimeError as exc:  # psycopg/libpq unavailable
        pytest.skip(f"durable checkpointer unavailable (install psycopg[binary]): {exc}")


async def _nurture_stub(*, tenant_id, subscriber_id, cohort_id, member_response_text):  # noqa: ANN001, ANN202, ARG001
    return {"success": False, "cost_usd": 0.001}


async def test_community_engagement_durable_resume_survives_new_pool() -> None:
    """A persisted comunify checkpoint resumes from a FRESH pool — durable, not in-memory."""
    from src.modules.comunify.copilot.workflows.community_engagement_workflow import (
        build_community_engagement_workflow,
    )
    from src.modules.comunify.copilot.workflows.durable_checkpointer import (
        get_comunify_durable_checkpointer,
        reset_comunify_durable_checkpointer,
    )

    tenant_id = uuid.uuid4()
    subscriber_id = uuid.uuid4()
    cohort_id = uuid.uuid4()
    thread_config = {"configurable": {"thread_id": f"comunify.community:{tenant_id}:{subscriber_id}"}}
    initial_state: dict[str, Any] = {
        "tenant_id": tenant_id,
        "subscriber_id": subscriber_id,
        "cohort_id": cohort_id,
        "current_step": "active",
        "last_activity_at": None,
        "drift_detected_at": None,
        "member_response_text": None,
        "sentiment": None,
        "vulnerability_disclosed": False,
        "creator_intervention_required": False,
        "nurture_failed_count": 0,
        "next_milestone_at": None,
        "cost_accumulated_usd": 0.0,
        "iterations": 0,
    }

    # 1) Advance >=1 checkpoint on a durable AsyncPostgresSaver (consumes the accessor).
    cp1 = await _durable_checkpointer_or_skip()
    wf1 = build_community_engagement_workflow(checkpointer=cp1, nurture_tool=_nurture_stub)
    await wf1.ainvoke(initial_state, config=thread_config)
    await wf1.ainvoke({"current_step": "drift_detected"}, config=thread_config)
    snap1 = await wf1.aget_state(thread_config)
    assert snap1.values["current_step"] == "drift_detected"

    # 2) Simulate a process restart — reset the singleton + build a FRESH pool (same DB).
    await reset_comunify_durable_checkpointer()
    cp2 = await get_comunify_durable_checkpointer()
    wf2 = build_community_engagement_workflow(checkpointer=cp2, nurture_tool=_nurture_stub)
    snap2 = await wf2.aget_state(thread_config)

    # 3) State resumed from the persisted Postgres checkpoint (impossible w/ MemorySaver).
    assert snap2.values, "no persisted checkpoint — comunify durable persistence failed"
    assert snap2.values["tenant_id"] == tenant_id, "resumed state lost tenant isolation"
    assert snap2.values["current_step"] == "drift_detected"

    await reset_comunify_durable_checkpointer()
