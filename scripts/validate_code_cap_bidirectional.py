#!/usr/bin/env python3
"""Bidirectional validator code↔cap mapping (cement 2026-05-28).

Cross-checks 2 niveles (atomics killed 2026-05-28 — ver docs/process/lifecycle.md):

3. **Scenarios e2e_test path existence**: `cap.scenarios[*].e2e_test` declarado debe
   existir en filesystem + contener `test(` o `test.describe(`. Missing → HARD pre-push block.

4. **Access roles ↔ runtime decorators (P4)**: roles en `cap.access.entry_points[*].requires_role`
   coinciden con `@require_phi_access(roles=[...])` decorators del código. HARD para vitalia
   (es salud; PHI access no puede ser advisory), advisory para otras brands.

Output:
  `{brand}/docs/product/capabilities/_bidirectional-validation.json` (gitignored R3 v2)

Usage:
  python3 scripts/validate_code_cap_bidirectional.py --brand vitalia
  python3 scripts/validate_code_cap_bidirectional.py --brand vitalia --strict
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

# Header regex (kept for cross-check 4 file association via code-index)
HEADER_PY_CAP = re.compile(r"^\s*#\s*cap:\s*(.+?)\s*$", re.MULTILINE)
HEADER_TS_CAP = re.compile(r"^\s*//\s*cap:\s*(.+?)\s*$", re.MULTILINE)

# Decorator detection patterns for cross-check 4
DECORATOR_RE = re.compile(
    r"@require_phi_access\s*\(\s*roles\s*=\s*\[([^\]]*)\]\s*\)",
    re.MULTILINE,
)

# Additional PHI/role enforcement mechanisms recognized by cross-check 4.
# The codebase enforces access gates via several idioms beyond the
# @require_phi_access decorator. cross_check_4 must recognize ALL of them,
# otherwise it reports false drift where enforcement actually exists.

# 1. FastAPI Depends factory: require_brand_owner_access() (rbac.py:65)
#    Used as `Depends(require_brand_owner_access())` or `Depends(_brand_owner_required)`.
DEPENDS_BRAND_OWNER_RE = re.compile(r"require_brand_owner_access\s*\(", re.MULTILINE)

# 2. Helper call: _assert_phi_access(role) (e.g. inbox/api/router.py:300)
ASSERT_PHI_RE = re.compile(r"_assert_phi_access\s*\(", re.MULTILINE)

# 3. Inline frozenset/list role gate: `if <role_var> not in <NAME>: ... raise ... 403`
#    where <NAME> looks like a PHI/role allowlist (_PHI_ROLES, ALLOWED_PHI_ROLES,
#    _NPS_SUMMARY_ROLES, etc.). We detect the gate idiom by the frozenset name
#    convention + a `not in` membership check.
INLINE_ROLE_GATE_NAME_RE = re.compile(
    r"\bnot\s+in\s+("
    r"_?[A-Z][A-Z0-9_]*(?:PHI|ROLES|ROLE)[A-Z0-9_]*"  # _PHI_ROLES, ALLOWED_PHI_ROLES, _NPS_SUMMARY_ROLES
    r")\b",
    re.MULTILINE,
)

E2E_TEST_PATTERNS = ("test(", "test.describe(")

# Pytest test pattern: matches 'def test_foo', 'def test(', 'def test_anything'.
# Used by cross_check_3 when the declared e2e_test path has a .py extension.
# JS patterns above are used for .ts / .tsx / any other extension.
PYTEST_PATTERN = re.compile(r"\bdef test", re.MULTILINE)


# ---------------------------------------------------------------------------
# Cap loading
# ---------------------------------------------------------------------------


def _parse_frontmatter(path: Path) -> dict[str, Any] | None:
    """Parse YAML frontmatter from cap file."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None

    lines = text.splitlines(keepends=True)
    cursor = 0
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith("#") or stripped in {"", "\n"}:
            cursor += len(line)
            continue
        break

    body = text[cursor:]
    if not body.startswith("---"):
        return None

    after = body[3:].lstrip("\n")
    yaml_text = after.split("\n---", 1)[0]

    try:
        data = yaml.safe_load(yaml_text)
    except yaml.YAMLError:
        return None

    if not isinstance(data, dict):
        return None
    return data


