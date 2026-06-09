# Design System Canon — contratos RATIFICADOS (binding cross-brand)

**Status:** ratified (Chris 2026-06-08, vía showcase `vitalia-ds-showcase`, 8 rondas `/po-ux`) · **Owner:** `/pm-luana` · **Scope:** platform-wide (todas las marcas) · **Home de los componentes:** `core/@luana/{design-tokens, ui-kit}`

> **Qué es este doc:** el **contrato binding** del design system — las decisiones que `/po-ux` (mockups), `/architect` (ready package), `/dev-team` (build) y `/auditor` (review) DEBEN respetar **tal cual**, sin reinterpretar. Es el SSoT durable que sobrevive al archivado de la story que lo originó (`user-story-no-es-ssot`).
>
> **Relación con los otros docs (no duplica):**
> - **ADR-014** = la *doctrina* (5 capas + por qué enforcement mecánico). Este doc = los *contratos concretos*.
> - **proposal 2026-06-07-design-system-homologation** = el *plan + lift* (Fases 0-3).
> - **design-system-inventory-best-of-best.md** = el *análisis* (best-of-best con `file:line`).
> - **Referencia visual fiel:** `vitalia/docs/product/stories/vitalia-ds-showcase/mockups/showcase.html` (espejo derivado; el durable es el `/showcase` route — ver §6).

---

## 0. Autoridad (la cadena que hace imposible el drift)

```
Tokens (1 fuente)  →  Átomos  →  Layout-primitives  →  Page archetypes  →  Shell-organism (chrome)
core/@luana/design-tokens     core/@luana/ui-kit ──────────────────────────────────────────┘
```

**Regla de composición (HARD):** una hoja se **ARMA** desde átomos + layout-primitives + archetype. **NUNCA** se maqueta a mano con `<div>` + clases sueltas, ni se reinventa una primitiva que ya existe. Tokens = única fuente de spacing/radius/tipografía/color. (ADR-014 §Decisión.)

---

## 1. Contenedor HOJA — lineamientos (cement 2026-06-08)

Toda superficie user-reachable que renderiza dentro del panel del shell es una **hoja**. Lineamientos:

1. **100% del ancho · full-responsive.** Sin `max-width` en la hoja. Los grids reflúyen (`auto-fill/auto-fit` + `minmax`). Campos pareados colapsan a 1-col en viewport chico.
2. **Franjas de navegación de la hoja = FULL-BLEED.** Las barras N3 (entity-subnav / sub-sub-tabs) van **edge-to-edge**, `bg-card` + `border-bottom`, **sticky** — mismo lenguaje visual que Ribbon (N1) / SubTabs (N2). **NUNCA** dentro de una card con borde redondeado.
3. **Contenido en PageContainer.** El cuerpo de la hoja usa `PageContainer` (padding interior estándar `1.25rem 1.5rem`) + `PageContentStack` (espaciado vertical uniforme). NO `<div p-4/p-6/p-8>` sueltos.
4. **Padding:** las franjas NO llevan padding de contenido (solo el del strip) · el contenido SÍ (PageContainer). Strips sticky arriba.

---

## 2. Contratos de componentes RATIFICADOS

### 2.1 · N3 Lista/Detalle — `EntityWorkspaceLayout` (patrón ÚNICO)

Patrón único para **TODA** lista/detalle (doctores, servicios, leads, ICPs, cuentas…). **1-panel, URL-driven** (NO 2-columnas persistente).

- **Master (sin entidad seleccionada):** grilla **full-width de `EntityInfoCard`** (§2.3) + `PageHeader` + `Toolbar/FilterBar` (búsqueda + filtros). La grilla **es el contenido del root**. Click en una caja → navega (cambia URL) al workspace.
- **Detalle (entidad seleccionada):** `EntitySubNavBar` (§2.2, franja full-bleed) arriba + contenido del leaf activo full-width abajo (`leaf-body` con PageContainer padding).
- SSR-safe + skeleton **store-free** (G2). `activeLeaf` derivado de la URL, nunca de store.
- Contrato de props (generalizar a `@luana/ui-kit`): `{ entity|null, leaves[], rootHref, rootLabel, isLoading, onAddAffordance, children }`.

