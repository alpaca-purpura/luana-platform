"""Smoke tests for Slice 1 migrations 002-016 (T-infra-1).

Tests verify:
  - All 15 migration files exist with correct revision chain
  - Raw SQL IF NOT EXISTS pattern used throughout (no op.create_table / sa.Enum)
  - BYTEA columns present for PHI-encrypted fields per hipaa-lite.md
  - audit_log table is partitioned (PARTITION BY RANGE)
  - pgcrypto extension enabled
  - maintenance_schedule_enum exists in migration SQL
  - tenants location columns present in migration 014
  - offers adherence columns + check constraints present in migration 015
  - Integration tests (require Postgres) verify actual migration applies + idempotency

All static tests run without Postgres. Integration tests marked @pytest.mark.integration
and skip if Postgres unavailable.

Per .claude/rules/backend-migrations.md:
- IF NOT EXISTS everywhere
- Enum via DO $$ BEGIN ... EXCEPTION WHEN duplicate_object END $$ block
- NEVER op.create_table() / sa.Enum(create_type=True)
"""

from __future__ import annotations

import io
import os
import re
import tokenize
from pathlib import Path

import pytest

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────

_WORKSPACE_ROOT: Path = next(p for p in Path(__file__).resolve().parents if (p / "AGENTS.md").is_file())
_VERSIONS_DIR = _WORKSPACE_ROOT / "vitalia" / "backend" / "alembic" / "versions"

# Expected migration files and revision IDs
_MIGRATIONS: list[tuple[str, str, str | None]] = [
    # (filename, revision, down_revision)
    ("001_vitalia_initial_snapshot.py", "001_vitalia", None),
    ("002_vitalia_appointments_columns.py", "002_vitalia", "001_vitalia"),
    ("003_vitalia_payment_events.py", "003_vitalia", "002_vitalia"),
    ("004_vitalia_fiscal_receipts.py", "004_vitalia", "003_vitalia"),
    ("005_vitalia_treatment_plans.py", "005_vitalia", "004_vitalia"),
    ("006_vitalia_re_engagement_events.py", "006_vitalia", "005_vitalia"),
    ("007_vitalia_channel_sync_state.py", "007_vitalia", "006_vitalia"),
    ("008_vitalia_channel_metrics.py", "008_vitalia", "007_vitalia"),
    ("009_vitalia_lucas_recommendations.py", "009_vitalia", "008_vitalia"),
    ("010_vitalia_referrals.py", "010_vitalia", "009_vitalia"),
    ("011_vitalia_onboarding_progress.py", "011_vitalia", "010_vitalia"),
    ("012_vitalia_brand_studio_drafts.py", "012_vitalia", "011_vitalia"),
    ("013_vitalia_audit_log.py", "013_vitalia", "012_vitalia"),
    ("014_vitalia_tenants_columns.py", "014_vitalia", "013_vitalia"),
    ("015_vitalia_offers_columns.py", "015_vitalia", "014_vitalia"),
    ("016_vitalia_patients_columns.py", "016_vitalia", "015_vitalia"),
]

# Slice 1 new tables (002-013)
_SLICE1_NEW_TABLES = [
    "vitalia_appointments",
    "vitalia_payment_events",
    "vitalia_fiscal_receipts",
    "vitalia_treatment_plans",
    "vitalia_re_engagement_events",
    "vitalia_channel_sync_state",
    "vitalia_channel_metrics",
    "vitalia_lucas_recommendations",
    "vitalia_referrals",
    "vitalia_onboarding_progress",
    "vitalia_brand_studio_drafts",
    "vitalia_audit_log",
]


def _is_postgres_available() -> bool:
    """Check if a local Postgres is reachable."""
    try:
        import psycopg2  # type: ignore[import]

        conn = psycopg2.connect(
            host=os.environ.get("POSTGRES_HOST", "localhost"),
            port=int(os.environ.get("POSTGRES_PORT", "5432")),
            user=os.environ.get("POSTGRES_USER", "postgres"),
            password=os.environ.get("POSTGRES_PASSWORD", "password"),
            dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
            connect_timeout=3,
        )
        conn.close()
        return True
    except Exception:
        return False


def _read_migration(filename: str) -> str:
    """Read migration file content."""
    path = _VERSIONS_DIR / filename
    return path.read_text()


