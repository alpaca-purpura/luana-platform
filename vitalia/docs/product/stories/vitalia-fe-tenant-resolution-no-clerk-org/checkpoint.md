---
story_id: vitalia-fe-tenant-resolution-no-clerk-org
type: bugfix
agent_owner: platform
map_zone: infraestructura
map_box: plataforma-tecnica
module: iam
capability: iam.luana-core-adoption
cap_target: iam.luana-core-adoption
cap_change_type: fix
parent_story: null

release: F2
state: developing
phase_workflow: T1_REFACTOR
architecture_pattern: N/A   # cross-cutting FE data-layer fix, no shell sub-tab
adr_004_compliance: N/A
autonomous_mode: true
ratified_by_chris: true     # Chris ratificó story dedicada AHORA (2026-06-01) + borrar Clerk org tras fix
last_modified: '2026-06-01'
spawned_at: '2026-06-01'
spawned_by: /pm-vitalia
parallel_safe: true
priority: critical
defer_audit: false

functional_area: plataforma-tecnica.tenant-resolution
user_visible: false

# Bugfix repro-first gate (ADR-011 · hereda hotfix-repro-mandatory.md)
hotfix_metadata:
  repro_verified: true
  repro_command: "Live: navegar autenticado (dr.demo) a /{tenant}/lisa/staff contra stack real → GET /clinics/doctors 500 (UUID(org_3DzUI3...)). Backend log: ValueError badly formed hexadecimal UUID string. 34 archivos FE con tenantId: orgId."
  diagnosis_validates_handoff: true

# Dev-app live verification gate (ADR-vitalia-008)
dev_app_verified:
  required: true
  evidence: []   # se llena tras refactor: features afectados (lisa/crm/fidelizacion/marketing/inbox) golpean backend real con X-Tenant-ID UUID → 200 (no 500)
---

# Remediación FE — resolver tenant_id de NUESTRA data, nunca de Clerk Organizations

## Síntoma (repro_verified · live)

Contra el backend real, TODO endpoint PHI da **500** (`UUID('org_3DzUI3...')` → badly formed hexadecimal UUID).
Causa: el FE envía como `X-Tenant-ID` el `useAuth().orgId` (Clerk Organization id, formato `org_`, NO-UUID).
Enmascarado por e2e mockeado en todos los features (falso verde a escala de plataforma).

## Root cause + SSoT

`tenantId: orgId` en **34 archivos** (crm-shared, fidelizacion, marketing, inbox, lisa/staff + `hooks/useCurrentUser.ts`).
Viola [[no-clerk-organizations]] (Chris ratificó 2026-05-20 y 2026-06-01: NO usamos Clerk Orgs; los tenants son
NUESTROS, en luana-core-iam). La fuente correcta YA existe: `user.publicMetadata.tenant_id` (UUID válido).

> Doc completo: `vitalia/docs/observed-bugs/2026-06-01-fe-tenant-id-from-clerk-org-systemic.md`

## Scope del fix

1. **`useTenantId()`** nuevo hook (espejo de `src/hooks/useClinicId.ts`): lee `user.publicMetadata.tenant_id`
   (claim nuestra). NUNCA `useAuth().orgId` / `useOrganization`. Devuelve UUID string o null.
2. **Reemplazar `tenantId: orgId` → `tenantId: useTenantId()`** en los 34 archivos. Ajustar los guards
   `if (!orgId) throw` → `if (!tenantId) throw` (o `enabled: !!tenantId`). Quitar `orgId` del destructuring
   de `useAuth()` donde solo se usaba para tenant (dejar getToken/isLoaded/isSignedIn).
3. **Tightening arch test** `test-no-clerk-organizations.test.ts`: cazar `useAuth().orgId` + destructuring
   `{ orgId }` de useAuth + dependencia de org membership (hoy blind spot).
4. **Re-live-verify** (REAL, no mock) de features afectados → X-Tenant-ID UUID → 200/empty (no 500).
5. **Borrar la Clerk Organization** `org_3DzUI3lLjwX83Kth0j5enWrjIDY` (drift) — tras el fix, via Clerk API (Chris ratificó).

## Bar de DONE

- 0 archivos con `tenantId: orgId`. `grep -rl "tenantId: orgId" src/` → 0.
- arch test no-clerk-organizations tightened + GREEN (caza orgId).
- Live-verify real: al menos lisa/staff + 1 feature de crm/fidelizacion/marketing/inbox → GET PHI 200 (no 500) con X-Tenant-ID UUID, leído en backend logs.
- tsc + eslint + vitest GREEN.
- Clerk org borrada.

## NO objetivos

- NO migrar la resolución de role (useCurrentUser ya usa GET /me para role — solo se le corrige el tenantId source).
- NO tocar backend (el 422 guard de doctors_router ya está; extender guard al middleware de tenant es follow-up opcional).
- NO tocar core/ ni otros brands.
