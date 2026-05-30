---
story_id: vitalia-iam-slice2-phi-real-auth
type: service-story
agent_owner: config
module: iam
cap_target: iam-scaffold-slice-1            # extend: desentuba el decoder PHI (stub→JWKS real)
cap_change_type: extend
release: F2
architecture_pattern: ADR-vitalia-004
adr_004_compliance: n/a-with-rationale      # BE auth wiring, no sub-tab UI
priority: high
ratified_by_chris: true   # 2026-05-30 Q1-Q3 ratificadas
parallel_safe: false
last_modified: 2026-05-30
state: refined
phase: SPEC_RATIFIED
prior_art_scan_done: true
prior_story: vitalia-stub-caps-scenario-backfill   # nace del hallazgo de aquella (stub PHI rechaza JWT real)

# Autonomous mode — HARD false (auth/PHI sensible · architect-autonomous-mode.md)
autonomous_mode: false
autonomous_mode_hard_false_reason: "Toca auth + PHI (HIPAA-lite). Per .claude/rules/architect-autonomous-mode.md: security/auth/PHI requiere supervisión Chris. NO auto-build."

next_action: "/architect ready package (reuse engine JWKS + rol DB + repos reales + FE rol-desde-/me + stub env-gated test-only) → build SUPERVISADO → verificación god-matrix JWT real."
---

# Slice 2 PHI — desentubar el decoder JWT (stub → JWKS real) + rol desde DB + repos reales

> **Origen:** hallazgo de `vitalia-stub-caps-scenario-backfill` (done 2026-05-30). Las superficies PHI (crm/clinics/inbox/marketing) usan un decoder STUB Slice-1 que SOLO acepta `stub:{tenant}:{clinic}:{role}:{user}` y RECHAZA el JWT real de Clerk → 401. Mientras siga stub, ningún cap PHI puede verificarse live en dev-app (el FE manda JWT real → 401). Esta story lo desentuba reusando el JWKS del engine.

## Prior art scan (anti-duplication-refining · 2026-05-30)

| Fuente | Hallazgo | Decisión |
|---|---|---|
| **Engine `core/luana-core-iam/application/auth.py`** | Ya tiene `verify_token_payload(token)` + `jwt.PyJWKClient(JWKS_URL)` + `verify_clerk_token`. | **REUSE vía import** — NO recrear JWKS (anti-duplication). |
| **Engine `core/luana-core-iam/.../user_tenant_repository.py` + `user_tenant_model.py`** | Rol vive en `user_tenants.role` (DB). | **REUSE** — el rol fluye desde DB, no del token. |
| **Stub actual `vitalia/.../iam/infrastructure/clerk_jwt_decoder.py`** | Slice-1 stub, parsea `stub:...`, rechaza JWT real. | **REEMPLAZAR** por verificación JWKS real (mantener `ClerkJwtPayload` shape / `VitaliaRole` domain). |
| **god-matrix (story previa)** | 8 usuarios RBAC sobre Sanaré (DB↔Clerk alineados, seed `seed_test_users_link.py`). | **REUSE como fixture de verificación.** |

**Conclusión:** cero duplicación — consume engine JWKS + user_tenants vía import; reemplaza el stub brand-local. `cap_change_type: extend` coherente (extiende iam-scaffold a auth real).
