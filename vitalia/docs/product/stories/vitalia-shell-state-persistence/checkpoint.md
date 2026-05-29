---
story_id: vitalia-shell-state-persistence
release: F1
type: ui-story-followup
agent_owner: shell
module: shell-organism
cap_target: valeria.shell
cap_change_type: fix
architecture_pattern: ADR-vitalia-004
state: idea
last_modified: 2026-05-28T00:00:00-05:00
parent_story: vitalia-fase1-shell-layout-5050-race-fix
priority: medium
estimated_dev_days: 1-2
hipaa_lite_scope: not_applicable
parallel_safe: true

# Legacy compat (deprecation gradual)
outcome: vitalia-mvp-ui-foundation
phase: fase-1
---

# vitalia-shell-state-persistence — checkpoint

## Goal

Arreglar **2 bugs reales acoplados** descubiertos al des-oxidar la suite E2E F1-S4
(origen: `vitalia-fase1-shell-layout-5050-race-fix`, sesión 2026-05-28):

1. **Persistencia del shell-store rota (PROD REAL, confirmado).** `valeriaState` y
   `shellMode` NO sobreviven un reload: el usuario setea rail vía el store (click /
   shortcut → `localStorage = rail` ✓), recarga, y vuelve a `full`. Su preferencia
   de panel/modo se pierde en cada reload.

2. **Drawer mobile auto-abre (acoplado a #1).** A <768px con default `full`, el
   ValeriaSidebar renderiza su drawer (`createPortal`, `role=dialog`) ABIERTO al
   cargar, sin tocar el burger. `useViewportGuard` no cubre <768. Decisión UX +
   acoplado a que el shell siempre arranca en default `full`.

## Diagnóstico previo

→ Ver `00-research.md` (root cause completo + técnicas probadas que fallan +
evidencia de que es prod-real). **Leer ANTES de intentar el fix** — ahorra el
rabbit hole de ~10 iteraciones ya recorrido.

## Tests de regresión (ya escritos, SKIPPED esperando este fix)

Des-skipear al resolver (quitar `.skip` + el tag `[DEFERRED: ...]`):
- `resize-and-state.spec.ts` → `shell state (valeriaState) survives reload`
- `resize-and-state.spec.ts` → `state rail->full snap-up to min (580 full)` (depende de que rail aplique)
- `mobile-collapse.spec.ts` → `ValeriaSlot oculto mobile`

## Pre-condiciones / enfoque sugerido

- TDD con **unit tests de hydration del store** (vitest) además del E2E — el bug es
  de timing SSR+hydration, difícil de iterar solo por E2E.
- Confirmar el mecanismo EXACTO del write espurio `full` (el diagnóstico dejó el
  root cause de alto nivel claro pero el write exacto sin pinpoint 100%).
- NO parche frágil sobre shipped: probablemente requiere sacar el store del path
  SSR (TopBarGlobal en skeleton) o el patrón Zustand+Next bien implementado.

## Next action

`/pm-vitalia refinemos vitalia-shell-state-persistence` cuando se priorice.
