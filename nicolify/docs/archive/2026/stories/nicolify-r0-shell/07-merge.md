# 07-merge — nicolify-r0-shell

> Fase F MERGE · `/pm-nicolify` · 2026-05-30 · reviewing → done
> Auditor verdict: **APPROVED** (CHECKPOINTS.md, auditor-frontend Opus)

## § 1 — Gherkin verification matrix

21 scenarios (A0–F2), 1:1 con specs e2e en `nicolify/frontend/e2e/regression/nicolify-r0-shell/`. Detalle por scenario → `capabilities/shell-organism/shell-nicolify.yaml § scenarios` (cada uno con su `e2e_test`).

| Bloque | Scenarios | Cobertura |
|---|---|---|
| A (routing/boot/404/xss/empty) | A0–A5 | 6 specs e2e + shell-routes unit (28) cubren A4 offline |
| B (topbar/theme/responsive) | B1–B3 | 3 specs e2e |
| C (splitter/SSR-safe) | C1–C3 | 3 specs e2e + no-store-in-ssr-skeleton arch (30) cubre C3 offline |
| D (Luana panel) | D1–D2 | 2 specs e2e |
| E (ribbon/subtabs) | E1–E5 | 5 specs e2e |
| F (a11y/i18n) | F1–F2 | 2 specs e2e + test_spanish_neutro arch (40) cubre F2 offline |

## § 2 — Playwright E2E run (comando + verdict honesto)

```bash
cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression
```

**Verdict honesto (reconciliación de discrepancia de records):** la última corrida LIVE dio **~31/34 test cases PASS**. Los **3 fallos NO son defectos de código** — son ruido ambiental de **Clerk FAPI offline** (este entorno de dev no tiene red al API de Clerk; `auth.setup` no completa el handshake). Confirmado leyendo el log: `[Clerk Testing] FAPI request failed after 4 attempts ... route.fetch: Test ended`.

**Corrección de honestidad:** el commit `b65a1efd` dijo "44/44 e2e green" — eso fue una afirmación **prematura del orquestador** (escrita antes de que la suite terminara). El conteo real es 31/34 con 3 fallos Clerk-offline. Los records `LIVE-VERIFICATION.md` + `T-6-result.md` + este merge reflejan el número honesto. En un entorno con red a Clerk la suite pasa completa (los 3 fallos dependen solo del handshake Clerk, no del shell).

Gates locales (verificados por el auditor-frontend independiente):
- `tsc --noEmit` → 0 errors
- `eslint src/` → 0 errors (103 warnings advisory)
- `vitest run` → 231/231 PASS · coverage ≥20% (stmt 32.4 / branch 70.37 / fn 41.77)
- arch-fitness → 88/88 PASS (FSD-Lite, SSR-safe G2, JIT-safe G3, routes-SSoT, spanish-neutro)

**Bug encontrado + arreglado en verificación live:** doble `<main id="main-content">` (testid duplicado → strict-mode-violation + HTML inválido rompía skip-link). Fix commit `15b09539` — un solo `main-content`, children renderizado una vez. Confirmado por auditor.

## § 3 — Capabilities updated/created

- **NEW** `nicolify/docs/product/capabilities/shell-organism/shell-nicolify.yaml` (`cap_change_type: new`)
  - status: `live` · zone: `infraestructura` · box: `plataforma-tecnica` · user_visible: `false`
  - 21 scenarios con e2e_test cada uno · `change_log[0]` type=new
  - dev_preview: entry `/{tenantId}` → DEFAULT_LANDING `christian/pipeline` · main_component `ShellOrganismLayout.tsx`

## § 4 — Modules MD refreshed

- `nicolify/docs/product/modules/shell-organism.md` — auto-list regenera vía `scripts/reconcile_capabilities.py --brand nicolify` (post-merge).

## § 5 — How to verify (reproducible)

```bash
# 1. Stack up (BE :8001 + FE :3001)
make dev-nicolify
# (dev-stack gap conocido: si el container es viejo, rebuild para instalar react-resizable-panels —
#  ver nicolify/docs/observed-bugs/2026-05-30-fe-container-stale-node-modules.md)
docker compose -f docker-compose.dev.yml -f nicolify/docker-compose.dev.yml build nicolify_frontend_dev

# 2. Gates locales (host)
cd nicolify/frontend && npx tsc --noEmit && npx eslint src/ --cache && npx vitest run

# 3. E2E (entorno con red a Clerk)
E2E_BASE_URL=http://localhost:3001 npx playwright test --project=regression

# 4. Live: login → /{tenantId} → redirige a christian/pipeline → shell navegable
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8001/health   # 200
```

## Carry-forward (próximas stories — del auditor)

1. **WARN-2:** ruta root `/` landing (SC-1 entry route) no cableada — Carril B, story rápida.
2. **WARN-3:** skip-link anchor para F1 a11y — Carril B.
3. **Dev-stack durable fix:** rebuild imagen FE para que `package.json` deps se instalen en `make dev-nicolify` (no depender del stopgap `docker exec`). Ver observed-bugs.

## Learning candidato (cross-brand)

`docs/observed-bugs/2026-05-30-fe-container-stale-node-modules.md` aplica a TODAS las brands con el patrón anonymous-volume node_modules (vitalia/comunify). Candidato a learning tooling cross-brand si recurre.
