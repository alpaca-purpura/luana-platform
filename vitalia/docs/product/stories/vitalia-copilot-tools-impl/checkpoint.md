---
story_id: vitalia-copilot-tools-impl
outcome: vitalia-mvp-ui-foundation
state: idea
phase: SPAWNED
last_artifact: checkpoint.md
last_modified: 2026-05-17
next_action: "Prioritizar 4 tools T-tools-1..4 (Valeria copilot). Decidir cuáles son MVP (onboarding Brand Studio wizard) vs Slice 2 (configuradores avanzados). Spawn refining cuando Slice 1 spec ratificada."
ratified_by_chris: false
spawned_at: 2026-05-17
spawned_by: /pm-vitalia
parallel_safe: true
blocked_reason: "Bloquea onboarding Valeria wizard (4to diferenciador MUST visible MVP — Brand Studio voz). Sin tools mínimos, fallback a wizard form-based no-conversational."
priority: medium
estimated_dev_weeks: 2-3
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
