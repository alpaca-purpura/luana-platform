---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
type: ui-story                        # cross-cutting design-system (como ds-adoption) — UI components 1:1 en Storybook
state: ready                         # refined→ready 2026-06-24 (/architect cerró ready package: 03-arch + 04-validators + 05-guidelines + 06-tickets + dispatch-plan)
release: R0                          # Fundación — inventario completo ANTES de crecer hoja por hoja
map_zone: infraestructura            # atributo de calidad (inventario navegable de la UI) · derivada SYSTEM-MAP::zones
map_box: plataforma-tecnica
map_area: design-system
module: design-system                # bucket code:design-system
architecture_pattern: ADR-014-design-system-homologation   # design-system (NO ADR-nicolify-001 — no construye sub-tab). Espeja a ds-adoption. Corregido al cerrar refined 2026-06-24.
cap_target: design-system/nicolify-ui-homologation   # extiende la homologación (Chris OQ-2 2026-06-24) — /architect confirma al ready
cap_change_type: extend              # Chris ratificó OQ-2 — extend de nicolify-ui-homologation
route: null                          # cross-cutting — no es una hoja con ruta
demo_required: true                  # storybook navegable + componentes render fiel
verification_nature: técnica         # render-sanity + a11y + completitud contrato + clasificación. Sin demo funcional de usuario.
last_artifact: 06-tickets.yaml       # ready package completo (/architect 2026-06-24): 03-arch{,-fe,-docs} + 04-validators + 05-guidelines + 06-tickets + dispatch-plan
ready_package:                       # /architect 2026-06-24
  - 03-arch.md                       # consolidado FE+DOCS · § Prior art · § Existing systems audit (NO-NEW-LAYER) · § FE clasificación 3 baldes + 15 stories balde-3 · § Patrón decorators · § Esquema contrato 1:1 · § Integration design (CONN)
  - 03-arch-fe.md                    # surface FE (builder-frontend, auditor-frontend, workhorse)
  - 03-arch-docs.md                  # surface DOCS contrato (builder-frontend, production_code:false)
  - 04-validators.yaml               # técnica: tsc/eslint(no-arbitrary)/build-storybook/arch-fitness(ratchets)/completitud/clasificación/roster. a11y advisory (no test-runner). SIN anti-burbuja, SIN e2e rutas, SIN dev_app_verified writes, SIN mutation
  - 05-guidelines.md                 # must_load_skills + patterns required/forbidden + files in scope + NEVER touches
  - 06-tickets.yaml                  # 6 tickets FE+DOCS · DAG T-1(clasificación)→T-2(infra)→T-3/T-4(stories)→T-5(roster)→T-6(contrato) · workhorse · assignment block per ticket
  - dispatch-plan.md                 # autonomous_mode:false default · caps · matriz costo · DAG · sin playwright visual scope (no rutas)
arch_decisions:                      # /architect cerró estas (default architect, Chris ratifica al BUILD/demo)
  - "OQ-1 a11y: ADVISORY (no @storybook/test-runner instalado) + verificación manual en demo + anotar HB para test-runner si se quiere HARD cross-brand"
  - "OQ-2 HB-106/107 NO son vapor (corrección al spec): no-div-layout/no-native-select (HB-106) + no-local-kit-primitive (HB-107) CORREN en nicolify (seeded 2026-06-24, ratchets) + @luana/ds/no-arbitrary-value eslint error. Vapor = SOLO el promote-gate mecánico (auditor por prosa)"
  - "OQ-3 SubTabContent/ShellLayoutWire/_agent-tw-classes/types = wire/dispatcher/helper no-storiable (listados en contrato como infra de routing, no balde 1/2/3)"
  - "Clasificación cerrada: balde-1 = @luana/ui-kit (citar) · balde-2 = components/ui/* (8) + ConfigTab/SubSubTabsBar/SubSubTab ports · balde-3 = Abel ICP (7) + moléculas nicolify-only (8) = 15 stories + 1 roster doc-story"
ratified_by_chris: true              # Chris ratificó 01-spec.md 2026-06-24 (técnica: 1 sola firma, sin mockup creativo)
depends_on:
  - "Fase 0 · HB-103+paridad (doctrina Storybook-first cross-brand) — ✅ COMMITEADA 891306d8 (2026-06-24). Prereq DURO satisfecho."
related_stories:
  - "nicolify-r0-design-system-adoption (homologación — la base que esto inventaría · MISMO bucket code:design-system · en G AWAIT_CHRIS_VERIFY, exenta WIP-cap; idealmente cerrar su demo+signoff antes del BUILD de esta para inventariar piezas estables)"
blocked_on: []                       # Fase 0 commiteada 891306d8 → desbloqueado para refine
last_modified: 2026-06-24
next_action: "READY 2026-06-24 (/architect cerró ready package). → /dev-team nicolify nicolify-r0-storybook-inventory (autonomous_mode:false default — Chris opt-in). DAG: T-1 clasificación grep-cross-kit BLOQUEA TODO → T-2 infra storybook (decorators/mocks/fixtures) → T-3 Abel ICP (7) + T-4 moléculas shared (8) → T-5 roster doc-story → T-6 contrato 1:1. Tier workhorse (builder-frontend, NO flagship). NOTA build-time: lock code:design-system lo ocupa ds-adoption (en G) — idealmente cerrar su demo+signoff antes del BUILD de esta. DoD técnica = storybook navegable + contrato 1:1 (NO write live → dev_app_verified.required:false)."
intake_handshake: "La conversación de diseño (zona/caja + extiende-o-nuevo + prior-art) ocurrió en sesión 2026-06-24 — ver 00-research.md § Intake + chris-input.md. La story NACE de esa conversación."
---

# nicolify-r0-storybook-inventory — Inventario 1:1 de la UI en Storybook

> **Idea (handoff durable 2026-06-24).** Esta story es el **hogar de usuario** del plan "todo lo de UI sale del Storybook" (Chris no quiso ADR — es trabajo de producto, no arquitectura permanente). El research completo (findings de 3 subagentes + plan de 4 fases + decisiones) está en `00-research.md`.

## Qué resuelve (en una línea)

Que **todo componente UI de nicolify viva en un Storybook navegable** (compartido `@luana/ui-kit` + brand-local), de modo que (a) los mockups se compongan partiendo de componentes reales, (b) `/architect` le diga a `/dev-team` el átomo/molécula/token exacto, y (c) Chris pueda saber **todos los componentes de su solución que tendría que modificar** ante un cambio de UI.

## Alcance de ESTA story (Fase 1 del plan)

- Escribir las **stories `.stories.tsx`** de los componentes brand-local existentes de nicolify (Abel ICP + shell wiring + intake + avatares) en `nicolify/frontend/.storybook` (infra YA montada, 0 stories hoy).
- Subir `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` a **inventario 1:1 completo** (cada componente → path + props + estado + link a story + kit-consumido vs brand-local).

## Fuera de scope (otras fases — ver 00-research.md)

- **Fase 0** (doctrina Storybook-first) → harness, EN CURSO (HB-103, sesión aparte).
- **Fase 2** (loop activo) → emergente, no es trabajo discreto.
- **Fase 3** (manifiesto machine-readable consultable) → **CORE/cross-brand → `/pm-luana`** (no esta story).
