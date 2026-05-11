"""Offer studio test fixtures.

Sets mandatory env vars before any import that triggers config loading.
Pattern mirrors luana-core-brand-studio/tests/conftest.py.
"""

from __future__ import annotations

import os
import sys
import uuid
from unittest.mock import MagicMock

import pytest

# --- Set mandatory env vars before any imports that trigger config loading ---
os.environ.setdefault("LOG_LEVEL", "DEBUG")
os.environ.setdefault("DOMAIN_NAME", "localhost")
os.environ.setdefault("TRAEFIK_NETWORK", "test_network")
os.environ.setdefault("API_SECRET_KEY", "ci-test-secret-key-not-for-prod")
os.environ.setdefault("WHATSAPP_API_TOKEN", "ci-dummy-token")
os.environ.setdefault("WHATSAPP_PHONE_NUMBER_ID", "000000000")
os.environ.setdefault("WHATSAPP_VERIFY_TOKEN", "ci-verify-token")
os.environ.setdefault("OPENAI_API_KEY", "sk-ci-dummy-key")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("QDRANT_URL", "http://localhost:6333")
os.environ.setdefault("POSTGRES_USER", "postgres")
os.environ.setdefault("POSTGRES_PASSWORD", "postgres")
os.environ.setdefault("POSTGRES_DB", "test_db")
os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("POSTGRES_PORT", "5432")
os.environ.setdefault("API_URL", "http://localhost:8000")
os.environ.setdefault("DASHBOARD_DOMAIN", "http://localhost:3000")
os.environ.setdefault("PROMPT_SOURCE", "file")
os.environ.setdefault("AI_PROVIDER", "openai")
os.environ.setdefault("AI_MODEL_NANO", "gpt-4o-mini")
os.environ.setdefault("AI_MODEL_FAST", "deepseek-v4-flash")
os.environ.setdefault("AI_MODEL_REASONING", "deepseek-v4-pro")
os.environ.setdefault("AI_MODEL_AGENT", "kimi-k2.6")
os.environ.setdefault("AI_MODEL_VISION", "gpt-4o")
os.environ.setdefault("AI_MODEL_EMBEDDING", "text-embedding-3-large")
os.environ.setdefault("AI_PROVIDER_NANO", "openai")
os.environ.setdefault("AI_PROVIDER_FAST", "deepseek")
os.environ.setdefault("AI_PROVIDER_REASONING", "deepseek")
os.environ.setdefault("AI_PROVIDER_AGENT", "kimi")
os.environ.setdefault("AI_PROVIDER_VISION", "openai")
os.environ.setdefault("AI_PROVIDER_EMBEDDING", "openai")
os.environ.setdefault("KIMI_API_KEY", "ci-dummy-key")
os.environ.setdefault("DEEPSEEK_API_KEY", "ci-dummy-key")
os.environ.setdefault("DASHSCOPE_API_KEY", "ci-dummy-key")
os.environ.setdefault("CLERK_SECRET_KEY", "sk_test_ci_dummy_clerk_key")
os.environ.setdefault("CLERK_JWT_PUBLIC_KEY", "ci-dummy-jwt-key")
os.environ.setdefault("USE_OUTBOX_PATTERN_BRAND", "true")
os.environ.setdefault(
    "ENCRYPTION_KEY",
    "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleQ==",
)

# --- Mock missing optional dependencies for test environment ---
for mod_name in ("passlib", "passlib.context", "passlib.hash"):
    if mod_name not in sys.modules:
        sys.modules[mod_name] = MagicMock()

# --- Monkeypatch PostgreSQL Types for SQLite ---
from sqlalchemy.dialects import postgresql  # noqa: E402
from sqlalchemy.types import CHAR, Text, TypeDecorator  # noqa: E402

_ORIGINAL_POSTGRESQL_JSONB = postgresql.JSONB
_ORIGINAL_POSTGRESQL_UUID = postgresql.UUID


class MockJSONB(TypeDecorator):
    """SQLite-compatible JSONB replacement."""

    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        import json

        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        import json

        if value is not None:
            return json.loads(value)
        return value


class MockUUID(TypeDecorator):
    """SQLite-compatible UUID replacement (stores as CHAR(36))."""

    impl = CHAR
    cache_ok = True

    def __init__(self, *args, as_uuid: bool = True, **kwargs):
        """Accept as_uuid kwarg for PostgreSQL UUID compatibility."""
        super().__init__(*args, **kwargs)

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return str(uuid.UUID(str(value)))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value


postgresql.JSONB = MockJSONB  # type: ignore[assignment]
postgresql.UUID = MockUUID  # type: ignore[assignment]

# Patch EncryptedJSON to use MockJSONB for SQLite tests
from luana_core_platform.infrastructure.database import types as _db_types  # noqa: E402

_db_types.EncryptedJSON.impl = MockJSONB  # type: ignore[assignment]

