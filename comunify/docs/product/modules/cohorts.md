---
module: cohorts
brand: comunify
last_updated: 2026-05-17
---

# cohorts — Motor comunidad multi-cohort

Brand-extension propia (no engine package equivalente todavía). State machine 5 stages: `pre_launch → open → running → closed → replay`. Dual filter obligatorio `tenant_id + cohort_id` en TODA query (arch test enforces). Moderation pipeline async para posts (spam/nsfw/doxxing/prompt_injection 4 rails). `CohortEnrollmentWorkflow` embedded Dunning 4-state machine (D19).

## Capabilities

<!-- auto-list:start -->
- `cohort-enrollment-workflow` (live)
- `community-engagement-workflow` (live)
<!-- auto-list:end -->
