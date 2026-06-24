# Gherkin verification matrix — nicolify/nicolify-r0-design-system-adoption

> Auditor: Phase D (/auditor · Auditor Responsable v5)
> Date: 2026-06-24
> Spec trae § Mapa funcional + § Matriz de cobertura (Opción A) → esta matrix es la mitad trasera del loop.

| Scenario (Gherkin) | Test / verificación | Status | Notes |
|---|---|---|---|
| **SC-1** happy — `abel/icp` render compuesto de primitivas, fiel | V2-tsc (nicolify src 0 err) · V11-vitest 549/549 · **V8-live-verify #37** | ✅ PASS | Live-verified 2026-06-24 (Chrome MCP): master render + CREATE 201 + autosave PATCH 200 + persist. Goldens visuales A/C1/C2/D **deferred** (baselines no capturados, stack inestable — reconcile HB-79); fidelidad cubierta por live-verify. atoms.png capturado (pill). |
| **SC-2** negative — arbitrary nuevo rompe el lock | V3-arch-tokens-lock · V4-eslint-lock-zero | ✅ PASS | ★ eslint estaba ROTO (ConfigError dedup plugin) → lock era vapor; **fixed por auditor** (Carril R). `@luana/ds/no-arbitrary-value` ahora registrado + activo. eslint 0 errores. |
| **SC-3** edge — arbitrary sin token → allowlist justificado | V3 · V4 · V1-single-token-source | ✅ PASS | arch suite verde (en 549). Ratchet shrink-only. |
| **SC-4** adversarial — reaparece mirror local de componente kit | V5-arch-no-kit-mirror · V6-no-cross-brand-import · no-local-kit-primitive | ✅ PASS | arch suite verde. 4 mirrors borrados (T-2). |
| **SC-5** accessibility — navegación teclado en `EntitySubNavBar` | V11-vitest (component) + live-nav (N3 role=tab tablist navegada live) | ✅ PASS | e2e `a11y-subnav.spec.ts` (playwright) NO corrido en esta pasada (requiere preflight+auth); cubierto por component-test (en 549) + nav live verificada en snapshot autenticado. Follow-up: correr el e2e a11y con stack estable. |
| **SC-6** i18n/identidad — Spanish neutro + tokens de marca intactos | V10-arch-spanish-neutro · V1-single-token-source (47/47) | ✅ PASS | arch suite verde. globals.css identidad (#635BFF + agentes + fonts) intacta. |

## Verdict matrix
- 0 scenarios NO-COVERAGE · 0 FAIL · 6/6 PASS.
- Deferidos documentados (NO MISSING mudo): goldens visuales A/C1/C2/D (reconcile, cubiertos por live-verify) + e2e a11y-subnav (cubierto por component-test + live-nav).
- § Matriz de cobertura del spec (Bif-1/2/3 · RN-1..5 · AC-1..5): todos con scenario/test asociado verde. Ningún branch del mapa quedó sin test.

## Cross-check con verificación REAL (test-design-doctrine)
- SC-1 ejercido como acción real (write PATCH 200 + persist tras reload), NO "GET 200". Live-verify #37 satisfecha por el auditor (Chrome DevTools MCP, dev-app.nicolify.com autenticado).
