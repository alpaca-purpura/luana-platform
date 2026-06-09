# Frontend Visual Fidelity (átomos/moléculas + mockup adherence + scope discipline)


> **Slim stub (context-rot pass 2026-05-30).** Cuerpo operativo completo en `.claude/skills/frontend-expert/references/visual-fidelity.md` — carga on-demand cuando `frontend-expert` / `builder-frontend` / `auditor-frontend` se activan. **Origen:** sesión 2026-05-28. **Cement-date:** 2026-05-28.

## Regla cardinal

El FE construido debe cumplir tres disciplinas (una verificación vía Playwright + auditor):

- **D1 — Design system first:** reutilizar átomos Shadcn (`components/ui/`) → tokens `@luana/design-tokens` → moléculas compartidas (`components/shared/`) → solo si nada sirve, crear en `features/{m}/components/` CON átomos. NUNCA reinventar una primitiva existente.
- **D2 — Mockup adherence:** parecerse al mockup en jerarquía visual, layout, estados (default/hover/loading/empty/error/success) y microcopy. Fidelidad = "un humano reconoce que es la misma pantalla", no pixel-perfect.
- **D3 — Scope discipline:** implementar SOLO lo que scopean los scenarios de `01-spec.md` + deliverables del ticket. Lo demás del mockup NO se construye en esta story.

## ★ Design System Canon (binding HARD — cement 2026-06-08, ratificado Chris)

> **SSoT:** `docs/architecture/luana-platform/design-system-canon.md` (contratos + ejemplos de código). Doctrina: `ADR-014`. **Toda hoja user-reachable, en TODAS las marcas, se ARMA del canon — no se maqueta a mano ni se reinventa una primitiva.**

**D1 se concreta así (deja de ser criterio, pasa a contrato verificable):**

- **Contenedor HOJA:** 100% ancho · franjas N3 **full-bleed** (`bg-card` + `border-bottom` + sticky, mismo lenguaje que Ribbon/SubTabs — **NUNCA** card con borde redondeado) · contenido en `PageContainer` (padding `1.25/1.5rem`) + `PageContentStack`. (canon §1)
- **List/detail = `EntityWorkspaceLayout`** (1-panel URL-driven: master grilla de `EntityInfoCard` + Toolbar; detalle = `EntitySubNavBar` full-bleed + leaf). Root-pill `‹ {RootLabel}` (flechita) vuelve; identidad = `EntityPicker` (▾, cambia sin volver). **NUNCA** cablear el list/detail a mano por superficie. (canon §2.1-2.2)
- **`EntityPicker`** = buscar (server-side debounced) + fetch paginado (cursor) + render windowed + lazy. **❌ cargar toda la colección al cliente.** (canon §2.4)
- **`EntityInfoCard` Opción B** (grid `auto-fill minmax(250px)`, circular, clickeable, kebab ⋮ + Skeleton + Empty). (canon §2.3)
- **`Select` canónico Shadcn-style.** **❌ `<select>` nativo** en producto. (canon §2.5)
- **Autosave:** `use-autosave` 600ms+coalesce + **UNA** `FloatingAutosaveIndicator` por página (sin badge por-grupo) + barrita de agente. (canon §2.6)
- **Page-primitives** (PageContainer/PageHeader/Section/Toolbar/FilterBar/EmptyState/ErrorState/skeletons/Pagination/DetailLayout/FormLayout). **❌ `<div>` de layout sueltos** donde hay primitiva. (canon §2.7)
- **Tooltip + color-por-agente** per canon §2.8. **❌ arbitrary-values** (spacing/radius/font-size/color-hex) — todo de tokens (canon §0).

**Binding por actor (HARD):**

| Actor | Gate |
|---|---|
| `/po-ux` | El mockup **compone del canon** (no inventa primitivas/layout). Cita `design-system-canon.md`. Sin eso → NO `refined`. |
| `/architect` | `03-arch.md` referencia los contratos del canon + `04-validators.yaml` declara los gates mecánicos (eslint no-arbitrary + arch-test no-div-layout). |
| `builder-frontend` (`/dev-team`) | Construye **desde** `@luana/ui-kit` (único lego). Reinventar primitiva / `<select>` nativo / arbitrary = **rechazo**. |
| `auditor-frontend` (`/auditor`) | Verifica **composición** (se usó el canon), no estilo a mano. Hoja con list/detail a mano, `<select>` nativo, `<div>` de layout, arbitrary, o franja N3 en card redondeada → **CHANGES_REQUESTED**. |

> **Migración (cement 2026-06-08):** punto de partida NUEVO. Lo que ya existe se **modifica** al canon (no se deja como estaba). Las stories de build/adopción (`core-ds-*`, `{brand}-ds-adoption`) lo materializan en `@luana/ui-kit` + lint + arch-test; mientras tanto, **toda hoja nueva o tocada nace/queda homologada al canon**.

## Cuándo carga el detalle

- `builder-frontend` arranca un ticket FE → leer D1/D2/D3 completos + gate pre-crear componente (bash snippet) + patrón Playwright scoped.
- `auditor-frontend` abre categoría Visual fidelity → leer enforcement layers + checklist 6 puntos.
- `/architect` FE declara `04-validators § playwright_visual_scope` → leer D3 + schema `story_scope_routes`/`story_scope_components`/`out_of_mockup_scope`.

## Anti-patterns (top 6 — lista completa en el detalle + canon)

- ❌ Reinventar un átomo/primitiva que ya existe (`@luana/ui-kit` / `components/ui/`)
- ❌ Implementar TODO el mockup cuando la historia scopea solo una parte (scope creep)
- ❌ `toHaveScreenshot()` de página completa fuera del scope de la historia (frágil)
- ❌ **Cablear list/detail a mano** en vez de `EntityWorkspaceLayout` · franja N3 en card redondeada en vez de tercer-ribbon full-bleed (canon §2.1-2.2)
- ❌ **`<select>` nativo** (usar `Select` canónico) · **arbitrary-values** spacing/radius/font-size/color (usar tokens) · `<div>` de layout donde hay page-primitive (canon §2.5, §2.7, §0)
- ❌ `/po-ux` mockup o `/dev-team` build que NO compone del `design-system-canon.md` (binding HARD)

## Referencias

- `docs/architecture/luana-platform/design-system-canon.md` — ★ **CANON binding** (contratos + ejemplos de código · lo que po-ux compone y dev-team construye)
- `docs/architecture/luana-platform/ADR-014-design-system-homologation.md` — doctrina (5 capas + enforcement mecánico)
- `.claude/skills/frontend-expert/references/visual-fidelity.md` — **cuerpo operativo completo** (D1/D2/D3 detallados, gate bash, patrón Playwright, auditor checklist, enforcement layers)
- `.claude/rules/frontend-fsd.md` — boundaries FSD-Lite + design system layers
- `.claude/rules/frontend-quality.md` — gates (tsc/eslint/vitest/jscpd)
- `.claude/rules/architect-autonomous-mode.md § playwright_visual_scope` — disciplina de scope visual
- `.claude/rules/spanish-text.md` — microcopy neutro
- `.claude/rules/anti-orphan-integration.md` — el componente debe estar enchufado (nav/route)
- `core/@luana/design-tokens` — tokens cross-brand
