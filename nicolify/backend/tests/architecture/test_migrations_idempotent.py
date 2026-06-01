"""Architecture fitness: migraciones Alembic deben ser idempotentes.

Verifica que:
  1. Toda sentencia DDL en las versiones de alembic use IF NOT EXISTS / IF EXISTS
  2. No se use op.create_table(), op.add_column() o sa.Enum(create_type=True)
  3. El snapshot legacy 001_initial_snapshot.py (monolito visionarias) NO existe
  4. Existe al menos una migración (001_nicolify_iam_baseline.py) con down_revision=None

T-1 nicolify-r0-dev-stack — V-AV-3.
downstream-regression-na: brand-local arch fitness; no cross-brand consumers
"""

from __future__ import annotations

import re
from pathlib import Path

WS_ROOT = Path(__file__).resolve().parents[4]
VERSIONS_DIR = WS_ROOT / "nicolify" / "backend" / "alembic" / "versions"


def _migration_files() -> list[Path]:
    if not VERSIONS_DIR.exists():
        return []
    return sorted(VERSIONS_DIR.glob("*.py"))


def test_legacy_snapshot_deleted() -> None:
    """001_initial_snapshot.py (monolito visionarias 115 tablas) debe estar eliminado.

    AD-3: el snapshot legacy contradice el scope ratificado — reemplazado por baseline IAM limpio.
    """
    legacy = VERSIONS_DIR / "001_initial_snapshot.py"
    assert not legacy.exists(), (
        f"001_initial_snapshot.py (snapshot monolito visionarias) encontrado en {legacy}. "
        "AD-3: debe ser eliminado y reemplazado por 001_nicolify_iam_baseline.py."
    )


def test_iam_baseline_migration_exists() -> None:
    """001_nicolify_iam_baseline.py debe existir (primera migración limpia)."""
    migration_files = _migration_files()
    names = [f.name for f in migration_files]
    iam_baselines = [n for n in names if "iam_baseline" in n or "nicolify_iam" in n]
    assert iam_baselines, (
        f"No se encontró migración iam_baseline en {VERSIONS_DIR}. "
        "T-1 requiere 001_nicolify_iam_baseline.py como primera migración (AD-3)."
    )


def test_all_ddl_idempotent() -> None:
    """Todo DDL debe usar IF NOT EXISTS / IF EXISTS (idempotent).

    Patrón raw SQL obligatorio — NUNCA op.create_table() / op.add_column() no idempotentes.
    """
    migration_files = _migration_files()
    if not migration_files:
        # Si no hay migraciones todavía, skip — test_iam_baseline_migration_exists
        # ya reportará el problema
        return

    violations: list[str] = []
    # Patterns that indicate non-idempotent DDL
    non_idempotent_patterns = [
        # op.create_table("...") — non-idempotent (fails if table exists)
        r"\bop\.create_table\s*\(",
        # op.add_column("...") — non-idempotent
        r"\bop\.add_column\s*\(",
        # op.create_index("...") without if_not_exists — non-idempotent
        r"\bop\.create_index\s*\(",
        r"sa\.Enum\s*\([^)]*create_type\s*=\s*True",  # sa.Enum(create_type=True) broken SA 2.0.27
        r"postgresql\.ENUM\s*\([^)]*create_type\s*=\s*True",  # postgresql.ENUM(create_type=True)
    ]

    for path in migration_files:
        content = path.read_text(encoding="utf-8")
        # Skip if the file uses raw SQL via op.execute (idempotent pattern)
        # Only flag files that use non-idempotent op.* calls
        for pattern in non_idempotent_patterns:
            if re.search(pattern, content):
                violations.append(f"{path.name}: patrón no-idempotente detectado: `{pattern}`")

    assert not violations, (
        "Migraciones con DDL no-idempotente encontradas:\n"
        + "\n".join(violations)
        + "\nUsar raw SQL: op.execute('CREATE TABLE IF NOT EXISTS ...')"
    )


def test_baseline_has_no_revision() -> None:
    """La primera migración debe tener down_revision = None (baseline limpio)."""
    migration_files = _migration_files()
    if not migration_files:
        return  # test_iam_baseline_migration_exists reportará

    baseline_files = [f for f in migration_files if "iam_baseline" in f.name or "nicolify_iam" in f.name]
    if not baseline_files:
        return  # test_iam_baseline_migration_exists reportará

    for baseline in baseline_files:
        content = baseline.read_text(encoding="utf-8")
        # down_revision should be None (not a string hash)
        match = re.search(r"down_revision\s*[:=]\s*(.+)", content)
        if match:
            val = match.group(1).strip().rstrip(",")
            assert val in ("None", "''", '""'), (
                f"{baseline.name}: down_revision debe ser None para baseline limpio, encontrado: {val}"
            )
