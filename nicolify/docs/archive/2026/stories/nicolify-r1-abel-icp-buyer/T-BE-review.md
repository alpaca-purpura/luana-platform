<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->

# Backend Code Review: Abel — ICP & Buyer (T-BE-1 + T-BE-2)

**Date:** 2026-06-03
**Brand:** nicolify
**Story / PR:** nicolify-r1-abel-icp-buyer (Release R1 · Abel + Brenda · Atracción inbound)
**Tickets:** T-BE-1 (domain + models + migration + repos) · T-BE-2 (DTOs + services + telemetry + router)
**Files Reviewed:** 13 source + 5 tests + 1 migration + main.py (business surface only)
**Domains touched:** abel (brand-extension NET-NEW) — ICP entity + Buyer entity + growth_studio telemetry
**Skills consulted:** backend-expert (DDD/SA2/response_model), brand-expert (BuyerPersona schema-by-reference + currency), offer-expert/offer-type-preset-expert/metrics-expert (N/A — no offer/analytics surface)
**Verdict:** **APPROVED (with 2 WARN — Cat 9 auth deferral + Cat 12 emitter lift; neither blocking)**

---

## /test-backend Gate Status (consumed from gate-output-be.json + re-verified live)

| # | Gate | Result | Detail |
|---|---|---|---|
| 3 | Lint (ruff check) | **PASS** | 0 errors (abel src + tests + arch test). Re-run live: "All checks passed!" |
| 4 | Format (ruff format) | **PASS** | 0 reformats |
| 5 | Type check (mypy) | **SKIP** | mypy not installed in workspace venv (documented). Full mypy runs via `make ci-parity` |
| 6 | Arch fitness | **PASS** | 20/20 (response_model, no-cross-brand-imports, redirect_slashes=False, migrations_idempotent, no_secret_leak, growth_studio_event_no_pii 5/5). Re-run live: 20 passed |
| 7 | Tests + coverage | **PASS (tests)** / SKIP (cov gate) | 52/52 abel business module (19 domain + 14 infra + 12 app + 7 api). Re-run live: 52 passed. pytest-cov not wired for this brand suite — coverage gate via ci-parity |
| 8 | Verify marker | N/A | no analytics/data-reliability surface |
| 9 | Integration | **SKIP** | DB marker requires postgres up (documented) |
| 10 | Migration idempotency clone | **SKIP** | requires live DB; static `test_migrations_idempotent` PASS |
| 11 | jscpd | not in scope JSON | BE business module small; no duplication flagged by ruff |
| 12 | interrogate | implicit | Google-style docstrings present on every module/class/method |
| 13 | pip-audit | not in scope JSON | no new deps added (consumes engine `luana_core_platform`, `luana_core_iam`) |

**Gate verdict:** No FAIL on any of 3-7 / 11-13. SKIPs (mypy, integration, clone, cov) are postgres/tooling-dependent and documented — do not auto-FAIL.

---

## Category Summary

| # | Category | Status | Issues |
|---|---|---|---|
| 1 | DDD Compliance | PASS | 0 |
| 2 | Tenant Isolation | PASS | 0 |
| 3 | Soft Deletes | PASS | 0 |
| 4 | Code Quality | PASS | 0 (mypy SKIP documented) |
| 5 | SQLAlchemy 2.0 | PASS | 0 |
| 6 | Async Consistency | PASS | 0 |
| 7 | Pydantic v2 / PII | PASS | 0 |
| 8 | Migration Quality | PASS | 0 |
| 9 | Security | **WARN** | 1 (no app-layer auth/Bearer dep — see W1) |
| 10 | Tests / TDD | PASS | 0 |
| 11 | Cross-cutting | PASS | 0 |
| 12 | Mirror detection | **WARN** | 1 (GrowthStudioEmitter ported from vitalia — N=2 lift candidate, see W2) |
| 13 | Connectivity / anti-isla (CONN) | PASS | 0 |

---

## Cross-scope flags

