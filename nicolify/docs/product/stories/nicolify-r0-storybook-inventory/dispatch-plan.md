---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
schema_version: v4.1
autonomous_mode: false            # default — Chris opt-in al ratificar (architect propone, Chris ratifica)
architecture_pattern: ADR-014-design-system-homologation
---

# dispatch-plan — nicolify-r0-storybook-inventory

> Plan de despacho para `/dev-team`. Naturaleza técnica (design-system inventory). Surfaces: FE storybook + DOCS contrato. NO BE, NO AGENTIC, NO rutas de usuario.

## autonomous_mode: false (default)

`/architect` propone `false`. **Criterio:** aunque la story es técnica y de bajo riesgo de seguridad (no toca BE/PHI/tenant/migrations/prompt), tiene una pieza de juicio (la clasificación de baldes + la fidelidad de render de las stories de container con decorators) que se beneficia de la **demo navegable** de Chris (DoD técnica = ver el storybook poblado + el contrato 1:1 legible). Chris puede flipear a `true` si quiere correr architect→done en la misma sesión — el riesgo de seguridad es nulo; lo único que se pierde es la inspección visual del storybook. **Recomendación: dejar `false`** y que la demo G sea "Chris navega el storybook nuevo + lee el contrato".

## Caps

- `responsible_fix_iter`: 6 · `audit_iterations`: 4 total · wall-clock: ≤40 min (auditor Responsable v5).
- `iteration.max_iterations` (dev-team): 8.

## Matriz ticket → builder → model → costo

| Ticket | Surface | Builder | Model tier | Costo estimado | Notas |
|---|---|---|---|---|---|
| T-1 | DOCS (clasificación) | builder-frontend | workhorse | bajo | grep cross-kit + escribir tabla. Raíz del DAG. |
| T-2 | FE (infra storybook) | builder-frontend | workhorse | medio | decorators + mocks + fixtures (traducir patrón de los .test.tsx). |
| T-3 | FE (Abel ICP, 7 stories) | builder-frontend | workhorse | medio-alto | el bloque más grande; containers usan decorators de T-2. |
| T-4 | FE (moléculas shared, 8 stories) | builder-frontend | workhorse | medio | mayormente presentacionales. Paralelo a T-3. |
| T-5 | FE (roster doc-story) | builder-frontend | workhorse | bajo | compone AgentAvatar de T-4. |
| T-6 | DOCS (contrato 1:1) | builder-frontend | workhorse | medio | entregable final; linkea las stories. |

> **Tier workhorse en TODOS.** NUNCA flagship — R23 (agentic production_code → flagship) NO aplica (cero surface agentic). Cero `builder-backend`, cero `builder-agentic`.

## DAG (orden de invocación)

```
T-1 (clasificación) ─┬─► T-2 (infra) ─┬─► T-3 (Abel ICP) ─┐
                     │                └─► T-4 (shared) ──┬─► T-5 (roster) ─┐
                     │                                   │                 │
                     └───────────────────────────────────┴─────────────────┴─► T-6 (contrato 1:1)
```

- **T-1 bloquea todo** (cierra balde-2 vs balde-3 exacto).
- **T-2 bloquea las stories** (sus containers necesitan los decorators).
- **T-3 + T-4 paralelizables** tras T-2 (mismo bucket `code:design-system` → si se corren en sesiones paralelas same-hub, serializar con bucket lock; commit por pathspec).
- **T-5** tras T-4 (usa AgentAvatar).
- **T-6** tras T-3+T-4+T-5 (el contrato 1:1 linkea las stories).

## Playwright visual scope

**N/A** — no hay rutas de la app (la story no construye pantallas). El scope visual es `nicolify/frontend/.storybook/**` + las `.stories.tsx` co-locadas. La render-sanity la da `build-storybook`; la fidelidad la verifica el ojo en el storybook navegable durante la demo. Cero `toHaveScreenshot` de rutas, cero POMs, cero e2e de flujo.

## Bucket lock + worktree

- Bucket: `code:design-system` (FE) + `docs` (contrato). Coordinar con `nicolify-r0-design-system-adoption` (en G, mismo bucket `code:design-system`) — **idealmente cerrar su demo+signoff antes del BUILD de esta** (inventaría piezas estables). Si corren en paralelo same-hub: bucket lock + commit por pathspec.
- Hub canónico `wip/nicolify` (ADR-009). NO worktree separado.

## Gates de cierre (ver 04-validators)

`fe_typecheck` + `fe_lint_stories` (incl. no-arbitrary) + `fe_arch_fitness` (ratchets no suben) + `storybook_build` (render-sanity) + `completeness_check` + `classification_correct` + `roster_honest` + `a11y_addon_manual` (advisory).

**DoD técnica (demo G):** levantar `pnpm --filter @nicolify/frontend storybook` (:6006) → navegar las stories nuevas (render fiel, no colgado) + abrir `SHELL-DESIGN-CONTRACT.md` (mapa 1:1 completo). `dod_evidence` en checkpoint = qué stories se navegaron + render fiel + a11y. NO hay write live (no hay BE) → `dev_app_verified.required: false`.

## Open questions (heredadas de 03-arch § 16)

1. a11y advisory vs test-runner HARD (default: advisory + HB-nota).
2. HB-106/107 NO son vapor (corrección al spec) — los ratchets corren; el promote-gate es lo único por prosa.
3. SubTabContent/ShellLayoutWire/_agent-tw-classes/types = wire/no-storiable (default: listados como infra de routing).
