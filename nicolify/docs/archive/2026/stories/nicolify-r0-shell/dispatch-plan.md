# Dispatch plan — Story nicolify/nicolify-r0-shell

> FE-ONLY · ui-story · shell-organism skeleton (port re-tematizado de Vitalia). Cero BE/AGENTIC.

## autonomous_mode
- value: false                   # default · Chris opt-in al ratificar ready
- chain_if_true: [/dev-team → /auditor → /pm-nicolify merge]
- caps:
    max_iterations_per_ticket: 10
    max_audit_iterations: 3
    max_total_cost_usd: 6.00     # 6 tickets FE Sonnet + visual goldens
    max_wall_clock_minutes: 180
    on_cap_exceeded: "state=blocked + escalate Chris"

### autonomous_mode safety assessment
- ✅ ui-story standard (shell skeleton, sin agentic) — candidato seguro
- ⚠️ 7 tickets (T-0 dev-stack boot absorbido + 6 FE) — sobre el umbral típico; Chris valora si encadena o supervisa T-3 (SSR-safe store, pieza sensible)
- ℹ️ T-0 (dev-stack) NO toca código BE (main.py + IAM baseline ya existen) — solo cablea boot/middleware/env + smoke live
- ✅ ningún ticket toca `core/luana-core-*/` ni `@luana/*` (engine ban respetado)
- ✅ ningún ticket toca `vitalia/**` (cross-brand respetado · port = filesystem copy)
- ✅ ningún ticket es AGENTIC production_code (todo builder-frontend Sonnet)
- ✅ validators con `must_pass: true` claros, sin `pass_k` ambiguos
- **Recomendación architect:** `autonomous_mode: false` (default). Chris puede flip a true si acepta los caps; sugerido supervisar T-3 (bug Vitalia C3 conocido — SSR-safe store).

## Ticket → Agent → Model → Cost matrix

| T-id | Title | Surface | Agent | Model | Est. cost | Est. time |
|---|---|---|---|---|---|---|
| T-0 | Dev-stack boot: make dev-nicolify green + Clerk middleware + live smoke | FE+infra | builder-frontend | sonnet | $0.30 | 25 min |
| T-1 | Tokens + globals.css + ThemeToggle + _agent-tw-classes + dep | FE | builder-frontend | sonnet | $0.45 | 30 min |
| T-2 | TopBarGlobal + LogoMark + TenantSwitcher | FE | builder-frontend | sonnet | $0.40 | 25 min |
| T-3 | Layout dual-mode + splitter + shell-store SSR-safe (G2) | FE | builder-frontend | sonnet | $0.70 | 40 min |
| T-4 | Panel Luana skeleton (3 estados + chat) | FE | builder-frontend | sonnet | $0.55 | 35 min |
| T-5 | Ribbon 5 agentes + SubTabsBar + shell-routes SSoT | FE | builder-frontend | sonnet | $0.55 | 35 min |
| T-6 | Routing route-group + not-found + empty-states + e2e + smoke live A0 | FE | builder-frontend | sonnet | $0.70 | 45 min |
| Total | — | — | — | — | **$3.65** | **~235 min** |

## DAG dependencies
```
T-0 (dev-stack boot · absorbido)
   └─→ T-1 ─┬─→ T-2 ──────────────┐
            ├─→ T-3 ─┬─→ T-4 ─────┼─→ T-6 ─→ [smoke A0 live = DoD]
            │        └─→ T-5 ─────┘
            └─────────→ T-5 ──────┘
critical path: T-0 → T-1 → T-3 → T-5 → T-6
parallel: T-2 ∥ (T-3→T-4) tras T-1 ; T-5 tras T-1+T-3
DoD: app funcional LIVE — smoke A0 (login Clerk → DEFAULT_LANDING → shell reachable) tras T-6.
```

## Playwright visual scope
- story_scope_routes: `/{tenantId}` + `/{tenantId}/[agent]/[subtab]` (todo el shell es R0-nuevo)
- story_scope_components: `components/shared/shell-organism/**` + `(shell-organism)/**` + `shell-store.ts` + `shell-routes.ts` + `globals.css`
- forbidden: `components/ui/` (primitivas @luana) · `core/@luana/**` · `vitalia/**` · `backend/**`
- goldens: side-by-side vs `nicolify-r0-shell-organism/mockups/shell.html` (3 secciones × 2 themes = 6)
- non_egoismo: greenfield — sin features previos que romper; bugs del esqueleto base no tocado → report en T-{n}-impl-log § Cross-story observed bugs (no fix inline)

## Recommended invocation if autonomous
```bash
echo 'autonomous_mode: true' >> nicolify/docs/product/stories/nicolify-r0-shell/checkpoint.md
# /dev-team toma T-1 → encadena T-2/T-3 → T-4/T-5 → T-6 → /auditor → /pm-nicolify merge
# (requiere nicolify-r0-dev-stack verde primero)
```

## Recommended invocation if manual
```bash
# T-0 arranca el boot (no hay precondición externa — dev-stack es ahora T-0):
/dev-team nicolify: nicolify-r0-shell, ticket: T-0
# luego T-1..T-6. El smoke live A0 cierra tras T-6 (app funcional).
```
