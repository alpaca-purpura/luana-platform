<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# Backend Code Review — T-mk-be-6

**Story:** vitalia-slice-1-marketing
**Ticket:** T-mk-be-6 (Wave 3 — 4 ARQ cron jobs with `@cron_envelope`)
**Date:** 2026-05-20
**Brand:** vitalia
**Commit:** 8471b25
**Files Reviewed:** 7 (4 cron jobs + arq_settings update + test_marketing_crons.py + test_arq_settings.py update)
**Domains touched:** marketing cron workers (Meta/Google sync · Lucas daily sweep · referrals value sync)
**Skills consulted:** backend-expert (cron pattern), hipaa-lite (sanitize + dual filter + pgcrypto), anti-duplication (engine cron_envelope consumer), tessl__graceful-degradation (soft-fail per tenant)
**Verdict:** **CHANGES_REQUESTED** (referrals_value_sync cron will fail at runtime — references `conversion_value_cents` field not in ReferralModel; `signed_up` status not in ReferralStatus; lucas_daily_analysis_sweep instantiates wrong service class with missing method)

## /test-backend Gate Status (per gate-output.json iter=1)

| Gate | Result | Detail |
|---|---|---|
| ruff-check | PASS | 0 errors |
| ruff-format | PASS | 0 reformats |
| pytest-architecture | PASS | 270/270 |
| pytest-marketing-module (workers) | PASS | 13 marketing crons + 10 arq_settings = 23 tests |

Note: All cron tests use `MagicMock` factories that respond to any attribute name; tests don't validate real schema or service signatures.

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | DDD Layer Compliance | FAIL | lucas_daily_analysis_sweep instantiates `LucasRecommendationsService()` with no args (signature requires `repo` + `audit_writer`); calls `run_daily_sweep` method that doesn't exist on that class |
| 2 | Tenant Isolation | PASS | All upserts and queries pass `tenant_id + clinic_id`; SQL queries use `_appointment_repo.sum_conversion_value_for_patient` with explicit dual filter |
| 3 | Soft Deletes | PASS | `_get_all_active_meta_connections` filters `deleted_at IS NULL`; same for `_get_active_clinics` |
| 4 | Code Quality | PASS | Ruff/format clean. Each cron has `try/except` soft-fail per tenant |
| 5 | SQLAlchemy 2.0 | PASS | `select()` + `text()` for raw SQL where needed |
| 6 | Async Consistency | PASS | All `async def`, `async with get_db_session()` |
| 7 | Pydantic v2 / PII | N/A | |
| 8 | Migration Quality | N/A | |
| 9 | Security (PII) | PASS | `raw_payload` sanitized (excludes `access_token`, `token`, `oauth_token` keys before persisting); structlog tenant_id/clinic_id only — no token values |
| 10 | Tests / TDD | WARN | 13 tests use MagicMock — pass regardless of real schema/service contract; broken referrals_value_sync still passes its test |
| 11 | Cross-cutting (currency/UTC) | PASS | `currency=row.get("currency")` from provider (no hardcoded); UTC `datetime.now(UTC)` throughout; cron_envelope ttl in seconds |
| 12 | Mirror detection | PASS | `cron_envelope` imported from engine `luana_core_platform.workers.cron_envelope` (no brand mirror) |

## Cross-scope flags

None — all cron files brand-local. Engine `cron_envelope` consumed via Python import. No engine edits.

## Findings

### FAIL: `referrals_value_sync` references non-existent fields/values — cron is broken at runtime
**Category:** 1 (DDD/Contract) + 10 (Tests)
**File:** `vitalia/backend/src/modules/vitalia/marketing/jobs/referrals_value_sync.py:183-194`
**Issue:** The cron reads/writes `referral.conversion_value_cents` (lines 183, 190) and checks `referral.status == "signed_up"` (line 189). Neither exists:
- `ReferralModel` (T-mk-be-2) has NO `conversion_value_cents` column.
- `ReferralStatus` enum (T-mk-be-1) has NO `SIGNED_UP = "signed_up"` value; only `PENDING | CONVERTED | EXPIRED`.
- Migration 029 doesn't add the column either.

Additionally, the SQL query `_AppointmentRepository.sum_conversion_value_for_patient` does:
```sql
SELECT COALESCE(SUM(conversion_value_cents), 0) AS total
FROM vitalia_appointments
WHERE tenant_id = ... AND clinic_id = ... AND patient_id = :patient_id ...
```
This assumes `vitalia_appointments.conversion_value_cents` column exists. There's NO migration that adds it. At runtime, the cron raises `psycopg.errors.UndefinedColumn` → caught by the per-referral soft-fail handler → logs `referrals_value_sync.referral_error` for every referral. Cron silently no-ops forever.

