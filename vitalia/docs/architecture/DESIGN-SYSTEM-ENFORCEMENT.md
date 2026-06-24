# Design System Enforcement — Patrones canónicos vitalia (Storybook-first)

> **Fecha:** 2026-06-11 · **Storybook-first 2026-06-23 (HB-104).** **Basado en:** el canon cross-brand (`docs/architecture/luana-platform/design-system-canon.md §5`). **Aplica a:** todas las historias UI vitalia (refining / idea). **Enforcement:** pre-commit lint (`no-arbitrary`) + `/po-ux` gate refining→refined + `/auditor` cat 9 (visual fidelity).
>
> **★ SSoT visual = Storybook** (`core/@luana/ui-kit`): el diseño/build **parte de las stories de Storybook**, no de un mockup HTML maquetado a ojo. El viejo modelo `_shared.css` + `dual-mode-shell.html` portado verbatim + golden-vs-mockup quedó **MUERTO** (canon §5 · `vitalia/.claude/rules/shell-mockup-per-component.md` reescrita). Esta checklist (N3 / EntityInfoCard / page-primitives / tokens / átomos) sigue vigente — solo cambia que la **base visual es Storybook**.

## ★ Checklist obligatorio POR STORY UI

Toda story tipo `ui-story` que refine en vitalia MUST completar este checklist ANTES de pasar refining→refined:

### § Patrón (zona → caja → componentes)

- [ ] **Zona declarada** en checkpoint.md (`map_zone` ∈ {agentes, plataforma, infraestructura})
- [ ] **Caja del mapa** en checkpoint.md (`agent_owner` | `module`) — deriva de `SYSTEM-MAP.yaml`
- [ ] **Shell correcto** cita `SHELL-DESIGN-CONTRACT.md` (ribbon/sub-tab/routing)
- [ ] **Ruta real** donde el user aterriza (ej. `/{tenantId}/adrian/embudo`)

### § Componentes reusables (N3 / EntityInfoCard / Autosave)

**Usa UNO según la naturaleza:**

#### A. List/Detail (N3)
- [ ] `EntityWorkspaceLayout` (master = grilla `EntityInfoCard` + toolbar; detalle = `EntitySubNavBar` franja full-bleed 3er ribbon)
- [ ] Root-pill `‹ {Label}` vuelve
- [ ] `EntityPicker` selector (▾) si entidades escalables
- [ ] Leaf tabs en sub-nav (ej. Perfil/Agenda/Servicios)
- [ ] Contenedor HOJA: 100% ancho + franjas full-bleed + `PageContainer` 1.25rem padding

#### B. Formulario (Autosave)
- [ ] `Group` contenedor (nicolify)
- [ ] `use-autosave` hook (600ms debounce + coalesce payload)
- [ ] `FloatingAutosaveIndicator` píldora única por página + barrita color agente
- [ ] Campos: RHF + Zod validación

#### C. Cajas de datos (EntityInfoCard Opción B)
- [ ] Responsive grid (4@ancho, minmax 250px)
- [ ] Todas circulares (avatar + iniciales)
- [ ] Indicadores repartidos en top-right
- [ ] Card clickeable
- [ ] Kebab ⋮ con acciones

### § Page-primitives y estados

- [ ] `PageContainer` (padding 1.25/1.5rem)
- [ ] `PageHeader` (título + breadcrumbs)
- [ ] `Section` wrapper de contenido
- [ ] `Toolbar` (filtros/búsqueda)
- [ ] Estados: empty / loading (skeleton) / error / success
- [ ] Pagination (si aplica)

### § Tokens y átomos

- [ ] Tokens DERIVADOS verbatim de `vitalia/frontend/src/app/globals.css` (NO copiar `_shared.css`)
- [ ] Átomos canónicos SOLO de `@luana/ui-kit`:
  - `Button` × 7 variantes
  - `Input`, `Textarea` (vitalia mejorado)
  - `Badge`, `Chip`
  - `Select` (Shadcn, no `<select>` nativo)
  - `Dropdown`, `Tooltip` (nicolify mejorado)
  - `Checkbox`, `Switch`, `Radio`
  - `Card`, `Popover`, `Alert-dialog`