### 2.2 · `EntitySubNavBar` — la franja N3 como TERCER RIBBON

- **Full-bleed strip** (no card): `bg-card` + `border-bottom` + **sticky top:0** + `border-radius:0`. Mismo lenguaje que Ribbon/SubTabs.
- Composición: `[ ‹ {RootLabel} ]` (root-pill con **flechita ←** → vuelve a la grilla master) · **EntityPicker** (§2.4 — identidad de la entidad = selector) · **leaves** (secciones de ESA entidad: Perfil/Agenda/Servicios…).
- Sin botón "back" separado: el root-pill `‹ {RootLabel}` ES la vuelta.
- a11y: `role=tablist` + roving tabindex + flechas (←→/Home/End).

### 2.3 · `EntityInfoCard` (Opción B)

- Grid responsivo `auto-fill / minmax(250px, 1fr)` → 3-5 por fila según ancho (reflúye solo).
- **Media circular** (avatar iniciales o ícono agent-color). Acento del agente arriba. Título + subtítulo (badge).
- **Fila de métricas repartida a lo ancho** (columnas iguales, centradas, banda superior/inferior) + footer (chip de estado).
- **Card entera clickeable** (cursor + hover + focus por teclado + selección). **Kebab `⋮`** arriba-derecha (`stopPropagation`) → menú contextual (Editar / Ver perfil|landing / Duplicar / Abrir conversación / Eliminar-danger).
- Variantes obligatorias: `EntityInfoCardSkeleton` + `EntityInfoCardEmpty`.

### 2.4 · `EntityPicker` — selector de entidad (cambiar sin volver atrás)

El nombre de la entidad en la franja es un **selector `▾`** que permite cambiar de entidad **sin volver a la grilla**. **Cimentado para escala (200+):**

- **Buscador** arriba del dropdown — en el build real: **server-side, debounced** (NO traer todo al cliente).
- **Fetch paginado** (cap inicial ~20, cursor) + **render windowed/virtualizado** (react-window/virtualizer) + **infinite-scroll o "cargar más"**.
- Empty state ("Sin resultados") · footer de conteo ("Mostrando N de M").
- a11y: `role=listbox/option`, combobox keyboard (↑↓/Enter/Esc), focus al search al abrir.
- ❌ Prohibido: cargar TODA la colección al cliente.

### 2.5 · `Select` canónico (Shadcn-style)

Reemplaza el `<select>` nativo del browser (feo, no-tokenizado). Componente custom:

- Trigger con borde tokenizado + **chevron `▾`** que rota al abrir + focus-ring.
- Panel estilizado (`bg-card`, shadow, radius) + items con hover + **check `✓` en la opción activa** + agent-color.
- ❌ Prohibido: `<select>` nativo en superficies de producto.

### 2.6 · Info agrupada + Autosave

- Contenedor `Group` + `GroupHeader` (chip "para qué" + estado de error semántico: borde rojo + campos faltantes inline).
- `use-autosave` **600ms + payload coalescing** (merge, evita pisar edits rápidos) + `flush()`.
- **UNA sola `FloatingAutosaveIndicator`** por página (sticky abajo-centro, `role=status`). **Sin badge por-grupo** (redundante).
- **Barrita de color del agente** a la izquierda del grupo (marca de quién es la info).
- Layout: 1-col por defecto; **2-col solo si los campos están conceptualmente pareados** (color+tipografía, tratamiento+idioma).

### 2.7 · Page-primitives (capa 3-4)

`PageContainer · PageHeader · PageSection · PageContentStack · Toolbar · FilterBar (orden + view-toggle + búsqueda) · EmptyState · ErrorState (role=alert + retry) · ListPageSkeleton · FormPageSkeleton · Pagination · DetailLayout / FormLayout (1-col default; 2-col solo pareados)`. Toda página se arma de acá, no con `<div>` sueltos (~208 hoy a mano).

### 2.8 · Políticas de átomos (ratificadas)

