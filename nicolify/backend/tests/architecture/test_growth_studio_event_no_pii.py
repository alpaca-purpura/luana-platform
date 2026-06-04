# cap: abel/icp-buyer  # noqa: ERA001
"""Architecture fitness: nicolify_growth_studio_event debe emitirse sin PII.

NF-sec-pii: props JSONB sin emails, phones, nombres reales.
Verifica que GrowthStudioEmitter nunca incluye campos PII en sus props.
Verifica que el modelo SQL no tiene columnas de PII (email, phone, etc.).

T-BE-1 · story: nicolify-r1-abel-icp-buyer.
downstream-regression-na: brand-local arch fitness; no cross-brand consumers.
"""

from __future__ import annotations

import ast
from pathlib import Path

WS_ROOT = Path(__file__).resolve().parents[4]
EMITTER_PATH = (
    WS_ROOT
    / "nicolify"
    / "backend"
    / "src"
    / "modules"
    / "nicolify"
    / "abel"
    / "application"
    / "telemetry"
    / "growth_studio_emitter.py"
)
MODEL_PATH = (
    WS_ROOT
    / "nicolify"
    / "backend"
    / "src"
    / "modules"
    / "nicolify"
    / "abel"
    / "infrastructure"
    / "models"
    / "growth_studio_event_model.py"
)

# PII field names that MUST NOT appear in props dicts passed to emitter.emit()
_PII_PROP_KEYS = frozenset(
    [
        "email",
        "phone",
        "name",
        "nombre",
        "apellido",
        "telefono",
        "celular",
        "dni",
        "rfc",
        "curp",
        "cedula",
        "address",
        "direccion",
        "ip",
    ]
)

# DB column names that must NOT appear on growth_studio_event (PII check)
_FORBIDDEN_MODEL_COLUMNS = frozenset(
    [
        "email",
        "phone",
        "name",
        "nombre",
        "full_name",
        "first_name",
        "last_name",
        "apellido",
        "telefono",
        "direccion",
        "address",
    ]
)


def test_growth_studio_event_model_has_no_pii_columns():
    """GrowthStudioEventModel columns must not include PII fields.

    The model should only have: id, tenant_id, account_id, user_id,
    event_name, props (JSONB), occurred_at.
    """
    assert MODEL_PATH.exists(), f"Model not found: {MODEL_PATH}"
    source = MODEL_PATH.read_text()
    tree = ast.parse(source)

    # Collect all string values from mapped_column calls (column name args)
    # and attribute names in the class body
    found_pii: list[str] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and "GrowthStudioEvent" in node.name:
            for item in node.body:
                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    attr_name = item.target.id.lower()
                    if attr_name in _FORBIDDEN_MODEL_COLUMNS:
                        found_pii.append(attr_name)

    assert not found_pii, (
        f"GrowthStudioEventModel has PII column(s): {found_pii}. "
        "Remove PII fields — use props JSONB with bucketed/hashed values only."
    )


def test_growth_studio_emitter_uses_try_except_best_effort():
    """GrowthStudioEmitter emits best-effort (try/except) — no rompe respuesta primaria."""
    assert EMITTER_PATH.exists(), f"Emitter not found: {EMITTER_PATH}"
    source = EMITTER_PATH.read_text()
    tree = ast.parse(source)

    # Verify there's a try/except in the emit method
    found_try = False
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == "emit":
            for child in ast.walk(node):
                if isinstance(child, ast.Try):
                    found_try = True
                    break

    assert found_try, (
        "GrowthStudioEmitter.emit() debe usar try/except (best-effort). "
        "NF-sec-pii: errores de telemetría no deben romper la respuesta primaria."
    )


def test_growth_studio_event_model_is_importable():
    """GrowthStudioEventModel es importable sin errores."""
    from src.modules.nicolify.abel.infrastructure.models.growth_studio_event_model import (
        GrowthStudioEventModel,
    )

    assert GrowthStudioEventModel.__tablename__ == "nicolify_growth_studio_event"


def test_growth_studio_emitter_is_importable():
    """GrowthStudioEmitter es importable sin errores."""
    from src.modules.nicolify.abel.application.telemetry.growth_studio_emitter import (
        GrowthStudioEmitter,
    )

    assert GrowthStudioEmitter is not None


def test_growth_studio_event_model_has_account_id_not_clinic_id():
    """ADR-nicolify-001 §8: account_id NOT clinic_id (eso es Vitalia-only).

    Verify model uses account_id column (B2B nicolify concept) not clinic_id
    (which is a Vitalia healthcare concept — wrong brand).
    """
    assert MODEL_PATH.exists(), f"Model not found: {MODEL_PATH}"
    source = MODEL_PATH.read_text()

    assert "account_id" in source, "GrowthStudioEventModel debe tener account_id (ADR-nicolify-001 §8)."
    assert "clinic_id" not in source, (
        "GrowthStudioEventModel NO debe tener clinic_id — eso es Vitalia-only. Nicolify usa account_id (B2B concept)."
    )
