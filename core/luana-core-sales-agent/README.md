# luana-core-sales-agent

> Story 7 luana-sales-agent-engine — skeleton (v0.0.7-alpha).

Sales-agent runtime engine for the Luana platform — multi-tenant LangGraph
supervisor pattern orchestrating specialist sub-agents (qualifier,
product_expert, closer, supervisor, tool_executor, safety, escalate)
with Anthropic prompt cache slot architecture, channel-aware output via
the channel registry, follow-up engine cadence, and §3-protected
surfaces (Closer Studio API + WS, SmartBufferService, OutputManager
chunking, enrollment_*, webhook adapters, tool_call_dedup).

## Lift origin

- AISALESHT path: `backend/src/modules/sales_agent/`
- Lift commit batch: Story 7 (T-4 through T-15 — see story checkpoint for
  exact SHAs once batches complete)
- Lift mode: verbatim with mechanical `sed` import rewrites (per
  `05-guidelines.md §1.4`). NO logic refactor on protected surfaces.

## Key exports (filled in once lift completes — T-15 onward)

- `SalesAgentState` (TypedDict — from `application/orchestrator/state.py`)
- `build_sales_agent_graph` (LangGraph compile entry from
  `application/orchestrator/graph.py`)
- `compose_prompt(specialist, state, voice_port, …)` (slot architecture
  6-block layout — slot 5 BRAND_VOICE wired via `BrandVoicePort` per
  D-T3 ADR-001 §2.4)
- `SalesAgentCallbackHandler` (subclasses
  `luana_core_observability.recording.base_callback_handler.BaseAgentCallbackHandler`
  per D-T6 cardinal)
- `SalesAgentObservabilityContext` (subclasses
  `luana_core_observability.recording.turn_envelope.BaseObservabilityContext`)
- 5 base tool groups (`tools/registry.py` — payment + scheduling +
  webhook providers strategy pattern + enrollment)

## §3 protected surfaces

The following AISALESHT surfaces lift hash-stable (sha256 verified at
T-13 commit + T-18 arch fitness V-AG-8):

1. `api/closer_studio.py` + `api/ws.py` — live ops + Streamlit + FE
   dependents
2. `application/orchestrator/smart_debounce_runner.py` — SmartBufferService
   CPM tuned LATAM channels
3. `infrastructure/external/output_manager.py` — process_response
   chunking (`typing_simulation_cpm` registry override S12)
4. `application/services/enrollment_service.py` + `domain/enrollment.py`
   + `infrastructure/models/enrollment_model.py` + `api/enrollments.py`
   — end-to-end production paths
5. `application/tools/payment/webhook_providers.py` +
   `application/tools/scheduling/webhook_providers.py` — auth/signature
   adapters
6. `workers/follow_up_engine.py` — cadence math + tz tenant
7. `infrastructure/models/prompt_version_model.py` — DB-backed prompt
   versioning per tenant
8. `application/orchestrator/tool_call_dedup.py` — anti-loop guard
   post fbc79125

Modifications beyond mechanical import sed rewrites require architect
ratification + sha256 re-snapshot (T-18 arch test sets baseline).

## Deferrals (NOT in this package — see `core/DEFERRED-FILES.md`)

### Deferred to Luana v0.2.0 (eval framework)

- `observability/eval_simulator/` (entire subfolder — 8 files src + persistence models)
- `tests/agentic_evals/sales_agent/` (entire tree — simulator + grader + personas + goldens + adversarial)
- MAJ-EVAL grader runtime infra (cost-bucket separated tables:
  `eval_simulator_llm_call`, `eval_simulator_trace_event`,
  `eval_simulator_grade`, `eval_simulator_grade_cache`,
  `eval_synthetic_tenants`)
- Story E (`sales-agent-voice-fidelity-grader-runtime`) — WAIVED to
  Luana v0.2.0

### Deferred to Story 8 (campaigns/scheduling lift batch)

- Scheduling concrete provider runtime: `tools/scheduling/providers.py`
  LIFTS with deferred-import pattern preserved. Runtime fails on
  scheduler tool invocation in Luana standalone UNTIL Story 8 lifts
  scheduling module. Nicolify shell wires scheduling pre-Story 8
  (acceptable known-limitation).

### Deferred to Story 10 (nicolify Streamlit admin migration)

- `backend/src/admin/pages/{sales-routing,sales-agent-quality,costo-agentes,llm-virtual-keys,llm-models}.py`
  — Streamlit admin shell.

## Introduced this Story (D-T3 ADR-001 §2.4 cement)

Story 7 introduces `BrandVoicePort` Protocol + `BrandVoiceService`
adapter in `luana-core-brand-studio` package (NOT this package). This
package CONSUMES the port via DI:

- `application/prompts/compose.py` slot 5 BRAND_VOICE source = port
- `application/services/knowledge_builder.py` build_identity = port
- `application/orchestrator/conversation_pipeline.py` injects via FastAPI Depends

The hexagonal boundary means this package NEVER imports
`PersonalityCompiler` directly (arch fitness V-AG-3 enforces). The voice
compiler SSoT stays in `luana_core_brand_studio.domain.personality`
(Story 5 placement — arch fitness V-AG-7 regression Story 5).

## Resilience invariants

- Every LLM call goes through `BudgetGuard.check(agent_kind="sales_agent")`
  (consumes SA pool reserved, NOT Others pool — wiring in S2 / nicolify
  shell)
- Every outbound message goes through `OutboundRateLimiter.check`
  (sliding-window Redis 24h cap per `plan_config.max_outbound_msg_per_day`)
- Every observability write is best-effort
  (try/except + structlog.warning + db.rollback) — never breaks turn
- Every tool external call wrapped with timeout + fallback +
  circuit-breaker (per `tessl__graceful-degradation`)

## Spanish-text exception

Per `.claude/rules/spanish-text.md` § "Excepción sales_agent" + R25
magic comment:

- Sales agent OUTPUT respects tenant voice (voseo OK if tenant AR — per
  `PersonalityProfile.system_instruction` compilation via slot 5
  BrandVoicePort)
- Tool descriptions + error messages + internal copy follow Spanish
  neutro LatAm
- Specialist `.j2` templates load `PersonalityProfile.system_instruction`
  at runtime — voice already compiled there

## Verify package

```bash
cd ~/luana-platform && uv sync
cd ~/luana-platform && uv run pytest core/luana-core-sales-agent/tests/ -x -q --tb=short \
    --ignore=core/luana-core-sales-agent/tests/eval_simulator/ \
    --ignore=core/luana-core-sales-agent/tests/agentic_evals/
```

Story 7 progress lives in
`docs/product/stories/luana-sales-agent-engine/checkpoint.md`
(AISALESHT repo).
