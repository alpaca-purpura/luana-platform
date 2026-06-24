# 07-merge — nicolify/nicolify-r0-design-system-adoption

> /pm-nicolify · Fase F (reviewing → done) · 2026-06-24
> Verdict /auditor: APPROVED (CHECKPOINTS.md C1-C5 · gherkin 6/6 PASS)
> chris_verify.signoff: SATISFIED (Chris delegó live-verify a Claude + pre-autorizó cierre)

## § 1 — Gherkin verification matrix

Copia de `06-audit/gherkin-matrix.md` (6/6 PASS):

| Scenario | Verificación | Status |
|---|---|---|
| SC-1 happy — abel/icp compuesto de primitivas | tsc src 0 · vitest 549/549 · **live-verify #37** (PATCH 200 + persist) | ✅ PASS |
| SC-2 negative — arbitrary rompe el lock | arch-tokens-lock + **eslint @luana/ds/no-arbitrary-value** (vapor→activo tras fix auditor) | ✅ PASS |
| SC-3 edge — arbitrary sin token → allowlist | arch-tokens-lock + eslint + single-token-source | ✅ PASS |
| SC-4 adversarial — reaparece mirror | no-kit-mirror + no-local-kit-primitive + no-cross-brand | ✅ PASS |
| SC-5 a11y — teclado en EntitySubNavBar | vitest component + live-nav (N3 role=tab tablist) | ✅ PASS |
| SC-6 i18n/identidad — neutro + tokens marca | spanish-neutro + single-token-source (47/47) | ✅ PASS |

0 NO-COVERAGE · 0 FAIL. Deferidos documentados (cubiertos por live-verify, NO MISSING mudo): goldens visuales A/C1/C2/D + e2e a11y-subnav.

## § 2 — Playwright E2E run

- **Visual goldens (V7 abel-icp-fidelity.spec.ts):** baselines A/C1/C2/D **deferred** (stack dev inestable; C2 requiere seed ICP) → reconcile HB-79 (`must_pass:false`). atoms.png capturado (pill). Fidelidad cubierta por **live-verify #37** (Chrome DevTools MCP, dev-app.nicolify.com autenticado): master render + CREATE 201 + autosave PATCH 200 + dark toggle real ×3 + persist.
- **e2e a11y-subnav.spec.ts:** NO corrido esta pasada (requiere preflight+auth); cubierto por component-test (en vitest 549) + nav live verificada.
- **Follow-up (NO bloquea merge):** capturar goldens + correr e2e a11y con stack estable.

## § 3 — Capabilities updated/created

- **CREADA/finalizada:** `nicolify/docs/product/capabilities/design-system/nicolify-ui-homologation.yaml`
  - `status: planned → live` · `cap_change_type: new` · change_log[0] type=new (date 2026-06-24, status: shipped)
  - 3 scenarios (SC-1/SC-4/SC-6, verified_real) + 3 business_rules (RN-1/RN-3/RN-4 con enforcement+code_ref)
  - `user_visible: false` (atributo de calidad · zona Infraestructura→plataforma-tecnica)

## § 4 — Modules MD refreshed

- `nicolify/docs/product/modules/design-system.md` — auto-list (regen `make portfolio` post-merge).
- `nicolify/docs/product/releases/R0.yaml` — story marcada done.

## § 5 — How to verify (reproducible)

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/nicolify/frontend
npx tsc --noEmit                          # nicolify src 0 errores (engine core/@luana/hooks = HB-109 out-of-scope)
npx eslint src/ --cache                   # 0 errores (lock @luana/ds/no-arbitrary-value activo)
npx vitest run                            # 549/549 (incl. arch suite 191: no-kit-mirror/no-div-layout/single-token-source 47/47)
# Live-verify #37 (dark + pill + write): login owner.demo@nicolify.com → /{tenantId}/abel/icp → toggle tema + crear/editar ICP
```

## Commits

- `bc2416e7` — fix(nicolify): /auditor ds-adoption APPROVED (eslint config dedup + test-ds anti-FOUC + reconcile) — 13 files
- `f1cced62` — docs(harness): HB-109 + HB-110
- build (2026-06-15): T-1 cb8de344 · T-2 facdd25b · T-3 4baa816e · T-4 45052deb · T-5 52dd47d3
- dark fix-rounds: b09bc9dc (round-1) · 7411c862 (round-2 pill) · b5acab8e (round-3) · 42f759c8 (align-to-vitalia)
- merge/archive: este commit

## Pendientes (NO bloquean done · ruteados)

- **/pm-luana HB-109:** tsc engine `core/@luana/hooks` (zustand persist StateCreator) — bloquea tsc-gate cross-brand.
- **/pm-luana HB-110:** eslint flat-config dep-drift (lock vapor) — candidato learning cross-brand.
- **Integración main:** squash-to-main + `make promote-to-main`/`sync-all` = decisión de Chris (outward/staging; el branch bundlea abel-icp-buyer en reviewing + storybook-inventory).
