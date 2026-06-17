---
story_id: nicolify-r0-design-system-adoption
brand: nicolify
type: ui-story
state: refined
verification_nature: ambas          # técnica (eslint lock + arch-test + tsc) + funcional (fidelidad visual live)
architecture_pattern: ADR-014-design-system-homologation   # NO ADR-nicolify-001 (no es sub-tab); SHELL-DESIGN-CONTRACT gobierna el shell tocado
po_ux_version: 2
cap_target: design-system/nicolify-ui-homologation
cap_change_type: new
ratified_by_chris: true             # FIRMA 2 (mockup final) — Chris 2026-06-15
input_spec_signed: true             # ✍ FIRMA 1 (RONDA 1 funcional) — Chris 2026-06-15
mockup_final_signed: true           # ✍ FIRMA 2 (mockup ds-base.html final) — Chris 2026-06-15 · colores verificados vs nicolify.com live
state_note: "refining→refined al cerrar este turn (RONDA 2 generada)"
---

# 01-spec · nicolify-r0-design-system-adoption — Adopción Fase 3 del design system homologado

> **RONDA 1 (funcional · viñetas).** Mockup, Gherkin y matriz de cobertura se GENERAN en RONDA 2 al firmar el mockup final (flujo funcional-primero W0.5-bis). Acá se cementa QUÉ se hace; la forma viene después.

## § Context

- **Release:** R0 (Fundación) — homologar ANTES de crecer (ADR-014 HARD).
- **Módulo:** design-system (cross-cutting · toca `nicolify/frontend/src` broad + `globals.css`).
- **Dónde vive:** zona **Infraestructura** → caja **plataforma-tecnica**. No es una ruta — es la **base que TODAS las hojas del shell consumen**. El shell que toca lo gobierna `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md`.
- **Actor / quién usa:** el **desarrollador** (`builder-frontend`) + el **autor de mockups** (`/po-ux`) componen de una base única; el beneficiario final = el **usuario de nicolify** (UI consistente cross-hoja, "no se siente otra app"). No introduce acción de negocio ni superficie nueva.
- **Out-of-scope (anti-creep):** refresh de la skill `nicolify-design-system` (harness · follow-up, regla "no tocar harness a mitad de feature") · hojas del árbol aún sin UI real (skeletons — nacerán homologadas cuando se construyan) · tokens/features nuevos.

## Prior art applied

> Scan corrido 2026-06-15 (/pm-nicolify + /pm-luana + /po-ux). **Resultado: ADOPCIÓN PURA — cero creación.** Verbatim en `checkpoint.md § Prior art scan`.

- **Engine consumido (no recrear):** `@luana/ui-kit` 0.4.1 (`src/layout/`: Page/Toolbar/states/pagination/skeletons · `src/archetypes/`: List/Detail/Form/DashboardPageScaffold · átomos shadcn · moléculas Entity*) · `@luana/design-tokens` 0.2.0 (spacing/radius-names/typography/z-index/color-names) · `@luana/eslint-config` (`no-arbitrary-value.js`).
- **Doctrina aplicada:** `ADR-014-design-system-homologation` + proposal `2026-06-07-design-system-homologation` (ambos **accepted**, ratif Chris). nicolify = consumer (Fase 3 adoption).
- **Mirror detectado (a matar):** `EntityWorkspaceLayout`, `EntitySubNavBar`, `EmptyState`, `AutosaveBadge` existen LOCALES en `nicolify/.../components/shared/shell-organism/` **y** en `@luana/ui-kit`. `EntityWorkspaceLayout` nació en nicolify y se lifteó → consumir el del kit, borrar el local (`anti-duplication.md`). Learning origen: `vitalia/docs/learnings/2026-06-06-n3-entity-workspace-layout-from-nicolify.md`.
- **Net-new justificado:** ninguno — es 100% adopción.
- **Lift candidates:** si un componente local diverge mejor que el del kit → escalate `/pm-luana` (mejora al kit), NUNCA retener mirror.

## § Mapa funcional

### Happy path (la adopción, narrada)

