# dispatch-plan.md — Template (5º artefacto del ready package)

> Vive en: `{brand}/docs/product/stories/{story-id}/dispatch-plan.md`
> Owner: `/architect` (Step 7.5). Consumer: `/dev-team` Step 0.7.
> SSoT del schema: `.claude/rules/architect-autonomous-mode.md`.
> Cap ≤100 líneas. Reemplazá los placeholders `{...}`.

# Dispatch plan — Story {brand}/{story-id}

## autonomous_mode
- value: false                      # default. Chris opt-in explícito al ratificar ready
- chain_if_true: [/dev-team → /auditor → /pm-{brand} merge]
- caps: { max_iterations_per_ticket: 10, max_audit_iterations: 3, max_total_cost_usd: 5.00, max_wall_clock_minutes: 90, on_cap_exceeded: "state=blocked + escalate Chris" }

> Reglas HARD para `autonomous_mode: true` (ver architect-autonomous-mode.md):
> NUNCA true si — algún ticket AGENTIC `production_code: true` · toca `core/luana-core-*` · toca cross-brand · validators con `pass_k` < 0.66 · hot-fix `repro_verified: false` · `defer_audit: true`.

## Ticket → Agent → Model → Cost matrix

| T-id | Title | Surface | primary_agent | Model | Est. cost | Est. time |
|---|---|---|---|---|---|---|
| T-1 | {título} | BE | builder-backend | sonnet | ${x} | {n} min |
| T-2 | {título} | AGENTIC | builder-agentic | opus (R23) | ${x} | {n} min |
| T-3 | {título} | FE | builder-frontend | sonnet | ${x} | {n} min |
| **Total** | — | — | — | — | **${X}** | **~{N} min** |

## DAG dependencies
T-1 → T-2 → T-3   (citar el grafo real de `06-tickets.yaml` blocks/blocked_by)

## Playwright visual scope discipline (si ui-story)
- story_scope_routes: [{rutas donde aplicar cambios visuales}]
- story_scope_components: [{componentes en scope}]
- forbidden_visual_changes: [`{brand}/frontend/src/components/ui/`, `components/shared/`, `app/layout.tsx`]
- non_egoísmo: bug visible en feature/ruta NO tocada por esta story → reportar en `T-{n}-impl-log.md § Cross-story observed bugs`, NO arreglar inline.

## Invocación recomendada
```
# Manual (Chris elige cuándo arrancar cada ticket):
/dev-team <brand>: {brand}, ticket: T-1

# Autonomous (si Chris opt-in true al ratificar):
echo 'autonomous_mode: true' >> {brand}/docs/product/stories/{story-id}/checkpoint.md
# /dev-team toma T-1 → auto-handoff T-2 → T-3 → /auditor → /pm-{brand} merge
```
