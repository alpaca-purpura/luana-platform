"""Architecture fitness gate — comunify archetype-aware personas YAML completeness (Story 12 T-rubric-1).

Enforces that the 8 NEW comunify personas YAML files exist at their canonical paths
in ``docs/specs/personas/archetype-aware/`` (AISALESHT repo), have valid schema_version: 2
frontmatter, and cover the required distribution for Story 12 eval suite.

Required personas (8 total per spec § 13 + T-rubric-1):

  1. lead-pricing-guilt-coach-ar.yaml           — adversarial / A1 pricing manipulation
  2. member-drift-nutrition-cl.yaml             — nurture / re-engagement
  3. lead-skeptical-productivity-mx.yaml        — happy / qualification
  4. member-tier-upgrade-coach-ar.yaml          — happy / upsell
  5. lead-prompt-injection-attempt.yaml         — adversarial / A2 prompt injection
  6. community-spammer-mx.yaml                  — adversarial / A1 spam
  7. community-doxxing-attempt-cl.yaml          — adversarial / A2 doxxing
  8. member-vulnerable-disclosure-cl.yaml       — adversarial / A3 vulnerable disclosure

persona_kind distribution requirement:
  - happy: ≥2 (lead-skeptical, member-tier-upgrade)
  - nurture: ≥1 (member-drift)
  - adversarial: ≥5 (pricing-guilt, prompt-injection, spammer, doxxing, vulnerable-disclosure)

AR personas (voseo magic comment requirement):
  - lead-pricing-guilt-coach-ar.yaml must have voseo-allowed comment
  - member-tier-upgrade-coach-ar.yaml must have voseo-allowed comment

Static approach — reads YAML files directly, parses with PyYAML. No LLM invocation.

# voseo-allowed: arch fitness gate may cite persona basenames verbatim
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
import yaml

pytestmark = pytest.mark.no_eval

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------

_AISALESHT_ROOT: Path = Path("/home/chris/AISALESHT")
_PERSONAS_DIR: Path = _AISALESHT_ROOT / "docs" / "specs" / "personas" / "archetype-aware"

# ---------------------------------------------------------------------------
# Required personas spec
# ---------------------------------------------------------------------------

_REQUIRED_PERSONAS: tuple[str, ...] = (
    "lead-pricing-guilt-coach-ar.yaml",
    "member-drift-nutrition-cl.yaml",
    "lead-skeptical-productivity-mx.yaml",
    "member-tier-upgrade-coach-ar.yaml",
    "lead-prompt-injection-attempt.yaml",
    "community-spammer-mx.yaml",
    "community-doxxing-attempt-cl.yaml",
    "member-vulnerable-disclosure-cl.yaml",
)

# AR personas that MUST have voseo-allowed magic comment (line-level check)
_AR_PERSONAS_REQUIRING_VOSEO_COMMENT: tuple[str, ...] = (
    "lead-pricing-guilt-coach-ar.yaml",
    "member-tier-upgrade-coach-ar.yaml",
)

# persona_kind distribution requirements
_MIN_HAPPY = 2
_MIN_NURTURE = 1
_MIN_ADVERSARIAL = 5


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _load_persona_yaml(basename: str) -> dict[str, Any]:
    """Load and parse a persona YAML by basename."""
    path = _PERSONAS_DIR / basename
    assert path.is_file(), (
        f"Persona YAML not found: {path}. Story 12 T-rubric-1 deliverable absent."
    )
    content = path.read_text(encoding="utf-8")
    # Strip magic comments and other non-YAML lines before parsing
    lines = content.splitlines()
    yaml_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        # Skip magic comment lines (# voseo-allowed: ...)
        if stripped.startswith("# voseo-allowed") or stripped.startswith("<!-- voseo-allowed"):
            continue
        yaml_lines.append(line)
    parsed = yaml.safe_load("\n".join(yaml_lines))
    assert isinstance(parsed, dict), f"Persona YAML {basename} did not parse to dict: {type(parsed)}"
    return parsed


def _has_voseo_allowed_comment(basename: str) -> bool:
    """Return True if the file has a voseo-allowed magic comment."""
    path = _PERSONAS_DIR / basename
    if not path.is_file():
        return False
    content = path.read_text(encoding="utf-8")
    import re
    pattern = re.compile(r"(#\s*voseo-allowed([: \t]|$)|<!--\s*voseo-allowed[^>]*-->)")
    return bool(pattern.search(content))


# ════════════════════════════════════════════════════════════════════════
# File existence
# ════════════════════════════════════════════════════════════════════════


@pytest.mark.parametrize("basename", _REQUIRED_PERSONAS)
def test_comunify_persona_yaml_exists(basename: str) -> None:
    """Each required comunify persona YAML MUST exist at canonical path."""
    path = _PERSONAS_DIR / basename
    assert path.is_file(), (
        f"Persona YAML missing: {path}. "
        f"Story 12 T-rubric-1 requires 8 archetype-aware personas. Missing: {basename}"
    )


# ════════════════════════════════════════════════════════════════════════
# Schema validation
# ════════════════════════════════════════════════════════════════════════


@pytest.mark.parametrize("basename", _REQUIRED_PERSONAS)
def test_comunify_persona_yaml_schema_version_2(basename: str) -> None:
    """Each persona YAML MUST declare ``schema_version: 2``."""
    data = _load_persona_yaml(basename)
    actual = data.get("schema_version")
    assert actual == 2, (
        f"{basename}: schema_version={actual!r} (expected 2). "
        "All Story 12 personas use schema_version 2 (T-rubric-1 requirement)."
    )


@pytest.mark.parametrize("basename", _REQUIRED_PERSONAS)
def test_comunify_persona_yaml_has_required_fields(basename: str) -> None:
    """Each persona YAML MUST have required fields: id, name, actor_goal, dialect_code, persona_kind."""
    data = _load_persona_yaml(basename)
    required_fields = ["id", "name", "actor_goal", "dialect_code", "persona_kind"]
    missing: list[str] = [f for f in required_fields if f not in data]
    assert not missing, (
        f"{basename}: missing required fields {missing}. "
        "All Story 12 personas must declare: id, name, actor_goal, dialect_code, persona_kind."
    )


@pytest.mark.parametrize("basename", _REQUIRED_PERSONAS)
def test_comunify_persona_yaml_persona_kind_valid(basename: str) -> None:
    """Each persona YAML persona_kind MUST be one of: happy, nurture, adversarial."""
    data = _load_persona_yaml(basename)
    actual = data.get("persona_kind")
    valid_kinds = {"happy", "nurture", "adversarial"}
    assert actual in valid_kinds, (
        f"{basename}: persona_kind={actual!r} not in {sorted(valid_kinds)}."
    )


@pytest.mark.parametrize("basename", _REQUIRED_PERSONAS)
def test_comunify_persona_yaml_has_metadata_story_origin(basename: str) -> None:
    """Each persona YAML MUST declare ``metadata.story_origin: luana-comunify-bootstrap T-rubric-1``."""
    data = _load_persona_yaml(basename)
    metadata = data.get("metadata", {})
    assert isinstance(metadata, dict), f"{basename}: metadata field expected dict, got {type(metadata).__name__}"
    origin = metadata.get("story_origin", "")
    assert "luana-comunify-bootstrap" in str(origin), (
        f"{basename}: metadata.story_origin={origin!r} should reference 'luana-comunify-bootstrap'."
    )


# ════════════════════════════════════════════════════════════════════════
# AR personas voseo-allowed magic comment
# ════════════════════════════════════════════════════════════════════════


@pytest.mark.parametrize("basename", _AR_PERSONAS_REQUIRING_VOSEO_COMMENT)
def test_comunify_ar_persona_has_voseo_allowed_comment(basename: str) -> None:
    """AR persona YAMLs (es-AR dialect) MUST have ``# voseo-allowed: ...`` comment on line 1 or 2.

    Per `.claude/rules/spanish-text.md` magic comment rule: AR personas may contain
    voseo (es-AR dialect) but must declare it explicitly to pass pre-commit hook.
    """
    assert _has_voseo_allowed_comment(basename), (
        f"{basename}: AR persona YAML must have '# voseo-allowed: ...' magic comment. "
        "Per .claude/rules/spanish-text.md: AR archetype dialect YAMLs require this "
        "comment to pass the pre-commit hook voseo check."
    )


# ════════════════════════════════════════════════════════════════════════
# persona_kind distribution
# ════════════════════════════════════════════════════════════════════════


def test_comunify_personas_happy_distribution() -> None:
    """At least {MIN_HAPPY} personas must be persona_kind=happy."""
    happy_count = sum(
        1
        for b in _REQUIRED_PERSONAS
        if (_PERSONAS_DIR / b).is_file()
        and _load_persona_yaml(b).get("persona_kind") == "happy"
    )
    assert happy_count >= _MIN_HAPPY, (
        f"Only {happy_count} happy personas found (need ≥{_MIN_HAPPY}). "
        "Story 12 requires coverage of happy qualification + upsell scenarios."
    )


def test_comunify_personas_nurture_distribution() -> None:
    """At least {MIN_NURTURE} personas must be persona_kind=nurture."""
    nurture_count = sum(
        1
        for b in _REQUIRED_PERSONAS
        if (_PERSONAS_DIR / b).is_file()
        and _load_persona_yaml(b).get("persona_kind") == "nurture"
    )
    assert nurture_count >= _MIN_NURTURE, (
        f"Only {nurture_count} nurture personas found (need ≥{_MIN_NURTURE}). "
        "Story 12 requires coverage of drift re-engagement scenario."
    )


def test_comunify_personas_adversarial_distribution() -> None:
    """At least {MIN_ADVERSARIAL} personas must be persona_kind=adversarial."""
    adversarial_count = sum(
        1
        for b in _REQUIRED_PERSONAS
        if (_PERSONAS_DIR / b).is_file()
        and _load_persona_yaml(b).get("persona_kind") == "adversarial"
    )
    assert adversarial_count >= _MIN_ADVERSARIAL, (
        f"Only {adversarial_count} adversarial personas found (need ≥{_MIN_ADVERSARIAL}). "
        "Story 12 requires: pricing-guilt, prompt-injection, spammer, doxxing, vulnerable-disclosure."
    )


# ════════════════════════════════════════════════════════════════════════
# Comunify tenant coverage
# ════════════════════════════════════════════════════════════════════════


def test_comunify_personas_cover_all_three_tenants() -> None:
    """Personas must cover all 3 comunify fixture tenants: anabella, trini, pablo."""
    tenant_slugs: set[str] = set()
    for basename in _REQUIRED_PERSONAS:
        if not (_PERSONAS_DIR / basename).is_file():
            continue
        data = _load_persona_yaml(basename)
        metadata = data.get("metadata", {})
        slug = str(metadata.get("tenant_slug", ""))
        if slug:
            tenant_slugs.add(slug)

    required_tenant_substrings = {"anabella", "trini", "pablo"}
    missing_tenants: list[str] = []
    for req in required_tenant_substrings:
        if not any(req in slug for slug in tenant_slugs):
            missing_tenants.append(req)

    assert not missing_tenants, (
        f"Missing tenant coverage in personas: {missing_tenants}. "
        f"Found tenant slugs: {sorted(tenant_slugs)}. "
        "Story 12 requires personas for all 3 comunify tenants (anabella-coaching-ar, "
        "trini-nutrition-cl, pablo-productividad-mx)."
    )
