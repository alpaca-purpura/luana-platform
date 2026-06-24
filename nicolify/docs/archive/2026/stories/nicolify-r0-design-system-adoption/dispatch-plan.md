---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
autonomous_mode: false          # default — Chris opt-in al ratificar (architect propone, Chris ratifica)
surface: frontend               # FE-only
architect_run_on: 2026-06-16
---

# dispatch-plan · nicolify-r0-design-system-adoption

> Plan de spawn para `/dev-team`. **FE-only · todos los tickets `builder-frontend` (workhorse) · auditor `auditor-frontend` (flagship). Cero agentic, cero flagship-builder, cero BE.**

## autonomous_mode: false (recomendación)

Default `false`. Razón: es FUNDACIONAL (R0) + toca el chrome del shell + converge Abel (gate #37) + tiene una **dependencia externa** (kit-lift `/pm-luana`) que afecta 1-2 goldens y el demo final. Chris debería ver la convergencia visual antes del cierre. Chris puede opt-in a `true` al ratificar si prefiere correr a `/auditor` sin pausa en G.

## Ticket → agent → model → costo matrix

| Ticket | Agente | Model tier | Naturaleza | Costo estimado |
|---|---|---|---|---|
| T-1 globals.css↔tokens + arch-test | `builder-frontend` | workhorse | styling+arch-test | bajo |
| T-2 matar 4 mirrors + repoint + anti-mirror test | `builder-frontend` | workhorse | refactor+arch-test | bajo-medio |
| T-3 re-expresar abel/icp + chrome vía primitivas | `builder-frontend` | workhorse | refactor+fe-component | medio |
| T-4 migrar arbitraries + lock no-arbitrary (anti-default-flip) | `builder-frontend` | workhorse | default-flag-flip+styling | bajo-medio |
| T-5 visual goldens + a11y e2e + contract update + live-verify | `builder-frontend` | workhorse | e2e-visual+a11y+doc+live-verify | medio |

**Auditor de TODOS los tickets:** `auditor-frontend` (flagship). NO hay surface agentic → NO `builder-agentic`/`auditor-agentic`. NO `/pm-luana` builder en esta story (RN-7 lift es proceso separado, no un ticket de aquí).

## DAG

```
        T-1 ─┐
             ├─→ T-3 ─→ T-4 ─→ T-5
        T-2 ─┘
```

- **T-1** (globals.css + tokens + package.json dep) y **T-2** (matar mirrors + repoint) son **paralelos** (distintos archivos; T-1 toca globals/eslint-dep, T-2 toca componentes shared/abel imports).
- **T-3** depende de AMBOS (re-expresa con tokens de T-1 + kit-imports de T-2).
- **T-4** tras T-3 (lock se enciende cuando los arbitraries de los componentes re-expresados ya están migrados).
- **T-5** cierra (goldens/e2e/live-verify sobre el FE convergido).

> Single-hub: bucket `code:design-system`. Abel está en `code:abel` (reviewing/gate #37) ≠ bucket → no colisiona. Commit por pathspec siempre.

## playwright_visual_scope (resumen)

- **story_scope_paths:** `(shell-organism)/**`, `components/shared/**`, `features/abel/**`, `globals.css`, `eslint.config.mjs`, `__tests__/architecture/**`
- **story_scope_routes:** `/{tenantId}/abel/icp` (master), `/{tenantId}/abel/icp/{icpId}/{leaf}` (detalle)
- **forbidden:** `core/@luana/**` (engine — escalate `/pm-luana`), `{vitalia,comunify,lupulo}/**`
- Goldens: tokens-swatch / abel-icp-master / abel-icp-detail / states corren AHORA; control-radius (pill) en atoms.png + (condicional) active-leaf-accent → **GATED en kit-lift**.

## RN-7 external dependency note (blocked_on /pm-luana kit lift)

- **`kit-radius-control-lift`** (owner `/pm-luana`): el kit `Button`/`Input`/`Select`/`Textarea` debe consumir `--radius-control` (hoy `rounded-md` hardcodeado). Es cambio de engine cross-brand → promotion gate, **manejado por el architect skill EN PARALELO a esta story, NUNCA aquí**.
  - Bloquea: golden de control-radius/pill (T-5) + bump de `@luana/ui-kit` en `nicolify/frontend/package.json` post-lift + el demo único Abel convergence (gate #37) que corre cuando AMBOS aterrizan.
  - Esta story entrega TODO lo demás (estructura, tokens, anti-mirror, lock, re-expresión, goldens no-gateados) AHORA.
- **`kit-accent-slot-lift`** (condicional): si el active-leaf de `EntitySubNavBar` con tokens semánticos no matchea el agent-abel del mockup → FLAG lift candidate `/pm-luana` (kit acepta `accentToken`/`agentSlot` opcional) + gatear ESE golden. No retener mirror.

## Handoff next

`/dev-team nicolify nicolify-r0-design-system-adoption` (refined→developing). En paralelo: `/pm-luana` arranca el kit-lift RN-7 (`--radius-control` en kit controls + opcional `accentToken` en EntitySubNavBar). El demo gate #37 (Abel convergence) corre cuando ambos aterrizan.
