# Definition of Done — Live Verification contra dev-app (ninguna story es `done` sin que Claude la ejerza en el stack real)

**Origen:** sesión 2026-05-31 — dos detonantes convergentes: (a) Chris detectó que `nicolify-r0-shell` fue marcada `done` aunque su propio `07-merge.md` admitía que la verificación live NUNCA ocurrió (44/44 e2e contra `next build`, no el stack interactivo); (b) Chris fijó que la verificación live contra `dev-app.{brand}lat.com` (Clerk real + usuarios de prueba) debe ser parte ESTABLE del proceso de todos los skills, no algo que falla a cada rato. Chris: *"jamás me digas que algo está done sin que tú lo hayas verificado en nuestro ambiente de desarrollo."* **Cement-date:** 2026-05-31. **Critical Rule #37.** **Aplica a:** TODAS las brands (vitalia, nicolify, comunify, lupulo + futuras) — una sola DoD cross-brand; cada marca usa su propio `dev-app` (vitalia es la referencia completamente provista; las demás heredan el patrón — `promotable: candidate`). **Complementa:** `test-design-doctrine.md § Verificación REAL ≠ HTTP 200` (la doctrina) + `story-closure-gate.md` (Fase F merge) + `vitalia/docs/architecture/ADR-vitalia-008-dev-app-live-verification-gate.md` (el GATE concreto en vitalia).

## Por qué existe (la división de responsabilidades)

- **El GATE** (`reviewing → done` exige evidencia de verificación live). Dice *qué* hay que demostrar. En vitalia se concreta como ADR-vitalia-008 (`dev_app_verified.evidence`); en las demás marcas el gate es la misma regla aplicada con su `dev-app`.
- **`test-design-doctrine.md` = la DOCTRINA** ("verificación real ≠ HTTP 200"). Dice *qué cuenta* como verificar.
- **Esta regla = el CÓMO operativo.** Dice *con qué infra y con qué herramienta* cada skill produce esa evidencia, de forma que NO falle. Mata el "no pude levantar dev-app / no me dejó Clerk / corrí contra localhost mockeado".

## Regla cardinal

Ninguna story con UI o endpoint alcanza `state: done` hasta que **Claude la haya ejercido contra el stack de desarrollo real de la marca, leído los logs, y confirmado el efecto** — y lo haya **registrado** con evidencia. Cuando un skill necesita confirmar comportamiento real de una superficie que un usuario alcanza (página FE, endpoint que la UI llama, flujo agéntico), lo hace **contra `dev-app.{brand}lat.com`** — el stack dev real expuesto por Cloudflare Tunnel, con Clerk real y usuario de prueba — **ejerciendo la acción real (sobre todo writes) y observando el efecto** (fila en DB / cambio de estado / log). Claude **NUNCA declara `done` / "funciona" / "verificado" / "shipped"** por suite verde, build OK, o `GET 200`.

> El verde de los gates (tsc/eslint/vitest/pytest/playwright) es **necesario pero nunca suficiente**. La DoD se cierra **ejerciendo la acción real del usuario en la app corriendo**.

## Infra por brand (el entorno dev = cloudflared tunnel → stack local, NO servidor cloud)

El entorno canónico de live-verify es **`dev-app.{brand}lat.com`** = **cloudflared tunnel locally-managed → el stack local `localhost:300X`** (el deploy sigue deferred per `github-actions-deferred.md`; el túnel solo expone el stack que ya corre en tu máquina).

| Brand | dev-app | Levantar | localhost (FE/BE) | Backend logs | Estado |
|---|---|---|---|---|---|
| **vitalia** | `dev-app.vitalialat.com` | `make dev-app-vitalia` (idempotente · `scripts/dev-app-up.sh`) | `:3002` / `:8002` (`/api/*`→BE) | `docker logs luana-dev-vitalia_backend_dev-1` | ✅ provisto + probado live |
| **nicolify** | `dev-app.nicolify.com` | `make dev-nicolify` + `make dev-nicolify-tunnel` | `:3001` / `:8001` | `docker logs luana-dev-nicolify_backend_dev-1` | ⚠️ tunnel ID real en `dev-config.yml` (`be33b8dd-5218-46d2-b8b5-1ee65f2dee8e`); falta solo `nicolify/deploy/cloudflared/.credentials/dev-tunnel.json` (keys de Chris) |
| comunify | `dev-app.comunify.com` | `make dev-comunify` + `make dev-comunify-tunnel` | `:3003` / `:8003` | `docker logs luana-dev-comunify_backend_dev-1` | ⚠️ verificar |
| lupulo | `dev-app.lupulo.com` | `make dev-lupulo` + `make dev-lupulo-tunnel` | `:3004` / `:8004` | `docker logs luana-dev-lupulo_backend_dev-1` | ⚠️ verificar |