- [ ] CERO arbitraries en color/radius/spacing/font-size (ruff lint bloquea)
- [ ] Agent-color policy: acción primaria adopta `--agent-active` del contexto

### § Mockup compuesto de Storybook (si es sub-tab shell · canon §5 · ex ADR-003 SUPERSEDED)

- [ ] Mockup **compuesto de las stories de Storybook** (`@luana/ui-kit` · `Shell/*` para el wrapper), NO maquetado a ojo ni con `_shared.css`
- [ ] Mockup ratificado por Chris (`checkpoint.mockup_final_signed: true`) — la firma sigue viva, ahora sobre el mockup Storybook-composed
- [ ] Mockup DENTRO del shell real (Ribbon + SubTabs + hoja), partiendo de las stories `Shell/*`
- [ ] Tokens vía clases Tailwind mapeadas a `globals.css` (NO copiar `_shared.css`)
- [ ] Dark mode soportado (splitter 3 estados: collapsed/narrow/50-50)
- [ ] Net-new shared → PROPONE + PROMUEVE a `@luana/ui-kit` + story (no local que driftea)
- [ ] Datos LatAm realistas (no Lorem ipsum)
- [ ] Spanish neutro LatAm (no voseo)

### § Gherkin + Scenarios

- [ ] Scenario happy path (camino dorado)
- [ ] Scenario negative (validaciones)
- [ ] Scenario edge (límites, vacío)
- [ ] Scenario adversarial (security, race condition)
- [ ] Playwright spec cita los scenarios (📍 architect dicta path exacto)
- [ ] Cada scenario tiene `then:` verificable (acción real, no HTTP 200)

### § Specs y documentación

- [ ] `01-spec.md` UNIFICADO (funcional + mockup + Gherkin + componentes)
- [ ] `checkpoint.input_spec_signed: true` (intención Chris firmada)
- [ ] `checkpoint.mockup_final_signed: true` (mockup final firmado)
- [ ] `chris-input.md` append entry con verdict (✓/⚠️/❌/💡)
- [ ] Prior art applied (scan cross-brand: engine/nicolify/comunify/learnings)

## ★ Por-skill enforcement points

### `/po-ux` gate refining→refined

**REFUSE transition si:**
- [ ] Falta checklist § arriba
- [ ] Shell/caja/zona no declarados
- [ ] Mockup sin Chris ratificado
- [ ] Gherkin incomplete (falta scenario type obligatorio)
- [ ] Componentes nuevos inventados sin justificación

### `/architect` gate ready-package

**REFUSE ready si:**
- [ ] Specs menciona componentes NO en `@luana/ui-kit`
- [ ] Test plan (§4-validators) menciona componentes propios sin arquitectura (refactor con pattern canónico)
- [ ] `/showcase` route no citable como precedente

### `/dev-team` desarrollar

**REFUSE implementar si:**
- [ ] Componente nuevo sin arquitectura previa → escalar a `/architect` (refactor spec)
- [ ] Tokens hardcodeados en CSS (ruff lint bloquea)
- [ ] N3 cableado propio vs `EntityWorkspaceLayout` (refactor fixture)

### `/auditor` cat 9 (visual fidelity)

**FAIL si:**
- [ ] Build se compuso a mano / con CSS inventado en vez de partir de la story de Storybook citada (canon §5), o primitiva shared net-new dejada local sin promover a `@luana/ui-kit`
- [ ] Componentes NO en canónico (audit jscpd + cross-check @luana/ui-kit)
- [ ] Tokens driftean del showcase (spot-check 3 random colores/radius)

