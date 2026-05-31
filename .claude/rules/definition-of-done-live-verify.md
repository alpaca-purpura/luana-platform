# Definition of Done — Live Verification contra dev-app

**Origen:** sesión 2026-05-31 — Chris fijó que la verificación live contra `dev-app.{brand}lat.com` (Clerk real + usuarios de prueba) debe ser parte ESTABLE del proceso de todos los skills, no algo que falla a cada rato. **Cement-date:** 2026-05-31. **Critical Rule #37.** **Scope actual:** vitalia (otras marcas heredan cuando tengan su dev-app — `promotable: candidate`). **Complementa:** `vitalia/docs/architecture/ADR-vitalia-008-dev-app-live-verification-gate.md` (el GATE) + `.claude/rules/test-design-doctrine.md` § Verificación REAL (la doctrina).

## Por qué existe (la división de responsabilidades)

- **ADR-vitalia-008 = el GATE** (`reviewing → done` exige `dev_app_verified.evidence`). Dice *qué* hay que demostrar.
- **`test-design-doctrine.md` = la DOCTRINA** ("verificación real ≠ HTTP 200"). Dice *qué cuenta* como verificar.
- **Esta regla = el CÓMO operativo.** Dice *con qué infra y con qué herramienta* cada skill produce esa evidencia, de forma que NO falle. Mata el "no pude levantar dev-app / no me dejó Clerk / corrí contra localhost mockeado".

## Regla cardinal

Cuando un skill necesita **confirmar comportamiento real** de una superficie que un usuario alcanza (página FE, endpoint que la UI llama, flujo agéntico), lo hace **contra `dev-app.{brand}lat.com`** — el stack dev real expuesto por Cloudflare Tunnel, con Clerk real y usuario de prueba — **ejerciendo la acción real (sobre todo writes) y observando el efecto** (fila en DB / cambio de estado / log). NUNCA se declara "funciona" por un GET 200, ni por una suite e2e que mockea el backend.

## Infra (ya provista — no hay que inventarla)

| Pieza | Valor | Nota |
|---|---|---|
| URL | `https://dev-app.vitalialat.com` | Cloudflare Tunnel locally-managed → FE :3002 (`/api/*` → BE :8002) |
| Levantar | `make dev-app-vitalia` | stack + tunnel + verifica + imprime URL/creds. **Idempotente.** |
| Usuario de prueba | `dr.demo@vitalialat.com` | owner tenant Sanaré (role=owner + clinicId + tenant_id en `public_metadata`) |
| Password / token | `DEV_APP_TEST_PASSWORD` + `CLERK_TESTING_TOKEN_VITALIA` | en `vitalia/.env.dev` (**gitignored**) |
| Clerk origins | `dev-app.vitalialat.com` + `localhost:3002` | ya seteados en la instancia (`allowed_origins`) |

**Un solo comando para empezar:** `make dev-app-vitalia`. Si imprime `✅ dev-app LISTO`, ya puedes verificar.

### ⚠️ Footgun cross-worktree (leer una vez)

El compose usa project compartido `luana-dev`. El container `cloudflared` + FE/BE bind-montan el código del **worktree desde el que se corrió `up` por última vez**. Si construís en `~/Proyectos/luana-vitalia` pero el stack se levantó desde `~/Proyectos/luana-platform`, **dev-app puede estar sirviendo el código del otro worktree.** Regla: corré `make dev-app-vitalia` **desde el worktree donde estás construyendo** antes de verificar. El script avisa si detecta mismatch.

## Las dos herramientas (se usan AMBAS, según el momento)

| Herramienta | Cuándo | Para qué |
|---|---|---|
| **Chrome DevTools MCP** (skill `chrome-devtools-verify`) | Verificación **live / conversacional** durante build, audit, o revisión visual | Abrir dev-app, login con usuario de prueba, **ejercer la acción real**, leer console + network + inspeccionar DOM. Es el fit natural para "ejercí el PUT y observé el efecto". |
| **Playwright autenticado** (skill `playwright-expert`) | El **golden persistido / regression** que queda en la suite | `setupClerkTestingToken` + storageState contra `dev-app`. Repetible en CI. Es el artefacto que prueba que sigue funcionando mañana. |

**Live primero (Chrome MCP) para confirmar que funciona de verdad; golden después (Playwright) para que no se rompa en silencio.**

