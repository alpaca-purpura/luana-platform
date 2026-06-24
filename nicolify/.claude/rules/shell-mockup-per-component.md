# Nicolify — Design System (Storybook-first · ex Mockup-Base Protocol)

**Overlay:** extiende `.claude/rules/` raíz (refuerza `frontend-visual-fidelity.md § Storybook` + `frontend-fsd.md`).
**Brand:** nicolify · **SSoT visual:** **Storybook** (`core/@luana/ui-kit`, canon §5).
**Cement-date:** 2026-06-15 (mockup-base original) → **Storybook-first 2026-06-22 (canon)**, **nicolify alineado 2026-06-23 · HB-103**.
**Doctrina binding:** `.claude/rules/frontend-visual-fidelity.md § Storybook` + `docs/architecture/luana-platform/design-system-canon.md §5`.

> **★ SUPERSEDED — el modelo `_shared.css` / mockup-HTML per-componente quedó MUERTO (canon §5, cement 2026-06-22).** El SSoT visual de nicolify (como de TODAS las marcas) es **Storybook** (`core/@luana/ui-kit`): "lo que ves en Storybook = lo que se programa". El antiguo protocolo (todo mockup linkea `_shared.css` + wrapper verbatim de `shell.html`) ya **NO es un gate activo**. El nombre del archivo (`shell-mockup-per-component`) es legacy; su contenido vigente es Storybook-first.

## Regla cardinal (Storybook-first)

El diseño y el build de toda hoja user-reachable de nicolify **parten del set de Storybook** (`@luana/ui-kit`), no de un mockup HTML hecho a ojo. El bucle (canon §5 · 3 pasos):

1. **Partir de Storybook** — el componente REAL vive en `@luana/ui-kit`. Se consume como HTML renderizado (`storybook-static/` vía `pnpm --filter @luana/ui-kit build-storybook`, o dev `:6007`, o `…/iframe.html?id=<story>&viewMode=story`) → misma base que el build. **NO inventar CSS, NO copiar `_shared.css`, NO maquetar a ojo.**
2. **No limitarse** — si falta una pieza o hay algo genuinamente mejor, se **PROPONE** (Storybook es el piso, no el techo).
3. **Promover de vuelta** — lo que se usa y prueba bien se **PROMUEVE a `@luana/ui-kit` + su story** (vía `core-ds-*` / promotion gate `/pm-luana`). Una pieza net-new que queda local en `features/{agent}/` sin promover = **deuda** (la caza el auditor).

`/architect` no arranca un ticket FE sin que `03-arch.md § FE` cite la(s) story(s) de Storybook a usar; net-new se marca `PROMOTE` (deliverable = crear el componente en `@luana/ui-kit` + story antes del merge).

**Aplica a reusables (§5.bis):** esta regla aplica a componentes reutilizables del kit (≥2 usos o genéricos cross-brand). Componentes feature-local de un solo uso quedan en `features/{m}/components/` — OK sin story, sin enforcement de mockup de kit.

## Scope

**Aplica:** toda story con UI nueva (sub-tab `abel-*`/`brenda-*`/`christian-*`/`sara-*`/`norvil-*`/`config-*`, componente del shell).
**NO aplica:** service-only · agentic-conversacional pura (`/ux-agentico`) · componentes atómicos ya en el kit.

## Constraints (composición del canon)

- **Tokens:** clases Tailwind mapeadas a `nicolify/frontend/src/app/globals.css` (identidad `#635BFF` + agent colors + League Spartan/Bree Serif vs nicolify.com). **Cero hex/px nuevo, cero arbitrary-value** (canon §0).
- **Átomos/moléculas/primitivas:** consumir de `@luana/ui-kit` (canon §6) — NUNCA reinventar (`frontend-visual-fidelity.md` D1).
- **List/detail:** `EntityWorkspaceLayout` (canon §2.1-2.2) · franjas N3 **full-bleed** (NUNCA card redondeada) · `Select` canónico (NUNCA `<select>` nativo, canon §2.5).
- **Guardrails agénticos (vs PHI de vitalia):** superficie que un agente opera (Brenda kill-switch, Christian outbound) muestra el **audit/consentimiento** en la hoja (`agent-revenue-engine.md`). Sin PHI.
- Datos LatAm B2B realistas (no Lorem ipsum). Spanish neutro (tuteo, sin voseo).

## Verificación visual (ex visual golden)

`01-spec.md § Visual Goldens` mapea `story de Storybook → componente React (@luana/ui-kit o feature) → canon ref`. `/dev-team` verifica **composición** contra la story de Storybook (no contra un mockup HTML). Net-new sin promover al kit + story = CHANGES_REQUESTED.

## Anti-patterns

- ❌ Diseñar/maquetar UI sin partir de Storybook — inventar CSS, copiar `_shared.css` o el mockup-kit (mecanismos MUERTOS, canon §5)
- ❌ Pieza shared net-new que queda local en `features/{agent}/components/` sin promover a `@luana/ui-kit` + story (drift garantizado · futuras historias no la reusan)
- ❌ Reinventar un átomo/primitiva que ya vive en `@luana/ui-kit`
- ❌ `<select>` nativo · arbitrary-value · `<div>` de layout donde hay page-primitive · franja N3 en card redondeada (canon §2.5/§0/§2.7/§2.2)
- ❌ `/architect` que NO cita la story de Storybook a usar (builder improvisa sin saber qué lego)

## Enforcement layers

| Layer | Mecanismo |
|---|---|
| `/po-ux` | parte de Storybook para componer la hoja + cita `design-system-canon.md §5`; pieza que falta/mejor → la **PROPONE** (con plan de promoción) |
| `/architect` | `03-arch.md § FE` cita la story de Storybook (+ link); net-new = `PROMOTE` deliverable + `04-validators` gates mecánicos (eslint no-arbitrary + arch-test no-div-layout) |
| `/dev-team` | construye **desde la story citada** (`@luana/ui-kit` = único lego); net-new se PROMUEVE al kit + story |
| `/auditor` | verifica **composición** vs Storybook + que el net-new se promovió al kit con story (no quedó local) → si no, CHANGES_REQUESTED |

## Referencias

- `.claude/rules/frontend-visual-fidelity.md § Storybook` — ★ **doctrina binding** (D1 = partir de Storybook + promover)
- `docs/architecture/luana-platform/design-system-canon.md §5` — el bucle de los 5 actores
- `docs/architecture/luana-platform/ADR-014-design-system-homologation.md` — homologación cross-brand
- `.claude/skills/nicolify-design-system/SKILL.md` — índice cargable del DS de nicolify (Storybook-first)
- `nicolify/docs/architecture/ADR-nicolify-003-mockup-base-protocol.md` — **SUPERSEDED** (registro histórico del por qué del viejo modelo `_shared.css`)
- `nicolify/.claude/rules/shell-feature-architecture.md` — ADR-nicolify-001 (patrón de build, complementario)
- `vitalia/.claude/skills/vitalia-design-system/SKILL.md` §4/§6 — análogo aligned (espejo cross-brand)
