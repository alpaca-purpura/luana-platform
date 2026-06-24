<!-- voseo-allowed: internal template documentation -->

# 01-spec.md — Template SHELL-ORGANISM (Vitalia override)

> **Override Vitalia** del template raíz `docs/specs/templates/01-spec-template.md`. Agrega secciones obligatorias del shell-organism: atomic design layers · reuse map exhaustivo · verificación visual (composición vs Storybook · canon §5) · zero deuda técnica checklist · dependencies cruzadas Fase 1/Fase 2.
>
> **Cuándo usar:** TODA historia Fase 1 (átomos del shell) y Fase 2 (sub-tabs activas). Para historias agentic-only o service-only sin UI, usar el template raíz.
>
> **SSoT que esta spec cita:**
> - `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md` (atomic design layers · tokens · stores · routing · a11y · testing)
> - `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` ★ **MANDATORY** — patrón transversal de 9 secciones (route group · FSD-Lite · Server-First · React Query/Zustand · RHF/Zod · DDD `PhiRepositoryBase` · migrations idempotent · `growth_studio_event` · tests 4 capas)
> - **Storybook** (`core/@luana/ui-kit` · stories `Shell/*` = SSoT visual del shell · `build-storybook`/`:6007`) — el viejo `dual-mode-shell.html` quedó SUPERSEDED (canon §5)
> - `vitalia/docs/product/stories/vitalia-shell-organism/00-session-baseline.md` (17 decisiones cementadas)
>
> **★ Citación obligatoria en frontmatter:** `architecture_pattern: ADR-vitalia-004` (sin este campo, `/architect` REFUSE arrancar — ver `vitalia/.claude/rules/shell-feature-architecture-mandatory.md`).

---

## Frontmatter

```yaml
---
story_id: STORY_ID_KEBAB                          # ej. vitalia-fase1-tenant-switcher
brand: vitalia                                    # ★ MANDATORY multibrand scope
architecture_pattern: ADR-vitalia-004             # ★ MANDATORY sub-tab stories — sin esto /architect REFUSE
type: ui-story | service-story | refactor-story   # shell stories son ui-story por default
phase: fase-1 | fase-2                            # categoría macro del backlog Vitalia
module: shell-organism | {agent} | {feature}
agent_owner: lisa | lucas | adrian | valeria | camila | config | shell   # qué agente "vive" en esta historia (shell = transversal)
capability: CAPABILITY_ID                          # ej. shell.tenant-switcher · agent.lisa.marca
po_version: 1
last_modified: ISO_TIMESTAMP
ratified_by_chris: false
ratified_visual_by_chris: false                   # ⚠️ LEGACY — gate ADR-vitalia-003 SUPERSEDED (canon §5). La firma visual viva es `mockup_final_signed` (RONDA 2, mockup compuesto de Storybook). Campo retenido solo por compat de stories viejas.
input_spec_signed: false                          # ★ RONDA 1 (intención) firmada · cement 2026-06-03 · ver spec-mapa-funcional.md § Dos rondas
mockup_final_signed: false                        # ★ mockup FINAL firmado (antes del GO a RONDA 2/Gherkin)
parallel_safe: true | false
dependencies:                                       # stories que DEBEN estar done antes
  hard: []                                          # bloquean implementación (ej. F1-S1 design-tokens → F1-S2 topbar)
  soft: []                                          # ideal pero no bloquean (ej. F2-S4 embudo soft-depends F2-S3 inbox)
service_blockers:                                   # service-stories (BE) que deben estar shipped
  - vitalia-payment-adapter-mvp                     # solo si aplica
  - vitalia-fiscal-emission-pe                      # solo si aplica
reuse_map_summary: "{1-line resumen qué se reusa de nicolify/core/legacy}"
estimated_dev_days: N                               # estimación dev días
priority: high | medium | low
links:
  design_contract: "vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md"
  mockup_visual: "vitalia/docs/product/stories/vitalia-shell-organism/mockups/dual-mode-shell.html"
  baseline_session: "vitalia/docs/product/stories/vitalia-shell-organism/00-session-baseline.md"
---
```

