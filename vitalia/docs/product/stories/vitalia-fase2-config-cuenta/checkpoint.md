---
story_id: vitalia-fase2-config-cuenta
type: ui-story
agent_owner: configuracion
module: configuracion
capability: configuracion.cuenta
state: refining
architecture_pattern: ADR-vitalia-004
last_modified: '2026-06-07T00:50:00Z'
ratified_by_chris: false
ratified_visual_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 2-3
ratified_decisions:
  - id: D1
    date: 2026-06-07
    decision: "Billing/Plan Luana SACADO de esta story → defer a vitalia-pricing-decision + core billing (/pm-luana). Razón: pricing deferred (TIER 7) + modelo por-puesto/SKU (ADR-013 empleados-IA) + facturar SaaS es cross-brand (anti-duplication)."
    ratified_by: chris
  - id: D2
    date: 2026-06-07
    decision: "Equipo/RBAC (CRUD usuarios + roles + invite) SACADO → pertenece a la caja Acceso (SYSTEM-MAP absorbs config.iam); ya LIVE en admin Streamlit users-crud. config-cuenta = solo datos del tenant."
    ratified_by: chris
  - id: D3
    date: 2026-06-07
    decision: "Naming alineado a zona plataforma → caja configuracion → área cuenta. agent_owner/module/capability = configuracion(.cuenta), cap_change_type=new. Slug de carpeta sin cambio."
    ratified_by: chris
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-onboarding-clinica
blocks_hard: []
blocks_soft: []
reuse_map_summary: >-
  CONSUME core/luana-core-iam + clinics/ + fiscal/ validators + TenantLocale (master-data) ·
  EXTEND onboarding tenant_clinic_config (vista editable post-onboarding) ·
  NEW UI sub-tab Cuenta (hoy placeholder) · NO billing · NO equipo/RBAC
spawned_at: 2026-05-22T00:00:00.000Z
next_action: >-
  /po-ux refinar 01-spec.md + mockups (gate ADR-003) — secciones: Datos de la clínica ·
  Preferencias regionales · Sedes · Responsable de tratamiento (DPO)
release: F4
cap_target: configuracion.cuenta
cap_change_type: new
parent_story: null
---

# F2-S20 vitalia-fase2-config-cuenta — checkpoint

> Scope ratificado 2026-06-07 (D1/D2/D3). Análisis pre-refinamiento + drift audit: `00-pm-analysis.md`.

## Goal

Área **Cuenta del tenant** de la caja **Configuración** (zona Plataforma · ribbon tab "Plataforma"). Vista user-facing de **uso poco frecuente** (admin) con los **datos del propio tenant/clínica**. Hoy es solo placeholder (`CuentaPlaceholder.tsx`); construir la vista real que **consume** el backbone ya existente (iam · clinics · fiscal · onboarding · audit), no rehacerlo.

## Anti-objetivos (ratificados)

- ❌ **NO billing / Plan Luana / Stripe** (D1 — defer a `vitalia-pricing-decision` + core billing vía `/pm-luana`).
- ❌ **NO equipo / RBAC / invite usuarios** (D2 — pertenece a caja Acceso; ya LIVE en admin Streamlit `users-crud`).
- ❌ NO recrear `core/luana-core-iam` ni `TenantLocale` (consumir vía import).
- ❌ NO re-capturar `vertical`/`primary_specialties` — los posee onboarding (read-only acá, decisión onboarding D3 2026-05-26).
- ❌ NO cambio de vertical post-onboarding (read-only · proceso support).

## Scope propuesto (4 secciones · /po-ux detalla AC + Gherkin + mockups)

### § 1 — Datos de la clínica (editable)
Nombre comercial · identificación fiscal country-specific (CUIT AR · RUC PE · RFC MX · NIT CL · RUT UY — **consume validadores de `fiscal/`**) · dirección · datos de contacto. `vertical` + `especialidades` = **read-only** (badge "definido en onboarding"). Autosave on-change.

### § 2 — Preferencias regionales
Timezone · idioma default (Spanish-LatAm) · moneda — vía `TenantLocale` VO (master-data). Sin hardcode.

### § 3 — Sedes (multi-clínica)
Lista de las sedes del tenant (consume `clinics/`). Read-only / light en MVP; CRUD de sede puede diferirse a story propia si crece.

### § 4 — Responsable de tratamiento / DPO
Contacto del data controller del tenant (HIPAA-lite obligación #8). *(Candidato a caja `seguridad-cumplimiento` — `/po-ux` confirma si vive acá o sólo se referencia.)*

### § 5 — Mobile
Secciones → accordion vertical (patrón shell).

## Pendiente /po-ux (no producir acá)
- `01-spec.md` con Gherkin AI-resistant (happy + negative + edge + adversarial) — incluir RN fiscal validator country-specific + RBAC lectura (solo admin_clinic edita) + audit log por cambio.
- Mockups HTML por componente (gate ADR-vitalia-003) ratificados por Chris ANTES de `refining → refined`.
- Matriz de cobertura + AC enumerados + Deliverables exactos.

## Reuse map (CONSUME-first)

| Origen | Qué | Adaptación |
|---|---|---|
| `core/luana-core-iam` | Tenant + User + Roles (scope lectura) | CONSUME |
| `vitalia/.../modules/vitalia/clinics/` | Sedes multi-clínica | CONSUME |
| `vitalia/.../modules/vitalia/fiscal/` | Validadores ID fiscal country-specific | CONSUME / EXTEND |
| onboarding `tenant_clinic_config` | vertical/especialidades/país/moneda | EXTEND (vista editable) |
| `TenantLocale` (master-data) | timezone/idioma/moneda | CONSUME |
| `audit/` + hipaa-lite | audit log por cambio | CONSUME |
| Shadcn | Tabs · Form · Table · Badge | reuse |

## Dependencies
- **Hard:** `vitalia-fase1-empty-states` · `vitalia-fase1-routing-shell`
- **Soft:** `vitalia-fase2-onboarding-clinica` (provee `tenant_clinic_config`)

## Riesgos
| Riesgo | Prob | Impacto | Mitigación |
|---|---|---|---|
| Fiscal validator por país incompleto | Media | Medio | Reusar `fiscal/`; cubrir AR/PE/MX/CL/UY; resto degradado a formato libre |
| Lockout edición (RBAC) | Baja | Medio | Solo `admin_clinic` edita; lectura para roles autorizados |
| Solape sedes con clinics module | Baja | Bajo | Read-only en MVP; CRUD difiere |

## Referencias
- `00-pm-analysis.md` — drift audit + propuesta (este turno)
- `vitalia/docs/architecture/SYSTEM-MAP.yaml` — zona plataforma → caja configuracion → área cuenta
- `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md` · `ADR-vitalia-004` · `ADR-vitalia-003`
- `vitalia/.claude/rules/hipaa-lite.md` — RBAC + audit + DPO
