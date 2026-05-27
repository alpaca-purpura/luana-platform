#!/usr/bin/env python3
"""Propagate `architecture_pattern: ADR-vitalia-004` field to Vitalia story checkpoints.

Idempotent: if field already present, skip (no-op).

Exempt list (per ADR-vitalia-004 § 9 — NO aplica a estos):
- vitalia-fase2-valeria-agenda (source story — ADR cita a esta, no al revés)
- vitalia-fiscal-emission-pe (service-only, no UI)
- vitalia-payment-adapter-mvp (service-only, no UI)
- vitalia-pricing-decision (business decision, no technical story)

Adds field after `state:` line in YAML frontmatter (between --- markers).

Usage:
    python3 scripts/propagate-adr-vitalia-004.py [--dry-run]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

EXEMPT_STORIES = {
    "vitalia-fase2-valeria-agenda",       # source of the pattern
    "vitalia-fiscal-emission-pe",         # service-only
    "vitalia-payment-adapter-mvp",        # service-only
    "vitalia-pricing-decision",           # business decision
}

FIELD_LINE = "architecture_pattern: ADR-vitalia-004"

ROOT = Path(__file__).resolve().parents[1]
STORIES_DIR = ROOT / "vitalia" / "docs" / "product" / "stories"


def process_checkpoint(cp_path: Path, dry_run: bool = False) -> str:
    """Return verdict: ADDED | SKIPPED_EXEMPT | SKIPPED_PRESENT | SKIPPED_NO_FRONTMATTER."""
    story_id = cp_path.parent.name
    if story_id in EXEMPT_STORIES:
        return "SKIPPED_EXEMPT"

    text = cp_path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)

    # Find frontmatter boundaries
    if not lines or lines[0].rstrip() != "---":
        return "SKIPPED_NO_FRONTMATTER"

    end_idx = None
    for i, line in enumerate(lines[1:], start=1):
        if line.rstrip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return "SKIPPED_NO_FRONTMATTER"

    fm_lines = lines[1:end_idx]

    # Idempotency check
    for line in fm_lines:
        if line.lstrip().startswith("architecture_pattern:"):
            return "SKIPPED_PRESENT"

    # Find insertion point: after `state:` line if present, else right after `story_id:`
    insert_after_idx = None
    for i, line in enumerate(fm_lines):
        if line.lstrip().startswith("state:"):
            insert_after_idx = i
            break
    if insert_after_idx is None:
        for i, line in enumerate(fm_lines):
            if line.lstrip().startswith("story_id:"):
                insert_after_idx = i
                break
    if insert_after_idx is None:
        # Fallback: insert at end of frontmatter
        insert_after_idx = len(fm_lines) - 1

    # Build new lines
    new_field_line = f"{FIELD_LINE}\n"
    new_lines = (
        lines[: 1 + insert_after_idx + 1]  # up to and including the anchor line
        + [new_field_line]
        + lines[1 + insert_after_idx + 1 :]
    )

    if not dry_run:
        cp_path.write_text("".join(new_lines), encoding="utf-8")

    return "ADDED"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report only, no writes")
    args = parser.parse_args()

    if not STORIES_DIR.exists():
        print(f"ERROR: {STORIES_DIR} not found", file=sys.stderr)
        return 1

    counters: dict[str, int] = {}
    rows: list[tuple[str, str]] = []
    for cp in sorted(STORIES_DIR.glob("*/checkpoint.md")):
        verdict = process_checkpoint(cp, dry_run=args.dry_run)
        counters[verdict] = counters.get(verdict, 0) + 1
        rows.append((verdict, cp.parent.name))

    print(f"\nPropagation report ({'DRY-RUN' if args.dry_run else 'APPLIED'}):\n")
    for verdict, story_id in rows:
        marker = {
            "ADDED": "+",
            "SKIPPED_EXEMPT": "=",
            "SKIPPED_PRESENT": "·",
            "SKIPPED_NO_FRONTMATTER": "?",
        }.get(verdict, "?")
        print(f"  {marker} {verdict:25s} {story_id}")

    print("\nSummary:")
    for verdict, count in sorted(counters.items()):
        print(f"  {verdict:25s} {count}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