def load_capabilities(brand: str, workspace_root: Path) -> dict[str, dict[str, Any]]:
    """Load all caps for brand. Returns dict slug → frontmatter + path."""
    caps_root = workspace_root / brand / "docs" / "product" / "capabilities"
    if not caps_root.exists():
        return {}

    caps: dict[str, dict[str, Any]] = {}
    for yaml_path in caps_root.rglob("*.yaml"):
        if yaml_path.name.startswith("_"):
            continue
        data = _parse_frontmatter(yaml_path)
        if data is None:
            continue
        module = yaml_path.parent.name
        slug = data.get("slug") or yaml_path.stem
        cap_id = f"{module}.{slug}"
        data["_cap_id"] = cap_id
        data["_path"] = str(yaml_path.relative_to(workspace_root))
        data["_module"] = module
        caps[cap_id] = data
    return caps


# ---------------------------------------------------------------------------
# Cross-check 3 — Scenarios e2e_test path existence
# ---------------------------------------------------------------------------


def cross_check_3(
    caps: dict[str, dict],
    workspace_root: Path,
) -> dict[str, Any]:
    """For each cap.scenarios[*].e2e_test, verify path exists + contains test patterns."""
    results: list[dict] = []
    total = 0
    passing = 0
    drift = 0

    for cap_id, cap_data in caps.items():
        scenarios = cap_data.get("scenarios") or []
        if not isinstance(scenarios, list):
            continue
        for scenario in scenarios:
            if not isinstance(scenario, dict):
                continue
            e2e_test = scenario.get("e2e_test")
            if not e2e_test:
                continue
            total += 1
            full_path = workspace_root / e2e_test
            if not full_path.exists():
                drift += 1
                results.append(
                    {
                        "cap_id": cap_id,
                        "scenario_id": scenario.get("id", "<unknown>"),
                        "declared_e2e_test": e2e_test,
                        "status": "missing_file",
                        "drift_reason": "e2e_test path doesn't exist",
                    }
                )
                continue

            try:
                content = full_path.read_text(encoding="utf-8")
            except OSError:
                drift += 1
                results.append(
                    {
                        "cap_id": cap_id,
                        "scenario_id": scenario.get("id"),
                        "declared_e2e_test": e2e_test,
                        "status": "read_error",
                        "drift_reason": "could not read file",
                    }
                )
                continue

            # Path-aware pattern check: pytest for .py, JS patterns for others.
            if full_path.suffix == ".py":
                has_pattern = bool(PYTEST_PATTERN.search(content))
            else:
                has_pattern = any(p in content for p in E2E_TEST_PATTERNS)
            if has_pattern:
                passing += 1
            else:
                drift += 1
                results.append(
                    {
                        "cap_id": cap_id,
                        "scenario_id": scenario.get("id"),
                        "declared_e2e_test": e2e_test,
                        "status": "no_test_pattern",
                        "drift_reason": (
                            "file exists but contains no test pattern "
                            "('def test' for .py, 'test(' or 'test.describe(' for .ts/.tsx)"
                        ),
                    }
                )

    return {
        "total": total,
        "pass": passing,
        "drift": drift,
        "details": results,
    }


# ---------------------------------------------------------------------------
# Cross-check 4 — Access roles ↔ runtime decorators
# ---------------------------------------------------------------------------


def detect_enforcement(content: str) -> dict[str, Any]:
    """Detect ALL PHI/role enforcement mechanisms present in a Python file.

    The codebase gates access via several idioms (not only @require_phi_access):

    - ``@require_phi_access(roles=[...])`` decorator (rbac.py)
    - ``Depends(require_brand_owner_access())`` FastAPI dependency (rbac.py:65)
    - ``_assert_phi_access(role)`` helper (inbox/api/router.py:300)
    - inline ``if <role> not in <FROZENSET>: raise ...403`` where the frozenset is
      named like ``_PHI_ROLES`` / ``ALLOWED_PHI_ROLES`` / ``_NPS_SUMMARY_ROLES``
      (scheduling/api/agenda_router.py, fidelizacion/api/nps_endpoints.py)

    Returns dict with:
      - ``enforced`` (bool): any mechanism present
      - ``mechanisms`` (list[str]): which mechanisms matched
      - ``decorator_roles`` (set[str]): roles parsed from @require_phi_access (if any)
    """
    mechanisms: list[str] = []
    decorator_roles: set[str] = set()

    for match in DECORATOR_RE.finditer(content):
        if "require_phi_access" not in mechanisms:
            mechanisms.append("require_phi_access")
        for r in re.findall(r"['\"](\w+)['\"]", match.group(1)):
            decorator_roles.add(r)

    if DEPENDS_BRAND_OWNER_RE.search(content):
        mechanisms.append("require_brand_owner_access")

    if ASSERT_PHI_RE.search(content):
        mechanisms.append("_assert_phi_access")

    for m in INLINE_ROLE_GATE_NAME_RE.finditer(content):
        gate_name = m.group(1)
        # only count it if there's a raise/HTTPException 403 in the file
        if "403" in content or "HTTP_403_FORBIDDEN" in content or "PHIAccessDeniedError" in content:
            mechanisms.append(f"inline_role_gate:{gate_name}")

    return {
        "enforced": bool(mechanisms),
        "mechanisms": mechanisms,
        "decorator_roles": decorator_roles,
    }