## ★ Nuevas historias UI (idea → refining)

**Cuando `/pm-vitalia` abre una story nueva ui-story:**

1. **Copia esta checklist a `{story-id}/checklist-ENFORCE.md`**
2. **Before `/po-ux` refina,** punto 1 di a Chris:
   > "Esta historia seguirá el patrón vitalia-ds-showcase (N3 si lista/detalle · Autosave 600ms+coalesce si form · EntityInfoCard B si cajas · page-primitives siempre · átomos @luana/ui-kit · tokens globals.css derivados). ¿OK?"
3. **Mockup MUST partir de las stories `Shell/*` de Storybook** (`@luana/ui-kit` — el wrapper real, no reinventar ni portar `dual-mode-shell.html`)
4. **Scenario debe ejercer writes REALES** (live-verify: no GET 200 suficiente)

## ★ Template per tipo

### Sub-tab shell (patrón ADR-vitalia-004)
```
/adrian/embudo → EntityWorkspaceLayout (N3 master/detalle)
/config/cuenta → PageContainer + 4 Group autosave (form)
/camila/voz → especialista conversacional (agentic, no aquí)
```

### Form + campos
```
use-autosave(600ms, coalesce=true) + FloatingAutosaveIndicator
Group contenedor (nicolify) + RHF + Zod
```

### Lista de entidades
```
EntityWorkspaceLayout master: EntityInfoCard B grid 4@ancho
Toolbar: Search + Filter + Sort
Pagination: lazy-load si >100 items
```

## ★ Referencias rápidas

| Necesito | Archivo | Path |
|---|---|---|
| Patrón N3 | `EntityWorkspaceLayout` | `@luana/ui-kit` |
| Patrón Form | `use-autosave` + `Group` | vitalia `hooks/use-autosave.ts` · nicolify `IcpDatosForm.tsx` |
| Cajas entidad | `EntityInfoCard` Opción B | vitalia `components/StaffCard.tsx` |
| Page scaffold | `PageContainer`, `PageHeader`, `Section` | `@luana/ui-kit` |
| Átomos | 21 componentes Shadcn | `@luana/ui-kit/src/components/ui/` |
| Tokens | CSS vars | vitalia `app/globals.css` líneas 30-67 |
| Shell wrapper | stories `Shell/*` de Storybook | `core/@luana/ui-kit` (`build-storybook` / `:6007`) |
| Design system (Storybook-first) | `shell-mockup-per-component.md` (reescrita) + canon §5 | `vitalia/.claude/rules/` + `docs/architecture/luana-platform/design-system-canon.md` |
| SSoT visual | Storybook (componente REAL) | `core/@luana/ui-kit/.storybook` (82 stories) |

## ★ Penalización (anti-pattern recurrente)

| Anti-pattern | Penalización |
|---|---|
| Inventar componente nuevo | `/architect` REFUSE ready + refactor spec |
| Hardcodear tokens (hex/px/rem) | ruff lint FAIL pre-commit |
| Mockup no parte de Storybook (maquetado a ojo / `_shared.css`) | `/po-ux` REFUSE refining→refined |
| N3 cableado propio | `/auditor` FAIL visual fidelity + refactor fixture |
| Scenario sin write real | `/auditor` FAIL verification (GET 200 ≠ verificado) |

---

## Rollout (cómo comunicar a las historias abiertas)

**A `/pm-vitalia`:** "Checkpoints abiertos deben citar este ENFORCE.md en next_action."

**A `/po-ux`:** "Gate refining→refined bloquea sin checklist completado."

**A `/architect`:** "Specs citan componentes fuera de @luana/ui-kit → REFUSE ready."

**A `/dev-team`:** "Ruff bloquea arbitraries de patrón (color/radius/spacing). Fixture N3 cableado → refactor a EntityWorkspaceLayout."

**A nuevas historias idea:** "Patrón canónico adjunto — aplicar checklist desde refining."
