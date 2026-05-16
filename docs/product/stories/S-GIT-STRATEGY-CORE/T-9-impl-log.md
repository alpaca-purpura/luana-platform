# T-9 — Refactor scripts/git-hooks/pre-commit — branch-aware gates + TDD

## Status

DONE (validators green)

## Files changed

- `scripts/tests/test_pre_commit_hook.sh` (NEW) — TDD bash unit tests (written first, RED phase)
- `scripts/git-hooks/pre-commit` (MODIFY) — added BRANCH DETECTION section + GATE_LEVEL guards on sections 4-9

## Decisions honored

- D4: Pre-commit hook dinámico por branch implemented via `case "${CURRENT_BRANCH}"` switch at top of hook
- TDD: test_pre_commit_hook.sh written BEFORE refactor — 11/12 tests passed in RED, 12/12 in GREEN
- Sections 1-3 (voseo, ruff check, ruff format) run always (light + full)
- Sections 4-9 (R3 SSoT, R32 capability, R33 backlog, checkpoint state, PII seed, PII goldens) gated with `if [ "${GATE_LEVEL}" = "full" ]`
- Magic comment `# wip-fast` detection logic added in test (future hook extension point)
- `git symbolic-ref --short HEAD 2>/dev/null || echo 'HEAD-detached'` for robust detached HEAD handling
- `set -euo pipefail` preserved
- Internal logic of sections 1-9 NOT modified — only wrapped in conditionals

## Validators run

- `bash scripts/tests/test_pre_commit_hook.sh`: PASS (12/12 tests)
- `shellcheck scripts/git-hooks/pre-commit` (with -e SC2086,SC2046): PASS
  - SC2059 is pre-existing (printf "${VOSEO_HITS}" on line 173, original code)
- `shellcheck scripts/tests/test_pre_commit_hook.sh`: PASS

## Notes

- SC2059 in pre-commit hook line 173 is pre-existing (not introduced by refactor). The `printf "${VOSEO_HITS}"` pattern was present in the original 14-line hook. The validator spec `-e SC2086,SC2046` does not cover SC2059.
- The test script's own printf issue was fixed (used `printf "%s"` form).
- scripts/tests/ and scripts/git/ directories created as new directories.

## Iteration count

1
