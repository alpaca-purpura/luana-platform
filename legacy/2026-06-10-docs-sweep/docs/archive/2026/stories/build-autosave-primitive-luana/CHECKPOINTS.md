# Story DoD CHECKPOINTS — platform/build-autosave-primitive-luana

> Brand: platform · Auditor: auditor-frontend (independiente) · Date: 2026-05-31
> Type: ui-story (librería @luana) · Verdict: **APPROVED** (post Carril A self-fix)

## C1 — Code
- [x] Tests RED → GREEN (TDD · Vitest)
- [x] Coverage: useAutosave 11/11 · AutosaveBadge 32/32 · nicolify form-runtime 143/143
- [x] Lint clean (auditor self-fix de 5 ESLint errors en nicolify → 0)
- [x] Type-check: archivos nuevos de autosave tsc-clean · nicolify tsc 0 errores
      (⚠️ @luana hooks/uikit tsc por-package rojo PRE-EXISTENTE — observed-bug, ortogonal, verificado git blame)

## C2 — Spec compliance
- [x] 11/11 Gherkin scenarios con test GREEN (06-audit/gherkin-matrix.md)
- [x] a11y: AutosaveBadge aria-live (assertive error / polite resto) + contraste AA (emerald-700 5.49:1 — evitó el bug #009966)
- n/a Playwright E2E (librería — E2E real vive en stories de adopción)

## C3 — Architecture
- [x] Anti-duplication: la primitiva es SSoT único (@luana) — colapsa 4 hooks idénticos vitalia + 2 badges
- [x] CONN (cero isla): exports en barrels + consumers reales (showcase + nicolify form-runtime)
- [x] No @clerk coupling (getToken inyectado — guard verde)
- [x] nicolify behavior preservado (API pública intacta, 800ms debounce, 143 tests sin modificar)
- [x] Files in scope respetados (solo @luana + nicolify form-runtime, autorizado ADR-012)

## C4 — Cross-cutting
- [x] Spanish neutro (labels AutosaveBadge default, sin voseo)
- [x] Security: sin vectores (librería pura, auth inyectada)
- [x] ADR-012 accepted autoriza el touch a core/@luana + nicolify (NO es cross-brand pollution)
- [ ] WARN (non-blocking): `vite@^6` devDep agregado a nicolify/frontend (fix de test-env pre-existente) — aceptable, tooling

## C5 — Trace
- [x] checkpoint.md → reviewing (→ done por /pm-luana al merge)
- [x] Outcome `autosave-primitive-platform` (cap de brand se actualiza en stories de adopción)
- [x] Story folder lista para archive
- [x] Follow-up: observed-bug @luana tsc lift-debt (story de saneamiento aparte) + stories de adopción (vitalia, nicolify pantallas)

## Findings summary
- C1: 4/4 ✅ (1 nota tsc pre-existente) · C2: 2/2 ✅ · C3: 5/5 ✅ · C4: 3/4 ✅ (1 WARN) · C5: 4/4 ✅

## Verdict
**APPROVED** — primitiva de autoguardado lista para merge by /pm-luana. WARN (vite devDep) non-blocking.

## Notes for /pm-luana merge
- Outcome `autosave-primitive-platform`: marcar la primitiva construida; stories de adopción (vitalia pantallas, nicolify pantallas) quedan en el outcome.
- Learning sugerido: el lift de @luana dejó hooks acoplados a brand con tsc roto (observed-bug) → patrón "lift no deja deuda tsc" promotable.
- Follow-up stories: (1) saneamiento @luana tsc-debt, (2) adopción vitalia (consolidar use*Autosave → useAutosave).
