# Definition of Done — Live Verify (ninguna story es `done` sin que Claude la ejerza en el stack real)

**Origen:** sesión 2026-05-31 — Chris detectó que `nicolify-r0-shell` fue marcada `done` aunque su propio `07-merge.md` admitía que la DoD real (verificación live en el entorno dev) NUNCA se cumplió (44/44 e2e corrieron contra `next build`, no contra el stack interactivo; `make dev-nicolify` ni arrancaba). Chris: *"mi Definition of Done es que esté verificado y validado en el entorno de desarrollo… jamás me digas que algo está done sin que tú lo hayas verificado en nuestro ambiente de desarrollo."* Consistencia ratificada: **como en vitalia** (`vitalia/docs/learnings/cobertura-tests-vs-realidad-2026-05-29.md` — localhost:3002 + Chrome DevTools MCP).

**Cement-date:** 2026-05-31. **Aplica a:** TODAS las brands (vitalia, nicolify, comunify, lupulo + futuras) — una sola DoD cross-brand. **Owners del gate:** `/auditor` (verifica) + `/pm-{brand}` (no mergea a `done` sin el check). **Complementa:** `test-design-doctrine.md § Verificación REAL ≠ HTTP 200` (qué/cómo testear) + `story-closure-gate.md` (Fase F merge).

## Regla cardinal

Ninguna story con UI o endpoint alcanza `state: done` hasta que **Claude la haya ejercido contra el stack de desarrollo real de la marca, leído los logs, y confirmado el efecto** — y lo haya **registrado** con evidencia. Claude **NUNCA declara `done` / "funciona" / "verificado" / "shipped"** basándose en suite verde, build OK, o HTTP 200. Verde ≠ ejercido. Build ≠ corrido. 200 de un GET ≠ la acción del usuario funciona.

> El verde de los gates (tsc/eslint/vitest/pytest/playwright) es **necesario pero nunca suficiente**. La DoD se cierra **ejerciendo la acción real del usuario en la app corriendo**.

## El entorno dev de la marca (consistente cross-brand · pattern = cloudflared tunnel, como vitalia)

El entorno canónico de live-verify es **`dev-app.{brand}.com`** = **cloudflared tunnel → el stack local `localhost:300X`** (NO un servidor cloud — el deploy sigue deferred per `github-actions-deferred.md`; el túnel solo expone el stack que ya corre en tu máquina). Mecanismo de verificación = **Chrome DevTools MCP** (`chrome-devtools-verify` skill). Pattern original: vitalia (`vitalia/docs/learnings/2026-05-30-clerk-godmatrix-mint-live-verification.md`: *"dev-app.vitalialat.com (cloudflared tunnel → localhost:3002) es el entorno donde se hace verificación live"*).

| Brand | dev-app (live-verify) | Levantar stack + túnel | localhost subyacente | Backend logs | Estado túnel |
|---|---|---|---|---|---|
| vitalia | `dev-app.vitalialat.com` | `make dev-vitalia` + `make dev-vitalia-tunnel` | `:3002` / `:8002` | `docker logs luana-dev-vitalia_backend_dev-1` | ✅ provisto |
| **nicolify** | `dev-app.nicolify.com` | `make dev-nicolify` + `make dev-nicolify-tunnel` | `:3001` / `:8001` | `docker logs luana-dev-nicolify_backend_dev-1` | ⚠️ config + tunnel ID reales en `dev-config.yml` (`be33b8dd…`); falta solo el credentials local `.credentials/dev-tunnel.json` (las keys de Chris) |
| comunify | `dev-app.comunify.com` | `make dev-comunify` + `make dev-comunify-tunnel` | `:3003` / `:8003` | `docker logs luana-dev-comunify_backend_dev-1` | ⚠️ verificar |
| lupulo | `dev-app.lupulo.com` | `make dev-lupulo` + `make dev-lupulo-tunnel` | `:3004` / `:8004` | `docker logs luana-dev-lupulo_backend_dev-1` | ⚠️ verificar |

> **Provisión del túnel por brand (one-time):** `scripts/cloudflared-setup.sh {brand}` (login Cloudflare interactivo + crea tunnel + DNS CNAME + `deploy/cloudflared/.credentials/dev-tunnel.json` gitignored + resuelve `<TUNNEL_ID>` en `dev-config.yml`). Requiere auth de Chris (no automatizable headless). **Nicolify:** el tunnel ID ya está resuelto en `dev-config.yml` (`be33b8dd-5218-46d2-b8b5-1ee65f2dee8e`, hostname `dev-app.nicolify.com`) — solo falta dejar el `dev-tunnel.json` en `nicolify/deploy/cloudflared/.credentials/` (montado a `/etc/cloudflared/dev-tunnel.json`).
>
> **Fallback localhost:** mientras el túnel de una brand no esté provisto, la live-verify se hace contra `localhost:300X` directo (mismo Chrome DevTools MCP, misma acción real, mismos logs) — es verificación válida; lo único que falta es el dominio público + JWT Clerk del dominio real (godmatrix). Documentar en `dod_evidence` que se verificó en localhost (no en dev-app) cuando aplique.

## El bar de "verificado" (mínimo honesto · de test-design-doctrine)

