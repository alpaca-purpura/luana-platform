"""Alembic env — comunify backend (Story 12 T-be-1).

Comunify has its own independent alembic chain (down_revision=None on first
migration). Follows Story 11 T-be-1 simplified pattern:
- Raw-SQL migrations (op.execute) — no SQLAlchemy autogenerate
- target_metadata=None — no model import required for upgrade/downgrade
- DB URL from POSTGRES_* env vars (matches comunify src/core/config.py)

If autogenerate is needed in a future ticket, restore target_metadata via:
    from src.shared.domain.base_entity import Base
    # ... model imports ...
    target_metadata = Base.metadata
"""
from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# This is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# DB URL priority (cementado en vitalia-dev-stack-functional 07-merge.md paso 8 +
# comunify-dev-stack-functional bug 8 replicado):
#   1. DATABASE_URL env (compose SSoT) — asyncpg→psycopg2 swap para alembic sync driver
#   2. POSTGRES_* env vars (legacy local dev pattern)
#   3. Default localhost (last-resort, fallará en container)
database_url_env = os.environ.get("DATABASE_URL", "")
if database_url_env:
    db_url = database_url_env.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
else:
    db_url = (
        f"postgresql://{os.environ.get('POSTGRES_USER', 'postgres')}"
        f":{os.environ.get('POSTGRES_PASSWORD', 'password')}"
        f"@{os.environ.get('POSTGRES_HOST', 'localhost')}"
        f":{os.environ.get('POSTGRES_PORT', '5432')}"
        f"/{os.environ.get('POSTGRES_DB', 'comunify_dev')}"
    )
config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Raw-SQL migrations use op.execute(); metadata not required for upgrade/downgrade.
target_metadata = None


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (SQL script generation)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (direct DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
