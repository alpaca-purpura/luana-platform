# T-7 — Nuevo .github/workflows/cd-prod.yml — release/* → prod brand-específico

## Status

DONE (validators green)

## Files changed

- `.github/workflows/cd-prod.yml` (NEW)

## Decisions honored

- D1: Trigger ONLY on push:branches:['release/**'] — no main, no wip
- D5: dorny/paths-filter@v3 for selective deploy by brand; GitHub Environments per brand
- D6: Brand + version extracted via BASH_REMATCH regex from branch name
- Placeholder mode: logs ::notice:: when PROD_HOST not configured per environment
- TODO comment for S-CICD-DEPLOY _deploy-brand.yml reusable workflow
- permissions: contents: read

## Validators run

- `actionlint .github/workflows/cd-prod.yml`: PASS
- `scenario_3_release_branch_to_prod validator`: will pass (release/** trigger, BASH_REMATCH, dorny/paths-filter, environment: prod-{brand})

## Notes

- Job `detect-brand-changes` uses dorny/paths-filter with static filters for all 10 known brands + core
- Job `deploy-brand-prod`: environment: prod-${{ needs.parse-release.outputs.brand }} (dynamic per brand)
- parse-release fails fast with ::error:: if branch name doesn't match convention
- All 10 brand paths included in filter (nicolify, vitalia, comunify, lupulo, core, saasora, inmoflow, retailly, fixia, guestly, fitflow)

## Iteration count

1
