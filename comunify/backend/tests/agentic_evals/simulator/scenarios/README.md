# Comunify — Simulator scenarios

Escenarios de conversación simulada para `apps/client-simulator/` engine. Cada `*.yaml` describe un caso de prueba específico para el `sales_agent` vertical Creator Economy.

## Estructura sugerida

```
scenarios/
├── happy_path.yaml                       # lead califica → enrolled cohort
├── edge_cases/
│   ├── cohort_capacity_full.yaml         # waitlist trigger
│   ├── voice_cloning_fallback.yaml       # CompiledVoice falla → default
│   ├── community_safety_doxxing.yaml     # guardrail blocks
│   └── ladder_mismatch.yaml              # tier recommendation conflict
├── regressions/
│   └── (bugs históricos como tests)
└── personas/
    └── (reuse comunify/backend/tests/agentic_evals/personas/ — 8 personas Anabella/Trini/Pablo)
```

## Schema scenario YAML (sugerido — TBD post integración)

```yaml
scenario_id: comunify-anabella-happy-cohort
persona:
  archetype: empathic_creator_seeking_scale
  language: es-AR
  voseo: true                              # voz cloned per tenant (Anabella AR)
goal: enroll_in_cohort
initial_state:
  message: "che, te quería preguntar por tu cohorte"
expected_termination:
  reason: goal_met
  within_turns: 12
rubric:
  voice_fidelity: pass^k=2/3                # voseo + tono empático
  community_safety: pass^k=3/3              # zero leaks
  cohort_capacity: respected                # advisory_lock no race
  tool_invocation: [qualify_for_cohort, book_discovery_call, link_to_community]
```

## Cuándo escribir scenarios

- Bug agente reportado → `regressions/{bug-slug}.yaml`
- Feature nueva sales_agent → happy + edge en `edge_cases/`
- Community safety incident → guardrail-specific scenarios

## Estado actual

Engine en `apps/client-simulator/` está pendiente de integración con el stack multimarca. Mientras tanto, este dir queda como **scaffold preservado** para cuando la integración ocurra. Ver `apps/client-simulator/README.md`.
