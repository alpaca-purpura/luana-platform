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
[--validate-atomics] [--strict] [--brand SLUG | --all-brands] [--repo PATH]``.

Coverage gate (``--require-capabilities-exist``)
================================================
Verifies that brands with ``status: shipped`` in their checkpoint frontmatter
have at least 1 capability YAML mapped. Detects the failure mode where a brand
ships features but never updates the SSoT funcional (capabilities/ empty).

Combine with ``--brand SLUG`` or ``--all-brands`` to scope which brands are
checked. Exit 1 on any gap. No auto-fix — gaps require manual inventory by the
brand's ``/pm-{brand}`` skill.

Atomic validation (``--validate-atomics``)
==========================================
Validates the shape of ``atomics[]`` objects in each capability YAML against
the schema v3.1 canónico (``_cap-verification-decisions.md`` § A). Also enforces
Fase F.3 rules (``capability-protocol.md`` § 5) for ``change_log`` consistency.

Can be combined with ``--check``, ``--brand``, ``--validate-ledger``, and
``--all-brands``. Use ``--strict`` to promote warnings to errors.

Bootstrap exception: ``change_log`` entries with
``story_id == 'vitalia-bootstrap-inventory-2026-05-15'`` (bulk migration) are
exempt from the ``change_log_atomics_required`` check — they legitimately have
``atomics_added: []``.

Origen
======
Process improvement R32 (2026-05-05). Multibrand expansion 2026-05-15 (post
audit aislamiento brand). Replaces manual ``/pm-{brand}`` recalc step in
SDD merge phase with deterministic gate.

Coverage gate added 2026-05-16 via proposal ``2026-05-16-capability-inventory-
enforcement`` (origen vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md).

Atomic validation added 2026-05-28 (Cap Verification Wave 2-F) implementing
schema v3.1 + Fase F.3 enforce rules from ``_cap-verification-decisions.md`` § A + C.
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

# Atomic schema v3.1 — surface enum (capability-protocol.md § A).
VALID_ATOMIC_SURFACES = {"FE", "BE", "AGENTIC", "FE+BE", "FE+BE+AGENTIC", "DOCS", "INFRA"}

# Atomic schema v3.1 — status enum.
VALID_ATOMIC_STATUSES = {"live", "wip", "deprecated"}

# Bootstrap migration story IDs exempt from change_log_atomics_required check.
# These represent bulk legacy migrations with legitimately empty atomics_added[].
BOOTSTRAP_STORIES = {"vitalia-bootstrap-inventory-2026-05-15"}


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


@dataclass
class CapLedgerError:
    """Ledger-validation error (schema v2 cement 2026-05-27).

    Raised by ``--validate-ledger`` when a capability YAML's ``change_log``,
    ``atomics``, or ``parent_cap`` / ``derives_capabilities`` cross-references
    are inconsistent.

    Categories
    ----------
    * ``missing_story_checkpoint`` — change_log entry references story_id that
      lacks both an active and an archived checkpoint.md
    * ``atomic_story_mismatch`` — atomics[].added_in_story not found in any
      change_log[].story_id
    * ``parent_cap_missing`` — parent_cap declared but file does not exist
    * ``parent_cap_inverse_missing`` — parent cap file exists but does NOT list
      this capability in its derives_capabilities[]
    """

    cap_path: Path
    category: str
    detail: str


