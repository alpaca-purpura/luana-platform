<!-- voseo-allowed: internal outcome master refactored post shell-organism 2026-05-22 -->
---
outcome_id: vitalia-mvp-ui-foundation
brand: vitalia
status: active
priority: critical
spawned_at: 2026-05-17
last_updated: 2026-05-22
last_refactor: 2026-05-22                              # post shell-organism cement
ssot_owner: /pm-vitalia
parent_outcome: null
paradigm: shell-organism-agentico-v1                   # ★ post 2026-05-22 ★
related_outcomes:
  - dev-environment-multibrand
phase_macro:
  fase_1:
    label: "Shell esqueleto (réplica HTML mockup en Next.js + Shadcn + FSD)"
    target: "Dueño puede clickear los 6 tabs + 22 sub-tabs + expandir/colapsar Valeria + switchear tenant + theme. Empty-states navegables. Cero contenido real."
    stories_count: 11
    estimated_dev_weeks: "4-6 (paralelo posible)"
    blocker_hard: F1-S0
  fase_2:
    label: "Migración progresiva (1 historia por sub-tab live)"
    target: "Cada merge habilita una sub-tab real reemplazando empty-state. Reuse máximo de código shipped."
    stories_count: 22
    estimated_dev_weeks: "8-12 (paralelo limitado por deps + service-stories)"
    service_blockers:
      - vitalia-payment-adapter-mvp
      - vitalia-fiscal-emission-pe
stories_fase_1:
  - vitalia-fase1-stack-stability       # F1-S0 — blocker hard de TODO Fase 1
  - vitalia-fase1-design-tokens-theme   # F1-S1 — tokens CSS vars + theme toggle
  - vitalia-fase1-topbar-global         # F1-S2 — TopBar thin global
  - vitalia-fase1-tenant-switcher       # F1-S3 — dropdown clínicas
  - vitalia-fase1-shell-layout-5050     # F1-S4 — grid 50/50 + route group
  - vitalia-fase1-valeria-rail-history  # F1-S5 — sidebar transpuesta copilot
  - vitalia-fase1-valeria-chat-skeleton # F1-S6 — chat structure mock
  - vitalia-fase1-ribbon-6-tabs         # F1-S7 — ribbon 5 agentes + config
  - vitalia-fase1-sub-tabs-line2        # F1-S8 — sub-tabs línea 2 dinámica
  - vitalia-fase1-routing-shell         # F1-S9 — App Router + redirects
  - vitalia-fase1-empty-states          # F1-S10 — 22 placeholders navegables
stories_fase_2:
  valeria:
    - vitalia-fase2-valeria-agenda           # F2-S1 — refactor desde slice-1-agenda
    - vitalia-fase2-valeria-pacientes        # F2-S2
  adrian:
    - vitalia-fase2-adrian-inbox             # F2-S3 — REUSE inbox+sales_agent
    - vitalia-fase2-adrian-embudo            # F2-S4 — refactor desde slice-1-pipeline
    - vitalia-fase2-adrian-outbound          # F2-S5 — REUSE fidelización
    - vitalia-fase2-adrian-propuestas        # F2-S6
  lisa:
    - vitalia-fase2-lisa-marca               # F2-S7 — REUSE brand_studio
    - vitalia-fase2-lisa-doctores            # F2-S8
    - vitalia-fase2-lisa-servicios           # F2-S9 — toggle Catálogo|Escalera
    - vitalia-fase2-lisa-compliance          # F2-S10 — REUSE medical-compliance
  camila:
    - vitalia-fase2-camila-voz               # F2-S11 — REUSE NPS+fidelización
    - vitalia-fase2-camila-reactivar         # F2-S12
    - vitalia-fase2-camila-multiplicar       # F2-S13 — referrals mudan de Lucas
    - vitalia-fase2-camila-reputacion        # F2-S14 — planned scaffold
  lucas:
    - vitalia-fase2-lucas-lanzar             # F2-S15
    - vitalia-fase2-lucas-envuelo            # F2-S16
    - vitalia-fase2-lucas-recursos           # F2-S17
    - vitalia-fase2-lucas-resultados         # F2-S18
    - vitalia-fase2-lucas-mercado            # F2-S19
  config:
    - vitalia-fase2-config-cuenta            # F2-S20
    - vitalia-fase2-config-conexiones        # F2-S21
    - vitalia-fase2-config-avanzado          # F2-S22
service_stories_laterales:
  - vitalia-payment-adapter-mvp              # state: refining → refined cuando F2-S1/S4/S6 lo necesiten
  - vitalia-fiscal-emission-pe               # state: refining → refined cuando F2-S1 lo necesite
parked_stories:
  - vitalia-pricing-decision                 # idea, decision-only no toca shell
refactored_stories:
  - vitalia-slice-1-agenda → vitalia-fase2-valeria-agenda
  - vitalia-slice-1-pipeline → vitalia-fase2-adrian-embudo
