---
story_id: vitalia-fase2-config-cuenta
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: config
module: tenant_account
capability: config.cuenta
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 3-4
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-lisa-doctores              # equipo lista
blocks_hard: []
blocks_soft: []
reuse_map_summary: "REUSE core/luana-core-iam tenants + brand.yaml engine · NEW UI 3-secciones (Info clínica · Plan Luana · Equipo RBAC) · NEW billing dashboard Luana"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes 3 secciones · /architect evaluar billing integration"

# Schema v2 migration (cement 2026-05-27)
release: F2   # release ID · ver releases/
cap_target: config.cuenta   # capability slug target (v2 cement 2026-05-27)
cap_change_type: new   # new | fix | extend | derive
parent_story: null   # story padre si spawned · null si independiente
---

# F2-S20 vitalia-fase2-config-cuenta — checkpoint

## Goal

Sub-tab Mi cuenta de Configurar (admin · uso poco frecuente per filosofía paradigma). 3 sub-secciones:
- **Info clínica** — Nombre · CUIT/RUT · dirección · timezone · idioma default · vertical
- **Plan Luana** — Facturación SaaS · plan actual (Free/Pro/Enterprise) · usage tracking · invoices history · upgrade/downgrade
- **Equipo clínica RBAC** — CRUD users + assign roles

## Anti-objetivos

- NO duplicar `core/luana-core-iam` (consume API)
- NO implementar billing inline edits (Stripe checkout managed)
- NO tocar brand.yaml directamente (UI safe-edit · backend valida)

## Scope verbatim

### § 1 — Page + 3 sub-secciones

`<ConfigCuentaView>` Shadcn Tabs internas.

### § 2 — `InfoClinicaSection`

Form CRUD:
- Nombre clínica
- Identificación fiscal country-specific (CUIT AR · RUC PE · RFC MX · NIT CL)
- Dirección
- Timezone selector
- Idioma default (Spanish-LatAm default)
- Vertical (dental · estética · psicología · psiquiatría · general) — read-only post-onboarding (cambio requires support ticket)

Autosave on-change.

### § 3 — `PlanLuanaSection` (★ billing)

Dashboard plan:
- Plan actual (Free · Pro · Enterprise · Custom)
- Usage tracking: messages sent · campaigns created · API calls
- Invoices history (Stripe consumed)
- CTA "Cambiar plan" → Stripe checkout
- Cancelación plan (con confirm dialog · audit)

### § 4 — `EquipoRBACSection`

CRUD team members:
- Lista con: Avatar · Nombre · Email · Role (admin_clinic · doctor · nurse · receptionist · marketing_assistant · viewer)
- "+ Invitar miembro" → email invite (Clerk pattern · per existing iam shipped)
- Edit role / Remove member (audit log)

Roles aplican enforcement per `hipaa-lite.md` RBAC.

### § 5 — Mobile

3-sub-secciones → accordion vertical.

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page renderiza 3 sub-secciones |
| AC-2 | Info clínica CRUD + autosave |
| AC-3 | Plan Luana dashboard + Stripe checkout funcional |
| AC-4 | Equipo CRUD + invite email + role assign |
| AC-5 | Vertical read-only post-onboarding |
| AC-6 | Audit log per cada cambio |
| AC-7 | Visual goldens × 6 |
| AC-8 | a11y axe pass |
| AC-9 | Cross-tenant + RBAC (solo admin_clinic edita) |
| AC-10 | Identification fiscal validator country-specific |
| AC-11 | Vitest + Playwright + a11y pass |

## Gherkin scenarios

### Scenario 1 — happy: invitar nuevo miembro

**Given:** Role admin_clinic. Member no existe.

**When:** Invite email "marketing@clinica.pe" + role=marketing_assistant + send

**Then:** Clerk invite email enviado · audit log · pending invite visible · cuando user accepts → joined.

### Scenario 2 — negative: CUIT inválido AR

**Given:** Tenant AR · CUIT formato erróneo

**When:** Submit save

**Then:** Validator backend reject · UI inline error · NO persiste.

### Scenario 3 — edge: downgrade plan

**Given:** Plan Pro currently · attempts downgrade Free.

**When:** Confirm

**Then:** Backend valida feature usage (e.g., no exceder Free quotas) · si excede → block + sugerencia · si OK → Stripe schedule downgrade end of billing period.

### Scenario 4 — adversarial: edit role admin without permission

Role staff intenta editar role admin → 403 · audit.

### Scenario 5 — keyboard-a11y

Tab tabs + form fields + table rows.

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/config/cuenta/page.tsx` | MODIFY |
| `vitalia/frontend/src/features/config/components/cuenta/ConfigCuentaView.tsx` | NEW |
| `vitalia/frontend/src/features/config/components/cuenta/InfoClinicaSection.tsx` | NEW |
| `vitalia/frontend/src/features/config/components/cuenta/PlanLuanaSection.tsx` | NEW |
| `vitalia/frontend/src/features/config/components/cuenta/EquipoRBACSection.tsx` | NEW |
| `vitalia/frontend/src/features/config/components/cuenta/InviteMemberModal.tsx` | NEW |
| `vitalia/frontend/src/features/config/api/cuenta.ts` | NEW |
| `vitalia/frontend/src/features/config/types/cuenta.types.ts` | NEW |
| `vitalia/backend/src/modules/vitalia/iam/api/cuenta_router.py` | MODIFY |
| `vitalia/backend/src/modules/vitalia/iam/application/fiscal_id_validator.py` | NEW (AR/PE/MX/CL/UY) |
| `vitalia/backend/src/modules/vitalia/iam/application/plan_dispatcher.py` | NEW (Stripe) |
| `vitalia/frontend/e2e/shell-organism/config-cuenta-rbac.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/cuenta/{view}-{light\|dark}.png` (×6) | NEW |
| `vitalia/backend/tests/modules/vitalia/iam/test_fiscal_validator.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/iam/test_plan_downgrade_validation.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/iam/test_invite_member.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| `core/luana-core-iam` (engine) | Tenant + User + Roles | CONSUME |
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/iam/` | Tenant brand-overlay | EXTEND |
| Vitalia shipped — Clerk auth integration | Invite + email patterns | REUSE |
| Stripe SDK (`@stripe/stripe-js`) | Checkout + billing | NEW client |
| Shadcn primitives | `Tabs` · `Form` · `Table` · `Dialog` · `Badge` | reuse |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell`

### Soft
- `vitalia-fase2-lisa-doctores` — equipo overlap (doctors visible aquí también)

### Esta historia desbloquea
- F2-S21 conexiones · F2-S22 avanzado

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Stripe billing complex flows | Media | Medio | Use Stripe Checkout (managed) en lugar de custom UI |
| RBAC role changes lockout admin | Baja | Crítico | Backend enforce min 1 admin_clinic per tenant |
| Vertical change post-onboarding rompe data | Baja | Crítico | Read-only · support ticket process |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 6
3. Backend tests fiscal validator + plan downgrade + invite pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `config.cuenta` registrada

## Próximo paso post-done

- F2-S21 conexiones expone OAuth integrations
- F2-S22 avanzado expone technical features

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Navigation tree:** § config.cuenta
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **Engine iam:** `core/luana-core-iam`
