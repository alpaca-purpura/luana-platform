---
story_id: vitalia-fase2-config-onboarding-clinica
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
state: idea
architecture_pattern: ADR-vitalia-004
agent_owner: config
module: onboarding
capability: config.onboarding_clinic
spawned_at: 2026-05-26
spawned_by: /pm-vitalia (via /po-ux session lisa-marca refinement)
spawn_reason: "Separación cementada: clinic_vertical + primary_specialties capturados en primer setup (esta story), read-only en lisa-marca. Decisión Chris 2026-05-26 (lisa-marca refinement)."
last_modified: 2026-05-26
ratified_by_chris: false
ratified_visual_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 3-5                       # ★ bumped 2-3 → 3-5 post D3 ratification (REPLACE legacy + 16 files refactor)
ratified_decisions:
  - id: D3
    date: 2026-05-26
    decision: "clinic_vertical REPLACE legacy clinic_type (4 valores) por nuevo enum 8 valores + migration Alembic idempotente + 16 consumers refactor (BE + FE + tests + fixtures)"
    ratified_by: chris
  - id: D2-downstream
    date: 2026-05-26
    decision: "Visual identity extraction escalation candidate a core via /pm-luana (docs/promotion-protocol/proposals/2026-05-26-lift-brand-visual-extraction-to-core.md). NO impacta esta story; impacta lisa-marca downstream (stub local hasta lift accepted)"
    ratified_by: chris
dependencies:
  hard:
    - vitalia-fase1-empty-states              # shell + sub-tab nav baseline
    - vitalia-fase1-routing-shell             # App Router setup
  soft: []
blocks_hard:
  - vitalia-fase2-lisa-marca                  # lisa-marca consume clinic_vertical + primary_specialties (read-only display)
blocks_soft:
  - vitalia-fase2-lisa-doctores               # equipo doctors filtra labels por specialty
  - vitalia-fase2-lisa-servicios              # catálogo tratamientos sugiere por specialty
  - vitalia-fase2-camila-voz                  # prohibited_phrases blocklist seed por specialty
  - vitalia-fase2-lisa-compliance             # compliance perfil seeded por specialty (Colombia Ley 2460/2025, MX COFEPRIS, etc.)
reuse_map_summary: "REUSE Shadcn primitives (Dialog/Form/Select/Checkbox/Card/Combobox) · NEW BE table tenant_clinic_config (clinic_vertical + primary_specialties[] + onboarding_completed_at) · NEW FE feature /features/config/components/onboarding · GATE pattern: middleware redirect tenants sin onboarding_completed_at → forced modal/page"
next_action: "/po-ux refinar 01-spec.md — draft inicial producido por subagent paralelo en sesión lisa-marca (2026-05-26). Iterar wireframes 3-step flow (welcome → vertical → specialties) + mockups HTML por componente."
---

# F2-S{TBD-pm-vitalia} vitalia-fase2-config-onboarding-clinica — checkpoint

## Goal

Capturar **clinic_vertical** (business model, single-select) y **primary_specialties** (what doctors do, multi-select) en el primer setup del tenant Vitalia post-signup. Ambos campos alimentan downstream:
- Personalizar copy/microcopy del shell (labels equipo, sugerencias tratamientos)
- Seed `vitalia_prohibited_phrases` por specialty (compliance perfiles)
- Seed `personality.archetype` default por specialty (psico→Sage, dental→Healer, estética→Magician, pediatría→Caregiver)
- Trust signals defaults (DIGESA/COFEPRIS/colegio médico según país+specialty)

## Scope verbatim

### § 1 — Gate forced onboarding

- Middleware FE (`vitalia/frontend/src/middleware.ts` o equivalent) redirige tenants sin `tenant_clinic_config.onboarding_completed_at` a `/onboarding/clinica`
- Page Server Component: `vitalia/frontend/src/app/[tenantId]/onboarding/clinica/page.tsx`
- Skip-bypass: solo role `super_admin` (debug). Owner regular DEBE completar antes acceder shell-organism

### § 2 — Enum `clinic_vertical` (single-select)

8 valores (cementados Chris 2026-05-26 + research SaaS clínico LatAm 2026):

```
dental_clinic | medspa_aesthetic | mental_health_center | primary_care |
multispecialty | wellness_spa | telehealth_only | rehab_center
```

### § 3 — Enum `primary_specialties` (multi-select, 1..N)

12 valores priorizados + "otra" free-text:

```
odontologia | estetica_dermatologia | psicologia_psiquiatria | medicina_general |
ginecologia_obstetricia | pediatria | oftalmologia | fisioterapia_kinesiologia |
nutricion_dietetica | ortopedia_traumatologia | podologia |
cardiologia_endocrinologia | otra (free-text)
```

### § 4 — Tabla brand-local `tenant_clinic_config`

Schema mínimo:

