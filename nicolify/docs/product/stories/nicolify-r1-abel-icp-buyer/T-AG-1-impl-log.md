# T-AG-1 IMPL-LOG — Draft-first ICP extractor (Abel)

> Builder: `builder-agentic` (Opus 4.8 · R23 HARD production_code:true). Brand: nicolify.
> Step 0 date (UTC): **2026-06-04**. Branch: `wip/nicolify`. WS=`/home/chalreme/Proyectos/luana-nicolify`.

## R24 brief acceptance gate
`CONTEXT-BRIEF.md`: `validator_pass: CONTEXT-BRIEF-validation.md` populated · `faithfulness_flag: clean` (0 HIGH, 1 MEDIUM cosmetic). **Gate PASSED** → proceed.

## Skills Consulted

- **copilot-expert** (loaded): consulted for ENGINE-vs-EXTENSION boundary discipline + anti-duplication cardinal (observability/cost/sanitize_payload are shared abstractions in `core/luana-core-observability`, NEVER mirror). Decision applied: this is NOT the copilot runtime (no LangGraph/deepagents/subagents — the architecture §0 explicitly says one-shot wave). Consumed `sanitize_payload` by import. Telemetry lands brand-local (`nicolify_growth_studio_event`) per 05-guidelines §FORBIDDEN, NOT engine `copilot_trace_event`. Best-effort observability rule (try/except + structlog warning + never break the turn) applied to cost + trace writes.
- **sales-agent-expert** (loaded): consulted §0 anti-duplication (cost/FX/pricing/sanitize are engine abstractions) — confirmed I must consume `calculate_cost` from `core/luana-core-observability` rather than re-implement cost math. Not a sales_agent surface (no voice goldens — confirmed by 03-arch-agentic §7).
- **claude-api** (DECLARED in 06-tickets but NOT INSTALLED in this workspace): `.claude/skills/claude-api/` does not exist. The story does NOT use the Anthropic SDK directly — LLM dispatch goes through the engine LLM router (`luana_core_llm.factory.LLMFactory.get_service()` → LiteLLM Proxy, which itself can route to Anthropic). Anthropic prompt-cache `cache_control` markers are a provider-SDK concept not exposed through the LiteLLM proxy `generate_response`/`get_client` LangChain surface used here. **Residual note for auditor:** prompt is structured cache-friendly (stable system prefix, variable seed last) but no explicit `cache_control` marker is emitted (not available via this dispatch path; also irrelevant — one-shot extraction is not multi-turn hot-path, so cache hit-rate is N/A). Documented because `claude-api` could not be invoked.
- **LangGraph canonical docs**: NOT fetched — N/A. The architecture (03-arch-agentic §0/§1) explicitly states this is NOT a LangGraph graph (one-shot wave, no supervisor, no deepagents). No graph node/state/edge modified.
- **graceful-degradation (timeout + fallback + circuit breaker)**: applied — the single LLM call is wrapped with `asyncio.wait_for(timeout)`; timeout/5xx → `job.status=failed` (no infinite spinner, NF-res-extract). No circuit breaker (single one-shot call per request; no repeated hot-path to trip a breaker — documented as intentional).

## Cross-module audit (NO-NEW-LAYER)

- `grep` for existing `ExtractionJob`/seed-sanitizer/job-store across `core/` + all brands:
  - **seed-sanitizer**: 0 matches → NET-NEW justified (no engine abstraction wraps untrusted seed + sanitize_payload for prompt-injection defense). Consumes `sanitize_payload` (engine) inside.
  - **job store**: copilot `application/extraction/active_job_state.py` exists but is ENGINE copilot machinery (requires copilot runtime + engine edits to extend). The architecture mandates brand-local one-shot, NOT copilot runtime → in-memory brand-local async job store is correct (KISS; FE polls; `failed` cuts the overlay).
  - **wave orchestrator**: `BaseExtractionOrchestrator` (`core/luana-core-extraction`) imports clean and is async-compatible (helpers are `async def`). **Decision: subclass it** (consume the pattern by inheritance, per backend-ddd §Extraction orchestrators), overriding `run()` for a single-wave extraction. Wave composition + merge-and-save stay in the subclass (base class contract).
  - **cost**: consume engine `calculate_cost` (`core/luana-core-observability/cost/calculator.py`) — do NOT re-implement cost math. Pricing snapshot resolution via engine `PricingResolver` is SYNC (`Session`, table-backed) → coupling it to the async hermetic extraction would break test hermeticity; cost is recorded best-effort with engine `calculate_cost` when a pricing snapshot is resolvable, else token usage logged without cost (graceful). Cost attribution row lands in `nicolify_growth_studio_event` (brand-local telemetry — engine `copilot_llm_call` is engine-owned + requires engine machinery).
  - **prompt reference**: `core/luana-core-copilot/.../interview/buyer_persona_doc_extraction.j2` — adapted (NOT copied) for ICP+buyer B2B, keeping the "prefer omit over fabricate" no-hallucination anchor (regla 7).

