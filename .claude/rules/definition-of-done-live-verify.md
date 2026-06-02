# Definition of Done — Live Verification contra dev-app (ninguna story es `done` sin que Claude la ejerza en el stack real)

**Origen:** sesión 2026-05-31 — dos detonantes convergentes: (a) Chris detectó que `nicolify-r0-shell` fue marcada `done` aunque su propio `07-merge.md` admitía que la verificación live NUNCA ocurrió (44/44 e2e contra `next build`, no el stack interactivo); (b) Chris fijó que la verificación live contra `dev-app.{brand}lat.com` (Clerk real + usuarios de prueba) debe ser parte ESTABLE del proceso de todos los skills, no algo que falla a cada rato. Chris: *"jamás me digas que algo está done sin que tú lo hayas verificado en nuestro ambiente de desarrollo."* **Cement-date:** 2026-05-31. **Critical Rule #37.** **Aplica a:** TODAS las brands (vitalia, nicolify, comunify, lupulo + futuras) — una sola DoD cross-brand; cada marca usa su propio `dev-app` (vitalia es la referencia más completa — config de túnel provista, credencial pendiente; las demás heredan el patrón — `promotable: candidate`). **Complementa:** `test-design-doctrine.md § Verificación REAL ≠ HTTP 200` (la doctrina) + `story-closure-gate.md` (Fase F merge) + `vitalia/docs/architecture/ADR-vitalia-008-dev-app-live-verification-gate.md` (el GATE concreto en vitalia).

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
| **vitalia** | `dev-app.vitalialat.com` | `make dev-app-vitalia` (idempotente · `scripts/dev-app-up.sh`) | `:3002` / `:8002` (`/api/*`→BE) | `docker logs luana-dev-vitalia_backend_dev-1` | ✅ **tunnel OPERATIVO** (verificado live 2026-06-02: `/`→307 sign-in + `/api/health`→200 vía dev-app.vitalialat.com). Locally-managed (connector docker + credencial gitignored per-worktree) |
| **nicolify** | `dev-app.nicolify.com` | `make dev-nicolify` + `make dev-nicolify-tunnel` | `:3001` / `:8001` | `docker logs luana-dev-nicolify_backend_dev-1` | ✅ **tunnel provisto + connector docker UP** (`be33b8dd…`, credencial en worktree `luana-nicolify`, DNS routed). dev-app responde cuando el stack sirve (hoy skeleton → 000 si FE/BE no levanta) |
| comunify | `dev-app.comunifyagents.com` | `make dev-comunify` + `make dev-comunify-tunnel` | `:3003` / `:8003` | `docker logs luana-dev-comunify_backend_dev-1` | ✅ **tunnel provisto + connector docker UP** (`999f4a24…`, zona `comunifyagents.com`, credencial en worktree `luana-comunify`, DNS routed) |
| lupulo | `dev-app.lupulo.com` | `make dev-lupulo` + `make dev-lupulo-tunnel` | `:3004` / `:8004` | `docker logs luana-dev-lupulo_backend_dev-1` | ⚠️ verificar |

**Vitalia (referencia — túnel OPERATIVO, verificado live 2026-06-02 vía dominio público):**

| Pieza | Valor | Nota |
|---|---|---|
| URL | `https://dev-app.vitalialat.com` | Cloudflare Tunnel → FE :3002 (`/api/*` → BE :8002) |
| Levantar | `make dev-app-vitalia` | stack + tunnel + verifica + imprime URL/creds. **Idempotente.** |
| Usuario de prueba | `dr.demo@vitalialat.com` | owner tenant Sanaré (role=owner + clinicId + tenant_id en `public_metadata`) |
| Password / token | `CLERK_TESTING_TOKEN_VITALIA` + `DEV_APP_TEST_PASSWORD` + `DEV_APP_CHRIS_*` (todos seteados 2026-06-02; password verificado vía Clerk `verify_password`→true) | en `vitalia/.env.dev` (**gitignored**) |
| Clerk origins | `dev-app.vitalialat.com` + `localhost:3002` | ya seteados en la instancia (`allowed_origins`) |