Tests pass because `_make_referral()` factory creates `MagicMock` with `conversion_value_cents=None` attribute (allowed because MagicMock auto-vivifies attributes).

**Fix:** Coordinate with T-mk-be-2 fix:
1. Add migrations: `conversion_value_cents BIGINT NULL` to BOTH `vitalia_referrals` AND `vitalia_appointments`.
2. Add `conversion_value_cents` to `ReferralModel`.
3. Add `SIGNED_UP = "signed_up"` to `ReferralStatus` (or rename `PENDING → OPEN/SHARED/SIGNED_UP` per spec § 2.4).
4. Rewrite cron test to assert against real `ReferralModel` schema (TDD must fail RED first if columns missing).
**Skill ref:** backend-ddd.md, arch spec § 2.4, hotfix-repro-mandatory.md.

### FAIL: `lucas_daily_analysis_sweep` instantiates wrong class and calls non-existent method
**Category:** 1 (DDD/Contract)
**File:** `vitalia/backend/src/modules/vitalia/marketing/jobs/lucas_daily_analysis_sweep.py:87-93, 156`
**Issue:** `_get_orchestrator()` returns `LucasRecommendationsService()` (no args!). Two problems:
1. `LucasRecommendationsService.__init__(*, repo: object, audit_writer: object)` requires 2 keyword-only args → `LucasRecommendationsService()` raises `TypeError` at first cron tick.
2. Line 156 calls `orchestrator.run_daily_sweep(tenant_id=..., clinic_id=..., cooldown_kinds=...)`. `LucasRecommendationsService` (in T-mk-be-3) defines `list_open_by_stage`, `approve`, `reject`, `undo` — but NO `run_daily_sweep`.

Brief CONTEXT-BRIEF.md § 7 and arch spec § 8.3 both say the cron should call `LucasOrchestratorService.run_daily_sweep` from the **agentic** module: `vitalia/backend/src/modules/vitalia/agentic/lucas/application/services/lucas_orchestrator_service.py` (shipped 2026-05-18 in `vitalia-copilot-tools-impl`).

Tests pass because `test_marketing_crons.py::TestLucasDailyAnalysisSweep` patches `_get_orchestrator` with `AsyncMock` — the real factory is never executed.

**Fix:**
- Replace `_get_orchestrator` import path:
  ```python
  def _get_orchestrator() -> Any:
      from src.modules.vitalia.agentic.lucas.application.services.lucas_orchestrator_service import (
          LucasOrchestratorService,
      )
      # Read shipped class signature — likely needs (db_session, llm_client, rec_repo, budget_guard, …)
      return LucasOrchestratorService(...)
  ```
- Builder MUST read the actual signature of `LucasOrchestratorService` (shipped 2026-05-18) before wiring.
- Verify `run_daily_sweep(tenant_id, clinic_id, cooldown_kinds)` signature matches what the cron calls.
**Skill ref:** anti-duplication.md (consume engine/agentic services via concrete import, no re-implementation), brief § 7.

### WARN: `_get_active_clinics` uses raw SQL bypassing `CompoundScopeRepositoryBase` pattern
**Category:** 1 (DDD) + Tenant Isolation
**File:** `lucas_daily_analysis_sweep.py:57-78`
**Issue:** Cross-tenant sweep is unavoidable for daily cron, but the raw SQL pattern (`text("SELECT DISTINCT tenant_id, clinic_id FROM vitalia_channel_sync_state ...")`) doesn't use `CompoundScopeRepositoryBase`. This is acceptable for a cron's bootstrap query (sweep all clinics), but the comment/docstring should justify why dual filter is intentionally NOT applied here. Hipaa-lite rule allows this for legitimate cross-tenant maintenance jobs.

**Fix (suggested):** Add explicit comment: "Cross-tenant sweep intentional — cron iterates ALL active clinics; per-clinic processing inside the loop enforces dual filter via repository". Make this convention explicit so future readers don't mistake it for a tenant-isolation bug.

### WARN: `LucasRecommendationGenerated` event constructor signature mismatch
**Category:** Contract / runtime correctness
**File:** `lucas_daily_analysis_sweep.py:165-173`
**Issue:** Cron calls:
```python
LucasRecommendationGenerated(
    tenant_id=tenant_id,
    recommendation_id=getattr(rec, "id", None) or rec,
    stage=getattr(rec, "stage", "attract"),  # ← passes string, not BowtieStage enum
    ...
)
```
But the event constructor (`domain/events.py:31-65`) types `stage: BowtieStage` and calls `stage.value` inside payload. Passing a string `"attract"` would fail or auto-coerce silently.

