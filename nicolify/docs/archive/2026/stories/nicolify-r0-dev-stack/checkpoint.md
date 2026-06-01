---
story_id: nicolify-r0-dev-stack
brand: nicolify
type: service-story
state: done
phase: DONE_MERGED
developed_at: 2026-05-30T01:10:00-05:00
reviewing_started_at: 2026-05-30T01:15:00-05:00
build_progress:
  T-1: { state: pushed, commit: 82baefc3 }
  T-2: { state: pushed, commit: e1a5d803 }
  T-3: { state: pushed, commit: d056e487, note: "fetchClient kebab-named (auditor self-fix candidate)" }
  T-4: { state: pushed, commit: f29d4737, note: "legacy e2e cruft removed 6e0fa3fb" }
  T-5: { state: pushed, commit: 31afed48, note: "stack verde live; infra fixes" }
  reset_cleanup: { commit: 51a52aaf, note: "purged 457 legacy monolith test+script files (Chris ratified)" }
vertical_slice: GREEN
final_gates:
  be_pytest: "23 passed"
  be_ruff: "clean"
  fe_tsc: "ok"
  fe_smoke: "16/16 live"
  stack: "BE :8001 200 · FE :3001 200"
stack_live:
  clerk_instance: more-leech-83
  tenant_demo: agencia-demo (7f464ab7-137b-5e3a-af13-3020aa18814a)
  clerk_user: owner.demo@nicolify.com
next_action: "DONE — merged on wip/nicolify. Squash a main = gate integración Chris."
audit_verdict: APPROVED
priority: critical
release: R0
cap_target: platform/nicolify-brand-runtime-foundation
cap_change_type: new
depends_on: []
r0_order: 1
parent_story: nicolify-r0-shell-organism   # design-story que cementó el contrato
spawned_at: 2026-05-29T21:28:00-05:00
spawned_by: pm-nicolify-r0-backlog
refining_started_at: 2026-05-29T21:40:00-05:00
refined_at: 2026-05-29T22:00:00-05:00
ready_at: 2026-05-30T00:00:00-05:00
ready_package: [03-arch.md, 04-validators.yaml, 05-guidelines.md, 06-tickets.yaml, dispatch-plan.md]
autonomous_mode: false
autonomous_mode_chain: [dev-team, auditor, pm-merge]
architect_closed_by: /architect
last_artifact: 06-tickets.yaml
ratified_by_chris: true
ssot_owner: /pm-nicolify
---

# nicolify-r0-dev-stack — checkpoint

## Goal

Levantar el stack dev de Nicolify: BE FastAPI :8001 + FE Next.js 16 :3001 + /health verde + alembic baseline + Clerk auth + docker-compose. Es el blocker de todo R0.

## Contexto

Story de **R0 (Fundación + shell agéntico)**. Reuse del patrón de Vitalia re-temizado (ver `nicolify/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-nicolify-001-shell-feature-architecture.md}` + design-story `nicolify-r0-shell-organism`). Cargar skill `nicolify-design-system` antes de tocar FE.

**Gate ADR-nicolify-001 NO aplica** — `shell-feature-architecture.md` § Scope lista explícitamente `nicolify-r0-dev-stack` como service-only (sin sub-tab UI nueva). Sin gate de mockup.

## Prior art scan (2026-05-29 · MANDATORY anti-duplication-refining)

> Grep cross-brand + core ejecutado por `/pm-nicolify` antes de cerrar refined.

| Hallazgo | Path | Decisión |
|---|---|---|
| **Scaffold BE+FE completo y verde** | `vitalia/backend/` (main.py + alembic + Dockerfile + Makefile + tests) · `vitalia/frontend/` (Next 16 + Clerk + playwright + vitest) | **REUSE re-temizado** — portar estructura, NO mirror. Fuente principal. |
| **Tenant middleware + IAM** | `core/luana-core-iam/` + `core/luana-core-platform/` | **CONSUMIR vía import** (`X-Tenant-ID` middleware, IAM tenants/users) — NO recrear. NO Clerk Organizations (memoria). |
| **Observabilidad / token metering** | `core/luana-core-observability/` | **CONSUMIR vía import** (brand.yaml ya opt-in `token_metering`). |
| **Extension SDK** | `core/luana-core-extension-sdk/` | Base de registro EP-1..EP-18 para módulos brand futuros. |
| **Infra brand ya cementada** | `nicolify/config/brand.yaml` (puertos 8001/3001 D6) · `nicolify/docker-compose.dev.yml` · `nicolify/backend/Dockerfile` | Ya presentes y correctos — la story los **wirea + verifica verde**, no los recrea. |

**Estado actual (skeleton genuino post-reset 2026-05-29):**
- BE: `nicolify/backend/src/main.py` solo (`/health` + `/`). Sin `modules/`, sin tenant middleware, sin alembic baseline wired.
- FE: `nicolify/frontend/src/app/` casi vacío. Sin Clerk provider, sin `fetchClient` (X-Tenant-ID), sin root layout.
- docker-compose.dev.yml + Dockerfile: presentes + correctos.

**Decisión global:** `cap_change_type: new` · **net-new wiring reusando Vitalia + consumiendo engine** · cero mirror cross-brand · cero recreación de core.

## Next action

`/po nicolify nicolify-r0-dev-stack` → redactar `01-spec.md` (service-story · Gherkin AI-resistant + criterios "verde" + tenant isolation + smoke). Resolver Q1-Q5 del `chris-input.md`. Gate ADR-003 (mockup) NO aplica.