@dataclass
class CapAtomicError:
    """Atomic validation error (schema v3.1 + Fase F.3 enforce, cement 2026-05-28).

    Raised by ``--validate-atomics`` when ``atomics[]`` objects or ``change_log``
    consistency violates schema v3.1 canónico (``_cap-verification-decisions.md`` § A + C).

    Categories
    ----------
    * ``atomic_missing_required_field`` — atomic missing ``id``, ``name``,
      ``surface``, ``added_in_story``, ``added_date``, or ``status``.
    * ``atomic_invalid_surface`` — surface not in the canonical enum.
    * ``atomic_invalid_status`` — status not in {live, wip, deprecated}.
    * ``atomic_id_duplicate`` — two atomics within the same cap share an id.
    * ``atomic_added_in_story_missing`` — added_in_story does not resolve to
      a story checkpoint.md (active or archived).
    * ``atomic_surface_path_mismatch`` — surface=FE but no fe_path nor e2e_test
      declared in verification block (severity: warning).
    * ``change_log_atomics_required`` — cap_change_type ∈ {new, extend} but
      change_log[last].atomics_added is empty (bootstrap entries exempted).
    * ``change_log_atomics_grew_extend`` — cap_change_type=extend but atomics[]
      count did not grow vs sum of previous change_log.atomics_added entries.
    * ``derive_child_no_atomics`` — cap with parent_cap declared but atomics[]
      and change_log[0].atomics_added are both empty.
    * ``derive_parent_missing_child`` — cap child (with parent_cap) not listed
      in parent.derives_capabilities[].

    Severity
    --------
    ``error`` by default. ``atomic_surface_path_mismatch`` defaults to
    ``warning``; promoted to ``error`` when ``--strict`` is active.
    """

    cap_path: Path
    category: str
    detail: str
    severity: str = "error"  # "error" | "warning"


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


def _story_checkpoint_exists(repo: Path, brand: str, story_id: str) -> bool:
    """Return True if a checkpoint.md exists for the story (active or archived).

    Searches:
      * ``{repo}/{brand}/docs/product/stories/{story_id}/checkpoint.md`` (active)
      * ``{repo}/{brand}/docs/archive/{year}/stories/{story_id}/checkpoint.md`` (archived)

    Archive scan iterates every ``{year}`` directory present (forward-compat with
    multi-year archive growth).
    """
    active = repo / brand / "docs" / "product" / "stories" / story_id / "checkpoint.md"
    if active.exists():
        return True
    archive_root = repo / brand / "docs" / "archive"
    if archive_root.exists():
        for year_dir in archive_root.iterdir():
            if not year_dir.is_dir():
                continue
            archived = year_dir / "stories" / story_id / "checkpoint.md"
            if archived.exists():
                return True
    return False


def _resolve_parent_cap(caps_dir: Path, parent_cap: str) -> Path | None:
    """Resolve parent_cap reference to a YAML path under caps_dir.

    parent_cap may be either:
      * Full capability_id (e.g. ``vitalia-booking-widget-embed``) — resolved by
        scanning caps_dir for matching ``capability_id`` frontmatter field
      * Module/slug form (e.g. ``booking/booking-widget-embed``) — resolved
        directly as a path under caps_dir
    """
    candidate = caps_dir / f"{parent_cap}.yaml"
    if candidate.exists():
        return candidate
    for cap_file in caps_dir.rglob("*.yaml"):
        try:
            data = load_frontmatter(cap_file)
        except (FrontmatterError, yaml.YAMLError):
            continue
        if data.get("capability_id") == parent_cap or data.get("slug") == parent_cap:
            return cap_file
    return None


