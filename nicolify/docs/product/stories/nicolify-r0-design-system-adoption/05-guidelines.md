# 05-guidelines · nicolify-r0-design-system-adoption

> Guía de implementación para `builder-frontend` (workhorse). FE-only · 100% adopción del design system homologado. **Engine = OFF-LIMITS.**

## must_load_skills (enforceable — el builder DEBE cargar)

| Skill / Rule | Por qué |
|---|---|
| `nicolify-design-system` (SKILL) | índice cargable del shell-organism + átomos/moléculas/tokens nicolify + catálogo de agentes (SSoT del chrome que se toca) |
| `frontend-expert` (SKILL) | FSD-Lite boundaries · consumir `@luana/ui-kit` como único lego · repoint imports · runtime-quality-checklist |
| `playwright-expert` (SKILL) | visual goldens side-by-side `maxDiffPixelRatio: 0.001` · Clerk auth · gate de goldens `blocked_on` |
| `docs/architecture/luana-platform/design-system-canon.md` | CANON binding (contratos + ejemplos de código) — toda hoja se ARMA del canon |
| `.claude/rules/frontend-visual-fidelity.md` | D1 (design system first) + D2 (mockup adherence) + D3 (scope discipline) + canon binding |
| `.claude/rules/anti-duplication.md` | matar mirrors locales, NO retener; cross-brand mirror ban |
| `.claude/rules/anti-default-flip-audit.md` | workflow OBLIGATORIO al encender el lock no-arbitrary (off→on) |
| `.claude/rules/tdd-mandatory.md` | RED first por capa (arch-test/eslint lock RED → migrar → GREEN); § Default flag flips |
| `.claude/rules/frontend-fsd.md` | boundary matrix FSD-Lite |
| `.claude/rules/spanish-text.md` | microcopy neutro (tuteo, sin voseo) |
| `nicolify/.claude/rules/shell-mockup-per-component.md` | mockup = `_shared.css` + wrapper verbatim; visual golden mockup↔React |
| `.claude/rules/definition-of-done-live-verify.md` | DoD #37 — ejercer la hoja live + write real + leer logs |

## Patterns REQUIRED

