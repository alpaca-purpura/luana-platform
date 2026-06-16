---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
arch_version: 1
schema_version: v4.1
architecture_pattern: ADR-014-design-system-homologation   # cross-cutting adoption, NOT a sub-tab
adr_001_compliance: n/a                                     # ADR-nicolify-001 governs sub-tabs; this is design-system adoption (cross-cutting)
architect_run_on: 2026-06-16
verification_nature: ambas                                  # técnica (eslint lock + arch-test + tsc) + funcional (fidelidad visual live)
demo_required: true
surfaces: [frontend]                                        # FE-only — no BE, no agentic, no migration
---

# 03-arch · nicolify-r0-design-system-adoption — Adopción Fase 3 (FE-only)

> Contrato FE consolidado para `builder-frontend` (workhorse). **Cero BE, cero agentic, cero migración.**
> Per-surface split: este archivo ES el split FE (no hay BE/agentic). Es 100% adopción del design system homologado (ADR-014) — consume `@luana/ui-kit` 0.4.1 + `@luana/design-tokens` 0.2.0 + `@luana/eslint-config` 0.1.0. **Cero creación de capas nuevas.**

## 0. Context Summary

- **Story:** `nicolify-r0-design-system-adoption` (R0 Fundación · "empezar homologado" antes de crecer · ADR-014 HARD).
- **Architect run on:** 2026-06-16.
- **Módulos tocados:** `design-system` (bucket `code:design-system`) — `nicolify/frontend/src` broad + `globals.css` + `eslint.config.mjs`. Converge `features/abel/**` (Bif-5 a).
- **Surface → builder → auditor mapping** (PM usa para spawnear agentes):

  | Surface | Builder | Auditor |
  |---|---|---|
  | `nicolify/frontend/src/app/(shell-organism)/**` | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |
  | `nicolify/frontend/src/components/shared/**` | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |
  | `nicolify/frontend/src/features/abel/**` | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |
  | `nicolify/frontend/src/app/globals.css` + `eslint.config.mjs` + `__tests__/architecture/**` | `builder-frontend` (workhorse) | `auditor-frontend` (flagship) |

  **NINGÚN** surface BE / agentic. `core/@luana/**` = OFF-LIMITS (engine — RN-7 lift escalado a `/pm-luana` en PARALELO, no en esta story).

- **Skills consultados (decisión tomada de cada uno):**
  - `frontend-expert` — FSD-Lite boundaries OK; consume `@luana/ui-kit` como único lego; repoint imports mirror→kit; arbitrary lock workflow.
  - `frontend-visual-fidelity` + `design-system-canon.md` (CANON binding) — toda hoja se ARMA del canon (layout-primitives + archetypes), franjas N3 full-bleed, `EntityWorkspaceLayout` para list/detail, cero `<div>` de layout sustituible, cero arbitrary.
  - `playwright-expert` — visual goldens side-by-side vs mockup (`maxDiffPixelRatio: 0.001`); gate del golden de **radio de control (pill)** en el kit-lift; a11y subnav.
  - `brand-expert`/`offer-expert` — N/A (no toca brand-studio ni offer; abel/icp se RE-EXPRESA estructuralmente, no cambia lógica de negocio).
- **CONTEXT-BRIEF source:** ausente (story chica · brief skipped) → self-ran greps Path B (ver § Existing systems audit).
- **capability YAML afectadas (post-merge):** `nicolify/docs/product/capabilities/design-system/nicolify-ui-homologation.yaml` (`cap_change_type: new`). Converge la cap `abel.icp-buyer` (FE re-expresado — su `dev_preview.main_component` sigue apuntando a los mismos archivos, ahora compuestos del kit). nicolify = enforcement cap-format **advisory** (no HARD como vitalia/comunify).
- **Architecture gates que deben seguir verdes:** `nicolify/frontend/src/__tests__/architecture/{no-store-in-ssr-skeleton,test_agent_tw_classes,test_shell_routes_ssot,test_spanish_neutro,test-tenant-id-not-from-params}.test.ts` + los NUEVOS de esta story (§ 12).

## Prior art audit (anti-duplication-refining · scan corrido 2026-06-16)

> **Resultado: ADOPCIÓN PURA — cero creación de capas nuevas.** Confirma el scan de `/pm-nicolify`+`/pm-luana` (checkpoint § Prior art scan) con greps propios.

### Engine consumido VERBATIM (no recrear)

- **`@luana/ui-kit` 0.4.1** (`core/@luana/ui-kit/src/index.ts` — SSoT exports verificado):
  - **layout-primitives** (`src/layout/`): `PageContainer`, `PageContentStack`, `PageHeader`, `PageSection`, `Toolbar`, `FilterBar`, `EmptyState`, `ErrorState`, `ListPageSkeleton`, `FormPageSkeleton`, `Pagination`, `DetailLayout`, `FormLayout`.
  - **archetypes** (`src/archetypes/`): `ListPageScaffold`, `DetailPageScaffold`, `FormPageScaffold`, `DashboardPageScaffold`.
  - **moléculas N3 list/detail**: `EntityWorkspaceLayout`, `EntitySubNavBar`, `EntityInfoCard` (+ `EntityInfoCardSkeleton`/`Empty`), `EntityPicker`.
  - **autosave**: `AutosaveBadge`, `FloatingAutosaveIndicator`, `Group`/`GroupHeader`/`WhatForChip`.
  - **átomos shadcn**: `Button`, `Input`, `Select`, `Badge`, `Textarea`, `Avatar`, `Skeleton`, etc.
  - **shell organism** (ya consumido por `ShellLayoutWire.tsx`): `ShellLayout`, `Ribbon`, `SubTabsBar`, `ChatPanel`, etc. + `ShellEmptyState`/`ShellEmptyStateInline` (alias por clash con `layout/states.EmptyState`).