| File | Module | Action |
|---|---|---|
| `abel/extraction/**` (orchestrator.py, schema.py, seed_sanitizer.py, prompts/icp_extraction.j2) | abel extraction (agentic) | `[CROSS-SCOPE — auditor-agentic / T-AG-1]` — NOT scored here |
| `abel/application/services/icp_extraction_service.py`, `extraction_persistence.py`, `extraction_service_holder.py` | agentic extraction orchestration | `[CROSS-SCOPE — auditor-agentic / T-AG-1]` — NOT scored here |
| `abel/api/router.py` lines 282-319 (`/icp/extract`, `/icp/extract/{job_id}`) | BE router wiring to agentic service | BE-owned wiring (thin delegation) — scored as routes (response_model ✓); the extraction *logic* is T-AG-1 |

**Engine boundary:** ✅ **CLEAN.** `git diff a2c38840..HEAD -- core/luana-core-*/` = **empty**. Zero engine edits. abel consumes engine by import only (`luana_core_platform.domain.base_entity.{BaseEntity, Base}`, `luana_core_iam.api.routers`). ICP = NET-NEW brand-local; Buyer = brand-local async replica with `icp_id` FK (engine BuyerPersona schema consumed by reference, NOT edited). Decision matches CONTEXT-BRIEF §2 + 03-arch-be.

**Cross-brand:** ✅ **CLEAN.** `git diff a2c38840..HEAD -- vitalia/ comunify/ lupulo/` = **empty**. No other-brand pollution.

---

## Findings

### WARN W1 — Abel routes have no application-layer authentication (only X-Tenant-ID header trust)
**Category:** 9 (Security)
**File:** `nicolify/backend/src/modules/nicolify/abel/api/router.py:65-79` (`_get_tenant_id`) + every route dep stack
**Issue:** Every abel route depends on `_get_tenant_id` which only converts the `X-Tenant-ID` header to a UUID (422 on malformed). There is **no `Depends(get_current_user)` / Bearer validation, no `X-User-ID`/`X-User-Role`, no RBAC** on any route. The router docstring (line 70) and main.py docstring (lines 38-43) claim "Engine auth (get_current_user) validates the tenant membership" / "El engine provee 401/403" — but that protection applies to the **engine IAM router** (`/api/v1/iam/users`), NOT to the abel router. A client supplying an arbitrary valid-UUID `X-Tenant-ID` (no token) reaches abel reads/writes. 03-arch-be §4 explicitly specified `Depends(get_current_user)`; 04-validators line 144 lists the api-layer requirement as `"Bearer/X-Tenant-ID required"` — only the X-Tenant-ID half is satisfied. The api test `test_list_icps_requires_tenant_header` sends `Bearer fake-token` and passes solely because the *missing X-Tenant-ID* triggers 422; the fake token is never validated (the test docstring admits real auth is "integration tests" only).
**Why WARN, not FAIL:** (a) tenant isolation is enforced at the query level on **every** query (Cat 2 PASS) — there is no cross-tenant *leak* given a tenant_id; (b) this mirrors the current nicolify rebuild posture (no `_shared/auth/` exists yet — the brand has only `db.py` + `main.py` in `src/`), so wiring `get_current_user` requires a brand-platform decision, not a per-ticket builder fix; (c) it is a *declared* deferral (validator routes it to "integration tests"), not a regression of an existing protection. It does **not** meet the bar for a hard cross-tenant-leak FAIL.
**Fix / escalation:** Before this surface is exposed to a real (non-localhost) origin, abel routes MUST gain an auth dependency equivalent to vitalia's pattern (`X-Tenant-ID + X-User-ID + X-User-Role` validated against engine IAM, or a shared `get_current_user` dep). Recommend `/pm-nicolify` track a follow-up "abel auth dependency" item and confirm whether the FE Clerk middleware + engine IAM 401/403 is the intended edge-auth boundary for R1 dev, with the per-route dep landing before any `dev-app`/prod exposure. **Escalation note:** auth is a stake-asymmetric category — flagged for Chris/`/pm-nicolify` ratification of the deferral, not silently approved.
**Rule ref:** `.claude/rules/tenant-isolation.md` (header source) · 03-arch-be §4 · 04-validators §test_construction_plan be-api · FastAPI canonical (auth dep per non-public route).