> **Provisión del túnel por brand:** `scripts/cloudflared-setup.sh {brand}` — **NO-INTERACTIVO** (reescrito 2026-06-02): usa un API token de cuenta (cfat_) en `{brand}/deploy/cloudflared/.credentials/cf-api.env` (gitignored, fallback `.env.dev`), sin login browser ni binario cloudflared host. Idempotente + no-destructivo: detecta tunnel existente (reusa) o crea locally-managed con secret + escribe credencial JSON + asegura el CNAME. `--recreate` fuerza recreación (DESTRUCTIVO). **Estado 2026-06-02:** los 3 túneles (vitalia/nicolify/comunify) están provistos + connector docker UP + DNS routed; las credenciales locally-managed viven **per-worktree** (cada marca en su worktree canónico — footgun cross-worktree abajo). El secret de un tunnel existente NO se recupera vía API → copiar el `dev-tunnel.json` del worktree origen o `--recreate`. **lupulo:** placeholder (sin deploy/cloudflared).
>
> **Fallback localhost:** mientras el túnel de una brand no esté provisto, la live-verify se hace contra `localhost:300X` directo (mismo Chrome DevTools MCP / Playwright autenticado, misma acción real, mismos logs) — es verificación válida; lo único que falta es el dominio público + JWT Clerk del dominio real. Documentar en la evidencia que se verificó en localhost (no en dev-app) cuando aplique.

### ⚠️ Footgun cross-worktree (leer una vez)

El compose usa project compartido `luana-dev`. El container `cloudflared` + FE/BE bind-montan el código del **worktree desde el que se corrió `up` por última vez**. Si construís en `~/Proyectos/luana-vitalia` pero el stack se levantó desde `~/Proyectos/luana-platform`, **dev-app puede estar sirviendo el código del otro worktree.** Regla: corré `make dev-app-{brand}` **desde el worktree donde estás construyendo** antes de verificar.

## Política de usuarios + claves de prueba (cross-brand · cement 2026-06-02)

**Compartida por TODAS las marcas** — cada marca tiene sus propios usuarios/roles/tenants, pero la **política de creación + almacenamiento + verificación es única**. Origen: Chris 2026-06-02.

### Creación
- Cada marca corre su **instancia Clerk dev propia** (`pk_test_…`, NUNCA `pk_live_`). Usuarios + roles + tenants son **brand-specific** (vitalia: owner/doctor/recepcion/super_admin sobre Sanaré-MX/Aurora-AR/Mindful-CL; nicolify/comunify/… definen los suyos).
- Sembrar AL MENOS **un usuario de prueba primario** (rol más alto, ej. owner) con `public_metadata` completa que la marca necesite para auth real (mínimo `role` + `tenant_id`; vitalia agrega `clinicId`). Documentar la tabla de usuarios/roles/tenants seeded en `{brand}/docs/architecture/` (pre-flight checklist per brand).
- Naturaleza: creds de **DESARROLLO** (instancia `pk_test_`). OK en `.env.dev` gitignored + en el historial de sesión (ratificado Chris 2026-06-02 — son dev). **NUNCA** prod, **NUNCA** en archivo tracked.

### Almacenamiento (keys canónicas — MISMOS nombres cross-brand, VALORES per-brand)
En `{brand}/.env.dev` (**gitignored** — patrón `*.env.dev` en `.gitignore`):