---

<!-- ═══ RONDA 1 · input-spec (intención + forma) · ✍ FIRMA 1 — Chris "esto es lo que quiero" (checkpoint.input_spec_signed: true) ═══ -->
<!-- Espejo del template raíz docs/specs/templates/01-spec-template.md · doctrina: docs/process/spec-mapa-funcional.md § Dos rondas, dos firmas. -->
<!-- RONDA 1 (firma1) = §1 Resumen + § Dónde vive (§2) + §3 Atomic Design + §4 Reuse Map + mockup BORRADOR. RONDA 2 (firma2, antes del GO) = §6 Gherkin + §7 Visual Goldens (mockup FINAL). -->

## § 1 — Resumen ejecutivo

[1 párrafo · ≤4 líneas: qué se construye, qué problema resuelve, outcome del usuario después de esta historia merged.]

**Anti-objetivos** (explícito qué NO hace esta historia para evitar scope creep):
- [Lo que NO se construye 1]
- [Lo que NO se construye 2]
- [Lo que NO se construye 3]

---

## § 2 — Visión (paradigma shell-organism)

[2-3 líneas conectando esta historia con la visión norte: "como una secretaria real, el dueño habla con Valeria y los agentes ejecutan". Explicar dónde encaja este átomo/sub-tab en el flujo end-to-end.]

**Agente owner:** {emoji} {nombre agente} ({rol})  
**Color oficial:** `#XXXXXX` (token CSS `--agent-{name}`)  
**Avatar PNG:** `vitalia/frontend/public/agents/{name}/thumbnail.png`

**Dónde vive (RONDA 1 · cement 2026-06-03):**
- **Zona/caja:** [Agentes {agente} | Plataforma {acceso/onboarding/configuración} | Infraestructura] — derivada del árbol `.claude/rules/paradigm-arquitectura.md` + `SYSTEM-MAP.yaml`
- **Shell:** shell-organism Vitalia · átomos/moléculas/organismos del `SHELL-DESIGN-CONTRACT.md` (ver § 3) · si falta un componente → se genera con el design-system actual
- **Ruta del user:** `/[tenantId]/(shell-organism)/{agent}/{subtab}[/{subsubtab} | /[entityId]/[leaf]]` donde el user aterriza (N3-static vs N3-dynamic list→detail · ver SHELL-DESIGN-CONTRACT § 7.2.2)
- **Mockup BORRADOR:** [link `mockups/{component}.html` — la FORMA, se itera en RONDA 1 antes de cerrar reglas; gate per-component ADR-vitalia-003]

---

## § 3 — Atomic Design Layers (referencia Design Contract § 3)

> Cada layer cita el componente del Design Contract. NO redefinir aquí — citar paths.

### § 3.1 — Átomos consumidos

| Átomo | Fuente | Variante | Path local |
|---|---|---|---|
| `Button` | Shadcn `npx shadcn add button` | `variant="ghost" size="icon"` | `components/ui/button.tsx` |
| `Avatar` | Shadcn | `default` | `components/ui/avatar.tsx` |
| ... | ... | ... | ... |

### § 3.2 — Moléculas construidas en esta historia

| Molécula | Composición | Props | Path nuevo |
|---|---|---|---|
| `{ComponentName}` | átomos del § 3.1 | `{prop1, prop2, ...}` | `components/shared/shell-organism/{ComponentName}.tsx` |
| ... | ... | ... | ... |

### § 3.3 — Organismos construidos en esta historia

| Organismo | Composición | State management | Keyboard | Path nuevo |
|---|---|---|---|---|
| `{OrganismName}` | moléculas + lógica | `useShellStore` · zustand | `Tecla` → acción | `components/shared/shell-organism/{OrganismName}.tsx` |

### § 3.4 — Templates / Pages modificadas

