---
story_id: vitalia-auth-base-functional
brand: vitalia
outcome: vitalia-mvp-ui-foundation
parent_spec: standalone-hotfix                    # NO descended from vitalia-ux-discovery — independent hot-fix
state: ready                                       # skip refining→refined formal porque scope quirúrgico Chris-ratificado
phase: READY_AWAITING_DEV_TEAM
defer_audit: false                                 # NO escape valve — Chris quiere validación live
parallel_safe: true                                # FE+BE+ops orthogonal, no conflict con otras stories
spawned_at: 2026-05-18
spawned_by: /pm-vitalia (post Chris ratificación scope hot-fix + admin Streamlit scope mínimo)
ratified_by_chris: true
ratified_at: 2026-05-18

# Hot-fix metadata (per .claude/rules/hotfix-repro-mandatory.md)
repro_verified: true
repro_evidence:
  brand: vitalia
  url: https://dev-app.vitalialat.com/
  command: "/pm-vitalia investigation 2026-05-18 (no Bash command needed, root cause confirmed reading repo)"
  output: |
    Root cause confirmado:
    1. vitalia/frontend/src/middleware.ts NO EXISTE → Clerk no protege rutas → / cae directo al placeholder
    2. vitalia/frontend/src/app/(auth)/sign-in/page.tsx renders literal placeholder texto "Inicio de sesión con Clerk (pendiente T-fe-3)" — NO renders <SignIn />
    3. vitalia/frontend/src/app/(dashboard)/page.tsx renders placeholder "Métricas del panel (pendiente T-fe-3)" — esto es lo que Chris ve
    4. vitalia/frontend/src/app/onboarding/step-{1,2,3}/page.tsx idem placeholders
    5. vitalia/backend/src/modules/vitalia/admin/ NO EXISTE (Nicolify sí tiene en nicolify/backend/src/modules/nicolify/admin/)
    6. Wizard onboarding implementado en vitalia/frontend/src/app/onboarding/wizard/page.tsx + features/onboarding/ (Story vitalia-slice-1-onboarding-wizard done 2026-05-18) — sí enchufado correctamente al routing.
    7. K8s deploy + cloudflared sirven el scaffold actual sin middleware Clerk
  diagnosis_validates_handoff: true                # No hubo handoff doc previo; este checkpoint ES el handoff a /dev-team
  diagnosis_correction: ~

# Scope
hot_fix_type: "deploy_base_functional_block"       # bloqueante para validar cualquier feature Slice 1
priority: critical                                 # blocker validación visual brand vitalia

# Files inventory ref (v2 post gaps audit 2026-05-18)
files_in_scope_count: 32                           # ~24 NEW + 7 EDIT + 4 DELETE (ver 03-arch-brief.md § 6 + 06-tickets.yaml v2)

# Validators ref (v2)
validators_total: 19                               # 7 non_functional + 5 functional + 6 visual + 1 ops + matrix anchor
must_pass_count: 19
gaps_audit_v2_added_validators: 9                  # +9 vs v1 post Chris ratificación gaps audit

# Tickets ref (v2)
tickets_total: 7                                   # T-1, T-2, T-3, T-4, T-5, T-6.a, T-6.b
production_code_tickets: 4                         # T-1, T-2, T-3, T-4
non_production_tickets: 3                          # T-5 ops + T-6.a tests + T-6.b tests
agentic_tickets: 0                                 # no agentic surface
opus_required_tickets: 0                           # R23 — all Sonnet/qwen-opencode eligible
estimated_total_hours: 23.5                        # +5.5h vs v1 (T-4 +2h + T-5 +0.5h + T-6.a NEW 2h + T-6.b +1h)
estimated_total_days: 3
critical_path_hours: 17.5                          # T-4 → T-6.a → T-5 → T-6.b (8+2+3.5+4)

# Pre-T-5 Chris manual checklist (per 05-guidelines.md § 8 — v2 NEW)
pre_t5_chris_checklist_done: false                 # ★ Chris debe marcar true ANTES de spawn T-5 builder ★
pre_t5_chris_checklist_items:
  - clerk_app_vitalia_active: false
  - clerk_domain_dev_app_configured: false
  - clerk_signin_methods_enabled: false
  - clerk_api_keys_in_k8s_secret: false
  - clerk_webhook_endpoint_configured: false
  - clerk_webhook_signing_secret_in_k8s: false
  - clerk_testing_token_generated: false
  - clerk_issuer_url_in_k8s_secret: false