```
tenant_id UUID PK (FK tenants)
clinic_vertical VARCHAR NOT NULL (enum check)
primary_specialties JSONB NOT NULL (array of enum + optional free-text entries)
onboarding_completed_at TIMESTAMP NOT NULL
onboarding_completed_by UUID FK users
created_at, updated_at
```

Migration idempotent raw SQL (`IF NOT EXISTS`).

### § 5 — UI flow (3 steps)

1. **Welcome** — "Bienvenida/o a Vitalia. Completá la configuración inicial de tu clínica (2 minutos)."
2. **Vertical selector** — cards visuales con icon por vertical (8 cards en grid responsive)
3. **Specialties multi-select** — Combobox con search + chips removibles (12 + "otra" con free-text input cuando se selecciona)
4. **Review & submit** — review final + edit links → submit POST `/api/v1/onboarding/clinic-config`

### § 6 — Empty/Error states

- Tab cerrada mid-flow: persistir progreso parcial en localStorage; al re-abrir continúa desde step
- Network failure: toast + retry button + offline indicator
- 2 tabs concurrentes mismo tenant: server idempotent (last-write-wins con audit log row de cada attempt)

## Out-of-scope MVP

- ❌ Setup billing tier (Luana plan) — story separada `vitalia-fase2-config-cuenta`
- ❌ Setup doctors team — story separada `vitalia-fase2-lisa-doctores`
- ❌ Setup connections (WhatsApp/Instagram/Gmail) — story separada `vitalia-fase2-config-conexiones`
- ❌ Setup country/timezone — debería capturarse en signup Clerk (out of this story)
- ❌ Auto-detect logo colors → palette — feature lisa-marca Identidad
- ❌ Editar specialties post-onboarding desde lisa-marca (lisa-marca es read-only display + link "Editar configuración inicial")

## Anti-objetivos

- NO mezclar specialty + vertical en single campo (ambiguity Doctocliq trap)
- NO permitir 0 specialties (min 1 enforced)
- NO modificar middleware existente (extender, no replace)
- NO bloquear super_admin (debug bypass mandatory)
- NO loguear payload free-text "otra" sin sanitization (potential PHI leak)

## Acceptance criteria (preliminar — `/po-ux` ratifica)

| AC | Verificación |
|---|---|
| AC-1 | Tenant nuevo sin `onboarding_completed_at` → redirect a `/onboarding/clinica` |
| AC-2 | Tenant con `onboarding_completed_at` → no redirect (acceso normal shell) |
| AC-3 | Submit válido persiste tabla + audit log row + redirect a shell-organism root |
| AC-4 | Submit sin clinic_vertical → 422 + form error inline |
| AC-5 | Submit con 0 specialties → 422 + form error inline |
| AC-6 | "otra" free-text obligatorio si se selecciona "otra" |
| AC-7 | Multi-select chips removibles + add more |
| AC-8 | Keyboard nav full + screen reader announces estado |
| AC-9 | Cross-tenant attempt bloqueado (impersonation prevention) |
| AC-10 | 2 tabs concurrentes: last-write-wins + audit log row cada attempt |
| AC-11 | LocalStorage persistencia parcial cross-tab-close |
| AC-12 | Spanish neutro LatAm en toda copy |
| AC-13 | Visual goldens × 6 (3 steps × 2 themes light/dark) |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` — shell + sub-tab nav baseline
- `vitalia-fase1-routing-shell` — App Router setup

### Soft
- ninguna

### Esta historia desbloquea
- `vitalia-fase2-lisa-marca` — consume display read-only
- `vitalia-fase2-lisa-doctores` — labels equipo filtran por specialty
- `vitalia-fase2-lisa-servicios` — sugerencias catálogo por specialty
- `vitalia-fase2-camila-voz` — seed prohibited_phrases por specialty
- `vitalia-fase2-lisa-compliance` — perfiles compliance por specialty

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| User cierra tab mid-flow | Alta | Bajo | LocalStorage persistencia parcial |
| Free-text "otra" PHI leak en logs | Baja | Alto | `sanitize_payload` antes loguear (hipaa-lite) |
| 2 owners mismo tenant submitean simultáneo | Media | Bajo | Last-write-wins + audit log |
| Middleware redirect loop si bug | Baja | Alto | Test integration `e2e/onboarding-redirect.spec.ts` cubre |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 6 generated + ratified
3. BE tests + middleware test pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `config.onboarding_clinic` registrada
6. Lisa-marca refactored para consumir read-only (separate ticket dentro lisa-marca story)

## Referencias

- **ADR transversal:** `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` (patrón obligatorio)
- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Template:** `vitalia/docs/specs/templates/01-spec-shell-template.md`
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **Mockup gate:** `vitalia/docs/architecture/ADR-vitalia-003-shell-mockup-per-component-protocol.md`
- **Research source:** WebSearch 2026-05-26 (12 specialties LatAm SaaS clínico priorizadas, agent ae4d3b5826709df90)
- **Spawn context:** sesión /po-ux lisa-marca 2026-05-26 (decisión Chris separar clinic_vertical + primary_specialties)