def _strip_docstrings_and_comments(source: str) -> str:
    """Remove triple-quoted docstrings and # comments from Python source."""
    result = []
    try:
        tokens = tokenize.generate_tokens(io.StringIO(source).readline)
        for tok_type, tok_string, _, _, _ in tokens:
            if tok_type == tokenize.STRING and tok_string.startswith(('"""', "'''")):
                result.append(" ")
            elif tok_type == tokenize.COMMENT:
                result.append(" ")
            else:
                result.append(tok_string)
    except tokenize.TokenError:
        return source
    return "".join(result)


# ─────────────────────────────────────────────────────────────────────────────
# Static structural tests (no Postgres required)
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize("filename,revision,down_revision", _MIGRATIONS)
def test_migration_file_exists(filename: str, revision: str, down_revision: str | None) -> None:
    """All 16 migration files (001-016) must exist."""
    path = _VERSIONS_DIR / filename
    assert path.exists(), f"Migration file not found: {path}"


@pytest.mark.parametrize("filename,revision,down_revision", _MIGRATIONS)
def test_migration_revision_ids(filename: str, revision: str, down_revision: str | None) -> None:
    """Each migration must declare correct revision and down_revision."""
    content = _read_migration(filename)
    assert f'revision = "{revision}"' in content, f"{filename}: revision must be '{revision}'"
    if down_revision is None:
        assert "down_revision = None" in content, f"{filename}: vitalia chain root must have down_revision = None"
    else:
        assert f'down_revision = "{down_revision}"' in content, f"{filename}: down_revision must be '{down_revision}'"


@pytest.mark.parametrize("filename,revision,down_revision", _MIGRATIONS)
def test_no_op_create_table(filename: str, revision: str, down_revision: str | None) -> None:
    """No op.create_table() in any migration — non-idempotent per backend-migrations.md."""
    content = _read_migration(filename)
    code_only = _strip_docstrings_and_comments(content)
    assert "op.create_table(" not in code_only, (
        f"{filename}: op.create_table() found — use raw SQL CREATE TABLE IF NOT EXISTS"
    )


@pytest.mark.parametrize("filename,revision,down_revision", _MIGRATIONS)
def test_no_sa_enum_create_type(filename: str, revision: str, down_revision: str | None) -> None:
    """No sa.Enum(create_type=True) — broken SA 2.0.27."""
    content = _read_migration(filename)
    code_only = _strip_docstrings_and_comments(content)
    assert "create_type=True" not in code_only, f"{filename}: sa.Enum(create_type=True) found — broken in SA 2.0.27"


@pytest.mark.parametrize("filename,revision,down_revision", _MIGRATIONS)
def test_all_indexes_have_if_not_exists(filename: str, revision: str, down_revision: str | None) -> None:
    """Every CREATE INDEX statement must use IF NOT EXISTS."""
    content = _read_migration(filename)
    index_creates = re.findall(r"CREATE\s+(?:UNIQUE\s+)?INDEX\b[^\n;]+", content, re.IGNORECASE)
    for stmt in index_creates:
        assert "IF NOT EXISTS" in stmt.upper(), f"{filename}: index missing IF NOT EXISTS: {stmt[:80]}"


def test_slice1_tables_have_create_if_not_exists() -> None:
    """All Slice 1 new tables use CREATE TABLE IF NOT EXISTS."""
    all_content = ""
    for filename, _, _ in _MIGRATIONS[1:]:  # skip 001
        all_content += _read_migration(filename) + "\n"

    for table in _SLICE1_NEW_TABLES:
        pattern = rf"CREATE TABLE IF NOT EXISTS\s+{re.escape(table)}\b"
        assert re.search(pattern, all_content, re.IGNORECASE), (
            f"Table '{table}' must use CREATE TABLE IF NOT EXISTS in Slice 1 migrations"
        )


def test_pgcrypto_extension_in_migrations() -> None:
    """pgcrypto extension must be enabled in at least one migration (005 or 013)."""
    found = False
    for filename in ("005_vitalia_treatment_plans.py", "013_vitalia_audit_log.py"):
        content = _read_migration(filename)
        if "CREATE EXTENSION IF NOT EXISTS pgcrypto" in content:
            found = True
            break
    assert found, (
        "pgcrypto extension must be enabled via CREATE EXTENSION IF NOT EXISTS pgcrypto in migration 005 or 013"
    )


