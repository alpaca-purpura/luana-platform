---
story_id: nicolify-r0-sitemap-completo
kind: dispatch-plan
brand: nicolify
surfaces: [frontend]
autonomous_mode: false              # default · Chris ratifica si quiere autonomous
generated_by: /architect
generated_on: 2026-06-03
---

# Dispatch Plan — Nicolify R0 sitemap (thin nav-skeleton · FE-only)

## autonomous_mode: false (default)
`/architect` propone, Chris ratifica. Esta story es **safe para autonomous** (FE non-agentic, scope acotado, sin engine/DB/cross-brand, sin stake-asimétrico) — pero el default es `false` por política. Si Chris dice "corré autonomous", se flipea a `true` con los caps de abajo.

**Criterios safe (cumplidos):** sin agentic · sin migración/DB · sin engine core · sin cross-brand · sin PII/security/tenant-leak · scope = datos de nav + 1 ruta + tests. **HARD-false triggers:** ninguno presente.

## Caps (autonomous · si Chris lo activa)
- `audit_iterations`: ≤ 4 total.
- `self_fix_iter` (auditor Carril A · mecánico): ≤ 5.
- `wall_clock`: ≤ 30 min.
- `wip_cap`: bucket `code:shell-organism` = 1 story a la vez (T-1 y T-2 serie).

## Handoff matrix — ticket → agent → model → cost

| Ticket | Surface | primary_agent | model | production_code | Skills | Est. cost |
|---|---|---|---|---|---|---|
| **T-1** | FE (shell-routes + N3 route + content-map + tests-data) | `builder-frontend` | **sonnet** | true | frontend-expert, nicolify-design-system | ~M (datos + 1 ruta clon + 2 test updates) |
| **T-2** | FE e2e (anti-burbuja fixture + nav-walk) | `builder-frontend` | **sonnet** | false | playwright-expert, frontend-expert | ~S (1 fixture + 1 spec + data update) |

**Sin tickets Opus** (ningún agentic · R23 no aplica). **Sin tickets backend/agentic.** Auditor: `auditor-frontend` (Opus) para ambos.

## DAG
```
T-1 (shell-routes v3 + ruta N3 + content-map + tests-data)
  └─ GREEN (tsc+eslint+vitest+arch) ──→ T-2 (e2e nav-walk + base.ts anti-burbuja)
                                          └─ GREEN (playwright nav-walk) ──→ /auditor (auditor-frontend)
```
Serie (mismo módulo `shell-organism`). T-2 verifica live la ruta N3 que T-1 crea → no se puede paralelizar.

## Playwright visual scope (D3 · resumen · detalle en 04-validators § playwright_visual_scope)
- **story_scope_routes:** todas las rutas del árbol v3 (N2 + los 3 N3) — ver 04-validators.
- **forbidden:** maquinaria del shell (Ribbon/SubTabsBar/SubSubTabsBar/EmptyState/Layout/Luana/TopBar) · `components/ui/` · `[agent]/page.tsx` · `[subtab]/page.tsx` (se leen, no se editan) · engine · cross-brand.
- **out_of_mockup_scope:** NO diseñar hojas reales (R1..R5). Sin `toHaveScreenshot` de página completa. Visual golden = OPCIONAL liviano (EmptyState ya golden-ado en nicolify-r0-shell).

## Auditor routing
| Surface | Auditor | Foco |
|---|---|---|
| FE (T-1 + T-2) | `auditor-frontend` (Opus) | árbol == SYSTEM-MAP slug-a-slug · SSoT enforce · ruta N3 navegable (no isla · CONN) · gate anti-burbuja presente · regression_guard intacto · español neutro · scope discipline (no diseñó hojas · no tocó maquinaria) · Phase D gherkin-matrix (F-NAV-WALK/F-EMPTY-STATES/F-SARA/F-INVALID/F-DEFAULT) |

## Gates que correrán (gate-runner)
`tsc --noEmit` · `eslint src/ --max-warnings 0` · `vitest run src/lib/routing/` · `vitest run src/__tests__/architecture/` (SSoT + FSD) · `playwright test e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts --project=smoke` (nativos · host).

## Invocación

### Manual (default)
```
/dev-team nicolify nicolify-r0-sitemap-completo toma T-1
# tras T-1 GREEN + auditor (o auto-handoff):
/dev-team nicolify nicolify-r0-sitemap-completo toma T-2
```

### Autonomous (solo si Chris ratifica)
```
/dev-team nicolify nicolify-r0-sitemap-completo --autonomous
# corre T-1 → gates → T-2 → gates → auditor-frontend → (si APPROVED) handoff /pm-nicolify
# caps: audit_iterations≤4 · self_fix_iter≤5 · wall_clock≤30min
# DoD #37 NO se salta: demo manual + demo_signoff de Chris siguen requeridos pre-merge→done.
```

## DoD live (#37 · pre-merge)
- `make dev-nicolify` · localhost:3001.
- Recorrer el menú v3 completo (Chrome MCP): cada Ribbon → cada N2 → los 3 N3 → empty-state visible · Console 0 rojos · sin overlay Next · N3 no da 404.
- `demo-script.md` (4 secciones) + `demo_signoff` Chris APPROVED.
- `dod_evidence` en checkpoint.
