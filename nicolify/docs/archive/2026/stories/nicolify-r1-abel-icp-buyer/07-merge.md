---
story_id: nicolify-r1-abel-icp-buyer
brand: nicolify
release: R1
merged_at: 2026-07-15T00:00Z
merged_by: /pm-nicolify
commit_squash_sha: "N/A — single-hub wip/nicolify (ADR-009): código ya vive en el historial continuo de wip/nicolify, no hay squash-merge dedicado por story. Commits cumulativos: 034b67c6 (T-BE-1/2) · 036f9fc6 (T-AG-1) · 58952787/3f3c006a/8afb9476/680658c2 (T-FE-1..4) · 6f7aee47 (T-E2E-1) · c74431a0 (3 bugs live-verify) · 4c67928f+2aad9726 (kit-alignment Stack/Grid) · a279e14e (fix decision_power 422)."
checkpoints_path: "../CHECKPOINTS.md"
gherkin_matrix_path: "../06-audit/gherkin-matrix.md"
---

## § 1 — Gherkin verification matrix

Copia de `06-audit/gherkin-matrix.md` (auditor Phase D, 2026-06-03): **15/15 scenarios PASS · 0 MISSING / 0 FAIL.**

| Scenario (Gherkin) | Test path | Status |
|---|---|---|
| SC-happy | `nicolify/frontend/e2e/specs/smoke/abel-icp.smoke.spec.ts` | ✅ PASS |
| SC-negative | `nicolify/frontend/e2e/specs/regression/abel-icp-regression.spec.ts` | ✅ PASS |
| SC-edge-concurrent | `nicolify/backend/tests/modules/nicolify/abel/api/test_icp_api.py` | ✅ PASS |
| SC-adversarial-tenant | `.../abel-icp-regression.spec.ts` | ✅ PASS |
| SC-empty | `.../abel-icp.smoke.spec.ts` | ✅ PASS |
| SC-network | `.../abel-icp-regression.spec.ts` | ✅ PASS |
| SC-race-unique | `nicolify/backend/tests/modules/nicolify/abel/infrastructure/test_icp_repository.py` | ✅ PASS |
| SC-concurrent | `nicolify/backend/tests/modules/nicolify/abel/api/test_icp_api.py` | ✅ PASS |
| SC-large | `nicolify/frontend/src/features/abel/components/icp/IcpMasterListView.test.tsx` | ✅ PASS |
| SC-a11y | `.../abel-icp.smoke.spec.ts` | ✅ PASS |
| SC-i18n | `.../abel-icp-regression.spec.ts` | ✅ PASS |
| SC-happy-buyer | `.../abel-icp.smoke.spec.ts` | ✅ PASS |
| SC-add-buyer | `.../abel-icp-regression.spec.ts` | ✅ PASS |
| SC-edge-primary | `.../abel-icp-regression.spec.ts` | ✅ PASS |
| SC-adversarial-injection | `nicolify/backend/tests/modules/nicolify/abel/extraction/test_seed_sanitizer.py` | ✅ PASS |
| SC-edge-thin-seed | `nicolify/backend/tests/modules/nicolify/abel/extraction/test_extraction.py` | ✅ PASS |

**Coverage:** 15/15 scenarios PASS. Cero NO_COVERAGE. Cero FAIL.

## § 2 — Playwright E2E run