# Open questions (resolver ANTES /dev-team spawn — Chris approve in-chat)
open_questions:
  - id: Q1
    question: "Admin Streamlit URL: subdomain vitalia-admin.vitalialat.com o subpath dev-app.vitalialat.com/admin?"
    default_recommended: "subdomain — aislamiento DNS+CORS más limpio"
    status: pending_chris
  - id: Q2
    question: "Fixture clinic auto-asociada al sign-up del primer user?"
    default_recommended: "Sí — webhook user.created busca tenant con email_domain match en metadata, sino asocia a aurora-dental-ar (default fixture)"
    status: pending_chris
  - id: Q3
    question: "Eliminar páginas legacy app/onboarding/step-{1,2,3}/page.tsx o dejar stubs muertos?"
    default_recommended: "Eliminar — son code-rot post wizard unificado"
    status: pending_chris
  - id: Q4
    question: "Admin Streamlit super-admin: 1 password compartido o multi-admin via Streamlit Authenticator config?"
    default_recommended: "1 password env-var (scope mínimo). Multi-admin defer story futura"
    status: pending_chris
  - id: Q5
    question: "Pre-T-5 Chris manual checklist Clerk dashboard — ¿cuándo lo completás? Antes spawn /dev-team o just-in-time antes T-5?"
    default_recommended: "Antes spawn /dev-team — así pre_t5_chris_checklist_done=true desde inicio + T-5 no se bloquea cuando llega su turno"
    status: pending_chris
    related: "Per 05-guidelines.md § 8 — checklist 8 items ~5 min en dashboard.clerk.com app vitalia"

# Decisions cementadas (ver 01-spec.md § 8)
decisions:
  D1: Skip /po-ux + /architect formal — scope quirúrgico Chris-ratificado
  D2: Admin Streamlit scope SOLO tenants + usuarios
  D3: No traer otras pages Nicolify
  D4: Wizard único en /onboarding/wizard — NO duplicar en step-{1,2,3}
  D5: Worktree wip/vitalia canónico, no spawnar efímero
  D6: Playwright smoke LIVE contra dev-app.vitalialat.com (no Docker local)
  D7: Admin Streamlit deploy = container K8s separado
  D8: Super-admin auth Streamlit = bcrypt env-var (scope mínimo)

# Ready package artifacts (v2 post gaps audit 2026-05-18)
artifacts:
  - 01-spec.md                                     # Gherkin scenarios SC-01..SC-18 (18 v2 vs 10 v1) + wireframes + microcopy + decisions
  - 03-arch-brief.md                               # decisiones técnicas + paths exactos + patterns (v1 no cambió)
  - 04-validators.yaml                             # 19 validators must_pass (v2 vs 12 v1) + 4 categorías
  - 05-guidelines.md                               # files in scope + 9 patterns + 16 anti-patterns + TDD note + pre-T-5 Chris checklist + auditor v2 responsibilities
  - 06-tickets.yaml                                # 7 tickets DAG (T-1..T-6.b) + gherkin_coverage MANDATORY + 4 BE integration tests

# Blockers
blocker_dependencies: []                           # no story-level blockers
blocker_dependencies_resolved:
  - vitalia-slice-1-onboarding-wizard              # merged 2026-05-18 — wizard ya existe en /onboarding/wizard
  - vitalia-slice-1-infra-cross-cutting            # merged 2026-05-18 — IAM/audit_log infra existe
  - vitalia-copilot-tools-impl                     # merged 2026-05-18

# Side story relations
side_story_relations:
  blocks: []                                       # esta story NO bloquea otras
  unblocks:                                        # esta story DESBLOQUEA validación visual de:
    - vitalia-slice-1-inbox                        # podrá testearse live post-merge
    - vitalia-slice-1-fidelizacion
    - vitalia-slice-1-marketing
    - vitalia-slice-1-pipeline
    - vitalia-slice-1-agenda
    - vitalia-ux-discovery (ready package /architect)