- **Tooltip:** `ⓘ` con hover/focus, SOLO para lo no-obvio (info crítica va inline/hint, siempre visible) · accesible por teclado · NO solo-hover en mobile (tap-to-toggle). Componente = Shadcn Tooltip (Provider + Arrow + delay 0).
- **Color por agente:** dentro del módulo de un agente, la **acción primaria** adopta el color del agente (`--agent-active`); texto por contraste (Mateo amarillo→oscuro; Lucas negro→blanco). Lo **semántico NUNCA cambia** (destructivo rojo, éxito verde, advertencia ámbar). Lo **global/transversal** (topbar, Valeria, onboarding, Plataforma) usa `--primary` (cian de marca).

### 2.9 · Picks canónicos (de dónde sale cada cosa)

| Pieza | Canónico |
|---|---|
| N3 list/detail | `EntityWorkspaceLayout` + `EntitySubNavBar` (base nicolify) → `@luana/ui-kit` |
| Autosave | `use-autosave` 600ms+coalesce + `FloatingAutosaveIndicator` (base vitalia) |
| Átomos | `@luana/ui-kit` mergeando lo mejor: input/textarea/badge (vitalia) + dropdown/tooltip (nicolify) |
| EntityInfoCard | Opción B sobre base `StaffCard` (vitalia) + ícono agent-color (nicolify IcpCard) |
| Grupo info | `Group`/`GroupHeader` (base nicolify) |

---

## 3. Binding — quién consume el canon y CÓMO (enforcement)

| Actor | Obligación (HARD) |
|---|---|
| **`/po-ux`** | Los mockups se **componen del canon** (átomos + layout-primitives + archetypes reales, tokens de la fuente única) — NO se inventan primitivas ni layout a mano. El mockup ratificado = lo que se construye. Cita este canon + el `mockup-kit` (parte de `core-ds-foundation`). |
| **`/architect`** | El `03-arch.md` + `04-validators.yaml` referencian el canon: toda superficie list/detail usa `EntityWorkspaceLayout`; toda página se arma de page-primitives; selects = `Select` canónico; etc. Declara los gates mecánicos (lint no-arbitrary + arch-test no-div-layout) en validators. |
| **`/dev-team`** | Construye **desde** `@luana/ui-kit` (único lego). Prohibido maquetar a mano una primitiva existente o usar `<select>` nativo / arbitrary-values. |
| **`/auditor`** | Verifica **composición** (que se usó el canon), no estilo a mano. `frontend-visual-fidelity` D1 = mecánico (lint/arch-test), no criterio. |

**Gates mecánicos** (los construye el programa — Fases 0-2): eslint `no-arbitrary-value` (spacing/radius/font-size/color-hex) · arch-test FE (prohíbe `<div>` de layout donde hay primitiva + hex/px hardcoded · ratchet shrink-only) · `/showcase` route (descubribilidad + guard de regresión).

---

## 4. Estado del programa (qué falta construir)

| Fase | Story | Estado | Contenido |
|---|---|---|---|
| **0+1+2** | **`core-ds-foundation`** (consolidada 2026-06-08) | refining (/pm-luana → /architect) | **TODO el build en una story:** escala tokens + eslint no-arbitrary (Fase 0) · ~10 layout-primitives + archetypes + `EntityWorkspaceLayout`/`EntitySubNavBar`/`EntityInfoCard`/`EntityPicker` + `/showcase` route (Fase 1) · arch-test FE + D1 mecánico (Fase 2). **Bindings de skills/rule = YA hechos 2026-06-08 (no re-armar).** `Select`/`tooltip`/`AutosaveBadge` = ya en `@luana/ui-kit` (consumir). |
| 3 | `{brand}-ds-adoption` ×N | ⬜ a armar (aparte, por marca) | adopción COMPREHENSIVA por marca (vitalia→nicolify→comunify), migrar pantallas existentes + encender el lock |

---

## 5. `/showcase` route (mecanismo durable · R-FID)

El showcase durable = una **ruta en la app real** (`/showcase` o Storybook) que renderiza los **componentes REALES** de `@luana/ui-kit` → "lo que ves ES lo que es" **por construcción** + guard de regresión visual. El `.html` estático (`vitalia-ds-showcase`) es el **espejo derivado** que se usó para ratificar la dirección; se reemplaza por el route al construir Fase 1. (R-FID, ADR-014.)

