# HANDOFF — nicolify-r1-abel-icp-buyer (continuar en sesión nueva)

> **Generado:** 2026-06-04. **Branch:** `wip/nicolify` @ `e54e54cf`. **Story state:** `reviewing`. **Lock:** `code:abel` (PID muerto → auto-libera en el próximo `session-lock.sh acquire`).
> **Objetivo de la sesión nueva (mandato Chris):** resolver TODO lo pendiente **para siempre** — incluido tocar `core/` si hace falta (Chris pre-autoriza el scope; el gate `/pm-luana` se respeta para el lift formal).

---

## 1. Qué está HECHO y verificado (no re-hacer)

- **8 tickets construidos + commiteados** (T-BE-1+2, T-AG-1 Opus, T-FE-1..4, T-E2E-1). Build autónomo `/dev-team`.
- **Audit APPROVED** (auditor-backend + auditor-agentic + auditor-frontend). gherkin-matrix 0 MISSING/0 FAIL. `CHECKPOINTS.md` C1-C5.
- **DoD #37 live-verify: substantial.** Stack dev real (BE :8001 + FE :3001 + tunnel `dev-app.nicolify.com`).
  - **BE writes** (curl header-auth, efecto en DB, 0 traceback): create→borrador · patch→persist · buyer+set-primary · mark-ready 422→200 listo · cross-tenant 404.
  - **FE-UI core flows verificados AS CHRIS** (su cuenta real `DEV_APP_CHRIS`, tenant `alpaca-purpura`/`e4373552`, slug-URL, empty): create-blank → POST 201 → `/datos` form · detalle · buyer · set-primary · a11y · invalid-UUID→404 · **anti-burbuja CLEAN**. Screenshots: `dod-evidence-screens/`.
  - **4 visual baselines** capturados (lista light+dark · detalle light+dark) → `e2e/specs/regression/abel-icp-visual-goldens.spec.ts-snapshots/`.
- **★ 10 bugs REALES cazados por el gate #37** (todos invisibles a tsc/vitest/arch/audit · varios destapados por Chris en el dev-app real):
  1. `d13ecc14` — BE `luana-core-extraction/llm` deps no declaradas → container crash-loop (host tests verdes lo ocultaban).
  2. `9b5b1eb0` — FE `[entityId]` vs `[subsubtab]` Next.js route conflict → 500, app inalcanzable.
  3. `d5ee83e0` — `+ buyer` affordance muerto (ruta dead).
  4. `a323bd5d`→`cee3c7fe` — invalid UUID → spinner eterno; luego SSR-404 gate.
  5. `8e7906d9` — R0 `AppPanelSlot 2×` (bloqueaba baselines R1).
  6. `1c7f0005` — FE `buyer-api` plural vs BE singular → buyer flow 404.
  7. `cee3c7fe` — SSR-404 gate usaba URL relativa → TypeError en cada detalle (`fetchClient` ahora SSR-aware con `INTERNAL_API_URL`).
  8. `d6fd864d` — **SISTÉMICO** tenant-id: hooks mandaban el slug de la URL como `X-Tenant-ID`, el BE quiere el UUID de `publicMetadata.tenant_id`. `useTenantId()` + arch-test. (EL blocker del dev-app real de Chris.)
  9. `3eebc096` — "Empezar en blanco" → ruta muerta `/nuevo`; ahora crea ICP + navega a `/datos`.
  10. (R0 mobile aria-label `"Abrir panel Luana"` mismatch — pre-existente, NO arreglado, ver §3-D.)

---

## 2. Qué FALTA (pendientes — la sesión nueva resuelve TODO)

### A. demo_signoff de Chris (gate `reviewing → done`)
- Chris estaba revisando con sus propios ojos cuando cortamos. **El create-blank funciona** (verificado live as Chris) — el reporte "no funciona" fue **JS stale** (FE recompilando cuando le pedí probar; hard-refresh resuelve).
- Cuando Chris firme `demo_signoff: APPROVED | APPROVED_WITH_NOTES` → `/pm-nicolify` mergea: `07-merge.md` (5 secciones) + cap `abel.icp-buyer` status `wip→live` + `modules/abel.md` + `git mv` story a `archive/2026/` (R2) + `state: reviewing→done`. `/pm-nicolify` REFUSE merge sin el signoff.
- Schema en `.claude/rules/definition-of-done-live-verify.md` § Gate demo manual.