| Key | Qué |
|---|---|
| `DEV_APP_TEST_EMAIL` / `DEV_APP_TEST_PASSWORD` | usuario de prueba primario que usan `dev-app-up.sh` + Playwright autenticado + Chrome MCP |
| `DEV_APP_CHRIS_EMAIL` / `DEV_APP_CHRIS_PASSWORD` | login propio de Chris — para **cross-check** (lo que ve él vs lo que veo yo en live-verify; cuando difieren, reproduzco su vista exacta) |
| `CLERK_TESTING_TOKEN_{BRAND}` | testing token Clerk (bypass bot-detection en Playwright) |
| `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | keys de la instancia dev de la marca |

(Las API keys del túnel Cloudflare van aparte en `{brand}/deploy/cloudflared/.credentials/cf-api.env`, gitignored — ver § Provisión del túnel.)

### Verificación (verify-real, OBLIGATORIO)
Antes de declarar una credencial "seteada", **confirmarla contra Clerk** — NO asumir (skill `clerk-backend-api` o curl con `CLERK_SECRET_KEY` de `{brand}/.env.dev`):
```
GET  /v1/users?email_address={email}              → existe + public_metadata (role/tenant) correctos
POST /v1/users/{user_id}/verify_password  {"password":"…"}  → "verified": true
```
Documentar en `dod_evidence` que la auth se ejerció con un usuario real verificado.

### Prohibido
- ❌ Creds test en archivo tracked (solo `.env.dev` gitignored).
- ❌ Instancia `pk_live_` (prod) para live-verify.
- ❌ Declarar `DEV_APP_TEST_PASSWORD` seteado sin `verify_password`→true.
- ❌ Nombres de key distintos por marca (los NOMBRES son cross-brand; los VALORES son per-brand).

### Estado del arming por marca (2026-06-02)

| Marca | Test user | Chris cross-check | Estado | Nota |
|---|---|---|---|---|
| **vitalia** | `dr.demo@vitalialat.com` (role owner) | `hola@alpacapurpura.lat` | ✅ **full** | ambos `verify_password`→true; metadata real (role+clinicId+tenant_id); dev-app live (307+/api/health 200) |
| **nicolify** | `owner.demo@nicolify.com` (role owner) | `hola@alpacapurpura.lat` | ✅ **full** | password seteado vía API + verified; metadata real (role+tenant_id `7f464ab7…`); creds en `luana-nicolify/.env.dev` |
| **comunify** | `owner.demo@comunifyagents.com` (role owner) | `hola@alpacapurpura.lat` | 🟡 **Clerk-level** | usuarios creados + passwords verified; **tenant binding PENDIENTE** (comunify_dev sin tabla `tenants` seedeada → correr seed comunify + setear `public_metadata.tenant_id`). Login Clerk OK; tenant resolution incompleta hasta el seed |
| lupulo | — | — | ⬜ placeholder | sin bootstrap |

`CLERK_TESTING_TOKEN_{BRAND}` (Playwright bot-bypass): presente en vitalia; nicolify/comunify lo mintean en runtime vía `@clerk/testing` con el `CLERK_SECRET_KEY` (no requiere setearlo a mano). El password-login (Chrome MCP + Playwright) funciona sin él.

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

## DoD endurecida (cement 2026-06-01) — verificación por naturaleza + anti-burbuja + demo manual

> **Origen:** Chris detectó el patrón recurrente *"digo listo, entrás y hay una burbuja de error de Next"*. **Causa raíz:** `GET 200` mide SOLO el servidor; la burbuja vive en el **cliente DESPUÉS de la hidratación** (60-80% de la experiencia). Research 2026 (Checkly, alexop.dev, Fowler, Cucumber/Example-Mapping, Katalon) → este modelo. Decisiones ratificadas por Chris 2026-06-01: demo manual para toda story user-reachable · verificación técnica avanzada opt-in por naturaleza · fixture anti-burbuja implementado.

### 1 · Clasificar la verificación por NATURALEZA (lo declara `/architect` en `04-validators § verification_nature`)

- **técnica** (sin UI, sin superficie user-reachable): service/domain logic, migración, cálculo, ETL → **gates automáticos** (§2). NO requiere demo manual.
- **funcional** (user-reachable: página, flujo, mensaje visible, email, endpoint que la UI llama) → e2e que cubre **cada regla de negocio** (§4) + **gate anti-burbuja** (§3) + **demo manual** de Chris (§5).
- **ambas** → aplica todo.

### 2 · Verificación TÉCNICA — gates automáticos, en orden rápido→lento

Baseline SIEMPRE (bloqueante · architect declara · dev ejecuta · auditor verifica): `tsc --noEmit --strict` / `mypy --strict` → `ruff check` / `eslint --max-warnings 0` → arch-fitness (`pytest tests/architecture/`) → unit/integration. **Opt-in POR NATURALEZA** (architect activa según la capability, NO en toda story): **Schemathesis** (`schemathesis run --checks all .../openapi.json`) → todo endpoint nuevo (atrapa el contrato FE↔BE roto ANTES del runtime de Next) · **Hypothesis** (`@given`) → domain logic con invariantes (pricing/PHI/scheduling/validaciones) · **mutmut** (mutation, pre-merge, módulos críticos) → cuando "tests pasan pero no matan mutantes".

> **"Tests verdes" ≠ done.** Coverage (43%) es el PISO, no el objetivo (Fowler). El bar: *¿un test fallaría si revierto el comportamiento principal?* Si todos son mocks sobre mocks → CHANGES_REQUESTED.

### 3 · El GATE ANTI-BURBUJA (runtime-error gate) — funcional, OBLIGATORIO ★

El `GET 200` oculta el error de cliente. Toda superficie FE se verifica con el fixture Playwright canónico `{brand}/frontend/e2e/fixtures/base.ts` que, durante la acción real, colecta y asserta vacío al teardown:

- `page.on('pageerror')` → excepción JS no atrapada = **la burbuja de Next**
- `page.on('console')` `type==='error'` (allowlist que SOLO shrink) → React / **hidratación** (`Hydration failed…`)
- `page.on('response')` status ≥400 en `/api/` → 500 que la UI traga en un catch
- `expect(page.locator('nextjs-portal')).toHaveCount(0)` → overlay de Next NO en DOM

Todos los specs importan de `base.ts`, **NO** de `@playwright/test`. + script post-acción `scripts/verify-no-backend-errors.sh`: `docker logs {brand}_backend_dev-1 --since $TS | grep -E 'ERROR|Traceback|Exception'` → falla si el backend logueó traceback aunque la UI no lo muestre. La live-verify con **Chrome DevTools MCP** DEBE leer el panel **Console** (0 errores rojos) + confirmar overlay ausente, además del efecto.

### 4 · Cobertura de REGLAS DE NEGOCIO — funcional

Cada regla de `01-spec.md § Business rules` → scenario Gherkin con tag `@rule-ID` → test (happy + ≥1 negative/edge · Example Mapping). El auditor Phase D produce la **gherkin-matrix** (regla → scenario → PASS/FAIL/**MISSING**): cualquier `MISSING` = regla sin test → CHANGES_REQUESTED, NO `done`.

### 5 · Gate de DEMO MANUAL (product demo · Chris = sign-off final) ★

Para toda story **funcional/user-reachable** (técnico puro → auto-skip con razón): recién cuando §2+§3+§4 pasan, el dev produce `demo-script.md` en la story (4 secciones: **SETUP** contra el MISMO dev-app que usó el dev / **HAPPY PATH** numerado en lenguaje de usuario / **EDGE CASES** = reglas de negocio negativas / **TEARDOWN**), derivado de los scenarios Gherkin (no escrito aparte). Claude **le avisa a Chris** → Chris ejecuta el guion → firma:

```yaml
demo_required: true        # árbol: toca frontend/ o endpoint con consumer FE → true; solo tests/migrations/config/core sin cambio de contrato → false (+ demo_skip_reason)
demo_signoff:
  signed_by: Chris
  date: <YYYY-MM-DD>
  result: APPROVED | APPROVED_WITH_NOTES | REJECTED
  notes: "..."
  open_items: [{item, severity, disposition}]
