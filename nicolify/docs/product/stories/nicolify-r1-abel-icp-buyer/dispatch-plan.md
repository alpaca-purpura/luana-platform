# dispatch-plan · nicolify-r1-abel-icp-buyer

> Plan de despacho para `/dev-team`. Architect PROPONE; Chris RATIFICA `autonomous_mode`. Consume `06-tickets.yaml` (assignment blocks) + `04-validators.yaml`.

## autonomous_mode

```yaml
autonomous_mode: false        # default · Chris opt-in al ratificar
rationale_default_false: >
  Story fundacional (siembra fondo+forma para Oferta/Marca) + superficie AGENTIC production
  (extractor draft-first, R23 Opus) + decisión engine-boundary con Open Question para PM
  (buyer brand-local vs engine) + DoD #37 demo_required (sign-off de Chris). El extractor
  con anti prompt-injection (RN-9) y el patrón EntitySubNavBar nuevo (port) ameritan
  checkpoints humanos. Recomendación: build supervisado (no autonomous end-to-end).
caps:
  audit_iterations_max: 4
  self_fix_iter_max: 5          # Carril A mecánico (lint/format/typo) · agentic SIEMPRE Carril B
  wall_clock_max_min: 30        # por loop de audit
  wip_module_scoped: "≤1 story en developing/developed/reviewing por code:abel"
escape_valve: "checkpoint.md::defer_audit: true (ratificado Chris) — única excepción al closure gate"
```

## Handoff matrix (ticket → agent → model → cost estimado)

| Ticket | Surface | primary_agent | model | production | costo rel. | gherkin |
|---|---|---|---|---|---|---|
| T-BE-1 | be | builder-backend | sonnet | ✔ | media | SC-adversarial-tenant, SC-race-unique, SC-edge-primary, SC-edge-concurrent |
| T-BE-2 | be | builder-backend | sonnet | ✔ | media | SC-negative, SC-i18n, SC-happy-buyer, SC-add-buyer |
| T-AG-1 | agentic | builder-agentic | **opus (R23 HARD)** | ✔ | **alta** | SC-happy, SC-network, SC-adversarial-injection, SC-edge-thin-seed |
| T-FE-1 | fe | builder-frontend | sonnet | ✔ | media | SC-a11y, SC-happy-buyer, SC-large |
| T-FE-2 | fe | builder-frontend | sonnet | ✔ | media | SC-empty, SC-network |
| T-FE-3 | fe | builder-frontend | sonnet | ✔ | media | SC-empty, SC-happy, SC-large, SC-i18n |
| T-FE-4 | fe | builder-frontend | sonnet | ✔ | media-alta | SC-happy, SC-negative, SC-happy-buyer, SC-add-buyer, SC-edge-primary, SC-i18n |
| T-E2E-1 | fe | builder-frontend | sonnet | ✔ | media | 11 SC playwright + visual + demo-script |

> R23: T-AG-1 es el ÚNICO Opus (production agentic). Todo lo demás Sonnet. NUNCA opencode/Sonnet para T-AG-1.

## Auditor routing (post-build · story-closure-gate auto-handoff)

| Surface tocada | Auditor |
|---|---|
| T-BE-1, T-BE-2 | `auditor-backend` (Opus) |
| T-AG-1 | `auditor-agentic` (Opus) |
| T-FE-1..4, T-E2E-1 | `auditor-frontend` (Opus) |

`/auditor` Phase D produce la gherkin-matrix (regla→scenario→PASS/FAIL/MISSING). Cualquier MISSING → CHANGES_REQUESTED.

## DAG (orden de spawn)

```
T-BE-1
  └─ T-BE-2
       ├─ T-AG-1 ──────────────┐
       └─ T-FE-1 (∥ con T-AG-1)│
            T-AG-1 └─ T-FE-2 ──┤
            T-BE-2 + T-FE-2 └─ T-FE-3
            T-FE-1 + T-FE-3 └─ T-FE-4
            T-FE-4 + T-AG-1 └─ T-E2E-1
```
Critical path: `T-BE-1 → T-BE-2 → T-AG-1 → T-FE-2 → T-FE-3 → T-FE-4 → T-E2E-1`.
Paralelizable: T-FE-1 ∥ T-AG-1 (ambos solo dependen de T-BE-2).

## Playwright visual scope (D3 · de 04-validators)

- **story_scope_routes:** `/{tenantId}/abel/icp**` (master + `/{icpId}/datos` + `/{icpId}/{buyerId}`).
- **forbidden_to_touch:** `components/ui/**`, wrapper shell R0 (TopBar/Ribbon/SubTabsBar/LuanaSidebar/ShellOrganismLayout), `lib/routing/shell-routes.ts`, otros features.
- **out_of_mockup_scope:** completeness ring (RN-8 lo eliminó), modo Conectar funcional (dep Config→conexiones — disabled+CTA).
- **non_egoismo:** bug en wrapper R0 → documentar en `nicolify/docs/observed-bugs/`, NO arreglar acá.

## Invocation

### Manual (default · autonomous_mode=false)
```
/dev-team nicolify nicolify-r1-abel-icp-buyer
```
`/dev-team` lee 06-tickets.yaml + dispatch-plan.md, spawnea por DAG con los assignment blocks. Checkpoints humanos en: (a) post T-AG-1 (extractor agentic), (b) post T-FE-4 (flujo completo), (c) demo manual de Chris pre-merge.

### Autonomous (solo si Chris ratifica autonomous_mode=true)
No recomendado para esta story (ver rationale). Si Chris opta: caps arriba aplican; gate demo manual (#37) sigue siendo HARD pre-`done`.

## Gates pre-`done` (DoD #37 + story-closure)

1. Todos los arch fitness verdes (BE + FE · ratchet shrink-only).
2. gherkin-matrix sin MISSING (Phase D auditor).
3. Gate anti-burbuja vacío (base.ts).
4. Live-verify dev-app (`make dev-nicolify` → localhost:3001 / dev-app.nicolify.com) con `dod_evidence` (writes ejercidos: extract→borrador, patch→persist, mark-ready→422, cross-tenant→404).
5. `demo-script.md` + `demo_signoff` de Chris (APPROVED).
6. Post-merge: capability YAML + modules/abel.md + SYSTEM-MAP `abel.icp: built` + flags `promotable: candidate`.

## Flags escalables a /pm-luana (NO en esta story · informativo)

- `ICP` entity lift a core (cuando N=2 brand B2B).
- `EntitySubNavBar` lift a `@luana/ui-kit` (ya N=2 vitalia+nicolify).
- `buyer_personas` engine async-ification / `icp_id` extension (si cross-brand).
