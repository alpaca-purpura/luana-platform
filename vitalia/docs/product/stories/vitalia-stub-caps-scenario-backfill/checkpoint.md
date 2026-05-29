---
story_id: vitalia-stub-caps-scenario-backfill
type: technical-story
agent_owner: config
module: platform
cap_target: multi-cap-backfill            # 20 caps existentes — extend (append scenario+e2e); NO crea caps nuevas
cap_change_type: extend                    # agrega scenarios a caps live existentes (cross_check_3 → verified-live)
state: idea
release: F2
architecture_pattern: ADR-vitalia-004
adr_004_compliance: n/a-with-rationale    # no es story sub-tab/feature; es backfill de verificación (como cockpit-live-reconciliation)
priority: medium
ratified_by_chris: false
parallel_safe: false                       # toca 20 cap YAMLs + tests cross-módulo
last_modified: 2026-05-29
phase: IDEA_AWAITING_REFINE
prior_story: vitalia-cockpit-live-reconciliation   # esta nace del hallazgo de aquella (done 2026-05-29)
---

# Backfill de scenarios+e2e para los 20 caps `stub` (declarados live sin verificación)

> **Origen:** sesión 2026-05-29, post `vitalia-cockpit-live-reconciliation` (done). Chris: "Crea la historia con todo lo aprendido para los stub, para aclararlas, agregarles el escenario real de lo que hace su código." Al reconciliar el ledger quedó claro que ~20 caps declaran `status: live` pero computan `stub`/`declared-live` — tienen código + claim live, pero **sin scenario+e2e formal** (cross_check_3). El cockpit las muestra como drift (honesto: "no puedo probarlo"). Esta story las lleva a `verified-live` agregando el escenario real de lo que su código hace + el test que lo verifica.

## Intent de Chris

Por cada cap `stub` declarada live: **(1) aclararla** (escribir el scenario Gherkin real = qué hace su código hoy), **(2) agregar/cablear el e2e/test** que lo verifica, de modo que `compute_capability_status` la suba a `verified-live` (cross_check_3 deja de marcar drift). Resultado: el conteo "verde real" del cockpit sube y `/drift` se limpia honestamente.

## Hallazgo clave heredado (de la story previa)

- El sweep (T-2 de cockpit-live-reconciliation) confirmó que estas superficies **renderizan OK (0 ROTO)**. El problema NO es que estén rotas — es que **"renderiza OK" ≠ "verified-live"**: les falta el scenario+e2e formal por-cap.
- **Mucho de esto es CABLEAR tests existentes, no escribir nuevos:** varias ya tienen e2e en `vitalia/frontend/e2e/` (topbar.spec.ts, theme-toggle.spec.ts, sign-in specs, admin-*.spec.ts) — solo falta que el `scenario.e2e_test` del cap YAML apunte a ellos. Otras (infra/BE) necesitan un integration/contract test, NO un e2e de UI.
- Matriz de realidad como input: `vitalia/docs/domains/ops/live-reconciliation.md`.

## Worklist — 20 caps target (agrupados por naturaleza del test)

### A. UI / foundation (shell-organism · render OK por sweep · mayormente CABLEAR e2e existente)
- `design-tokens-foundation` · `design-tokens-theme` (→ e2e theme-toggle.spec.ts existe)
- `topbar-global` (→ e2e topbar.spec.ts existe)
- `sign-in-sign-up-pages` (→ e2e auth/sign-in-*.spec.ts existe)
- `shell-foundation-shadcn-tailwind-v4` · `iam-scaffold-slice-1` · `playwright-smoke-suite` · `public-clinic-landing`

### B. Admin Streamlit (e2e admin ya existe · CABLEAR scenario → spec)
- `admin-streamlit-service` · `clinics-crud` · `tenants-crud` · `users-crud` · `streamlit-tenants-users`
- (e2e existentes: admin-login, admin-users-crud, admin-tenants-crud, admin-clinics-extension, admin-hipaa-dual-filter)

### C. Infra / BE (NO UI e2e → integration/contract test; scenario describe comportamiento BE)
- `api-health-endpoint` · `audit-writer-ssot` · `hipaa-dual-filter-decorator` · `migrations-slice-1-schema`
- `otel-sentry-graceful-degradation` · `vitalia-callback-subclasses` · `idempotent-cron-arq-scaffold`

## Excluidos explícitamente (NO esta story)
8 caps `planned` (futuros, sin código aún) — son Fase 2, no backfill: `3-clinic-fixture-latam`, `fiscal-emission-pe`, `medical-pdf-extractors`, `medical-services-offer-preset`, `patient-records-medical-history`, `re-engagement`, `registries-medical-vertical`, `vertical-medical-extension-sdk`.
Y las 33 `deprecated` (slice-1 superseded) — se reconstruyen en Fase 2, no se backfillean.

## Definición de DONE
- Cada uno de los 20 caps: scenario Gherkin real (qué hace el código) + `e2e_test`/`test` que existe y pasa.
- `compute_capability_status --brand vitalia`: los 20 suben de `stub`/`declared-live` → `verified-live` (o `partial` justificado si la verificación es parcial honesta).
- `validate_code_cap_bidirectional` cross_check_3: 0 drift (HARD) y conteo verified-live sube de 2 → ~22.
- `/drift` del cockpit: se limpia (deja de mostrar estos 20 como drift).
- Disciplina: cero código de feature nuevo (solo scenarios + tests + wiring); cero reconstrucción; cero engine edit. Caben fixes inline triviales si un test revela algo, con gates verdes.

## Prior art scan (preliminar — el refine lo formaliza)
- `vitalia/docs/domains/ops/live-reconciliation.md` (matriz, input directo)
- `vitalia/docs/product/stories` archive `vitalia-cockpit-live-reconciliation` (story madre, done)
- `docs/process/lifecycle.md` § Fase 2 (backfill de scenarios — esta story ES eso)
- `scripts/{compute_capability_status,validate_code_cap_bidirectional}.py` (gates objetivos)
- `vitalia/frontend/e2e/**` (tests existentes a cablear)

## next_action
- `/pm-vitalia` refinemos → `/po` (technical-story) produce 01-spec con: scenario real por cap (3 baterías A/B/C) + criterio wiring-vs-writing + gate cross_check_3. Luego `/architect` (tickets por grupo A/B/C) → `/dev-team` → `/auditor` → merge.