1. **Cementar tokens** — `globals.css` conserva los **valores de marca** (colores semánticos + 7 colores de agentes + `--primary` #635BFF + fuentes League Spartan/Bree Serif + valores rem de radius) y consume la **escala compartida** de `@luana/design-tokens` (spacing como valor · radius por nombres sm/md/lg/bubble/pill · typography · z-index).
2. **Matar mirrors locales** — `EntityWorkspaceLayout` / `EntitySubNavBar` / `EmptyState` / `AutosaveBadge` locales se borran; toda referencia importa de `@luana/ui-kit` 0.4.1.
3. **Re-expresar hojas** — cada superficie con UI real (chrome del shell + `abel/icp`, **incluido Abel ahora** — decisión Chris) compone de layout-primitives (Page/Toolbar/states) + page archetypes; cero `<div>` de layout a mano donde hay primitiva.
4. **Encender enforcement** — migrar los **27 arbitrary-values** a tokens; activar el lock `no-arbitrary-value` en `nicolify/frontend` en **cero allowlist** (sin deuda).
5. **Cementar el lado mockup** — `SHELL-DESIGN-CONTRACT.md` declara que **todo mockup compone de canon + tokens** (mismo origen que el dev) → cierra "lo que veo = lo que se programa".
6. **Verificar** — las hojas renderizan idénticas/mejores (fidelidad visual), `tsc`+`eslint`+`vitest`+e2e smoke verdes, live-verify en dev-app.

### Bifurcaciones

- **Bif-1** · arbitrary-value CON token equivalente → migrar al token. *(la mayoría de los 27)*
- **Bif-2** · arbitrary-value SIN token equivalente → ¿estructural? → proponer token a `@luana/design-tokens` (escalate `/pm-luana`) · ¿one-off legítimo? → allowlist con justificación (shrink-only). NUNCA arbitrary suelto.
- **Bif-3** · componente local diverge del lifteado al kit → adoptar el del kit (versión canónica); si el local aporta algo que el kit no tiene → escalate `/pm-luana` (mejora al kit), NO retener mirror.
- **Bif-4** · hoja sin UI real (skeleton del árbol) → fuera de scope, no se toca (nacerá homologada al construirse).
- **Bif-5** · Abel en `reviewing` con FE cambiado por esta adopción → al cerrar, su audit + demo gate #37 se re-corren sobre el FE convergido (coordinación `/pm-nicolify`).

### Reglas de negocio

- **RN-1** · **Identidad preservada** — colores (incl. agent colors + #635BFF) + fuentes intactos. La homologación toca **estructura**, no identidad.
- **RN-2** · **Escala compartida, no duplicada** — spacing/typography/z-index de `@luana/design-tokens`; radius = nombres compartidos + valores rem de marca.
- **RN-3** · **Cero mirror** — ningún componente local que ya viva en `@luana/ui-kit`.
- **RN-4** · **Cero arbitrary nuevo** — lock en cero allowlist; excepción = allowlist con justificación ratificada (shrink-only).
- **RN-5** · **Fidelidad visual** — cada hoja renderiza equivalente o mejor que su mockup ratificado; cero regresión (anti-default-flip al encender el lock).
- **RN-6** · **Mockup = dev** — todo mockup futuro compone del mismo canon + tokens (SHELL-DESIGN-CONTRACT actualizado).

### Criterios de aceptación

- **AC-1** · 0 componentes locales que dupliquen `@luana/ui-kit` (grep mirror = 0).
- **AC-2** · 0 arbitrary-values en `nicolify/frontend/src` (lock verde; allowlist = 0 salvo justificados+ratificados).
- **AC-3** · `globals.css` consume `@luana/design-tokens` para la escala; valores de marca intactos (verificable: `--primary` = `243 100% 68%`, agent colors, fuentes).
- **AC-4** · Toda hoja con UI compone de layout-primitives/archetypes (cero `<div>` de layout sustituible).
- **AC-5** · `tsc` + `eslint` + `vitest` + e2e smoke verdes; live-verify dev-app (abel/icp + shell render idénticos a lo ratificado).
- **AC-6** · `SHELL-DESIGN-CONTRACT.md` actualizado: mockups componen de canon + tokens.

## § Pantallas / inventario de adopción (SIN mockup — RONDA 1)

| Superficie | Hoy | Adopción |
|---|---|---|
| Chrome del shell (`(shell-organism)` layout · ribbon · sidebar Luana · sub-tabs) | componentes locales + `<div>` de layout | primitivas kit (Page/Toolbar) + tokens |
| `EntityWorkspaceLayout` | mirror local | consumir `@luana/ui-kit` (borrar local) |
| `EntitySubNavBar` · `EmptyState` · `AutosaveBadge` | mirror local | consumir `@luana/ui-kit` (borrar local) |
| `abel/icp` (`IcpEntityLayoutClient`) | usa `EntityWorkspaceLayout` local | `EntityWorkspaceLayout` kit + archetype Detail/List |
| `globals.css` | valores marca + escala Tailwind cruda | valores marca + escala `@luana/design-tokens` |

## § Dudas abiertas

- **Q1 (técnico → `/architect`):** ¿`globals.css` IMPORTA `@luana/design-tokens` en el `@theme`, o duplica los valores con un arch-test que verifica el match? (Tailwind v4 no consume TS directo en `@theme`). El architect concreta el mecanismo.
- **Funcional bloqueante:** ninguna.

## § Mockup (FINAL · FIRMA 2)

- **Archivo:** `mockups/ds-base.html` (servir `python3 -m http.server 8888` → `http://localhost:8888/ds-base.html`).
- **Compone del canon** (`design-system-canon.md §6`): tokens de marca + átomos/moléculas de `@luana/ui-kit` + `EntityWorkspaceLayout`/`EntitySubNavBar` full-bleed + `EntityInfoCard` Opción B + `Group`+autosave + `EmptyState`/`ErrorState`. Cero `<div>` de layout a mano, cero arbitrary.
- **4 bloques:** A tokens · B átomos/moléculas · C hoja real `abel/icp` (master grid + detalle EntityWorkspaceLayout) dentro del shell · D estados.
- **Colores VERIFICADOS contra `nicolify.com` live** (2026-06-15): `#635BFF` (primary/Luana) + Abel/Brenda/Christian/Norvil + fuentes League Spartan/Bree Serif = confirmados en el sitio. Sara `#F59E0B` = valor ratificado en repo (ADR-nicolify-002, posterior a la web; no espejado en el sitio — Chris lo mantiene).
- Doble función: ratificación + **referencia visual del `SHELL-DESIGN-CONTRACT.md`** (AC-6).

## § Gherkin scenarios (GENERADOS · RONDA 2)

> Naturaleza: refactor/adopción estructural. Verificación REAL = ejercer la hoja en dev-app + leer logs + confirmar render/efecto; el lock eslint ES un test (su rojo = la prueba). NO "GET 200".

### SC-1 · happy — la hoja `abel/icp` renderiza compuesta de primitivas, fiel a lo ratificado
`Covers: [Bif-1, RN-1, RN-2, AC-3, AC-4, AC-5]`
- **given:** `globals.css` cementado (valores de marca intactos + escala `@luana/design-tokens`) + `abel/icp` re-expresado vía `EntityWorkspaceLayout` + archetypes del kit
- **when:** el usuario abre `/{tenantId}/abel/icp` en dev-app (master), selecciona un ICP (detalle)
- **then:** master = grilla `EntityInfoCard` full-width; detalle = `EntitySubNavBar` full-bleed + `Group` con 1 autosave; render visualmente equivalente a `ds-base.html` + `icp-buyer.html` ratificado; sin traceback en logs
- `playwright_required: true`
- **graders:** `{ e2e: nicolify/frontend/e2e/regression/nicolify-r0-design-system-adoption/abel-icp-fidelity.spec.ts }` · `{ visual_state: ".entity-sub-nav" → full-bleed sticky border-radius:0 }` · live-verify dev-app (abrir + leer logs + confirmar)

### SC-2 · negative — un arbitrary-value nuevo rompe el lock
`Covers: [RN-4, AC-2]`
- **given:** lock `no-arbitrary-value` encendido en cero allowlist
- **when:** se introduce `p-[13px]` o un hex hardcodeado en un componente nicolify
- **then:** `eslint` FALLA (regla `no-arbitrary-value`); pre-commit/CI bloquea
- `playwright_required: false`
- **graders:** `{ state_check: lint → eslint con arbitrary nuevo, expect: exit≠0 + regla no-arbitrary-value }`

### SC-3 · edge — arbitrary sin token equivalente → allowlist justificado
`Covers: [Bif-2, RN-4]`
- **given:** un valor estructural sin token en la escala (durante la migración de los 27)
- **when:** se evalúa el caso
- **then:** o se propone token a `@luana/design-tokens` (escalate `/pm-luana`), o entra al allowlist **con justificación** (ratchet shrink-only); NUNCA arbitrary suelto
- `playwright_required: false`
- **graders:** `{ state_check: repo → allowlist entries, expect: cada una con justificación + shrink-only }`

### SC-4 · adversarial — reaparece un mirror local de un componente del kit
`Covers: [Bif-3, RN-3, AC-1]`
- **given:** `EntityWorkspaceLayout`/`EntitySubNavBar`/`EmptyState`/`AutosaveBadge` viven SOLO en `@luana/ui-kit`
- **when:** alguien re-crea un `EntityWorkspaceLayout` local en `nicolify/frontend`
- **then:** arch-test anti-mirror FALLA; `grep` de componente kit duplicado local = 0 es invariante
- `playwright_required: false`
- **graders:** `{ state_check: arch-test → componente kit duplicado local, expect: 0 (FAIL si >0) }`

### SC-5 · accessibility — navegación por teclado preservada en `EntitySubNavBar`
`Covers: [RN-5, AC-5]`
- **given:** `EntitySubNavBar` del kit (`role=tablist` + roving tabindex)
- **when:** el usuario navega leaves con ←→/Home/End
- **then:** el foco se mueve correcto, leaf activo derivado de URL; `axe` wcag2aa sin violaciones nuevas
- `playwright_required: true`
- **graders:** `{ axe: wcag2aa }` · `{ e2e: a11y-subnav.spec.ts }`

### SC-6 · i18n / identidad — Spanish neutro + tokens de marca intactos tras la adopción
`Covers: [RN-1]`
- **given:** hojas re-expresadas
- **when:** render + inspección de tokens
- **then:** copy Spanish neutro (sin voseo); `--primary` = `#635BFF`/`243 100% 68%`, agent colors + fuentes League Spartan/Bree Serif intactos
- `playwright_required: false`
- **graders:** `{ state_check: globals.css → --primary + agent colors + fonts, expect: valores de marca intactos }`

### No aplican (`not_applicable_reason` ratificado Chris)
- **race_condition · concurrent_users · network_failure · large_dataset:** la adopción es **estructural** — no introduce path de datos ni mutación nueva → no aplican. `empty_state`/`error` quedan cubiertos por las primitivas `EmptyState`/`ErrorState` (fidelidad), no por data nueva.

## § Matriz de cobertura

| Ítem (Mapa funcional) | Tipo | Cubierto por | Verificación REAL |
|---|---|---|---|
| Bif-1 · arbitrary con token → migrar | branch | SC-1 | abrir hoja live → render equivalente + log sin error |
| Bif-2 · arbitrary sin token → escalate/allowlist | branch | SC-3 | allowlist con justificación + ratchet shrink-only |
| Bif-3 · componente local diverge → adoptar kit | branch | SC-4 | arch-test mirror = 0 |
| Bif-4 · hoja sin UI (skeleton) | branch | — (out-of-scope declarado) | no se toca; nace homologada al construirse |
| Bif-5 · Abel en reviewing | branch | — (coordinación `/pm-nicolify`) | re-audit + demo gate #37 sobre FE convergido al cierre |
| RN-1 · identidad preservada | rule | SC-1, SC-6 | globals.css `--primary`/agent/fonts intactos |
| RN-2 · escala compartida, no duplicada | rule | SC-1 | escala consumida de `@luana/design-tokens` |
| RN-3 · cero mirror | rule | SC-4 | grep mirror = 0 (arch-test) |
| RN-4 · cero arbitrary nuevo | rule | SC-2, SC-3 | lint FALLA con arbitrary nuevo |
| RN-5 · fidelidad visual | rule | SC-1, SC-5 | render equivalente + a11y preservada (live + axe) |
| RN-6 · mockup = dev | rule | — (AC-6 doc) | `SHELL-DESIGN-CONTRACT.md` actualizado |
| AC-1 · 0 mirror | accept | SC-4 | grep = 0 |
| AC-2 · 0 arbitrary | accept | SC-2 | lock verde |
| AC-3 · globals.css consume tokens | accept | SC-1, SC-6 | grep + render |
| AC-4 · hojas de primitivas | accept | SC-1 | arch-test no-div-layout |
| AC-5 · suites verdes + live-verify | accept | SC-1, SC-5 | tsc/eslint/vitest/e2e + dev-app |
| AC-6 · SHELL-DESIGN-CONTRACT actualizado | accept | — (doc) | doc citado |

**Huecos detectados:** ninguno (Bif-4 = out-of-scope declarado; Bif-5 = coordinación `/pm-nicolify`; RN-6/AC-6 = entregable doc, no SC). **SC huérfanos:** ninguno.

## § Estados visuales

| Estado | Trigger | Visible | Oculto |
|---|---|---|---|
| `success` (master) | ICPs cargados | grilla `EntityInfoCard` + Toolbar | skeleton |
| `success` (detalle) | ICP seleccionado | `EntitySubNavBar` full-bleed + `Group` + autosave | grilla master |
| `loading` | fetch | `ListPageSkeleton`/`EntityInfoCardSkeleton` (kit) | grilla |
| `empty` | 0 ICPs | `EmptyState` (kit) + CTA "+ Nuevo ICP" | grilla |
| `error` | fetch falló | `ErrorState` (kit, `role=alert`) + Reintentar | grilla |

## § Componentes (todos REUSE de `@luana/ui-kit` — cero NEW)

| Componente | Origen | Estado |
|---|---|---|
| `EntityWorkspaceLayout` · `EntitySubNavBar` · `EntityPicker` · `EntityInfoCard` | `@luana/ui-kit` | reuse (borrar mirror local) |
| `PageContainer`/`PageHeader`/`PageContentStack`/`Toolbar`/`FilterBar`/`Pagination` | `@luana/ui-kit` src/layout | reuse |
| `EmptyState`/`ErrorState`/`ListPageSkeleton` | `@luana/ui-kit` src/layout | reuse |
| `Select`/`Button`/`Input`/`Badge` (átomos shadcn) | `@luana/ui-kit` | reuse |
| `AutosaveBadge`/`FloatingAutosaveIndicator` | `@luana/ui-kit` | reuse (borrar mirror local) |
| escala spacing/radius-names/typography | `@luana/design-tokens` | reuse |

## § Microcopy (Spanish neutro)

| Lugar | Copy |
|---|---|
| Empty heading | "Aún no tienes ICPs" |
| Empty CTA | "Crear primer ICP" |
| Error | "No pudimos cargar los ICPs. Revisa tu conexión." |
| Autosave | "Guardado" |

## § Visual Goldens (mockup → golden → React → canon · ADR-nicolify-003)

> El contrato ejecutable que mecaniza "lo que veo = lo que programo". `/dev-team` genera el golden Playwright side-by-side (`maxDiffPixelRatio: 0.001`); el spec NOMBRA el elemento concreto que cada región del mockup debe ser en código.

| Región del mockup (`ds-base.html` ← `_shared.css`) | Golden snapshot | Componente React | Canon ref |
|---|---|---|---|
| Tokens (A) | `tokens-swatch.png` | `globals.css @theme` + `@luana/design-tokens` | §6.1 |
| Átomos/moléculas (B) | `atoms.png` | `@luana/ui-kit`: Button/Select/Badge/Input | §2.5, §2.8 |
| Master grid (C.1) | `abel-icp-master.png` | `EntityWorkspaceLayout` (master) + `EntityInfoCard` + `Toolbar` | §2.1, §2.3, §2.7 |
| Detalle (C.2) | `abel-icp-detail.png` | `EntityWorkspaceLayout` + `EntitySubNavBar` + `Group` + `FloatingAutosaveIndicator` | §2.1, §2.2, §2.6 |
| Estados (D) | `states.png` | `EmptyState` / `ErrorState` (@luana/ui-kit) | §2.7 |

**Base reusable:** `mockups/_shared.css` (tokens espejo de `globals.css` + átomos + moléculas + layout-primitives + shell wrapper verbatim). Todo mockup nicolify la linkea (ADR-nicolify-003). Ratchet shrink-only.

**★ Decisión de radio (RN-7 · coherencia pill):** los **controles** (button/input/select/textarea) de nicolify son **fully-rounded (pill)** — lenguaje visual de marca. Se implementa vía token brand-overridable **`--radius-control`** (nicolify = `--radius-pill`; vitalia = `md`): la primitiva compartida de `@luana/ui-kit` consume `--radius-control`, NO hardcodea `rounded-md`. Las **superficies** (card/group/panel/shell) mantienen `--radius`. **Architect/lift:** verificar que el átomo `Input`/`Button`/`Select` del kit exponga `--radius-control` (si hoy hardcodea el radio → es cambio de kit vía `/pm-luana`, para que mockup = código y la homologación se preserve con valor por marca).

## ✍ Firmas

- **FIRMA 1 (RONDA 1 · funcional):** Chris 2026-06-15 — `input_spec_signed: true`.
- **FIRMA 2 (mockup FINAL):** Chris 2026-06-15 — `mockup_final_signed: true` · colores verificados vs `nicolify.com` live · mockup compone de `_shared.css` (ADR-nicolify-003). → `state: refined`.
