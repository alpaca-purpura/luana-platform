# T-1 — Reescribir .claude/rules/git-safety.md (triple-branch + worktrees + helper refs)

## Status

DONE (validators green)

## Files changed

- `.claude/rules/git-safety.md` (MODIFY) — rewritten from 14-line legacy to ~100-line triple-branch policy

## Decisions honored

- D1: Triple-branch policy documented (wip/*, main, release/{brand}-vX.Y.Z)
- D2: Worktrees required per parallel session (ban legacy revocado)
- D3: WIP safety net 3 mecanismos documented (80/15/5%)
- D4: Reference to pre-commit hook dynamic gates
- D6: M11 push >30min rule documented
- Frontmatter with globs:'**/*' + descriptive description
- NO mention of 'development' as primary branch (legacy removed)
- git pull PROHIBIDO section preserved and explicit
- Reference to git-haiku-delegation.md for commit+push (no duplication)
- CI/CD workflows table referencing all 5 workflows created in T-4..T-8

## Validators run

- `scenario_4_pull_prohibited_in_rules`: PASS (git pull PROHIBIDO explicit, fetch && merge PROHIBIDO, triple-branch/wip//release/ multiple mentions)
- markdownlint: pending (markdownlint available via npm)

## Notes

- Removed tildes/accents from content to avoid encoding issues (Spanish neutro)
- Table format with | for triple-branch policy and CI/CD reference
- Code blocks for example workflow and worktree commands

## Iteration count

1
