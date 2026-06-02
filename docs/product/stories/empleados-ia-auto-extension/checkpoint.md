---
story_id: empleados-ia-auto-extension

# Release entity — platform paradigm story (no brand release · evoluciona PARADIGM.md + ADR-010)
release: null

# Capability lineage
cap_target: null                                  # paradigma platform-level · no es una cap de marca
cap_change_type: new
parent_story: null

state: developing                                 # umbrella CONTINÚA — item 1b (L1 durable) DONE 2026-06-02; items 1c-design DONE; items 2-5 pendientes. ⚠️ archive/estado-final pendiente decisión Chris (NO archivar: es el SSoT vivo del paraguas empleados-IA con derivadas abiertas).
phase_workflow: L1_DONE_UMBRELLA_CONTINUES         # T-flows-1..5 done+committed+verified+merged-to-wip + auditor APPROVED. L2 build + items 2-5 = stories siguientes.
last_artifact: "07-merge.md + REVIEW-agentic.md (L1 durable-flows merged a wip/vitalia, APPROVED, DoD #37 live-verified)"
last_modified: 2026-06-02T14:05:00-05:00
ready_package_note: >
  Story platform de ENGINE INFRA, spike-derived (sin 01-spec/mockups/FE — NO aplican gates UI). Pasó de `refining`
  directo a `ready` SIN `refined` formal: es válido para una engine-spike-story autorizada por la proposal accepted
  (2026-06-02-durable-flows-engine.md). El "refinamiento" fue el spike + el drift map + ADR-013. Ready-package completo
  cubre L1 (build esta conversación: provider core/luana-core-flows + cablear 5 grafos + borrar mirror brand + migraciones
  + downstream regression vitalia+comunify + live-verify DoD #37) + L2 (DISEÑO: FlowCompiler/FlowDefinition/EP-19, build siguiente).
next_action: "L1 durable-flows CERRADO (T-flows-1..5, proposal migrated, CHANGELOG + docs/core-modules/flows.md, 07-merge + REVIEW-agentic APPROVED, downstream 463+182 verde, DoD #37 persist+resume real en Postgres). ⚠️ DECISIÓN CHRIS PENDIENTE: ¿archivar el folder umbrella a docs/archive/2026/stories/ (HANDOFF lo decía) o mantenerlo VIVO? Recomendación: mantener VIVO — este folder es el SSoT del paraguas empleados-IA (00-research + visión + L2 design seed) y el outcome tiene items 1c/2/3/4/5 abiertos 'post L1+L2'. Próximo trabajo real: L2 story (FlowCompiler/EP-19) + item 2 (story derivada vitalia: primer flujo durable real sobre L1)."
ratified_by_chris: true                            # Chris ratificó vía (a) 2026-06-01: promover a ADR-platform
spawned_at: 2026-06-01T16:00:00-05:00
spawned_by: /pm-luana
parallel_safe: true
blocked_reason: null
audit_iterations: 0
defer_audit: false
defer_audit_reason: null
parked_reason: null
dropped_reason: null
---

## Qué es esta story

Story **platform-level** (`/pm-luana`, cross-brand) que cementa la **visión de producto unificada** surgida de la sesión 2026-05-31 → 2026-06-01: **Luana = sistema operativo de empleados-IA con auto-extensión runtime, sobre un solo motor**. Bundlea toda la investigación + decisiones + el panorama como SSoT de arranque.

**Reset desde /pm-luana → propagar a todas las marcas** (decisión Chris 2026-06-01). NO descarta lo avanzado: vitalia (SYSTEM-MAP 3 zonas/12 cajas) + nicolify (roster/shell) pasan a ser las 2 primeras INSTANCIAS del modelo.

## Artefactos

- `00-story.md` — JTBD + qué/porqué (PM framing)
- `00-research.md` — ★ SSoT: panorama completo + investigación citada + las decisiones cementadas + 4 casos borde como tests del modelo
- `chris-input.md` — la cocina (conversación + verdicts)

## Relación con la doctrina existente

- Evoluciona `docs/architecture/luana-platform/PARADIGM.md` (3 planos) + `ADR-010-orquestacion-agentica.md`.
- Consistente con `ADR-vitalia-005` (Valeria = supervisora, NO caja de valor).
- Memoria: `[[luana-empleados-ia-vision]]` (índice MEMORY.md).

## Bitácora

- 2026-06-01 16:00 — /pm-luana creó folder + checkpoint + chris-input + 00-story + 00-research (state=idea). Visión ratificada conversacionalmente + estrés-testeada (4 casos borde). Pendiente decisión Chris sobre vía de promoción.
- 2026-06-01 17:30 — Chris ratificó vía (a). /pm-luana creó `ADR-013-empleados-ia-auto-extension.md` + `docs/product/outcomes/empleados-ia-auto-extension-platform.md` + evolucionó `PARADIGM.md` §5b + puntero en ADR-010. Trabajo derivado (spike flujos durables + stories por marca) queda como handoffs en el outcome. NO se tocó implementación.
- 2026-06-02 11:10 — /pm-luana levantó estado verificado (cero código, story `idea`, motor Fase B inexistente en `core/`). Chris eligió **arrancar Fase B**. Transición `idea→refining` + handoff `/architect` (platform) para el spike del motor de flujos durables (cornerstone B). Respeta el orden ratificado B→Vitalia→A→replicar.
- 2026-06-02 12:30 — /architect (platform) cerró el **ready-package L1+L2-design** (single-shot, autorizado por proposal `accepted`). Transición `refining → ready` (sin `refined` formal — válido para engine-spike-story autorizada). Entregables: `03-arch.md` consolidado + `03-arch-{agentic,be}.md` + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml` + `dispatch-plan.md`. **Decisiones clave:** (1) hogar = NUEVO paquete `core/luana-core-flows` (no módulo en platform — L2 lo necesita + aísla la dep pesada checkpoint-postgres). (2) **L1 NO requiere bump langgraph** — uv.lock YA resuelve langgraph 1.2.0 / langgraph-checkpoint 4.1.0; `langgraph-checkpoint-postgres 3.1.0` (requires `langgraph-checkpoint>=4.1.0`) compatible directo (refina spike §2.3/proposal §3 — el pin `>=0.2` es floor, no ceiling). (3) provider `make_durable_checkpointer` (AsyncPostgresSaver + EncryptedSerializer PHI vitalia + setup() idempotente + thread_id tenant-scoped) lifteado a core; **borrar el factory mirror brand** (`wizard_checkpoint_config.py` vitalia + equivalentes comunify — nunca invocado en prod, dead swap surface). (4) 5 grafos ya aceptan checkpointer vía DI → solo se recablean los composition roots (NO se tocan signatures/topología). (5) migraciones híbridas (LangGraph `.setup()` owns DDL + alembic prereq idempotente). (6) EP-19 = NEW EP (no ensanchar EP-4) — **L2 design-only**. **Live-verify DoD #37:** wizard_onboarding durable thread → psql confirma checkpoints en Postgres (no MemorySaver) + sobrevive restart (resume). DAG secuencial T-flows-1..5 (Opus agentic / Sonnet scaffold+migraciones). L2 (FlowCompiler/EP-19) = `deferred-next-story`. Hand-off `/dev-team`.