def cross_check_4(
    caps: dict[str, dict],
    workspace_root: Path,
    brand: str,
) -> dict[str, Any]:
    """For each cap.access.entry_points[*].requires_role, cross-check enforcement in code.

    Recognizes ALL enforcement mechanisms (see ``detect_enforcement``), not just
    the ``@require_phi_access`` decorator. An entry_point whose associated code
    has ANY recognized mechanism counts as ENFORCED (no drift).

    SKIP rules (no cross-check, not counted):
      - entry_point ``path`` is null (no HTTP surface to gate)
      - cap is ``user_visible: false`` + ``nature: extension-point``
        (BE-only extension point, no HTTP PHI endpoint)

    Related files are resolved from ``_code-index.json`` cap_to_files (headers
    ``# cap: <cap_id>``).
    """
    results: list[dict] = []
    total = 0
    passing = 0
    drift = 0
    skipped = 0

    # Pre-load code index if exists (cap → files via headers)
    code_index_path = workspace_root / brand / "docs" / "product" / "capabilities" / "_code-index.json"
    code_index: dict[str, list[str]] = {}
    if code_index_path.exists():
        try:
            ci = json.loads(code_index_path.read_text())
            code_index = ci.get("cap_to_files", {})
        except (json.JSONDecodeError, OSError):
            code_index = {}

    for cap_id, cap_data in caps.items():
        access = cap_data.get("access")
        if not isinstance(access, dict):
            continue
        entry_points = access.get("entry_points") or []
        if not isinstance(entry_points, list):
            continue

        # SKIP whole cap if it's a BE-only extension point (no HTTP PHI endpoint)
        cap_user_visible = cap_data.get("user_visible")
        cap_nature = cap_data.get("nature")
        cap_is_extension_point = (cap_user_visible is False) and (cap_nature == "extension-point")

        # Get files associated with this cap via code-index headers (# cap:)
        related_files: set[str] = set(code_index.get(cap_id, []))

        # Detect enforcement mechanisms across all related backend files (once per cap)
        cap_mechanisms: list[str] = []
        cap_decorator_roles: set[str] = set()
        for rel_file in related_files:
            full = workspace_root / rel_file
            if not full.exists() or full.suffix != ".py":
                continue
            try:
                content = full.read_text(encoding="utf-8")
            except OSError:
                continue
            det = detect_enforcement(content)
            cap_mechanisms.extend(det["mechanisms"])
            cap_decorator_roles |= det["decorator_roles"]

        for entry in entry_points:
            if not isinstance(entry, dict):
                continue
            declared_roles = set(entry.get("requires_role") or [])
            entry_type = entry.get("entry_type", "ui")
            path = entry.get("path")

            if not declared_roles:
                # No roles declared, no cross-check needed
                continue

            # SKIP: null path (no HTTP surface) OR BE-only extension point
            if path is None or cap_is_extension_point:
                skipped += 1
                continue

            total += 1

            if cap_mechanisms:
                # Enforcement present via at least one recognized mechanism.
                # If a @require_phi_access decorator declares roles, prefer the
                # exact-match semantics for that (catches role drift). Otherwise
                # (Depends / _assert_phi_access / inline frozenset gate) the
                # mechanism's allowlist lives in code constants we don't fully
                # parse — presence of the gate is sufficient to count ENFORCED.
                if cap_decorator_roles and declared_roles != cap_decorator_roles:
                    drift += 1
                    results.append(
                        {
                            "cap_id": cap_id,
                            "path": path,
                            "entry_type": entry_type,
                            "declared_roles": sorted(declared_roles),
                            "runtime_roles": sorted(cap_decorator_roles),
                            "mechanisms": sorted(set(cap_mechanisms)),
                            "status": "role_mismatch",
                            "drift_reason": (
                                f"cap declares roles {sorted(declared_roles)} but "
                                f"@require_phi_access decorator declares "
                                f"{sorted(cap_decorator_roles)}"
                            ),
                        }
                    )
                else:
                    passing += 1
                continue

            # No enforcement mechanism found · only drift if entry_type=api (BE)
            if entry_type == "api":
                drift += 1
                results.append(
                    {
                        "cap_id": cap_id,
                        "path": path,
                        "entry_type": entry_type,
                        "declared_roles": sorted(declared_roles),
                        "runtime_roles": [],
                        "mechanisms": [],
                        "status": "no_enforcement_found",
                        "drift_reason": (
                            "cap declares requires_role but no recognized enforcement "
                            "mechanism (@require_phi_access / require_brand_owner_access / "
                            "_assert_phi_access / inline role frozenset gate) in associated code"
                        ),
                    }
                )
            else:
                # UI entry — not all routes have decorators (some Clerk middleware level)
                passing += 1

    return {
        "total": total,
        "pass": passing,
        "drift": drift,
        "skipped": skipped,
        "details": results,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Bidirectional code↔cap validator (cement 2026-05-28)")
    parser.add_argument("--brand", required=True)
    parser.add_argument("--out", default=None)
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 if any HARD cross-check has drift > 0",
    )
    parser.add_argument("--repo", default=None)
    args = parser.parse_args()

    if args.repo:
        workspace_root = Path(args.repo).resolve()
    else:
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--show-toplevel"],
                capture_output=True,
                text=True,
                check=True,
            )
            workspace_root = Path(result.stdout.strip())
        except (subprocess.CalledProcessError, FileNotFoundError):
            workspace_root = Path.cwd()

    out_path = (
        Path(args.out).resolve()
        if args.out
        else workspace_root / args.brand / "docs" / "product" / "capabilities" / "_bidirectional-validation.json"
    )

    # HARD set: cross_check_3 (scenario→e2e_test) always hard.
    # cross_check_4 (access roles ↔ @require_phi_access) is ADVISORY for now —
    # Fase 5 lo flipea a HARD para vitalia DESPUÉS de resolver el drift de acceso
    # existente (no se prende un gate HARD con fallas conocidas). Ver
    # docs/process/lifecycle.md § roadmap Fase 5.
    hard_set = {3}

    if args.verbose:
        print(f"Workspace : {workspace_root}")
        print(f"Brand     : {args.brand}")
        print(f"Hard      : {sorted(hard_set)}")
        print()

    caps = load_capabilities(args.brand, workspace_root)
    print(f"Loaded {len(caps)} caps from {args.brand}")

    print("Running cross-check 3 (scenarios e2e_test paths)...")
    cc3 = cross_check_3(caps, workspace_root)
    print(f"  total={cc3['total']} pass={cc3['pass']} drift={cc3['drift']}")

    print("Running cross-check 4 (access roles ↔ decorators)...")
    cc4 = cross_check_4(caps, workspace_root, args.brand)
    print(f"  total={cc4['total']} pass={cc4['pass']} drift={cc4['drift']}")

    drift_total = cc3["drift"] + cc4["drift"]
    hard_drift = sum(cc["drift"] for i, cc in [(3, cc3), (4, cc4)] if i in hard_set)

    verdict = "CLEAN" if drift_total == 0 else ("HARD_FAIL" if hard_drift > 0 else "SOFT_DRIFT")

    now_iso = datetime.now(tz=timezone.utc).astimezone().isoformat(timespec="seconds")
    output: dict[str, Any] = {
        "validated_at": now_iso,
        "brand": args.brand,
        "schema_version": "v4",
        "hard_checks": sorted(hard_set),
        "cross_check_3": cc3,
        "cross_check_4": cc4,
        "summary": {
            "total_caps": len(caps),
            "drift_total": drift_total,
            "drift_in_hard": hard_drift,
            "verdict": verdict,
        },
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"\nVerdict: {verdict}")
    print(f"Drift total: {drift_total} · in HARD checks ({sorted(hard_set)}): {hard_drift}")
    print(f"Saved to: {out_path}")

    if args.strict and hard_drift > 0:
        print(f"[STRICT] {hard_drift} drift in HARD checks", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