def test_phi_bytea_columns_present() -> None:
    """PHI-encrypted columns use BYTEA type per hipaa-lite.md § Encryption at rest."""
    phi_column_checks = [
        ("005_vitalia_treatment_plans.py", "notes", "BYTEA"),
        ("006_vitalia_re_engagement_events.py", "payload_phi", "BYTEA"),
        ("007_vitalia_channel_sync_state.py", "oauth_token_encrypted", "BYTEA"),
        ("013_vitalia_audit_log.py", "payload_redacted", "BYTEA"),
    ]
    for filename, column, col_type in phi_column_checks:
        content = _read_migration(filename)
        assert column in content, f"{filename}: expected column '{column}' not found"
        # Find the column declaration and verify BYTEA type
        pattern = rf"{re.escape(column)}\s+{re.escape(col_type)}"
        assert re.search(pattern, content, re.IGNORECASE), (
            f"{filename}: column '{column}' must be {col_type} (PHI encryption)"
        )


def test_audit_log_partitioned_by_range() -> None:
    """vitalia_audit_log must be PARTITION BY RANGE (occurred_at) per hipaa-lite.md."""
    content = _read_migration("013_vitalia_audit_log.py")
    assert "PARTITION BY RANGE" in content.upper(), (
        "013_vitalia_audit_log: vitalia_audit_log must be PARTITION BY RANGE (occurred_at)"
    )
    assert "occurred_at" in content, "013_vitalia_audit_log: partition key must be occurred_at"


def test_audit_log_has_monthly_partitions() -> None:
    """Migration 013 must create at least 3 monthly partition tables."""
    content = _read_migration("013_vitalia_audit_log.py")
    partition_matches = re.findall(r"vitalia_audit_log_\d{4}_\d{2}", content)
    assert len(partition_matches) >= 3, (
        f"013_vitalia_audit_log: expected >= 3 monthly partition tables, "
        f"found {len(partition_matches)}: {partition_matches}"
    )


def test_maintenance_schedule_enum_in_migration_015() -> None:
    """migration 015 must create maintenance_schedule_enum type."""
    content = _read_migration("015_vitalia_offers_columns.py")
    assert "maintenance_schedule_enum" in content, (
        "015_vitalia_offers_columns: maintenance_schedule_enum type not found"
    )
    # Must use DO $$ EXCEPTION WHEN duplicate_object pattern (idempotent)
    assert "EXCEPTION WHEN duplicate_object" in content, (
        "015_vitalia_offers_columns: enum must use DO $$ EXCEPTION WHEN duplicate_object END $$ block"
    )
    # Must have all 6 canonical enum values per MaintenanceScheduleEnum engine contract
    for value in ("NONE", "MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL", "CUSTOM"):
        assert f"'{value}'" in content, f"015_vitalia_offers_columns: enum missing value '{value}'"


def test_tenants_location_columns_in_migration_014() -> None:
    """Migration 014 must add all 4 TenantLocationContract columns."""
    content = _read_migration("014_vitalia_tenants_columns.py")
    for column in ("is_onboarded", "location_country", "location_city", "timezone"):
        assert column in content, f"014_vitalia_tenants_columns: column '{column}' not found"
    # Must use ADD COLUMN IF NOT EXISTS
    assert "ADD COLUMN IF NOT EXISTS" in content, "014_vitalia_tenants_columns: must use ADD COLUMN IF NOT EXISTS"
    # Must backfill existing tenants
    assert "UPDATE tenants" in content, (
        "014_vitalia_tenants_columns: must backfill existing tenants (is_onboarded = TRUE)"
    )


def test_offers_check_constraints_in_migration_015() -> None:
    """Migration 015 must add both OfferAdherenceContract check constraints."""
    content = _read_migration("015_vitalia_offers_columns.py")
    assert "chk_offer_sessions_expected_positive" in content, (
        "015_vitalia_offers_columns: missing check constraint chk_offer_sessions_expected_positive"
    )
    assert "chk_offer_maintenance_custom_days_valid" in content, (
        "015_vitalia_offers_columns: missing check constraint chk_offer_maintenance_custom_days_valid"
    )


