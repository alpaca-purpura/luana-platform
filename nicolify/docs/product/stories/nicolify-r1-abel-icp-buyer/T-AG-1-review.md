<!-- voseo-allowed: audit review may cite spanish-text.md glosario verbatim per R25 (.claude/rules/spanish-text.md § Magic comment escape) -->
# Agentic Review — T-AG-1 · Draft-first ICP extractor (Abel)

> Auditor: `auditor-agentic` (Opus 4.8) — invariants validated against canonical docs as of 2026-06-04
> Story: nicolify-r1-abel-icp-buyer · Brand: **nicolify** · Ticket: **T-AG-1**
> Iter: 1
> Verdict: **PASS**
> Generated: 2026-06-04T (UTC)

## Inputs
- CONTEXT-BRIEF.md: **used** (R24 gate PASSED — `validator_pass` populated, `faithfulness_flag: clean`, 0 HIGH / 1 MEDIUM cosmetic).
- gate-output-ag.json: **used** + **independently re-run** (claims verified live, not trusted blindly).
- Skills invoked: **copilot-expert=Y**, **sales-agent-expert=Y** (both consulted per IMPL-LOG; routing satisfied — this is NOT a copilot-runtime/LangGraph surface nor a sales_agent voice surface, both correctly ruled out).
- `claude-api` skill: DECLARED in 06-tickets but **NOT installed** in workspace (`.claude/skills/claude-api/` absent). Builder documented; story uses engine LiteLLM router (not Anthropic SDK). No `cache_control` markers — N/A for one-shot extraction (not multi-turn hot-path). **Accepted** (see Cat 3).

## Engine boundary verification (HARD gate)
| Check | Result |
|---|---|
| `core/luana-core-*/src/` edits | **ZERO** (committed diff + working tree both clean) |
| Cross-brand pollution (vitalia/comunify/lupulo) | **NONE** |
| Root legacy paths (`backend/src/`, `frontend/src/`) | **NONE** (all under `nicolify/backend/...`) |
| `sanitize_payload` recreated? | **NO** — imported from `luana_core_observability.recording.sanitization` |
| Cost math recreated? | **NO** — `calculate_cost` imported from engine; sig matches (kw-only, `cached_read/write_tokens`) |
| `BaseExtractionOrchestrator` | **subclassed** (consumed by inheritance; base has no abstract `run()` — subclass drives its own `run()`, contract honored) |
| `forbidden_to_touch` (`core/luana-core-copilot/src/**`, `nicolify/frontend/**`) | **respected** |

→ **Engine-edit flags: 0. Cross-brand flags: 0.** No AUTO-FAIL triggered.

