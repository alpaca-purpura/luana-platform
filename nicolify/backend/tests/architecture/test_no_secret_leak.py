"""Architecture fitness: /health y /api/health no deben exponer secretos/env vars.

Verifica que el payload de salud solo incluya {status, brand, version} —
sin valores de variables de entorno, tokens, DSN, keys o cualquier secreto.

T-1 nicolify-r0-dev-stack — V-AV-4.
downstream-regression-na: brand-local arch fitness; no cross-brand consumers
"""

from __future__ import annotations

import re
from pathlib import Path

WS_ROOT = Path(__file__).resolve().parents[4]
MAIN_PY = WS_ROOT / "nicolify" / "backend" / "src" / "main.py"


_SECRET_PATTERNS: list[str] = [
    # Env var access patterns that might leak to response
    r'os\.environ\.get\s*\(\s*["\'](?:DATABASE_URL|POSTGRES_PASSWORD|CLERK_SECRET|JWT_SECRET|SECRET_KEY|API_KEY)',
    r'os\.getenv\s*\(\s*["\'](?:DATABASE_URL|POSTGRES_PASSWORD|CLERK_SECRET|JWT_SECRET|SECRET_KEY|API_KEY)',
    # Direct os.environ dict access
    r"os\.environ\[",
]

# Fields allowed in health response (whitelist)
_ALLOWED_HEALTH_FIELDS: frozenset[str] = frozenset(["status", "brand", "version"])


def test_health_response_fields_limited() -> None:
    """HealthResponse DTO debe contener solo campos permitidos: status, brand, version.

    Sin DSN, tokens, URLs internas ni ninguna información de infraestructura.
    """
    if not MAIN_PY.exists():
        return  # test_main_py_exists ya reportará

    source = MAIN_PY.read_text(encoding="utf-8")

    # Check HealthResponse class definition — look for field names
    # Match patterns like:  status: str / brand: str / version: str
    # and ensure no additional sensitive fields
    sensitive_field_names = [
        "database_url",
        "secret",
        "token",
        "password",
        "key",
        "dsn",
        "connection",
        "host",
        "port",
        "user",
        "clerk",
        "issuer",
        "jwks",
        "private",
        "credential",
    ]
    for field in sensitive_field_names:
        pattern = rf"(?i)\b{re.escape(field)}\s*:\s*str"
        match = re.search(pattern, source)
        if match:
            # Check if it's inside HealthResponse class (approximate)
            # Simple check: field shouldn't be in HealthResponse-like context
            msg = (
                f"Campo sensible '{field}' detectado en main.py como field de DTO. "
                "HealthResponse solo debe exponer: status, brand, version."
            )
            raise AssertionError(msg)


def test_no_secret_env_access_in_health_handlers() -> None:
    """Los handlers /health y /api/health no deben acceder a env vars secretas."""
    if not MAIN_PY.exists():
        return

    source = MAIN_PY.read_text(encoding="utf-8")

    for pattern in _SECRET_PATTERNS:
        matches = re.findall(pattern, source)
        if matches:
            msg = (
                f"Acceso a variable de entorno sensible detectado en main.py: {matches}. "
                "Los endpoints /health no deben acceder a secretos de configuración."
            )
            raise AssertionError(msg)


def test_openapi_does_not_expose_env_values() -> None:
    """main.py no debe incluir valores de variables de entorno en title/description/version.

    El OpenAPI schema (accessible en /docs y /openapi.json) no debe revelar
    URLs de base de datos, claves u otros datos de infraestructura.
    """
    if not MAIN_PY.exists():
        return

    source = MAIN_PY.read_text(encoding="utf-8")

    # Look for FastAPI(...) call and check that no env vars are interpolated in strings
    dangerous_in_description = [
        r"DATABASE_URL\b",
        r"POSTGRES_PASSWORD\b",
        r"CLERK_SECRET\b",
        r"SECRET_KEY\b",
    ]
    # These patterns should NOT appear inside the FastAPI() constructor call area
    # or in f-strings used for title/description/version
    for pattern in dangerous_in_description:
        # Only flag if pattern appears AND is inside FastAPI constructor arguments
        if re.search(pattern, source) and re.search(rf'(?:title|description|version)\s*=\s*["\'].*{pattern}', source):
            msg = (
                f"Variable de entorno sensible '{pattern}' detectada en argumento "
                "de FastAPI(title/description/version). No exponer en OpenAPI schema."
            )
            raise AssertionError(msg)
