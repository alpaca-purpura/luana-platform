---
story_id: vitalia-crm-phi-base-tables-migration
brand: vitalia
type: service-story
state: refining
po_version: 1
cap_target: iam-scaffold-slice-1
cap_change_type: fix
architecture_pattern: ADR-vitalia-004
adr_004_compliance: n/a-with-rationale   # BE migración pura, sin sub-tab UI
last_modified: 2026-05-30
hotfix_metadata:
  repro_verified: true
  repro_command: "JWT real Clerk → GET http://127.0.0.1:8002/api/v1/crm/leads → HTTP 500; docker logs luana-dev-vitalia_backend_dev-1 → 'relation \"vitalia_leads\" does not exist'"
  diagnosis_validates_handoff: true
  diagnosis_correction: "Profundización: vitalia_patients tampoco existe (drift stamp-vs-apply) Y su schema canónico (PHI columns name/dni/dob/phone/email/address) excede lo que 016 crea — 016 solo el esqueleto + columnas marketing."
---

# 01-spec — Migración tablas PHI base: crear vitalia_leads + reconcile vitalia_patients (full schema)

## Context

**Origen:** la verificación live god-matrix de `vitalia-iam-slice2-phi-real-auth` (done 2026-05-30) expuso vía anti-teatro que con JWT real los endpoints PHI de paciente/lead dan **HTTP 500** — las tablas base no existen en dev. Esto bloqueó el cierre live del grader audit-on-patient de SC-1 de aquella story.

**Repro (verificado live):** doctor JWT real → `GET /api/v1/crm/leads` → 500 (`relation "vitalia_leads" does not exist`). `GET /api/v1/crm/patients/{id}` → 500 (misma causa, `vitalia_patients` ausente).

**Causa raíz (2 problemas):**
1. **Drift stamp-vs-apply:** `vitalia_dev` en `alembic_version=034` (head) pero `vitalia_patients` no existe. `016` la crea con `CREATE TABLE IF NOT EXISTS` pero la DB fue stampeada sin aplicar el DDL → `alembic upgrade head` NO la recrea (el guard la considera aplicada).
2. **Migración faltante + schema incompleto:**
   - `vitalia_leads` no se crea en ningún árbol de migración.
   - `vitalia_patients`: incluso `016` solo crea el esqueleto (`id, tenant_id, clinic_id, created_at, updated_at, deleted_at` + marketing). Pero `patient_repository.py` SELECTea columnas PHI **que 016 no crea**: `name, date_of_birth, dni, phone, email, address, marketing_opt_out_at`. El schema canónico vino de "Story 11" (árbol legacy `src/modules/vitalia/persistence/migrations/`, no corrido por el alembic.ini activo).

## Objetivo

Migración forward-only idempotente (`035`) que **reconcile el schema canónico completo** de `vitalia_patients` (incluyendo PHI columns que el repo lee) + **crea `vitalia_leads`** (schema del repo), con índices dual-filter, sin romper la cadena 034→035 ni editar migraciones aplicadas. Verificación anti-teatro: re-god-matrix con JWT real → endpoints PHI 200 + audit row.

## Prior art applied (anti-duplication-refining)

- **REUSE pattern idempotente** `CREATE TABLE IF NOT EXISTS` + `ALTER ... ADD COLUMN IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` de `002/003/004/016` (backend-migrations.md). NO inventar pattern.
- **Schema canónico = fuente de verdad los repos** (`patient_repository.py` + `lead_repository.py` SELECT/UPDATE columns). El architect deriva el DDL exacto leyendo TODAS las queries de esos repos (no solo get_by_id).
- **NO engine:** tablas PHI brand-local (SQL crudo en repos vitalia). Cero consumo `luana-core-crm` para el schema.
- **Forward-only:** NO editar `016` (aplicada en la cadena). Nueva `035`.

## Schema esperado (borrador — architect deriva exacto de los repos)

- **vitalia_patients** (PHI): `id, tenant_id, clinic_id, name, date_of_birth, dni, phone, email, address, marketing_opt_in, opt_out, opt_out_reason, opt_out_at, marketing_opt_out_at, deleted_at, created_at, updated_at`. PK `id`. Índices: `(tenant_id, clinic_id)` + opt_out/marketing partial (de 016). Columnas PHI sensibles candidatas a `pgcrypto` (hipaa-lite — architect decide si en scope o follow-up).
- **vitalia_leads**: `id, tenant_id, name, email, phone, source, status, notes, deleted_at, created_at, updated_at`. PK `id`. Índice `(tenant_id)` + `(tenant_id, status)`. (Lead NO es dual-clinic per lead_repository — solo tenant_id; architect confirma.)

## Definición de DONE

1. Migración `035_vitalia_crm_phi_base_tables.py` idempotente (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS): reconcile `vitalia_patients` (full schema PHI) + crea `vitalia_leads` + índices. down_revision `034_vitalia`.
2. `alembic upgrade head` en dev → ambas tablas existen con todas las columnas que los repos leen (cero column-not-exist al ejercerlas).
3. **Verificación live (anti-teatro, OBLIGATORIA):** JWT real doctor → `GET /crm/patients/{id}` **200 + audit row** en `vitalia_audit_log` + `GET /crm/leads` **200**. recepcion/marketing → **403**. cross-tenant → **404** (no leak). Logs backend leídos (sin 500/column-error). Cierra el grader audit-on-patient-live de la story previa.
4. Test migration idempotency (re-run = no-op, sin error) + al menos 1 integration test que ejerza /patients y /leads contra DB real (no monkeypatch del repo).
5. (Sub-scope documentado) decisión sobre las 5 migraciones legacy en `src/modules/vitalia/persistence/migrations/`: documentar como arqueológicas o flag follow-up (NO limpiar inline salvo trivial).