# Status timeline
state_history:
  - state: ready
    at: 2026-05-18
    by: /pm-vitalia
    reason: "Hot-fix scope quirúrgico Chris-ratificado. Skip refining/refined formal porque 01-spec.md + 03-arch-brief.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml escritos in-line por /pm-vitalia este turno post-investigación root cause."
  - state: ready_v2
    at: 2026-05-18
    by: /pm-vitalia
    reason: "Post-Chris ratificación gaps audit (preguntó '¿has considerado todos los medios de validación incluyendo Playwright?'). 11 gaps identificados (4 MUST + 4 SHOULD + 3 COULD), TODOS ratificados Chris. Updates: +9 validators (12→19) +8 scenarios (10→18) +1 ticket split (T-6→T-6.a + T-6.b) +5.5h estim (18→23.5h) +5.5h critical path (12→17.5h). Spec mantiene state=ready, no regresión a refining."

# Handoff next
next_action: "Chris ratifica Q1-Q5 (Q5 NEW post gaps audit) + completa pre-T-5 manual checklist (per 05-guidelines.md § 8) → /pm-vitalia spawn /dev-team vitalia-auth-base-functional arranca T-1..T-6.b"
next_owner: /dev-team

# /auditor + /pm-vitalia merge handoffs (post developed)
post_developed_handoff: /auditor                   # AUTO per story-closure-gate.md (default)
post_approved_handoff: /pm-vitalia                 # AUTO merge

last_updated: 2026-05-18
---

# vitalia-auth-base-functional — checkpoint

> **Story type:** hot-fix scope quirúrgico (~2 días dev · 18h estimado · 12h critical path con paralelización)
> **State:** `ready` — skip refining/refined formal per D1 (Chris ratificado)
> **Block:** validación visual de TODA brand vitalia post-deploy actual roto

## ¿Qué resuelve?

`https://dev-app.vitalialat.com/` muestra placeholders T-fe-3 literal en lugar de
Clerk SignIn + dashboard + admin. Chris no puede loguearse ni ver wizard
(que está implementado pero inaccesible sin middleware Clerk + sign-in real).

Esta story implementa la **base mínima funcional**:
- Clerk middleware proteger rutas
- Sign-in + Sign-up reales con `<SignIn />` / `<SignUp />`
- Dashboard `/` mínimo welcome (NO offers/bookings/etc — esas siguen Slice 1)
- Admin Streamlit Vitalia con SOLO crear-tenant + crear-user (espejando pattern Nicolify, scope mínimo)
- K8s deploy + secrets verify + fixtures seed
- Playwright LIVE smoke contra dev-app.vitalialat.com (yo /pm-vitalia ejecuto antes de declarar PASS)

## Out-of-scope explícito

- ❌ Implementar offers/bookings/appointments/patients (las 6 stories Slice 1 refined ya en backlog)
- ❌ Admin Streamlit +2 pages (sales/metrics/billing/etc)
- ❌ Audio Whisper (defer Slice 2)
- ❌ Modificar `core/luana-core-*/` (engine)
- ❌ Sales agent / copilot conversaciones live

## Mecánica próxima sesión

1. Chris lee `01-spec.md` + `03-arch-brief.md` + `06-tickets.yaml`
2. Chris responde Q1-Q4 in-chat (defaults razonables → puede ratificar todos)
3. `/dev-team vitalia-auth-base-functional` arranca T-1..T-6 autonomous
4. Validators GREEN → state=developed → AUTO-HANDOFF `/auditor`
5. APPROVED → AUTO-HANDOFF `/pm-vitalia merge` → 07-merge.md 5 secciones
6. state=done

## Notas operativas

- Worktree: `wip/vitalia` canónico (per D5). No efímero.
- Branch push: `wip/vitalia` per parallel-safety.md M11 (push frecuente).
- Cost-routing: 0 Opus, 6 Sonnet/qwen-opencode (R23 — no agentic production).
- Anti-duplication: admin Streamlit pattern espejado de Nicolify pero código brand-specific reescrito (diff ≥ 50 lines validator).