dropped_stories:
  - vitalia-slice-1-marketing-integration    # Tailwind diag absorbido en F1-S0 · sidebar tradicional muere con shell-organism
archived_stories_v1:
  - vitalia-slice-1-onboarding-wizard        # done — sigue valido sin shell-organism (login flow)
  - vitalia-slice-1-infra-cross-cutting      # done — infra base
  - vitalia-slice-1-inbox                    # archived 2026 — superseded por F2-S3 adrian-inbox
  - vitalia-slice-1-fidelizacion             # archived 2026 — superseded por F2-S11 camila-voz + F2-S5 outbound
  - vitalia-slice-1-marketing                # archived 2026 — superseded por F2-S17 lucas-recursos
  - vitalia-copilot-tools-impl               # archived 2026 — defer_audit, Lucas screening tool ya shipped
  - vitalia-auth-base-functional             # archived 2026 — done
  - vitalia-adopt-luana-core-iam             # archived 2026 — done
  - vitalia-dev-stack-functional             # archived 2026 — done
  - vitalia-ux-discovery                     # archived 2026 — split + done
  - vitalia-shell-organism                   # archived 2026-05-22 post merge artifact
---

# vitalia-mvp-ui-foundation — Outcome Master (refactorizado 2026-05-22)

## Goal post-shell-organism

Construir el MVP UI funcional de Vitalia bajo el paradigma **shell-organism agéntico** (cementado 2026-05-22): 5 empleados-IA tab (Lisa · Lucas · Adrián · Valeria · Camila) + 1 Configurar admin · panel Valeria chat persistente 50% izquierdo · panel App 50% derecho con ribbon + sub-tabs + contenido per agente.

**Visión norte:** "Como una secretaria real." El dueño habla con Valeria por chat (WhatsApp/web) y los agentes ejecutan internamente. La UI es espejo visual de lo que los agentes hacen.

## Cambio de paradigma (2026-05-22)

Pre-2026-05-22: outcome era 3 slices basados en sidebar tradicional + content vertical (slice-1 P1 · slice-2 P2 · slice-3 P3). Slice 1 estaba 60% done con 5 stories shippeadas.

Post-2026-05-22: outcome refactorizado a **2 fases macro**:

1. **Fase 1 = Shell esqueleto** — 11 stories que replican el mockup HTML en Next.js + Shadcn + FSD, con todas las sub-tabs vacías (empty-states navegables)
2. **Fase 2 = Migración progresiva** — 22 stories (1 por sub-tab activa) que traen features shipped al espacio correcto del shell-organism

Las 5 stories slice-1 shippeadas previas (onboarding-wizard, infra-cross-cutting, inbox, fidelización, marketing, copilot-tools-impl) ya están archivadas — sus capabilities serán **migradas** al shell-organism vía stories Fase 2 (no re-shipped).

## SSoT referencias

- **Mockup HTML visual:** `vitalia/docs/product/stories/vitalia-shell-organism/mockups/dual-mode-shell.html`
- **Design Contract atomic design:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Story template detallado:** `vitalia/docs/specs/templates/01-spec-shell-template.md`
- **Navigation tree JSON:** `vitalia/docs/product/stories/vitalia-shell-organism/navigation-tree.md`
- **Session baseline 17 decisiones:** `vitalia/docs/product/stories/vitalia-shell-organism/00-session-baseline.md`
- **Merge artifact:** `vitalia/docs/product/stories/vitalia-shell-organism/07-merge.md`

## Decisiones técnicas ratificadas Chris 2026-05-22

1. **Shadcn UI se instala AHORA** en `vitalia/frontend/` (D1)
2. **Deprecar `.vt-*` utility classes COMPLETO** (D2) — 150+ classes migran progresivamente
3. **Migration path = route group paralelo** `(shell-organism)/` (D3) — coexiste con `(dashboard)/` viejo
4. **Verificar Tailwind v4 empíricamente** (D4) — F1-S0 incluye browser visual check
5. **Atomic design strict** (D5) — átomos · moléculas · organismos · templates · pages
6. **Cada componente requiere Playwright golden visual + funcional test** (D6) — zero deuda técnica

## Mapeo Fase 1 → componentes (resumen)

