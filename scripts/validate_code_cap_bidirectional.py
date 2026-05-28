#!/usr/bin/env python3
"""Bidirectional validator code↔cap mapping (Schema v3.2 · cement 2026-05-28).

Cross-checks 4 niveles:

1. **Atomics verification → headers**: archivos en `cap.atomics[*].verification.*_path`
   tienen header `# cap: <cap_id>` (o multi-cap incluyendo). Si header apunta a otro cap → DRIFT.

2. **Headers → atomics referenced**: archivos con header `# atomics: <id1>, <id2>`
   declaran IDs que existen en `cap.atomics[].id` del cap declarado. IDs huérfanos → DRIFT.

3. **Scenarios e2e_test path existence**: `cap.scenarios[*].e2e_test` declarado debe
   existir en filesystem + contener `test(` o `test.describe(`. Missing → HARD pre-push block.

4. **Access roles ↔ runtime decorators (P4)**: roles en `cap.access.entry_points[*].requires_role`
   coinciden con `@require_phi_access(roles=[...])` decorators del código. Mismatch → advisory.

Output:
  `{brand}/docs/product/capabilities/_bidirectional-validation.json` (gitignored R3 v2)

Usage:
  python3 scripts/validate_code_cap_bidirectional.py --brand vitalia
  python3 scripts/validate_code_cap_bidirectional.py --brand vitalia --strict --hard-checks 1,3
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

# Same regex as generate_code_to_cap_index
HEADER_PY_CAP = re.compile(r"^\s*#\s*cap:\s*(.+?)\s*$", re.MULTILINE)
HEADER_TS_CAP = re.compile(r"^\s*//\s*cap:\s*(.+?)\s*$", re.MULTILINE)
HEADER_PY_ATOM = re.compile(r"^\s*#\s*atomics:\s*(.+?)\s*$", re.MULTILINE)
HEADER_TS_ATOM = re.compile(r"^\s*//\s*atomics:\s*(.+?)\s*$", re.MULTILINE)

# Decorator detection patterns for cross-check 4
DECORATOR_RE = re.compile(
    r"@require_phi_access\s*\(\s*roles\s*=\s*\[([^\]]*)\]\s*\)",
    re.MULTILINE,
)

E2E_TEST_PATTERNS = ("test(", "test.describe(")


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
# Header parsing helper
# ---------------------------------------------------------------------------


def parse_cap_list(raw: str) -> list[str]:
    raw = raw.strip()
    if not raw:
        return []
    if raw in {"__orphan__", "__shared__", "__skip__", "TBD"}:
        return [raw]
    if raw.startswith("[") and raw.endswith("]"):
        inner = raw[1:-1]
        return [c.strip() for c in inner.split(",") if c.strip()]
    return [raw]


def parse_atomics_list(raw: str) -> list[str]:
    raw = raw.strip()
    if not raw or raw == "TBD":
        return []
    if raw.startswith("[") and raw.endswith("]"):
        raw = raw[1:-1]
    return [a.strip() for a in raw.split(",") if a.strip()]


def get_header_info(path: Path) -> tuple[list[str], list[str]]:
    """Returns (caps, atomics) declared in file header."""
    try:
        with path.open(encoding="utf-8") as fh:
            head = "".join(fh.readline() for _ in range(20))
    except (OSError, UnicodeDecodeError):
        return [], []

    is_py = path.suffix == ".py"
    cap_re = HEADER_PY_CAP if is_py else HEADER_TS_CAP
    atom_re = HEADER_PY_ATOM if is_py else HEADER_TS_ATOM

    cap_match = cap_re.search(head)
    atoms_match = atom_re.search(head)

    caps = parse_cap_list(cap_match.group(1)) if cap_match else []
    atoms = parse_atomics_list(atoms_match.group(1)) if atoms_match else []
    return caps, atoms


# ---------------------------------------------------------------------------
# Cross-check 1 — Atomics verification → headers
# ---------------------------------------------------------------------------


def cross_check_1(
    caps: dict[str, dict],
    workspace_root: Path,
) -> dict[str, Any]:
    """For each cap.atomics[*].verification.*_path declared, verify header matches."""
    results: list[dict] = []
    total = 0
    passing = 0
    drift = 0

    for cap_id, cap_data in caps.items():
        atomics = cap_data.get("atomics") or []
        for atomic in atomics:
            if not isinstance(atomic, dict):
                continue
            verif = atomic.get("verification") or {}
            if not isinstance(verif, dict):
                continue
            atomic_id = atomic.get("id", "<unknown>")

            for field in ("fe_path", "be_path", "agentic_path"):
                declared_path = verif.get(field)
                if not declared_path:
                    continue
                total += 1
                full_path = workspace_root / declared_path
                if not full_path.exists():
                    # cross_check_3 catches missing files for e2e. Here it's also drift.
                    drift += 1
                    results.append(
                        {
                            "cap_id": cap_id,
                            "atomic_id": atomic_id,
                            "field": field,
                            "declared_path": declared_path,
                            "status": "missing_file",
                            "drift_reason": f"verification.{field} path doesn't exist",
                        }
                    )
                    continue

                # Read header
                header_caps, _ = get_header_info(full_path)
                if not header_caps:
                    drift += 1
                    results.append(
                        {
                            "cap_id": cap_id,
                            "atomic_id": atomic_id,
                            "field": field,
                            "declared_path": declared_path,
                            "status": "missing_header",
                            "drift_reason": f"file has no `# cap:` header",
                        }
                    )
                    continue

                # Header contains this cap_id?
                if cap_id in header_caps or "__shared__" in header_caps:
                    passing += 1
                else:
                    drift += 1
                    results.append(
                        {
                            "cap_id": cap_id,
                            "atomic_id": atomic_id,
                            "field": field,
                            "declared_path": declared_path,
                            "status": "header_mismatch",
                            "header_caps": header_caps,
                            "drift_reason": (
                                f"cap declares this atomic but file header points to "
                                f"{header_caps} instead of {cap_id}"
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
# Cross-check 2 — Headers → atomics referenced
# ---------------------------------------------------------------------------


def cross_check_2(
    caps: dict[str, dict],
    workspace_root: Path,
    brand: str,
) -> dict[str, Any]:
    """For each file with header `# atomics: <ids>`, verify IDs exist in cap.atomics[]."""
    results: list[dict] = []
    total = 0
    passing = 0
    drift = 0

    # Build cap → atomics IDs map
    cap_atomic_ids: dict[str, set[str]] = {}
    for cap_id, cap_data in caps.items():
        atomics_arr = cap_data.get("atomics") or []
        ids: set[str] = set()
        for atomic in atomics_arr:
            if isinstance(atomic, dict) and "id" in atomic:
                ids.add(atomic["id"])
        cap_atomic_ids[cap_id] = ids

    # Scan code files
    be_root = workspace_root / brand / "backend" / "src"
    fe_root = workspace_root / brand / "frontend" / "src"

    scan_paths: list[Path] = []
    if be_root.exists():
        scan_paths.extend(p for p in be_root.rglob("*.py") if "__pycache__" not in p.parts)
    if fe_root.exists():
        for ext in ("*.ts", "*.tsx"):
            for p in fe_root.rglob(ext):
                if any(part in {"__tests__"} for part in p.parts):
                    continue
                if p.name.endswith((".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx")):
                    continue
                scan_paths.append(p)

    for path in scan_paths:
        header_caps, header_atomics = get_header_info(path)
        if not header_caps or not header_atomics:
            continue
        # Skip special markers
        if all(c in {"__orphan__", "__shared__", "__skip__"} for c in header_caps):
            continue

        rel = str(path.relative_to(workspace_root))
        for atomic_id in header_atomics:
            total += 1
            # Check atomic_id exists in any of declared caps
            found = False
            for cap_id in header_caps:
                if cap_id in cap_atomic_ids and atomic_id in cap_atomic_ids[cap_id]:
                    found = True
                    break
            if found:
                passing += 1
            else:
                drift += 1
                results.append(
                    {
                        "file": rel,
                        "header_caps": header_caps,
                        "orphan_atomic_id": atomic_id,
                        "status": "atomic_id_not_in_cap",
                        "drift_reason": f"atomic '{atomic_id}' not found in declared caps {header_caps}",
                    }
                )

    return {
        "total": total,
        "pass": passing,
        "drift": drift,
        "details": results,
    }


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
                        "drift_reason": f"e2e_test path doesn't exist",
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
                        "drift_reason": "file exists but contains no 'test(' or 'test.describe('",
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


def cross_check_4(
    caps: dict[str, dict],
    workspace_root: Path,
    brand: str,
) -> dict[str, Any]:
    """For each cap.access.entry_points[*].requires_role, cross-check decorator in code.

    Sources for related files (in priority order):
      1. cap.atomics[*].verification.{fe_path, be_path} (declared)
      2. `_code-index.json` cap_to_files (headers `# cap: <cap_id>`)
    """
    results: list[dict] = []
    total = 0
    passing = 0
    drift = 0

    # Pre-load code index if exists (cap → files via headers)
    code_index_path = (
        workspace_root / brand / "docs" / "product" / "capabilities" / "_code-index.json"
    )
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

        # Get files associated with this cap (via cap.atomics verification paths OR code-index)
        related_files: set[str] = set()
        for atomic in cap_data.get("atomics") or []:
            if not isinstance(atomic, dict):
                continue
            verif = atomic.get("verification") or {}
            if not isinstance(verif, dict):
                continue
            for field in ("be_path", "fe_path"):
                p = verif.get(field)
                if p:
                    related_files.add(p)

        # Augment with code-index headers (more comprehensive · headers were applied Fase A)
        for f in code_index.get(cap_id, []):
            related_files.add(f)

        for entry in entry_points:
            if not isinstance(entry, dict):
                continue
            declared_roles = set(entry.get("requires_role") or [])
            entry_type = entry.get("entry_type", "ui")
            path = entry.get("path", "")

            if not declared_roles:
                # No roles declared, no cross-check needed
                continue

            total += 1

            # Look for decorator in any related backend file
            runtime_roles: set[str] = set()
            for rel_file in related_files:
                full = workspace_root / rel_file
                if not full.exists() or full.suffix != ".py":
                    continue
                try:
                    content = full.read_text(encoding="utf-8")
                except OSError:
                    continue
                for match in DECORATOR_RE.finditer(content):
                    raw_roles = match.group(1)
                    for r in re.findall(r"['\"](\w+)['\"]", raw_roles):
                        runtime_roles.add(r)

            if not runtime_roles:
                # No decorator found · only advisory if entry_type=api (BE)
                if entry_type == "api":
                    drift += 1
                    results.append(
                        {
                            "cap_id": cap_id,
                            "path": path,
                            "entry_type": entry_type,
                            "declared_roles": sorted(declared_roles),
                            "runtime_roles": [],
                            "status": "no_decorator_found",
                            "drift_reason": "cap declares requires_role but no @require_phi_access decorator in associated code",
                        }
                    )
                else:
                    # UI entry — not all routes have decorators (some Clerk middleware level)
                    passing += 1
                continue

            if declared_roles == runtime_roles:
                passing += 1
            else:
                drift += 1
                results.append(
                    {
                        "cap_id": cap_id,
                        "path": path,
                        "entry_type": entry_type,
                        "declared_roles": sorted(declared_roles),
                        "runtime_roles": sorted(runtime_roles),
                        "status": "role_mismatch",
                        "drift_reason": (
                            f"cap declares roles {sorted(declared_roles)} but runtime "
                            f"decorator declares {sorted(runtime_roles)}"
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
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bidirectional code↔cap validator (v3.2 cement 2026-05-28)"
    )
    parser.add_argument("--brand", required=True)
    parser.add_argument("--out", default=None)
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 if any cross-check has drift > 0",
    )
    parser.add_argument(
        "--hard-checks",
        default="1,3",
        help="Cross-checks to enforce HARD (comma-separated 1-4). Default: 1,3",
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
        else workspace_root
        / args.brand
        / "docs"
        / "product"
        / "capabilities"
        / "_bidirectional-validation.json"
    )

    if args.verbose:
        print(f"Workspace : {workspace_root}")
        print(f"Brand     : {args.brand}")
        print(f"Hard      : {args.hard_checks}")
        print()

    caps = load_capabilities(args.brand, workspace_root)
    print(f"Loaded {len(caps)} caps from {args.brand}")

    print("Running cross-check 1 (atomics → headers)...")
    cc1 = cross_check_1(caps, workspace_root)
    print(f"  total={cc1['total']} pass={cc1['pass']} drift={cc1['drift']}")

    print("Running cross-check 2 (headers → atomics)...")
    cc2 = cross_check_2(caps, workspace_root, args.brand)
    print(f"  total={cc2['total']} pass={cc2['pass']} drift={cc2['drift']}")

    print("Running cross-check 3 (scenarios e2e_test paths)...")
    cc3 = cross_check_3(caps, workspace_root)
    print(f"  total={cc3['total']} pass={cc3['pass']} drift={cc3['drift']}")

    print("Running cross-check 4 (access roles ↔ decorators)...")
    cc4 = cross_check_4(caps, workspace_root, args.brand)
    print(f"  total={cc4['total']} pass={cc4['pass']} drift={cc4['drift']}")

    drift_total = cc1["drift"] + cc2["drift"] + cc3["drift"] + cc4["drift"]
    hard_set = {int(c) for c in args.hard_checks.split(",") if c.strip()}
    hard_drift = sum(
        cc["drift"] for i, cc in [(1, cc1), (2, cc2), (3, cc3), (4, cc4)] if i in hard_set
    )

    verdict = "CLEAN" if drift_total == 0 else ("HARD_FAIL" if hard_drift > 0 else "SOFT_DRIFT")

    now_iso = datetime.now(tz=timezone.utc).astimezone().isoformat(timespec="seconds")
    output: dict[str, Any] = {
        "validated_at": now_iso,
        "brand": args.brand,
        "schema_version": "v3.2",
        "hard_checks": sorted(hard_set),
        "cross_check_1": cc1,
        "cross_check_2": cc2,
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