def validate_ledger(repo: Path, brand: str | None) -> list[CapLedgerError]:
    """Validate cap ledger schema v2 cement 2026-05-27.

    Three validations per capability YAML that has ``change_log:`` field:

    1. Each ``change_log[].story_id`` references a story whose checkpoint.md
       exists (active or archived). Missing → ``missing_story_checkpoint``.
    2. Each ``atomics[].added_in_story`` matches a ``change_log[].story_id``.
       Mismatch → ``atomic_story_mismatch``.
    3. If ``parent_cap`` is not null, the parent capability exists AND lists
       the current capability in its ``derives_capabilities[]``. Missing/
       inconsistent → ``parent_cap_missing`` or ``parent_cap_inverse_missing``.

    Returns list of errors (empty list = OK).
    """
    base = repo / brand if brand else repo
    caps_dir = base / "docs" / "product" / "capabilities"
    if not caps_dir.exists():
        return []
    if not brand:
        # Ledger schema v2 is brand-scoped — root scope has no story checkpoints
        # to cross-reference against. Skip gracefully.
        return []

    errors: list[CapLedgerError] = []

    for cap_file in sorted(caps_dir.rglob("*.yaml")):
        try:
            cap = load_frontmatter(cap_file)
        except (FrontmatterError, yaml.YAMLError) as exc:
            sys.stderr.write(f"SKIP {cap_file}: {exc}\n")
            continue

        change_log = cap.get("change_log")
        # Skip caps without change_log (pre-v2 schema, not yet migrated)
        if not change_log or not isinstance(change_log, list):
            continue

        cap_id = cap.get("capability_id") or cap.get("slug") or cap_file.stem

        # Validation 1: change_log[].story_id → checkpoint exists
        change_log_story_ids: list[str] = []
        for idx, entry in enumerate(change_log):
            if not isinstance(entry, dict):
                continue
            story_id = entry.get("story_id")
            if not story_id:
                continue
            change_log_story_ids.append(story_id)
            if not _story_checkpoint_exists(repo, brand, story_id):
                errors.append(
                    CapLedgerError(
                        cap_path=cap_file,
                        category="missing_story_checkpoint",
                        detail=(
                            f"change_log[{idx}].story_id={story_id!r} has no checkpoint.md "
                            f"at {brand}/docs/product/stories/{story_id}/checkpoint.md "
                            f"nor at {brand}/docs/archive/*/stories/{story_id}/checkpoint.md"
                        ),
                    )
                )

        # Validation 2: atomics[].added_in_story → must match a change_log story_id
        atomics = cap.get("atomics") or []
        if isinstance(atomics, list):
            for idx, atomic in enumerate(atomics):
                if not isinstance(atomic, dict):
                    continue
                added_in = atomic.get("added_in_story")
                if not added_in:
                    continue
                if added_in not in change_log_story_ids:
                    label = atomic.get("label") or atomic.get("id") or f"atomic[{idx}]"
                    errors.append(
                        CapLedgerError(
                            cap_path=cap_file,
                            category="atomic_story_mismatch",
                            detail=(
                                f"atomic {label!r} (atomics[{idx}].added_in_story={added_in!r}) "
                                f"not found in any change_log[].story_id "
                                f"(declared: {change_log_story_ids})"
                            ),
                        )
                    )

        # Validation 3: parent_cap consistency
        parent_cap = cap.get("parent_cap")
        if parent_cap:  # not None, not empty string
            parent_path = _resolve_parent_cap(caps_dir, parent_cap)
            if parent_path is None:
                errors.append(
                    CapLedgerError(
                        cap_path=cap_file,
                        category="parent_cap_missing",
                        detail=(
                            f"parent_cap={parent_cap!r} declared but no capability YAML "
                            f"with that capability_id/slug exists under {caps_dir.relative_to(repo)}"
                        ),
                    )
                )
            else:
                try:
                    parent_data = load_frontmatter(parent_path)
                except (FrontmatterError, yaml.YAMLError):
                    parent_data = {}
                derives = parent_data.get("derives_capabilities") or []
                if cap_id not in derives:
                    errors.append(
                        CapLedgerError(
                            cap_path=cap_file,
                            category="parent_cap_inverse_missing",
                            detail=(
                                f"parent_cap={parent_cap!r} resolved to {parent_path.relative_to(repo)} "
                                f"but its derives_capabilities[] does NOT list {cap_id!r} "
                                f"(found: {derives})"
                            ),
                        )
                    )

    return errors


def _is_bootstrap_entry(entry: dict) -> bool:
    """Return True if a change_log entry belongs to a bootstrap migration story.

    Bootstrap entries are exempt from the ``change_log_atomics_required`` check
    because they represent bulk legacy migrations with legitimately empty
    ``atomics_added[]``.
    """
    return entry.get("story_id") in BOOTSTRAP_STORIES