## Obligación por skill (quién verifica qué)

| Skill | Obligación live-verify |
|---|---|
| **`/dev-team`** (builder-*) | **Auto-verificación obligatoria** antes de cerrar `developing → developed`: por cada scenario que toca una superficie user-reachable, ejercer la acción real en dev-app (Chrome MCP) + dejar el golden Playwright. Registrar en `dev_app_verified.evidence` del `checkpoint.md`. NO cerrar por "tests verdes" si los tests mockean el backend. |
| **`/auditor`** | Si aplica **Carril A self-fix** sobre una superficie user-reachable → **re-verificar live** que el fix funciona en dev-app antes de marcar audit-passed. Phase D (gherkin-matrix) puede señalar evidencia faltante/insuficiente. |
| **`/architect`** | **Opcional pero recomendado**: si necesita confirmar un comportamiento actual antes de diseñar (ej. ¿el endpoint X ya existe y responde qué?), inspecciona en vivo contra dev-app en vez de asumir. Declara el `playwright_visual_scope` en `04-validators.yaml` apuntando a dev-app. |
| **`/po`, `/po-ux`** | Cuando quieren **revisar visualmente algo que ya corre** (estado actual de una pantalla, un flujo) para refinar/diseñar sobre lo real → abrir dev-app con Chrome MCP. NO es gate de refinement, es herramienta de inspección. |
| **`/pm-vitalia`** | Owner del **gate** (ADR-008): en `merge` hace REFUSE si `dev_app_verified.required: true` y `evidence` vacío/insuficiente. No verifica él mismo; exige la evidencia producida por dev-team/auditor. |

## Qué cuenta como evidencia (reusa ADR-vitalia-008)

- ✅ La **acción real del usuario ejercida** (POST/PATCH/PUT/DELETE) autenticada con el usuario de prueba **+ el efecto observado** (fila DB / estado / log relevante). 1-3 líneas honestas.
- ❌ "GET /ruta → 200" sobre un placeholder. ❌ e2e verde que mockea el backend. ❌ `evidence` de una palabra ("ok").

## Si algo falla, NO se abandona — se diagnostica (mandato Chris)

| Síntoma | Primer chequeo |
|---|---|
| dev-app no responde | `docker logs luana-dev-vitalia_cloudflared_dev-1 --tail 30` · re-correr `make dev-app-vitalia` |
| Clerk rechaza login / bot | confirmar `allowed_origins` incluye dev-app · usar `CLERK_TESTING_TOKEN_VITALIA` · `setupClerkTestingToken` |
| sirve código viejo | footgun cross-worktree → re-`up` desde tu worktree |
| falta credencial tunnel | copiar `vitalia/deploy/cloudflared/.credentials/dev-tunnel.json` de otro worktree, o `setup-tunnel.sh` |

Runbook completo: `vitalia/docs/domains/dev-app/live-verification.md`.

## Anti-patterns prohibidos

- ❌ Declarar un scenario verificado por GET 200 / suite mockeada (viola la doctrina y el gate)
- ❌ Verificar contra `localhost:3002` directo cuando la superficie depende de Clerk real (el sign-in redirect rompe el flujo — usar dev-app)
- ❌ Builder cierra `developed` sin `dev_app_verified.evidence` en superficie user-reachable
- ❌ Responder "no pude levantar dev-app / no me dejó Clerk" sin correr `make dev-app-vitalia` y leer logs (la infra ya está provista)
- ❌ Verificar desde un worktree distinto al que tiene tu código sin chequear el footgun

## Referencias

- `vitalia/docs/architecture/ADR-vitalia-008-dev-app-live-verification-gate.md` — el GATE (`reviewing → done`)
- `vitalia/docs/domains/dev-app/live-verification.md` — runbook operativo (cómo levantar + verificar paso a paso)
- `.claude/rules/test-design-doctrine.md` § Verificación REAL — la doctrina
- `scripts/dev-app-up.sh` + `make dev-app-vitalia` — el comando único
- `.claude/skills/chrome-devtools-verify/SKILL.md` — verificación live
- `.claude/skills/playwright-expert/SKILL.md` + `clerk-testing` — golden persistido
- `MEMORY.md` → `dod-live-verify` · `verification-real-not-200`