| Story | Construye | Path componente principal |
|---|---|---|
| F1-S0 stack-stability | Shadcn install + tokens base + .vt-* deprecation plan | (infra) |
| F1-S1 design-tokens-theme | CSS vars globals.css + tailwind.config + ThemeProvider + ThemeToggle | `components/shared/shell-organism/ThemeToggle.tsx` |
| F1-S2 topbar-global | TopBarGlobal + LogoMark | `components/shared/shell-organism/TopBarGlobal.tsx` |
| F1-S3 tenant-switcher | TenantSwitcher + TenantOption + tenantStore | `components/shared/shell-organism/TenantSwitcher.tsx` |
| F1-S4 shell-layout-5050 | ShellOrganismLayout + route group | `app/[tenantId]/(shell-organism)/layout.tsx` |
| F1-S5 valeria-rail-history | ValeriaSidebar + Rail + History + keyboard shortcuts | `components/shared/shell-organism/ValeriaSidebar.tsx` |
| F1-S6 valeria-chat-skeleton | ValeriaChat + ChatHeader + MessageBubble + Composer | `components/shared/shell-organism/ValeriaChat.tsx` |
| F1-S7 ribbon-6-tabs | Ribbon + RibbonTab + ConfigTab | `components/shared/shell-organism/Ribbon.tsx` |
| F1-S8 sub-tabs-line2 | SubTabsBar + SubTab | `components/shared/shell-organism/SubTabsBar.tsx` |
| F1-S9 routing-shell | App Router pages + AGENT_CATALOG + AGENT_SUBTABS | `app/[tenantId]/(shell-organism)/{agent}/{subtab}/page.tsx` |
| F1-S10 empty-states | EmptyState + PlaceholderCard + 22 sub-tab pages | `components/shared/shell-organism/EmptyState.tsx` |

## Dependency graph Fase 1

```
F1-S0 stack-stability ──┬──→ F1-S1 design-tokens-theme ──┬──→ F1-S2 topbar-global ──┐
                        │                                 │                          │
                        │                                 └──→ F1-S5 valeria-rail   │
                        │                                                            │
                        └──→ F1-S4 shell-layout-5050 ─────────────────────────────────┤
                                                                                     │
                                                                          F1-S9 routing-shell
                                                                                     │
                F1-S6 valeria-chat ────────────────────────────────────────────────  │
                F1-S3 tenant-switcher ──→ F1-S2 (depends)                            │
                F1-S7 ribbon-6-tabs ────→ F1-S4 (depends)                            │
                F1-S8 sub-tabs ─────────→ F1-S7 (depends)                            │
                F1-S10 empty-states ────→ F1-S9 (depends)                            │
                                                                                     ↓
                                                                            Fase 1 DONE
```

## Dependency graph Fase 2

Cada story Fase 2 depende HARD de Fase 1 DONE (shell esqueleto navegable). Dentro de Fase 2, dependencies cruzadas son SOFT excepto cuando service-story BE bloquea:

- F2-S1 valeria-agenda HARD depende `vitalia-payment-adapter-mvp` + `vitalia-fiscal-emission-pe`
- F2-S4 adrian-embudo HARD depende `vitalia-payment-adapter-mvp`
- F2-S6 adrian-propuestas HARD depende `vitalia-payment-adapter-mvp`
- Resto: independientes (paralelo posible)

## Prioridad recomendada Fase 2

| Orden | Agente | Razón |
|---|---|---|
| 1 | Valeria (Agenda → Pacientes) | Operación día-a-día · primer valor visible |
| 2 | Adrián (Inbox → Embudo → Outbound → Propuestas) | Closer + alto reuse de shipped |
| 3 | Lisa (Marca → Doctores → Servicios → Compliance) | Brand + assets semi-estáticos · alto reuse |
| 4 | Camila (Voz → Reactivar → Multiplicar → Reputación) | Post-revenue CLTV · alto reuse NPS shipped |
| 5 | Lucas (Lanzar → En vuelo → Recursos → Resultados → Mercado) | Growth · mix shipped + new |
| 6 | Configurar (Mi cuenta → Conexiones → Avanzado) | Admin · uso poco frecuente |

## Anti-objetivos

- **NO** rehacer features ya shipped — solo refactorizar UI al shell-organism
- **NO** introducir nuevos modelos BE (excepto donde Fase 2 explícitamente lo requiera, ej. LadderSlot)
- **NO** tocar `core/luana-core-*` (engine read-only para FE Vitalia)
- **NO** romper rutas `/(dashboard)/` durante Fase 1 (coexistencia hasta Fase 2 completa)
- **NO** instalar Shadcn UI en otras brands desde aquí (Vitalia first, otras siguen su tiempo)

## Status global

| Fase | Stories | State distribución |
|---|---|---|
| Fase 1 | 11 | 11 × `idea` post-Task #5-6 generación |
| Fase 2 | 22 | 22 × `idea` post-Task #7-11 generación |
| Service laterales | 2 | 2 × `refining` (state actual) |
| Refactored | 2 | 2 × `idea` (slice-1-agenda → fase2-valeria-agenda · slice-1-pipeline → fase2-adrian-embudo) |
| Dropped | 1 | 1 × `dropped` (slice-1-marketing-integration) |
| Total nuevas/cambiadas | 37 stories | Generación pending Tasks #5-#13 |

## Changelog outcome

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-05-17 | Spawned. 3 slices tradicionales (P1 · P2 · P3) |
| 1.1 | 2026-05-18 | infra-cross-cutting → done |
| 1.2 | 2026-05-21 | marketing → done |
| **2.0** | **2026-05-22** | **REFACTOR COMPLETO post shell-organism. Paradigma actualizado. Fase 1 + Fase 2 cementadas. 37 stories nuevas/cambiadas. Outcome es ahora contenedor del backlog migración shell-organism** |