def test_offers_adherence_columns_in_migration_015() -> None:
    """Migration 015 must add all 5 OfferAdherenceContract columns."""
    content = _read_migration("015_vitalia_offers_columns.py")
    for column in (
        "requires_multi_session",
        "sessions_expected",
        "gap_alert_days",
        "maintenance_schedule",
        "maintenance_custom_days",
    ):
        assert column in content, f"015_vitalia_offers_columns: column '{column}' not found"


def test_patients_consent_columns_in_migration_016() -> None:
    """Migration 016 must add marketing consent columns to vitalia_patients."""
    content = _read_migration("016_vitalia_patients_columns.py")
    for column in ("marketing_opt_in", "opt_out", "opt_out_reason", "opt_out_at"):
        assert column in content, f"016_vitalia_patients_columns: column '{column}' not found"


def test_audit_log_no_deleted_at() -> None:
    """vitalia_audit_log must NOT have deleted_at — it is IMMUTABLE per hipaa-lite.md."""
    content = _read_migration("013_vitalia_audit_log.py")
    # Find the CREATE TABLE block
    pattern = r"CREATE TABLE IF NOT EXISTS\s+vitalia_audit_log\s*\((.+?)\)\s+PARTITION"
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    assert match, "vitalia_audit_log CREATE TABLE block not found in 013"
    table_body = match.group(1)
    assert "deleted_at" not in table_body, (
        "vitalia_audit_log must NOT have deleted_at — it is immutable (10-year retention)"
    )


def test_all_timestamps_are_timestamptz() -> None:
    """All timestamp columns across Slice 1 migrations must use TIMESTAMPTZ."""
    for filename, _, _ in _MIGRATIONS[1:]:  # skip 001
        content = _read_migration(filename)
        # Strip docstrings/comments before checking — they may mention "timestamp" in prose
        code_only = _strip_docstrings_and_comments(content)
        # Count plain TIMESTAMP not followed by Z or WITH TIME ZONE
        plain_ts = re.findall(r"\bTIMESTAMP\b(?!\s*W|\s*Z|\s+WITH)", code_only, re.IGNORECASE)
        assert len(plain_ts) == 0, f"{filename}: found plain TIMESTAMP — must use TIMESTAMPTZ: {plain_ts[:3]}"


def test_revision_chain_is_sequential() -> None:
    """Verify the revision chain 001->002->...->016 is complete and sequential."""
    for i, (filename, revision, down_revision) in enumerate(_MIGRATIONS):
        content = _read_migration(filename)
        assert f'revision = "{revision}"' in content
        if down_revision is None:
            assert "down_revision = None" in content
        else:
            assert f'down_revision = "{down_revision}"' in content, (
                f"{filename}: expected down_revision='{down_revision}'"
            )


# ─────────────────────────────────────────────────────────────────────────────
# Integration tests (require live Postgres)
# ─────────────────────────────────────────────────────────────────────────────

