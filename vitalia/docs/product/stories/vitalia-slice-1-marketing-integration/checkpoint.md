---
story_id: vitalia-slice-1-marketing-integration
outcome: vitalia-mvp-ui-foundation
parent_story: vitalia-slice-1-marketing (archived 2026-05-21, merged fa921711)
state: idea
phase: AWAIT_REFINING
spawned_at: 2026-05-21
spawned_by: /pm-vitalia (post-mortem visual verification gap)
spawned_reason: "vitalia-slice-1-marketing shipped state=done con merge fa921711 PERO no integrado a app real — sidebar nav no linkea + dashboard sigue mostrando placeholder + Tailwind no renderiza en runtime. Caso documentado en vitalia/docs/learnings/2026-05-21-auto-handoff-deferred-e2e-blocker.md (promotable: yes cross-brand process gap)."
parallel_safe: true
ola_assigned: 2-followup
priority: high
estimated_dev_weeks: 0.5 (small, mostly trivial fixes + Tailwind diag)
blockers: []
side_story_blockers: []
preflight_gates_required:
  - stack-stable                                  # diagnosticar Turbopack issue learning 2026-05-20 ANTES o IN PARALLEL
  - manual-visual-verification-protocol-cemented  # output del learning 2026-05-21 — el gate nuevo del process
next_action: "/pm-vitalia o Chris ratifica refining. Una vez refined → /architect produce ready package (probablemente 3-4 tickets máximo). /dev-team build → /auditor → /pm-vitalia merge — pero esta vez con HARD GATE de manual visual verification antes de cerrar developed."
---

# vitalia-slice-1-marketing-integration — checkpoint

## Goal

Integrar el módulo marketing (shipped 2026-05-21 commit `fa921711`) al app shell real de Vitalia. La story padre dejó código aislado (componentes + route + tests) pero los 3 puntos de integración con la app NO se ejecutaron:

1. **Sidebar nav** (`vitalia/frontend/src/components/shared/shell/Sidebar.tsx`) no incluye link a `/marketing`
2. **Home dashboard** (`vitalia/frontend/src/features/dashboard/components/SliceOneStubsRow.tsx`) sigue mostrando "Marketing·pronto" como placeholder coming-soon en vez de marcarlo como live
3. **Tailwind v4 runtime** — bug ortogonal: HTML renderiza sin estilos aplicados (capture user 2026-05-20). Puede ser cause del DEFERRED E2E original (Turbopack stack instability). Diagnosis bloqueador real Slice 1 más allá de marketing.

## Symptom origen (user reportado 2026-05-20 23:00)

Captura `/home/chalreme/Imágenes/Captura de pantalla de 2026-05-20 20-43-51.png`:
- URL: `dev-app.vitalialat.com/#main-content` (home, no marketing)
- Sidebar: `Inicio · Pacientes · Agenda · Tratamientos · Pagos · Copiloto` (6 items, marketing ausente)
- Dashboard: cards "·pronto" incluyendo "Marketing·pronto"
- Estilos: unstyled HTML (Tailwind no aplica — fonts default browser, no design tokens)

## Scope tickets propuestos (sujeto a refinement)

| Ticket | Surface | Estimate | Scope |
|---|---|---|---|
| T-mki-1 | frontend | 30 min | Add `{ label: "Marketing", href: "/marketing", icon: ... }` a `Sidebar.tsx::DEFAULT_NAV_ITEMS` + arch fitness test que enforce coverage de all live routes |
| T-mki-2 | frontend | 20 min | Remove `MarketingStub` card de `SliceOneStubsRow.tsx` (o flip a `status: live` si el patrón soporta). Update tests dashboard. |
| T-mki-3 | frontend | 1-2h | Diagnosticar Tailwind v4 runtime issue. Posibles causas: (a) PostCSS config missing, (b) CSS bundle no compila en dev, (c) Turbopack regress, (d) cookie/SW stale. Reproducir con `make dev-vitalia` fresh state. |
| T-mki-4 | docs/process | 30 min | Update `.claude/rules/story-closure-gate.md` con Layer 8 (deferred-e2e blocker gate). Coordinated con `/pm-luana` si cross-brand lift. |
| T-mki-5 | qa | 1h | Manual visual verification: navegar a `/marketing` post fixes, capturar screenshot Bowtie + Lucas cards + Attribution + Referrals + Channels render. Anexar a `06-audit/manual-verification.md`. |

## Estimated total

~3-5h dev wall-clock. Audit cycle estimado 1 iter (cambios triviales, sin cascading defects esperados).

## Why this matters más allá de marketing

Si Tailwind v4 no renderiza tokens en runtime, **TODAS las stories Slice 1 (Inbox + Pipeline + Agenda + Fidelización + Marketing) van a verse rotas** cuando se naveguen al stack real, incluso aunque sus tests unit/arch/Gherkin pasen. El gap del marketing es la primera evidencia visible — el resto puede estar igual de roto y nunca lo detectamos porque el E2E está DEFERRED uniformemente.

→ T-mki-3 (Tailwind diag) es probablemente el ticket más importante de la story, no T-mki-1 trivial.

## Process gate nuevo cemented post-story

Una vez T-mki-4 mergeado:
- `/dev-team` Step 4.5 — verifica deferred count visual/e2e. Si > 0 → STOP en `developed`, ping orchestrator
- Orchestrator (Opus) — requiere manual visual verification ANTES de auto-handoff a auditor cuando deferred presente
- Si Chris ratifica skip → learning auto-emitido con severity HIGH + risk_accepted

Este gate impide que vitalia-slice-1-{pipeline,agenda} (próximas en pipeline) se repitan el mismo patrón.

## Referencias

- Learning origen: `vitalia/docs/learnings/2026-05-21-auto-handoff-deferred-e2e-blocker.md`
- Story padre archive: `vitalia/docs/archive/2026/stories/vitalia-slice-1-marketing/` (29 commits, merge fa921711)
- Bug Turbopack relacionado: `vitalia/docs/learnings/2026-05-20-docker-frontend-ram-turbopack-issue.md`
- Process SSoT actual (gap): `.claude/rules/story-closure-gate.md` (no contempla deferred e2e)
- Paradigm cementado: `docs/architecture/luana-platform/ADR-007-paradigm-v4.1-autonomy.md`
