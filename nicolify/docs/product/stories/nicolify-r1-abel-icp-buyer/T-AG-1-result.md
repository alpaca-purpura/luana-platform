# T-AG-1 result — Draft-first ICP extractor (Abel)

> Builder: `builder-agentic` (Opus 4.8 · R23 HARD production_code:true). Brand: nicolify.
> Date (UTC): 2026-06-04. Branch: `wip/nicolify`. State: **tests-passing** (NOT committed).
> Full design + skill decisions + cross-module audit: `T-AG-1-impl-log.md`.

## What was built

A draft-first, ONE-SHOT seed→draft ICP extractor (NOT a LangGraph multi-turn graph).
The owner pastes/links a seed → Abel proposes a borrador ICP + buyers → the owner ratifies.
Least-privilege: the extractor ONLY proposes a `status=borrador` draft — never deletes,
never auto-marks-ready, never crosses tenants.

## Files touched

### NEW (production · `# cap: abel/icp-buyer` header on each)
- `nicolify/backend/src/modules/nicolify/abel/extraction/seed_sanitizer.py` — RN-9: delimiter-wrap `<untrusted_seed>` + engine `sanitize_payload` + smuggling neutralization + length cap.
- `nicolify/backend/src/modules/nicolify/abel/extraction/schema.py` — Pydantic structured-output schema (ExtractedIcp/ExtractedBuyer/ExtractionResult); firmographics optional (thin-seed); `avg_ticket` never extracted as a number.
- `nicolify/backend/src/modules/nicolify/abel/extraction/orchestrator.py` — `IcpExtractionOrchestrator(BaseExtractionOrchestrator)`: single-wave run, injected LLM dispatch (default = engine LiteLLM router `ModelRole.FAST`), `asyncio.wait_for` timeout → `ExtractionTimeoutError`/`ExtractionFailedError`, tolerant JSON parse.
- `nicolify/backend/src/modules/nicolify/abel/extraction/prompts/icp_extraction.j2` — cache-friendly slots (SLOT1 role · SLOT2 rules+schema · SLOT3 untrusted seed last); explicit "no inventes cifras" anchor (adapted from engine buyer_persona_doc_extraction.j2).
- `nicolify/backend/src/modules/nicolify/abel/application/services/icp_extraction_service.py` — `IcpExtractionService`: async job (start/get_job/run_to_completion), tenant-keyed in-memory job store (RN-1/EV-6), map→domain (borrador/draft RN-3), persister + cost-recorder ports.
- `nicolify/backend/src/modules/nicolify/abel/application/services/extraction_persistence.py` — production adapters: `SqlAlchemyExtractionPersister` (draft persist + `propose_icp_draft` audit row RN-10, own AsyncSession) + `EngineCostRecorder` (best-effort, consumes engine `calculate_cost`).
- `nicolify/backend/src/modules/nicolify/abel/application/services/extraction_service_holder.py` — process-singleton holder (job store survives POST→poll) + DI seam.

### NEW (tests)
- `nicolify/backend/tests/modules/nicolify/abel/extraction/__init__.py`
- `nicolify/backend/tests/modules/nicolify/abel/extraction/test_seed_sanitizer.py` (6 tests)
- `nicolify/backend/tests/modules/nicolify/abel/extraction/test_extraction.py` (8 tests — EV-1..EV-6)
- `nicolify/backend/tests/modules/nicolify/abel/extraction/test_extract_api.py` (4 tests — router wiring / CONN notarized)

### MODIFIED (ADD-only)
- `nicolify/backend/src/modules/nicolify/abel/api/router.py` — replaced the 2 extract STUBS with real `IcpExtractionService` calls (POST /icp/extract → analizando; GET /icp/extract/{job_id} → poll, 404 cross-tenant). Existing CRUD routes untouched.

### Docs
- `T-AG-1-impl-log.md`, `T-AG-1-result.md`, `gate-output-ag.json`.

## Validators run + verdict

| Gate | Verdict |
|---|---|
| ruff check (scoped) | PASS — 0 errors |
| ruff format --check (12 files) | PASS — 0 to reformat |
| pytest abel module (70 tests) | PASS — 70/70 |
| arch fitness (20 tests, incl. response_model + no-cross-brand + growth_event no-PII) | PASS — 20/20 |
| mypy | SKIP — not installed in venv (same as T-BE) |
| llm_eval_real (RUN_LLM_EXTRACT=1) | SKIP — no live proxy in hermetic env; stub-default covers EV-1..6 |
| coverage | SKIP — pytest-cov not configured (same as T-BE); module 70/70 |

**Overall: `any_fail: false`.** Full breakdown: `gate-output-ag.json`.

## EV coverage (04-validators agentic_eval — all GREEN)

- **EV-1** (RN-9): injection seed wrapped inside `<untrusted_seed>` as DATA, not in the system prompt; outcome is a normal borrador; exactly one persist (a proposal) — no destructive action exists in the extractor's surface.
- **EV-2** (RN-3): extracted ICP persists `status=borrador, origin=draft`; never auto-listo.
- **EV-3** (thin-seed): poor seed → skeleton ICP, empty firmographics, `avg_ticket=None` — no fabricated numbers.
- **EV-4** (NF-res-extract): timeout (asyncio) AND 5xx/dispatch error → `job.status=failed`, nothing persisted (hoja intact). No infinite spinner.
- **EV-5** (RN-10): persisting the draft writes a `propose_icp_draft` audit row (agent=abel, hashed icp_id, buyer_count, NO raw seed).
- **EV-6** (RN-1): persisted ICP+buyers carry the request tenant_id; a cross-tenant poll returns None → 404. Plus 6 seed_sanitizer unit tests.

## Eval policy

Stub-default: deterministic canned JSON injected into the orchestrator's `generate` seam
(no real LLM). `RUN_LLM_EXTRACT=1` reserved for a future real-LLM smoke (swaps in
`_default_generate()` → engine LiteLLM router). Real-LLM verification belongs to the
dev-app live-verify (T-E2E-1 / DoD #37), not this hermetic build run.

## Residual notes for auditor-agentic

1. `claude-api` skill declared in 06-tickets but NOT installed in this workspace; story uses the engine LiteLLM router (not the Anthropic SDK). No `cache_control` markers (not exposed via this surface; N/A for one-shot). Prompt is slot-structured cache-friendly anyway.
2. Cost-USD attribution is intentionally `None` until S2 budget-gating wiring owns the sync pricing-snapshot resolver. Token usage IS recorded; engine `calculate_cost` consumed (not recreated), gated on snapshot presence — honest over fabricated.
3. url/file seed fetch/parse is FE/storage scope (T-FE-2), out of T-AG-1; `request.payload` is treated as the resolved seed text.
4. No `core/` or migration edits — engine consumed by import only.
5. DTO snake_case (`job_id`/`icp_id`) per T-BE-2 — FE mirrors to camelCase. Not changed (out of scope).
6. NOT committed — orchestrator commits per the dispatch contract.
