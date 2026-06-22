---
story_id: core-ds-foundation
type: platform-engineering                          # engine @luana/ui-kit + harness (catálogo/mockup-kit/lint). NO brand UI.
owner: /pm-luana
state: refining
phase: AWAIT_CHRIS_RATIFY_SCOPE                     # scope consolidado escrito; Chris ratifica → /architect ready package
parent_outcome: luana-core-ui-foundation           # docs/product/outcomes/luana-core-ui-foundation.md (§2026-06-07 ya la nombra)
release: null                                       # engine/infra — no entra en release de marca
cap_target: null                                    # infra del design system, no capability de producto
cap_change_type: null
parent_story: null
created: 2026-06-21
priority: HIGH
estimated_effort: Fase 0 (machinery) ~3-5 días · Fase 1 (componentes+showcase) ~2 sem · Fase 2 (arch-test) ~2-3 días

# Contrato visual YA ratificado (no hay nuevo mockup gate)
visual_contract: design-system-canon.md (ratified Chris 2026-06-08) + vitalia-ds-showcase/mockups/showcase.html
ratified_visual_by_chris: true                      # el showcase + canon SON la ratificación visual del DS

dependencies:
  hard: []                                          # Fase 0 (machinery) no depende de nada de feature
  soft:                                             # Fase 1 (build de componentes) gatea detrás del shell-lift + stories abiertas (outcome L61/L79)
    - lift-shell-organism-to-core                   # accepted; corre cuando cierren las stories abiertas
gating: |
  Fase 0 (catálogo + mockup-kit + drift-lint + tokens-lock · solo config/tokens/tooling, CERO código de feature)
  PUEDE arrancar YA (outcome L79). Fase 1 (layout-primitives + Entity*/EntityPicker + componentes nuevos
  D11 + showcase route) gatea detrás del shell-lift + stories de marca abiertas (outcome L61).

# Consumers downstream que resumen + promueven HACIA el inventario después de Fase 0
downstream_consumers:
  - vitalia-fase2-mateo-nueva-cita                  # D11 · parked refining/AWAIT_MOCKUP · origen de este scope
  - vitalia-fase2-mateo-vista-semana               # D12 · idea/scaffold · consumer de AvailabilityStrip
  - "{brand}-ds-adoption ×N"                        # Fase 3 (aparte, por marca · /pm-{brand})
---

# core-ds-foundation — Design System foundation (inventory-first)

## Qué es

El build del design system homologado en `core/@luana/ui-kit` + la **maquinaria de inventario** que
lo mantiene al día. Consolida Fase 0+1+2 (canon §4). **Contrato + ejemplos de código = SSoT en
`docs/architecture/luana-platform/design-system-canon.md`** (este checkpoint NO lo duplica — apunta).

**Origen del arranque (2026-06-21):** refinando el mockup de la story vitalia D11 (`vitalia-fase2-mateo-nueva-cita`,
/po-ux) se detectó que el inventario del DS **no es accesible ni mantenible** → causa raíz de la proliferación
de "local" + UX no uniforme cross-brand. Chris ratificó **inventory-first → full core-ds-foundation** como vehículo.

## Diagnóstico de inventario (grounded · recon 2026-06-21)

| Pieza de maquinaria | Estado hoy |
|---|---|
| Catálogo generado de componentes | ❌ no existe — `@luana/ui-kit/src/index.ts` hand-commented · skill `vitalia-design-system` hand-narrado, **cero sync** con el código |
| mockup-kit (mockups componen del shared) | ❌ no existe — **9 `_shared.css` divergentes** copy-paste (vitalia+nicolify) ya driftean |
| drift-lint (FE) | ❌ planned/unbuilt — 368 arbitrary-values en vitalia · anti-duplication FE counterpart **nunca escrito** (BE-only) |
| /showcase route | ❌ static HTML only (canon §5 lo quiere ruta viva) |

## Fases