**Vitalia (referencia completamente provista — todo probado live 2026-05-31):**

| Pieza | Valor | Nota |
|---|---|---|
| URL | `https://dev-app.vitalialat.com` | Cloudflare Tunnel → FE :3002 (`/api/*` → BE :8002) |
| Levantar | `make dev-app-vitalia` | stack + tunnel + verifica + imprime URL/creds. **Idempotente.** |
| Usuario de prueba | `dr.demo@vitalialat.com` | owner tenant Sanaré (role=owner + clinicId + tenant_id en `public_metadata`) |
| Password / token | `DEV_APP_TEST_PASSWORD` + `CLERK_TESTING_TOKEN_VITALIA` | en `vitalia/.env.dev` (**gitignored**) |
| Clerk origins | `dev-app.vitalialat.com` + `localhost:3002` | ya seteados en la instancia (`allowed_origins`) |

> **Provisión del túnel por brand (one-time):** `scripts/cloudflared-setup.sh {brand}` (login Cloudflare interactivo + crea tunnel + DNS CNAME + `deploy/cloudflared/.credentials/dev-tunnel.json` gitignored + resuelve `<TUNNEL_ID>` en `dev-config.yml`). Requiere auth de Chris (no automatizable headless). **Nicolify:** el tunnel ID ya está resuelto en `dev-config.yml` (`be33b8dd-5218-46d2-b8b5-1ee65f2dee8e`, hostname `dev-app.nicolify.com`) — solo falta dejar el `dev-tunnel.json` en `nicolify/deploy/cloudflared/.credentials/` (montado a `/etc/cloudflared/dev-tunnel.json`).
>
> **Fallback localhost:** mientras el túnel de una brand no esté provisto, la live-verify se hace contra `localhost:300X` directo (mismo Chrome DevTools MCP / Playwright autenticado, misma acción real, mismos logs) — es verificación válida; lo único que falta es el dominio público + JWT Clerk del dominio real. Documentar en la evidencia que se verificó en localhost (no en dev-app) cuando aplique.

### ⚠️ Footgun cross-worktree (leer una vez)

El compose usa project compartido `luana-dev`. El container `cloudflared` + FE/BE bind-montan el código del **worktree desde el que se corrió `up` por última vez**. Si construís en `~/Proyectos/luana-vitalia` pero el stack se levantó desde `~/Proyectos/luana-platform`, **dev-app puede estar sirviendo el código del otro worktree.** Regla: corré `make dev-app-{brand}` **desde el worktree donde estás construyendo** antes de verificar.

## Las dos herramientas (se usan AMBAS, según el momento)

| Herramienta | Cuándo | Para qué |
|---|---|---|
| **Chrome DevTools MCP** (skill `chrome-devtools-verify`) | Verificación **live / conversacional** durante build, audit, o revisión visual | Abrir dev-app, login con usuario de prueba, **ejercer la acción real**, leer console + network + inspeccionar DOM. Fit natural para "ejercí el PUT y observé el efecto". |
| **Playwright autenticado** (skill `playwright-expert`) | El **golden persistido / regression** que queda en la suite | `setupClerkTestingToken` + storageState contra `dev-app` (o localhost). Repetible en CI. Es el artefacto que prueba que sigue funcionando mañana. |

**Live primero (Chrome MCP) para confirmar que funciona de verdad; golden después (Playwright) para que no se rompa en silencio.**

## El bar de "verificado" (mínimo honesto · de test-design-doctrine)