| Path Next.js | Cambio |
|---|---|
| `app/[tenantId]/(shell-organism)/layout.tsx` | NEW · ShellOrganismLayout 50/50 |
| `app/[tenantId]/(shell-organism)/page.tsx` | NEW · default redirect |
| ... | ... |

---

## § 4 — Reuse Map exhaustivo

> **Regla cardinal Chris 2026-05-22:** "no empezar de cero a menos que el desarrollo lo amerite". Esta sección documenta CADA pieza reutilizada con su origen y nivel de adaptación.

### § 4.1 — REUSE desde Nicolify

| Componente / Pattern Nicolify | Path origen | Cambio para Vitalia | Razón |
|---|---|---|---|
| `CopilotSidebar` | `nicolify/frontend/src/features/copilot/components/CopilotSidebar.tsx` | Transponer grid (rail/history a la izquierda del chat) · renombrar Valeria · cambiar tokens | El pattern 3-estados es perfecto · keyboard handlers idénticos |
| ... | ... | ... | ... |

### § 4.2 — REUSE desde core/luana-core-*

| Package consumido | Cómo se consume | Path import |
|---|---|---|
| `core/luana-core-iam` | Backend tenants → API `/api/tenants` → FE useTenantStore | (BE only — FE consume via REST) |
| ... | ... | ... |

### § 4.3 — REUSE desde Vitalia shipped

| Feature / Component shipped | Path actual | Refactor en esta historia |
|---|---|---|
| `vitalia/frontend/src/features/dashboard/components/DashboardWelcome.tsx` | actual `/(dashboard)/page` | Migrar contenido a empty-state Lisa→Marca o equivalente |
| ... | ... | ... |

### § 4.4 — NEW (creado de cero — justificación)

| Componente NEW | Razón por la cual NO se puede reusar |
|---|---|
| `LogoMark` | Custom branding Vitalia con gradiente cian→purpura |
| ... | ... |

### § 4.5 — Legacy `/home/chalreme/Documentos/ap_sales_agent`

| Pattern legacy revisado | Veredicto | Razón |
|---|---|---|
| {pattern} | REUSE / DESCARTE | {razón} |

---

## § 5 — API contracts (BE ↔ FE)

> Solo si la historia consume APIs. Si es 100% FE state local, marcar "N/A".

### § 5.1 — Endpoints consumidos

| Método | Path | Request | Response | Source |
|---|---|---|---|---|
| GET | `/api/tenants` | `headers: X-Tenant-ID` | `{ tenants: Tenant[] }` | `vitalia/backend/src/modules/vitalia/iam/api/tenants_router.py` (shipped) |
| ... | ... | ... | ... | ... |

### § 5.2 — TypeScript types compartidos

```ts
// vitalia/frontend/src/features/{feature}/types/{name}.types.ts
export interface Tenant {
  id: string
  name: string
  subtitle?: string
  // ...
}
```

---

## § 5.5 — Mapa funcional (capa humana · RONDA 1 · cement 2026-06-03 — espejo del template raíz)

> El panorama en lenguaje humano que Chris lee para validar QUÉ se construye sin reconstruirlo desde el Gherkin (§6). NO compite con el Gherkin — vive a otra altitud; la § 6.5 Matriz de cobertura (RONDA 2) los liga. SSoT doctrina: `docs/process/spec-mapa-funcional.md`.

### § 5.5.1 — Happy path (el camino dorado, narrado)

[Prosa numerada del flujo exitoso end-to-end dentro del shell. 3-8 pasos. Lenguaje humano, no Gherkin.]

### § 5.5.2 — Bifurcaciones (árbol de decisión — TODOS los branch points)

> Árbol, no lista plana. Cada nodo: condición → resultado → [SC-N]. Incluí las ramas N3-static vs N3-dynamic list→detail si aplica (SHELL-DESIGN-CONTRACT § 7.2.2).

```
Happy path
├─ Bif-1 · ¿[condición]?        → [resultado]       → SC-N
└─ Bif-2 · ¿[borde/error]?      → [resultado]       → SC-N
```

