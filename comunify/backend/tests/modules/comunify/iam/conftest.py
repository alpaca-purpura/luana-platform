"""Env defaults for the comunify IAM mount tests.

The engine IAM router (``luana_core_iam.api.routers.auth_router``) imports
``luana_core_platform.core.database`` which triggers ``Settings()`` at module
load and requires ~16 env vars. These must be set BEFORE any import triggers
config loading.

Canonical pattern mirrored from
``tests/modules/comunify/copilot/conftest.py`` (CI test env defaults — dummy
values, never used to reach a real service).
"""

from __future__ import annotations

import os

# --- Mandatory env vars before any import triggers config loading ---
_TEST_ENV_DEFAULTS = {
    "LOG_LEVEL": "DEBUG",
    "DOMAIN_NAME": "localhost",
    "TRAEFIK_NETWORK": "test_network",
    "API_SECRET_KEY": "ci-test-secret-key-not-for-prod",
    "WHATSAPP_API_TOKEN": "ci-dummy-token",
    "WHATSAPP_PHONE_NUMBER_ID": "000000000",
    "WHATSAPP_VERIFY_TOKEN": "ci-verify-token",
    "OPENAI_API_KEY": "sk-ci-dummy-key",
    "REDIS_URL": "redis://localhost:6379/0",
    "QDRANT_URL": "http://localhost:6333",
    "POSTGRES_USER": "postgres",
    "POSTGRES_PASSWORD": "postgres",
    "POSTGRES_DB": "test_db",
    "POSTGRES_HOST": "localhost",
    "POSTGRES_PORT": "5432",
    "API_URL": "http://localhost:8000",
    "DASHBOARD_DOMAIN": "http://localhost:3000",
    "PROMPT_SOURCE": "file",
    "AI_PROVIDER": "openai",
    "AI_MODEL_NANO": "gpt-4o-mini",
    "AI_MODEL_FAST": "deepseek-v4-flash",
    "AI_MODEL_REASONING": "deepseek-v4-pro",
    "AI_MODEL_AGENT": "kimi-k2.6",
    "AI_MODEL_VISION": "gpt-4o",
    "AI_MODEL_EMBEDDING": "text-embedding-3-large",
    "AI_PROVIDER_NANO": "openai",
    "AI_PROVIDER_FAST": "deepseek",
    "AI_PROVIDER_REASONING": "deepseek",
    "AI_PROVIDER_AGENT": "kimi",
    "AI_PROVIDER_VISION": "openai",
    "AI_PROVIDER_EMBEDDING": "openai",
    "KIMI_API_KEY": "ci-dummy-key",
    "DEEPSEEK_API_KEY": "ci-dummy-key",
    "DASHSCOPE_API_KEY": "ci-dummy-key",
}

for _key, _value in _TEST_ENV_DEFAULTS.items():
    os.environ.setdefault(_key, _value)
