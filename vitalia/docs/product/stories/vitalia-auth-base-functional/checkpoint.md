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

# Files inventory ref
files_in_scope_count: 20                           # ~12 NEW + 7 EDIT + 4 DELETE (ver 03-arch-brief.md § 6)

# Validators ref
validators_total: 12                               # 7 non_functional + 2 functional + 2 visual + 1 auditor matrix
must_pass_count: 12

# Tickets ref
tickets_total: 6                                   # T-1..T-6
production_code_tickets: 4                         # T-1, T-2, T-3, T-4
non_production_tickets: 2                          # T-5 ops + T-6 tests
agentic_tickets: 0                                 # no agentic surface
opus_required_tickets: 0                           # R23 — all Sonnet/qwen-opencode eligible
estimated_total_hours: 18
estimated_total_days: 2
critical_path_hours: 12                            # con paralelización T-1+T-4

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

# Ready package artifacts
artifacts:
  - 01-spec.md                                     # Gherkin scenarios + wireframes + microcopy + decisions
  - 03-arch-brief.md                               # decisiones técnicas + paths exactos + patterns
  - 04-validators.yaml                             # 12 validators must_pass
  - 05-guidelines.md                               # files in scope + patterns + anti-patterns
  - 06-tickets.yaml                                # 6 tickets DAG + gherkin_coverage MANDATORY

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

# Handoff next
next_action: "Chris ratifica spec (responde Q1-Q4 + ack o cambios) → /dev-team vitalia-auth-base-functional arranca T-1..T-6"
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
