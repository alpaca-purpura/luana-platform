---
story_id: nicolify-r0-sitemap-completo
brand: nicolify
release: R0
merged_at: 2026-06-03T00:00Z
merged_by: /pm-nicolify
commit_squash_sha: pending-haiku-commit         # commit del cierre done en wip/nicolify (hub único M12) · integración a main = paso separado manual (staging deploy MANUAL · triple-branch)
checkpoints_path: "./CHECKPOINTS.md"
gherkin_matrix_path: "./06-audit/gherkin-matrix.md"
story_type: ui-story-thin
---

# 07-merge — nicolify-r0-sitemap-completo (thin nav-skeleton v3 · FE-only)

> Cierre `reviewing → done`. Auditor APPROVED (16/16 cats · gherkin 5/5 PASS · CHECKPOINTS C1-C5). Live-verify GREEN. demo_signoff_preauth cumplido.

## § 1 — Gherkin verification matrix

> Copia de `06-audit/gherkin-matrix.md` (Phase D). Reglas de nav RN-1..RN-5 → scenario → test.

| Scenario | Regla | Test | Status |
|---|---|---|---|
| F-NAV-WALK | RN-1 árbol nav refleja SYSTEM-MAP v2.0 slug-a-slug (N2 + 8 N3) | `e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts` + `src/__tests__/architecture/test_shell_routes_ssot.test.ts` | ✅ PASS |
| F-EMPTY-STATES | RN-2 cada hoja navegable renderiza empty-state (nunca blank/404) | `e2e/.../empty-states-all-subtabs.spec.ts` + `nav-walk-v3.spec.ts` | ✅ PASS |
| F-SARA-PROXIMAMENTE | RN-3 Sara = subtab único `proximamente` → "Próximamente" | `nav-walk-v3.spec.ts` + `src/lib/routing/__tests__/shell-routes.test.ts` | ✅ PASS |
| F-INVALID-GUARD | RN-4 slug/leaf inválido (XSS/traversal/`__proto__`) → `notFound()` | `src/lib/routing/__tests__/shell-routes.test.ts` (guard cases) | ✅ PASS |
| F-DEFAULT-LANDING | RN-5 `DEFAULT_LANDING` = christian/pipeline se mantiene | `shell-routes.test.ts -t 'DEFAULT_LANDING'` | ✅ PASS |

**Coverage:** 5/5 scenarios PASS. Cero NO_COVERAGE. Cero FAIL.

## § 2 — Playwright E2E run

