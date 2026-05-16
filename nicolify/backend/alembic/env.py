"""Alembic env (Story 10 T-10 simplified).

Post-consolidation, this env.py uses raw-SQL migrations (op.execute) and does
NOT require SQLAlchemy Base.metadata model registration. The consolidated
001_initial_snapshot.py contains the full schema as idempotent DDL; all future
migrations from luana-platform onwards register Base via the canonical
luana_core_*.infrastructure.models imports — but until that lift completes
(post-T-10), this env.py keeps target_metadata=None to allow alembic upgrade
without forcing every model package to be importable.

If autogenerate is needed in a future ticket, restore target_metadata via:
    from luana_core_platform.domain.base_entity import Base
    # ... model imports ...
    target_metadata = Base.metadata
"""
from logging.config import fileConfig
import os

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Build DB URL from POSTGRES_* env vars (matches src/core/config.py settings).
db_url = (
    f"postgresql://{os.environ.get('POSTGRES_USER', 'postgres')}"
    f":{os.environ.get('POSTGRES_PASSWORD', 'password')}"
    f"@{os.environ.get('POSTGRES_HOST', 'localhost')}"
    f":{os.environ.get('POSTGRES_PORT', '5432')}"
    f"/{os.environ.get('POSTGRES_DB', 'nicolify_dev')}"
)
config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Raw-SQL migrations use op.execute(); metadata not required for upgrade/downgrade.
# Autogenerate (alembic revision --autogenerate) requires this — see docstring.
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
