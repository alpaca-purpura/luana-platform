"""Nicolify database session factory — FastAPI DI dependency.

Provee ``get_async_session`` async generator para uso con ``Depends()``.
Misma convención DSN que alembic/env.py:
  1. DATABASE_URL env var (canónica — coincide con docker-compose.dev.yml)
  2. Fallback a POSTGRES_* vars individuales para dev local sin Docker.

Portado re-temizado desde vitalia/backend/src/db.py (AD-4, 03-arch.md).
Sin X-Clinic-ID ni ningún filtro clínico (eso es Vitalia-only — AD-5).

downstream-regression-na: nicolify-local db factory; no cross-brand consumers
"""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

# -------- DSN resolution (mirrors alembic/env.py logic) --------------------

_DATABASE_URL = os.environ.get("DATABASE_URL")

if _DATABASE_URL:
    # Alembic usa sync driver — FastAPI necesita asyncpg
    _async_url = _DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://").replace(
        "postgresql+psycopg://", "postgresql+asyncpg://"
    )
    # Si ya es asyncpg, dejar como está
    if "postgresql+asyncpg://" not in _async_url:
        _async_url = "postgresql+asyncpg://" + _async_url.split("://", 1)[-1]
else:
    _user = os.environ.get("POSTGRES_USER", "postgres")
    _password = os.environ.get("POSTGRES_PASSWORD", "password")
    _host = os.environ.get("POSTGRES_HOST", "localhost")
    _port = os.environ.get("POSTGRES_PORT", "5432")
    _db = os.environ.get("POSTGRES_DB", "nicolify_dev")
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
    """FastAPI DI async generator para sesiones de base de datos.

    Uso en route:
        async def mi_ruta(
            session: Annotated[AsyncSession, Depends(get_async_session)],
        ):

    Cada request obtiene su propia sesión. La sesión se cierra al terminar.
    El caller (servicio de aplicación) es responsable de commit/rollback.
    """
    async with _AsyncSessionLocal() as session:
        yield session
