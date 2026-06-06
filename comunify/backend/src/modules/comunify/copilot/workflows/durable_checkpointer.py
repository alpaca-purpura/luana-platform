"""Comunify durable-flow checkpointer — single production construction surface.

Lifespan-level lazy singleton that consumes the shared engine provider
``luana_core_flows.checkpointer.make_durable_checkpointer``. Comunify's community
+ cohort durable workflows construct their production checkpointer here instead
of the per-site ``RedisSaver`` swap stub the workflow docstrings previously
described (the "D10" not-installed placeholder), per
``.claude/rules/anti-duplication.md`` + promotion proposal
``2026-06-02-durable-flows-engine`` (accepted).

Isolation model (same as the engine provider): brand isolation = the comunify
Postgres DB (``DATABASE_URL``); tenant isolation = the ``thread_id`` tenant
segment. Comunify does NOT process PHI, so ``encryption_key=None`` (no
``EncryptedSerializer``).
"""

from __future__ import annotations

import os

import structlog
from langgraph.checkpoint.base import BaseCheckpointSaver
from luana_core_flows.checkpointer import make_durable_checkpointer

logger = structlog.get_logger(__name__)

_checkpointer: BaseCheckpointSaver | None = None

# AsyncPostgresSaver uses psycopg (libpq), NOT asyncpg — strip SQLAlchemy tags.
_SQLALCHEMY_DRIVER_TAGS = (
    "postgresql+asyncpg://",
    "postgresql+psycopg://",
    "postgresql+psycopg2://",
)


def resolve_psycopg_dsn() -> str:
    """Resolve the comunify Postgres DSN in psycopg (libpq) form.

    ``DATABASE_URL`` is the canonical env (compose SSoT, mirrors alembic/env.py).
    Any SQLAlchemy driver suffix is stripped — the durable checkpointer talks to
    Postgres through psycopg.
    """
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        user = os.environ.get("POSTGRES_USER", "postgres")
        password = os.environ.get("POSTGRES_PASSWORD", "password")
        host = os.environ.get("POSTGRES_HOST", "localhost")
        port = os.environ.get("POSTGRES_PORT", "5432")
        db = os.environ.get("POSTGRES_DB", "comunify_dev")
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"
    for tag in _SQLALCHEMY_DRIVER_TAGS:
        if dsn.startswith(tag):
            return "postgresql://" + dsn.split("://", 1)[1]
    return dsn


async def get_comunify_durable_checkpointer() -> BaseCheckpointSaver:
    """Return the process-wide durable checkpointer (constructed once).

    Lazily builds the ``AsyncPostgresSaver`` on first call, then caches it.
    Comunify cron schedulers (community drift-check, cohort enrollment dunning)
    consume this at their composition root — never ``MemorySaver`` (tests inject
    ``InMemorySaver`` directly into ``build_*_workflow(checkpointer=...)``).
    """
    global _checkpointer
    if _checkpointer is None:
        _checkpointer = await make_durable_checkpointer(
            postgres_dsn=resolve_psycopg_dsn(),
            encryption_key=None,  # comunify is non-PHI
        )
        logger.info("comunify_durable_checkpointer_initialized")
    return _checkpointer


async def reset_comunify_durable_checkpointer() -> None:
    """Drop the cached singleton (test teardown / lifespan shutdown helper)."""
    global _checkpointer
    _checkpointer = None


__all__ = [
    "get_comunify_durable_checkpointer",
    "reset_comunify_durable_checkpointer",
    "resolve_psycopg_dsn",
]