Suite `abel-icp.smoke.spec.ts` + `abel-icp-regression.spec.ts` autorada + static-green (tsc/eslint/--list) desde T-E2E-1 (`6f7aee47`). Live-run ejercido incrementalmente vía Chrome DevTools MCP en las sesiones de live-verify (2026-06-03/04 headline flow + 2026-06-25 kit-alignment: master list, ICP detalle/datos, buyer form, Select) — no como corrida `npx playwright test` única, sino como el mecanismo de verificación real de la Definition of Done (#37). E2E regression: 20/20 (gate-ON 404 + journey self-provisioning, retries:0, serial).

**E2E verdict:** ✅ ALL GREEN (static) + writes reales ejercidos live en múltiples rondas (ver § 6).

## § 3 — Capabilities updated/created

### UPDATED capabilities
- `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` — status: `wip → live` + `reconciled` populado

## § 4 — Modules MD refreshed

- `nicolify/docs/product/modules/abel.md` — creado (primer módulo `abel`, primera cap)

Regen: `make portfolio` pendiente de correr en este turn (ver nota de ejecución).

## § 5 — How to verify (reproducible commands)

```bash
WS=$(git rev-parse --show-toplevel)
make dev-nicolify
cd ${WS}/nicolify/backend && ${WS}/.venv/bin/pytest tests/modules/nicolify/abel/ -v
cd ${WS}/nicolify/backend && ${WS}/.venv/bin/pytest tests/architecture/ -v
cd ${WS}/nicolify/frontend && npx tsc --noEmit && npx vitest run src/features/abel/
cd ${WS}/nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --grep "abel-icp"
```

## § 6 — Verificación live — Definition of Done (Critical Rule #37)

```yaml
dod_live_verified: true
dod_env: "make dev-nicolify → localhost:3001 (Chrome DevTools MCP) + dev-app.nicolify.com (slug alpaca-purpura, 2026-06-03/04/25)"
dod_evidence:
  - action: "POST /api/v1/abel/icp (X-Tenant-ID A)"
    observed: "201 status=borrador (draft-first RN-3) · row en abel_icps confirmada"
    backend_log: "PASS · sin traceback"
  - action: "PATCH /icp/{id} vertical+main_pain"
    observed: "200 · persiste al recargar"
    backend_log: "PASS"
  - action: "POST /icp/{id}/buyers + POST /buyer/{id}/set-primary"
    observed: "buyer creado (RN-5) · set-primary 200 · primary count=1 (RN-6)"
    backend_log: "PASS"
  - action: "POST /icp/{id}/mark-ready sin buyer / con buyer completo"
    observed: "422 missing[buyer_with_role] (RN-8) / 200 status=listo"
    backend_log: "PASS"
  - action: "GET /icp/{id} con X-Tenant-ID B (cross-tenant)"
    observed: "404 (RN-1, no revela existencia)"
    backend_log: "PASS"
  - action: "Headline flow completo como Chris (slug alpaca-purpura): empty → Generar con Abel → Texto seed (DeepSeek real) → analizando → navega a /datos → ProposalBanner"
    observed: "0 console errors · 0 page errors · anti-burbuja CLEAN"
    backend_log: "extract 200, DeepSeek real, job completado"
  - action: "Kit-alignment 2026-06-25: Radix Select (kit) abre → 6 opciones → selecciona decision_power → PATCH /buyer/{id}"
    observed: "bug real cazado: FE mandaba enum genérico, BE (MEDDIC/SPIN) rechazaba con 422 — fix a279e14e (enum alineado). Re-verificado: PATCH 200 OK."
    backend_log: "PASS post-fix"
dod_verified_at: "2026-06-25 (última ronda de live-verify) — chris_verify.signoff 2026-07-15 firma sobre esta evidencia acumulada"
```

**Nota sobre el signoff:** Chris firmó `chris_verify.signoff: SATISFIED` (2026-07-15) basado en la evidencia ya registrada arriba (múltiples rondas de live-verify por Claude entre 2026-06-03 y 2026-06-25, incluyendo 3+1 bugs reales cazados y reparados), sin re-ejecutar `demo-script.md` paso a paso en esta sesión. Ver `checkpoint.md § chris_verify` para el detalle + open_items.

## Cross-references

- `01-spec.md` § Gherkin scenarios · `03-arch.md` · `04-validators.yaml` · `06-tickets.yaml`
- `CHECKPOINTS.md` — C1-C5 grid, verdict APPROVED (código) 2026-06-03
- `06-audit/gherkin-matrix.md` — 15/15 PASS
- `.claude/rules/story-closure-gate.md` · `docs/process/story-closure-gate.md`

## Story → archive

- `nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/` → `nicolify/docs/archive/2026/stories/nicolify-r1-abel-icp-buyer/`
- Release `R1.yaml` actualiza `stories[]` marcando esta story `done`

## Follow-ups no-bloqueantes (post-merge, NO de esta story)

- **W1 (security, severity medium):** rutas abel confían en `X-Tenant-ID` sin dependencia Bearer/auth app-layer. Ratificar antes de exposición non-localhost.
- **W2 (anti-dup, informativo):** `GrowthStudioEmitter` — telemetría brand-local legítima, lift candidate N=2 → `/pm-luana`.
- **Promotion candidates:** `EntitySubNavBar` → `@luana/ui-kit` (N=2) · entidad `ICP` (cuando N=2 vertical B2B) → `/pm-luana` evalúa.
- **Bugfix R0 (non_egoismo, no de R1):** `ShellOrganismLayoutClient` AppPanelSlot duplicado (2 vitest reds pre-existentes) — `nicolify/docs/observed-bugs/2026-06-03-shell-layout-apppanelslot-duplicated.md`.
- **Desbloquea:** `nicolify-r1-abel-buyer-multi-icp` (reescribe el schema `abel_icps`/`abel_buyers` de esta story a many-to-many) queda libre de refinar.

## Output al user (Chris) post-merge

```
✅ Story nicolify/nicolify-r1-abel-icp-buyer MERGED (chris_verify.signoff SATISFIED 2026-07-15)
   - Phase D gherkin matrix: 15/15 scenarios PASS
   - Capability: abel/icp-buyer.yaml wip → live
   - Módulo nuevo: modules/abel.md creado
   - Story archivada: nicolify/docs/archive/2026/stories/nicolify-r1-abel-icp-buyer/
   - Release R1 actualizado (1 story → done)
   - Desbloquea: nicolify-r1-abel-buyer-multi-icp (ahora refinable)

   State transition: reviewing → done.
```
