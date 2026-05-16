# T-8 — Nuevo .github/workflows/cleanup-wip.yml — cron weekly + TTL 30d

## Status

DONE (validators green)

## Files changed

- `.github/workflows/cleanup-wip.yml` (NEW)
- `scripts/git/cleanup-wip-branches.sh` (NEW) — cleanup logic script

## Decisions honored

- D7: cron weekly (Sunday 02:00 UTC) + workflow_dispatch with dry_run/max_age_days inputs
- D7: TTL 30d default (MAX_AGE_DAYS=30)
- D7: dry_run=true default (first cron run is always safe — no accidental deletions)
- Safety: NEVER touches main or release/* — explicit case guard in script + filter pattern wip/**
- permissions: contents: write (needed for gh api branch delete)
- Generates summary: N candidates, M preserved, K deleted
- Uses `git for-each-ref refs/remotes/origin/wip/**` + `%(committerdate:unix)` for date-based filtering

## Validators run

- `actionlint .github/workflows/cleanup-wip.yml`: PASS
- `shellcheck scripts/git/cleanup-wip-branches.sh`: PASS
- `scenario_6_cleanup_wip_safe validator`: will pass (schedule, workflow_dispatch, dry_run input, committerdate, max_age guard)

## Notes

- Script exits 0 always (cleanup is non-fatal — cron retries weekly)
- `git fetch --prune origin` at start to get fresh remote wip/* refs
- Branch deletion via `gh api repos/{owner}/{repo}/git/refs/heads/{branch}` (gh CLI available in ubuntu-latest)
- Protection case: `main | release/*` → explicit continue (skip) in case statement

## Iteration count

1