def validate_atomics(
    repo: Path, brand: str | None, *, strict: bool = False
) -> list[CapAtomicError]:
    """Validate atomics[] shape + Fase F.3 change_log enforce rules (v3.1).

    Validations per capability YAML:

    1.  Each ``atomic`` must have required fields: id, name, surface,
        added_in_story, added_date, status.
    2.  ``atomic.surface`` must be in the canonical enum.
    3.  ``atomic.status`` must be in {live, wip, deprecated}.
    4.  ``atomic.id`` must be unique within the capability.
    5.  ``atomic.added_in_story`` must resolve to a story checkpoint.md
        (active or archived) when brand is provided.
    6.  If surface=FE and verification block is absent (or fe_path=null and
        e2e_test=null), emit a warning (promoted to error under --strict).
    7.  For change_log entries with type ∈ {new, extend} and NOT a bootstrap
        migration entry, ``atomics_added`` must be non-empty.
    8.  For type=extend, the atomics[] count must exceed the sum of all
        previous change_log ``atomics_added`` lengths (best-effort growth check).
    9.  If parent_cap is declared, atomics[] must be non-empty (derive_child_no_atomics).
    10. If this capability has parent_cap, it must appear in the parent's
        derives_capabilities[] (derive_parent_missing_child).

    Returns list of ``CapAtomicError``. Empty list = no issues found.
    """
    base = repo / brand if brand else repo
    caps_dir = base / "docs" / "product" / "capabilities"
    if not caps_dir.exists():
        return []
    if not brand:
        # Atomic validation is brand-scoped (needs story checkpoints for cross-ref).
        return []

    errors: list[CapAtomicError] = []

    for cap_file in sorted(caps_dir.rglob("*.yaml")):
        try:
            cap = load_frontmatter(cap_file)
        except (FrontmatterError, yaml.YAMLError) as exc:
            sys.stderr.write(f"SKIP {cap_file}: {exc}\n")
            continue

        cap_id = cap.get("capability_id") or cap.get("slug") or cap_file.stem
        atomics = cap.get("atomics") or []
        change_log = cap.get("change_log") or []

        # ------------------------------------------------------------------ #
        # Per-atomic field validation
        # ------------------------------------------------------------------ #
        seen_ids: set[str] = set()
        required_fields = ("id", "name", "surface", "added_in_story", "added_date", "status")

        for idx, atomic in enumerate(atomics):
            if not isinstance(atomic, dict):
                errors.append(
                    CapAtomicError(
                        cap_path=cap_file,
                        category="atomic_missing_required_field",
                        detail=f"atomics[{idx}] no es un dict válido",
                    )
                )
                continue

            atomic_label = atomic.get("id") or f"atomic[{idx}]"

            # Check 1: required fields present
            for req in required_fields:
                if req not in atomic:
                    errors.append(
                        CapAtomicError(
                            cap_path=cap_file,
                            category="atomic_missing_required_field",
                            detail=f"{atomic_label} (atomics[{idx}]) falta campo requerido '{req}'",
                        )
                    )

            # Check 2: surface enum
            surface = atomic.get("surface")
            if surface is not None and surface not in VALID_ATOMIC_SURFACES:
                errors.append(
                    CapAtomicError(
                        cap_path=cap_file,
                        category="atomic_invalid_surface",
                        detail=(
                            f"{atomic_label} (atomics[{idx}]) surface={surface!r} no es válido. "
                            f"Valores permitidos: {sorted(VALID_ATOMIC_SURFACES)}"
                        ),
                    )
                )

            # Check 3: status enum
            status = atomic.get("status")
            if status is not None and status not in VALID_ATOMIC_STATUSES:
                errors.append(
                    CapAtomicError(
                        cap_path=cap_file,
                        category="atomic_invalid_status",
                        detail=(
                            f"{atomic_label} (atomics[{idx}]) status={status!r} no es válido. "
                            f"Valores permitidos: {sorted(VALID_ATOMIC_STATUSES)}"
                        ),
                    )
                )

            # Check 4: duplicate id
            atomic_id = atomic.get("id")
            if atomic_id is not None:
                if atomic_id in seen_ids:
                    errors.append(
                        CapAtomicError(
                            cap_path=cap_file,
                            category="atomic_id_duplicate",
                            detail=f"atomic id={atomic_id!r} aparece más de una vez en cap {cap_id!r}",
                        )
                    )
                else:
                    seen_ids.add(atomic_id)

            # Check 5: added_in_story resolves to a checkpoint
            added_in = atomic.get("added_in_story")
            if added_in and not _story_checkpoint_exists(repo, brand, added_in):
                errors.append(
                    CapAtomicError(
                        cap_path=cap_file,
                        category="atomic_added_in_story_missing",
                        detail=(
                            f"{atomic_label} (atomics[{idx}]) added_in_story={added_in!r} "
                            f"no tiene checkpoint.md en stories/ ni archive/*/stories/"
                        ),
                    )
                )

            # Check 6: surface=FE without any verification path (warning)
            if surface == "FE":
                verification = atomic.get("verification") or {}
                fe_path = verification.get("fe_path") if isinstance(verification, dict) else None
                e2e_test = verification.get("e2e_test") if isinstance(verification, dict) else None
                if not fe_path and not e2e_test:
                    errors.append(
                        CapAtomicError(
                            cap_path=cap_file,
                            category="atomic_surface_path_mismatch",
                            detail=(
                                f"{atomic_label} (atomics[{idx}]) surface=FE pero "
                                f"verification.fe_path y verification.e2e_test son null"
                            ),
                            severity="error" if strict else "warning",
                        )
                    )

        # ------------------------------------------------------------------ #
        # change_log + Fase F.3 enforce rules
        # ------------------------------------------------------------------ #
        if change_log and isinstance(change_log, list):
            last_entry = change_log[-1] if isinstance(change_log[-1], dict) else {}
            last_type = last_entry.get("type")
            last_atomics_added = last_entry.get("atomics_added") or []

            # Check 7: new/extend must have atomics_added (bootstrap exempted)
            if (
                last_type in ("new", "extend")
                and len(last_atomics_added) == 0
                and not _is_bootstrap_entry(last_entry)
            ):
                errors.append(
                    CapAtomicError(
                        cap_path=cap_file,
                        category="change_log_atomics_required",
                        detail=(
                            f"change_log[último] type={last_type!r} requiere "
                            f"atomics_added con al menos 1 entry "
                            f"(story_id={last_entry.get('story_id')!r})"
                        ),
                    )
                )

            # Check 8: extend — atomics[] must have grown
            if last_type == "extend" and not _is_bootstrap_entry(last_entry):
                # Sum atomics_added across ALL entries except the last
                prev_added_total = sum(
                    len(e.get("atomics_added") or [])
                    for e in change_log[:-1]
                    if isinstance(e, dict)
                )
                actual_count = len(atomics)
                if actual_count <= prev_added_total and actual_count > 0 and prev_added_total > 0:
                    errors.append(
                        CapAtomicError(
                            cap_path=cap_file,
                            category="change_log_atomics_grew_extend",
                            detail=(
                                f"cap_change_type=extend pero atomics[] count={actual_count} "
                                f"no creció vs suma atomics_added previos={prev_added_total}"
                            ),
                        )
                    )

        # Check 9: derive child must have atomics
        parent_cap_val = cap.get("parent_cap")
        if parent_cap_val:
            first_entry = change_log[0] if change_log and isinstance(change_log[0], dict) else {}
            first_atomics_added = first_entry.get("atomics_added") or []
            if not atomics and not first_atomics_added:
                errors.append(
                    CapAtomicError(
                        cap_path=cap_file,
                        category="derive_child_no_atomics",
                        detail=(
                            f"cap {cap_id!r} declara parent_cap={parent_cap_val!r} "
                            f"pero atomics[] y change_log[0].atomics_added están vacíos"
                        ),
                    )
                )

            # Check 10: parent must list this child in derives_capabilities
            if caps_dir:
                parent_path = _resolve_parent_cap(caps_dir, parent_cap_val)
                if parent_path is not None:
                    try:
                        parent_data = load_frontmatter(parent_path)
                    except (FrontmatterError, yaml.YAMLError):
                        parent_data = {}
                    derives = parent_data.get("derives_capabilities") or []
                    if cap_id not in derives:
                        errors.append(
                            CapAtomicError(
                                cap_path=cap_file,
                                category="derive_parent_missing_child",
                                detail=(
                                    f"cap {cap_id!r} tiene parent_cap={parent_cap_val!r} "
                                    f"pero el padre no lista {cap_id!r} en derives_capabilities[] "
                                    f"(found: {derives})"
                                ),
                            )
                        )

    return errors


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
        "--validate-ledger",
        action="store_true",
        help="Validate capability ledger schema v2 (cement 2026-05-27): "
        "change_log[].story_id has checkpoint.md (active or archive); "
        "atomics[].added_in_story matches a change_log[].story_id; "
        "parent_cap (if non-null) exists and lists current cap in derives_capabilities[]. "
        "Exit 1 on any error. Combine with --brand or --all-brands.",
    )
    parser.add_argument(
        "--validate-atomics",
        action="store_true",
        help="Validate atomics[] object shape against schema v3.1 canónico and "
        "Fase F.3 change_log enforce rules (cement 2026-05-28). "
        "Categories: atomic_missing_required_field, atomic_invalid_surface, "
        "atomic_invalid_status, atomic_id_duplicate, atomic_added_in_story_missing, "
        "atomic_surface_path_mismatch (warning), change_log_atomics_required, "
        "change_log_atomics_grew_extend, derive_child_no_atomics, "
        "derive_parent_missing_child. "
        "Bootstrap entries (vitalia-bootstrap-inventory-2026-05-15) are exempt "
        "from change_log_atomics_required. Combine with --brand or --all-brands. "
        "Use --strict to promote warnings to errors.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Promote warnings to errors in --validate-atomics. "
        "Affects: atomic_surface_path_mismatch (normally warning, becomes error).",
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

    # Ledger validation (schema v2 cement 2026-05-27).
    # Opt-in via --validate-ledger. Brand-scoped (root scope skipped — no story checkpoints).
    ledger_errors: list[tuple[str, CapLedgerError]] = []
    if args.validate_ledger:
        for label, brand_arg in scopes:
            if brand_arg is None:
                continue  # root scope has no brand-scoped stories
            for e in validate_ledger(args.repo, brand_arg):
                ledger_errors.append((label, e))

    # Atomic validation (schema v3.1 + Fase F.3, cement 2026-05-28).
    # Opt-in via --validate-atomics. Brand-scoped. Composable with other flags.
    atomic_errors: list[tuple[str, CapAtomicError]] = []
    if args.validate_atomics:
        for label, brand_arg in scopes:
            if brand_arg is None:
                continue  # atomic validation needs brand-scoped story checkpoints
            for e in validate_atomics(args.repo, brand_arg, strict=args.strict):
                atomic_errors.append((label, e))

    # Separate atomic errors by severity for reporting and exit code logic.
    atomic_hard_errors = [(lbl, e) for lbl, e in atomic_errors if e.severity == "error"]
    atomic_warnings = [(lbl, e) for lbl, e in atomic_errors if e.severity == "warning"]

    if not all_drifts and not coverage_gaps and not ledger_errors and not atomic_hard_errors and not atomic_warnings:
        scope_desc = ", ".join(label for label, _ in scopes)
        print(f"OK — all capabilities consistent with stories. Scope: {scope_desc}.")  # noqa: T201
        if args.require_capabilities_exist:
            checked = ", ".join(b for b in (
                discover_brands(args.repo) if args.all_brands
                else ([args.brand] if args.brand else [])
            )) or "(none — pass --brand or --all-brands to enable)"
            print(f"Capability coverage check: PASS. Brands checked: {checked}.")  # noqa: T201
        if args.validate_ledger:
            ledger_scopes = ", ".join(label for label, b in scopes if b is not None) or "(none — pass --brand or --all-brands)"
            print(f"Capability ledger check: PASS. Scopes: {ledger_scopes}.")  # noqa: T201
        if args.validate_atomics:
            atomic_scopes = ", ".join(label for label, b in scopes if b is not None) or "(none — pass --brand or --all-brands)"
            print(f"Capability atomics check: PASS. Scopes: {atomic_scopes}.")  # noqa: T201
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

    if ledger_errors:
        print(f"\nCAPABILITY LEDGER ERRORS in {len(ledger_errors)} entry/entries:")  # noqa: T201
        for label, e in ledger_errors:
            rel = e.cap_path.relative_to(args.repo)
            print(f"\n  [{label}] {rel}")  # noqa: T201
            print(f"    category: {e.category}")  # noqa: T201
            print(f"    detail:   {e.detail}")  # noqa: T201
        print("\nLedger schema v2 cement: 2026-05-27. Fix by editing change_log/atomics/parent_cap/derives_capabilities in cap YAML.")  # noqa: T201

    if atomic_hard_errors:
        print(f"\nCAPABILITY ATOMIC ERRORS in {len(atomic_hard_errors)} entry/entries:")  # noqa: T201
        for label, e in atomic_hard_errors:
            rel = e.cap_path.relative_to(args.repo)
            print(f"\n  [{label}] {rel}")  # noqa: T201
            print(f"    category: {e.category}")  # noqa: T201
            print(f"    detail:   {e.detail}")  # noqa: T201
        print("\nAtomic schema v3.1 cement: 2026-05-28. Fix by editing atomics[] + change_log[] en cap YAML.")  # noqa: T201

    if atomic_warnings:
        print(f"\nCAPABILITY ATOMIC WARNINGS in {len(atomic_warnings)} entry/entries:")  # noqa: T201
        for label, e in atomic_warnings:
            rel = e.cap_path.relative_to(args.repo)
            print(f"\n  [{label}] {rel} [WARN]")  # noqa: T201
            print(f"    category: {e.category}")  # noqa: T201
            print(f"    detail:   {e.detail}")  # noqa: T201
        print(f"\n{len(atomic_warnings)} warning(s) — usa --strict para convertir en errores.")  # noqa: T201

    has_blocking_errors = bool(coverage_gaps or ledger_errors or atomic_hard_errors)
    if args.check or has_blocking_errors:
        # Coverage gaps + ledger errors + atomic errors are always blocking
        # (no auto-fix possible — manual edit required).
        if all_drifts and args.check:
            print("\nRun without --check to fix drifts in place. Coverage gaps + ledger/atomic errors require manual edits.")  # noqa: T201
        elif coverage_gaps and not ledger_errors and not atomic_hard_errors:
            print("\nCoverage gaps require manual capability YAML authoring (no auto-fix).")  # noqa: T201
        elif ledger_errors and not coverage_gaps and not atomic_hard_errors:
            print("\nLedger errors require manual edits to capability YAML frontmatter.")  # noqa: T201
        elif atomic_hard_errors:
            print("\nAtomic errors require manual edits to atomics[]/change_log[] en cap YAML.")  # noqa: T201
        return 1

    if not all_drifts:
        return 0

    print(f"\nFixed {len(all_drifts)} file(s).")  # noqa: T201
    return 0


if __name__ == "__main__":
    sys.exit(main())
