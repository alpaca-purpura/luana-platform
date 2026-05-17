---
story_id: vitalia-copilot-tools-impl
outcome: vitalia-mvp-ui-foundation
state: refined
phase: AGENTIC_DESIGN_RATIFIED
last_artifact: 02-design-agentic.md (v1.0 RATIFIED Chris 2026-05-17)
last_modified: 2026-05-17
ratified_by_chris: true
ratified_at: 2026-05-17
next_action: "★ Design v1.0 RATIFIED Chris 2026-05-17 (single G6 batched round, 7 questions Q1-Q4+D1-D3 all defaults accepted). Surface efectivo Slice 1: 11 tools (4 Valeria + 3 Adrián subset MVP + 3 Lucas cron-only). HANDOFF /architect vitalia-copilot-tools-impl Opus 4.7 → consume 02-design-agentic.md + parent 01-spec § Batch 7 + 03-arch-agentic.md cross-reference → produce ready package: 03-arch.md (consolidated) + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml (tickets ≤10 per paradigm v4 cap). State transition: refined → ready cuando /architect cierra package."
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
