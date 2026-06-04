# DoD Gate #37 — FE-UI Live Evidence
# nicolify-r1-abel-icp-buyer

**Fecha:** 2026-06-04
**Ejecutado por:** builder-frontend (CLI)
**Stack:** `make dev-nicolify` running — BE :8001 (health 200) · FE :3001 (307 auth)
**Método:** Playwright autenticado (`storageState` fresco generado por `setup` project)
**Rama:** `wip/nicolify`

---

## Preflight

```
e2e-preflight.sh resultado:
  ✓ frontend responde (HTTP 307)
  ✓ backend /health responde (HTTP 200)
  ⚠ CLERK_TESTING_TOKEN_NICOLIFY ausente → soft warning (bot-detection; no bloquea con storageState)
  ✓ storageState Clerk presente
  ✓ playwright.config.ts presente
  → READY (con warnings soft)

setup project: 2 passed (18.5s) — storageState freshly generated
```

---

## Smoke Suite — `--project=smoke --grep "abel-icp"`

**6 tests ejecutados** (2 setup + 4 smoke)

| Test | Estado | Nota |
|---|---|---|
| SC-empty: ruta abel/icp es reachable y shell carga sin errores | **PASS** | shell-ready visible, body no vacío, 0 next-overlay |
| SC-empty: tenant sin ICPs → DraftFirstStarter con 2 CTAs | **FAIL** | POM locator mismatch (ver §Findings) |
| SC-empty: subtab-content testid presente para abel/icp | **PASS** | `data-testid^='subtab-content-abel-icp'` visible |
| SC-network: ruta abel/icp no tiene burbuja de Next en cold start | **PASS** | shell-ready, 0 next-overlay |

**Resultado smoke:** 5 pass (2 setup + 3 abel-icp) · 1 fail

---

## Regression Suite — `--project=regression --grep "abel-icp"`

**29 tests** (2 setup + 27 regression)

| Grupo | Test | Estado |
|---|---|---|
| SC-empty | DraftFirstStarter visible con dos caminos | **PASS** | 
| SC-happy | UniversalIntakeModal abre desde DraftFirstStarter | **PASS** (empty state visible → intake opens check) |
| SC-happy | ProposalBanner visible en ICP borrador | **SKIP** (LLM-pending — falta `E2E_DRAFT_ICP_ID`) |
| SC-happy | IcpMasterList card clicable navega al detalle | **SKIP** (falta `E2E_ICP_ID`) |
| SC-happy | IcpDatosForm editar campo → autosave → persiste | **SKIP** (falta `E2E_ICP_ID`) |
| SC-negative | mark-ready sin buyer → missing[] inline | **SKIP** (falta `E2E_ICP_INCOMPLETE_ID`) |
| SC-adversarial-tenant | ICP de otro tenant → 404 | **FAIL** (ver §Findings — BUG REAL) |
| SC-network | intake con URL fake → sin next-overlay | **PASS** |
| SC-a11y | EntitySubNavBar role=tablist | **SKIP** (falta `E2E_ICP_ID`) |
| SC-a11y | roving tabindex flechas navegan | **SKIP** (falta `E2E_ICP_WITH_BUYER_ID`) |
| SC-a11y | directory mode aria-disabled | **SKIP** (falta `E2E_ICP_ID`) |
| SC-i18n | copy visible no tiene voseo | **PASS** — 0 patrones voseo en DOM |
| SC-i18n | avg_ticket moneda del tenant | **SKIP** (falta `E2E_ICP_ID`) |
| SC-happy-buyer | buyer leaf → BuyerLeafForm | **SKIP** (falta `E2E_ICP_WITH_BUYER_ID + E2E_BUYER_ID`) |
| SC-add-buyer | EntitySubNavBar affordance '+ buyer' | **SKIP** (falta `E2E_ICP_ID`) |
| SC-edge-primary | buyer primary botón visible | **SKIP** (falta `E2E_ICP_WITH_BUYER_ID + E2E_BUYER_ID`) |
| SC-large | referenciado — FE unit coverage | **PASS** (placeholder test) |
| SC-edge-concurrent / SC-race-unique / SC-concurrent | cubiertos en BE | **PASS** (placeholder test) |
| SC-adversarial-injection / SC-edge-thin-seed | cubiertos en agentic | **PASS** (placeholder test) |

**Resultado regression:** 9 pass · 19 skip (falta env vars live seed) · 1 fail (bug real)

---

## Anti-Burbuja Gate (base.ts)

Para los tests que corrieron sin SKIP:

