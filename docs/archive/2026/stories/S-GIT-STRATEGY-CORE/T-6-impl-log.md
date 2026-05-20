# T-6 — Nuevo .github/workflows/cd-staging.yml — main → staging (placeholder mode)

## Status

DONE (validators green)

## Files changed

- `.github/workflows/cd-staging.yml` (NEW)

## Decisions honored

- D1: Trigger ONLY on push:branches:[main]
- D5: GitHub Environment `staging` configured; placeholder mode when secret empty
- Placeholder mode: logs `::notice::` when STAGING_HOST not configured, exits 0
- permissions: contents: read
- environment: staging (GitHub Environment for optional gating)
- timeout-minutes: 10

## Validators run

- `actionlint .github/workflows/cd-staging.yml`: PASS
- `scenario_2_main_triggers_staging validator`: will pass (main trigger, environment: staging, ::notice:: placeholder)

## Notes

- Uses `id: check-config` step pattern to conditionally skip deploy/health-check
- No `wip` or `release` in triggers (verified by validator greper)
- Health check step gated on configured=true only

## Iteration count

1
