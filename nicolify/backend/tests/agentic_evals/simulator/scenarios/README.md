# Nicolify — Simulator scenarios

Escenarios de conversación simulada para `apps/client-simulator/` engine. Cada `*.yaml` describe un caso de prueba específico para el `sales_agent` vertical Agencias B2B.

## Estructura sugerida

```
scenarios/
├── happy_path.yaml                       # prospect califica → propuesta
├── edge_cases/
│   ├── client_portal_access.yaml         # demo cliente accede portal
│   ├── billable_hours_dispute.yaml       # cliente cuestiona horas facturadas
│   ├── contract_signing.yaml             # flujo e-signature
│   └── crm_long_cycle.yaml               # nurture multi-touch
├── regressions/
│   └── (bugs históricos como tests)
└── personas/
    └── (TBD — escribir personas B2B: CMO agencia, CTO software boutique, etc.)
```

## Schema scenario YAML (sugerido — TBD post integración)

```yaml
scenario_id: nicolify-cmo-agency-proposal
persona:
  archetype: cmo_agency_b2b
  language: es-LATAM
  voseo: false                             # tuteo neutro
goal: receive_proposal
initial_state:
  message: "Buenos días, evaluamos opciones para automatizar nuestro CRM cliente"
expected_termination:
  reason: proposal_sent
  within_turns: 15
rubric:
  currency_client: respected                # invoice currency = client.currency, NO tenant
  proposal_lifecycle: accepted_state_machine
  tool_invocation: [send_proposal, schedule_call]
```

## Cuándo escribir scenarios

- Bug agente reportado → `regressions/{bug-slug}.yaml`
- Feature nueva sales_agent → happy + edge en `edge_cases/`
- B2B-specific cycle: long sales cycle, multi-stakeholder, RFP responses

## Estado actual

Nicolify post-reorg **no tiene aún código brand-vertical implementado** (billable_hours, client_portal, proposals son aspirational). Cuando esos módulos shippeen (stories N1-N5 per `docs/architecture/luana-platform/03-nicolify-carve-out-audit.md`), los scenarios aquí toman sentido.

Engine en `apps/client-simulator/` está pendiente de integración con el stack multimarca. Mientras tanto, este dir queda como **scaffold preservado** para cuando la integración ocurra. Ver `apps/client-simulator/README.md`.