- **`@luana/design-tokens` 0.2.0**: `SPACING` (valor compartido frozen), `RADIUS_NAMES` (`["sm","md","lg","bubble","pill"]` — nombres compartidos), `TYPOGRAPHY_TIERS` (`["display","heading","body","caption"]`), `Z_INDEX`/`Z_INDEX_CLASSES`, `COLOR_NAMES` (nombres semánticos + per-agent).
- **`@luana/eslint-config` 0.1.0** (`no-arbitrary-value.js`): lockea 4 ejes `{spacing, radius, font-size, color-hex}`. Plugin `@luana/ds`. **OPT-IN por marca** — nicolify lo CABLEA en su `eslint.config.mjs` (hoy NO está; sí está `@luana/{design-tokens,format,hooks,ui-kit}`, falta `@luana/eslint-config`).

### Mirrors locales detectados (a MATAR — `anti-duplication.md` RN-3)

| Mirror local | Consumidores | Kit equivalente | Decisión |
|---|---|---|---|
| `components/shared/shell-organism/EntityWorkspaceLayout.tsx` (+ `.test.tsx`) | `features/abel/components/icp/IcpEntityLayoutClient.tsx` | `@luana/ui-kit::EntityWorkspaceLayout` | **DELETE + repoint** (ver § 6 prop-divergence) |
| `components/shared/shell-organism/EntitySubNavBar.tsx` (+ `.test.tsx`) | `SubTabContent.tsx`, `IcpEntityLayoutClient.tsx`, (local EWL — muere con él) | `@luana/ui-kit::EntitySubNavBar` | **DELETE + repoint** (ver § 6 — agnostic vs `agent-abel`) |
| `components/shared/shell-organism/EmptyState.tsx` | `SubTabContent.tsx` (no `[subtab]/page.tsx` directo — vía dispatcher) | `@luana/ui-kit::ShellEmptyState` (alias — API idéntica: emoji `icon` + `ctaLabel`/`onCtaClick`) | **DELETE + repoint a `ShellEmptyState`** |
| `components/shared/AutosaveBadge.tsx` | `features/abel/.../BuyerLeafForm.tsx`, `IcpDatosForm.tsx` | `@luana/ui-kit::AutosaveBadge` (API DIVERGE — ver § 6) | **DELETE + repoint con adaptación** |

### `use-autosave.ts` (marcado "lift candidate N=2")

- `@luana/hooks::useAutosave` YA existe + exporta `AutosaveStatus = "idle"|"dirty"|"saving"|"saved"|"error"` (5 estados). El local `nicolify/frontend/src/hooks/use-autosave.ts` tiene 4 (`"idle"|"saving"|"saved"|"error"`, sin `dirty`).
- **Decisión:** CONSUMIR `@luana/hooks::useAutosave` + matar el local hook **SI** el contrato de los consumers (IcpDatosForm/BuyerLeafForm) puede mapearse al del engine. Es la opción coherente (el engine ya lo tiene). Si el wiring del consumer no encaja sin tocar lógica de negocio (fuera de scope de esta story estructural) → **FLAG lift-already-done** y consumir el `AutosaveBadge` del kit pero dejar el hook local intacto (no bloquea). **No es un mirror cross-brand → no escala `/pm-luana`** (el lift YA ocurrió; esto es adopción). Ver § 6.4.

### RN-7 pill controls — DEPENDENCIA EXTERNA (NO en esta story)

- El mockup `_shared.css` usa `--radius-control: var(--radius-pill)` (pill 999px). Los **átomos del kit** `Button`/`Input`/`Select`/`Textarea` HARDCODEAN `rounded-md` (verificado: `core/@luana/ui-kit/src/{button,input,select}.tsx`) — **NO consumen `--radius-control`**.
- Hacer que el kit consuma `--radius-control` es **CAMBIO DE ENGINE CROSS-BRAND** → `/pm-luana` promotion gate, manejado por el architect skill **en PARALELO**, NUNCA en esta story de marca.
- **Esta story:** SÍ agrega los tokens `--radius-control`/`--radius-pill` a `globals.css` (brand-scoped, OK). Los controles renderizarán pill **solo después** del kit-lift + bump del dep `@luana/ui-kit`. Documentado en § Integration design como `blocked_on: kit-radius-control-lift`.

### Cross-brand mirror check (CRÍTICO)

- `vitalia` tiene `test-ds-single-token-source.test.ts`, `test-ds-tokens-lock.test.ts`, `test-no-cross-brand-shell-mirror.test.ts` + wiring `@luana/ds/no-arbitrary-value` en su `eslint.config.mjs`. **Estos son arch-tests PER-BRAND (la doctrina ADR-014 es compartida, cada brand tiene SU test) — NO son cross-brand mirror.** nicolify replica el **patrón** (no copia el archivo cross-brand): cada brand testea su propio `globals.css` contra `@luana/design-tokens`.
- **Cross-brand import check:** `grep "^import.*from.*vitalia|comunify|lupulo"` en `nicolify/frontend/src` = **0** (verificado por el arch-test existente de vitalia `test-no-cross-brand-shell-mirror.test.ts` CHECK A; nicolify debe mantener 0).
- **Net-new = ninguno.** Único "nuevo" código = los arch-tests de nicolify (per-brand, como vitalia) + tokens en globals.css. No es capa nueva — es enforcement de adopción.

## Existing systems audit (NO NEW LAYER rule)

