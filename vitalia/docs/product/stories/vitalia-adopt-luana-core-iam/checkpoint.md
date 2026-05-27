---
story_id: vitalia-adopt-luana-core-iam
outcome: admin-iam-adopt
parent_platform_outcome: docs/product/outcomes/admin-iam-adoption-platform.md
phase_label: cross-cutting
type: service-story
state: idea
agent_owner: backend
module: iam
spawned_at: 2026-05-27
spawned_by: /pm-vitalia (vía audit sweep 2026-05-27 — V3 finding outcome admin-iam-adopt declared this story_id pero no existía)
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 1-2
hipaa_lite_scope: applicable (dual filter tenant_id + clinic_id obligatorio per vitalia/.claude/rules/hipaa-lite.md)
blocked_reason: "Admin Streamlit smoke 2026-05-19 reveló 4 bugs bloqueantes. Causa raíz: vitalia reinventó modelo IAM en lugar de consumir luana-core-iam que YA existe completo (44 .py + 14 tests). Migrations 002-021 pendientes (alembic current=001_vitalia, head=021_vitalia). Admin code en vitalia/backend/src/modules/vitalia/admin/modules/{tenants,users}.py hace SQL crudo a tabla phantom vitalia_clinics que NO existe en ninguna migration. Sin fix: admin inutilizable + violación anti-duplication rule + patrón contaminado para las 6 brands futuras."
prerequisites_done:
  - "docs/promotion-protocol/proposals/2026-05-19-purge-nicolify-defaults-core-config.md (state=migrated, commit b869eaf)"
  - "docs/promotion-protocol/proposals/2026-05-19-purge-nicolify-hardcodes-sales-agent.md (state=migrated, commit 39b73703)"
---

# vitalia-adopt-luana-core-iam — checkpoint (stub)

## Goal

Adoptar el engine package `core/luana-core-iam/` (44 .py + 14 tests, brand-agnostic IAM completo) en vitalia, **reemplazando** el modelo IAM ad-hoc actual que rompió admin Streamlit smoke 2026-05-19.

## Scope (heredado del outcome admin-iam-adopt — 7 tickets canónicos)

| ID | Title | Surface | Effort |
|---|---|---|---|
| T-be-add-engine-iam-tables | Migration 022: `CREATE TABLE` users/tenants/user_tenants matching engine models | backend (migration) | 45min |
| T-be-apply-pending-migrations | `alembic upgrade head` (001→023) | backend (devops) | 15min |
| T-be-admin-rewrite | REWRITE `admin/modules/{tenants,users}.py` consumiendo engine repos | backend (admin) | 60min |
| T-be-admin-deletion | DELETE phantom code residual (vitalia_clinics queries) | backend (admin) | 30min |
| T-be-clinics-extension | Migration 023 + SQLAlchemy model + repo + admin page `clinics.py` + HIPAA dual filter decorator | backend (clinics) | 90min |
| T-infra-admin-service | Service `vitalia-admin` en `vitalia/docker-compose.dev.yml` port 8502 + Makefile `dev-vitalia-admin` | infra | 45min |
| T-doc-env-template | Comment en `vitalia/.env.dev.template` re single-quote para valores con `$`/`!`/espacios | docs | 15min |

Detalle completo + decisiones D1-D5 + success criteria en outcome: `vitalia/docs/product/outcomes/admin-iam-adopt.md`.

## Próximo paso

`/po vitalia-adopt-luana-core-iam` para producir 01-spec.md service-story (no UI dedicada, solo admin Streamlit + backend). Luego `/architect` → ready package → `/dev-team`.

## Bitácora

- 2026-05-27: stub creado por audit sweep 2026-05-27 (V3 hallazgo: outcome admin-iam-adopt declaraba story_id que no existía como directory). Outcome ya tiene scope cementado + 7 tickets canónicos heredados del outcome platform. Próximo: `/po` produce spec.
