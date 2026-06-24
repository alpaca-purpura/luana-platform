# Vitalia — Design System (Storybook-first · ex Shell Mockup-per-Component Protocol)

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `frontend-visual-fidelity.md § Storybook` + `frontend-fsd.md`).
**Brand:** vitalia (Salud + Bienestar — shell-organism agéntico)
**SSoT visual:** **Storybook** (`core/@luana/ui-kit`, canon §5).
**Cement-date:** 2026-05-22 (mockup-per-component original) → **Storybook-first 2026-06-22 (canon)**, **vitalia alineado 2026-06-24 · HB-105**.
**Doctrina binding:** `.claude/rules/frontend-visual-fidelity.md § Storybook` + `docs/architecture/luana-platform/design-system-canon.md §5`.

> **★ SUPERSEDED — el modelo mockup-HTML per-componente (`_shared.css` + wrapper portado verbatim de `dual-mode-shell.html` + `ratified_visual_by_chris` + visual-golden-vs-mockup) quedó MUERTO (canon §5, cement 2026-06-22).** El SSoT visual de vitalia (como de TODAS las marcas) es **Storybook** (`core/@luana/ui-kit`): "lo que ves en Storybook = lo que se programa". El antiguo protocolo (ADR-vitalia-003) ya **NO es un gate activo**. El nombre del archivo (`shell-mockup-per-component`) es legacy; su contenido vigente es Storybook-first.

## Regla cardinal (Storybook-first)

El diseño y el build de toda hoja user-reachable de vitalia **parten del set de Storybook** (`@luana/ui-kit`), no de un mockup HTML maquetado a ojo. El bucle (canon §5 · 3 pasos):

1. **Partir de Storybook** — el componente REAL vive en `@luana/ui-kit`. Se consume como HTML renderizado (`storybook-static/` vía `pnpm --filter @luana/ui-kit build-storybook`, o dev `:6007`, o `…/iframe.html?id=<story>&viewMode=story`) → misma base que el build. **NO inventar CSS, NO copiar `_shared.css`, NO portar verbatim mockups HTML archivados.**
2. **No limitarse** — si falta una pieza o hay algo genuinamente mejor, se **PROPONE** (Storybook es el piso, no el techo).
3. **Promover de vuelta** — lo que se usa y prueba bien se **PROMUEVE a `@luana/ui-kit` + su story** (vía `core-ds-*` / promotion gate `/pm-luana`). Una pieza net-new que queda local en `features/{agent}/` sin promover = **deuda** (la caza el auditor).

`/architect` no arranca un ticket FE sin que `03-arch.md § FE` cite la(s) story(s) de Storybook a usar; net-new se marca `PROMOTE` (deliverable = crear el componente en `@luana/ui-kit` + story antes del merge).

## Scope

**Aplica:** toda story con UI nueva (sub-tab `lisa-*`/`mateo-*`/`adrian-*`/`lucas-*`/`camila-*`/`plataforma-*`/`onboarding-*`, componente del shell).
**NO aplica:** service-only · agentic-conversacional pura (`/ux-agentico`) · componentes atómicos ya en el kit.

## Constraints (composición del canon)

- **Tokens:** clases Tailwind mapeadas a `vitalia/frontend/src/app/globals.css` (primario cian `#01B2F8` · accent púrpura `#7B2D91` · gradiente mariposa · agent colors). **Cero hex/px nuevo, cero arbitrary-value** (canon §0).
- **Átomos/moléculas/primitivas:** consumir de `@luana/ui-kit` (canon §6) — NUNCA reinventar (`frontend-visual-fidelity.md` D1).
- **List/detail:** `EntityWorkspaceLayout` (canon §2.1-2.2) · franjas N3 **full-bleed** (NUNCA card redondeada) · `Select` canónico (NUNCA `<select>` nativo, canon §2.5).
- **Shell:** Ribbon 5 especialistas (Lisa·Mateo·Adrián·Lucas·Camila) + Plataforma + `ValeriaSidebar` supervisora viven en Storybook (`Shell/*`) — partir de ahí, NO reinventar el wrapper simplificado.
- **PHI:** UI que muestra PHI → `PiiMaskedSpan` + `RequireRole` (`vitalia/.claude/rules/hipaa-lite.md`). Nunca PHI en `localStorage`/`searchParams`.
- Datos LatAm realistas (no Lorem ipsum). Spanish neutro LatAm (sin voseo).

## Verificación visual (ex visual golden)

`01-spec.md § Visual Goldens` mapea `story de Storybook → componente React (@luana/ui-kit o feature) → canon ref`. `/dev-team` verifica **composición** contra la story de Storybook (no contra un mockup HTML). Net-new sin promover al kit + story = CHANGES_REQUESTED. El signoff visual de Chris (`mockup_final_signed`, po-ux RONDA 2) ratifica el mockup **compuesto de Storybook** — ya no un HTML maquetado a ojo.

## Anti-patterns

- ❌ Diseñar/maquetar UI sin partir de Storybook — inventar CSS, copiar `_shared.css`, o portar verbatim `dual-mode-shell.html` (mecanismos MUERTOS, canon §5)
- ❌ Pieza shared net-new que queda local en `features/{agent}/components/` sin promover a `@luana/ui-kit` + story (drift garantizado)
- ❌ Reinventar un átomo/primitiva que ya vive en `@luana/ui-kit`
- ❌ `<select>` nativo · arbitrary-value · `<div>` de layout donde hay page-primitive · franja N3 en card redondeada (canon §2.5/§0/§2.7/§2.2)
- ❌ `/architect` que NO cita la story de Storybook a usar (builder improvisa sin saber qué lego)

## Enforcement layers

| Layer | Mecanismo |
|---|---|
| `/po-ux` | parte de Storybook para componer la hoja + cita `design-system-canon.md §5`; pieza que falta/mejor → la **PROPONE**. Firma 2 (`mockup_final_signed`) ratifica el mockup compuesto de Storybook |
| `/architect` | `03-arch.md § FE` cita la story de Storybook (+ link); net-new = `PROMOTE` deliverable + `04-validators` gates mecánicos (eslint no-arbitrary + arch-test no-div-layout) |
| `/dev-team` | construye **desde la story citada** (`@luana/ui-kit` = único lego); net-new se PROMUEVE al kit + story |
| `/auditor` | verifica **composición** vs Storybook + que el net-new se promovió al kit con story (no quedó local) → si no, CHANGES_REQUESTED |

## Referencias

- `.claude/rules/frontend-visual-fidelity.md § Storybook` — ★ **doctrina binding** (D1 = partir de Storybook + promover)
- `docs/architecture/luana-platform/design-system-canon.md §5` — el bucle de los 5 actores
- `docs/architecture/luana-platform/ADR-014-design-system-homologation.md` — homologación cross-brand
- `.claude/skills/vitalia-design-system/SKILL.md` — índice cargable del DS de vitalia (Storybook-first)
- `vitalia/docs/architecture/ADR-vitalia-003-shell-mockup-per-component-protocol.md` — **SUPERSEDED** (registro histórico del por qué del viejo modelo `_shared.css`)
- `vitalia/.claude/rules/shell-feature-architecture-mandatory.md` — ADR-vitalia-004 (patrón de build, complementario)
- `vitalia/.claude/rules/hipaa-lite.md` — overlay PHI (dual filter, audit, retention)
- `nicolify/.claude/rules/shell-mockup-per-component.md` — análogo aligned (espejo cross-brand · HB-103)