```

`/pm-{brand}` Fase F: **REFUSE merge→done** si `demo_required: true` y `demo_signoff.result ∉ {APPROVED, APPROVED_WITH_NOTES(severity≤medium)}`. El sign-off de Chris (negocio) es SEPARADO del auditor (técnico) — **ambos** requeridos.

### 6 · MODIFICACIÓN de feature (no rehacer todo)

La story que modifica algo existente NO reescribe la suite. 3 niveles (architect los declara en `04-validators § regression_guard`):

- **regression_guard**: los tests de comportamientos NO tocados siguen verdes **sin modificarse** (si cambian → revisión explícita, nunca mecánica).
- **coverage_update**: los tests del comportamiento cambiado se actualizan **revisando el diff** del snapshot/characterization — nunca `vitest -u`/`--update-snapshots` mecánico (= "documentación mentirosa").
- **new_coverage**: tests nuevos para lo nuevo (TDD RED primero). Bug fix → test que reproduce el bug PRIMERO (RED), luego fix (GREEN).

Blast radius por dependencias (TIA `tach`); `make ci-parity` sigue siendo el gate final. El auditor verifica que los `regression_guard` quedaron intactos y que los snapshots actualizados tienen diff revisado por humano.

## Obligación por skill (quién verifica qué)

| Skill | Obligación live-verify |
|---|---|
| **`/architect`** | Clasifica la **naturaleza** (técnica/funcional/ambas) de cada capability y declara en `04-validators.yaml`: `verification_nature`, `technical_gates` (baseline + opt-in Schemathesis/Hypothesis/mutmut por naturaleza), `business_rules` matrix (regla→`@tag`→scenario), `demo_required`, `regression_guard`, `runtime_error_gate`. Si necesita confirmar comportamiento actual, inspecciona live contra dev-app (no asume). |
| **`/dev-team`** (builder-*) | Antes de cerrar `developing → developed`: corre los **gates técnicos** (§2); para superficies FE implementa/usa `base.ts` (**gate anti-burbuja** §3) + corre `verify-no-backend-errors.sh`; ejerce la acción real en dev-app con Chrome MCP **leyendo Console + Network + logs**; cubre cada **regla de negocio** (§4); en modificaciones respeta el `regression_guard` (§6); produce `demo-script.md` para stories funcionales. Registra `dod_evidence` en `checkpoint.md`. NO cierra por "tests verdes" mockeados. |
| **`/auditor`** | Phase D: produce la **gherkin-matrix** (cualquier `MISSING` bloquea); verifica que los specs importan `base.ts` (no `@playwright/test` directo), que el `regression_guard` quedó intacto, que los snapshots actualizados tienen diff revisado, y que existe `demo-script.md` si `demo_required`. Ejerce scenarios críticos live o exige evidencia. Sin evidencia / con MISSING → CHANGES_REQUESTED. |
| **`/po`, `/po-ux`** | Co-escriben la sección `## Business rules` (bullets) + `## Demo script` (lenguaje de usuario) del `01-spec.md`. Para revisar algo que ya corre → abrir dev-app con Chrome MCP (inspección, no gate). |
| **`/pm-{brand}`** | Owner del **gate**: en `merge` REFUSE si falta `dod_evidence`, si la gherkin-matrix tiene `MISSING`, o si `demo_required: true` y `demo_signoff.result ∉ {APPROVED, APPROVED_WITH_NOTES(severity≤medium)}`. No verifica él mismo; exige la evidencia de dev-team/auditor **+ el sign-off de Chris**. |

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

