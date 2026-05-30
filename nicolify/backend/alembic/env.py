"""Alembic env — nicolify brand (T-2 nicolify-r0-dev-stack AD-4).

DATABASE_URL priority (asyncpg DSN → converted to psycopg sync for alembic).
Fallback: POSTGRES_* env vars.

Raw-SQL migrations use op.execute() with IF NOT EXISTS — target_metadata=None.
Autogenerate not used (idempotent DDL pattern).
"""

from __future__ import annotations

import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── DSN resolution: DATABASE_URL priority → POSTGRES_* fallback ──────────────
# docker-compose.dev.yml injects DATABASE_URL with asyncpg driver.
# Alembic requires sync psycopg2 driver — swap asyncpg for postgresql.
_database_url = os.environ.get("DATABASE_URL", "")

if _database_url:
    # Convert asyncpg DSN to psycopg2-compatible sync DSN for alembic
    # asyncpg: postgresql+asyncpg://user:pass@host:port/db
    # psycopg2: postgresql://user:pass@host:port/db
    db_url = _database_url.replace("postgresql+asyncpg://", "postgresql://")
else:
    # Fallback: build from individual POSTGRES_* env vars
    db_url = (
        f"postgresql://{os.environ.get('POSTGRES_USER', 'postgres')}"
        f":{os.environ.get('POSTGRES_PASSWORD', 'password')}"
        f"@{os.environ.get('POSTGRES_HOST', 'localhost')}"
        f":{os.environ.get('POSTGRES_PORT', '5432')}"
        f"/{os.environ.get('POSTGRES_DB', 'nicolify_dev')}"
    )

config.set_main_option("sqlalchemy.url", db_url)

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
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
