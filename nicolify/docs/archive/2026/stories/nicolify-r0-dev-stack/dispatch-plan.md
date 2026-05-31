# Dispatch plan — Story nicolify/nicolify-r0-dev-stack

> Owner: `/architect`. Consumido por `/dev-team` Step 0 (respeta assignment.primary_agent) + autonomous chain hook.

## autonomous_mode
- value: **false** (default — Chris opt-in al ratificar ready)
- chain_if_true: [/dev-team → /auditor → /pm-nicolify merge]
- caps: { max_iterations_per_ticket: 10, max_audit_iterations: 3, max_total_cost_usd: 5.00, max_wall_clock_minutes: 120, on_cap_exceeded: "state=blocked + escalate Chris" }
- safe_for_autonomous: PARCIAL. Story es service/ui-story sin agentic, ≤5 tickets, sin engine, sin cross-brand → cumple criterios técnicos. PERO **dependencia externa Chris** (Clerk dev instance + keys + seed --clerk-sync) gatea Scenarios 2/5/6/7. **Recomendación: false** hasta que Chris confirme keys en .env.dev. Con keys puestas → autonomous true es seguro (Sonnet en los 5 tickets).

## Ticket → Agent → Model → Cost matrix

| T-id | Title | Surface | Agent | Model | Est. cost | Est. time |
|---|---|---|---|---|---|---|
| T-1 | BE app + iam mount + db + skeleton | BE | builder-backend | sonnet | $0.35 | 30 min |
| T-2 | Alembic baseline (replace) + seed | BE | builder-backend | sonnet | $0.40 | 35 min |
| T-3 | FE Clerk wiring + root + sign-in/up | FE | builder-frontend | sonnet | $0.45 | 35 min |
| T-4 | E2E clerk.setup + fixture + specs + config | E2E | builder-frontend | sonnet | $0.55 | 40 min |
| T-5 | INFRA verify + .env.dev.template | INFRA | builder-backend | sonnet | $0.20 | 15 min |
| **Total** | — | — | — | sonnet ×5 | **~$1.95** | **~155 min** |

> CERO tickets AGENTIC → CERO Opus builders. CERO tickets engine → CERO /pm-luana gate.

## DAG dependencies
```
T-1 ─┬─→ T-2 ─┐
     └─→ T-3 ─┴─→ T-4 ─→ T-5
```
T-2 y T-3 paralelizables tras T-1 (buckets distintos: BE-alembic vs FE). T-4 requiere T-2 (seed/migration) + T-3 (FE pages). T-5 cierra.

## Playwright visual scope
- story_scope_routes: [ `/`, `/sign-in`, `/sign-up` ]
- story_scope_components: [ `app/page.tsx`, `app/layout.tsx` (excepción foundational AD-1), `app/providers.tsx`, `lib/api/fetchClient.ts`, `proxy.ts` ]
- forbidden: `components/ui/`, `components/shared/` (no tokens de marca / shell — design-system + shell stories)
- visual goldens: **not_applicable** (sin componentes de marca; ver 04-validators § visual)
- non_egoismo: bugs legacy fuera de scope (e2e/pages cruft) → reportar en T-{n}-impl-log § Cross-story observed bugs. NO arreglar inline.

## Pre-condición externa (Chris — NO es ticket)
Crear Clerk **dev instance propia de Nicolify** + pegar keys en `nicolify/.env.dev` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_ISSUER`) + correr seed `--clerk-sync` (crea owner.demo@nicolify.com en Clerk + publicMetadata). Sin esto: Scenarios 1/3 + arch tests corren verde; Scenarios 2/5/6/7 (auth) quedan gated.

## Recommended invocation if autonomous (con keys puestas)
```bash
echo 'autonomous_mode: true' >> nicolify/docs/product/stories/nicolify-r0-dev-stack/checkpoint.md
# /dev-team picks up T-1 → T-2/T-3 → T-4 → T-5 → /auditor → /pm-nicolify merge
```

## Recommended invocation if manual
```
/dev-team nicolify: nicolify-r0-dev-stack, ticket: T-1
```

## Decisión bloqueante surfaced a /pm-nicolify (ver 03-arch § 16)
1. Legacy `001_initial_snapshot.py` (115 tablas visionarias) → **BORRAR** + reemplazar por baseline IAM limpio. Confirmar (recomendación: borrar; vive en branch legacy).
2. Clerk dev instance = dependencia externa Chris (gatea auth scenarios).
3. Cruft legacy `e2e/pages/*` + `e2e/fixtures/*` → dejar intacto (nuevo config no los matchea).
