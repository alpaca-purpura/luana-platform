---
story_id: vitalia-slice-1-inbox
outcome: vitalia-mvp-ui-foundation
parent_spec: vitalia-ux-discovery (archived 2026-05-20 — inheritance carryover)
state: refined
phase: REPLAN_AWAITING_ARCHITECT_REFRESH    # post 2026-05-20 replan ratified Chris
last_artifact: 02-design-ui-mockup.html (heredado parent) + audit-2026-05-20/AUDIT-REPORT.md (parent archive)
last_modified: 2026-05-20
ratified_by_chris: true
spawned_at: 2026-05-17
spawned_by: /pm-vitalia (split decision post /architect ready package)
parallel_safe: true
ola_assigned: 1                              # Ola 1 (paralela con vitalia-slice-1-fidelizacion)
ola_rationale: "Auto-contenida, sin sub-blockers de side stories. Reuso fuerte nicolify/crm-hub + nicolify/copilot."
ticket_subset_inherited: [T-inbox-1, T-inbox-2, T-inbox-3, T-inbox-4, T-inbox-5, T-inbox-6, T-inbox-7, T-inbox-8, T-inbox-9]  # referencia parent — sub-story produce 06-tickets propio post refresh
blocker_dependencies: []                     # vitalia-slice-1-infra-cross-cutting ya DONE (2026-05-18)
side_story_blockers: []                      # ninguna
preflight_gates_required:
  - clerk_organizations_enabled              # B2B multi-tenant
  - clerk_test_users_3_created               # dr.demo + recepcion + admin
  - playwright_storage_state_generated
  - playwright_smoke_suite_green_23_specs
  - promotion_proposal_core_platform_extensions_slice_1_migrated  # cron_envelope + CompoundScopeRepositoryBase
priority: high
estimated_dev_weeks: 2-3
next_action: "REPLAN 2026-05-20 ratified Chris. AWAITING /architect refresh tras pre-flight gates GREEN. /architect debe producir: 01-spec-extract.md (recorte mega 01-spec del parent acotado a /inbox) + 02-design-ui.md (link 02-design-ui-mockup.html como SSoT visual + component breakdown) + 03-arch-extract.md (BE+FE+agentic acotado) + 04-validators.yaml (Playwright spec /inbox + tests específicos) + 05-guidelines.md (reuso explícito: nicolify/frontend/src/features/crm-hub/ + nicolify/frontend/src/features/copilot/ rail + core/luana-core-crm/ + core/luana-core-channels/ + CompoundScopeRepositoryBase desde core) + 06-tickets.yaml (atómicos propios, no inherit) + HANDOFF-cross-story.md (comunicación con Ola 2 stories — tipos TS compartidos, schemas Zod, endpoints CRM comunes)."
---

# vitalia-slice-1-inbox — checkpoint

## Goal

Ruta `/inbox` conversacional Slice 1 (Batch 2 cementado): segmented 3-modos "Adrián decide" + 6 filtros venta consultiva ética + audio IN Whisper STT + imagen IN stub + composer attach + Tools Sheet read-only + Activity Stream sticky + Action Receipts undo 5min + proactive outbound modal.

## Mockup heredado (SSoT visual)

`02-design-ui-mockup.html` — copia del parent `vitalia-ux-discovery/mockups/inbox.html` ratificado Chris 2026-05-17. Colores cementados en `vitalia/frontend/src/app/globals.css` (T-arch-1 shipped). Build debe respetar:

- Paleta 4 colores principales: `--vitalia-cian #01B2F8` · `--vitalia-purpura #7B2D91` · `--vitalia-azul-marino #180D95` · `--vitalia-verde-lima #B8DC2A` (avatar Lucas).
- Layout: chat-RIGHT rail 72-80px (operación diaria post-wizard) + sidebar progresivo v3.
- Componentes referidos: `shared/contact-sidebar` (2 tsx stubs) + `shared/activity-stream` (2 tsx stubs) + `shared/copilot-rail` (2 tsx stubs) + `shared/agents` (4 tsx Adrián/Valeria/Lucas avatars).

## Reuso explícito (Slice 1 — referenciar en 05-guidelines.md tras refresh)

| Surface | Reuso de | Razón |
|---|---|---|
| FE conversación list + detail | `nicolify/frontend/src/features/crm-hub/` | crm-hub es el patrón inbox conversacional en Nicolify (legacy ap_sales_agent espejo) |
| FE rail copilot derecha | `nicolify/frontend/src/features/copilot/` (65+ components, lib, hooks, store) | rail-pattern unificado cross-brand |
| BE Lead + Conversation domain | `core/luana-core-crm/src/luana_core_crm/domain/{lead,customer}.py` | domain entities ya en engine |
| BE channel format dispatch | `core/luana-core-channels/src/luana_core_channels/format_for_channel.py` | engine ya consumido |
| BE PHI dual-filter queries | `core/luana-core-platform/repositories/CompoundScopeRepositoryBase` (post lift) | reemplaza vitalia/_shared/repositories/phi_repository.py local |
| BE trace observability | `core/luana-core-observability/src/luana_core_observability/persistence/` | engine ya consumido |

## Side stories paralelas relevantes

Ninguna — `/inbox` arranca sin side blockers.

## HANDOFF-cross-story coordination (NEW per Chris 2026-05-20)

Ola 1 produce tipos TS + schemas Zod + endpoints comunes que Ola 2 stories (`/pipeline` + `/marketing`) consumen:

- `vitalia/frontend/src/features/crm-shared/types.ts` — Lead + Conversation TS contracts (compartido inbox + pipeline)
- `vitalia/frontend/src/lib/zod-schemas/lead.ts` — Lead validation (compartido)
- API endpoints `GET /api/v1/vitalia/crm/leads`, `GET /api/v1/vitalia/crm/conversations` (consumidos inbox + pipeline)
- Tipos Adrián tool calls (compartido inbox + pipeline para action receipts)

Ver `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation/HANDOFF-cross-story.md` para coordinación full Slice 1.

## Bitácora

- 2026-05-17 spawned: split decision Chris post /architect ready package mega-story
- 2026-05-20 REPLAN: ux-discovery → done (parent SSoT cumplido). Mockup heredado. Ola 1 asignada paralela con fidelización. Reuso explícito cementado. Pre-flight gates requeridos antes /architect refresh. State refined permanece hasta /architect produce ready package propio.
