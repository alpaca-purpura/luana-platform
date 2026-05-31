---
story_id: build-autosave-primitive-luana
brand: platform
type: ui-story
state: ready
phase: READY_PACKAGE_CLOSED
last_artifact: 06-tickets.yaml
outcome: autosave-primitive-platform
adr: docs/architecture/luana-platform/ADR-012-autosave-primitive-platform.md
cap_target: null
cap_change_type: new
agent_owner: n/a
module: luana-core-ui
autonomous_mode: true
autonomous_mode_ratified_by: chris
touches_brands: [nicolify]   # platform story: reescribe form-runtime de nicolify sobre useAutosave (ADR-012)
last_modified: '2026-05-31T01:40:00.000Z'
spawned_at: '2026-05-31'
spawned_by: pm-luana-adr012
ratified_by_chris: true
ratified_by_chris_at: '2026-05-31T01:40:00-05:00'
parallel_safe: true
next_action: /architect platform build-autosave-primitive-luana → ready package → /dev-team → /auditor → done
goal: >-
  Construir la primitiva de autoguardado compartida en core/@luana: useAutosave (@luana/hooks)
  + <AutosaveBadge> (@luana/ui-kit) + AutosaveContract (@luana/schemas), con tests + un consumer
  de referencia. Reconcilia el patrón ya probado en vitalia + nicolify (decisión ADR-012). NO
  migra brands todavía (eso son stories consumer separadas del outcome).
---
# build-autosave-primitive-luana — checkpoint

## Goal

Construir la **primitiva de autoguardado compartida** en `core/@luana` (decisión **ADR-012**):
`useAutosave(contract)` (@luana/hooks) + `<AutosaveBadge>` (@luana/ui-kit) + `AutosaveContract` (@luana/schemas).
Con tests + un consumer de referencia. Esta story construye la PRIMITIVA; la adopción de vitalia y nicolify
son stories consumer separadas (ver outcome `autosave-primitive-platform`).

## Diseño de entrada

El contrato + homes + migración están en **ADR-012** (accepted). El `/po-ux`/`/architect` reconcilian el
patrón real ya probado:
- vitalia: `vitalia/frontend/src/features/lisa/hooks/use{Identity,Personality,Contact,Visuals}Autosave.ts`
  + `components/marca/shared/AutosaveBadge.tsx` (incl. el fix de robustez `getTokenReady` de
  `arreglar-guardado-voz-y-tono`).
- nicolify: ~23 archivos equivalentes (a inspeccionar para reconciliar el contrato).

## Contrato (de ADR-012 — refina /architect)

debounce (default 600ms) · estados idle/dirty/saving/saved/error · auth-ready robusto (no `throw` ante token
null transitorio) · retry/backoff · invalidación React Query · telemetría estándar opt-in · manejo de error
consistente (badge error + reintento) · `getToken` inyectado (no acopla a Clerk) · persistencia verificable
(no asume 200 = guardado).

## Scope

- BUILD: `core/@luana/hooks/`, `core/@luana/ui-kit/`, `core/@luana/schemas/` + tests + consumer ref.
- NO toca brands todavía (adopción = stories consumer separadas).
- Engine/shared (`core/@luana/*`) → es trabajo de plataforma autorizado por `/pm-luana` (ADR-012 accepted).

## Estado

`refining` · ratificada por Chris (ADR-012 accepted). Próximo: `/po-ux` platform escribe 01-spec.