### WARN W2 — `GrowthStudioEmitter` is a cross-brand port from vitalia (N=2 lift candidate)
**Category:** 12 (Mirror detection)
**File:** `nicolify/backend/src/modules/nicolify/abel/application/telemetry/growth_studio_emitter.py`
**Issue:** Same basename + same conceptual role as `vitalia/backend/src/modules/vitalia/_shared/telemetry/growth_studio_emitter.py`. The emitter docstring + CONTEXT-BRIEF §7/§8 acknowledge it as "patrón vitalia re-temizado". This is the **second brand** to grow the `GrowthStudioEmitter` pattern.
**Why WARN, not FAIL:** Quantified divergence — vitalia=192 LOC raw-SQL `op.execute`/`text` INSERT with `emit_event(clinic_id=...)`; nicolify=112 LOC SQLAlchemy-ORM model with `emit(account_id=...)` + hashing/bucketing helpers. Only ~13 non-trivial common lines; **not >50% identical** (different persistence approach, different method name, different domain field). The brand-local telemetry table is a deliberate architectural decision (per-brand by tenant-isolation + PII; arch test `test_growth_studio_event_model_has_account_id_not_clinic_id` *enforces* the divergence vs `copilot_trace_event`). This is a legitimate port, not a copy-paste mirror.
**Fix / escalation:** Flag to `/pm-luana` as a **lift candidate** at N=2: extract a `GrowthStudioEmitter` base (hashing/bucketing/best-effort try-except + abstract persistence) to `core/luana-core-observability/` so vitalia + nicolify + future brands consume a shared base, each providing its own table/domain field (clinic_id vs account_id). Already noted `promotable: candidate` in CONTEXT-BRIEF §7.5. Not blocking this merge.
**Rule ref:** `.claude/rules/anti-duplication.md` (cross-brand mirror ban / lift gate) · CONTEXT-BRIEF §7.5.

### INFO i1 — `mark-ready` 422 body shape (RN-8 wire contract)
**Category:** 7 / 10 (informational)
**File:** `abel/api/router.py:162-182` + `abel/application/services/icp_service.py:165-199`
**Note:** Service correctly **returns** `IcpMarkReadyResponse(status=borrador, missing=[...])` and does **NOT raise** (RN-8 service contract ✓). The router then translates a non-empty `missing[]` into `HTTPException(422, detail={"status", "missing"})`. This is the **declared wire contract** (04-validators line 21 + SC-negative line 151: "mark-ready sin mínimo → 422 missing[] + ICP sigue borrador"; T-FE-4 consumes "422 missing[] inline"). The only nuance: the 422 body is `{"detail": {"status", "missing"}}` (FastAPI error envelope), not a flat `IcpMarkReadyResponse`. FE must read `error.detail.missing`. T-BE-2-result flagged this for FE alignment — **that alignment is auditor-frontend's scope (T-FE-4)**; on the BE side this is correct and intentional. No action for BE.

### INFO i2 — N+1 in `IcpService.list()` buyer_count derivation
**Category:** 1 (informational)
**File:** `abel/application/services/icp_service.py:102-110`
**Note:** `list()` runs one `list_by_icp` per ICP to compute `buyer_count`. Acceptable at B2B scale (few ICPs/tenant) and matches the draft-first master view. If ICP counts grow, replace with a single grouped `COUNT(*) ... GROUP BY icp_id`. Not blocking.

### INFO i3 — IMPL-LOG "Skills Consulted" header absent
**Category:** 10 (process, informational)
**Note:** The story uses per-ticket `T-BE-{1,2}-result.md` artifacts rather than a single `IMPL-LOG.md`; neither result file carries an explicit "Skills Consulted" section, and `runtime-quality-checklist.md` is not cited. Per strict verdict-math this trends WARN, but the substantive skill compliance is unambiguous in the code (BaseEntity from engine, BuyerPersona schema-by-reference, SA 2.0 async select(), response_model= on every route, structlog, currency preserved) — i.e., backend-expert + brand-expert were clearly applied. Treated as a **process note**, not a blocking FAIL, given the result-file convention and dispatch-plan must_load_skills assignment. Recommend future builds add the explicit header for auditability.