| Naturaleza | "Verificado live" significa |
|---|---|
| **UI / flujo usuario** | Ejercer la acción real (crear/editar/**guardar**/eliminar/navegar) en la app corriendo → resultado esperado visible (toast OK, fila aparece, valor persiste al recargar) + **logs del backend sin 4xx/5xx inesperado** + (si escribe) efecto en DB confirmado. Un `GET 200` o un render de placeholder NO basta. |
| **BE endpoint** | Ejercer el método/payload reales incluido el **write** (POST/PATCH/PUT/DELETE), no solo el GET. Status correcto + **leer logs** (sin traceback) + assert del efecto. Un 405/500 al lado en el mismo flujo = NO verificado. |
| **Migración / schema** | Aplicar contra DB real + confirmar tabla/columna existe + el endpoint que la usa responde OK ejercido de verdad. |
| **Agentic** | Correr el turno/tool real + leer trazas (`copilot_trace_event`) + eval goldens. "El endpoint respondió" NO basta. |

**Trampa estrella prohibida:** declarar algo verificado porque un GET dio 200 (caso lisa-marca: suite mockeaba el backend → falso verde → 3 bugs a "LIVE"). Una e2e que **mockea el backend del surface bajo prueba** NO cuenta como live-verify.

## Obligación por skill (quién verifica qué)

| Skill | Obligación live-verify |
|---|---|
| **`/dev-team`** (builder-*) | **Auto-verificación obligatoria** antes de cerrar `developing → developed`: por cada scenario que toca una superficie user-reachable, ejercer la acción real en dev-app (Chrome MCP) + dejar el golden Playwright. Registrar evidencia en `checkpoint.md`. NO cerrar por "tests verdes" si los tests mockean el backend. |
| **`/auditor`** | Phase D: además de la gherkin-matrix, **ejerce los scenarios críticos live** o exige la evidencia. Si aplica Carril A self-fix sobre superficie user-reachable → re-verificar live antes de audit-passed. Sin evidencia live → CHANGES_REQUESTED. |
| **`/architect`** | **Opcional pero recomendado**: si necesita confirmar comportamiento actual antes de diseñar, inspecciona en vivo contra dev-app en vez de asumir. Declara el `playwright_visual_scope` en `04-validators.yaml` apuntando a dev-app. |
| **`/po`, `/po-ux`** | Cuando quieren revisar visualmente algo que ya corre para refinar/diseñar sobre lo real → abrir dev-app con Chrome MCP. Herramienta de inspección, no gate. |
| **`/pm-{brand}`** | Owner del **gate**: en `merge` hace REFUSE si la evidencia live falta o es insuficiente. No verifica él mismo; exige la evidencia producida por dev-team/auditor. |

## Registro obligatorio (evidencia, no palabra)

La verificación live se **registra** o no ocurrió. En `07-merge.md § Verificación live` (y `checkpoint.md` de la story). En vitalia el campo canónico es `dev_app_verified` (ADR-vitalia-008); el schema genérico cross-brand:

```yaml
dod_live_verified: true
dod_env: "make dev-app-vitalia → dev-app.vitalialat.com (Chrome DevTools MCP)"   # o "make dev-nicolify → localhost:3001"
dod_evidence:
  - action: "PATCH personality voz/arquetipo + guardar (autenticado dr.demo@vitalialat.com)"
    observed: "toast OK + badge 'guardado', valor persiste al recargar"
    backend_log: "PATCH /personality 200 · DB personality_profiles.updated_at actualizado · sin traceback"
verified_at: 2026-05-31
```

Sin `dod_live_verified: true` + `dod_evidence` (writes ejercidos + efecto observado), la story **NO** pasa a `done`.

## Cuándo NO aplica

- Tickets de **config / docs / tooling puro** (sin UI ni endpoint ejecutable) — igual corren lint/format. En vitalia: `required: false` + `dev_app_verified_skip_reason`.
- Refactor / infra / migración-only / test-only sin cambio de comportamiento observable — los tests existentes pasan antes y después.

## Gate en el ciclo de vida (dónde se enforce)

| Fase | Owner | Qué hace |
|---|---|---|
| `developed → reviewing` | `/auditor` | Phase D: ejerce los scenarios críticos live (Chrome DevTools MCP) o exige la evidencia. Sin evidencia live → CHANGES_REQUESTED (no APPROVED). |
| `reviewing → done` | `/pm-{brand}` | Fase F: **REFUSE merge→done** si `dod_live_verified != true` o falta `dod_evidence`. El checkpoint NO se escribe `state: done`. |

