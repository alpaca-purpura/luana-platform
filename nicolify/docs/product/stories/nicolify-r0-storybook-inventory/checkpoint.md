---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
type: ui-story                        # cross-cutting design-system (como ds-adoption) — UI components 1:1 en Storybook
state: developed                     # developing→developed 2026-06-24 (/dev-team · T-1..T-6 GREEN)
phase: AWAIT_CHRIS_VERIFY            # G · Chris navega storybook :6006 + lee contrato § 9 → firma chris_verify.signoff (autonomous_mode:false → pausa-y-ofrece)
dod_live_verified: true              # técnica: Claude ejerció build-storybook (17/17 render) + dev server :6006 navegable + completeness_check
dod_evidence:
  - action: "build-storybook (cd nicolify/frontend && npx storybook build) — render-sanity de las 17 stories balde-3"
    observed: "exit 0 · storybook-static generado · 17/17 stories compilan+renderizan (Abel ICP 7 + moléculas 9 + roster doc-story)"
    log: "Storybook build completed successfully · Vite built in 12.01s"
  - action: "storybook dev :6006 navegable (dev server live) + completeness_check (cada componente clasificado en SHELL-DESIGN-CONTRACT § 9)"
    observed: "HTTP 200 · completeness_check exit 0 (cero componente sin clasificar) · eslint 0 errores"
    log: "contrato § 9: balde-3 (17) + balde-2 ports (9) + infra + roster (6 con status) + token-overrides"
dod_live_verified_note: "story técnica: la verificación es render-sanity + contrato completo, NO writes a dev-app (no es funcional). Chris ejerce en G navegando el storybook."
chris_verify:
  required: true
  signoff: null                      # → Chris firma tras navegar :6006 + leer contrato § 9
  rounds: []
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
last_artifact: demo-script.md
next_action: "DEVELOPED · G (AWAIT_CHRIS_VERIFY) 2026-06-24. T-1..T-6 GREEN (17 stories + infra + contrato § 9 1:1 + roster). Storybook dev :6006 navegable. → Chris navega + lee contrato + firma chris_verify.signoff (ver demo-script.md). Tras signoff → /pm-nicolify reconcile (R) → /auditor. Pendiente menor: ConfigTab sin story (anotado contrato § 9.1). build-claim code:design-system liberado."
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