### B. ★ Deuda de test-infra: FLAKINESS del E2E (la parte que Chris marcó — resolver "para siempre")
**Diagnóstico (con datos):** vitest unitario es **determinista** (538/538 ×2). La flakiness está SOLO en Playwright. Causas raíz (de `nicolify/frontend/playwright.config.ts`):
- **`retries: 1` local** (`:58`) → un test que falla y pasa al reintento se ve VERDE → **esconde** la flakiness (caso splitter/responsive "passed retries"). → cambiar a **`retries: 0` local** (falla fuerte).
- **`fullyParallel: true` + `workers: 4`** contra el MISMO backend/tenant → races por estado compartido en DB. → **aislamiento de datos por test** (tenant/worker dedicado + cleanup) o serializar.
- **Dependencia de estado sembrado** (`E2E_ICP_ID`/`E2E_BUYER_ID`/etc. por env var) → SKIP/fail según el estado de la DB. **Es la trampa `e2e-seeded-state-masks-cold-start`** (learning ya existe). → cada spec **crea sus propios datos** vía API en `beforeEach` + los limpia en `afterEach`. Cero `E2E_*_ID` env vars.
- **Corre contra `next dev`** (live-reload) → hot-reload mid-run = fallo transitorio (vi `000`/`500` mid-recompile). → correr E2E contra **`next build` + `next start`** estable (o dev con readiness-gate real).
- **Variante cold-start/empty** faltante por flujo estado-dependiente → agregar (lo que enmascaró los bugs de Chris).
- **Esto puede tocar infra compartida** (`e2e/fixtures/base.ts`, `clerk.setup.ts`, `playwright.config.ts`) y posiblemente el harness → candidato a tocar `core/` o `.claude/`. **Chris autoriza.**

### C. Deferrals técnicos (env-limited — habilitarlos)
- **LLM extract→borrador (happy path):** el extractor falla suave ("Connection error") porque **no hay proveedor LLM en dev**. Necesita creds LLM configuradas (`OPENAI_API_KEY` está en `sk-REPLACE_ME`). Habilita: extract→borrador + ProposalBanner + baseline `propuesta`. **Puede tocar `core/luana-core-llm` config.**
- **growth_studio_event telemetría:** 0 filas tras mark-ready (best-effort + Redis down en dev). Levantar Redis (`luana_redis_dev` no resuelve) + verificar emisión + no-PII.
- **baseline `arranque`** (empty-state visual): requiere tenant vacío para capturar (con seed no se puede). Una vez el e2e cree/limpie su propio estado (§B), se captura.

### D. Hallazgos de audit (WARN) + R0 pre-existente
- **W1 (security):** rutas `abel` confían en `X-Tenant-ID` SIN auth app-layer (Bearer). Aislamiento por query HOLDS (sin leak), pero **ratificar/implementar auth real antes de exposición non-localhost**. **Toca `core/luana-core-iam`/`platform` (auth middleware) → /pm-luana.**
- **W2 (anti-dup):** `GrowthStudioEmitter` lift candidate N=2 → `/pm-luana` promotion.
- **BUG-4 (R0 pre-existente):** `luana-mobile-drawer.spec` busca aria-label `"Abrir panel de Luana"` pero `TopBarGlobal.tsx` renderiza `"Abrir panel Luana"` (de R0 `326fa44d`). **NO de R1.** Fix trivial (alinear label o spec) → abrir como R0 bugfix.

### E. Cleanup de datos de prueba
- Drafts "Nuevo ICP" creados durante los tests viven en tenants: `owner.demo` (`7f464ab7-137b-...`, varios ICPs seeded `882e6cac`/`6b17c9a8` + buyer `3df43aef`) y **Chris `e4373552`** (`0397674d` "Nuevo ICP"). Soft-delete los de prueba o decidir cuáles quedan.