| Naturaleza | "Verificado live" significa |
|---|---|
| **UI / flujo usuario** | Ejercer la acción real (crear/editar/**guardar**/eliminar/navegar) en la app corriendo (Chrome DevTools MCP) → resultado esperado visible (toast OK, fila aparece, valor persiste al recargar) + **logs del backend sin 4xx/5xx inesperado** + (si escribe) efecto en DB confirmado. Un `GET 200` o un render de placeholder NO basta. |
| **BE endpoint** | Ejercer el método/payload reales incluido el **write** (POST/PATCH/PUT/DELETE), no solo el GET. Status correcto + **leer logs** (sin traceback) + assert del efecto. Un 405/500 al lado en el mismo flujo = NO verificado. |
| **Migración / schema** | Aplicar contra DB real + confirmar tabla/columna existe + el endpoint que la usa responde OK ejercido de verdad. |
| **Agentic** | Correr el turno/tool real + leer trazas (`copilot_trace_event`) + eval goldens. "El endpoint respondió" NO basta. |

**Trampa estrella prohibida:** declarar algo verificado porque un GET dio 200 (caso lisa-marca: suite mockeaba el backend → falso verde → 3 bugs a "LIVE"). Una e2e que **mockea el backend** NO cuenta como live-verify.

## Registro obligatorio (evidencia, no palabra)

La verificación live se **registra** o no ocurrió. En `07-merge.md § Verificación live` (y `checkpoint.md` de la story):

```yaml
dod_live_verified: true
dod_env: "make dev-nicolify → localhost:3001 (Chrome DevTools MCP)"
dod_evidence:
  - action: "Click 'Christian' en el Ribbon → abre sub-tab del agente"
    observed: "sub-tab Christian renderiza, color de marca correcto, single main-content"
    backend_log: "GET /shell/agents 200 · sin traceback (docker logs luana-dev-nicolify_backend_dev-1)"
  - action: "Colapsar/expandir LuanaSidebar + recargar"
    observed: "estado persiste (Zustand hidratado), sin error de hidratación en consola"
verified_at: 2026-05-31
```

Sin `dod_live_verified: true` + `dod_evidence`, la story **NO** pasa a `done`.

## Cuándo NO aplica

- Tickets de **config / docs / tooling puro** (sin UI ni endpoint ejecutable) — igual corren lint/format.
- Refactor sin cambio de comportamiento — los tests existentes pasan antes y después (no hay acción nueva que ejercer).

## Gate en el ciclo de vida (dónde se enforce)

| Fase | Owner | Qué hace |
|---|---|---|
| `developed → reviewing` | `/auditor` | Phase D: además de la gherkin-matrix, **ejerce los scenarios críticos live** (Chrome DevTools MCP) o exige `dod_evidence`. Sin evidencia live → CHANGES_REQUESTED (no APPROVED). |
| `reviewing → done` | `/pm-{brand}` | Fase F: **REFUSE merge→done** si `dod_live_verified != true` o falta `dod_evidence` en `07-merge.md`. El checkpoint NO se escribe `state: done`. |

## Anti-patterns prohibidos (top 7)

- ❌ Declarar `done` / "funciona" / "shipped" con suite verde pero sin ejercer la acción real en el stack corriendo
- ❌ "Verificado" porque un GET dio 200 (sin ejercer el write ni leer logs)
- ❌ e2e que mockea el backend presentada como live-verify (falso verde)
- ❌ Correr e2e contra `next build`/standalone y llamarlo "verificación live" (no es el stack interactivo que usa el usuario)
- ❌ `07-merge.md` con `state: done` y un box de DoD live **sin tildar** (auto-contradicción — caso origen nicolify-r0-shell)
- ❌ `/pm-{brand}` mergeando a `done` sin `dod_live_verified: true` + `dod_evidence`
- ❌ Inventar un mecanismo de verificación distinto por brand (rompe consistencia — el entorno dev es el mismo patrón para todas)

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | Pointer en root `CLAUDE.md` § Critical Rules #37 (auto-load cada sesión) | ✅ 2026-05-31 |
| 2 | `/auditor` Phase D ejerce/exige live verify (Chrome DevTools MCP) antes de APPROVED | ⏳ auditor SKILL update |
| 3 | `/pm-{brand}` Fase F REFUSE merge→done sin `dod_live_verified: true` + evidencia | ⏳ pm-{brand} SKILL update |
| 4 | `07-merge-template.md` incluye sección `§ Verificación live` obligatoria con `dod_evidence` | ⏳ template update |
| 5 | `chrome-devtools-verify` skill = mecanismo canónico de live-verify conversacional | ✅ existe |
| 6 | Pre-commit: bloquea checkpoint con `state: done` si `dod_live_verified: false` presente | ⏳ hook TBD |

## Referencias

- `.claude/rules/test-design-doctrine.md § Verificación REAL ≠ HTTP 200` — qué/cómo testear + el bar honesto
- `.claude/rules/story-closure-gate.md § Fase F` — merge→done (este gate se inserta ahí)
- `vitalia/docs/learnings/cobertura-tests-vs-realidad-2026-05-29.md` — caso lisa-marca (origen del bar, brand vitalia)
- `.claude/skills/chrome-devtools-verify/SKILL.md` — mecanismo live-verify
- `docs/process/lifecycle.md § 4` — definición de done (status=live requiere e2e real)
- caso origen: `nicolify/docs/product/stories/nicolify-r0-shell/` (reabierta 2026-05-31)
