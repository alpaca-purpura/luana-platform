#!/usr/bin/env python3
"""Compute derived capability status from YAML atomics state-machine.

Produces ``{brand}/docs/product/capabilities/_status-computed.json``
(gitignored R3 v2) with a computed_status badge per capability, atomic
counters, surface distribution and drift reasons.

State-machine (§ B _cap-verification-decisions.md):
  verified-live   declared=live + ≥1 atomic live + verification paths all exist
  declared-live   declared=live + ≥1 atomic live BUT verification absent/paths missing
  partial         declared=live + mix of live + wip atomics
  wip             declared=beta OR all atomics wip
  stub            atomics[] empty (independent of declared)
  drift           declared=live + (all atomics wip OR verification paths missing)
  deprecated      declared=deprecated
  sunset          declared=sunset

Usage:
  python3 scripts/compute_capability_status.py --brand vitalia [--out PATH] [--verbose] [--strict]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

# Valid surface enum values for atomics
VALID_SURFACES = {"FE", "BE", "AGENTIC", "FE+BE", "FE+BE+AGENTIC", "DOCS", "INFRA"}

# Valid declared status values from cap YAML frontmatter
VALID_DECLARED = {"live", "beta", "deprecated", "sunset", "planned"}

# Verification path fields inside atomic.verification block
VERIFICATION_PATH_FIELDS = ("fe_path", "be_path", "agentic_path", "e2e_test")


def _parse_frontmatter(path: Path) -> dict[str, Any] | None:
    """Parse YAML frontmatter from a capability file.

    Supports ``---\\n<yaml>\\n---`` (markdown style) and bare YAML.
    Returns None and logs a warning on parse error.
    """
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"  [WARN] No se pudo leer {path}: {exc}", file=sys.stderr)
        return None

    # Strip leading comment/blank lines to reach first '---'
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
        print(f"  [WARN] Sin frontmatter YAML en {path} — omitido", file=sys.stderr)
        return None

    after = body[3:].lstrip("\n")
    yaml_text = after.split("\n---", 1)[0]

    try:
        data = yaml.safe_load(yaml_text)
    except yaml.YAMLError as exc:
        print(f"  [WARN] YAML malformado en {path}: {exc}", file=sys.stderr)
        return None

    if not isinstance(data, dict):
        print(f"  [WARN] Frontmatter no es mapping en {path} — omitido", file=sys.stderr)
        return None

    return data


def _check_verification_paths(atomic: dict[str, Any], workspace_root: Path) -> tuple[int, int, list[str]]:
    """Return (verification_total, verification_pass, drift_reasons) for one atomic.

    verification_total = count of non-null path fields declared in atomic.verification.
    verification_pass  = count of those paths that actually exist on the filesystem.
    drift_reasons      = explanations for paths that are declared but missing.
    """
    verification = atomic.get("verification")
    atomic_id = atomic.get("id", "<sin-id>")
    total = 0
    passing = 0
    reasons: list[str] = []

    if not isinstance(verification, dict):
        return 0, 0, []

    for field in VERIFICATION_PATH_FIELDS:
        value = verification.get(field)
        if value is None:
            continue
        total += 1
        full_path = workspace_root / value
        if full_path.exists():
            passing += 1
        else:
            reasons.append(
                f"atomic '{atomic_id}' verification.{field}='{value}' no existe en filesystem"
            )

    return total, passing, reasons


def _compute_atomics_per_surface(atomics: list[dict[str, Any]]) -> dict[str, int]:
    """Count atomics by surface enum.

    Returns a dict of surface_key → count. Unknown surfaces go under 'invalid'.
    """
    counter: dict[str, int] = {}
    for atomic in atomics:
        raw_surface = atomic.get("surface", "")
        if isinstance(raw_surface, str):
            surface = raw_surface.strip()
        else:
            surface = str(raw_surface).strip()

        if surface in VALID_SURFACES:
            key = surface
        else:
            key = "invalid"

        counter[key] = counter.get(key, 0) + 1

    return counter


def _compute_status(
    declared: str,
    atomics: list[dict[str, Any]],
    workspace_root: Path,
    cap_slug: str,
) -> tuple[str, dict[str, Any]]:
    """Apply state-machine and return (computed_status, metrics_dict).

    metrics_dict keys:
      atomics_total, atomics_live, atomics_wip,
      atomics_per_surface, verification_total, verification_pass,
      drift_reasons
    """
    drift_reasons: list[str] = []

    # -- stub: empty atomics list (independent of declared) --
    if not atomics:
        return "stub", {
            "atomics_total": 0,
            "atomics_live": 0,
            "atomics_wip": 0,
            "atomics_per_surface": {},
            "verification_total": 0,
            "verification_pass": 0,
            "drift_reasons": [],
        }

    # -- deprecated / sunset passthrough --
    if declared == "deprecated":
        return "deprecated", _build_metrics(atomics, workspace_root, [])
    if declared == "sunset":
        return "sunset", _build_metrics(atomics, workspace_root, [])

    # -- Normalise atomics, counting live/wip; collect per-atomic verification stats --
    atomics_live = 0
    atomics_wip = 0
    ver_total_all = 0
    ver_pass_all = 0
    atomic_drift: list[str] = []

    for atomic in atomics:
        if not isinstance(atomic, dict):
            atomics_wip += 1
            atomic_drift.append(f"atomic con shape inválido (no es mapping): {atomic!r:.80s}")
            continue

        status_val = atomic.get("status", "live")
        if status_val == "live":
            atomics_live += 1
        elif status_val == "deprecated":
            # deprecated atomics count as live for presence purposes but are noted
            atomics_live += 1
        else:
            atomics_wip += 1

        # surface validation
        raw_surface = atomic.get("surface", "")
        surface = str(raw_surface).strip() if raw_surface else ""
        if surface not in VALID_SURFACES:
            atomic_drift.append(
                f"atomic '{atomic.get('id', '?')}' surface='{surface}' no es valor enum válido"
            )

        vt, vp, vdrift = _check_verification_paths(atomic, workspace_root)
        ver_total_all += vt
        ver_pass_all += vp
        atomic_drift.extend(vdrift)

    atomics_total = atomics_live + atomics_wip
    has_live = atomics_live > 0
    all_wip = atomics_live == 0 and atomics_wip > 0
    mixed = has_live and atomics_wip > 0

    metrics = {
        "atomics_total": atomics_total,
        "atomics_live": atomics_live,
        "atomics_wip": atomics_wip,
        "atomics_per_surface": _compute_atomics_per_surface(atomics),
        "verification_total": ver_total_all,
        "verification_pass": ver_pass_all,
        "drift_reasons": [],
    }

    # -- State-machine --
    if declared == "beta" or (not has_live and not all_wip):
        # wip: declared=beta OR no atomics classify as live
        metrics["drift_reasons"] = atomic_drift
        return "wip", metrics

    if all_wip:
        # drift: declared=live but ALL atomics are wip
        atomic_drift.append(
            f"cap declara status=live pero todos sus {atomics_wip} atomics son wip"
        )
        metrics["drift_reasons"] = atomic_drift
        return "drift", metrics

    # has_live is True at this point
    if declared == "live":
        if mixed:
            metrics["drift_reasons"] = atomic_drift
            return "partial", metrics

        # All atomics live — check verification
        if ver_total_all == 0:
            # No verification data at all
            atomic_drift.append(
                f"verification ausente en todos los {atomics_live} atomics"
            )
            metrics["drift_reasons"] = atomic_drift
            return "declared-live", metrics

        if ver_pass_all < ver_total_all:
            # Verification declared but paths missing → drift
            metrics["drift_reasons"] = atomic_drift
            return "drift", metrics

        # All verification paths exist
        if atomic_drift:
            # Other surface/shape issues → declared-live (not fully verified)
            metrics["drift_reasons"] = atomic_drift
            return "declared-live", metrics

        metrics["drift_reasons"] = []
        return "verified-live", metrics

    # Fallback for any other declared value (planned, etc.)
    metrics["drift_reasons"] = atomic_drift
    return "declared-live", metrics


def _build_metrics(
    atomics: list[dict[str, Any]],
    workspace_root: Path,
    extra_drift: list[str],
) -> dict[str, Any]:
    """Build metrics dict for deprecated/sunset caps."""
    atomics_live = sum(1 for a in atomics if isinstance(a, dict) and a.get("status", "live") == "live")
    atomics_wip = len(atomics) - atomics_live
    vt = 0
    vp = 0
    for a in atomics:
        if isinstance(a, dict):
            t, p, _ = _check_verification_paths(a, workspace_root)
            vt += t
            vp += p
    return {
        "atomics_total": len(atomics),
        "atomics_live": atomics_live,
        "atomics_wip": atomics_wip,
        "atomics_per_surface": _compute_atomics_per_surface(
            [a for a in atomics if isinstance(a, dict)]
        ),
        "verification_total": vt,
        "verification_pass": vp,
        "drift_reasons": extra_drift,
    }


def process_brand(brand: str, workspace_root: Path, verbose: bool) -> dict[str, Any]:
    """Glob all cap YAMLs for brand and compute status for each.

    Returns the full output dict (without computed_at / brand header).
    """
    caps_root = workspace_root / brand / "docs" / "product" / "capabilities"

    if not caps_root.exists():
        print(f"[ERROR] Directorio de capabilities no encontrado: {caps_root}", file=sys.stderr)
        sys.exit(1)

    yaml_paths = sorted(caps_root.rglob("*.yaml"))
    # Exclude template and mapping files
    yaml_paths = [
        p for p in yaml_paths
        if p.name not in {"_template.yaml", "_v3-mapping.yaml"}
        and not p.name.startswith("_")
    ]

    capabilities: dict[str, Any] = {}
    summary_counts: dict[str, int] = {
        "verified-live": 0,
        "declared-live": 0,
        "partial": 0,
        "wip": 0,
        "stub": 0,
        "drift": 0,
        "deprecated": 0,
        "sunset": 0,
    }

    total = len(yaml_paths)
    if not verbose:
        print(f"Procesando {total} capabilities de {brand}...", end="", flush=True)

    for idx, path in enumerate(yaml_paths):
        if not verbose:
            if (idx + 1) % 10 == 0 or (idx + 1) == total:
                print(".", end="", flush=True)

        data = _parse_frontmatter(path)
        if data is None:
            continue

        slug = data.get("slug") or path.stem
        declared = str(data.get("status", "live")).strip()
        atomics_raw = data.get("atomics")
        atomics: list[dict[str, Any]] = []

        if isinstance(atomics_raw, list):
            atomics = atomics_raw
        elif atomics_raw is not None:
            print(
                f"  [WARN] 'atomics' no es lista en {path} — tratado como stub",
                file=sys.stderr,
            )

        computed_status, metrics = _compute_status(declared, atomics, workspace_root, slug)

        if verbose:
            drift_info = ""
            if metrics["drift_reasons"]:
                drift_info = f" | {len(metrics['drift_reasons'])} drift reasons"
            print(f"  {slug:<60} {declared:<12} → {computed_status}{drift_info}")

        capabilities[slug] = {
            "declared_status": declared,
            "computed_status": computed_status,
            **metrics,
        }

        if computed_status in summary_counts:
            summary_counts[computed_status] += 1
        else:
            summary_counts[computed_status] = summary_counts.get(computed_status, 0) + 1

    if not verbose:
        print()  # newline after dots

    # Normaliza guion→underscore para alinear con el contrato TS
    # (ComputedStatusReport.summary en tools/luana-cockpit/lib/types.ts usa
    # verified_live / declared_live, no verified-live / declared-live).
    summary = {
        "total_caps": len(capabilities),
        **{key.replace("-", "_"): count for key, count in summary_counts.items()},
    }

    return {"capabilities": capabilities, "summary": summary}


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="Computa el status derivado de cada capability según state-machine.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--brand", required=True, help="Slug de la brand (ej. vitalia)")
    parser.add_argument(
        "--out",
        default=None,
        help="Path de salida JSON. Default: {brand}/docs/product/capabilities/_status-computed.json",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Log detallado por capability"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Sale con código 1 si existen caps en estado 'drift'",
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="Raíz del workspace. Default: detectado via git rev-parse",
    )
    args = parser.parse_args()

    # Resolve workspace root
    if args.repo:
        workspace_root = Path(args.repo).resolve()
    else:
        # Try to detect from git
        import subprocess  # noqa: PLC0415

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
        else workspace_root / args.brand / "docs" / "product" / "capabilities" / "_status-computed.json"
    )

    if args.verbose:
        print(f"Workspace root : {workspace_root}")
        print(f"Brand          : {args.brand}")
        print(f"Output         : {out_path}")
        print()

    result_data = process_brand(args.brand, workspace_root, args.verbose)

    now_iso = datetime.now(tz=timezone.utc).astimezone().isoformat(timespec="seconds")
    output: dict[str, Any] = {
        "computed_at": now_iso,
        "brand": args.brand,
        "capabilities": result_data["capabilities"],
        "summary": result_data["summary"],
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    summary = result_data["summary"]
    print(
        f"Completado: {summary['total_caps']} caps · "
        f"stub={summary.get('stub', 0)} · "
        f"declared-live={summary.get('declared_live', 0)} · "
        f"verified-live={summary.get('verified_live', 0)} · "
        f"drift={summary.get('drift', 0)} · "
        f"partial={summary.get('partial', 0)} · "
        f"wip={summary.get('wip', 0)} · "
        f"deprecated={summary.get('deprecated', 0)}"
    )
    print(f"Guardado en: {out_path}")

    if args.strict and summary.get("drift", 0) > 0:
        print(
            f"[STRICT] {summary['drift']} caps en estado 'drift' detectadas.",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