### § 5.5.3 — Reglas de negocio (RN — invariantes en lenguaje humano)

- **RN-1** — [invariante en una frase · si toca PHI, citar dual filter tenant+clinic de hipaa-lite]
- **RN-2** — [...]

### § 5.5.4 — Criterios de aceptación (AC — checklist "listo cuando…")

- [ ] **AC-1** — [condición observable de feature-done]
- [ ] **AC-2** — [...]

Cada `Bif-N` y `RN-N` DEBE mapear a ≥1 scenario en la § 6.5 Matriz de cobertura. Hueco → REFUSE refined.

---

<!-- ═══ RONDA 2 · spec ejecutable · ✍ FIRMA 2 → refining→refined (incluye mockup FINAL §7 + graders) · checkpoint.mockup_final_signed: true ═══ -->

## § 6 — Acceptance Criteria (Gherkin AI-resistant)

> **Mínimo 4 scenarios base + sub-categorías aplicables.** Sub-categorías obligatorias: `happy-path` · `negative` · `edge` · `adversarial` · `keyboard-a11y` · `theme-switch` · `mobile-responsive` · `loading-state` · `error-state`.

### Scenario 1 — `happy-path` (type: happy)

**Given:**
- Usuario autenticado con tenant activo `tenant_id=sonrisa-plena`
- Theme actual `light`
- Valeria state `rail` (default)

**When:**
- Usuario click en `[data-testid="ribbon-tab-lisa"]`

