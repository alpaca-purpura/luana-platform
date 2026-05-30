---
story_id: vitalia-paradigm-map-zones
brand: vitalia
type: infra-migration
title: "Migración del mapa a 3 zonas (PARADIGM/ADR-010) + reorganización del backlog"
agent_owner: infra
module: platform
state: idea
architecture_pattern: ADR-010-orquestacion-agentica + ADR-vitalia-005-capability-model-4-dimensions (extiende → 5ª dim: zona)
last_modified: 2026-05-30
ratified_by_chris: false
parallel_safe: false        # toca SYSTEM-MAP + ~71 caps + cockpit (cross-brand tool) — serializar
priority: high
estimated_dev_days: 3-4
dependencies:
  hard: []
  soft:
    - vitalia-fase2-lisa-doctores      # refining — comparte taxonomía a re-mapear
release: F2
cap_target: platform.product-map-zonas
cap_change_type: new
parent_story: null

# ── Paradigma (caja/zona del mapa · cement 2026-05-30) ──
map_zone: infraestructura
map_box: plataforma-tecnica
user_visible: false
paradigm_refs:
  - docs/architecture/luana-platform/PARADIGM.md
  - docs/architecture/luana-platform/ADR-010-orquestacion-agentica.md
  - .claude/rules/paradigm-arquitectura.md
  - vitalia/docs/architecture/SYSTEM-MAP.yaml (zones)

# ── Scope (4 frentes) ──
scope:
  - "F1 · Re-tag ~71 caps: agent_owner config/infra → cajas nuevas por zona (SYSTEM-MAP.zones.target_boxes.absorbs)"
  - "F2 · Reasignar Valeria→supervisora (chat sidebar, no caja de valor) + Mateo→Operar/Mi Día (agenda+bookings)"
  - "F3 · Cockpit MapView.tsx: render por zona + lentes trabajadores/proceso (★ cross-brand TOOL — scope tools/, no producto vitalia)"
  - "F4 · Índice de acciones (Plano 2) generado del service layer (navegación agéntica sin grep) — diseño, posible diferir"
  - "F0 · Re-mapear backlog Fase 2 (~20 idea-stories) a las cajas/zonas nuevas (renombrar/re-tag)"

scope_boundary_note: >
  F3 (cockpit MapView) vive en tools/luana-cockpit/ = herramienta operativa CROSS-BRAND, NO producto vitalia.
  /pm-vitalia NO la owna. Se ejecuta en la misma tanda (fase solo-bootstrap permite) pero se trackea como
  tool-scope, no como cap de producto vitalia. La parte vitalia-propia es F0+F1+F2 (data: caps + SYSTEM-MAP + reassign).

next_action: "Chris ratifica la propuesta de organización (00-research.md) — decisiones: rol Valeria, split de cajas, re-mapeo backlog. Luego refining → /architect."
---

# vitalia-paradigm-map-zones

Story infra que **materializa el paradigma** (PARADIGM.md + ADR-010, cementados 2026-05-30) en el mapa del producto: migra de la taxonomía de 2 pseudo-agentes (`config`/`infra`) a **3 zonas** (Agentes · Plataforma · Infraestructura), reorganiza el backlog Fase 2 acorde, y prepara el cockpit para renderizar por zona.

Propuesta de organización completa + re-mapeo del backlog: ver `00-research.md`.

## Prior art scan

- **Engine:** N/A (el cockpit es tool operativa cross-brand, no engine package).
- **Vitalia propio:** `ADR-vitalia-005-capability-model-4-dimensions.md` (define las 4 dims actuales — esta story agrega la 5ª: zona, derivada) · `SYSTEM-MAP.yaml` (ya tiene el bloque `zones` draft 2026-05-30) · archive `vitalia-cockpit-live-reconciliation` (patrón cockpit lee filesystem) · archive `vitalia-shell-organism` (Ribbon + Valeria sidebar — informa el rol supervisor).
- **Comunify:** sin taxonomía de mapa propia aún (no aplica).
- **Decisión:** **extend** del modelo de capability (ADR-vitalia-005) + **new** cap infra `platform.product-map-zonas`. NO net-new from scratch — la doctrina ya está en PARADIGM.md/ADR-010; esto la aplica a los datos + tool.
