# cap: platform.migrations-slice-1-schema
# atomics: TBD
# story-origin: TBD
"""Vitalia database session factory — FastAPI DI dependency.

Provides ``get_async_session`` async generator for use with ``Depends()``.
Uses the same DSN convention as alembic/env.py:
  1. DATABASE_URL env var (canonical — matches docker-compose.dev.yml)
  2. Fallback to POSTGRES_* individual vars for local dev without Docker.

downstream-regression-na: vitalia-local db factory; no cross-brand consumers
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# -------- DSN resolution (mirrors alembic/env.py logic) --------------------

_DATABASE_URL = os.environ.get("DATABASE_URL")

if _DATABASE_URL:
    # Alembic uses sync driver — FastAPI needs asyncpg
    _async_url = _DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://").replace(
        "postgresql+psycopg://", "postgresql+asyncpg://"
    )
    # If already asyncpg, keep as-is
    if "postgresql+asyncpg://" not in _async_url:
        _async_url = "postgresql+asyncpg://" + _async_url.split("://", 1)[-1]
else:
    _user = os.environ.get("POSTGRES_USER", "postgres")
    _password = os.environ.get("POSTGRES_PASSWORD", "password")
    _host = os.environ.get("POSTGRES_HOST", "localhost")
    _port = os.environ.get("POSTGRES_PORT", "5432")
    _db = os.environ.get("POSTGRES_DB", "vitalia_dev")
    _async_url = f"postgresql+asyncpg://{_user}:{_password}@{_host}:{_port}/{_db}"

# -------- Engine + session factory ------------------------------------------

_engine = create_async_engine(
    _async_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

_AsyncSessionLocal = async_sessionmaker(
    _engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI DI async generator for database sessions.

    Usage in route:
        async def my_route(
            session: Annotated[AsyncSession, Depends(get_async_session)],
        ):

    Each request gets its own session. Session is closed after response.
    Caller (application service) is responsible for commit/rollback semantics.
    Session autoflushes on each query unless disabled.
    """
    async with _AsyncSessionLocal() as session:
        yield session
