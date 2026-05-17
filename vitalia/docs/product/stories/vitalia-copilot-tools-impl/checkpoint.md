---
story_id: vitalia-copilot-tools-impl
outcome: vitalia-mvp-ui-foundation
state: refining
phase: AWAITING_PO_UX_AGENTIC_DRAFT
last_artifact: checkpoint.md
last_modified: 2026-05-17
next_action: "AGENTIC story DUAL handoff: (1) /po vitalia-copilot-tools-impl — produce 01-spec.md service Gherkin con tool contracts cementados desde 03-arch-agentic.md § 4 (3 actors: Valeria 4 tools + Adrián 5 tools + Lucas 3 tools = 12 tools total Slice 1). (2) /ux-agentico vitalia-copilot-tools-impl — produce 02-design-agentic.md con LangGraph state machine supervisor + deepagents subagent isolation per actor + 5-slot prompt cache architecture (Slot 5 BRAND_VOICE cache stable per personality_profiles.system_instruction NO inject tenant_name mid-block) + voice constraints medical guardrails Slot 4 NEW Slice 1 + eval policy 12 personas × 3 trials pass_k≥0.5 per actor + cost/latency budget per role (Kimi reasoning Lucas + Claude Haiku Adrián + DeepSeek wizard Valeria) + observabilidad (copilot_trace_event + copilot_llm_call + cost recorder canonical via core/luana-core-observability). Open questions Chris: (a) ¿Adrián tools 5 ó subset MVP Slice 1 (recommend send_payment_link + reschedule + screening + dejamos retract+template Slice 2)? (b) ¿Lucas cron-triggered ONLY Slice 1 ó también chat-invokable? (c) ¿Eval goldens 12 personas iniciales hardcoded ó plugin EP-tessl__eval/goldens registry desde MVP? (d) ¿Tessl skills load (langgraph + deepagents + graceful-degradation) cargadas desde repo principal ó offline-only build?"
ratified_by_chris: false
spawned_at: 2026-05-17
transitioned_at: 2026-05-17
spawned_by: /pm-vitalia
parallel_safe: true
blocked_reason: "Bloquea onboarding Valeria wizard (4to diferenciador MUST visible MVP — Brand Studio voz). Sin tools mínimos, fallback a wizard form-based no-conversational. ADEMÁS bloquea: vitalia-slice-1-pipeline (Lucas screening tool) + vitalia-slice-1-marketing (Lucas StageRecommendations + AttributionMatrix + Referrals)."
priority: high  # bump medium→high — bloquea 3 sub-stories, no solo onboarding
estimated_dev_weeks: 2-3
parent_spec: "vitalia/docs/product/stories/vitalia-ux-discovery/03-arch-agentic.md § 4 tools tables + § 5 prompt cache slots + 01-spec.md § Batch 7 wizard onboarding agentic + § Batch 2-6 routes Adrián+Lucas tools usage"
---

# vitalia-copilot-tools-impl — checkpoint

## Goal

Implementar tools backend del copilot Valeria (T-tools-1..4 scaffolds detectados en `vitalia/backend/src/modules/vitalia/copilot/tools/` per 00-research.md audit).

Hoy las tools son placeholders (`NotImplementedError`). Sin tools concretos, Valeria charlaría sin ejecutar acciones reales → riesgo teatro.

## Scope

### In-scope MVP (Slice 1)
- Tool `setup_brand_studio` — conduce wizard onboarding Owner (4 secciones: identity + contact + team + testimonials). Lee/escribe via `brand_studio` BE engine.
- Tool `get_clinic_status` — Valeria responde "¿cómo va la clínica?" con stats real (turnos hoy, leads pendientes, pagos pendientes).

### Slice 2
- Tool `configure_treatment` — wizard conversacional crear/editar tratamiento
- Tool `approve_pending_action` — bandeja Pendientes Owner accionable via chat

### Out-of-scope MVP
- Tool generation completa (todos los 4 wired) — solo los críticos
- Voice/audio tools — defer Slice 3

## Análisis backend

Per `00-research.md` audit:
- Backend tiene scaffold registry EP-3 (copilot tools)
- Falta implementación concreta + integration tests
- `luana-core-copilot` engine ya tiene base (LangGraph state + Anthropic SDK + prompt cache)

## Dependencies

- **vitalia-ux-discovery v1** define cuál es onboarding flow exacto (qué tools necesita Valeria realmente)
- Backend Vitalia Story 11 ya tiene scaffold (extensions.py register_all monta EP-3)

## Bitácora

- 2026-05-17 spawned: idea formal abierta por /pm-vitalia para tracking. Diferenciador #3 MUST MVP (Brand Studio voz via Valeria wizard) depende parcialmente de esta story (fallback form-based si bloquea).
