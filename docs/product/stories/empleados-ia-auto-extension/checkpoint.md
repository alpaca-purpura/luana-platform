---
story_id: empleados-ia-auto-extension

# Release entity — platform paradigm story (no brand release · evoluciona PARADIGM.md + ADR-010)
release: null

# Capability lineage
cap_target: null                                  # paradigma platform-level · no es una cap de marca
cap_change_type: new
parent_story: null

state: idea                                       # research bundle · pendiente decisión Chris: refining | ADR-evolution
phase_workflow: PM_DRAFT
last_artifact: ADR-013 (docs/architecture/luana-platform/) + outcome-platform
last_modified: 2026-06-01T17:30:00-05:00
next_action: "Promovido (vía a). ADR-013 + outcome-platform creados + PARADIGM.md §5b. Próximo: spike motor de flujos durables (/architect platform) + stories derivadas (/pm-vitalia, /pm-nicolify). Implementación = fase B→A separada."
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