---

## 6. Ejemplos de código (referencia de implementación — refleja el showcase ratificado)

> Estos snippets son el **contrato de implementación** para `/dev-team` (qué construir en `@luana/ui-kit`) y la **base de composición** para `/po-ux` (el mockup compone ESTAS piezas). Tailwind + tokens; "lo que se ve = lo que se programa".

### 6.1 · Tokens — fuente única (cada eje se consume de acá, NUNCA arbitrary)

```css
/* core/@luana/design-tokens → globals.css de cada marca importa esta escala (no la redefine) */
:root{
  --radius: .625rem;                          /* ÚNICO --radius (resolver el 0.5 legacy) */
  --background:0 0% 100%; --foreground:240 10% 4%; --card:0 0% 100%;
  --muted:240 5% 96%; --muted-foreground:240 4% 46%;
  --primary:198 99% 49%;                       /* cian de marca = global/transversal */
  --border:240 6% 90%; --input:240 6% 90%; --ring:198 99% 49%;
  /* color por agente (la acción primaria del módulo usa --agent-active) */
  --agent-lisa:156 100% 41%; --agent-mateo:53 99% 51%; /* … */
}
/* spacing/radius/font-size/color SOLO de la escala → eslint no-arbitrary los lockea */
```

### 6.2 · Contenedor HOJA — layout-primitives (full-bleed strip + PageContainer)

```tsx
// Toda hoja list/detail se ARMA así — NUNCA <div> de layout sueltos
<EntityWorkspaceLayout entity={entity} leaves={leaves} rootHref="/lisa/staff" rootLabel="Especialistas">
  {/* leaf activo — va dentro de PageContainer (padding estándar) */}
  <PageContainer>
    <PageContentStack>
      <Group title="Identidad">…</Group>
    </PageContentStack>
  </PageContainer>
</EntityWorkspaceLayout>
```

```css
/* La FRANJA N3 = tercer ribbon full-bleed (NO card redondeada) */
.entity-sub-nav{ position:sticky; top:0; z-index:12;
  background:hsl(var(--card)); border-bottom:1px solid hsl(var(--border)); border-radius:0;
  min-height:46px; display:flex; align-items:center; padding:0 1.5rem; }   /* full-bleed */
.page-container{ padding:1.25rem 1.5rem; }                                  /* contenido */
.page-content-stack{ display:flex; flex-direction:column; gap:1.5rem; }
/* 100% ancho, sin max-width; grids reflúyen */
.entity-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:.875rem; }
```

### 6.3 · `EntitySubNavBar` (root-pill con flechita + EntityPicker + leaves)

```tsx
export function EntitySubNavBar({ rootHref, rootLabel, entity, leaves, activeLeaf, agentSlug, onEntityChange }: Props){
  return (
    <nav role="tablist" className="entity-sub-nav">            {/* full-bleed sticky */}
      <button role="tab" onClick={() => router.push(rootHref)}  {/* ‹ vuelve a la grilla master */}
        className="entity-root inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-semibold">
        ‹ {rootLabel}
      </button>
      <EntityPicker entity={entity} agentSlug={agentSlug} onChange={onEntityChange} />  {/* ▾ cambia sin volver */}
      {leaves.map(l => (
        <LeafTab key={l.id} leaf={l} active={l.id === activeLeaf} agentSlug={agentSlug} />
      ))}
    </nav>
  );
}
```

### 6.4 · `EntityPicker` — buscar + paginado + windowed (cimentado 200+)