Also: `getattr(rec, "id", None) or rec` — if `rec` is a UUID itself (string-stringy), this works, but if `rec` is None or a dict, this is fragile.

**Fix:** Force enum conversion + handle types properly:
```python
LucasRecommendationGenerated(
    tenant_id=tenant_id,
    recommendation_id=rec.id,  # assume rec is a model after orchestrator returns
    stage=BowtieStage(rec.stage),
    recommendation_kind=rec.recommendation_kind,
    priority=rec.priority,
)
```

### WARN: `referrals_value_sync.referral.conversion_value_cents = total_value` mutates ORM model and saves without explicit transaction commit
**Category:** Async patterns + transaction safety
**File:** `referrals_value_sync.py:190-197`
**Issue:** Cron assigns `referral.conversion_value_cents = total_value` then calls `await referral_repo.save(referral)`. The `save()` method (T-mk-be-2) does `session.merge(...)` + `flush()` but doesn't commit. With ARQ cron jobs, the session lifecycle isn't explicit here — could leave uncommitted state.

**Fix (suggested):** Use `async with get_db_session() as session:` and ensure `await session.commit()` at end of loop (or use job-level session manager). Document.

## Contract Compliance (business surface only)

- [x] 4 cron jobs decorated `@cron_envelope("vitalia.cron.<name>", ttl=…)` from engine
- [x] Soft-fail per tenant (per-iteration `try/except` + structlog warning + continue)
- [x] Outbox events emitted via `adapter_bus.publish(ChannelSync*/Lucas*/Referral*)`
- [x] `raw_payload` sanitized to exclude token keys
- [x] Idempotent ON CONFLICT upsert (`channel_metric_repository.upsert_metric`)
- [x] Cron schedule registered in `arq_settings.WorkerSettings.cron_jobs` (every 4h with offset; daily 06:00 + 10:00 UTC)
- [x] Anti-duplication: NO brand-local `idempotent_cron` mirror (deprecated)
- [ ] **FAIL: `referrals_value_sync` references columns not in schema → cron is non-functional**
- [ ] **FAIL: `lucas_daily_analysis_sweep` instantiates wrong class missing method**
- [ ] WARN: Cross-tenant sweep convention undocumented
- [ ] WARN: `LucasRecommendationGenerated` event constructor signature mismatch

## Allowlist Movement

- [x] No allowlist grew

## Native-First Audit

- [x] No `docker exec` in commits
- [x] No `git add .` / `-A` / `-u` in commits

## Verdict Math

- Cat 1 (referrals_value_sync broken referenc + lucas_daily wrong class + missing method) = **FAIL**
- Cat 10 (tests pass against MagicMock — don't validate schema or service signatures) = **WARN**
- Cat 1 cross-tenant pattern + event signature = **WARN**
- Other PASS
- Overall: **CHANGES_REQUESTED** — Case B (must coordinate fix with T-mk-be-2 + T-mk-be-3)

## Action policy

Per `.claude/rules/auditor-self-fix-policy.md` § NUNCA self-fix #4 + #5 (modify SA query). Spawn dev-team.

**Recommended handoff to `/dev-team` (combined with T-mk-be-2 + T-mk-be-3 + T-mk-be-5 — these tickets must be co-fixed):**

Order:
1. T-mk-be-2 schema fix (add `conversion_value_cents`, `currency`, `shared_at`, `signed_up_at` columns + migration 031)
2. T-mk-be-1 enum fix (BowtieStage 5 values + ReferralStatus add `SIGNED_UP`)
3. T-mk-be-3 service wiring fix (import real Lucas* services; rename methods to match routes)
4. T-mk-be-5 routes fix (replace MagicMock factories with FastAPI Depends real DI)
5. T-mk-be-6 cron fix:
   - In `lucas_daily_analysis_sweep._get_orchestrator()`: import `LucasOrchestratorService` from agentic module, instantiate with real deps.
   - In `referrals_value_sync`: use the now-existing `conversion_value_cents` field + `SIGNED_UP` status.
   - Fix `LucasRecommendationGenerated` constructor call (use `BowtieStage(rec.stage)` enum, not string).
   - Add explicit comment justifying cross-tenant raw SQL in `_get_active_clinics`.
   - Add `async with get_db_session()` + explicit `commit()` if needed.
6. Replace `test_marketing_crons.py` MagicMock factories with real ORM model instances (validates schema at test time, fails fast if columns missing).
7. Re-run gate-runner + downstream regression scope.
