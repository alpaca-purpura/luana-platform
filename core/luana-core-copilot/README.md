# luana-core-copilot

Version: 0.0.6-alpha

Copilot conversational engine ("Claude Code de marketing") lifted from AISALESHT
`backend/src/modules/copilot/` (Story 6, 2026-05-11). LangGraph 2.0 StateGraph +
deepagents subagent harness + Anthropic prompt cache slots 1-11 + Qdrant
tenant-agnostic marketing_kb + 36 [COPILOT-*] anchors capped.

## Key exports

`ToolRegistry`, `WorkflowRegistry`, `ExtractorRegistry`, `ModuleRegistry`,
`SuggestionRegistry` (D-T1 FROZEN per Story 6 03-arch.md §7.3), `CopilotState`
TypedDict, `build_deep_agent_graph`, `compose_system_prompt` (slot architecture
SSoT — slots 1-11 order FROZEN), `CopilotCallbackHandler` (subclass of
`luana_core_observability.recording.base_callback_handler.BaseAgentCallbackHandler`
per D-T6 anti-mirror cardinal), `CopilotObservabilityContext` (subclass of
`luana_core_observability.recording.turn_envelope.BaseObservabilityContext`).

## Deferrals (per 03-arch.md §9.4)

### Defer to Story 10 (nicolify shell migration)
- `backend/src/admin/pages/{trazas,copilot-routing,costo-copilot,copilot-limits,copilot-quality,marketing-kb,brand-summaries}.py`
  Streamlit admin shell migrates with nicolify shell.

### Defer to Story 7 (sales_agent lift)
- `backend/src/modules/connections/api/dependencies/__init__.py` real wiring of
  `ChatOrchestrator` — requires `luana_core_sales_agent.MessageHandlerPort` impl
  that arrives Story 7. Stub `NotImplementedError` stays.

### Defer to Story 8 (scheduling lift — campaigns-extension-sdk batch)
- `AppointmentModel` stub in offer-studio conftest.py — scheduling module lifts
  in Story 8.

### Reserved (NEW abstractions, NOT existing AISALESHT code)
- EP-1..EP-5 Extension SDK formalization → Story 8. Story 6 freezes registries
  per D-T1; Story 8 wraps them as formal SDK without changing internals.
- BrandVoicePort introduction → Story 7 (D-T3).