1. **Consumir `@luana/ui-kit` como único lego** — toda hoja se ARMA de layout-primitives + archetypes + `EntityWorkspaceLayout`/`EntityInfoCard`/`Group`. Cero `<div>` de layout sustituible por primitiva (canon §0, AC-4).
2. **Repoint mirror→kit** — borrar los 4 mirrors locales + cambiar imports a `@luana/ui-kit`. Adaptar el consumer donde el prop-API diverge (03-arch §6), NUNCA retener el mirror ni editar el kit.
3. **globals.css = valores de marca + escala compartida** — conserva identidad (#635BFF + 7 agent colors + League Spartan/Bree Serif + rem radius); adopta nombres/valores de escala de `@luana/design-tokens`. Arch-test verifica match + identidad (03-arch §Q1).
4. **Tokens, no arbitraries** — todo spacing/radius/font-size/color de tokens. Migrar los arbitraries de ejes lockeados ANTES de encender el lock. Escape solo con `// ds-lock-allow: <razón>` (shrink-only).
5. **Anti-default-flip al encender el lock** — eslint OFF (baseline verde) → migrar → ON (cero) → commit body documenta (03-arch §9.5).
6. **Franjas N3 full-bleed** — `EntitySubNavBar` = tercer ribbon `bg-card` + `border-bottom` + sticky + `border-radius:0`. NUNCA dentro de card redondeada (canon §1.2).
7. **Spanish neutro** — microcopy user-facing tuteo (el kit `DEFAULT_AUTOSAVE_LABELS` ya es neutro).
8. **TDD RED-first** — arch-tests + eslint lock RED antes de migrar; el rojo del lint ES la prueba (no GET 200).
9. **`--radius-control`/`--radius-pill` brand-scoped** — agregar a globals.css `:root`. El render pill de los controles llega tras el kit-lift (no en esta story).
10. **Live-verify (DoD #37)** — ejercer la hoja en dev-app nicolify + un write real (autosave) + leer logs + confirmar render + persistencia.

## Patterns FORBIDDEN

1. ❌ **Editar `core/@luana/**/src/`** — el cambio del kit para consumir `--radius-control` (RN-7) es `/pm-luana` lift EN PARALELO, NO en esta story. Tampoco editar el kit para agregar `agentSlug`/`accentToken` — si hace falta, FLAG lift candidate.
2. ❌ **Tocar `{vitalia,comunify,lupulo}/**`** — cross-brand prohibido.
3. ❌ **Retener un mirror local** de un componente que vive en `@luana/ui-kit` (incluso si diverge — adaptás el consumer o FLAG lift; nunca retener).
4. ❌ **Arbitrary suelto** de ejes lockeados (spacing/radius/font-size/color-hex) sin token ni `// ds-lock-allow`.
5. ❌ **Inventar primitiva/átomo** que ya existe en el kit.
6. ❌ **`<div>` de layout** donde hay layout-primitive.
7. ❌ **Franja N3 dentro de card redondeada** (debe ser tercer ribbon full-bleed).
8. ❌ **Tokens HSL inventados/divergentes** de `@luana/design-tokens` o de la identidad de marca.
9. ❌ **Encender el lock sin migrar primero** los arbitraries (rompe la suite) ni sin el anti-default-flip workflow.
10. ❌ **Cambiar lógica de negocio** de abel/icp — es re-expresión estructural; si la composición exige tocar lógica → FLAG follow-up, no scope creep.
11. ❌ Crear BE/agentic/migration tickets — FE-only.
12. ❌ Migrar arbitraries de `components/ui/**` (shadcn auto-gen, eslint-ignored) salvo que el visual golden lo exija.

## Files in scope (todos bajo nicolify/frontend)

```
MODIFIED:
  src/app/globals.css
  eslint.config.mjs
  package.json                                       (+ @luana/eslint-config workspace:*)
  src/components/shared/shell-organism/SubTabContent.tsx
  src/features/abel/components/icp/{IcpEntityLayoutClient,IcpMasterListView,IcpWorkspaceView,IcpDatosForm,BuyerLeafForm,IcpCard}.tsx
  src/app/[tenantId]/(shell-organism)/_components/ShellLayoutWire.tsx   (si hay <div> sustituible — verify)
  src/components/shared/{WhatForChip,agents/AgentAvatar}.tsx            (migrar text-[10px]→token)
  nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md                  (§7 verify mockups=canon+tokens)
NEW:
  src/__tests__/architecture/test-ds-single-token-source.test.ts
  src/__tests__/architecture/test-ds-tokens-lock.test.ts
  src/__tests__/architecture/test-no-kit-mirror.test.ts
  src/__tests__/architecture/test-no-cross-brand-import.test.ts
  e2e/regression/nicolify-r0-design-system-adoption/abel-icp-fidelity.spec.ts
  e2e/regression/nicolify-r0-design-system-adoption/a11y-subnav.spec.ts
DELETE:
  src/components/shared/shell-organism/EntityWorkspaceLayout.tsx (+ .test.tsx)
  src/components/shared/shell-organism/EntitySubNavBar.tsx (+ .test.tsx)
  src/components/shared/shell-organism/EmptyState.tsx
  src/components/shared/AutosaveBadge.tsx
```

## Files NEVER touched

- `core/@luana/**` — ENGINE. RN-7 `--radius-control` consumo por kit = `/pm-luana` lift (PARALELO). EntitySubNavBar `accentToken`/`agentSlot` = lift candidate (FLAG, no editar).
- `vitalia/**`, `comunify/**`, `lupulo/**` — cross-brand.
- `nicolify/backend/**` — FE-only.

## Notas de divergencia (leer 03-arch §6 antes de repoint)

- **EntitySubNavBar:** kit es agnóstico (`accent`/`primary` semánticos, sin `agentSlug`); el local hardcodea `agent-abel`. Quitar el prop `agentSlug` al repoint. Si el active-leaf accent no matchea el mockup → FLAG lift `/pm-luana` + gatear ESE golden, no retener mirror.
- **EmptyState:** repoint a `ShellEmptyState` (API idéntica — emoji `icon` + `ctaLabel`/`onCtaClick`). Para estados de la hoja list/detail (canon §2.7) usar `EmptyState`/`ErrorState` de `layout` (con `action`).
- **AutosaveBadge:** kit tiene `dirty` extra + `labels` prop, sin `data-testid` override. Mapear el estado local (4 valores) al del kit (5); ajustar selectors de test a `[data-state]`. Evaluar migrar a 1 `FloatingAutosaveIndicator` por página (canon §2.6) si no toca lógica.
- **use-autosave.ts local:** consumir `@luana/hooks::useAutosave` si encaja sin tocar lógica; si no, dejar el hook local (lift ya ocurrió, no es mirror cross-brand) y solo migrar el badge. No bloquea.