---

## 3. Aprendizajes (graduar a learning/rule)

- **DoD #37 verification MASKING (★ el más importante):** la verificación live enmascaró ~5 bugs porque (a) usé `owner.demo` con **UUID-en-URL** (ocultó el bug del slug que TODO usuario real con `tenant_slug` sufre), y (b) verifiqué los **happy paths sembrados**, NO el **cold-start/empty-state** (create-blank). **Regla emergente:** la live-verify DEBE ejercer (1) el camino del **usuario real con su routing exacto** (slug, no UUID de conveniencia) y (2) el **estado vacío/cold**, no solo lo sembrado. Extiende `e2e-seeded-state-masks-cold-start` + `verification-real-not-200`. Candidato a endurecer `.claude/rules/definition-of-done-live-verify.md`.
- **No pedir "probá" sin manejar el flujo exacto yo primero** (Chris lo marcó). El cold/empty path + el FE mid-recompile me hicieron pasarle algo roto.
- **fetchClient SSR + relative URL:** Server Components necesitan URL absoluta (`INTERNAL_API_URL`); el proxy Next solo aplica en browser. Patrón a documentar para futuros SSR fetches.
- **tenant_id: slug-en-URL ≠ UUID-de-API.** El URL usa slug (legible); el header `X-Tenant-ID` usa el UUID de `publicMetadata.tenant_id`. Gemelo del fix vitalia `no-clerk-organizations`. Candidato a rule cross-brand.

---

## 4. Comandos / contexto operativo para la sesión nueva

```bash
# Stack (refrescar desde ESTE worktree — footgun cross-worktree):
make dev-nicolify   # BE :8001 + FE :3001
# Si BE crashea por deps engine nuevas: docker exec luana-dev-nicolify_backend_dev-1 bash -c 'cd /workspace && uv sync' && docker restart luana-dev-nicolify_backend_dev-1
docker exec luana-dev-nicolify_backend_dev-1 alembic upgrade head   # migración 002 abel
curl http://127.0.0.1:8001/health   # {"status":"ok","brand":"nicolify"}

# Tenants / creds (dev · en nicolify/.env.dev gitignored):
#   owner.demo@nicolify.com  → tenant_id 7f464ab7-137b-5e3a-af13-3020aa18814a (sin slug → URL usa UUID)
#   Chris (DEV_APP_CHRIS_*)  → tenant_id e4373552-f70f-58e0-b2bf-55425cc3259f, slug alpaca-purpura
# postgres container: luana-dev-luana_postgres_dev-1 · db nicolify_dev

# Suites:
cd nicolify/frontend && npx vitest run   # 538/538 (determinista)
cd nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke   # FLAKY (ver §2-B)
cd nicolify/backend && ${WS}/.venv/bin/pytest tests/modules/nicolify/abel/ -q   # 70/70
```

- **Evidencia DoD:** `dod-fe-ui-evidence.md`, `chris-flow-observation.md`, `dod-evidence-screens/`, `06-audit/gherkin-matrix.md`, `CHECKPOINTS.md`, `T-FE-review.md` (8 audit iterations).
- **Checkpoint SSoT:** `checkpoint.md` (state reviewing · dod_status substantial · bug ledger).

---

## 5. Orden sugerido para la sesión nueva

1. `/dev-team nicolify nicolify-r1-abel-icp-buyer` — retomar. Step 0 re-toma el lock.
2. **Cerrar deferrals técnicos** (§C): LLM creds dev → extract happy + propuesta baseline · Redis → telemetría · arranque baseline.
3. **Hardening E2E** (§B) — la deuda de flakiness "para siempre" (puede tocar `core/`/`.claude/`).
4. **W1 auth + W2 lift** (§D) vía `/pm-luana` (toca core).
5. **Re-verify live completo** (cold + slug + seeded) → cerrar la masking.
6. **demo_signoff Chris** → `/pm-nicolify` merge → `done`.
7. Graduar aprendizajes (§3) a rule/learning.
8. Cleanup datos prueba (§E).