### Source of evidence
- [ ] CONTEXT-BRIEF.md § 7 + § 8 — ausente (story chica)
- [x] Self-run greps (Path B — fallback)
- [ ] Re-validación de scan-incomplete — N/A

### Audit cross-module ejecutado

```bash
WS=$(git rev-parse --show-toplevel)
# 1. ¿nicolify ya depende del engine FE? (sí, falta eslint-config)
grep -E '@luana/(eslint-config|ui-kit|design-tokens|hooks|format)' ${WS}/nicolify/frontend/package.json
#   → design-tokens, format, hooks, ui-kit (workspace:*). FALTA @luana/eslint-config.
# 2. mirrors locales que duplican el kit
ls ${WS}/nicolify/frontend/src/components/shared/shell-organism/  # EntityWorkspaceLayout, EntitySubNavBar, EmptyState
ls ${WS}/nicolify/frontend/src/components/shared/AutosaveBadge.tsx
# 3. consumers de los mirrors
grep -rln "shell-organism/EntityWorkspaceLayout|shell-organism/EntitySubNavBar|shell-organism/EmptyState|shared/AutosaveBadge" ${WS}/nicolify/frontend/src
# 4. cross-brand import pollution
grep -rln "^import.*from.*['\"].*(vitalia|comunify|lupulo)" ${WS}/nicolify/frontend/src   # → 0
# 5. arbitrary-values en los 4 ejes lockeados
grep -rnoE "(p|gap|m|rounded|text|bg|border|...)-\[...\]" ${WS}/nicolify/frontend/src     # ver § 5 lista exacta
```

### Sistemas existentes encontrados

| Sistema | Path | Enum/Config | Factory/Router | Providers/Adapters | Estado |
|---|---|---|---|---|---|
| layout-primitives + archetypes | `@luana/ui-kit/src/{layout,archetypes}` | — | — | — | active (0.4.1) |
| N3 list/detail | `@luana/ui-kit::{EntityWorkspaceLayout,EntitySubNavBar,EntityInfoCard,EntityPicker}` | — | — | — | active |
| autosave | `@luana/ui-kit::{AutosaveBadge,FloatingAutosaveIndicator}` + `@luana/hooks::useAutosave` | `AutosaveStatus` (5 estados) | — | — | active |
| token scale | `@luana/design-tokens` | `SPACING/RADIUS_NAMES/TYPOGRAPHY_TIERS/Z_INDEX/COLOR_NAMES` | — | — | active (0.2.0) |
| arbitrary lock | `@luana/eslint-config::no-arbitrary-value` | plugin `@luana/ds` | — | — | active (0.1.0, NOT wired in nicolify) |
| shell chrome | `@luana/ui-kit/organism/shell::ShellLayout` | — | — | — | active (consumido por `ShellLayoutWire.tsx`) |
| **mirrors locales** (nicolify) | `components/shared/{shell-organism/*,AutosaveBadge}` | — | — | — | **TO DELETE (dup del kit)** |

### Decisión por sistema (EXTEND > REPLACE > NEW)

- **layout-primitives/archetypes/EntityInfoCard/EntityPicker/FloatingAutosaveIndicator/Group (kit, 0 consumidas hoy)** → **EXTEND/ADOPT** (consumir vía import). nicolify hoy arma `<div>` crudos → re-expresar abel/icp + shell chrome con primitivas.
- **EntityWorkspaceLayout/EntitySubNavBar/EmptyState/AutosaveBadge (mirrors locales)** → **DELETE local + CONSUME kit** (el kit es el canónico; `EntityWorkspaceLayout` nació en nicolify y YA se lifteó). No retener mirror (anti-duplication.md).
- **token scale (globals.css cruda)** → **EXTEND**: globals.css conserva los VALORES de marca (color/font/rem) + adopta los NOMBRES/valores de escala compartidos de `@luana/design-tokens` + arch-test que verifica el match (drift falla). Mecanismo en § Q1.
- **arbitrary lock** → **ENABLE** (wire `@luana/eslint-config` en `eslint.config.mjs`, cero allowlist).
- **kit átomos `--radius-control`** → **NO TOCAR** (engine cross-brand → `/pm-luana` lift en paralelo; esta story solo agrega tokens brand-scoped + GATE el golden de pill).
- **NEW = ninguno.** Único código net-new = arch-tests per-brand de nicolify (replica del patrón vitalia, no cross-brand mirror). NO es capa nueva.

## Q1 — globals.css ↔ @luana/design-tokens mechanism decision

> Tailwind v4 CSS-first `@theme` (nicolify) NO importa TS. El architect concreta el mecanismo.