# ---------------------------------------------------------------------------
# Import models AFTER patching dialects
# ---------------------------------------------------------------------------
import sqlalchemy as _sa  # noqa: E402

# Register offer-studio models
from luana_core_offer_studio.infrastructure.models.external_product_mapping_model import (  # noqa: F401
    ExternalProductMappingModel,
)
from luana_core_offer_studio.infrastructure.models.knowledge_source_model import KnowledgeSourceModel  # noqa: F401
from luana_core_offer_studio.infrastructure.models.launch_edition_model import LaunchEditionModel  # noqa: F401
from luana_core_offer_studio.infrastructure.models.offer_asset_model import OfferAssetModel  # noqa: F401
from luana_core_offer_studio.infrastructure.models.offer_extraction_trace_model import (  # noqa: F401
    OfferExtractionTrace,
)
from luana_core_offer_studio.infrastructure.models.product_model import ProductModel  # noqa: F401
from luana_core_iam.infrastructure.models.tenant_model import TenantModel  # noqa: F401
from luana_core_iam.infrastructure.models.user_model import UserModel  # noqa: F401
from luana_core_platform.domain.base_entity import Base  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from luana_core_offer_studio.domain.enums import OfferArchetype, OfferStatus, OfferValueLevel  # noqa: E402

# Test constants
TENANT_A = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
TENANT_B = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
USER_A = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")


# ---------------------------------------------------------------------------
# SQLite in-memory DB fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def db_engine():
    """Session-scoped SQLite engine with all offer-studio models registered."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(db_engine):
    """Function-scoped DB session with transaction rollback isolation."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def tenant_id() -> uuid.UUID:
    """Standard test tenant ID."""
    return TENANT_A


@pytest.fixture
def tenant_a() -> uuid.UUID:
    """Standard tenant A UUID."""
    return TENANT_A


@pytest.fixture
def tenant_b() -> uuid.UUID:
    """Standard tenant B UUID."""
    return TENANT_B


@pytest.fixture
def other_tenant_id() -> uuid.UUID:
    """Alternative tenant ID for isolation tests."""
    return TENANT_B


@pytest.fixture
def user_id() -> uuid.UUID:
    """Standard test user ID."""
    return USER_A


@pytest.fixture
def seed_tenant(db, tenant_id):
    """Persist a TenantModel row so FK constraints are satisfied."""
    tenant = TenantModel(
        id=tenant_id,
        name="Test Tenant",
        slug="test-tenant",
        config_json={},
    )
    db.add(tenant)
    db.flush()
    return tenant


def create_product_model(
    tenant_id: uuid.UUID,
    *,
    archetype: str = OfferArchetype.PRODUCTO.value,
    status: str = OfferStatus.ACTIVE.value,
    name: str = "Test Offer",
    value_level: str | None = OfferValueLevel.ACTIVACION.value,
    **overrides,
) -> ProductModel:
    """Factory helper for creating ProductModel instances in tests."""
    defaults = {
        "id": uuid.uuid4(),
        "tenant_id": tenant_id,
        "name": name,
        "archetype": archetype,
        "status": status,
        "value_level": value_level,
        "format_hint": None,
        "is_lead_magnet": False,
        "has_editions": True,
        "pricing": [],
        "currency": "USD",
        "specific_details": {},
        "deliverables": [],
        "headline_promise": "Headline",
        "primary_outcome": "Outcome",
        "time_to_value": "1 week",
        "marketing_pain_points": [],
        "marketing_desires": [],
        "objections": [],
        "target_avatar_match": [],
        "access_duration": None,
        "access_duration_text": None,
        "support_duration_days": None,
        "delivery_model": "diy",
        "requires_application": False,
        "min_financial_capacity": "LOW_INCOME",
        "prerequisites": [],
        "anti_avatar_keywords": [],
        "guarantee_type": "none",
        "guarantee_terms": "",
        "downsell_product_id": None,
        "upsell_product_id": None,
        "includes_offers": [],
        "onboarding_action": None,
        "onboarding_url": None,
        "calendar_type_id": None,
        "checkout_page_url": None,
        "vsl_link": None,
        "landing_page_config": {},
        "metadata_info": {},
        "archived_at": None,
        "deleted_at": None,
    }
    defaults.update(overrides)
    return ProductModel(**defaults)


@pytest.fixture
def db_with_offers(db: Session, tenant_a: uuid.UUID, tenant_b: uuid.UUID):
    """Pre-populate DB with 3 offers across 2 tenants for isolation tests."""
    offer_a1 = create_product_model(tenant_a, name="Offer A1", status="active")
    offer_a2 = create_product_model(tenant_a, name="Offer A2", status="draft")
    offer_b1 = create_product_model(tenant_b, name="Offer B1", status="active")
    db.add_all([offer_a1, offer_a2, offer_b1])
    db.flush()
    return {"a1": offer_a1, "a2": offer_a2, "b1": offer_b1}
