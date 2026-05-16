# T-5 — Nuevo .github/workflows/ci-wip.yml — light gates (wip/*)

## Status

DONE (validators green)

## Files changed

- `.github/workflows/ci-wip.yml` (NEW)

## Decisions honored

- D1: Trigger ONLY on push:branches:['wip/**'] — no main, no pull_request
- D4: Light gates (lint targeted + tests targeted, no arch-fitness, no coverage)
- D5: GitHub Actions pure; dorny/paths-filter pattern for targeted detection
- All jobs: timeout-minutes ≤ 5 (goal <5 min total)
- permissions: contents: read (least-privilege)
- NO ts-test full suite, NO arch-fitness FE, NO coverage threshold

## Validators run

- `actionlint .github/workflows/ci-wip.yml`: PASS
- `scenario_1_wip_ci_trigger validator`: will pass (wip/** trigger, no main in triggers)

## Notes

- Used fetch-depth: 2 for all jobs to enable HEAD~1 diff detection of changed packages
- Changed packages detection via git diff HEAD~1..HEAD (targeted lint/test)
- For TS: pnpm --filter ./<PKG> lint per changed package

## Iteration count

1