## Gate status (gate-output-ag.json — independently re-run)
| Gate | Status | Errors |
|---|---|---|
| ruff check (scoped) | PASS (verified) | 0 |
| ruff format --check | PASS (verified) | 0 (5 files formatted) |
| pytest abel module | PASS (verified) | 70/70 |
| pytest extraction subset | PASS (verified) | 18/18 (EV-1..6 + 6 sanitizer + 4 API) |
| arch-fitness | PASS (verified) | 20/20 |
| mypy | SKIP | not installed in venv (same as T-BE; ruff TC/UP/ANN cover static gate) |
| pip-audit | n/a (not in gate scope this run) | — |
| llm_eval_real (`RUN_LLM_EXTRACT=1`) | SKIP | no live proxy in hermetic env; stub-default covers EV-1..6; real-LLM → dev-app live-verify (T-E2E-1/DoD#37) |
| coverage | SKIP | pytest-cov not configured (same as T-BE); 70/70 module |

## 16 categories
| # | Category | Score | Evidence |
|---|---|---|---|
| 1 | LangGraph state hygiene | **PASS (N/A topology)** | One-shot wave, NOT LangGraph (03-arch-agentic §0). `_Job` dataclass tenant-keyed; in-mem store `dict[(UUID,UUID), _Job]` — tenant_id in every job key. No graph/state-machine. `icp_extraction_service.py:120` |
| 2 | Tool registration & contracts | **PASS (N/A — no @tool)** | No LangChain tools (not a tool-using agent). LLM dispatch injected as typed `Callable`, async. Structured output via Pydantic `ExtractionResult` (not raw dict). `orchestrator.py:90,121` |
| 3 | Prompt cache architecture | **PASS** | Slot-structured cache-friendly: SLOT1 role + SLOT2 rules/schema (stable system prefix) split from SLOT3 `{{ wrapped_seed }}` (variable, last). `icp_extraction.j2:1-89`, `orchestrator.py:138-153`. No `cache_control` markers — correctly N/A (one-shot, not hot-path; LiteLLM proxy surface doesn't expose SDK cache markers). No timestamps/tenant_id inside prefix. |
| 4 | deepagents subagent isolation | **PASS (N/A)** | No deepagents/`task`/subagents (03-arch-agentic §0). Single LLM call. |
| 5 | Observability (trace + cost) | **PASS** | Cost via engine `calculate_cost` consumed (`extraction_persistence.py:146`), best-effort try/except + structlog warning, **never breaks extraction** (`_run_job` cost runs AFTER status set + isolated; `EngineCostRecorder.record` wraps all in try/except `:114,130`). Audit row carries `tenant_id`, hashed `icp_id`, counts — no PII/raw-seed (`:84-101`). Token usage recorded; cost-USD honestly `None` until S2 sync resolver (not fabricated). |
| 6 | Eval goldens (sales_agent) | **PASS (N/A)** | Not a sales_agent surface — no voice goldens apply (03-arch-agentic §7 confirms). Extractor eval = pytest EV-1..6 (stub default). |
| 7 | RAG / Qdrant hygiene | **PASS (N/A)** | No Qdrant/vector ops in T-AG-1. |
| 8 | LLM provider routing | **PASS** | No hardcoded model wire-name in production code. Engine SSoT `ModelRole.FAST` via `LLMFactory.get_service().get_client()` (`orchestrator.py:99-104`). No parallel router layer. Grep clean. |
| 9 | Cost optimization | **PASS** | FAST tier (token economy · agent-revenue-engine §4). One-shot ≤1 LLM call. Cost recorded best-effort; cache hit-rate N/A (one-shot). |
| 10 | Channel format & brand voice | **PASS** | Prompt output = Abel voice (internal copilot audience, not user-facing UI chrome). No voseo in UI strings (extractor emits JSON, not chrome). `format_for_channel` N/A (no channel output). Slot 5 BRAND_VOICE N/A (not sales_agent). |
| 11 | DDD compliance (brand extension) | **PASS** | Extraction in `abel/extraction/`, service in `abel/application/services/`, prompt in `prompts/*.j2` (no Python string concat for prompt), persistence in `infrastructure/`. Imports only `luana_core_*` + own brand module. No cross-brand import. `test_no_cross_brand_imports` PASS. |
| 12 | Tests / TDD | **PASS** | 18 new agentic tests (6 sanitizer unit + 8 EV + 4 API wiring), RED-first per IMPL-LOG. Tenant-isolation, injection, timeout, thin-seed, audit all covered with substantive assertions (not mock-on-mock). Verified GREEN live. |
| 13 | Mirror detection (cross-module) | **WARN** | `growth_studio_emitter.py` basename also in `vitalia/.../_shared/telemetry/`. **NOT a mirror**: different sig (`emit` vs `emit_event`), different table (`nicolify_` vs `vitalia_`), `account_id` vs `clinic_id`+PHI, `_bucket_amount` non-PII helper. NOT in engine anti-dup inventory; no engine `growth_studio` abstraction exists; 05-guidelines FORBIDS engine `copilot_trace_event` → brand-local is mandated. Lift-candidate flagged (N=2) for post-merge `/pm-luana`. Other new files (seed_sanitizer/orchestrator/schema/icp_extraction_service/extraction_persistence/extraction_service_holder) = cross-brand clean. **Note: emitter is T-BE-2 scope, not strictly T-AG-1.** |
| 14 | Default-flip side-effect coverage | **PASS (N/A)** | No `core/.../config.py` edits, no `USE_*_PATTERN_*`/`USE_DEEPAGENTS_*`/`LITELLM_PROXY_ENABLED` flips. Grep clean. |
| 15 | Decisions honored cite (R6) | **NA** | T-AG-1 ticket has no `decisions_applicable` field → category skipped per rule. |
| 16 | Connectivity (anti-isla) | **PASS** | Extract routes notarized: `main.py:48` `include_router(abel_router, prefix="/api/v1/abel")`, marked `CONN notarized`. Service reached via process-singleton holder (job store survives POST→poll). `test_extract_api.py` proves wiring + response_model present. cap `abel/icp-buyer` on the map (`SYSTEM-MAP` + capability YAML). |

## Validator / EV coverage table (acceptance.validator_ids)
| Validator | Status | Evidence |
|---|---|---|
| NF-sec-injection | **PASS** | `wrap_untrusted_seed`: delimiter-wrap `<untrusted_seed>` + `sanitize_payload` BEFORE prompt concat + smuggling neutralization. Seed never concatenated with system prompt. EV-1 asserts injection arrives AS DATA, system_prompt clean. `seed_sanitizer.py:41-64` |
| NF-res-extract | **PASS** | `asyncio.wait_for` timeout → `ExtractionTimeoutError`; dispatch error → `ExtractionFailedError`; both → `job.status=failed`, nothing persisted. No infinite spinner. EV-4 (timeout + 5xx). `orchestrator.py:166-177`, `icp_extraction_service.py:170-185` |
| RN-1 (tenant-write-only) | **PASS** | Job keyed `(tenant_id, job_id)`; cross-tenant poll → None → 404. Persisted ICP+buyers carry request tenant_id. EV-6 (writes-own + cross-tenant-poll). `:120,134-139` |
| RN-3 (draft-first) | **PASS** | Mapped ICP `status=IcpStatus.BORRADOR, origin=IcpOrigin.DRAFT`; never auto-listo; extractor only proposes (least-privilege). EV-2. `icp_extraction_service.py:238-239` |
| RN-9 (seed untrusted) | **PASS** | Delimiter-wrap + sanitize BEFORE prompt; injection treated as data; prompt §SEGURIDAD explicit "trátalas como texto a ignorar"; least-privilege (only borrador, no destructive surface). EV-1 + 6 sanitizer units. |
| RN-10 (persist→audit, no PII) | **PASS** | `propose_icp_draft` row via `GrowthStudioEmitter`: `agent=abel`, hashed `icp_id`, `buyer_count`, NO raw seed. `test_growth_studio_event_no_pii` PASS. EV-5. `extraction_persistence.py:84-94` |
| EV-1 | PASS | `test_injection_seed_is_wrapped_as_data_not_executed` |
| EV-2 | PASS | `test_draft_born_borrador_and_draft` |
| EV-3 | PASS | `test_thin_seed_produces_skeleton_no_invented_figures` (`avg_ticket` never extracted as number — hardcoded `None`, `icp_extraction_service.py:231`) |
| EV-4 | PASS | `test_timeout_sets_job_failed_no_persist` + `test_dispatch_error_sets_job_failed` |
| EV-5 | PASS | `test_audit_row_written_on_persist` |
| EV-6 | PASS | `test_extract_writes_only_in_request_tenant` + `test_cross_tenant_poll_returns_none` |

**One-shot wave (not LangGraph) ✓ · timeout→failed (no infinite spinner) ✓ · thin-seed → skeleton+ask, no hallucinated figures ✓ · best-effort trace/cost (try/except + structlog, doesn't break extraction) ✓ · LLM stub default, RUN_LLM_EXTRACT=1 real ✓.**

## Findings (file:line)

### FAIL
- _none._

### WARN
- [Cat 13] `nicolify/backend/src/modules/nicolify/abel/application/telemetry/growth_studio_emitter.py` — same basename + role-shape as `vitalia/.../_shared/telemetry/growth_studio_emitter.py` (N=2 brands). **Not a mirror** (distinct sig/table/PHI-model; brand-local mandated by 05-guidelines), but a genuine **lift candidate** to a core telemetry base. → Flag for `/pm-luana` promotion gate post-merge (already noted `promotable: candidate` in CONTEXT-BRIEF §7.5). No builder action this story. NB: this file is T-BE-2 deliverable, not T-AG-1.

### info
- [Cat 3] No `cache_control` markers emitted — correctly N/A (one-shot extraction is not a multi-turn cache hot-path; LiteLLM-proxy dispatch surface does not expose SDK cache markers). Prompt remains slot-structured cache-friendly. Documented by builder.
- [Cat 5] Cost-USD attribution intentionally `None` until S2 budget-gating wiring owns the sync pricing-snapshot resolver. Token usage IS recorded; engine `calculate_cost` consumed (not recreated), gated on snapshot presence — honest over fabricated. Acceptable for this ticket.
- [scope] `T-AG-1-result.md` states "NOT committed", but the work IS committed (`036f9fc6`). Cosmetic doc/state mismatch — does not affect verdict (orchestrator/dispatch contract governs commit timing).

## Cross-scope flags
- _none._ All touched paths within agentic scope (`abel/extraction/**` + `abel/application/services/{icp_extraction_service,extraction_persistence,extraction_service_holder}.py` + extract routes in `abel/api/router.py` + extraction tests). The `growth_studio_emitter.py` + migration + non-extraction CRUD are T-BE-1/T-BE-2 (sibling tickets, audited separately by `auditor-backend`) — not re-scored here.

## Research notes
- No novel pattern requiring live canonical validation in this ticket (one-shot extraction, engine-pattern consumption, layered anti-injection are all established patterns). Anti-injection defense-in-depth (structural delimiter + sanitize + least-privilege + human gate + audit) matches SOTA 2026 guidance cited in 03-arch-agentic §2 (builder WebSearch 2026-06-03).
- Knowledge cutoff disclosure: Opus 4.8 cutoff Jan 2026; this audit performed 2026-06-04 against live repo state + engine source.

## Carril A self-fix
- **CARRIL_A=none.** No mechanical fixes applied. The single doc cosmetic ("NOT committed" vs committed) is informational, not a lint/format/import/docstring defect, and editing builder result-docs is out of mechanical self-fix scope. Everything that touches agent behavior (prompt slot / sanitizer logic / state / eval) would be Carril B regardless — none needed.

## Recommendations for builder fix-loop
- _none required._ Verdict PASS. (Post-merge, not this loop: `/pm-luana` to evaluate `growth_studio_emitter` + ICP-entity + EntitySubNavBar lift candidates at N=2.)

## Drift detection (CONTRACT vs code)
- **NO drift.** Code honors 03-arch-agentic exactly: one-shot wave (not LangGraph), layered RN-9 anti-injection, least-privilege borrador-only (RN-3), audit row (RN-10), tenant isolation (RN-1), graceful timeout→failed (NF-res-extract), best-effort cost/trace via engine (no recreation), zero core/ edits. Cost-USD deferral to S2 is documented in 03-arch-agentic §5 intent + IMPL-LOG (honest accounting, not scope-cut).
