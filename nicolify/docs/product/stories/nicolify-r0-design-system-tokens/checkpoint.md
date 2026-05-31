---
story_id: nicolify-r0-design-system-tokens
brand: nicolify
type: ui-story
state: idea
release: R0
architecture_pattern: ADR-nicolify-001
priority: critical
cap_target: null
cap_change_type: new
depends_on: [nicolify-r0-dev-stack]
r0_order: 2
parent_story: nicolify-r0-shell-organism   # design-story que cementó el contrato
spawned_at: 2026-05-29T21:28:00-05:00
spawned_by: pm-nicolify-r0-backlog
ssot_owner: /pm-nicolify
---

# nicolify-r0-design-system-tokens — checkpoint

## Goal

globals.css + tailwind.config.ts con la paleta de nicolify.com (primario #635BFF, agentes, neutros slate) + fuentes League Spartan + Bree Serif + dark mode + ThemeToggle + Z-index de @luana/design-tokens + _agent-tw-classes.ts (JIT-safe).

## Contexto

Story de **R0 (Fundación + shell agéntico)**. Reuse del patrón de Vitalia re-temizado (ver `nicolify/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-nicolify-001-shell-feature-architecture.md}` + design-story `nicolify-r0-shell-organism`). Cargar skill `nicolify-design-system` antes de tocar FE.

## Next action

Refinar con `/pm-nicolify` → `/po-ux` (UI) o `/po` (service). Prior-art scan obligatorio. Gate ADR-003 (mockup) para componentes nuevos.
