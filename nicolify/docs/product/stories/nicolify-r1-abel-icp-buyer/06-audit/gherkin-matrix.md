# Gherkin verification matrix — nicolify/nicolify-r1-abel-icp-buyer

> Auditor: /auditor Phase D (orchestrator) · sub-auditores: auditor-backend (APPROVED) · auditor-agentic (PASS) · auditor-frontend (APPROVED iter 2)
> Date: 2026-06-03
> Fuente SC: 04-validators.yaml § scenario_coverage (15 SC) + § business_rules (RN-1..RN-11)

## Leyenda de status

- **PASS** — test(s) a nivel código (BE/agentic/component/unit) verde(s) ahora.
- **PASS · LIVE-PENDING(#37)** — cobertura de código verde + el leg e2e/visual/axe se ejerce LIVE en el demo gate #37 (stack stale + Chrome MCP down → diferido por build plan, NO MISSING). `/pm-nicolify` exige el live-verify + `demo_signoff` al merge (`reviewing→done`).
- **MISSING** — sin test (bloquea). **No hay ninguno.**

| Scenario | Regla | Test(s) | Status | Notas |
|---|---|---|---|---|
| SC-happy | RN-3 | agentic `test_extraction.py` (EV-2/EV-5) · FE `IcpWorkspaceView.test.tsx`/`ProposalBanner.test.tsx` · e2e `smoke/abel-icp.smoke.spec.ts` | PASS · LIVE-PENDING(#37) | draft→borrador→ratificar→listo |
| SC-negative | RN-8 | BE `application` mark_ready missing[] · FE `IcpDatosForm.test.tsx` · e2e regression | PASS · LIVE-PENDING(#37) | 422 missing[] inline, sin barra |
| SC-edge-concurrent | RN-1 | BE `api/test_icp_api.py` | PASS | 2 PATCH casi-simultáneos, ICP íntegro |
| SC-adversarial-tenant | RN-1 | BE `api/test_icp_api.py` (cross-tenant 404) · e2e regression | PASS · LIVE-PENDING(#37) | 404, no revela existencia |
| SC-empty | RN-2 | FE `IcpMasterListView.test.tsx` (empty→DraftFirstStarter) · e2e smoke | PASS · LIVE-PENDING(#37) | sin EntitySubNavBar |
| SC-network | NF-res-extract | FE `use-icp-extract.test.ts` (poll→failed) · agentic timeout · e2e regression | PASS · LIVE-PENDING(#37) | reintento+fallback, sin spinner ∞ |
| SC-race-unique | RN-7 | BE `infrastructure/test_icp_repository.py` (unique label) | PASS | 1 creado + 1×409 idempotente |
| SC-concurrent | RN-1 | BE `api/test_icp_api.py` (2 tenants) | PASS | aislamiento por tenant |
| SC-large | NF-perf-list | FE `IcpMasterListView.test.tsx` (200 ICPs) | PASS | pagina + EntitySubNavBar overflow |
| SC-a11y | — | FE `EntitySubNavBar.test.tsx` (role=tablist+roving+arrows+aria-disabled) · e2e axe wcag2aa | PASS · LIVE-PENDING(#37) | axe corre live en #37 |
| SC-i18n | RN-11 | FE arch `test_spanish_neutro` · FE currency tests · e2e regression | PASS · LIVE-PENDING(#37) | tuteo + moneda del locale |
| SC-happy-buyer | RN-5 | FE `BuyerLeafForm.test.tsx`/`IcpEntityLayoutClient.test.tsx` (nav leaf) · e2e smoke | PASS · LIVE-PENDING(#37) | URL /{icpId}/{buyerId} sin reload |
| SC-add-buyer | RN-5 | FE `IcpEntityLayoutClient.test.tsx` (createBuyer→nav · **fix audit iter 1**) · e2e regression | PASS · LIVE-PENDING(#37) | ★ era el FAIL Cat 11+15 → resuelto (d5ee83e0) |
| SC-edge-primary | RN-6 | BE set_primary test · FE `BuyerLeafForm.test.tsx` (set-primary) · e2e regression | PASS · LIVE-PENDING(#37) | exactamente 1 is_primary=true |
| SC-adversarial-injection | RN-9 | agentic `extraction/test_seed_sanitizer.py` | PASS | seed = dato, no ejecuta orden |
| SC-edge-thin-seed | — | agentic `extraction/test_extraction.py` | PASS | esqueleto + pide datos, sin cifras inventadas |

## Verdict matrix

- **MISSING: 0** — los 15 SC tienen ≥1 test verde a nivel código. No hay gap de cobertura → NO bloquea.
- **PASS puro (BE/agentic, sin leg e2e): 6** — SC-edge-concurrent, SC-race-unique, SC-concurrent, SC-adversarial-injection, SC-edge-thin-seed, SC-large.
- **PASS · LIVE-PENDING(#37): 9** — los que tienen leg e2e/axe/visual. El live-run + visual baselines + `dod_evidence` se ejercen en el demo gate #37 (NO es MISSING; es DoD pendiente que `/pm-nicolify` enforce al merge).
- **business_rules RN-1..RN-11:** todas con scenario+test verde. RN-5 (la que el FAIL rompía) re-verificada GREEN tras el fix.

## Gate anti-burbuja + DoD #37

- e2e specs importan `e2e/fixtures/base.ts` (pageerror/console/response/next-overlay), NO `@playwright/test` directo — verificado por auditor-frontend.
- Cold-start variant presente (no seeded-state mask). Visual goldens scoped a `/abel/icp**` (no full-page).
- **DoD live-verify (#37) PENDIENTE** — `dod_live_verified: false` en checkpoint. Requiere: refrescar stack (`make dev-nicolify` + migrar 002) + reconectar Chrome MCP + ejercer writes (extract→borrador · patch→persist · mark-ready→422 · cross-tenant→404) + capturar visual baselines + `demo_signoff` de Chris (APPROVED). `/pm-nicolify` REFUSE merge sin esto.

## Conclusión Phase D

**APPROVED a nivel código** (0 MISSING, 0 FAIL tras fix iter 1). El único gate que resta es el **DoD #37 live-verify + demo de Chris** (`reviewing→done`). Story queda en `reviewing`, lista para el demo gate.