## Technical design (§ Plan)

**Topology** (03-arch-agentic §1): `seed (untrusted) → sanitize+delimiter-wrap (RN-9) → single LLM extraction (structured output) → parse/validate → map to Icp/Buyer drafts → persist brand-local (status=borrador, origin=draft, RN-3) + audit row (RN-10) + telemetry + best-effort trace/cost`.

**Files (NET-NEW)**:
- `abel/extraction/seed_sanitizer.py` — `wrap_untrusted_seed(text) -> str` (`<untrusted_seed>…</untrusted_seed>` + sanitize_payload BEFORE prompt concat). Pure, unit-tested. Caps seed length.
- `abel/extraction/schema.py` — Pydantic structured-output schema (`ExtractedIcp`/`ExtractedBuyer`/`ExtractionResult`) the LLM must emit; JSONB slugs mirror engine BuyerPersona.
- `abel/extraction/prompts/icp_extraction.j2` — SLOT 1 system/role (stable) + SLOT 2 extraction instruction+schema (stable) + SLOT 3 `<untrusted_seed>` (variable, last). Explicit "no inventes cifras" thin-seed anchor.
- `abel/extraction/orchestrator.py` — `IcpExtractionOrchestrator(BaseExtractionOrchestrator)`: single-wave `run(seed)` → LLM call (engine router) with timeout → parse JSON → `ExtractionResult`. Cost best-effort. Raises `ExtractionTimeout`/`ExtractionFailed` on timeout/5xx.
- `abel/application/services/icp_extraction_service.py` — `IcpExtractionService`: `start(tenant_id, request) -> job_id` (in-memory job store + `asyncio.create_task` running the extraction in its OWN session), `get_job(tenant_id, job_id) -> IcpExtractJobResponse`. On success: persist Icp(origin=draft,status=borrador) + Buyers via brand-local repos (RN-3), audit row `propose_icp_draft` (RN-10) in `nicolify_growth_studio_event` (hashed ids, NO raw seed), telemetry. tenant_id carried end-to-end (RN-1). Job store keyed by `(tenant_id, job_id)` → cross-tenant poll returns 404-equivalent (RN-1, EV-6).

**Wiring (router — ADD only)**: replace the 2 stub routes (`POST /icp/extract`, `GET /icp/extract/{job_id}`) with real `IcpExtractionService` calls via a process-singleton service holder (the in-memory job store must survive across requests → module-level singleton, not per-request DI). Existing CRUD routes untouched.

**Persistence/session note**: the async background task needs its OWN `AsyncSession` (the request session closes when the POST returns). The service accepts an async-session-factory; the router passes the app's `get_async_session` factory. For tests, an in-memory fake repo/session is injected.

**Tests (TDD — RED first)** under `tests/modules/nicolify/abel/extraction/`:
- `test_seed_sanitizer.py` (unit): injection payload wrapped as data; sanitize_payload applied (email/phone redacted); length cap.
- `test_extraction.py` (agentic, LLM stub default; `RUN_LLM_EXTRACT=1` real):
  - EV-1 injection seed → treated as data, draft proposed, NO destructive action, audit row written (RN-9).
  - EV-2 draft born `status=borrador, origin=draft` (RN-3).
  - EV-3 thin seed → skeleton + asks vertical+pain, NO invented numbers (avg_ticket stays None).
  - EV-4 timeout → `job.status=failed`, no ICP persisted (hoja intact) (NF-res-extract/SC-network).
  - EV-5 persist draft → audit row `propose_icp_draft` in growth_studio_event (RN-10).
  - EV-6 extract writes only in request tenant; cross-tenant poll → not found (RN-1).