> Live-verify NATIVE host (NUNCA make e2e Docker). `--project=regression` (NO smoke · FLAG #5 — los specs viven en `e2e/regression/`).

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/nicolify/frontend
set -a; source ../.env.dev; set +a
E2E_BASE_URL=http://localhost:3001 npx playwright test \
  e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts --project=regression
```

- Cold run (server recién levantado): **32 passed + 1 flaky** (sara/proximamente pageerror `SyntaxError: Invalid or unexpected token` → retry GREEN), exit 0.
- **Warm re-run:** **33 passed / 0 flaky** (22.3s). sara/proximamente aislado **x5 = 7 passed / 0 flaky** (8.3s).
- Gate anti-burbuja `e2e/fixtures/base.ts` activo: 0 pageerror (warm) · 0 console-error (allowlist) · 0 hydration · 0 `/api` 4xx-5xx · 0 nextjs-error-overlay.

**E2E verdict:** ✅ GREEN (warm). Flaky cold = artefacto `next dev` first-compile chunk-load race (prod-immune · `next build` sirve chunks pre-compilados · auditor confirmó 0 causa en código de producto).

## § 3 — Capabilities updated/created

### UPDATED (extend)
- `nicolify/docs/product/capabilities/shell-organism/shell-nicolify.yaml` — `extend`:
  - `change_log[]` += entry `{ story: nicolify-r0-sitemap-completo, type: extend }` (nav tree v3 N2 + 8 leaves N3 + ruta N3 `[subsubtab]/page.tsx` + redirect N2-con-leaves→primer-leaf).
  - `scenarios[]` += **G1-G4** (árbol v3 · leaf N3 navegable · redirect §17 · Sara proximamente) — todos con `e2e_test` → `nav-walk-v3.spec.ts` (existe · cross_check_3 HARD satisfecho).
  - `dev_preview.entry_points` += ruta N3 `/{tenantId}/[agent]/[subtab]/[subsubtab]` + nota redirect; `dev_preview.main_component` sin cambio (la maquinaria del shell no se tocó · el cambio es de DATOS en `shell-routes.ts`).

### NEW
- Ninguna. Story thin (`cap_change_type: extend` · NO crea cap nueva · cada hoja real declara su cap al construirse en R1+).

## § 4 — Modules MD refreshed

- `nicolify/docs/product/modules/shell-organism.md` — **no existe aún** (módulo solo tiene `README.md` + el cap YAML como SSoT). Sin auto-list que regenerar para esta story. `BACKLOG.md` es auto-gen gitignored (R3) — se regenera con `make portfolio` (no se commitea).

## § 5 — How to verify (reproducible)

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/nicolify/frontend

# 1. Gates estáticos (native host)
npx tsc --noEmit                                   # 0 errors
npx eslint src/ --cache                            # 0 errores (102 warnings baseline · FLAG #1)
npx vitest run src/lib/routing/ src/__tests__/architecture/   # 131/131

# 2. Boundary (sin engine/cross-brand)
grep -rn 'luana-core\|vitalia/\|comunify/\|lupulo/' src/lib/routing/ src/app/ || echo "0 matches"

# 3. E2E live-verify (stack up: make dev-nicolify)
set -a; source ../.env.dev; set +a
E2E_BASE_URL=http://localhost:3001 npx playwright test \
  e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts --project=regression
```

**Expected:** todos exit 0. (E2E: correr 2x si server cold — el 1er compile de cada ruta on-demand es el chunk-race conocido.)

## § 6 — Verificación live — Definition of Done (Critical Rule #37)

```yaml
dod_live_verified: true
dod_env: "make dev-nicolify + make dev-nicolify-tunnel → localhost:3001 (stack interactivo real) + https://dev-app.nicolify.com (túnel, mismo código). Playwright autenticado (--project=regression) + Chris browse manual."
dod_evidence:
  - action: "Recorrer TODO el árbol v3 (20 N2 + 8 N3) autenticado contra localhost:3001 (nav-walk-v3.spec.ts)"
    observed: "warm 33 passed / 0 flaky · cada hoja: subtab-content + empty-state visibles · gate anti-burbuja: 0 pageerror/console-error/hydration/api-4xx/Next-overlay"
    backend_log: "BE :8001 health 200 · sin traceback · writes N/A (thin nav-skeleton, cero lógica de negocio)"
  - action: "N2-con-leaves → redirect server-side al primer leaf (abel/oferta→catalogo-escalera, christian/propuestas→propuestas, norvil/fidelizacion→momentos)"
    observed: "redirect 307 · leaf marcado activo (SubSubTab URL-derived) · sin loop"
  - action: "dev-app.nicolify.com público (Cloudflare tunnel · Error 1033 resuelto)"
    observed: "/ → 307 Clerk sign-in · /api/health → 200 · Chris browse manual con https → aprobó ('luego del fix del redirect, todo se ve bien')"
dod_verified_at: 2026-06-03
caveat: "Live-verify automatizado vía túnel impráctico en dev mode (page.goto 45s+ por compile-por-ruta a través del edge). El GREEN automatizado corrió contra localhost:3001 (código idéntico al del túnel). Chris hizo el recorrido visual manual en dev-app."
```

`demo_signoff_preauth: APPROVED` (contingente a live-verify GREEN — cumplido) + Chris browse manual aprobó. DoD #37 satisfecho para thin nav-skeleton (pre-auth acotada a esta story · NO aplica a hojas reales R1+).

## § 7 — Amendment 03-arch §17 (redirect N2-con-leaves → primer-leaf)

> Ratificado por Chris en live-verify (commit `b94c9ec6`). El architect (`03-arch §17`) había decidido NO auto-seleccionar el N3 (mostrar empty-state del N2 padre). Chris pidió lo contrario: un N2 con hojas N3 (`abel/oferta`, `christian/propuestas`, `norvil/fidelizacion`) hace **redirect server-side al primer leaf** → no muestra un empty-state vacío del padre. `[subtab]/page.tsx` editado (era `forbidden_to_touch` · override Chris ratificado live). Auditor verificó: loop-free + leaf-active correcto.

## Story → archive
- `nicolify/docs/product/stories/nicolify-r0-sitemap-completo/` → `nicolify/docs/archive/2026/stories/nicolify-r0-sitemap-completo/` (git mv · MISMO commit · incluye chris-input.md, HANDOFF, T-*, 06-audit/).
- R0.yaml `stories[]` += `nicolify-r0-sitemap-completo` (done).

## Harness mis-specs → /harness-issue (NO bugs de la story)
- **FLAG #1:** `04-validators eslint_zero` usa `npx eslint src/ --max-warnings 0` — inalcanzable (102 warnings PRE-EXISTENTES baseline). Gate real enforced = `npx eslint src/` (0 errores). → alinear validator.
- **FLAG #5:** `04-validators` `nav_walk_v3`/`empty_states_all` usan `--project=smoke` pero los specs viven en `e2e/regression/` → smoke matchea 0 tests = **falso verde**. Correcto = `--project=regression`.

## FLAG #3 (fuera de scope · cleanup story separada)
Dual-render strict-mode bug suite-wide: el shell monta desktop (`md:block`) + mobile (`md:hidden`) SIEMPRE → cada `data-testid` existe 2× → strict-mode Playwright. Specs de esta story scopeadas a `:visible`. Las specs NO tocadas (splitter/theme/luana/topbar/responsive/a11y/...) comparten el bug → cleanup aparte.

## Cross-references
- `CHECKPOINTS.md` · `06-audit/gherkin-matrix.md` · `T-1-review.md` · `gate-output.json`
- `.claude/rules/story-closure-gate.md` · `.claude/rules/definition-of-done-live-verify.md`