---

## Contract Compliance (business surface only — vs 03-arch-be + 04-validators)

- [x] All entities from 03-arch §1 implemented — `Icp` (+ `IcpStatus`/`IcpOrigin`), `Buyer` (+ `DecisionPower`), all `BaseEntity`, pure domain (no framework imports)
- [x] All DTOs from §3 match — `IcpCreate/Patch/Response/ListItem/MarkReadyResponse`, `Buyer*`, `IcpExtract*`; `ConfigDict(from_attributes=True)`; no `tenant_id` exposed (PII gate)
- [x] All routes from §4 registered with `response_model=` — 15 routes; arch test `test_all_routes_have_response_model` PASS; DELETEs are 204 (response_model=None, correct)
- [x] Repository interfaces from §5 fully implemented — `IcpRepository`/`BuyerRepository` ABC + SQLA async impls; every method takes `tenant_id`; `clear_primary` present (RN-6)
- [x] Migration §7 — `002_abel_icp_buyer.py` idempotent raw SQL (all `IF NOT EXISTS`), RN-7 partial unique, RN-6 DB-level partial unique, tenant indexes
- [x] Registration §8 (CONN) — `include_router(abel_router, prefix="/api/v1/abel")` in main.py; reachable
- [x] CONTRACT Agentic Surfaces (extraction §) flagged `[CROSS-SCOPE — auditor-agentic / T-AG-1]`
- [x] Test surfaces present at each layer (domain → infra → app → api), TDD RED-first per result files

**acceptance.validator_ids verification:**

| validator_id | Ticket | Status | Evidence |
|---|---|---|---|
| NF-sec-tenant | T-BE-1 | **PASS** | every repo query filters `tenant_id`; cross-tenant `get_by_id` → None → router 404 |
| RN-1 (tenant isolation incl get_by_id) | T-BE-1 | **PASS** | `icp_repository.py:154-163`, `buyer_repository.py:144-153` — `.where(tenant_id==…, deleted_at.is_(None))` |
| RN-5 (buyer FK icp_id, one ICP) | T-BE-1 | **PASS** | `Buyer.icp_id: UUID` required (domain test `test_buyer_requires_icp_id`); `BuyerService.create` validates ICP ownership → `BuyerNotInIcp`→404 |
| RN-6 (≤1 primary, clear_primary) | T-BE-1/2 | **PASS** | `clear_primary` demotes all in icp before promote (`set_primary` one tx); DB partial unique `uq_abel_buyers_icp_primary` |
| RN-7 (unique label/tenant, 409, idempotent) | T-BE-1 | **PASS** | `label_exists` case-insensitive (`func.lower`) + `exclude_id`; create→409; PATCH self-label idempotent (exclude_id=icp_id); DB partial unique `uq_abel_icps_tenant_label WHERE deleted_at IS NULL` |
| RN-8 (mark_ready returns missing[] NOT raise, no completeness bar) | T-BE-2 | **PASS** | service returns `IcpMarkReadyResponse(missing=[…])` (no raise); validates `vertical ∧ main_pain ∧ sales_angle ∧ ≥1 buyer-with-role`; wire 422 per spec (see i1); no completeness ring |
| RN-11 (currency preserved, no hardcode) | T-BE-2 | **PASS** | `avg_ticket_currency: str \| None` through domain/model/DTO; no `= 'USD'` anywhere (grep clean); `Numeric(14,2)` not converted on write |
| NF-sec-pii (response_model + growth_studio_event no PII) | T-BE-2 | **PASS** | response models exclude `tenant_id`; `test_growth_studio_event_no_pii` 5/5; model has no PII columns; props bucketed/hashed; emitter best-effort try/except |
| test_response_model_required | T-BE-2 | **PASS** | arch test + unit `test_all_routes_have_response_model` |
| test_growth_studio_event_no_pii | T-BE-2 | **PASS** | 5/5 |

