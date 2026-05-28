# cap: copilot.valeria-wizard-onboarding-agentic
# story-origin: TBD
"""CheckpointerProtocol + production checkpointer factory for the wizard graph.

Per 03-arch-agentic.md § 7 + 05-guidelines.md § 1.11:
  - Production checkpointer MUST be ``AsyncPostgresSaver`` (table prefix
    ``vitalia_wizard_onboarding_``).
  - Tests use ``InMemorySaver``.

NOTE: ``langgraph-checkpoint-postgres`` is NOT installed at the time of this
write (same as ``langgraph-checkpoint-redis`` in T-workflow-1). The factory
defers the import to runtime — tests construct InMemorySaver directly and pass
it via ``build_wizard_onboarding_graph(checkpointer=...)``. The factory below
is the swap surface; when the package lands, install + nothing else changes.

Anti-duplication audit:
  - This is a brand-side composition root helper. It does NOT mirror engine
    abstractions — ``AsyncPostgresSaver`` IS the engine-recommended
    checkpointer (per tessl__langgraph). We just call its factory method when
    the package is available.
"""

from __future__ import annotations

from typing import Any, Protocol


class CheckpointerProtocol(Protocol):
    """Structural protocol for any LangGraph-compatible checkpointer.

    Accepts ``InMemorySaver`` (tests), ``AsyncPostgresSaver`` (production),
    or any other implementation that LangGraph's ``compile(checkpointer=...)``
    validates at runtime. LangGraph itself enforces the actual interface.
    """

    ...  # intentionally empty — LangGraph runtime validates


# ════════════════════════════════════════════════════════════════════════════
# Production checkpointer factory (deferred import — package not yet installed)
# ════════════════════════════════════════════════════════════════════════════

WIZARD_CHECKPOINT_TABLE_PREFIX: str = "vitalia_wizard_onboarding_"
"""Table prefix for the Vitalia wizard checkpoint tables (engine table-shape
discovery happens at AsyncPostgresSaver.setup() time)."""


def build_production_checkpointer(
    *,
    postgres_dsn: str,
) -> CheckpointerProtocol:
    """Construct the production ``AsyncPostgresSaver`` (deferred import).

    Args:
        postgres_dsn: Async-capable Postgres DSN (asyncpg / psycopg).

    Returns:
        Compiled checkpointer ready to pass into ``graph.compile(checkpointer=...)``.

    Raises:
        RuntimeError: if ``langgraph-checkpoint-postgres`` is not installed.
            Falls back to the test InMemorySaver pattern at the composition
            root if the team chooses to defer the upgrade.
    """
    try:
        # Deferred import — package availability check
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    except ImportError as exc:
        msg = (
            "AsyncPostgresSaver not available — install `langgraph-checkpoint-postgres` "
            "to enable production checkpointing for the Vitalia wizard supervisor. "
            "Tests use InMemorySaver and do not require this package."
        )
        raise RuntimeError(msg) from exc

    saver: Any = AsyncPostgresSaver.from_conn_string(postgres_dsn)
    return saver


__all__ = [
    "WIZARD_CHECKPOINT_TABLE_PREFIX",
    "CheckpointerProtocol",
    "build_production_checkpointer",
]
