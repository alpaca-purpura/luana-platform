# Gherkin verification matrix — nicolify/nicolify-r0-sitemap-completo

> Auditor: Phase D (story-closure-gate 2026-05-18 · DoD #37 v5)
> Brand: nicolify · Date: 2026-06-03
> Source: `04-validators.yaml § business_rules` (RN-1..RN-5) + `§ scenario_coverage` + `06-tickets.yaml § gherkin_coverage`
> Verification harness: gate-runner `gate-output.json` (vitest 131/131) + live e2e nav-walk-v3 (`--project=regression`, localhost:3001 warm) + sara isolated x5

## Matrix (rule → scenario → test → status)

| Business rule | Scenario | Validator / test | Status | Evidence |
|---|---|---|---|---|
| **RN-1** árbol nav refleja SYSTEM-MAP v2.0 slug-a-slug (N2 + 8 N3) | `F-NAV-WALK` | `nav_walk_v3` (e2e) + `arch_shell_routes_ssot` (vitest) | **PASS** | warm nav-walk **33 passed / 0 flaky** (22.3s); SSoT arch test GREEN (parte de vitest 131/131); `shell-routes.test.ts:107-223` asserts árbol slug-a-slug |
| **RN-2** cada hoja navegable (N2 sin leaf + cada leaf N3) renderiza empty-state — nunca blank ni 404 | `F-EMPTY-STATES` | `empty_states_all` (e2e) + `nav_walk_v3` | **PASS** | nav-walk asserta `subtab-content` + `empty-state` visibles en los 20 N2 + 8 N3; ruta N3 `[subsubtab]/page.tsx` cierra el 404-island (T-1) |
| **RN-3** Sara = tab visible con subtab único `proximamente` → empty-state "Próximamente" | `F-SARA-PROXIMAMENTE` | `nav_walk_v3` + `vitest_unit` | **PASS** | sara/proximamente isolated **x5 = 7 passed / 0 flaky** (8.3s); SSoT `idMatches.length===1` GREEN; tabLabel `Próximamente` |
| **RN-4** slug/leaf inválido (XSS/path-traversal/`__proto__`) en N2 o N3 → `notFound()`, shell chrome intacto | `F-INVALID-GUARD` | `invalid_guard_n2_n3` (vitest `shell-routes.test.ts`) | **PASS** | `isValidSubtab` + `isValidSubSubTab` whitelist-only; unit cubre `<script>`, `../../etc/passwd`, `__proto__`, empty, leaf inexistente (`shell-routes.test.ts:317-357`); ruta N3 llama el guard ANTES de render (`[subsubtab]/page.tsx` route-enforced) |
| **RN-5** `DEFAULT_LANDING` = christian/pipeline se mantiene (coherente con `AGENT_CATALOG.christian.defaultSubtab`) | `F-DEFAULT-LANDING` | `default_landing` (vitest `-t DEFAULT_LANDING`) | **PASS** | `DEFAULT_LANDING.agent==='christian' && subtab==='pipeline'`; `AGENT_CATALOG.christian.defaultSubtab==='pipeline'` (vitest GREEN) |

## Cobertura cross-check (v5 · Matriz de cobertura del spec)

Story = `design-story` thin nav-skeleton. El SSoT del spec es `01-sitemap.md` v3 + `SYSTEM-MAP.yaml` v2.0; el `04-validators.yaml § business_rules` (RN-1..RN-5) ES la matriz de cobertura formal. **Ningún `Bif-N`/`RN-N` quedó sin scenario/test:** las 5 reglas → 5 scenarios → 5 validators, todos PASS. No hay branch del árbol mapeado a un `SC-X` que no haya llegado a test.

## Verificación REAL (≠ HTTP 200)

- **No es GET-200:** la verificación ejerce la **acción real del usuario** (navegar Ribbon → N2 → N3, click en cada SubSubTab) y observa el **efecto** (empty-state renderizado + `SubSubTabsBar` + 0 burbujas). Gate anti-burbuja `base.ts` activo (pageerror/console-error/api-4xx/Next-overlay) en todo el recorrido.
- **Writes:** N/A — thin nav-skeleton, cero lógica de negocio / cero mutación. El "efecto observable" es el render del empty-state correcto por hoja + console limpia, no una fila en DB.

## Anti-burbuja flaky (documentado · NO bloquea)

Cold run (servidor recién levantado): `sara/proximamente` lanzó pageerror `SyntaxError: Invalid or unexpected token` en el 1er intento → passed on retry (**1 flaky / 32 passed, exit 0**). Caracterizado:
- **Warm re-run:** full nav-walk **33 passed / 0 flaky**. `sara/proximamente` aislado **x5 = 7 passed / 0 flaky**.
- **Causa:** `next dev` first-compile chunk-load race (chunk JS parcialmente emitido servido antes de terminar HMR) — artefacto de dev-mode, **prod-immune** (`next build` sirve chunks pre-compilados). auditor-frontend confirmó **0 causa en código de producto** (`SubTabContent` = data estática → `EmptyState`; sin `eval`/`new Function`/`import()` dinámico/`dangerouslySetInnerHTML`).
- **Disposición:** WARN dev-artifact, no bug de la story. Recomendación harness (no bloqueante): warmup del webServer o retry config para el gate anti-burbuja contra `next dev` cold-start.

## Verdict

**Todos los scenarios PASS · 0 MISSING · 0 FAIL.** → continuar a CHECKPOINTS.md / APPROVED.