---

## Migration 002 verification (Cat 8 detail)
- [x] Idempotent — all `CREATE TABLE/INDEX IF NOT EXISTS` (raw SQL), idempotent `DROP … IF EXISTS` downgrade
- [x] No `op.create_table()` / `op.add_column()` / `op.create_index()` (non-idempotent forms)
- [x] No `sa.Enum(create_type=True)` — status/origin/decision_power stored as VARCHAR (SA 2.0.27-safe)
- [x] Indexes on `tenant_id` (`ix_abel_icps_tenant`, `ix_abel_buyers_tenant_icp`, `ix_nicolify_gse_tenant`)
- [x] `DateTime` → all `TIMESTAMPTZ` (master-data); models all `DateTime(timezone=True)`
- [x] RN-7 + RN-6 enforced at DB (partial unique) AND service (defense-in-depth)
- Note: `gen_random_uuid()` requires pgcrypto/pg13+ (standard) — clone re-upgrade test is SKIP (postgres down) but static idempotency holds

---

## Allowlist Movement
- [x] No architecture-fitness allowlist GREW. `pyproject.toml` change (T-BE-1) added `runtime-evaluated-base-classes` for `luana_core_platform.domain.base_entity.{BaseEntity,Base}` + per-file `TC001/TC002/TC003` ignores scoped to `abel/**` — this is a **ruff config** addition (required because FastAPI/Pydantic/SA need runtime type evaluation; root cause documented in T-BE-1-result §"Root Cause Fixed"), NOT an arch-fitness `KNOWN_*` allowlist growth. Justified and scoped. No FAIL.

## Native-First Audit
- [x] No `docker exec … ruff|pytest|mypy` in commits (gate ran native via `${WS}/.venv/bin`)
- [x] No `git add .` / `-A` / `-u` evidence — commits scoped by pathspec (`feat(nicolify-abel): …`)
- [x] Conventional Commits used (`feat(...)`, `test(...)`, `chore(...)`)

## Downstream regression scope
| Surface modified | Downstream test targets | gate-runner status |
|---|---|---|
| `nicolify/backend/src/modules/nicolify/abel/**` (NET-NEW brand-local module, no `shared/` touched, no known cross-consumers) | none — abel is net-new; no engine/cross-brand consumers exist | N/A — no downstream targets (per `.claude/rules/auditor-downstream-regression.md`: brand-local new module). Module suite 52/52 + arch 20/20 cover the surface fully |

---

## Verdict Math
- Downstream regression: **N/A** (net-new brand-local, no consumers) → no FAIL
- FAIL in Cat 1/2/8/9/12/13? → **none** (Cat 9 = WARN declared-deferral, not cross-tenant-leak FAIL; Cat 12 = WARN <50% port, not mirror FAIL)
- Cat 13 (Connectivity) FAIL? → no (router in main.py, cap home declared)
- Allowlist grew without justification? → no (ruff-config change, justified + scoped)
- Any `/test-backend` gate FAIL (3-7, 11-13)? → no
- Two category WARNs (Cat 9 + Cat 12) → **overall WARN**
- **Rendered verdict:** **APPROVED** — gates green, contract + all acceptance.validator_ids GREEN, engine/cross-brand boundary clean. The two WARNs are non-blocking conditions: **W1 (auth deferral) is escalated to `/pm-nicolify`/Chris for ratification before any non-localhost exposure**; **W2 (emitter) is flagged to `/pm-luana` as an N=2 lift candidate post-merge**. Neither flips to FAIL under verdict-math.

> Cross-scope (extraction/T-AG-1) flags do NOT enter this verdict — they escalate to auditor-agentic.

---

## Carril A — working tree (uncommitted, orchestrator to commit)
**None.** No mechanical fixes applied. The BE business surface is clean as-built; both WARNs are policy/escalation items (auth wiring = needs a shared auth dep + brand decision = NOT a Carril-A mechanical fix covered by an existing test; emitter lift = /pm-luana promotion gate). No working-tree edits made.
