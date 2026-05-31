---
story_id: nicolify-r0-routing-empty-states
brand: nicolify
type: ui-story
state: idea
release: R0
architecture_pattern: ADR-nicolify-001
priority: critical
cap_target: null
cap_change_type: new
depends_on: [nicolify-r0-ribbon-subtabs]
r0_order: 7
parent_story: nicolify-r0-shell-organism   # design-story que cementó el contrato
spawned_at: 2026-05-29T21:28:00-05:00
spawned_by: pm-nicolify-r0-backlog
ssot_owner: /pm-nicolify
---

# nicolify-r0-routing-empty-states — checkpoint

## Goal

Routing [tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx (Next.js 16 + clerkMiddleware + not-found jerárquico + landing default) + empty-states elegantes por sub-tab del nav-tree.

## Contexto

Story de **R0 (Fundación + shell agéntico)**. Reuse del patrón de Vitalia re-temizado (ver `nicolify/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-nicolify-001-shell-feature-architecture.md}` + design-story `nicolify-r0-shell-organism`). Cargar skill `nicolify-design-system` antes de tocar FE.

## Next action

Refinar con `/pm-nicolify` → `/po-ux` (UI) o `/po` (service). Prior-art scan obligatorio. Gate ADR-003 (mockup) para componentes nuevos.