## Si algo falla, NO se abandona — se diagnostica (mandato Chris)

| Síntoma | Primer chequeo |
|---|---|
| dev-app no responde | `docker logs luana-dev-{brand}_cloudflared_dev-1 --tail 30` · re-correr `make dev-app-{brand}` |
| Clerk rechaza login / bot | confirmar `allowed_origins` incluye dev-app · usar `CLERK_TESTING_TOKEN_{BRAND}` · `setupClerkTestingToken` |
| sirve código viejo | footgun cross-worktree → re-`up` desde tu worktree |
| falta credencial tunnel | copiar `{brand}/deploy/cloudflared/.credentials/dev-tunnel.json`, o `scripts/cloudflared-setup.sh {brand}` |

Runbook completo (vitalia): `vitalia/docs/domains/dev-app/live-verification.md`.

## Anti-patterns prohibidos

- ❌ Declarar `done` / "funciona" / "shipped" con suite verde pero sin ejercer la acción real en el stack corriendo
- ❌ "Verificado" porque un GET dio 200 (sin ejercer el write ni leer logs)
- ❌ e2e que mockea el backend presentada como live-verify (falso verde)
- ❌ Correr e2e contra `next build`/standalone y llamarlo "verificación live" (no es el stack interactivo que usa el usuario)
- ❌ `07-merge.md` con `state: done` y un box de DoD live **sin tildar** (auto-contradicción — caso origen nicolify-r0-shell)
- ❌ `/pm-{brand}` mergeando a `done` sin `dod_live_verified: true` + `dod_evidence`
- ❌ Responder "no pude levantar dev-app / no me dejó Clerk" sin correr `make dev-app-{brand}` y leer logs (la infra ya está provista para vitalia)
- ❌ Verificar desde un worktree distinto al que tiene tu código sin chequear el footgun

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | Pointer en root `CLAUDE.md` § Critical Rules #37 (auto-load cada sesión) | ✅ 2026-05-31 |
| 2 | `/auditor` Phase D ejerce/exige live verify (Chrome DevTools MCP) antes de APPROVED | ⏳ auditor SKILL update |
| 3 | `/pm-{brand}` Fase F REFUSE merge→done sin `dod_live_verified: true` + evidencia | ✅ vitalia (ADR-008) · ⏳ resto |
| 4 | `07-merge-template.md` incluye sección `§ Verificación live` obligatoria con `dod_evidence` | ⏳ template update |
| 5 | `chrome-devtools-verify` + `playwright-expert` skills = mecanismo canónico de live-verify | ✅ existe |
| 6 | Pre-commit: bloquea checkpoint con `state: done` si `dod_live_verified: false` presente | ⏳ hook TBD |

## Referencias

- `vitalia/docs/architecture/ADR-vitalia-008-dev-app-live-verification-gate.md` — el GATE concreto (`reviewing → done`) en vitalia
- `vitalia/docs/domains/dev-app/live-verification.md` — runbook operativo (cómo levantar + verificar paso a paso)
- `.claude/rules/test-design-doctrine.md § Verificación REAL ≠ HTTP 200` — la doctrina + el bar honesto
- `.claude/rules/story-closure-gate.md § Fase F` — merge→done (este gate se inserta ahí)
- `scripts/dev-app-up.sh` + `make dev-app-vitalia` — el comando único (vitalia)
- `.claude/skills/chrome-devtools-verify/SKILL.md` — verificación live conversacional
- `.claude/skills/playwright-expert/SKILL.md` + `clerk-testing` — golden persistido
- `vitalia/docs/learnings/cobertura-tests-vs-realidad-2026-05-29.md` — caso lisa-marca (origen del bar, brand vitalia)
- caso origen nicolify: `nicolify/docs/archive/2026/stories/nicolify-r0-shell/` (reabierta 2026-05-31)
- `MEMORY.md` → `dod-live-verify` · `verification-real-not-200`

<!-- voseo-allowed: doc interno de proceso, no user-facing -->