```tsx
// ❌ NUNCA traer toda la colección. Búsqueda server-side debounced + fetch paginado + render windowed.
export function EntityPicker({ entity, agentSlug, onChange }: Props){
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 200);                                  // debounce
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({       // fetch paginado (cap ~20, cursor)
    queryKey: ["entities", "picker", dq],
    queryFn: ({ pageParam }) => api.searchEntities({ q: dq, cursor: pageParam, limit: 20 }),
    getNextPageParam: p => p.nextCursor,
  });
  const items = data?.pages.flatMap(p => p.items) ?? [];
  return (
    <Popover>
      <PopoverTrigger className="entity-picker">          {/* avatar + nombre + ▾ */}
        <Avatar slug={agentSlug}>{entity?.initials}</Avatar><span>{entity?.name}</span><ChevronDown/>
      </PopoverTrigger>
      <PopoverContent role="listbox" className="w-72">
        <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar…" autoFocus/>
        <Virtuoso style={{height:248}} data={items}                    {/* render windowed/virtualizado */}
          endReached={() => hasNextPage && fetchNextPage()}            {/* infinite-scroll / lazy */}
          itemContent={(_, it) => <EntityPickerItem item={it} onSelect={onChange}/>}/>
        {items.length === 0 && <Empty>Sin resultados</Empty>}
      </PopoverContent>
    </Popover>
  );
}
```

### 6.5 · `EntityInfoCard` (Opción B) — clickeable + kebab

```tsx
export function EntityInfoCard({ entity, accentSlug, actions, onClick }: Props){
  return (
    <article role="button" tabIndex={0} onClick={onClick}
      className="relative bg-card border border-t-4 rounded-xl cursor-pointer hover:shadow-md focus-visible:outline-2"
      style={{ borderTopColor:`hsl(var(--agent-${accentSlug}))` }}>
      <Kebab actions={actions} className="absolute top-2 right-2" />     {/* stopPropagation */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar slug={accentSlug} className="rounded-full">{entity.initials}</Avatar>  {/* circular */}
          <div className="min-w-0"><h3 className="truncate font-semibold">{entity.name}</h3>
            <p className="text-xs text-muted-foreground">{entity.subtitle}</p></div>
        </div>
        <MetricsRow metrics={entity.metrics} />                          {/* repartida a lo ancho */}
      </div>
      <CardFooter><StatusChip status={entity.status}/></CardFooter>
    </article>
  );
}
// + EntityInfoCardSkeleton + EntityInfoCardEmpty obligatorios
```

### 6.6 · `Select` canónico (reemplaza `<select>` nativo)

```tsx
// ❌ Prohibido <select> nativo. ✅ Shadcn Select (trigger + chevron + check en activo)
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="h-9">                  {/* borde tokenizado + chevron ▾ */}
    <SelectValue placeholder="Todas las especialidades" />
  </SelectTrigger>
  <SelectContent>
    {options.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}  {/* ✓ en activo */}
  </SelectContent>
</Select>
```

### 6.7 · Autosave — 1 píldora flotante (sin badge por-grupo)

```tsx
export function AgentScopedForm({ agentSlug }: Props){
  const { register, isSaving, isSaved } = useAutosave({ debounceMs:600, coalesce:true, onSave: api.patch });
  return (
    <>
      <Group title="Identidad" agentStrip={agentSlug}>      {/* barrita de color del agente a la izq */}
        <Field {...register("name")} label="Nombre" />       {/* sin botón Guardar */}
      </Group>
      <FloatingAutosaveIndicator saving={isSaving} saved={isSaved} role="status" />  {/* UNA por página */}
    </>
  );
}
```

## 7. Referencias

- `ADR-014-design-system-homologation.md` — doctrina (5 capas + enforcement mecánico)
- `docs/promotion-protocol/proposals/2026-06-07-design-system-homologation.md` — plan + lift (Fases 0-3)
- `design-system-inventory-best-of-best.md` — análisis best-of-best (file:line)
- `vitalia/docs/product/stories/vitalia-ds-showcase/` — origen ratificación (`checkpoint.md::ratified_decisions` + `mockups/showcase.html`)
- `.claude/rules/frontend-visual-fidelity.md` — D1/D2/D3 (bindea a este canon)
- `vitalia/docs/learnings/2026-06-06-n3-entity-workspace-layout-from-nicolify.md` — `EntityWorkspaceLayout` (primera primitiva)
- `ADR-012-autosave-primitive-platform.md` — patrón hermano
- `core/@luana/{design-tokens, ui-kit}` — homes
