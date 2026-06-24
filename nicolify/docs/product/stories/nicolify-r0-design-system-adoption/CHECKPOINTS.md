# Story DoD CHECKPOINTS — nicolify/nicolify-r0-design-system-adoption

> Brand: nicolify
> Auditor: /auditor (Auditor Responsable v5) — review holístico del diff FE-only (T-1..T-5 + fix-rounds 1..4)
> Date: 2026-06-24
> Verdict: **APPROVED**

## Findings + resolución (Auditor Responsable v5)

El gate-runner inicial dio `any_fail=true`. 3 issues distintos — el auditor los resolvió (Carril R/A) o los ruteó (boundary):

| # | Finding | Carril | Resolución |
|---|---|---|---|
| 1 | `test-ds-single-token-source.test.ts:168` anti-FOUC stale — testeaba el `setAttribute('data-theme')` del script custom que `42f759c8` BORRÓ (align-to-vitalia ratificado) | **R** (auditor) | Reescrito al mecanismo real: next-themes inyecta su propio anti-FOUC + `<html suppressHydrationWarning>`. Behavior live-verified (toggle limpio, sin FOUC). test-ds 47/47 ✓ |
| 2 | `eslint.config.mjs` — `eslint-config-next` (`next/typescript`) re-registra `@typescript-eslint` colisionando con `tseslint` typed → ConfigError → **eslint NUNCA corría → ds-lock (SC-2, deliverable central) era VAPOR** | **R** (auditor) | Dedup del plugin (strip de la copia de next; tseslint = fuente única). eslint ahora carga + `@luana/ds/no-arbitrary-value` activo. 0 errores. Origen: dep-drift del merge `c63c7930` (lint sin gate desde entonces). |
| 3 | tsc `core/@luana/hooks/.../create-ssr-safe-persisted-store.ts:195` TS2345 (zustand `persist` StateCreator) | **C / boundary** | **NO self-fix** (engine core/ = promotion gate). Pre-existente (patch zustand HB-78 `8b0a2c7a`, NO esta story). Solo type-check (comment del file: "runtime behavior is correct" → la live-verify funcionó). nicolify src tsc = 0 errores. **Flag /pm-luana** (HB-108). NO bloquea ds-adoption. |
| 4 | 8× `prettier/prettier` errors en arch-tests de **HB-106** (`825ec59a`, batch harness de hoy) — committeados sin formato porque eslint estaba roto | **A** (auditor) | Auto-fix `eslint --fix` en `src/__tests__/architecture/`. 0 errores restantes (219 warnings pre-existentes no bloquean). |

## C1 — Code
- [x] Tests RED→GREEN (TDD; fix #1 alinea test stale a realidad ratificada + live-verified)
- [x] Coverage no regression — vitest 549/549 (era 548/549; +1 por fix #1)
- [x] Lint + format clean — eslint **0 errores** (tras Carril R config + Carril A prettier autofix)
- [x] Type-check clean — nicolify/frontend/src **0 errores** (único error = engine core/@luana/hooks, out-of-scope #3)

## C2 — Spec compliance
- [x] Cada Gherkin SC-1..6 tiene test GREEN (06-audit/gherkin-matrix.md — 6/6 PASS)
- [~] Playwright E2E — visual goldens A/C1/C2/D **deferred** (reconcile HB-79, cubiertos por live-verify); e2e `a11y-subnav` no corrido (cubierto por component-test + live-nav). Follow-up con stack estable.
- [x] Live-verify #37 — write real ejercido (PATCH /abel/icp 200 + persist), dark toggle real ×3, pill. dod_evidence + chris_verify.signoff SATISFIED.
- [n/a] Agentic eval / voice — story no-agentic

## C3 — Architecture
- [x] Arch fitness 0 violations (suite en 549/549: no-kit-mirror, no-cross-brand-import, no-div-layout, no-native-select, no-local-kit-primitive, single-token-source 47/47)
- [x] FSD-Lite boundaries (FE-only; consume @luana/ui-kit, 4 mirrors locales BORRADOS)
- [x] Tenant isolation — consume `useTenantId()` (NO Clerk org); live tenant 7f464ab7 OK
- [x] Anti-duplication — 0 mirror (SC-4 green) + ds-lock no-arbitrary activo
- [x] Cross-module/engine — engine tsc error flagged /pm-luana (HB-108), NO editado desde brand
- [x] Files in scope — solo nicolify/frontend (+ docs story)

## C4 — Cross-cutting
- [x] Spanish neutro — test_spanish_neutro green
- [n/a] PII / Currency — sin superficie monetaria/PII
- [n/a] Migrations — FE-only
- [x] Anti-default-flip (R31) — el lock no-arbitrary off→on fue el flip de la story (T-4): migrar-first + suite verde ambos lados ✓ (ahora con eslint REALMENTE corriendo)
- [x] Security — sin vectores nuevos
- [x] Brand docs R1 — sin `.md` sueltos en nicolify/docs/ raíz
- [x] Brand docs R3 — sin edición manual de auto-gen

## C5 — Trace
- [x] checkpoint.md state=reviewing (→ done lo pone /pm-nicolify al merge)
- [ ] BACKLOG regen post-merge (auto)
- [x] Capability — `design-system/nicolify-ui-homologation.yaml` existe (cap_change_type:new OK)
- [ ] modules MD refresh post-merge
- [x] Learning candidate — eslint dep-drift (lint roto sin gate → lock vapor); engine zustand tsc → /pm-luana
- [x] Story folder ready for archive (R2, en commit del 07-merge)

## Findings summary
- C1: 4/4 ✅
- C2: 3/4 ✅ (1 ~partial: e2e visual/a11y deferred — documentado, cubierto por live-verify)
- C3: 6/6 ✅
- C4: 7/7 ✅ (n/a donde no aplica)
- C5: 4/6 ✅ (2 post-merge auto)

## Verdict
**APPROVED** — story ready for merge by /pm-nicolify.

Surface de la story (nicolify/frontend) 100% verde tras los fixes del auditor (Carril R: test stale + eslint config; Carril A: prettier). El único rojo restante (tsc engine core/@luana/hooks) es **pre-existente + out-of-scope + boundary** → flagged /pm-luana (HB-108), no gate de esta story FE.

## Notes for /pm-nicolify merge
- Capability a actualizar: `design-system/nicolify-ui-homologation.yaml` (cap_change_type: new — change_log[0] type=new).
- 07-merge.md: copiar gherkin-matrix (§1) + comando verify (§5). El run de Playwright visual/a11y queda como follow-up (stack estable) — documentarlo, no falso-verde.
- Learning sugerido: `2026-06-24-eslint-dep-drift-lock-vapor.md` (dep bump rompió eslint flat-config → ds-lock no corría; ningún gate lo cazó entre merge y audit). Promotable: candidate (afecta cualquier brand con eslint-config-next + tseslint typed).
- Promotion candidate cross-brand: **HB-108 engine** — `core/@luana/hooks` tsc TS2345 zustand persist → /pm-luana (afecta tsc de TODA marca que consuma el store SSR-safe).
- Follow-up story/ítem: capturar goldens visuales A/C1/C2/D + correr e2e a11y-subnav con stack estable.