Sin `dod_live_verified: true` + `dod_evidence` (writes ejercidos + efecto observado), la story **NO** pasa a `done`. Para stories funcionales (`demo_required: true`) además se registra `demo_signoff` (§5).

## Cuándo NO aplica

- Tickets de **config / docs / tooling puro** (sin UI ni endpoint ejecutable) — igual corren lint/format. En vitalia: `required: false` + `dev_app_verified_skip_reason`. Estos son **`demo_required: false`** (auto-skip del demo manual, con `demo_skip_reason`).
- Refactor / infra / migración-only / test-only sin cambio de comportamiento observable — los tests existentes pasan antes y después; la naturaleza es **técnica** (sin gate anti-burbuja ni demo manual, pero SÍ los gates técnicos §2 + `regression_guard` §6).

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
| 2 | `/auditor` Phase D: gherkin-matrix + verifica `base.ts` importado + `regression_guard` intacto + `demo-script.md` existe | ⏳ auditor SKILL update |
| 3 | `/pm-{brand}` Fase F REFUSE merge→done sin `dod_evidence` / con gherkin MISSING / sin `demo_signoff` | ✅ vitalia (ADR-008) · ⏳ resto |
| 4 | `07-merge` § Verificación live + `04-validators`/`checkpoint`/`T-review` con campos DoD | ✅ Wave 2A (dc6a94fa) |
| 5 | `chrome-devtools-verify` + `playwright-expert` skills = mecanismo canónico de live-verify | ✅ existe |
| 6 | Pre-commit: bloquea checkpoint con `state: done` si `dod_live_verified: false` presente | ⏳ hook TBD |
| 7 | **Gate anti-burbuja**: `{brand}/frontend/e2e/fixtures/base.ts` (pageerror/console/response + Next overlay) + `scripts/verify-no-backend-errors.sh` | ⏳ vitalia (implementando) · resto hereda |
| 8 | `04-validators` declara `verification_nature` + `technical_gates` (opt-in) + `business_rules` matrix + `demo_required` + `regression_guard` | ⏳ template + `/architect` SKILL |
| 9 | **Gate demo manual**: `demo-script.md` (4 secciones) + `demo_signoff` (Chris) en checkpoint · `/pm-{brand}` REFUSE sin APPROVED | ⏳ template + `/dev-team` + `/pm-{brand}` |

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