**Then:**
- URL cambia a `/{tenant_id}/(shell-organism)/lisa/marca` (redirect a default sub-tab)
- Ribbon tab "Lisa" tiene border-bottom 3px color `--agent-lisa` (#00D084)
- Avatar Lisa tiene border 2px color `--agent-lisa`
- Sub-tabs línea 2 renderiza 4 items: Marca · Doctores · Servicios · Compliance
- Sub-tab "Marca" tiene background `--agent-lisa-soft` y text color `--agent-lisa`
- Content area renderiza componente `LisaMarcaPage` (empty-state placeholder en Fase 1)
- Valeria sidebar permanece en `rail` state sin cambios

**playwright_required:** true  
**Graders:**
- E2E functional: `e2e/shell-organism/ribbon-navigation.spec.ts`
- Visual golden: `e2e/__screenshots__/ribbon-navigation/lisa-active.png`
- a11y axe: `e2e/shell-organism/ribbon-a11y.spec.ts`

---

### Scenario 2 — `negative` (type: negative)

**Given:** Usuario navega manual a `/{tenant_id}/(shell-organism)/inexistente/foo`

**When:** Next.js intenta resolver la ruta

**Then:**
- Render `not-found.tsx` con mensaje "Agente no encontrado" + CTA "Volver al inicio"
- NO 500 error
- Audit log NOT triggered (es 404 user, no security event)

**playwright_required:** true  
**Graders:** E2E `e2e/shell-organism/routing-404.spec.ts`

---

### Scenario 3 — `edge` (type: edge)

**Given:**
- Usuario en `lisa/marca`
- Tenant activo cambia a `dermalia-mx` via TenantSwitcher

**When:** API `/api/tenants/switch` retorna 200

**Then:**
- Hard redirect a `/{dermalia-mx}/(shell-organism)/lisa/marca` (preserva agent + subtab)
- LocalStorage `x-tenant-id` actualizado
- React Query cache invalidado (queries con tenant scope refetchean)

**playwright_required:** true  
**Graders:** E2E `e2e/shell-organism/tenant-switch.spec.ts`

---

### Scenario 4 — `adversarial` (type: adversarial)

> AI-resistant: input hostil, tenant cross-leak, sesión inválida.

**Given:** Usuario con JWT expirado intenta acceder al shell

**When:** Click cualquier ribbon tab

**Then:**
- Clerk middleware redirige a `/sign-in`
- NO leak de data del shell (ningún render del shell-organism happens)
- Sesión limpiada de stores zustand (`useShellStore.getState().reset()`)

**playwright_required:** true  
**Graders:** E2E `e2e/shell-organism/auth-guard.spec.ts`

---

### Scenario 5 — `keyboard-a11y` (type: a11y)

**Given:** Usuario en shell, foco en TopBar logo

**When:** Presiona `Tab` 5 veces

**Then:**
- Foco viaja: Logo → ThemeToggle → TenantSwitcher → primer Ribbon tab → primera Sub-tab
- Cada elemento tiene visible focus ring (CSS `:focus-visible`)
- aria-labels son leídos por screen reader (verificable con axe-core)

**playwright_required:** true  
**Graders:** E2E `e2e/shell-organism/keyboard-nav.spec.ts` + axe-core

---

### Scenario 6 — `theme-switch` (type: visual)

**Given:** Usuario en shell, theme `light`

**When:** Click `[data-testid="theme-toggle"]`

**Then:**
- `<html data-theme="dark">` aplicado
- CSS variables switchean a dark variants
- TODOS los componentes del shell renderizan en dark mode sin contraste roto
- localStorage `vitalia-theme` = `"dark"` persistido
- Visual diff entre light/dark capturado en golden

**playwright_required:** true  
**Graders:** Visual golden light + dark + a11y axe en ambos modes

---

### Scenario 7 — `mobile-responsive` (type: responsive)

**Given:** Viewport `375x667` (mobile)

**When:** Usuario abre el shell

**Then:**
- ShellOrganismLayout NO renderiza 50/50 (no espacio)
- Valeria sidebar → drawer overlay (slide-in desde izq, similar mobile copilot Nicolify)
- Ribbon tabs → scroll horizontal
- ContentArea ocupa 100% width
- Hamburger button visible TopBar para abrir Valeria drawer

**playwright_required:** true  
**Graders:** Playwright `@project=mobile` visual golden mobile

---

### Scenario 8 — `loading-state` (type: ux)

**Given:** Usuario en shell, click tab "Mantener" (Camila)

**When:** `/api/conversations?agent=camila` está pending (latency 200-500ms)

**Then:**
- Sub-tabs línea 2 renderiza inmediatamente (no waits API — es estático del whitelist)
- ContentArea muestra skeleton (Shadcn `Skeleton` component)
- Cuando data llega, skeleton fade out + contenido fade in

**playwright_required:** false (unit/integration suficiente)  
**Graders:** Vitest integration con MSW mock latency

---

### Scenario 9 — `error-state` (type: ux)

**Given:** Usuario en shell, API `/api/tenants` retorna 500

**When:** TenantSwitcher intenta cargar lista tenants

**Then:**
- Dropdown muestra `<ErrorAlert>` (Shadcn `Alert variant="destructive"`)
- Mensaje user-facing: "No pudimos cargar tus clínicas. Intentalo en unos segundos."
- Botón "Reintentar" dispara refetch
- Sentry capture del error con context (NO PHI)

**playwright_required:** true  
**Graders:** E2E con MSW mock error · visual golden error state

---

## § 6.5 — Matriz de cobertura (RONDA 2 · cement 2026-06-03 — el puente humano ↔ verificación)

> Cierra el loop: cada `Bif-N`/`RN-N` del § 5.5 Mapa funcional → ≥1 SC (§6) → verificación REAL (acción ejercida + efecto observado, NUNCA "GET 200" — `.claude/rules/test-design-doctrine.md` § Verificación REAL). En shell stories la verificación REAL incluye el visual golden (§7) + el ejercicio live en dev-app (Critical Rule #37). Mitad delantera del `gherkin-matrix.md` que /auditor completa en Phase D.

| Ítem (Mapa funcional) | Tipo | Cubierto por | Verificación REAL (acción + efecto) |
|---|---|---|---|
| Bif-N · … | branch | SC-N | [write real → efecto DB/UI + log + golden §7] |
| RN-N · … | rule | SC-N | [acción que viola la regla → rechazo + estado sin cambio] |
| AC-N · … | accept | SC-N | [flujo real + estado observable] |

Cerrá con **Huecos detectados** (Bif/RN sin SC) y **SC huérfanos** (SC sin ítem del mapa). Ambos = "ninguno" para pasar el gate refined.

---

## § 7 — Verificación visual (composición vs Storybook · canon §5)

> **Regla cardinal Chris 2026-05-22 (re-grounded 2026-06-22):** "siempre debes verificar con playwright que lo que se ha creado cumple tanto a nivel funcional como a nivel diseño ui con lo planificado por el arquitecto" — pero el SSoT visual es **Storybook** (`@luana/ui-kit`), NO un mockup HTML por-componente. El golden-side-by-side-vs-`mockup.html` quedó **SUPERSEDED**.

### § 7.1 — Qué se verifica (composición, no golden-vs-mockup)

| Verificación | Cómo | Gate |
|---|---|---|
| Se **compuso desde `@luana/ui-kit`** (stories que `/architect` citó), no a mano | `/auditor` Cat 16 (Storybook-first) + lectura del diff | CHANGES_REQUESTED si maquetado a ojo / CSS inventado / `_shared.css` |
| Net-new shared **promovido al kit + story** (no local) | `/auditor` Cat 16 (Promote check) | CHANGES_REQUESTED si quedó local en `features/{m}/` |
| Cero arbitrary-value (spacing/radius/font/color-hex) | eslint `no-arbitrary-value` (pre-commit) | FAIL |
| Cero `<div>` de layout donde hay page-primitive | arch-test `no-div-layout` (ratchet shrink-only) | FAIL |
| Playwright visual **scoped** sobre las rutas/componentes de la story | `04-validators § playwright_visual_scope` | per scope |

### § 7.2 — Visual scoped (no golden-vs-mockup-HTML)

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}/vitalia/frontend

# Visual scoped sobre la(s) ruta(s) de la story (04-validators § playwright_visual_scope):
npx playwright test e2e/visual/{story}.spec.ts --project=desktop,mobile
# Verifica estados (default/hover/loading/empty/error/success) y responsive — NO un diff pixel vs mockup.html.
```

### § 7.3 — Notas

- La fidelidad = "compuesto del kit + estados renderizados", no "diff < 0.1% vs un HTML maquetado a ojo".
- Para descubrir el componente REAL antes de construir: Storybook (`pnpm --filter @luana/ui-kit build-storybook` o dev `:6007`) o `/showcase`.

---

## § 8 — Acceptance criteria operacionales

| # | Criterio | Verificación |
|---|---|---|
| AC-1 | Componente renderiza en todas las variantes de props documentadas | Vitest unit + Storybook variants |
| AC-2 | Compuesto desde `@luana/ui-kit` (Storybook) + net-new promovido al kit | `/auditor` Cat 16 + eslint no-arbitrary + arch-test no-div-layout |
| AC-3 | Funcional E2E: usuario completa happy-path sin errores | Playwright `@project=smoke` |
| AC-4 | A11y axe pass (WCAG 2.1 AA) | Playwright `@project=a11y` |
| AC-5 | Keyboard navigation Tab + shortcuts funciona | E2E test específico |
| AC-6 | Light + Dark mode ambos visualmente correctos | Playwright visual scoped light + dark |
| AC-7 | Mobile responsive (≥375px) sin overflow | Playwright `@project=mobile` |
| AC-8 | NO `.vt-*` utility class usada en código nuevo | Arch fitness test `test-no-vt-classes-in-new-features.ts` |
| AC-9 | NO `any` TypeScript, NO `default export` | ESLint pass |
| AC-10 | Coverage ≥80% del componente nuevo | Vitest coverage report |

---

## § 9 — Zero deuda técnica — checklist mandatorio

> Auditor REFUSE merge si algún item falla.

- [ ] **Lint:** `npx eslint src/{path}/ --max-warnings 0`
- [ ] **TypeScript:** `npx tsc --noEmit` 0 errors
- [ ] **Format:** `npx prettier --check src/{path}/`
- [ ] **Vitest unit ≥80% coverage** del componente nuevo (lines + branches)
- [ ] **Playwright functional E2E** pasa (`@project=smoke`)
- [ ] **Playwright visual scoped** (composición vs story de Storybook · canon §5 — NO golden-vs-mockup-HTML)
- [ ] **Playwright a11y** axe pass (`@project=a11y`)
- [ ] **NO `.vt-*` classes** en código nuevo (arch test bloquea)
- [ ] **NO `any`** TypeScript (use `unknown` + type guards)
- [ ] **NO default exports** (FSD-Lite enforce)
- [ ] **NO cross-feature imports** (boundaries ESLint)
- [ ] **Storybook story** del componente con 2+ variantes
- [ ] **Spanish neutro LatAm** en strings user-facing (revisar contra `.claude/rules/spanish-text.md`)
- [ ] **CSS variables consumidas** (`hsl(var(--token))`, NO hex hardcoded)
- [ ] **Mobile responsive** (breakpoint md+ minimum)
- [ ] **Dark mode** soportado (CSS vars switch automático)
- [ ] **Skip link funcional** (si organism top-level)
- [ ] **aria-labels presentes** en interactive elements
- [ ] **data-testid** estables en elementos para Playwright (convention: `data-testid="{component-kebab}-{role}"`)
- [ ] **No imports cross-brand** (`{other-brand}/...`)
- [ ] **No core engine direct edits** (solo consumo via API/imports)

---

## § 10 — Dependencies map

### § 10.1 — Dependencies hard (bloquean implementación)

```
Esta historia depende HARD de:
- {story-id-X} (state: done o developed) — razón
- {story-id-Y} — razón
```

### § 10.2 — Dependencies soft (mejor si existe, no bloquea)

```
- {story-id-Z} — razón opcional
```

### § 10.3 — Service blockers BE (must be developed o higher)

```
- vitalia-payment-adapter-mvp — para feature X (solo si aplica)
- vitalia-fiscal-emission-pe — para feature Y (solo si aplica)
```

### § 10.4 — Esta historia bloquea (downstream)

```
Esta historia desbloquea:
- {story-id-A}
- {story-id-B}
```

---

## § 11 — Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Tailwind v4 bug runtime | Media | Alto | F1-S0 verifica empíricamente · fallback Tailwind v3 si critical |
| Shadcn primitives no compatibles React 19 | Baja | Alto | Shadcn declared React 19 compatible — verify durante install |
| `.vt-*` deprecation rompe shipped UI | Media | Medio | Convivencia temporal · migrate solo en sub-tab que owns esa feature |
| ... | ... | ... | ... |

---

## § 12 — Definición de "Done"

Historia transition `developed → reviewing` cuando:

1. Todos los AC-N del § 8 verificados
2. Todos los items del checklist § 9 ✓
3. Playwright visual goldens generados + ratificados Chris
4. Story commits pushed + PR/branch wip/* sync con main
5. T-{n}-result.md escrito con SHA commits + log decisiones implementación
6. Handoff `/auditor` emitido automáticamente

Auditor APPROVED → `/pm-vitalia merge` → state `done`.

---

## § 13 — Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Mockup HTML:** `vitalia/docs/product/stories/vitalia-shell-organism/mockups/dual-mode-shell.html`
- **Baseline funcional:** `vitalia/docs/product/stories/vitalia-shell-organism/00-session-baseline.md`
- **Template raíz Luana:** `docs/specs/templates/01-spec-template.md`
- **FSD-Lite rules:** `.claude/rules/frontend-fsd.md`
- **HIPAA-lite overlay:** `vitalia/.claude/rules/hipaa-lite.md`
- **Spanish neutro:** `.claude/rules/spanish-text.md`

---

## § 14 — Changelog spec

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | YYYY-MM-DD | Draft inicial /po-ux |
| ... | ... | ... |