| Gate | Resultado |
|---|---|
| `pageerror` (JS exceptions / burbuja Next) | **CLEAN — 0 caught** |
| `console.error` no-allowlisted | **CLEAN — 0 caught** |
| Hydration errors React/SSR | **CLEAN — 0 caught** |
| `/api/` 4xx/5xx que UI traga | **CLEAN — 0 caught** |
| `[data-nextjs-dialog]` overlay en DOM | **CLEAN — 0 found** |

**ANTIBUBBLE = CLEAN** — ningún test que pasó disparó el gate anti-burbuja.

---

## Visual Baselines (4 vistas × 2 themes)

Intento de captura con `E2E_VISUAL_ENABLED=1 --update-snapshots`:

| Vista | Light | Dark | Estado |
|---|---|---|---|
| arranque (DraftFirstStarter) | ❌ no capturado | ❌ no capturado | POM strict-mode violation (ver §Findings F-2) |
| lista (IcpMasterList) | ❌ no capturado | ❌ no capturado | POM strict-mode violation (ver §Findings F-2) |
| detalle (EntitySubNavBar+DatosForm) | ⏭ skipped | ⏭ skipped | Falta `E2E_ICP_ID` (requiere seed vivo) |
| propuesta (ProposalBanner) | ⏭ skipped | ⏭ skipped | Falta `E2E_DRAFT_ICP_ID` (requiere seed vivo) |

**BASELINES = 0 captured**

Los baselines `arranque` y `lista` fallaron por el bug F-2 (POM), no por problema de producto.
Los baselines `detalle` y `propuesta` requieren datos seeded (`E2E_ICP_ID`, `E2E_DRAFT_ICP_ID`).

---

## LLM-Pending Note

El flujo `extract→borrador→done` (happy path SC-happy completo) requiere un proveedor LLM configurado en dev. En el stack actual dev, `POST /api/v1/abel/icp/extract` retorna:
- job creado → status `analizando` → job falla con `Connection error` → `status: failed` (graceful)
- **0 traceback / 0 500** — la resiliencia funciona.

Tests afectados que quedan como DEFERRED-TO-DEMO: `SC-happy: ProposalBanner`, `SC-happy: IcpDatosForm autosave`. Nota en cada test con `test.skip()`.

---

## Findings (hallazgos)

### F-1 — BUG REAL: Ruta ICP UUID inválido → shell cargando indefinidamente

**Severidad:** WARN (UX degradada, no crash)
**Spec:** `SC-adversarial-tenant — ICP de otro tenant → 404`
**Ruta ejercida:** `/{tenantId}/abel/icp/00000000-dead-beef-cafe-000000000000/datos`
**Observado:** La página muestra `main aria-label="Cargando shell"` indefinidamente. El shell nunca llega a `data-shell-ready='true'` ni muestra una página 404. La URL no cambia a `/404`.
**Anti-burbuja:** 0 JS exceptions, 0 next-overlay → el spinner cuelga silencioso.
**Esperado (RN-1):** Navegar a UUID no-existente → 404 limpio (sin revelar existencia), no spinner eterno.
**No fijado:** Reportado per instrucciones — el orchestrador decide si abre bugfix story.
**Root cause probable:** `IcpEntityLayoutClient` hace fetch al BE (404 correcto desde BE), pero el componente no maneja el 404 → se queda en estado loading sin transicionar a error/notFound.

### F-2 — SPEC/POM: `data-testid="icp-master-empty"` duplicado en DOM

**Severidad:** INFO (afecta spec, no producto)
**Origen:** Strict-mode violation — `getByTestId('icp-master-empty')` resuelve a 2 elementos.
**Error:** `locator.waitFor: strict mode violation: getByTestId('icp-master-empty') resolved to 2 elements`
**Causa:** El `data-testid="icp-master-empty"` aparece dos veces en el DOM. Esto puede estar relacionado con el bug pre-existente R0 `AppPanelSlot 2×` (observado en `observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md`) — el slot del panel de aplicación se monta dos veces, duplicando el testid del contenedor.
**Afecta:** `AbelIcpMasterPage.waitForStableState()` — el `Promise.race` de los 3 locators lanza strict-mode error en vez de resolver.
**Impacto producto:** El usuario ve la UI correctamente (DraftFirstStarter renderiza). El duplicado es un DOM artifact del bug R0 shell.
**Tests afectados:** smoke "SC-empty: tenant sin ICPs → DraftFirstStarter con 2 CTAs" + visuales "arranque" + visuales "lista".
**No fijado:** Bug pre-existente R0 fuera de scope de esta story.

### F-3 — ENV LIMITACIÓN: 19 tests SKIPPED por falta de seed vivo

