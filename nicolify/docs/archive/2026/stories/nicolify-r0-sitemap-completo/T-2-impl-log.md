---
ticket: T-2
story_id: nicolify-r0-sitemap-completo
brand: nicolify
type: test-surface
production_code: false
state: developed
builder: builder-frontend (Sonnet)
commit: 07731cf8
branch: worktree-agent-acbb6920bdcf395f9
---

# T-2 Implementation Log

## Plan

### Scope
T-2 is TEST SURFACE only (`production_code: false`). The deliverables are:
1. `e2e/fixtures/base.ts` — anti-burbuja gate (DoD Critical Rule #37)
2. `e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts` — full v3 nav-walk (N2 + N3)
3. Update `empty-states-all-subtabs.spec.ts` — v3 slugs + N3 leaves
4. Fix dead slugs in `ribbon-deeplink.spec.ts`, `ribbon-nav.spec.ts`, `avatar-fallback.spec.ts`

No `src/` runtime touched. T-1 owns all runtime changes.

### Design-system-first (D1)
Not applicable — test surface only, no UI components.

### Mockup adherence (D2+D3)
Not applicable — test surface, no mockup.

### Batería de tests
The spec suite IS the test output. Structure: auth.fixture → base.ts (extends) → nav-walk-v3.spec.ts (imports base).

### Integration (CONN anti-orphan)
nav-walk-v3.spec.ts: picked up by `playwright.config.ts` project `regression` via glob `/e2e/regression/**/*.spec.ts`. Not an island.

---

## Mockup scope notes
N/A — test surface, no UI.

---

## Skills Consulted (must_load enforcement v4.1)

| Skill | Invoked | Decision |
|---|---|---|
| `playwright-expert` | Read SKILL.md | Clerk auth fixture lifecycle: `setupClerkTestingToken` must be called BEFORE navigation; `auth.fixture.ts` wraps page + injects token. base.ts extends authBase (not raw @playwright/test) to inherit token injection |
| `frontend-expert` | Read SKILL.md | E2E patterns: import from base.ts not @playwright/test; no `make e2e*` Docker; native Linux only; regression specs under `e2e/regression/` |
| `chrome-devtools-verify` | Read SKILL.md (DoD gate) | Playwright run deferred to live-verify phase (no stack in sandbox). Chrome MCP gate: `dev-app.nicolify.com` with stack at localhost:3001 |
| `definition-of-done-live-verify.md` | Read rule | §"El GATE ANTI-BURBUJA": base.ts must collect pageerror + console error (type==='error') + response >=400 on /api/ + assert [data-nextjs-dialog] absent. Vitalia base.ts used as canonical form |
| `e2e-testing.md` | Auto-loaded | Never Docker (`make e2e*`); native Linux; E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression |
| `spanish-text.md` | Auto-loaded | User-facing strings in specs use Spanish neutro LatAm |

---

## Files produced

| File | Action | Description |
|---|---|---|
| `e2e/fixtures/base.ts` | NEW | Anti-burbuja gate extending auth.fixture. Collects pageerror + hydrationErrors + consoleErrors (allowlist-filtered) + failedApi (>=400 on /api/). Asserts empty at teardown. Exports `notAllowlisted()` helper |
| `e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts` | NEW | Full v3 nav-walk: 20 N2 leaves + 8 N3 leaves = 28 test cases. Imports from fixtures/base.ts (anti-burbuja automatic). N3 titles contain "N3" for validator grep |
| `e2e/regression/nicolify-r0-shell/empty-states-all-subtabs.spec.ts` | UPDATE | v3 N2 slugs (20 combos) + v3 N3 leaves (8 combos). Dead slugs removed: angulos, escalera-valor, prospectos, secuencias, cuentas (norvil), salud-cuenta, proyectos (sara), campanas, presupuesto (brenda), agentes (config) |
| `e2e/regression/nicolify-r0-shell/ribbon-deeplink.spec.ts` | UPDATE | salud-cuenta→cartera + sara/proyectos→sara/proximamente + testid update |
| `e2e/regression/nicolify-r0-shell/ribbon-nav.spec.ts` | UPDATE | abel default subtab oferta→icp (getDefaultSubtab returns first = icp in v3) + 3 sub-tabs comment |
| `e2e/regression/nicolify-r0-shell/avatar-fallback.spec.ts` | UPDATE | sara/proyectos→sara/proximamente |

---

## Structural gate outputs (verbatim)

### TSC gate
```
GATE RESULT: STRUCTURAL NOTE — tsconfig.json explicitly excludes e2e/**:
  "exclude": ["node_modules", "e2e/**"]
Therefore `tsc --noEmit` does NOT type-check e2e files.
Running `./node_modules/.bin/tsc --noEmit` on src/ exits 0 (no errors).
The e2e TypeScript is authored to be structurally correct (verified by reading
the existing spec patterns and Playwright type signatures), but tsc does not
validate it in this repo configuration.
```

### ESLint gate
```
$ cd nicolify/frontend && node_modules/.bin/eslint e2e/
Oops! Something went wrong! :(
ESLint: 9.39.4
You are linting "e2e/", but all of the files matching the glob pattern "e2e/"
are ignored.
--- ESLINT EXIT CODE: 0

GATE RESULT: eslint.config.mjs has e2e/** in the ignores array.
ESLint does not check e2e files in this repo configuration. Exit 0.
```

### Slug-validity grep (functional code only — agent worktree)
```
$ grep -rn "page.goto.*(abel/angulos|abel/escalera-valor|christian/prospectos|christian/secuencias|christian/licitaciones|norvil/cuentas|norvil/salud-cuenta|sara/proyectos|brenda/campanas|brenda/presupuesto|config/agentes)" e2e/
OK: no dead slugs in goto calls

$ grep -rn "testid.*subtab-content-(abel-angulos|...)" e2e/
OK: no dead testids

$ grep -rn "waitForURL.*(abel/oferta|abel/angulos|sara/proyectos|norvil/salud-cuenta)" e2e/
OK: no dead waitForURL

All functional goto/testid/waitForURL references use valid v3 slugs only.
Comments in files mention old slugs in changelog notation — documentation, not live code.
```

---

## Playwright run note
Playwright suite run DEFERRED to live-verify phase per ticket instructions:
"DO NOT attempt npx playwright test (the orchestrator runs the actual playwright
suite during the live-verify phase against localhost:3001)."

Stack must be running: `make dev-nicolify` (FE :3001, BE :8001).
Command: `cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression`

Live-verify via Chrome DevTools MCP: `dev-app.nicolify.com` (tunnel provisioned)
with user `owner.demo@nicolify.com` (verified `verify_password`→true per rule #37).

---

## Commit
SHA: `07731cf8`
Branch: `worktree-agent-acbb6920bdcf395f9`
Files: 6 files changed, 530 insertions(+), 45 deletions(-)
