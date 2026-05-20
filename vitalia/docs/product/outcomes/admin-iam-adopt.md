---
slug: admin-iam-adopt
kind: outcome
brand: vitalia
parent_outcome: docs/product/outcomes/admin-iam-adoption-platform.md
owner: /pm-vitalia
state: refining
created: 2026-05-19
priority: HIGH
why_now: |
  vitalia-auth-base-functional cerró state=done pero admin Streamlit smoke reveló
  4 bugs bloqueantes (HANDOFF-next-session.md). Causa raíz: vitalia reinventó modelo
  IAM en lugar de consumir luana-core-iam que YA existe completo (44 .py + 14 tests).
  Migrations 002-021 pendientes (alembic current=001_vitalia, head=021_vitalia).
  Admin code en vitalia/backend/src/modules/vitalia/admin/modules/{tenants,users}.py
  hace SQL crudo a tabla phantom `vitalia_clinics` que NO existe en ninguna migration.
  Sin fix: admin inutilizable + violación anti-duplication rule + patrón
  contaminado para las 6 brands futuras (saasora/inmoflow/retailly/fixia/guestly/fitflow).
estimated_effort: 4-6h (architect 1h + dev-team Sonnet 2-3h + auditor 1h + merge 30min)
story_ids:
  - vitalia-adopt-luana-core-iam
related_proposals:
  - docs/promotion-protocol/proposals/2026-05-19-purge-nicolify-defaults-core-config.md (state=migrated, commit b869eaf — PREREQUISITE done)
  - docs/promotion-protocol/proposals/2026-05-19-purge-nicolify-hardcodes-sales-agent.md (state=migrated, commit 39b73703 — PREREQUISITE done)
related_rules:
  - .claude/rules/anti-duplication.md (§ lift shared rule — base del cross-brand mirror detection)
  - vitalia/.claude/rules/hipaa-lite.md (dual filter tenant_id + clinic_id obligatorio)
  - .claude/rules/story-closure-gate.md (auto-handoff cascade)
---

# Vitalia — admin-iam-adopt (outcome local)

> Brand-local outcome owned por `/pm-vitalia`. Hijo del platform outcome
> `admin-iam-adoption-platform` owned por `/pm-luana`.
>
> Pre-requisites engine YA cementados en main:
> - `b869eaf` purge nicolify defaults core/config.py (luana-core-platform 0.3.0)
> - `39b73703` purge nicolify hardcodes residuales (sales-agent 0.2.0 + copilot 0.2.0)

## Decisión arquitectónica (heredada D1-D5 platform outcome)

| # | Decisión | Aplicación vitalia |
|---|---|---|
| D1 | Brand consume engine `luana-core-iam` sin reinventar | Migration 022 crea `users`, `tenants`, `user_tenants` matching engine models. Admin reescrito sobre `UserRepository`/`TenantRepository`/`UserTenantRepository`. |
| D2 | `clinic` = brand-extension vitalia (NO engine) | Migration 023 crea `vitalia_clinics` con FK `tenant_id REFERENCES tenants(id)`. SQLAlchemy model en `modules/vitalia/clinics/`. Trigger lift EP-19 cuando 2da brand replique patrón. |
| D3 | Hardcodes Nicolify en core/config.py purgados (DONE) | `vitalia/.env.dev` ya tiene las 4 vars override explícitas. |
| D4 | Admin Streamlit per-brand puerto dedicado | vitalia-admin service en docker-compose.dev.yml port **8502** (matching INFRA-MATRIX). |
| D5 | Admin = super-CRUD interno (Chris only, NO clientes) | Auth bcrypt single password (`VITALIA_ADMIN_PASSWORD_HASH`). NO Clerk. Funcionalidades: CRUD tenants/users/clinics + toggle is_active. |

## Success criteria (brand-specific)

- [ ] Migration 022 crea tablas engine IAM (users/tenants/user_tenants) matching `luana_core_iam` models
- [ ] Migration 023 crea `vitalia_clinics` brand-extension con FK a `tenants.id`
- [ ] `alembic upgrade head` exitoso (DB pasa de 001_vitalia → 023_vitalia)
- [ ] Admin code rewritten consumiendo engine repositories (CERO SQL crudo, CERO tabla phantom)
- [ ] vitalia-admin service docker-compose port **8502** accesible desde host (no forwarder)
- [ ] HIPAA-lite dual filter test bloquea cross-clinic queries (per rule §Tests requeridos)
- [ ] Playwright admin-smoke 5 specs PASS (login + tenants CRUD + users CRUD + clinics extension + HIPAA dual filter)
- [ ] Capability YAMLs creadas: admin/{tenants-crud,users-crud,clinic-crud} + iam/luana-core-adoption
- [ ] Modules MD refreshed (admin + iam + clinics auto-list)
- [ ] `.env.dev.template` documenta single-quote requirement (caracteres `$`/`!`/espacios)

## 7 Tickets canónicos (heredados platform outcome)

| ID | Title | Surface | Effort |
|---|---|---|---|
| T-be-add-engine-iam-tables | Migration 022: `CREATE TABLE` users/tenants/user_tenants matching engine models | backend (migration) | 45min |
| T-be-apply-pending-migrations | `alembic upgrade head` (001→023), verify 014 ALTER tenants ya no falla | backend (devops) | 15min |
| T-be-admin-rewrite | REWRITE `admin/modules/{tenants,users}.py` consumiendo engine repos (CERO SQL crudo) | backend (admin) | 60min |
| T-be-admin-deletion | DELETE phantom code residual (vitalia_clinics queries en admin/modules/tenants.py, imports stub a tablas inexistentes) | backend (admin) | 30min |
| T-be-clinics-extension | Migration 023 + SQLAlchemy model + repository + admin page `clinics.py` + HIPAA dual filter decorator | backend (clinics) | 90min |
| T-infra-admin-service | Service `vitalia-admin` en `vitalia/docker-compose.dev.yml` port 8502 + Makefile `dev-vitalia-admin` | infra | 45min |
| T-doc-env-template | Comment en `vitalia/.env.dev.template` re single-quote para valores con `$`/`!`/espacios | docs | 15min |

★ NOTA CRÍTICA T-be-admin-deletion: el rewrite NO es patches encima del phantom — es DELETE completo + REWRITE clean desde cero consumiendo `luana_core_iam` services. CERO deuda técnica residual (directiva Chris 2026-05-19).

## Trazabilidad

- Parent platform outcome: `docs/product/outcomes/admin-iam-adoption-platform.md`
- Caso origen: `vitalia/docs/product/stories/vitalia-auth-base-functional/HANDOFF-next-session.md` (4 bugs admin Streamlit)
- Engine reference: `core/luana-core-iam/` (44 .py + 14 tests — modelo IAM brand-agnostic completo)
- ADR local: `vitalia/docs/architecture/ADR-vitalia-001-shared-vs-fork.md` (vitalia hereda core sin fork)
- Brand rule overlay: `vitalia/.claude/rules/hipaa-lite.md` (dual filter PHI obligatorio)

## Bitácora

- 2026-05-19: outcome creado /pm-vitalia post platform outcome ratificación + pre-requisites engine migrated. State refining. Linked story: `vitalia-adopt-luana-core-iam`.
