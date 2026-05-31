# 07-merge — platform/build-autosave-primitive-luana

> Type: ui-story (librería @luana) · Merged by: /pm-luana · Date: 2026-05-31 · Auditor: APPROVED

## § 1 — Gherkin verification matrix
Ver `06-audit/gherkin-matrix.md`: **11/11 scenarios verde-determinista** (Vitest). useAutosave 11/11 · AutosaveBadge 32/32 · nicolify form-runtime 143/143 + tsc.

## § 2 — E2E / test run
Librería → Vitest unit/component (sin backend; el E2E real-backend vive en las stories de adopción).
```bash
cd core/@luana/hooks && npx vitest run src/__tests__/useAutosave.test.ts      # 11/11
cd core/@luana/ui-kit && npx vitest run src/__tests__/AutosaveBadge.test.tsx   # 32/32
cd nicolify/frontend && npx tsc --noEmit && npx vitest run src/components/form-runtime/   # 143/143
```

## § 3 — Surfaces construidos / outcome
- `core/@luana/schemas` — AutosaveContract (`autosave.ts`).
- `core/@luana/hooks` — `useAutosave` (getTokenReady, debounce 2000 default, retry, telemetry opt-in, sin @clerk).
- `core/@luana/ui-kit` — `<AutosaveBadge>` (aria-live, contraste AA emerald-700) + showcase de referencia.
- `nicolify/frontend/src/components/form-runtime/` — reescrito sobre la primitiva (API pública intacta, 800ms preservado, 143 tests verdes).
- Outcome `docs/product/outcomes/autosave-primitive-platform.md` — primitiva construida; stories de adopción (vitalia pantallas, nicolify pantallas) quedan abiertas.
- Semver: bump minor `@luana/{schemas,hooks,ui-kit}` + CHANGELOG por package.

## § 4 — Cap / modules
No es cap de brand (primitiva de plataforma). cap_target: null. Las caps de brand se actualizan en las stories de adopción.

## § 5 — How to verify (reproducible)
```bash
# La primitiva existe + se exporta + tipa limpio:
grep useAutosave core/@luana/hooks/src/index.ts
grep AutosaveBadge core/@luana/ui-kit/src/index.ts
# No acopla a Clerk:
! grep -rE "from ['\"]@clerk/" core/@luana/{hooks,ui-kit,schemas}/src
# Tests (ver § 2). nicolify sin regresión: 143/143.
```

## Commits
`77be3d0f` (T-1 hooks) · `bf86031c` (T-2 ui-kit) · `bc8c509a`+`adfe0fba` (T-3 nicolify) · `4e728cef` (auditor self-fix) · + docs.

## Follow-up (en el outcome)
- Adopción vitalia: consolidar `features/lisa/hooks/use*Autosave.ts` (4) → `useAutosave` (story consumer).
- Adopción nicolify: migrar pantallas restantes.
- Saneamiento @luana tsc-debt: `observed-bugs/2026-05-31-luana-hooks-uikit-tsc-lift-debt.md` (hooks acoplados a brand mal lifteados).
- WARN: `vite@^6` devDep agregado a nicolify (tooling, aceptable).
