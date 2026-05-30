---
story_id: vitalia-crm-phi-base-tables-migration
type: service-story          # BE migración, sin UI
agent_owner: config
module: crm
cap_target: iam-scaffold-slice-1   # cierra el gap audit-on-patient-live de la story previa; cap real se decide en refining
cap_change_type: fix          # habilita endpoints PHI existentes (no agrega funcionalidad nueva)
release: F2
architecture_pattern: ADR-vitalia-004
adr_004_compliance: n/a-with-rationale   # BE migración pura, sin sub-tab UI
priority: high
parallel_safe: false
last_modified: 2026-05-30
state: refining
phase: REFINING_SPEC
prior_art_scan_done: true
prior_story: vitalia-iam-slice2-phi-real-auth   # nace del hallazgo live god-matrix de aquella

next_action: "/po escribe 01-spec.md (service-story migración) → /architect → /dev-team build SUPERVISADO (migración + verificación live re-god-matrix patients/leads)."

# Autonomous mode — false por default (migración PHI tables, verificación live requerida)
autonomous_mode: false
autonomous_mode_hard_false_reason: "Migración de tablas PHI base + drift stamp-vs-apply en dev. Requiere verificación live (re-god-matrix sobre /patients + /leads → 200 + audit row) antes de cerrar. Chris ratifica el approach de reconcile."
---

# Migración tablas PHI base — crear vitalia_leads + reconcile vitalia_patients (drift dev)

> **Origen:** hallazgo de la verificación live god-matrix de `vitalia-iam-slice2-phi-real-auth` (done 2026-05-30). El anti-teatro expuso que con JWT real los endpoints `/crm/leads` + `/crm/patients/{id}` dan **HTTP 500** (`relation "vitalia_leads" does not exist`) — las tablas base PHI faltan en la DB dev. Esto bloqueó la verificación live del audit-row-on-patient (SC-1 de aquella story quedó probado por código+tests, no live).

## Prior art scan (anti-duplication-refining · 2026-05-30)

| Fuente | Hallazgo | Decisión |
|---|---|---|
| Engine `core/luana-core-crm` | Existe, pero las tablas `vitalia_patients`/`vitalia_leads` son **PHI brand-local** (los repos vitalia usan SQL crudo `FROM vitalia_leads`, no ORM engine). | **NO consumir engine para el schema** — las tablas son brand-local. El módulo crm vitalia las owna. |
| vitalia `alembic/versions/{002,003,004}*.py` | Pattern idempotente `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` ya establecido. | **REUSE pattern** (backend-migrations.md). |
| vitalia `016_vitalia_patients_columns.py` | Tiene `CREATE TABLE IF NOT EXISTS vitalia_patients` + columnas, pero está en la cadena 015→016→…→034 (head). | El reconcile debe ser **forward-only nuevo** (035+), NO editar 016 (ya aplicada en la cadena). |
| `comunify` | `001_comunify_initial_snapshot.py` (snapshot) — no aplica al caso drift vitalia. | N/A |

**Conclusión:** net-new migración brand-local idempotente (forward-only) reusando el pattern IF NOT EXISTS. Cero duplicación de engine.

## Diagnóstico de causa raíz (verificado 2026-05-30)

Dos problemas distintos:

1. **Drift stamp-vs-apply (vitalia_patients):** la DB dev `vitalia_dev` tiene `alembic_version = 034_vitalia` (head) y `016` está en la cadena lineal con `CREATE TABLE IF NOT EXISTS vitalia_patients` — **pero la tabla no existe** (44 tablas public, sin `vitalia_patients`). La DB fue *stampeada* a 034 sin aplicar el DDL físico de varias migraciones. El `IF NOT EXISTS` hace que un `alembic upgrade head` NO la recree (alembic la considera aplicada).
2. **Migración faltante (vitalia_leads):** ninguna migración en ningún árbol (`alembic/versions/` ni `src/modules/vitalia/persistence/migrations/`) crea `vitalia_leads`. El repo `lead_repository.py` lee columnas `id, tenant_id, name, email, phone, source, status, notes, deleted_at, created_at, updated_at` de una tabla que nunca se creó.

**Nota dos árboles:** hay 35 migraciones en `alembic/versions/` (árbol activo, head 034) + 5 legacy en `src/modules/vitalia/persistence/migrations/` (no corridas por el alembic.ini activo `script_location = alembic`). El refining debe decidir si las 5 legacy son arqueológicas o un tree huérfano a limpiar.

## Scope propuesto (a refinar en /po)

- Migración nueva `035_vitalia_crm_phi_base_tables.py` (forward-only, idempotente): `CREATE TABLE IF NOT EXISTS vitalia_leads (...)` (schema desde lead_repository) + `CREATE TABLE IF NOT EXISTS vitalia_patients (...)` reconcile (por si la DB driftó) + índices dual-filter `(tenant_id, clinic_id)` / `(tenant_id)`.
- Verificación: aplicar en dev → re-god-matrix con JWT real sobre `/crm/leads` + `/crm/patients/{id}` → **200 + audit row** (cierra el gap SC-1 audit-live de la story previa). Confirmar `vitalia_patients`/`vitalia_leads` existen post-migración.
- Decidir destino de las 5 migraciones legacy en `src/` (limpiar/documentar — fuera de scope estricto o sub-scope).

## Definición de DONE (borrador — /po refina)

1. Migración idempotente crea `vitalia_leads` + reconcile `vitalia_patients` (IF NOT EXISTS, sin romper la cadena 034→035).
2. `alembic upgrade head` en dev → ambas tablas existen.
3. Verificación live (anti-teatro): JWT real doctor → `GET /crm/leads` **200** + `GET /crm/patients/{id}` **200 + audit row** en `vitalia_audit_log`. recepcion → 403. Logs leídos.
4. Tests: migration idempotency (re-run = no-op) + integration sobre /leads y /patients reales (no monkeypatch del repo).
