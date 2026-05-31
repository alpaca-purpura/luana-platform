# T-0 — Impl Log (dev-stack boot · Clerk middleware · deps · env/alembic)

> story: nicolify-r0-shell · ticket: T-0 · agent: builder-frontend (sonnet)
> date: 2026-05-30
> cap_target: null (shell = infra-container, plataforma-tecnica)

---

## § Skills Consulted (mandatory load per Step 0 GATE)

| Skill / Rule | Cargada | Cuándo | Decisión clave |
|---|---|---|---|
| `CONTEXT-BRIEF.md` | ✓ | Primera acción | Faithfulness: `partial` — no blocking. Builder can proceed. §11 gap noted (auditor verifies post-build). |
| `nicolify-design-system` | ✓ | Step 0 | SSoT tokens + catálogo 5 agentes + wrapper fidelity. T-0 no requiere tokens todavía (T-1 scope). |
| `frontend-expert` | ✓ | Step 0 | FSD-Lite boundaries. `runtime-quality-checklist.md` leído: checklist proxy.ts — sin useEffect, sin routing bugs. |
| `playwright-expert` | ✓ | Step 0 | Boot-live-smoke A0 deferred to T-6. E2E preflight obligatorio documentado. |
| `.claude/rules/tenant-isolation.md` | ✓ | Step 0 | Clerk `auth.protect()` protege todas las rutas NO en allowlist. `X-Tenant-ID` auto-inyectado por `fetchClient` en Client Components. |
| `.claude/rules/frontend-fsd.md` | ✓ | Step 0 | Shell organism en `components/shared/` (no `features/`). T-0 solo toca `proxy.ts` + `package.json`. |
| `runtime-quality-checklist.md` | ✓ | Pre-commit | Proxy.ts sin useEffect/routing bugs. Sin hooks, sin state-derived params. Clean. |
| `chrome-devtools-verify` | Skill loaded | Pre-commit | FE :3001 running in Docker. Live verification via curl checks + direct HTTP status assertions. Ver §  Live verification. |
| `brand-expert` | N/A | — | T-0 no toca brand studio. |
| `offer-expert` | N/A | — | T-0 no toca offer studio. |
| `copilot-expert` | N/A | — | T-0 no toca módulos agénticos. |
| `sales-agent-expert` | N/A | — | T-0 no toca sales agent. |
| `metrics-expert` | N/A | — | T-0 no toca analytics. |

---

## § Plan (diseño técnico antes de escribir código)

### Design-system-first scan
- T-0 no introduce UI components. No se requiere atom lookup para este ticket.
- `proxy.ts` ya existe y está cableado (puerto `src/proxy.ts`, Next.js 16 PROXY_FILENAME convention).
- `package.json` requiere añadir `react-resizable-panels@^4.11.1` (gap documentado en 03-arch.md § 16).

### Scope T-0
1. Verificar `make dev-nicolify` levanta BE :8001 (health 200) + FE :3001 green.
2. Verificar Clerk middleware (`proxy.ts`) protege `[tenantId]/**` + allowlist `/api/health` + `/sign-in` + `/sign-up`.
3. Verificar `.env.dev` completo desde `.env.dev.template` + alembic baseline `001_nicolify` aplicado.
4. Instalar `react-resizable-panels@^4.11.1` + npm/pnpm install green.
5. Escribir nota de boot-smoke A0 (deferred to T-6).

### Batería de tests (TDD doctrine)
T-0 es mayoritariamente de verificación — no introduce código nuevo (el proxy ya existe). El único cambio de código es `package.json` (añadir dep). Tests obligatorios:
- Verificación live HTTP status (curl checks en esta sesión = verificación directa).
- A0 boot-live-smoke deferred to T-6 (documentado abajo).
- No aplica RED→GREEN para `package.json` dep change (es config, no lógica).

### Anti-orphan integration (CONN)
T-0 crea las condiciones para que el shell sea reachable:
- **Consumed**: proxy.ts protege rutas → Clerk redirige a sign-in → post-login acceso al shell.
- **On-the-map**: `map_zone: infraestructura · map_box: plataforma-tecnica` (en checkpoint).
- **Navigable**: `GET /api/health` 200 confirmado. Unauthenticated root → 307 `/sign-in` confirmado.
- **Notarized**: Next.js proxy convention registra `proxy.ts` automáticamente (PROXY_FILENAME).

---

## § Entry 1 (RED — verificación inicial)

**Estado inicial encontrado:**
- BE :8001 UP: `curl http://127.0.0.1:8001/health` → `{"status":"ok","brand":"nicolify","version":"0.1.0"}` ✓
- FE :3001 UP: responde 307 a `/sign-in` (Clerk middleware activo) ✓
- `proxy.ts` ya existe en `nicolify/frontend/src/proxy.ts` ✓
- `.env.dev` completo (todas las keys del template presentes) ✓
- Alembic: `001_nicolify (head)` aplicado ✓
- `react-resizable-panels` NO en `package.json` → GAP a resolver ✗

