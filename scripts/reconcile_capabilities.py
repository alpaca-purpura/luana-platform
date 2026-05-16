#!/usr/bin/env python3
"""Reconcile capability YAML status fields from story YAML status (R32).

Capability files at ``{base}/docs/product/capabilities/{module}/{cap}.yaml`` declare
``status``, ``stories_live``, ``stories_planned``, ``stories_total`` in their
frontmatter. These MUST be a deterministic function of the referenced
``story_ids`` (each pointing at ``{base}/docs/product/stories/{module}/{story_id}.yaml``).

Where ``{base}`` is either:
  * ``{repo_root}/`` (legacy single-brand or platform-wide capabilities) — default
  * ``{repo_root}/{brand}/`` (brand-scoped capabilities post multibrand reorg 2026-05-15)
  * ``{repo_root}/{brand}/`` iterated for all brands (when ``--all-brands``)

Without enforcement, ``/pm-{brand}`` updates the capability manually at merge time
and drift is invisible — readers (auditors, eval runners, dashboards) get stale
overview data.

This script reads every capability YAML, looks up each referenced story,
recomputes the four derived fields, and either:

  * ``--check``     → exits 1 if any drift; prints details. Used by pre-commit hook.
  * (default)       → rewrites drifted capability files in place using regex on
                      the frontmatter (preserves comments / key order / blank lines).

Scope flags (mutually exclusive):
  * (default)       → root ``docs/product/`` (legacy / platform cross-brand)
  * ``--brand X``   → ``X/docs/product/`` only (e.g. ``--brand vitalia``)
  * ``--all-brands``→ iterate every dir with ``{brand}/config/brand.yaml`` + root

Run via ``python scripts/reconcile_capabilities.py [--check] [--require-capabilities-exist]
[--brand SLUG | --all-brands] [--repo PATH]``.

Coverage gate (``--require-capabilities-exist``)
================================================
Verifies that brands with ``status: shipped`` in their checkpoint frontmatter
have at least 1 capability YAML mapped. Detects the failure mode where a brand
ships features but never updates the SSoT funcional (capabilities/ empty).

Combine with ``--brand SLUG`` or ``--all-brands`` to scope which brands are
checked. Exit 1 on any gap. No auto-fix — gaps require manual inventory by the
brand's ``/pm-{brand}`` skill.

Origen
======
Process improvement R32 (2026-05-05). Multibrand expansion 2026-05-15 (post
audit aislamiento brand). Replaces manual ``/pm-{brand}`` recalc step in
SDD merge phase with deterministic gate.

Coverage gate added 2026-05-16 via proposal ``2026-05-16-capability-inventory-
enforcement`` (origen vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import yaml

VALID_STORY_STATUS = {"planned", "ratified", "in-progress", "live", "deprecated"}
# `ratified` = spec approved by Chris, not yet built — bucketed with `planned`
# for capability rollup (capability isn't shipping until at least 1 story `live`).
PRE_BUILD_STATUSES = {"planned", "ratified"}


@dataclass
class CapDrift:
    """Drift record for a single capability YAML."""

    path: Path
    diffs: dict[str, tuple[object, object]]  # field → (actual, expected)
    missing_stories: list[str]


@dataclass
class CapCoverageGap:
    """Coverage gap for a brand with status=shipped but missing capability YAMLs.

    Raised by ``--require-capabilities-exist``. Detects the failure mode behind
    proposal ``2026-05-16-capability-inventory-enforcement``: brand mergea outcomes
    sin actualizar SSoT funcional (capabilities/ stays empty).
    """

    brand: str
    checkpoint_path: Path
    caps_dir: Path
    yaml_count: int  # excluding README.md / non-YAML files


class FrontmatterError(ValueError):
    """Raised when a YAML file has malformed or missing frontmatter."""


def load_frontmatter(path: Path) -> dict:
    r"""Parse YAML frontmatter.

    Three layouts supported:
      * Markdown-style: ``---\n<yaml>\n---\n<body>`` (capabilities, modules)
      * Pure YAML with leading marker: ``---\n<yaml>`` (stories — no body, no closer)
      * Comment block + frontmatter: ``# ...\n---\n<yaml>`` (some service stories
        prefix the YAML with header comments documenting eval policy / owners).
    """
    text = path.read_text(encoding="utf-8")

    # Skip leading comment-only lines and blank lines until reaching '---'
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
        raise FrontmatterError(str(path))

    after = body[3:].lstrip("\n")
    yaml_text = after.split("\n---", 1)[0]

    data = yaml.safe_load(yaml_text)
    if not isinstance(data, dict):
        raise FrontmatterError(str(path))
    return data


def derive_status(stories_status: list[str]) -> str:
    """Pure function: capability status from list of story statuses.

    Bucketing:
      * empty / no live → ``planned``
      * all deprecated → ``deprecated``
      * all live (non-deprecated) → ``live``
      * all pre-build (planned/ratified) → ``planned``
      * mixed → ``in-progress``
    """
    if not stories_status:
        return "planned"
    non_deprecated = [s for s in stories_status if s != "deprecated"]
    if not non_deprecated:
        return "deprecated"
    if all(s == "live" for s in non_deprecated):
        return "live"
    if all(s in PRE_BUILD_STATUSES for s in non_deprecated):
        return "planned"
    return "in-progress"


def replace_frontmatter_field(text: str, key: str, value: object) -> str:
    """Replace ``key: <whatever>`` in frontmatter, preserving rest of file.

    Only substitutes the first occurrence (frontmatter) to avoid touching
    body content that might mention the same key in prose.
    """
    pattern = rf"^({re.escape(key)}:)[^\n]*$"
    replacement = f"{key}: {value}"
    return re.sub(pattern, replacement, text, count=1, flags=re.MULTILINE)


def check_capability_coverage(repo: Path, brand: str) -> CapCoverageGap | None:
    """Verify shipped brand has at least 1 capability YAML.

    Reads ``{repo}/{brand}/docs/product/checkpoint.md`` frontmatter for
    ``status:`` field. If ``status: shipped``, counts ``*.yaml`` files under
    ``{repo}/{brand}/docs/product/capabilities/`` (recursive). Returns a gap if
    zero YAMLs found.

    Excluded statuses (no gap raised):
      * ``placeholder`` — brand bootstrapped but no real features yet (lupulo)
      * ``pending`` — brand not yet bootstrapped (saasora, inmoflow, etc.)
      * missing checkpoint — treated as placeholder (defensive)

    Origen: proposal ``2026-05-16-capability-inventory-enforcement``
    (vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md).
    """
    checkpoint = repo / brand / "docs" / "product" / "checkpoint.md"
    caps_dir = repo / brand / "docs" / "product" / "capabilities"

    if not checkpoint.exists():
        return None

    try:
        meta = load_frontmatter(checkpoint)
    except (FrontmatterError, yaml.YAMLError):
        return None

    if meta.get("status") != "shipped":
        return None

    if not caps_dir.exists():
        return CapCoverageGap(brand=brand, checkpoint_path=checkpoint, caps_dir=caps_dir, yaml_count=0)

    yaml_count = sum(1 for _ in caps_dir.rglob("*.yaml"))

    if yaml_count == 0:
        return CapCoverageGap(brand=brand, checkpoint_path=checkpoint, caps_dir=caps_dir, yaml_count=0)

    return None


def discover_brands(repo: Path) -> list[str]:
    """Return sorted list of brand slugs (dirs containing ``config/brand.yaml``).

    Post multibrand reorg 2026-05-15: each brand vertical lives under
    ``{repo}/{brand}/`` with its own ``config/brand.yaml`` marker. Used by
    ``--all-brands`` to iterate all active verticals.
    """
    brands: list[str] = []
    for cfg in sorted(repo.glob("*/config/brand.yaml")):
        brand = cfg.parent.parent.name
        brands.append(brand)
    return brands


def reconcile(repo: Path, *, check_only: bool, brand: str | None = None) -> tuple[int, list[CapDrift]]:
    """Walk capabilities for a given scope, detect drift, optionally rewrite.

    Scope resolution:
      * ``brand=None`` → root ``{repo}/docs/product/`` (legacy / platform cross-brand)
      * ``brand="vitalia"`` → ``{repo}/vitalia/docs/product/``

    Returns (exit_code, drifts).
    """
    base = repo / brand if brand else repo
    caps_dir = base / "docs" / "product" / "capabilities"
    stories_dir = base / "docs" / "product" / "stories"

    if not caps_dir.exists():
        # Empty scope (no capabilities yet for this brand, or root post-multibrand
        # reorg where capabilities migrated to {brand}/) is NOT an error — just skip.
        return 0, []

    drifts: list[CapDrift] = []

    for cap_file in sorted(caps_dir.rglob("*.yaml")):
        try:
            cap = load_frontmatter(cap_file)
        except (FrontmatterError, yaml.YAMLError) as exc:
            sys.stderr.write(f"SKIP {cap_file}: {exc}\n")
            continue

        module = cap.get("module")
        story_ids = cap.get("story_ids") or []
        if not module or not story_ids:
            continue

        stories_status: list[str] = []
        missing: list[str] = []
        for sid in story_ids:
            sfile = stories_dir / module / f"{sid}.yaml"
            if not sfile.exists():
                missing.append(sid)
                continue
            try:
                story = load_frontmatter(sfile)
            except (FrontmatterError, yaml.YAMLError):
                missing.append(sid)
                continue
            status = story.get("status", "planned")
            if status not in VALID_STORY_STATUS:
                status = "planned"
            stories_status.append(status)

        expected = {
            "status": derive_status(stories_status),
            "stories_live": sum(1 for s in stories_status if s == "live"),
            "stories_planned": sum(1 for s in stories_status if s in PRE_BUILD_STATUSES),
            "stories_total": len(stories_status),
        }
        actual = {k: cap.get(k) for k in expected}

        diffs = {k: (actual[k], expected[k]) for k in expected if actual[k] != expected[k]}
        if not diffs and not missing:
            continue

        drifts.append(CapDrift(path=cap_file, diffs=diffs, missing_stories=missing))

        if not check_only and diffs:
            text = cap_file.read_text(encoding="utf-8")
            for key, val in expected.items():
                text = replace_frontmatter_field(text, key, val)
            cap_file.write_text(text, encoding="utf-8")

    return 0, drifts


def main() -> int:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 on drift without modifying files (CI / pre-commit gate).",
    )
    parser.add_argument(
        "--require-capabilities-exist",
        action="store_true",
        help="Verify shipped brands have at least 1 capability YAML. "
        "Exit 1 if any brand with checkpoint status=shipped has empty capabilities/. "
        "Origen: proposal 2026-05-16-capability-inventory-enforcement.",
    )
    parser.add_argument(
        "--repo",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Repo root containing docs/product/ (and brand verticals). Defaults to script's parent.",
    )
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument(
        "--brand",
        type=str,
        default=None,
        help="Brand slug to scope reconciliation (e.g. vitalia, nicolify). "
        "Reads {repo}/{brand}/docs/product/. Default: root docs/product/ (legacy/platform).",
    )
    scope.add_argument(
        "--all-brands",
        action="store_true",
        help="Iterate root + every brand vertical (dirs with config/brand.yaml). "
        "Aggregates drifts across all scopes.",
    )
    args = parser.parse_args()

    # Build list of (label, brand_arg) tuples to process
    scopes: list[tuple[str, str | None]] = []
    if args.all_brands:
        scopes.append(("root (platform)", None))
        for b in discover_brands(args.repo):
            scopes.append((b, b))
    elif args.brand:
        scopes.append((args.brand, args.brand))
    else:
        scopes.append(("root (platform)", None))

    all_drifts: list[tuple[str, CapDrift]] = []
    for label, brand_arg in scopes:
        err, drifts = reconcile(args.repo, check_only=args.check, brand=brand_arg)
        if err:
            return err
        for d in drifts:
            all_drifts.append((label, d))

    # Coverage check: shipped brands must have ≥1 capability YAML.
    # Only triggered when flag is explicitly passed (opt-in, backward-compatible).
    coverage_gaps: list[CapCoverageGap] = []
    if args.require_capabilities_exist:
        # Brand-scoped: only check the requested brand(s); never the root scope.
        brands_to_check: list[str] = []
        if args.all_brands:
            brands_to_check = discover_brands(args.repo)
        elif args.brand:
            brands_to_check = [args.brand]
        # else: --require-capabilities-exist without --brand/--all-brands → no-op
        # (root scope has no brand checkpoint; user must scope explicitly).
        for b in brands_to_check:
            gap = check_capability_coverage(args.repo, b)
            if gap is not None:
                coverage_gaps.append(gap)

    if not all_drifts and not coverage_gaps:
        scope_desc = ", ".join(label for label, _ in scopes)
        print(f"OK — all capabilities consistent with stories. Scope: {scope_desc}.")  # noqa: T201
        if args.require_capabilities_exist:
            checked = ", ".join(b for b in (
                discover_brands(args.repo) if args.all_brands
                else ([args.brand] if args.brand else [])
            )) or "(none — pass --brand or --all-brands to enable)"
            print(f"Capability coverage check: PASS. Brands checked: {checked}.")  # noqa: T201
        return 0

    if all_drifts:
        print(f"DRIFT detected in {len(all_drifts)} capability file(s):")  # noqa: T201
        for label, d in all_drifts:
            rel = d.path.relative_to(args.repo)
            print(f"\n  [{label}] {rel}")  # noqa: T201
            for key, (actual, expected) in d.diffs.items():
                print(f"    {key}: actual={actual!r} → expected={expected!r}")  # noqa: T201
            if d.missing_stories:
                print(f"    missing story files: {d.missing_stories}")  # noqa: T201

    if coverage_gaps:
        print(f"\nCAPABILITY COVERAGE GAP in {len(coverage_gaps)} brand(s):")  # noqa: T201
        for gap in coverage_gaps:
            print(f"\n  [{gap.brand}] status=shipped but {gap.caps_dir.relative_to(args.repo)} contains 0 capability YAMLs")  # noqa: T201
            print(f"    checkpoint: {gap.checkpoint_path.relative_to(args.repo)}")  # noqa: T201
            print(f"    fix: poblar capabilities/{{module}}/{{cap}}.yaml leyendo código vivo + rules + archive")  # noqa: T201
            print(f"    ref: docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md")  # noqa: T201

    if args.check or coverage_gaps:
        # Coverage gaps are always blocking (no auto-fix possible — requires manual inventory).
        if all_drifts and args.check:
            print("\nRun without --check to fix drifts in place. Coverage gaps require manual inventory.")  # noqa: T201
        elif coverage_gaps:
            print("\nCoverage gaps require manual capability YAML authoring (no auto-fix).")  # noqa: T201
        return 1

    print(f"\nFixed {len(all_drifts)} file(s).")  # noqa: T201
    return 0


if __name__ == "__main__":
    sys.exit(main())
