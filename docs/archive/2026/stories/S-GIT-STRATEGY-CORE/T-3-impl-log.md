# T-3 — Update .claude/rules/git-haiku-delegation.md (3 destinos: main/wip/release)

## Status

DONE (validators green)

## Files changed

- `.claude/rules/git-haiku-delegation.md` (MODIFY) — updated guardrails + checklist for triple-branch destinations

## Decisions honored

- D1: Guardrails generalized to 3 destinations (wip/*, main, release/*)
- D4: Pre-spawn checklist step 2 updated from 'verify branch = development' to 'verify branch type'
- Removed 'git push origin development' hardcode from guardrail template
- Replaced with 'git push origin <CURRENT_BRANCH>' with 3-destination table
- Added step 2 in Steps: 'git branch --show-current — confirm current branch matches destination'
- Failure handling: 'branch mismatch' updated to verify branch type (wip/*/main/release/*)

## Validators run

- `haiku_delegation_3_destinos` validator: PASS (wip/, release/, main all present, 'push origin development' removed)

## Notes

- Rest of the file preserved (cost saving table, anti-patterns, spawn template, references)
- References section kept as-is (git-safety.md reference updated implicitly by that file's rewrite)

## Iteration count

1