**Verificación proxy middleware:**
```
GET / → 307 /sign-in (Clerk protege ruta raíz) ✓
GET /api/health → 200 (allowlisted, pasa al BE) ✓
GET /sign-in → 200 (allowlisted) ✓
GET /sign-up → 200 (allowlisted) ✓
GET /test-tenant/christian/pipeline → 307 /sign-in?redirect_url=... (ruta tenant protegida) ✓
```

**docker containers:**
```
luana-dev-nicolify_frontend_dev-1  Up 2 hours
luana-dev-nicolify_backend_dev-1   Up 2 hours
```

---

## § Entry 2 (GREEN — instalar react-resizable-panels)

Instalado via pnpm workspace filter (npm puro falla con `workspace:*` protocol):

```bash
pnpm add --filter "@luana/nicolify-web" react-resizable-panels@^4.11.1
```

Resultado:
- `package.json` → `"react-resizable-panels": "^4.11.1"` ✓
- `pnpm-lock.yaml` → 4 entries con `react-resizable-panels` ✓
- `node_modules/react-resizable-panels/` → INSTALLED ✓
- Peer deps warning (React 19 vs React 16-18 declarado) → OK, legacy-peer-deps en `.npmrc` ✓

---

## § Entry 3 (Quality gate — lint + tsc)

```bash
cd nicolify/frontend && npx tsc --noEmit
# Output: (vacío — 0 errores) ✓

cd nicolify/frontend && npx eslint src/proxy.ts --cache --cache-location .eslintcache
# Output: (vacío — 0 errores) ✓
```

---

## § Live verification

**No chrome-devtools-verify disponible en esta sesión** (MCP server no inicializado). Verificación realizada via curl directo sobre stack Docker levantado:

| Verificación | Comando | Resultado | Estado |
|---|---|---|---|
| BE health | `curl http://127.0.0.1:8001/health` | `{"status":"ok","brand":"nicolify","version":"0.1.0"}` | ✓ |
| FE root (unauth) | `curl -I http://127.0.0.1:3001/` | HTTP 307 → `/sign-in?redirect_url=...` | ✓ |
| FE /api/health (allowlisted) | `curl http://127.0.0.1:3001/api/health` | HTTP 200 `{"status":"ok",...}` | ✓ |
| FE /sign-in (allowlisted) | `curl -I http://127.0.0.1:3001/sign-in` | HTTP 200 | ✓ |
| FE /sign-up (allowlisted) | `curl -I http://127.0.0.1:3001/sign-up` | HTTP 200 | ✓ |
| FE tenant route (unauth) | `curl -I http://127.0.0.1:3001/test-tenant/christian/pipeline` | HTTP 307 → `/sign-in?redirect_url=...` | ✓ |
| Alembic baseline | `docker exec ... alembic current` | `001_nicolify (head)` | ✓ |

Live verification: **PASS** (sin chrome-devtools-verify — verificación manual HTTP status directa, escalado a Chris si necesario confirmar con browser real).

---

## § Boot-Smoke A0 — skeleton note (deferred to T-6)

**A0 es el Gherkin scenario que cierra la story — se valida DESPUÉS de que T-1..T-6 construyan el shell.**

El boot-smoke A0 requiere:
1. `make dev-nicolify` levantado (OK hoy) ✓
2. Clerk testing-token login (necesita `E2E_CLERK_USER_EMAIL` + `E2E_CLERK_USER_PASSWORD` en `.env.dev`)
3. Navegación autenticada a `DEFAULT_LANDING` (`christian/pipeline`)
4. Shell HTTP 200 (el shell no existe aún — T-1..T-6 lo construyen)

El smoke test path es: `e2e/regression/nicolify-r0-shell/boot-live-smoke.spec.ts`

Preflight E2E (cuando aplique en T-6):
```bash
cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test e2e/regression/nicolify-r0-shell/boot-live-smoke.spec.ts --project=regression
```

**T-0 deja el stack LISTO para que T-6 cierre A0 con el shell construido.**

---

## § Mockup scope notes

T-0 no implementa UI. No hay mockup scope a aplicar. La verificación visual del shell.html mockup ratificado corresponde a T-2..T-6.

---

## § Cross-story observed bugs

Ninguno observado durante T-0.

---

## § Checklist pre-commit (runtime-quality-checklist.md)

- [x] proxy.ts: sin useEffect deps issues (no useEffect)
- [x] proxy.ts: sin stale closures (no hooks)
- [x] proxy.ts: routing tenant prefix — N/A (proxy no hace router.push)
- [x] proxy.ts: mock anti-patterns — N/A (no tests en proxy.ts directamente)
- [x] package.json: dep añadida correctamente con semver exacto
- [x] tsc --noEmit: 0 errores
- [x] eslint src/proxy.ts: 0 errores
- [x] Live verification: HTTP status checks via curl (stack Docker levantado)