**Decisión (recomendada, lazy — NO codegen pipeline):** `globals.css` **mantiene los VALORES de marca** (colores semánticos + 7 agent colors + `--primary: 243 100% 68%` #635BFF + fuentes League Spartan/Bree Serif + valores rem de radius) y **adopta los NOMBRES/escala compartidos** de `@luana/design-tokens`. Mecanismo de coherencia = **espejo declarado en globals.css `@theme` + arch-test que verifica el match contra los exports de `@luana/design-tokens` (drift falla)**:

1. **Spacing (valor compartido):** `globals.css` declara la escala spacing en `@theme` con los MISMOS valores que `SPACING` (4px-ladder: `0/.25rem/.5rem/.75rem/1rem/1.25rem/1.5rem/2rem/2.5rem/3rem/4rem`). El arch-test importa `SPACING` de `@luana/design-tokens` y asserta que cada valor está presente en globals.css `@theme`.
2. **Radius (nombres compartidos + valores rem de marca):** `globals.css` declara `--radius-sm`/`--radius` (=md)/`--radius-lg`/`--radius-bubble`/`--radius-pill` (los NOMBRES de `RADIUS_NAMES`) con los valores rem de marca. El arch-test asserta que **cada nombre de `RADIUS_NAMES` tiene un token correspondiente** en globals.css (NO el valor rem — ese es brand-owned).
3. **Typography (nombres compartidos):** el arch-test asserta que cada tier de `TYPOGRAPHY_TIERS` (`display/heading/body/caption`) está representado (font-size/line-height tokens por nombre). Valores font-size = marca.
4. **Z-index (compartido):** consumir `Z_INDEX`/`Z_INDEX_CLASSES` (ya es el caso — `SHELL-DESIGN-CONTRACT § 2`).
5. **Color (nombres compartidos + valores de marca):** los nombres semánticos (`primary/background/foreground/card/muted/border/ring`) ya existen. Los **per-agent** nicolify (abel/brenda/christian/sara/norvil/luana/config) NO coinciden con `COLOR_NAMES` (que lista los de vitalia lisa/lucas/adrian/...). **`COLOR_NAMES` es un contrato de NOMBRES per-brand-extensible** — el arch-test asserta los nombres SEMÁNTICOS compartidos (`primary/background/foreground/card/muted/border/ring`), NO los per-agent (cada brand pinta sus propios agentes). Ver § 16 Open Question para si `COLOR_NAMES` debe documentar el per-agent como brand-owned.

**Identidad de marca EXENTA del match** (RN-1 / SC-6): `--primary` (#635BFF = `243 100% 68%`), 7 agent colors, fuentes, valores rem de radius — son brand-owned (el contrato design-tokens los declara per-brand). El arch-test verifica la PRESENCIA de la escala compartida + la PRESERVACIÓN de la identidad (`--primary` exacto + agent colors + fonts).

**`--radius-control` (RN-7):** se agrega a globals.css `:root` (= `var(--radius-pill)` para nicolify) + un `--radius-pill` (= `9999px`/`999px`) si no existe. **No es del contrato design-tokens hoy** — es token brand-scoped que el kit consumirá tras el lift `/pm-luana`. El arch-test NO lo exige del contrato (es brand-local).

**NO over-engineer:** sin codegen. El espejo en `@theme` + el arch-test (drift falla) es suficiente. (Coherente con ADR-014 "no boil the ocean" + canon §6.1.)

## Integration design (CONN — anti-orphan)

> La adopción re-expresa superficies **YA registradas/navegables** (no crea rutas nuevas). CONN se cumple porque las superficies ya estaban enchufadas; esta story cambia su COMPOSICIÓN, no su reachability.

- **C — Consumed:** las superficies re-expresadas (chrome del shell `(shell-organism)` + `abel/icp` master/detalle) las consume el **usuario de nicolify** vía las rutas ya wired:
  - `/{tenantId}/abel/icp` (master · `[agent]/[subtab]/page.tsx` → `SubTabContent` → `IcpMasterListView` + `EntitySubNavBar`).
  - `/{tenantId}/abel/icp/{icpId}/{leaf}` (detalle · `[subsubtab]/layout.tsx` → `IcpEntityLayoutClient` → `EntityWorkspaceLayout` + `EntitySubNavBar`).
  - El chrome (`ShellLayoutWire` → `ShellLayout`) envuelve todo el `(shell-organism)` route group.
- **O — On the map:** cap `design-system/nicolify-ui-homologation` (zona Infraestructura → caja `plataforma-tecnica` → área `design-system`, derivada de `SYSTEM-MAP.yaml::zones`). La cap `abel.icp-buyer` (zona Agentes → caja `abel`) converge su FE.
- **N — Navigable/reachable:** rutas existentes (Ribbon → Abel → ICP). NO se crean rutas; se re-expresan.
- **N — Notarized/registered:** los componentes ya están cableados (`include`/`import` en `SubTabContent` + layouts + `ShellLayoutWire`). El cambio = repoint de imports mirror→kit (sigue registrado) + tokens en globals.css (consumido por `@theme`) + lock en `eslint.config.mjs` (corre en pre-commit/CI).
- **DEPENDENCIA EXTERNA (RN-7):** `blocked_on: kit-radius-control-lift` — el render pill de los controles depende del kit-lift `/pm-luana` (`--radius-control` consumido por kit `Button/Input/Select/Textarea`) + bump del dep `@luana/ui-kit` en `nicolify/frontend/package.json`. **NO bloquea esta story** (todas las demás superficies se adoptan ahora); SOLO bloquea 1 golden (radio de control/pill) + el demo gate #37 final corre cuando AMBOS (esta adopción estructural + kit-lift) aterrizan.

## 1-7. Backend / Domain / DTOs / Migrations / Services

**N/A — esta story es FE-only.** No toca `nicolify/backend/**`, no crea entidades, DTOs, rutas, migraciones ni servicios. Las superficies `abel/icp` consumen los endpoints BE existentes (vía `features/abel/api/*` ya shippeados) sin cambios de contrato.

## 6. Componentes FE — adopción + prop-divergence (la parte crítica)

> Toda pieza = REUSE de `@luana/ui-kit` (cero NEW). Donde el prop-API del kit diverge del mirror local, se ADAPTA el consumer (NO se retiene el mirror; NO se edita el kit).

### 6.1 EntityWorkspaceLayout (DELETE local → consume kit)

- **Kit props (superset):** `{ entity, leaves, rootHref, rootLabel, isLoading?, placeholder?, onAddAffordance?, entityIdentitySlot?, activeLeaf?, children, className? }`.
- **Local props:** `{ entity, leaves, rootHref, rootLabel, isLoading?, onAddAffordance?, children, className? }` — subconjunto del kit. **Repoint directo OK** (el local NO pasa `agentSlug` a EWL; lo pasaba hardcodeado a `EntitySubNavBar` adentro).
- **Acción:** `IcpEntityLayoutClient.tsx` cambia el import de `@/components/shared/shell-organism/EntityWorkspaceLayout` → `@luana/ui-kit`. Tipos `EntitySubNavLeaf`/`EntitySubNavEntity` también del kit. Borrar `EntityWorkspaceLayout.tsx` + `.test.tsx` local.

### 6.2 EntitySubNavBar (DELETE local → consume kit · DIVERGENCE: agent-color)

- **DIVERGENCIA REAL:** el local hardcodea `agent-abel` en los estados (active leaf `bg-agent-abel-soft border-agent-abel/30`, hover dashed `hover:border-agent-abel`, star `text-agent-abel`) vía `agentSlug: AgentSlug` + `_agent-tw-classes.ts`. El **kit es brand-AGNÓSTICO**: active leaf = `bg-accent border-border text-accent-foreground`; affordance hover = `hover:border-primary hover:text-primary`; star = `text-primary`. El kit **NO acepta `agentSlug`** — usa `avatarBgClass` por-leaf + tokens semánticos.
- **Decisión (EXTEND-no-retener-mirror):** adoptar el kit `EntitySubNavBar` con sus tokens semánticos (`accent`/`primary`). El **acento abel de los leaves activos** se logra vía los tokens semánticos de la hoja (el módulo de Abel ya colorea su acción primaria con `--agent-abel` per canon §2.8; el active leaf del kit usa `accent` que en el contexto de Abel puede mapearse). Los **avatares de buyers** siguen recibiendo `avatarBgClass` per-leaf (el kit lo soporta — `IcpEntityLayoutClient` ya pasa `BUYER_AVATAR_BG_CLASSES`).
- **FIDELITY TRADEOFF (declarado):** el active-leaf del kit es `accent`-tinted, no `agent-abel-soft`. El mockup ratificado (`ds-base.html`/`icp-buyer.html`) muestra el acento abel. **Dos caminos válidos, builder elige el que pase el visual golden:**
  1. **(preferido)** El consumer pasa una `className` o el active-state se logra vía el token `--accent` del scope de Abel — si el render no matchea el golden `agent-abel`, es un gap del kit → **FLAG lift candidate `/pm-luana`** (el kit debería aceptar un `accentToken`/`agentSlot` prop opcional) — NO retener mirror.
  2. Si el golden falla y el lift no está, el golden de **active-leaf accent** se marca `blocked_on: kit-accent-slot-lift` (igual que el pill). El resto del subnav (estructura, full-bleed, roving tabindex, root-pill, avatares) NO se gatea — corre ahora.
- **Acción:** `SubTabContent.tsx` + `IcpEntityLayoutClient.tsx` repoint import `./EntitySubNavBar` / `@/components/shared/shell-organism/EntitySubNavBar` → `@luana/ui-kit`. Quitar el prop `agentSlug` (no existe en el kit). Borrar `EntitySubNavBar.tsx` + `.test.tsx` local.
- **a11y preservada:** el kit ya implementa `role="tablist"` + roving tabindex + flechas (SC-5).

### 6.3 EmptyState (DELETE local → consume `ShellEmptyState`)

- **API IDÉNTICA:** local `{ icon: string, title, description, ctaLabel?, onCtaClick?, className? }` == kit `ShellEmptyState` `{ icon: string (emoji), title, description, ctaLabel?, onCtaClick? }`. **Repoint limpio.**
- **OJO con el clash:** `@luana/ui-kit` exporta DOS EmptyState: el de `layout/states` (`icon: ReactNode`, `action: ReactNode`) y el shell (`icon: string` emoji + `ctaLabel`/`onCtaClick`, aliased `ShellEmptyState`). El local matchea el **shell** → importar `ShellEmptyState` (o desde `@luana/ui-kit/organism/shell` el `EmptyState`). Para los estados de hoja list/detail (canon §2.7) usar el `EmptyState`/`ErrorState` de `layout` (con `action`). El builder elige por contexto: dispatcher de sub-tabs (emoji + CTA) → `ShellEmptyState`; estados de la hoja abel/icp (canon) → `layout` `EmptyState`/`ErrorState`.
- **Acción:** `SubTabContent.tsx` repoint `./EmptyState` → `ShellEmptyState` (named import de `@luana/ui-kit`). Borrar `EmptyState.tsx` local.

### 6.4 AutosaveBadge (DELETE local → consume kit · DIVERGENCE: status enum + props)

- **DIVERGENCIA:** local `AutosaveStatus = "idle"|"saving"|"saved"|"error"`; kit `AutosaveStatus = "idle"|"dirty"|"saving"|"saved"|"error"` (de `@luana/hooks`). Local props `{ status, savedAt?, className?, "data-testid"? }`; kit props `{ status, savedAt?, labels?, className? }` (sin `data-testid` override, con `labels`).
- **Decisión:** repoint a `@luana/ui-kit::AutosaveBadge`. Los consumers (`IcpDatosForm`, `BuyerLeafForm`) mapean su estado local a `AutosaveStatus` del kit (los 4 valores locales son subconjunto de los 5 del kit — `dirty` simplemente no se emite). El override `data-testid` que el local soportaba se reemplaza por el `data-state` del kit (e2e/tests apuntan a `[data-state]`). **Si algún test depende del `data-testid` per-form** → ajustar el selector del test (es test, no lógica). Microcopy: el kit ya trae `DEFAULT_AUTOSAVE_LABELS` Spanish neutro; si difiere del local ("Guardando..." vs "Guardando…"), pasar `labels` override.
- **Canon §2.6:** preferir **UNA `FloatingAutosaveIndicator` por página** (no badge por-grupo). El builder evalúa si abel/icp debe migrar de `AutosaveBadge` per-form a `FloatingAutosaveIndicator` única — **scope discipline:** esta story re-expresa estructura; migrar de N badges a 1 floating indicator es coherente con el canon PERO si rompe el contrato de los forms (lógica), se marca como follow-up. **Mínimo HARD:** matar el mirror local `AutosaveBadge.tsx`, consumir el del kit.
- **`use-autosave.ts` local:** ver § Prior art — consumir `@luana/hooks::useAutosave` SI los consumers mapean sin tocar lógica; si no, dejar el hook local (lift ya ocurrió, no es mirror cross-brand) y solo migrar el badge. NO bloquea.
- **Acción:** `BuyerLeafForm.tsx` + `IcpDatosForm.tsx` repoint `@/components/shared/AutosaveBadge` → `@luana/ui-kit`. Borrar `AutosaveBadge.tsx` local.

### 6.5 Re-expresión de abel/icp + shell chrome vía primitivas (RN-1/RN-5/AC-4)

- `features/abel/components/icp/*`: componer de `EntityWorkspaceLayout` + `EntitySubNavBar` + `EntityInfoCard` (master grid) + `Group`/`GroupHeader` (forms) + layout-primitives (`PageContainer`/`PageHeader`/`PageContentStack`/`Toolbar`/`FilterBar`/`EmptyState`/`ErrorState`/`ListPageSkeleton`/`FormPageSkeleton`) + archetypes (`ListPageScaffold` master, `DetailPageScaffold` detalle). **Cero `<div>` de layout sustituible por primitiva.**
  - `IcpMasterListView`: `ListPageScaffold` / `PageContainer` + `Toolbar`/`FilterBar` + grid de `EntityInfoCard` (reemplaza `IcpCard` a mano si éste es `<div>` crudo — evaluar; `IcpCard` puede mantenerse si ya compone de `Card` atom + cumple Opción B, o migrar a `EntityInfoCard`).
  - `IcpWorkspaceView`/`IcpDatosForm`/`BuyerLeafForm`: `Group`/`GroupHeader` + `FormLayout` (1-col default; 2-col solo pareados) + autosave del kit.
- Shell chrome `(shell-organism)`: `ShellLayoutWire` ya consume `ShellLayout` (kit). Verificar que NO queden `<div>` de layout crudos sustituibles por primitivas en `ShellLayoutWire`/`SubTabContent`; swap los que apliquen.

## 8-9. Agentic Surfaces / Migration Notes

**N/A** — cero agentic, cero migración. (El módulo `copilot`/`sales_agent` de nicolify es esqueleto; esta story NO lo toca.)

## 9.5 Tests audit (default flip)

> **APLICA** — la story flipea el default de la regla eslint `@luana/ds/no-arbitrary-value` de OFF→ON en `nicolify/frontend/eslint.config.mjs` (anti-default-flip-audit.md + tdd-mandatory.md § Default flag flips).

| Field | Value |
|---|---|
| Flag | `@luana/ds/no-arbitrary-value` (regla eslint, no env flag) |
| Old default | OFF (no cableada en nicolify hoy) |
| New default | `error` (cero allowlist) |
| Side-effect path old | eslint corre sin la regla → arbitraries pasan silenciosos |
| Side-effect path new | eslint FALLA en cualquier arbitrary de los 4 ejes lockeados (spacing/radius/font-size/color-hex) |
| Tests mockean path viejo | N/A — no hay tests que mockeen "ausencia de regla". El arch-test NUEVO `test-ds-tokens-lock.test.ts` (replica de vitalia) verifica la regla con `Linter` real. |
| Migration strategy per test | (1) grep + listar arbitraries de ejes lockeados (§ 5); (2) migrar TODOS a tokens; (3) correr `eslint` con regla OFF (baseline verde) + ON (verde a cero); (4) commit body documenta. |
| Run with both flag values | **SÍ (required pre-merge):** `eslint src/` con regla OFF (baseline) y luego ON (cero violations). RED→GREEN del lock. |
| Commit body docs | "no-arbitrary-value flipped off→on en nicolify. N arbitraries migrados a tokens, 0 allowlisted (`// ds-lock-allow`)." |
| Arch fitness coverage | `test-ds-tokens-lock.test.ts` (replica vitalia) verifica que la regla lockea los 4 ejes + honra el escape `// ds-lock-allow` + NO lockea sizing (w/h). NO es un test que mockee legacy event path → no aplica `test_no_legacy_eventbus_mock`. |

**Bif-2 (arbitrary sin token):** si un arbitrary estructural no tiene token equivalente → proponer token a `@luana/design-tokens` (escalate `/pm-luana`, FLAG no bloquea) **o** allowlist con `// ds-lock-allow: <razón>` (ratchet shrink-only). NUNCA arbitrary suelto. Lo esperado: la mayoría de los `text-[10px]`/`text-[9px]` → token font-size (`text-xs` o agregar tier caption); migrar. Los `top-[48%]`/`left-[50%]` de `components/ui/**` están **eslint-ignored** (shadcn auto-gen) → no fallan el lock.

## 10. File Structure (NEW vs MODIFIED vs DELETE)

```
nicolify/frontend/
  src/app/globals.css                                          MODIFIED  (escala compartida + --radius-control/--radius-pill, identidad intacta)
  eslint.config.mjs                                            MODIFIED  (wire @luana/ds/no-arbitrary-value = error, cero allowlist)
  package.json                                                 MODIFIED  (+ "@luana/eslint-config": "workspace:*")
  src/__tests__/architecture/
    test-ds-single-token-source.test.ts                        NEW       (globals.css 1 fuente por token; --primary/agent/fonts intactos)
    test-ds-tokens-lock.test.ts                                NEW       (Linter real: no-arbitrary-value lockea 4 ejes + escape)
    test-no-kit-mirror.test.ts                                 NEW       (grep: componente kit duplicado local = 0)  [SC-4/AC-1]
    test-no-cross-brand-import.test.ts                         NEW       (grep: import desde vitalia/comunify/lupulo = 0)  [opcional, replica vitalia CHECK A]
  src/components/shared/shell-organism/
    EntityWorkspaceLayout.tsx (+ .test.tsx)                    DELETE
    EntitySubNavBar.tsx (+ .test.tsx)                          DELETE
    EmptyState.tsx                                             DELETE
  src/components/shared/AutosaveBadge.tsx                       DELETE
  src/components/shared/shell-organism/SubTabContent.tsx        MODIFIED  (repoint EmptyState→ShellEmptyState, EntitySubNavBar→kit, quitar agentSlug)
  src/features/abel/components/icp/IcpEntityLayoutClient.tsx    MODIFIED  (repoint EWL/EntitySubNavBar→kit, quitar agentSlug)
  src/features/abel/components/icp/{IcpMasterListView,IcpWorkspaceView,IcpDatosForm,BuyerLeafForm,IcpCard}.tsx  MODIFIED  (componer de primitivas/archetypes + autosave kit; migrar text-[10px]→token)
  src/app/[tenantId]/(shell-organism)/_components/ShellLayoutWire.tsx  MODIFIED (si hay <div> de layout sustituible; verify)
  src/components/shared/{WhatForChip,agents/AgentAvatar}.tsx    MODIFIED  (migrar text-[10px]→token)
  e2e/regression/nicolify-r0-design-system-adoption/
    abel-icp-fidelity.spec.ts                                  NEW       (visual goldens side-by-side vs ds-base.html/icp-buyer.html)
    a11y-subnav.spec.ts                                        NEW       (axe wcag2aa + roving tabindex EntitySubNavBar)
nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md             MODIFIED  (§7 verify: mockups componen de canon+tokens — RN-6/AC-6; mayormente ya hecho vía ADR-nicolify-003)
```

> **NUNCA tocar:** `core/@luana/**/src/` (engine — RN-7 lift = `/pm-luana`) · `{vitalia,comunify,lupulo}/**` (cross-brand). `components/ui/**` está eslint-ignored (shadcn) — sus arbitraries no fallan el lock; NO migrarlos en esta story salvo que el visual lo exija.

## 11. Cross-Cutting Concerns

- **Tenant isolation:** N/A backend; el FE ya usa `useTenantId()` (no Clerk org). No se introduce data nueva.
- **Currency / Master data:** N/A (sin campos monetarios/fecha nuevos).
- **Spanish neutro (tuteo):** todo microcopy user-facing (EmptyState/ErrorState/autosave) en neutro sin voseo. El kit `DEFAULT_AUTOSAVE_LABELS` ya es neutro. Microcopy spec § Microcopy: "Aún no tienes ICPs" / "Crear primer ICP" / "No pudimos cargar los ICPs. Revisa tu conexión." / "Guardado". Arch-test `test_spanish_neutro.test.ts` debe seguir verde.
- **Identidad HARD-preservada (RN-1/SC-6):** `globals.css --primary = 243 100% 68%` (#635BFF) + 7 agent colors (`--agent-{luana,abel,brenda,christian,sara,norvil,config}`) + fuentes League Spartan/Bree Serif **intactos**. El arch-test `test-ds-single-token-source.test.ts` verifica.
- **Native-first:** lint/tests nativos (`cd nicolify/frontend && npx {tsc,eslint,vitest,playwright}`), NUNCA docker exec.
- **PII:** N/A (sin response models nuevos).

## 12. Architecture Fitness Impact

- **Gates que corren (deben seguir verdes):**
  - existentes: `no-store-in-ssr-skeleton.test.tsx` (G2 — EntityWorkspaceLayout del kit es store-free, OK), `test_agent_tw_classes.test.ts` (G3 JIT — verificar que matar EntitySubNavBar local no rompa el lookup; `_agent-tw-classes.ts` se mantiene para otros usos del shell), `test_shell_routes_ssot.test.ts`, `test_spanish_neutro.test.ts`, `test-tenant-id-not-from-params.test.ts`.
  - NUEVOS (per-brand, replica del patrón vitalia): `test-ds-single-token-source.test.ts`, `test-ds-tokens-lock.test.ts`, `test-no-kit-mirror.test.ts`, `test-no-cross-brand-import.test.ts`.
- **gate-runner shortcuts:** `test-nicolify` (vitest + arch tests) + `arch-test-nicolify`. `make ci-parity` corre nicolify.
- **Allowlist:** `no-arbitrary-value` enciende en **cero allowlist** (sin deuda). `test-no-kit-mirror.test.ts` ratchet shrink-only (allowlist vacía: ningún componente kit duplicado local permitido tras matar los 4 mirrors).

## 13. capability YAML + modules/{m}.md Updates Required (post 2026-05)

- `nicolify/docs/product/capabilities/design-system/nicolify-ui-homologation.yaml` — NEW cap (`cap_change_type: new`), zona Infraestructura/plataforma-tecnica/design-system. Poblar `scenarios[]` (SC-1..6) + `dev_preview.main_component` (globals.css + eslint.config + abel/icp re-expresado).
- `nicolify/docs/product/capabilities/abel/icp-buyer.yaml` — converge (FE re-expresado vía kit; `dev_preview` sigue apuntando a `IcpEntityLayoutClient`/`IcpMasterListView`, ahora compuestos del kit).
- nicolify = enforcement cap-format **advisory** (no HARD vitalia/comunify) — `make cap-doctor BRAND=nicolify` advisory.

## 14. Test Surfaces (TDD-mandatory · RED first)

- **FE unit (vitest):** repoint de imports → los `.test.tsx` de los componentes re-expresados se actualizan (RED al cambiar el contrato de props, ej. quitar `agentSlug`); borrar `EntityWorkspaceLayout.test.tsx`/`EntitySubNavBar.test.tsx` locales (los kit tienen sus propios tests en el engine).
- **arch (vitest):** `test-ds-tokens-lock.test.ts` (Linter real, RED si la regla no lockea) · `test-ds-single-token-source.test.ts` (RED si globals.css drift de la escala o pierde identidad) · `test-no-kit-mirror.test.ts` (RED si reaparece un mirror).
- **eslint lock (ES el test · SC-2/SC-3):** correr con regla ON tras migrar los arbitraries — RED si queda alguno; el RED del lint ES la prueba (no "GET 200").
- **E2E (playwright):** `abel-icp-fidelity.spec.ts` (visual goldens side-by-side `maxDiffPixelRatio: 0.001` por § Visual Goldens table; el golden de **control-radius/pill** + opcional **active-leaf-accent** GATEADOS en kit-lift — el resto corre ahora) · `a11y-subnav.spec.ts` (axe wcag2aa + roving tabindex). RED antes (smoke de la ruta ya existe).
- **Live-verify (DoD #37):** ejercer `/{tenantId}/abel/icp` master + abrir un ICP (detalle) + un write real (autosave en un campo) en dev-app nicolify (localhost:3001 / dev-app.nicolify) + leer logs + confirmar render idéntico/mejor al mockup + persistencia. `dod_evidence` poblado.

## 15. Research Notes (DATE-AWARE)

- **No se introdujo ningún pattern novel.** Esta story es 100% adopción de design system YA shippeado en el engine (`@luana/ui-kit` 0.4.1 / `@luana/design-tokens` 0.2.0 / `@luana/eslint-config` 0.1.0) + replica del patrón de adopción de vitalia (arch-tests per-brand + wiring eslint). Cero WebSearch necesario — todo el contrato sale de leer el código real del engine + los precedentes de vitalia.
- **Fuentes (código real, accessed 2026-06-16):**
  - `core/@luana/ui-kit/src/index.ts` + `src/{layout,archetypes}/index.ts` + `EntityWorkspaceLayout.tsx` + `EntitySubNavBar.tsx` + `AutosaveBadge.tsx` + `organism/shell/EmptyState.tsx` — exports + prop-APIs verificados.
  - `core/@luana/design-tokens/src/{spacing,radius,typography,z-index,color-names}.ts` — escala compartida (valores + nombres).
  - `core/@luana/eslint-config/src/{index.js,no-arbitrary-value.js}` — regla + plugin `@luana/ds` + 4 ejes lockeados + escape `// ds-lock-allow`.
  - `vitalia/frontend/src/__tests__/architecture/{test-ds-single-token-source,test-ds-tokens-lock,test-no-cross-brand-shell-mirror}.test.ts` + `vitalia/frontend/eslint.config.mjs` — precedente de adopción (per-brand, replicable sin cross-brand mirror).
- **Knowledge cutoff:** N/A — sin tópico post-cutoff; todo verificado contra código del repo hoy.

## 16. Open Questions for PM

1. **`COLOR_NAMES` per-agent (Q1 §5):** el contrato `@luana/design-tokens::COLOR_NAMES` lista los agentes de **vitalia** (lisa/lucas/adrian/...). nicolify pinta abel/brenda/christian/sara/norvil/luana/config. El arch-test asserta solo los NOMBRES semánticos compartidos (`primary/background/foreground/card/muted/border/ring`) y trata los per-agent como brand-owned. ¿Confirmás que `COLOR_NAMES` es contrato de nombres semánticos compartidos + per-agent brand-extensible (no un enum cerrado que nicolify deba matchear)? Si debe documentarse en el contrato → es ajuste del engine (`/pm-luana`), fuera de scope de esta story.
2. **EntitySubNavBar active-leaf accent (§6.2):** el kit usa `accent`/`primary` semánticos; el mockup ratificado muestra acento `agent-abel` en el leaf activo. Si el visual golden falla con tokens semánticos → ¿FLAG lift candidate `/pm-luana` (kit acepta `accentToken`/`agentSlot` opcional) + gatear ESE golden en el lift, o aceptar el accent semántico como fidelidad "equivalente o mejor"? Recomiendo: builder intenta con tokens semánticos del scope de Abel; si no matchea, gatear el golden + FLAG (NO retener mirror).
3. **AutosaveBadge → FloatingAutosaveIndicator (§6.4):** ¿migrar abel/icp de N `AutosaveBadge` per-form a UNA `FloatingAutosaveIndicator` por página (canon §2.6) dentro de esta story, o follow-up? Recomiendo: si no toca lógica de los forms, hacerlo (es composición); si toca, follow-up. Mínimo HARD: matar el mirror local + consumir el badge del kit.
