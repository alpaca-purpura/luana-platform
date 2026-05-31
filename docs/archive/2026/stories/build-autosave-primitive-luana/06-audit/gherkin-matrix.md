# Gherkin verification matrix — platform/build-autosave-primitive-luana

> Auditor: Phase D · Date: 2026-05-31 · type: ui-story (librería @luana, Vitest)

| Scenario (01-spec.md) | Test | Status |
|---|---|---|
| debounce-coalesce | @luana/hooks useAutosave.test.ts | ✅ PASS |
| save-success-badge | useAutosave.test.ts + AutosaveBadge.test.tsx | ✅ PASS |
| auth-ready-no-error-permanente | useAutosave.test.ts (getTokenReady) | ✅ PASS |
| error-recovery-retry | useAutosave.test.ts | ✅ PASS |
| concurrent-edits-last-wins | useAutosave.test.ts | ✅ PASS |
| network-failure | useAutosave.test.ts | ✅ PASS |
| unmount-cancels | useAutosave.test.ts | ✅ PASS |
| badge-aria-live | AutosaveBadge.test.tsx (aria-live + contraste AA) | ✅ PASS |
| badge-i18n-neutro | AutosaveBadge.test.tsx (labels neutro/inyectables) | ✅ PASS |
| telemetry-opt-in | useAutosave.test.ts | ✅ PASS |
| nicolify-form-runtime-sin-regresion | nicolify form-runtime suite (143/143) + tsc | ✅ PASS |

**Resumen:** 11/11 scenarios verde-determinista (Vitest unit/component, sin backend — librería). useAutosave 11/11, AutosaveBadge 32/32, nicolify form-runtime 143/143 + tsc. E2E real-backend = stories de adopción de brand.
