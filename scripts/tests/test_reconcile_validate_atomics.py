"""Tests for the --validate-atomics flag in scripts/reconcile_capabilities.py.

Uses inline YAML fixtures via tmp_path — does NOT depend on real cap files.
All tests exercise validate_atomics() directly.

Cement: 2026-05-28 (Wave 2-F, Cap Verification).
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest
import yaml

# ---------------------------------------------------------------------------
# Import target module
# ---------------------------------------------------------------------------

_SCRIPTS_DIR = Path(__file__).parent.parent


def _load_module():
    module_name = "reconcile_capabilities"
    spec = importlib.util.spec_from_file_location(
        module_name,
        _SCRIPTS_DIR / "reconcile_capabilities.py",
    )
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    # Register before exec so @dataclass can find the module via sys.modules
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


_mod = _load_module()
validate_atomics = _mod.validate_atomics

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_FRONTMATTER_TEMPLATE = """\
---
{yaml_content}
---

# Capability placeholder
"""


def _write_cap(caps_dir: Path, module: str, slug: str, data: dict) -> Path:
    """Write a capability YAML file under caps_dir/{module}/{slug}.yaml."""
    module_dir = caps_dir / module
    module_dir.mkdir(parents=True, exist_ok=True)
    path = module_dir / f"{slug}.yaml"
    yaml_content = yaml.dump(data, allow_unicode=True, default_flow_style=False)
    path.write_text(_FRONTMATTER_TEMPLATE.format(yaml_content=yaml_content), encoding="utf-8")
    return path


def _write_story_checkpoint(repo: Path, brand: str, story_id: str, state: str = "done") -> None:
    """Create a minimal story checkpoint.md for cross-reference tests."""
    story_dir = repo / brand / "docs" / "product" / "stories" / story_id
    story_dir.mkdir(parents=True, exist_ok=True)
    cp = story_dir / "checkpoint.md"
    cp.write_text(
        f"---\nstory_id: {story_id}\nstate: {state}\n---\n# checkpoint\n",
        encoding="utf-8",
    )


def _write_archived_story_checkpoint(
    repo: Path, brand: str, year: str, story_id: str, state: str = "done"
) -> None:
    """Create a minimal archived story checkpoint.md."""
    story_dir = repo / brand / "docs" / "archive" / year / "stories" / story_id
    story_dir.mkdir(parents=True, exist_ok=True)
    cp = story_dir / "checkpoint.md"
    cp.write_text(
        f"---\nstory_id: {story_id}\nstate: {state}\n---\n# checkpoint\n",
        encoding="utf-8",
    )


def _base_valid_cap(cap_id: str, story_id: str = "test-story-001") -> dict:
    """Return a minimal valid capability dict with one atomic."""
    return {
        "capability_id": cap_id,
        "module": "test",
        "slug": cap_id,
        "status": "live",
        "atomics": [
            {
                "id": "test-atomic-1",
                "name": "Atomic válido de prueba",
                "surface": "FE",
                "added_in_story": story_id,
                "added_date": "2026-05-28",
                "status": "live",
            }
        ],
        "change_log": [
            {
                "story_id": story_id,
                "date": "2026-05-28",
                "type": "new",
                "summary": "Initial",
                "atomics_added": ["test-atomic-1"],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }


def _setup_repo(tmp_path: Path, brand: str = "testbrand") -> tuple[Path, Path]:
    """Create minimal brand structure and return (repo_root, caps_dir)."""
    caps_dir = tmp_path / brand / "docs" / "product" / "capabilities"
    caps_dir.mkdir(parents=True, exist_ok=True)
    return tmp_path, caps_dir


# ---------------------------------------------------------------------------
# Test 1: atomic missing required field
# ---------------------------------------------------------------------------


def test_atomic_missing_required_field(tmp_path: Path) -> None:
    """Atomic without required fields triggers atomic_missing_required_field per field."""
    brand = "vitalia"
    repo, caps_dir = _setup_repo(tmp_path, brand)
    _write_story_checkpoint(repo, brand, "story-aaa")

    cap_data = {
        "capability_id": "test-cap-missing-fields",
        "module": "test",
        "slug": "test-cap-missing-fields",
        "status": "live",
        "atomics": [
            {
                # missing: id, name, surface, added_in_story, added_date, status
                "description": "solo esto"
            }
        ],
        "change_log": [
            {
                "story_id": "story-aaa",
                "date": "2026-05-28",
                "type": "new",
                "atomics_added": ["something"],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }
    _write_cap(caps_dir, "test", "test-cap-missing-fields", cap_data)

    errors = validate_atomics(repo, brand)
    categories = [e.category for e in errors]

    # Should have errors for each missing required field
    assert "atomic_missing_required_field" in categories
    missing_field_errors = [e for e in errors if e.category == "atomic_missing_required_field"]
    # All 6 required fields should be flagged: id, name, surface, added_in_story, added_date, status
    assert len(missing_field_errors) == 6, (
        f"Esperados 6 errores por campos requeridos, got {len(missing_field_errors)}: "
        + str([e.detail for e in missing_field_errors])
    )


# ---------------------------------------------------------------------------
# Test 2: atomic invalid surface
# ---------------------------------------------------------------------------


def test_atomic_invalid_surface(tmp_path: Path) -> None:
    """Atomic with invalid surface enum value triggers atomic_invalid_surface."""
    brand = "vitalia"
    repo, caps_dir = _setup_repo(tmp_path, brand)
    _write_story_checkpoint(repo, brand, "story-bbb")

    cap_data = {
        "capability_id": "test-cap-bad-surface",
        "module": "test",
        "slug": "test-cap-bad-surface",
        "status": "live",
        "atomics": [
            {
                "id": "atomic-1",
                "name": "Atomic con superficie inválida",
                "surface": "MOBILE",  # invalid
                "added_in_story": "story-bbb",
                "added_date": "2026-05-28",
                "status": "live",
            }
        ],
        "change_log": [
            {
                "story_id": "story-bbb",
                "date": "2026-05-28",
                "type": "new",
                "atomics_added": ["atomic-1"],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }
    _write_cap(caps_dir, "test", "test-cap-bad-surface", cap_data)

    errors = validate_atomics(repo, brand)
    categories = [e.category for e in errors]

    assert "atomic_invalid_surface" in categories
    surface_err = next(e for e in errors if e.category == "atomic_invalid_surface")
    assert "MOBILE" in surface_err.detail


# ---------------------------------------------------------------------------
# Test 3: atomic id duplicate
# ---------------------------------------------------------------------------


def test_atomic_id_duplicate(tmp_path: Path) -> None:
    """Two atomics with same id within a cap trigger atomic_id_duplicate."""
    brand = "vitalia"
    repo, caps_dir = _setup_repo(tmp_path, brand)
    _write_story_checkpoint(repo, brand, "story-ccc")

    cap_data = {
        "capability_id": "test-cap-dup-id",
        "module": "test",
        "slug": "test-cap-dup-id",
        "status": "live",
        "atomics": [
            {
                "id": "duplicated-id",
                "name": "Primer atomic",
                "surface": "BE",
                "added_in_story": "story-ccc",
                "added_date": "2026-05-28",
                "status": "live",
            },
            {
                "id": "duplicated-id",  # same as above
                "name": "Segundo atomic con id repetido",
                "surface": "BE",
                "added_in_story": "story-ccc",
                "added_date": "2026-05-28",
                "status": "live",
            },
        ],
        "change_log": [
            {
                "story_id": "story-ccc",
                "date": "2026-05-28",
                "type": "new",
                "atomics_added": ["duplicated-id"],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }
    _write_cap(caps_dir, "test", "test-cap-dup-id", cap_data)

    errors = validate_atomics(repo, brand)
    categories = [e.category for e in errors]

    assert "atomic_id_duplicate" in categories
    dup_err = next(e for e in errors if e.category == "atomic_id_duplicate")
    assert "duplicated-id" in dup_err.detail


# ---------------------------------------------------------------------------
# Test 4: change_log_atomics_required — new type violates
# ---------------------------------------------------------------------------


def test_change_log_atomics_required_new_violates(tmp_path: Path) -> None:
    """cap_change_type=new with empty atomics_added triggers change_log_atomics_required."""
    brand = "vitalia"
    repo, caps_dir = _setup_repo(tmp_path, brand)
    _write_story_checkpoint(repo, brand, "story-new-001")

    cap_data = {
        "capability_id": "test-cap-new-violation",
        "module": "test",
        "slug": "test-cap-new-violation",
        "status": "live",
        "atomics": [],  # no atomics — but type=new requires them
        "change_log": [
            {
                "story_id": "story-new-001",  # NOT a bootstrap story
                "date": "2026-05-28",
                "type": "new",
                "atomics_added": [],  # empty — violation
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }
    _write_cap(caps_dir, "test", "test-cap-new-violation", cap_data)

    errors = validate_atomics(repo, brand)
    categories = [e.category for e in errors]

    assert "change_log_atomics_required" in categories
    err = next(e for e in errors if e.category == "change_log_atomics_required")
    assert "new" in err.detail


# ---------------------------------------------------------------------------
# Test 5: change_log_atomics_required — extend type violates
# ---------------------------------------------------------------------------


def test_change_log_atomics_required_extend_violates(tmp_path: Path) -> None:
    """cap_change_type=extend with empty atomics_added triggers change_log_atomics_required."""
    brand = "vitalia"
    repo, caps_dir = _setup_repo(tmp_path, brand)
    _write_story_checkpoint(repo, brand, "story-base-001")
    _write_story_checkpoint(repo, brand, "story-extend-001")

    cap_data = {
        "capability_id": "test-cap-extend-violation",
        "module": "test",
        "slug": "test-cap-extend-violation",
        "status": "live",
        "atomics": [
            {
                "id": "original-atomic",
                "name": "Atomic original",
                "surface": "BE",
                "added_in_story": "story-base-001",
                "added_date": "2026-05-20",
                "status": "live",
            }
        ],
        "change_log": [
            {
                "story_id": "story-base-001",
                "date": "2026-05-20",
                "type": "new",
                "atomics_added": ["original-atomic"],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            },
            {
                "story_id": "story-extend-001",  # NOT bootstrap
                "date": "2026-05-28",
                "type": "extend",
                "atomics_added": [],  # empty — violation
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            },
        ],
    }
    _write_cap(caps_dir, "test", "test-cap-extend-violation", cap_data)

    errors = validate_atomics(repo, brand)
    categories = [e.category for e in errors]

    assert "change_log_atomics_required" in categories
    err = next(e for e in errors if e.category == "change_log_atomics_required")
    assert "extend" in err.detail


# ---------------------------------------------------------------------------
# Test 6: change_log_atomics_required — fix type passes
# ---------------------------------------------------------------------------


def test_change_log_atomics_required_fix_passes(tmp_path: Path) -> None:
    """cap_change_type=fix with empty atomics_added does NOT trigger change_log_atomics_required."""
    brand = "vitalia"
    repo, caps_dir = _setup_repo(tmp_path, brand)
    _write_story_checkpoint(repo, brand, "story-fix-001")

    cap_data = {
        "capability_id": "test-cap-fix-ok",
        "module": "test",
        "slug": "test-cap-fix-ok",
        "status": "live",
        "atomics": [
            {
                "id": "original-atomic",
                "name": "Atomic original sin cambio",
                "surface": "BE",
                "added_in_story": "story-fix-001",
                "added_date": "2026-05-28",
                "status": "live",
            }
        ],
        "change_log": [
            {
                "story_id": "story-fix-001",
                "date": "2026-05-28",
                "type": "fix",  # fix allows empty atomics_added
                "atomics_added": [],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }
    _write_cap(caps_dir, "test", "test-cap-fix-ok", cap_data)

    errors = validate_atomics(repo, brand)
    categories = [e.category for e in errors]

    assert "change_log_atomics_required" not in categories, (
        f"fix type no debe generar change_log_atomics_required pero got: {categories}"
    )
    # The one surface=FE without verification will produce a warning (not error)
    # Verify only warnings if any
    hard_errors = [e for e in errors if e.severity == "error"]
    assert not hard_errors, f"No se esperaban errors, got: {[(e.category, e.detail) for e in hard_errors]}"


# ---------------------------------------------------------------------------
# Test 7: derive_parent_missing_child
# ---------------------------------------------------------------------------


def test_derive_parent_missing_child(tmp_path: Path) -> None:
    """Child cap with parent_cap not listed in parent's derives_capabilities[] triggers error."""
    brand = "vitalia"
    repo, caps_dir = _setup_repo(tmp_path, brand)
    _write_story_checkpoint(repo, brand, "story-parent-001")
    _write_story_checkpoint(repo, brand, "story-child-001")

    parent_data = {
        "capability_id": "vitalia-test-parent",
        "module": "test",
        "slug": "vitalia-test-parent",
        "status": "live",
        "parent_cap": None,
        "derives_capabilities": [],  # does NOT list the child
        "atomics": [
            {
                "id": "parent-atomic-1",
                "name": "Atomic del padre",
                "surface": "BE",
                "added_in_story": "story-parent-001",
                "added_date": "2026-05-28",
                "status": "live",
            }
        ],
        "change_log": [
            {
                "story_id": "story-parent-001",
                "date": "2026-05-28",
                "type": "new",
                "atomics_added": ["parent-atomic-1"],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }
    child_data = {
        "capability_id": "vitalia-test-child",
        "module": "test",
        "slug": "vitalia-test-child",
        "status": "live",
        "parent_cap": "vitalia-test-parent",  # declares parent
        "derives_capabilities": [],
        "atomics": [
            {
                "id": "child-atomic-1",
                "name": "Atomic derivado del hijo",
                "surface": "BE",
                "added_in_story": "story-child-001",
                "added_date": "2026-05-28",
                "status": "live",
            }
        ],
        "change_log": [
            {
                "story_id": "story-child-001",
                "date": "2026-05-28",
                "type": "derive",
                "atomics_added": ["child-atomic-1"],
                "atomics_modified": [],
                "merge_sha": None,
                "status": "done",
            }
        ],
    }
    _write_cap(caps_dir, "test", "vitalia-test-parent", parent_data)
    _write_cap(caps_dir, "test", "vitalia-test-child", child_data)

    errors = validate_atomics(repo, brand)
    categories = [e.category for e in errors]

    assert "derive_parent_missing_child" in categories, (
        f"Esperado derive_parent_missing_child, got categories: {categories}"
    )
    err = next(e for e in errors if e.category == "derive_parent_missing_child")
    assert "vitalia-test-parent" in err.detail
    assert "vitalia-test-child" in err.detail


# ---------------------------------------------------------------------------
# Test 8: sanity check on real shell-vitalia cap
# ---------------------------------------------------------------------------


def test_validate_atomics_on_real_shell_vitalia_passes(tmp_path: Path) -> None:  # noqa: PT004
    """Sanity check: validate_atomics runs against the real shell-vitalia cap without crashing.

    shell-vitalia is the only cap with atomics populated. We verify:
    - The function returns a list (no exception).
    - No atomic_id_duplicate or atomic_invalid_surface or atomic_invalid_status errors.
    - Only expected categories appear (atomic_missing_required_field for added_date,
      atomic_surface_path_mismatch warnings for verification field absence).
    - No change_log_atomics_required errors (each change_log entry has atomics_added).
    """
    real_repo = Path(__file__).resolve().parents[2]
    brand = "vitalia"

    # Guard: skip gracefully if running outside the real repo tree
    shell_cap = real_repo / brand / "docs" / "product" / "capabilities" / "shell-organism" / "shell-vitalia.yaml"
    if not shell_cap.exists():
        pytest.skip("Real shell-vitalia.yaml not found — running outside repo tree")

    errors = validate_atomics(real_repo, brand)

    # Must return a list without crashing
    assert isinstance(errors, list)

    # No duplicate id errors (all atomic ids are unique in shell-vitalia)
    dup_errors = [e for e in errors if e.category == "atomic_id_duplicate"]
    assert not dup_errors, f"No se esperaban atomic_id_duplicate: {[e.detail for e in dup_errors]}"

    # No invalid surface errors (all are FE — valid)
    surface_errors = [e for e in errors if e.category == "atomic_invalid_surface"]
    assert not surface_errors, f"No se esperaban atomic_invalid_surface: {[e.detail for e in surface_errors]}"

    # No invalid status errors (all are live — valid)
    status_errors = [e for e in errors if e.category == "atomic_invalid_status"]
    assert not status_errors, f"No se esperaban atomic_invalid_status: {[e.detail for e in status_errors]}"

    # No change_log_atomics_required errors for shell-vitalia specifically
    # (each change_log entry in shell-vitalia has non-empty atomics_added).
    # Note: other caps in the brand may have this error (legacy stubs without atomics).
    shell_cl_errors = [
        e for e in errors
        if e.category == "change_log_atomics_required"
        and e.cap_path.name == "shell-vitalia.yaml"
    ]
    assert not shell_cl_errors, (
        f"No se esperaban change_log_atomics_required en shell-vitalia.yaml: "
        f"{[e.detail for e in shell_cl_errors]}"
    )

    # No derive errors for shell-vitalia (parent_cap=null)
    shell_derive_errors = [
        e for e in errors
        if e.category in ("derive_child_no_atomics", "derive_parent_missing_child")
        and e.cap_path.name == "shell-vitalia.yaml"
    ]
    assert not shell_derive_errors, (
        f"No se esperaban derive errors en shell-vitalia.yaml: "
        f"{[e.detail for e in shell_derive_errors]}"
    )

    # Allowed categories at brand level — legacy stub caps are expected to produce
    # change_log_atomics_required + atomic_missing_required_field across the brand.
    categories_found = {}
    for e in errors:
        categories_found[e.category] = categories_found.get(e.category, 0) + 1

    allowed_categories = {
        "atomic_missing_required_field",
        "atomic_surface_path_mismatch",
        "change_log_atomics_required",  # expected: ~63 legacy stub caps
        "derive_child_no_atomics",       # expected: lisa-marca or similar derive caps without atomics
        "derive_parent_missing_child",   # expected: derive child not listed in parent
    }
    unexpected = {c for c in categories_found if c not in allowed_categories}
    assert not unexpected, (
        f"Categorías inesperadas en brand vitalia: {unexpected}. "
        f"Todos los errores encontrados: {categories_found}"
    )