## Scenarios (4/4 obligatorios · graders ejecutables)

### SC-1 · happy — doctor con JWT real lee paciente (200 + audit row)
- **given:** migración 035 aplicada en dev; doctor.demo con JWT real + X-Tenant-ID Sanaré + X-Clinic-ID; un paciente seed en `vitalia_patients` para ese tenant+clinic.
- **when:** `GET /api/v1/crm/patients/{id}`.
- **then:** 200 + data del paciente (dual filter tenant+clinic) + **audit_log row** escrito sync en `vitalia_audit_log` (action `phi_access_granted`, user, timestamp). Sin column-error.
- **graders:**
  - `{ type: integration, path: "vitalia/backend/tests/integration/test_crm_phi_real_tables.py::test_doctor_reads_patient_200_audit" }`
  - `{ type: state_check, target: db, query: "SELECT 1 FROM vitalia_audit_log WHERE action LIKE 'phi_access_granted%' ORDER BY occurred_at DESC LIMIT 1" }`
  - `{ type: manual_audit, who: claude-dev-app, expect: "JWT real → GET /crm/patients/{id} 200 + audit row + log sin 500/column-error" }`

### SC-2 · negative — rol no-PHI (recepcion/marketing) → 403
- **given:** marketing.demo (o recepcion) con JWT real válido; paciente existe.
- **when:** `GET /api/v1/crm/patients/{id}`.
- **then:** 403 (`@require_phi_access`) + audit log del intento denegado + sin leak de PHI en body.
- **graders:**
  - `{ type: integration, path: ".../test_crm_phi_real_tables.py::test_marketing_403" }`
  - `{ type: manual_audit, expect: "marketing JWT real → 403 + audit denied" }`

### SC-3 · edge — migración idempotente (re-run = no-op)
- **given:** migración 035 ya aplicada (tablas existen con datos).
- **when:** re-ejecutar la migración (upgrade/downgrade/upgrade o re-run del DDL).
- **then:** no-op sin error, sin pérdida de datos, sin DROP de columnas existentes (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS lo garantizan).
- **graders:** `{ type: contract_test, path: "vitalia/backend/tests/migrations/test_035_crm_phi_base_tables_idempotency.py" }`

### SC-4 · adversarial — cross-tenant / cross-clinic / JWT inválido sobre tablas ahora vivas
- **given:** doctor JWT real (o token inválido).
- **when:** `GET /crm/patients/{id}` con X-Tenant-ID de otro tenant (cross-tenant), o X-Clinic-ID de otra clínica (cross-clinic), o token forjado.
- **then:** cross-tenant → 404 (no leak, dual filter); cross-clinic → 403; token forjado → 401. Audit del intento. (La auth de Slice 2 sigue intacta sobre los endpoints ahora funcionales.)
- **graders:**
  - `{ type: integration, path: ".../test_crm_phi_real_tables.py::test_cross_tenant_404" }`
  - `{ type: integration, path: ".../test_crm_phi_real_tables.py::test_cross_clinic_403" }`
  - `{ type: manual_audit, expect: "cross-tenant → 404 sin leak; forjado → 401" }`

## Acceptance gates (resumen)

```bash
WS=$(git rev-parse --show-toplevel)
# Migración + idempotency:
cd ${WS}/vitalia/backend && ${WS}/.venv/bin/pytest tests/migrations/test_035_crm_phi_base_tables_idempotency.py tests/integration/test_crm_phi_real_tables.py -v
# Aplicar en dev + verificar tablas:
docker exec luana-dev-vitalia_backend_dev-1 bash -lc "cd /workspace/vitalia/backend && /workspace/.venv/bin/alembic upgrade head"
# Verificación live (anti-teatro): JWT real → /crm/patients/{id} 200 + audit row ; /crm/leads 200 ; recepcion 403
```

## Open questions (para architect / Chris)

- **OQ-1 (schema canónico):** el architect deriva el DDL exacto de `vitalia_patients` leyendo TODAS las queries de `patient_repository.py` (SELECT + UPDATE) + `lead_repository.py`, NO solo get_by_id. ¿Alguna columna PHI candidata a `pgcrypto` (hipaa-lite encryption at-rest) entra en scope, o follow-up? (Default propuesto: schema plano ahora; pgcrypto = follow-up separado, NO bloquea el unblock de los endpoints.)
- **OQ-2 (legacy tree):** 5 migraciones en `src/modules/vitalia/persistence/migrations/` no corridas por el alembic.ini activo. ¿Documentar arqueológicas (default) o limpiar en este story? (Default: documentar, limpieza = follow-up.)
- **OQ-3 (seed paciente):** SC-1 necesita un paciente seed en `vitalia_patients`. ¿Extender `seed_test_users_link.py` con 1 paciente god-matrix, o seed dedicado? (Default: extender el seed god-matrix con 1 paciente Sanaré.)

## Próximo paso

Spec ratificada → `/architect` produce ready package (03-arch deriva schema canónico exacto de los repos + 04-validators + 05-guidelines + 06-tickets). Build SUPERVISADO (autonomous_mode false: migración + verificación live).