_postgres_available = _is_postgres_available()


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_migrations_apply_clean() -> None:
    """Slice 1: alembic upgrade head from 001 to 016 succeeds."""
    import subprocess

    backend_dir = str(_WORKSPACE_ROOT / "vitalia" / "backend")
    alembic = str(_WORKSPACE_ROOT / ".venv" / "bin" / "alembic")

    result = subprocess.run(
        [alembic, "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"alembic upgrade head failed:\nstdout: {result.stdout}\nstderr: {result.stderr}"


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_migrations_are_idempotent() -> None:
    """Slice 1: applying upgrade head twice is a no-op (idempotent)."""
    import subprocess

    backend_dir = str(_WORKSPACE_ROOT / "vitalia" / "backend")
    alembic = str(_WORKSPACE_ROOT / ".venv" / "bin" / "alembic")

    result1 = subprocess.run(
        [alembic, "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )
    assert result1.returncode == 0, f"First upgrade failed: {result1.stderr}"

    result2 = subprocess.run(
        [alembic, "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )
    assert result2.returncode == 0, f"Second upgrade (idempotent check) failed:\n{result2.stderr}"


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_audit_log_partitioned_monthly() -> None:
    """Verify vitalia_audit_log partition exists post-upgrade."""
    import psycopg2  # type: ignore[import]

    conn = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
        dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
    )
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
                  AND tablename LIKE 'vitalia_audit_log_%'
                ORDER BY tablename;
            """)
            rows = cur.fetchall()
            partitions = [r[0] for r in rows]
    finally:
        conn.close()

    assert len(partitions) >= 1, f"Expected at least 1 vitalia_audit_log partition, found: {partitions}"
    # Verify at least one partition follows the YYYY_MM naming pattern
    pattern = re.compile(r"vitalia_audit_log_\d{4}_\d{2}")
    assert any(pattern.match(p) for p in partitions), (
        f"No partition follows vitalia_audit_log_YYYY_MM pattern: {partitions}"
    )


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_pgcrypto_extension_enabled() -> None:
    """Verify pgcrypto extension is enabled in the database post-upgrade."""
    import psycopg2  # type: ignore[import]

    conn = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
        dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';")
            row = cur.fetchone()
    finally:
        conn.close()

    assert row is not None, (
        "pgcrypto extension not found in pg_extension — required for PHI column encryption per hipaa-lite.md"
    )


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_phi_columns_bytea_type() -> None:
    """Verify PHI-encrypted columns have BYTEA type in the database."""
    import psycopg2  # type: ignore[import]

    conn = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
        dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
    )
    phi_columns = [
        ("vitalia_treatment_plans", "notes"),
        ("vitalia_re_engagement_events", "payload_phi"),
        ("vitalia_channel_sync_state", "oauth_token_encrypted"),
    ]
    try:
        with conn.cursor() as cur:
            for table, column in phi_columns:
                cur.execute(
                    """
                    SELECT data_type FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = %s
                      AND column_name = %s;
                """,
                    (table, column),
                )
                row = cur.fetchone()
                assert row is not None, f"Column {table}.{column} not found in information_schema"
                assert row[0] == "bytea", f"{table}.{column}: expected bytea, got {row[0]}"
    finally:
        conn.close()


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_maintenance_schedule_enum_exists() -> None:
    """Verify maintenance_schedule_enum type is registered in pg_type."""
    import psycopg2  # type: ignore[import]

    conn = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
        dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT typname FROM pg_type WHERE typname = 'maintenance_schedule_enum';")
            row = cur.fetchone()
    finally:
        conn.close()

    assert row is not None, (
        "maintenance_schedule_enum type not found in pg_type — "
        "migration 015 must create it via DO $$ BEGIN CREATE TYPE ... END $$"
    )


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_tenants_location_columns_exist() -> None:
    """Verify tenants table has all 4 TenantLocationContract columns."""
    import psycopg2  # type: ignore[import]

    conn = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
        dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
    )
    expected_columns = ["is_onboarded", "location_country", "location_city", "timezone"]
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'tenants'
                ORDER BY column_name;
            """)
            rows = cur.fetchall()
            found_columns = {r[0] for r in rows}
    finally:
        conn.close()

    for col in expected_columns:
        assert col in found_columns, f"tenants.{col} not found — migration 014 (TenantLocationContract) must add it"


@pytest.mark.integration
@pytest.mark.skipif(
    not _postgres_available,
    reason="Postgres not available — skipping integration test (document in impl-log)",
)
def test_offers_adherence_columns_exist() -> None:
    """Verify offers table has all 5 OfferAdherenceContract columns + check constraints."""
    import psycopg2  # type: ignore[import]

    conn = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "password"),
        dbname=os.environ.get("POSTGRES_DB", "vitalia_dev"),
    )
    expected_columns = [
        "requires_multi_session",
        "sessions_expected",
        "gap_alert_days",
        "maintenance_schedule",
        "maintenance_custom_days",
    ]
    expected_constraints = [
        "chk_offer_sessions_expected_positive",
        "chk_offer_maintenance_custom_days_valid",
    ]
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'offers'
                ORDER BY column_name;
            """)
            rows = cur.fetchall()
            found_columns = {r[0] for r in rows}

            cur.execute("""
                SELECT conname FROM pg_constraint
                WHERE conrelid = 'offers'::regclass
                  AND contype = 'c'
                ORDER BY conname;
            """)
            constraint_rows = cur.fetchall()
            found_constraints = {r[0] for r in constraint_rows}
    finally:
        conn.close()

    for col in expected_columns:
        assert col in found_columns, f"offers.{col} not found — migration 015 (OfferAdherenceContract) must add it"

    for constraint in expected_constraints:
        assert constraint in found_constraints, (
            f"offers constraint '{constraint}' not found — migration 015 must create it"
        )