| Fase | Objetivo | Contenido | Gating |
|---|---|---|---|
| **0 — MACHINERY** (inventory-first) | que el inventario sea **mantenible** antes de promover nada | (1) **catálogo generado** desde `ui-kit/src/index.ts` (+ átomos de marca) → md/json que leen el skill `vitalia-design-system` + cockpit + `/architect` + `/po-ux` (mata el hand-narration + el "spawneá un agente para leer index.ts"; **alimenta** el lint) · (2) **mockup-kit** = UN stylesheet/kit mockup canónico que las stories `@import` en vez de copiar `_shared.css` + back-port de los 9 `_shared.css` (fidelidad-por-construcción, R-FID) · (3) **drift-lint** = eslint `no-arbitrary-value` + arch-test FE no-div-layout / no-reinvento-de-componente-catalogado (FE counterpart de `anti-duplication`) · (4) escala de spacing tokenizada en `@luana/design-tokens` | ✅ puede arrancar YA (solo tooling/tokens) |
| **1 — COMPONENTES** | construir el lego | ~10 layout-primitives (Page/Header/Section/Toolbar/FilterBar/Empty/Error/Detail/Form/EntityWorkspaceLayout) + `EntityInfoCard`/`EntityPicker`/`EntitySubNavBar` + page-archetypes + **/showcase route viva** + los **deltas D11** (abajo) | ⛔ gatea tras shell-lift + stories abiertas |
| **2 — ENFORCEMENT** | que no driftee nunca | arch-test FE (ratchet shrink-only) + `frontend-visual-fidelity` D1 mecánico | tras Fase 1 |

## Deltas de componentes (del audit D11 · aplicar el test del 2º-consumidor)

- 🚀 **PROMOVER genérico a `@luana/ui-kit`** (Fase 1):
  - `SegmentedControl`/`ToggleGroup` — **consolida el duplicado existente** `.toggle-pill` (Día/Semana/Mes) + `.segmented` (Canal). Un solo atom.
  - `EntityRow`/`EntityChip` — un molecule que cubre patient-chip + doc-suggest rows + typeahead items (misma forma ×3).
  - `PageHeader` con **slot de back-affordance** — el patrón "hoja alcanzada desde un padre". **NO es `EntitySubNavBar`** (eso es entity-workspace; la trampa del mockup que decía "espeja EntitySubNavBar").
- ✅ **REUSAR, no crear** (lo enforça el drift-lint + catálogo): `avail-chip` + `dur-badge` → variantes semánticas de `Badge`/status-pill. Matar el local.
- 🟡 **vitalia-shared (NO core aún, NO features/mateo local):** `AvailabilityStrip`/day-timeline — nace en vitalia (D11 AC-8 + D12 vista-semana = ≥2 consumers), lift-candidate al 2º brand. **/pm-vitalia** lo owna (handoff).
- 🟡 **ADAPT + flag (1 consumer, no abstraer):** `ComputedField` (disabled Input + hint) — promotion-candidate al 2º consumer.

## Handoffs requeridos (anti-creep — `/pm-luana` NO los ejecuta)

- **/pm-vitalia** — parkear D11 (anotar soft-dep nueva → core-ds-foundation en `vitalia/.../vitalia-fase2-mateo-nueva-cita/checkpoint.md`) · ownear `AvailabilityStrip` vitalia-shared + `{brand}-ds-adoption`.
- **/architect** (`<brand>: platform`) — ready package de core-ds-foundation tras ratificación de scope de Chris.
- **/harness-issue** — capturar el hallazgo "inventario sin catálogo vivo + mockups driftean por copia" al CIL (no se toca `docs/process/harness-backlog.md` directo — lo tiene otra sesión).

## Bitácora

- **2026-06-21 — /pm-luana: scaffold.** Story creada (no existía). Disparada por el audit UI de D11 (/po-ux) + ratificación de Chris "inventory-first → full core-ds-foundation". Scope = Fase 0 machinery (catálogo + mockup-kit + drift-lint + tokens-lock) primero + Fase 1 componentes (incl. deltas D11) + Fase 2 arch-test. Contrato durable = `design-system-canon.md`. state=refining, phase=AWAIT_CHRIS_RATIFY_SCOPE. **Próximo:** Chris ratifica el scope consolidado → `/architect` ready package (empezando por Fase 0).
