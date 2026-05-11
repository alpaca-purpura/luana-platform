"""
Architecture fitness test: .claude-shared governance.
Validates that .claude-shared/{rules,skills,agents}/ exist with meaningful content.
These directories contain the shared Claude Code rules and skills for all workspace members.
"""

from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent.parent
CLAUDE_SHARED = REPO_ROOT / ".claude-shared"
CLAUDE_DIR = REPO_ROOT / ".claude"

MIN_RULES = 20
MIN_SKILLS = 10


def test_claude_shared_rules_dir_exists():
    """`.claude-shared/rules/` directory exists."""
    rules_dir = CLAUDE_SHARED / "rules"
    assert rules_dir.is_dir(), (
        f".claude-shared/rules/ not found at {rules_dir}. "
        "F-4 validator requires .claude-shared/rules/ to exist with content."
    )


def test_claude_shared_skills_dir_exists():
    """`.claude-shared/skills/` directory exists."""
    skills_dir = CLAUDE_SHARED / "skills"
    assert skills_dir.is_dir(), (
        f".claude-shared/skills/ not found at {skills_dir}. "
        "F-4 validator requires .claude-shared/skills/ to exist with content."
    )


def test_claude_shared_agents_dir_exists():
    """`.claude-shared/agents/` directory exists."""
    agents_dir = CLAUDE_SHARED / "agents"
    assert agents_dir.is_dir(), (
        f".claude-shared/agents/ not found at {agents_dir}. "
        "F-4 validator requires .claude-shared/agents/ to exist with content."
    )


def test_rules_dir_has_minimum_files():
    """`.claude-shared/rules/` has more than 20 files (meaningful content)."""
    rules_dir = CLAUDE_SHARED / "rules"
    rule_files = list(rules_dir.iterdir())
    assert len(rule_files) > MIN_RULES, (
        f".claude-shared/rules/ has only {len(rule_files)} files, "
        f"expected >{MIN_RULES}. Rules were not properly lifted from AISALESHT."
    )


def test_skills_dir_has_minimum_entries():
    """`.claude-shared/skills/` has more than 10 skill directories."""
    skills_dir = CLAUDE_SHARED / "skills"
    skill_entries = [e for e in skills_dir.iterdir() if e.is_dir()]
    assert len(skill_entries) > MIN_SKILLS, (
        f".claude-shared/skills/ has only {len(skill_entries)} skill directories, "
        f"expected >{MIN_SKILLS}. Skills were not properly lifted from AISALESHT."
    )


def test_claude_dir_exists_as_copy():
    """`.claude/` exists (copy or symlink to .claude-shared/)."""
    assert CLAUDE_DIR.exists(), (
        f".claude/ not found at {CLAUDE_DIR}. "
        "F-5 validator requires .claude/ to exist (copy or symlink of .claude-shared/)."
    )
    rules_in_claude = CLAUDE_DIR / "rules"
    assert rules_in_claude.exists(), (
        f".claude/rules not found at {rules_in_claude}. .claude/ must mirror .claude-shared/ content."
    )


def test_key_rule_exists_parallel_safety():
    """`.claude-shared/rules/parallel-safety.md` exists (smoke check for rule content)."""
    parallel_safety = CLAUDE_SHARED / "rules" / "parallel-safety.md"
    assert parallel_safety.is_file(), (
        f"parallel-safety.md not found at {parallel_safety}. Critical rule should have been lifted from AISALESHT."
    )