**Tipo:** ENV limitation, no bug de producto
**Descripción:** 19 tests en la suite regression están anotados como `DEFERRED-TO-DEMO` y requieren env vars (`E2E_ICP_ID`, `E2E_DRAFT_ICP_ID`, `E2E_ICP_WITH_BUYER_ID`, `E2E_BUYER_ID`, `E2E_ICP_INCOMPLETE_ID`) que apunten a ICPs/buyers reales creados en la DB. En este run, el tenant demo solo tiene el estado empty (0 ICPs), bloqueando los flujos workspace.
**Camino a PASS:** Crear ICPs en la app o hacer seed directo en DB, luego pasar las UUIDs como env vars al correr playwright.

---

## Backend Logs Durante Run

```
docker logs luana-dev-nicolify_backend_dev-1 --since 15m | grep -E "ERROR|Traceback|Exception"
→ (vacío) — 0 errores de backend durante el run completo
```

---

## Observaciones Adicionales

1. **SC-i18n PASS:** la página visible no contiene ninguno de los 8 patrones voseo (`tenés/podés/mirá/dejá/configurá/guardá/agregá/seleccioná`) — copy es tuteo neutro LatAm.

2. **Shell carga correctamente para ruta válida:** `/{tenantId}/abel/icp` llega a `data-shell-ready='true'`, DraftFirstStarter se muestra con 2 CTAs ("Abel te arma un borrador" + "Empezar en blanco"). El flujo vacío funciona.

3. **UniversalIntakeModal:** cuando el estado es `empty`, el botón "Abel te arma un borrador" abre el modal. Test SC-happy confirmó que los 4 tabs (URL/Archivo/Texto/Conectar) están presentes.

4. **0 new-overlay (anti-burbuja):** todos los tests que llegaron al stack real reportaron 0 errores de hidratación y 0 overlay de Next.

---

## Veredicto por scope

| Scope | Estado |
|---|---|
| Routing `/abel/icp` reachable + shell hydrates | **VERIFIED LIVE** ✅ |
| DraftFirstStarter (empty state) + 2 CTAs | **VERIFIED LIVE** ✅ |
| UniversalIntakeModal abre desde DraftFirstStarter | **VERIFIED LIVE** ✅ |
| Copy neutro LatAm (anti-voseo) | **VERIFIED LIVE** ✅ |
| 0 burbuja Next / 0 console errors / 0 hydration errors | **VERIFIED LIVE** ✅ (anti-burbuja CLEAN) |
| SC-adversarial-tenant: UUID inválido → 404 | **BUG REAL** ⚠️ (F-1 — shell cuelga en loading) |
| Visual baselines arranque/lista | **NO CAPTURADO** ❌ (F-2 POM bug pre-existente R0) |
| Visual baselines detalle/propuesta | **DEFERRED** ⏭ (requiere E2E_ICP_ID seed vivo) |
| Workspace tests (ICP seeded) | **DEFERRED** ⏭ (19 tests — requieren E2E_*_ID env vars) |
| extract→borrador happy path (LLM) | **LLM-PENDING** ⏭ (resiliencia fallback PASS) |

---

## dod_live_verified update

```yaml
dod_live_verified: partial
dod_env: "make dev-nicolify → BE :8001 health 200 · FE :3001 · Playwright autenticado storageState fresco"
dod_evidence_fe_ui:
  - { action: "GET /{tenantId}/abel/icp (cold start)", observed: "shell-ready visible · DraftFirstStarter · 2 CTAs · 0 next-overlay · 0 console errors", verdict: PASS }
  - { action: "UniversalIntakeModal open via 'Abel te arma un borrador'", observed: "modal visible · 4 tabs presentes (URL/Archivo/Texto/Conectar)", verdict: PASS }
  - { action: "SC-i18n anti-voseo scan", observed: "0 patrones voseo en DOM (body text)", verdict: PASS }
  - { action: "subtab-content testid present", observed: "data-testid^='subtab-content-abel-icp' visible", verdict: PASS }
  - { action: "SC-adversarial-tenant UUID inválido", observed: "shell queda en 'Cargando shell' indefinido — no 404 (BUG F-1)", verdict: FINDING }
  anti_burbuja: CLEAN
  real_bugs: 1 (F-1 shell infinite loading on invalid UUID)
  spec_pom_issues: 1 (F-2 icp-master-empty duplicado — pre-existing R0 bug)
  visual_baselines: "0/8 — arranque/lista bloqueadas por F-2; detalle/propuesta deferred (seed)"
  workspace_tests: "19/19 SKIP — requieren E2E_*_ID env vars con ICPs/buyers seeded"
  llm_pending: "extract→borrador happy path"
verified_fe_at: 2026-06-04
```