- Stub LLM = injected fake `generate` returning a canned JSON per scenario.

**First RED entry**: `test_seed_sanitizer.py::test_injection_is_wrapped_as_data` (write test before sanitizer impl).

**Cap header**: every new production file → line 1 `# cap: abel/icp-buyer  # noqa: ERA001`.

## Implementation notes

- **Orchestrator subclasses `BaseExtractionOrchestrator`** (engine pattern consumed by inheritance) — single-wave `run(seed)`. LLM dispatch INJECTED (`generate`) so tests stub deterministically; default = engine LiteLLM router via `LLMFactory.get_service().get_client(ModelRole.FAST)` + `ainvoke` (returns `AIMessage` with `.usage_metadata` for cost). NO hardcoded model wire-name (engine SSoT `ModelRole.FAST`).
- **Job model**: in-memory process singleton (`extraction_service_holder.py`) — the job store must survive across the POST→poll request boundary; per-request DI would lose it. Job keyed `(tenant_id, job_id)` → cross-tenant poll → None → 404 (RN-1/EV-6).
- **Background task** runs the extraction in its OWN `AsyncSession` (`_AsyncSessionLocal`) — the request session is closed by the time the task runs. `run_to_completion` helper awaits the task for deterministic test assertions.
- **Persistence INJECTED** via `ExtractionPersister` port → tests inject in-memory fake (hermetic, no Postgres); production `SqlAlchemyExtractionPersister` writes draft ICP(s)+buyer(s) via existing async repos (status=borrador/origin=draft, RN-3) + `propose_icp_draft` audit row via `GrowthStudioEmitter` (hashed ids, counts, NO raw seed — RN-10/NF-sec-pii).
- **Cost best-effort** (`EngineCostRecorder`): records token usage telemetry; consumes engine `calculate_cost` ONLY when a pricing snapshot is provided (sync pricing-snapshot resolver is engine-owned + not cleanly usable in this async one-shot path → cost-USD stays UNATTRIBUTED rather than fabricated; honest accounting). Failure NEVER breaks the extraction (try/except + structlog warning). Cost-USD full attribution deferred to S2 budget-gating wiring (which owns the sync resolver) — documented for auditor.
- **mypy SKIPPED**: not installed in workspace venv (`.venv/bin/mypy` absent) — identical to T-BE-1/T-BE-2 (gate-output-be.json). Ruff's type-aware lints (TC/UP/ANN on src) cover the static gate.

## Residual notes for auditor-agentic

1. **`claude-api` skill not installed** — declared in 06-tickets but `.claude/skills/claude-api/` does not exist. Story does not use the Anthropic SDK directly (engine LiteLLM router). No `cache_control` markers (not exposed via this dispatch surface; also N/A — one-shot, not multi-turn hot-path → cache hit-rate irrelevant). Prompt IS slot-structured cache-friendly (stable 3605-char system prefix, variable seed last).
2. **Cost-USD attribution** intentionally None until S2 (sync pricing resolver wiring). Token usage IS recorded. Engine `calculate_cost` consumed (not recreated) — wired and unit-reachable, gated on snapshot presence.
3. **url/file seed modes**: the upstream fetch/scrape/parse (URL→text, file→text) is FE/storage scope (T-FE-2 + storage), out of T-AG-1. The service treats `request.payload` as the resolved seed text; a URL string is handled as a thin seed.
4. **No `migration`/`core/` edits** — verified. Engine consumed by import only (`sanitize_payload`, `calculate_cost`, `BaseExtractionOrchestrator`, `LLMFactory`).
5. **DTO is snake_case** (`job_id`/`icp_id`) as defined by T-BE-2 — FE mirrors to camelCase client-side. Not changed (out of scope).
</content>
</invoke>
