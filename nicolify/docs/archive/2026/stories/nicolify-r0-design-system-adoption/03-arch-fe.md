---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
surface: frontend
owner_builder: builder-frontend          # workhorse (NO agentic, NO flagship)
owner_auditor: auditor-frontend          # flagship
architecture_pattern: ADR-014-design-system-homologation
---

# 03-arch-fe · nicolify-r0-design-system-adoption (FE split)

> Esta story es **FE-only**. El contrato completo vive en `03-arch.md` (consolidado = este split). No hay `03-arch-be.md` ni `03-arch-agentic.md`. Este archivo es el quick-reference del builder-frontend.

## Lo esencial para builder-frontend

**Es ADOPCIÓN, no creación.** Consume `@luana/ui-kit` 0.4.1 + `@luana/design-tokens` 0.2.0 + `@luana/eslint-config` 0.1.0. NUNCA editás `core/@luana/**` ni `{vitalia,comunify,lupulo}/**`.

### 4 work-streams (detalle en 03-arch.md)

1. **globals.css ↔ design-tokens** (§ Q1 + §6): conserva VALORES de marca (#635BFF + 7 agent colors + League Spartan/Bree Serif + rem radius); adopta escala compartida (spacing valor · radius nombres · typography nombres · z-index). Agregá `--radius-control: var(--radius-pill)` + `--radius-pill`. Arch-test verifica match + identidad.
2. **Matar 4 mirrors** (§6): `EntityWorkspaceLayout` · `EntitySubNavBar` · `EmptyState` · `AutosaveBadge` locales → DELETE + repoint a `@luana/ui-kit`. **OJO divergencias:** EntitySubNavBar (kit agnóstico, sin `agentSlug`) · EmptyState (→ `ShellEmptyState`, API idéntica) · AutosaveBadge (kit tiene `dirty` extra + `labels`, sin `data-testid` override).
3. **Re-expresar abel/icp + shell chrome** (§6.5): componer de layout-primitives + archetypes + `EntityWorkspaceLayout`/`EntityInfoCard`/`Group`. Cero `<div>` de layout sustituible.
4. **Encender lock no-arbitrary** (§9.5): migrar arbitraries de ejes lockeados a tokens FIRST → wire `@luana/ds/no-arbitrary-value = error` en `eslint.config.mjs` cero allowlist. **Anti-default-flip: correr eslint OFF (baseline) + ON (cero) + commit body documenta.**

### Tokens del kit que consumís (cero NEW)

- layout: `PageContainer`, `PageContentStack`, `PageHeader`, `PageSection`, `Toolbar`, `FilterBar`, `EmptyState`, `ErrorState`, `ListPageSkeleton`, `FormPageSkeleton`, `Pagination`, `DetailLayout`, `FormLayout`
- archetypes: `ListPageScaffold`, `DetailPageScaffold`, `FormPageScaffold`, `DashboardPageScaffold`
- N3: `EntityWorkspaceLayout`, `EntitySubNavBar`, `EntityInfoCard`, `EntityPicker`
- autosave: `AutosaveBadge`, `FloatingAutosaveIndicator`, `Group`, `GroupHeader`, `WhatForChip`
- shell: `ShellEmptyState` (emoji + ctaLabel), átomos shadcn

### RN-7 (pill controls) — DEPENDENCIA EXTERNA

NO escribas ningún ticket/edit a `core/@luana/**`. El kit `Button`/`Input`/`Select`/`Textarea` hardcodea `rounded-md` — que consuma `--radius-control` es lift `/pm-luana` EN PARALELO. Esta story solo agrega el token a globals.css; el render pill llega tras el lift + bump `@luana/ui-kit`. El golden de control-radius está `blocked_on: kit-radius-control-lift`; el resto corre ahora.

### Fidelity

mockup = `mockups/ds-base.html` (compone de `mockups/_shared.css`). Visual golden `maxDiffPixelRatio: 0.001`. Live-verify dev-app obligatorio (DoD #37).

### Gates

`tsc --noEmit` + `eslint src/ --cache` (con el lock ON) + `vitest run` + arch-tests (4 nuevos + 5 existentes) + e2e (fidelity + a11y) + live-verify. Native-first.
