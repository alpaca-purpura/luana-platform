---
story_id: nicolify-r0-luana-chat
brand: nicolify
type: ui-story
state: idea
release: R0
architecture_pattern: ADR-nicolify-001
priority: critical
cap_target: null
cap_change_type: new
depends_on: [nicolify-r0-shell-layout-splitter]
r0_order: 5
parent_story: nicolify-r0-shell-organism   # design-story que cementó el contrato
spawned_at: 2026-05-29T21:28:00-05:00
spawned_by: pm-nicolify-r0-backlog
ssot_owner: /pm-nicolify
---

# nicolify-r0-luana-chat — checkpoint

## Goal

LuanaSidebar (panel orquestador izq): 3 estados LuanaRail/LuanaHistory/LuanaChat skeleton (ChatHeader + MessageBubble + ChatComposer + TypingIndicator). El único rostro: intención→delega→reporta. Avatar de Luana.

## Contexto

Story de **R0 (Fundación + shell agéntico)**. Reuse del patrón de Vitalia re-temizado (ver `nicolify/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-nicolify-001-shell-feature-architecture.md}` + design-story `nicolify-r0-shell-organism`). Cargar skill `nicolify-design-system` antes de tocar FE.

## Next action

Refinar con `/pm-nicolify` → `/po-ux` (UI) o `/po` (service). Prior-art scan obligatorio. Gate ADR-003 (mockup) para componentes nuevos.
