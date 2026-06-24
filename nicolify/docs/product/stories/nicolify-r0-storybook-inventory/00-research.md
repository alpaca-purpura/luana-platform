# 00-research · nicolify-r0-storybook-inventory

> **Handoff durable (2026-06-24).** Todo lo aprendido en la sesión de status+plan "todo lo de UI sale del Storybook". Hogar = esta story (Chris: producto, NO ADR de arquitectura). Investigación con 3 subagentes (vitalia · kit `@luana/ui-kit` · nicolify).

## § Intake (la conversación de diseño)

- **Pedido de Chris:** en vitalia existe un Storybook donde **todos** los componentes están mapeados 1:1 con un "inventario"; al generar el mockup HTML se compone con esos componentes base, y si la idea usa algo que no está → se propone **anotándolo como componente nuevo a agregar**; al pasar a `/architect`, manda a `/dev-team` qué token/átomo/molécula usar exacto. Funciona en vitalia. **¿Aplicado en nicolify?** Y plan para llegar a: **todo lo de UI sale del Storybook**, para saber **todos los componentes de la solución que tocaría un cambio de UI**.
- **Zona/caja:** Infraestructura → plataforma-tecnica → design-system (atributo de calidad: inventario navegable de la UI).
- **Extiende-o-nuevo:** EXTIENDE `design-system/nicolify-ui-homologation` (la homologación que ya consume el kit). No es net-new aislado.

## § Findings (3 subagentes · evidencia con paths)

### El modelo objetivo = lo que vitalia tiene (~80-90%)

2 capas + 1 contrato + 1 bucle:

| Pieza | Qué | Dónde |
|---|---|---|
| Inventario compartido | **82 stories** (átomos/moléculas/layout/archetypes/shell) = SSoT visual | `core/@luana/ui-kit/.storybook` + `/stories/` (v0.6.0) |
| Inventario brand | **44 stories** de componentes de feature propios de vitalia | `vitalia/frontend/.storybook` |
| Contrato 1:1 | `SHELL-DESIGN-CONTRACT.md` v1.5 — cada componente con path+props+estado | `vitalia/docs/architecture/` |
| Bucle 5 actores | `/po-ux` parte de Storybook · falta→PROPONE · `/architect` cita la story exacta + marca PROMOTE · `builder` construye desde esa story · `auditor` verifica composición + promoción | rule `frontend-visual-fidelity.md § Storybook` + ADR-vitalia-004 |

Enforcement vitalia: eslint `no-arbitrary-value` + 18 arch-fitness tests + gates de skills + revisión Chris.

**Huecos que ni vitalia cerró (honesto):** (1) el inventario 1:1 vive en **texto** (`SHELL-DESIGN-CONTRACT.md`) — hay que *leerlo*, no se *consulta*; (2) **no hay sync automático** mockup↔storybook (lo frena revisión humana). → la **Fase 3** (manifiesto consultable) cierra el hueco #1.

### El kit compartido (donde vive el inventario real)

- `@luana/ui-kit` **0.6.0** = 82 stories. `@luana/design-tokens` 0.2.0 (spacing shared + radius/typo/color name-contracts + z-index). `@luana/eslint-config` 0.1.0 (`no-arbitrary-value`).
- Consumidores: vitalia 35 imports/53 files · **nicolify 10 imports/14 files** · comunify 6/7.
- **Veredicto arquitectónico:** el inventario compartido es **kit-level** (una sola Storybook para todas las marcas, porque todas homologan a `@luana/ui-kit`). Lo brand-specific va a la Storybook de la marca (vitalia: 44 · nicolify: 0).

### Estado nicolify (el gap)

| Criterio | Estado | Gap |
|---|---|---|
| Infra Storybook | ✅ `nicolify/frontend/.storybook` + storybook 10.3.4 + addons a11y/themes | **0 stories** — deshabitada |
| Inventario compartido (kit) | ✅ consume `@luana/ui-kit` (82 stories) | ninguno (cubierto por consumo) |
| Stories brand-local | ❌ **0** (vitalia 44) | **el gap grande** — Abel ICP + shell wiring + intake + avatares sin story |
| Contrato 1:1 | ⚠️ `SHELL-DESIGN-CONTRACT.md` existe pero normativo, no descriptivo (no enumera los 47 componentes con story) | falta inventario poblado estilo vitalia v1.5 |
| Modelo mockup | ❌ era `_shared.css` HTML (modelo MUERTO canon §5) | **Fase 0 lo está matando (HB-103)** |
| Skill + rules brand | ❌ citaban el modelo muerto | **Fase 0 los alinea (en curso)** |

## § Plan de 4 fases + ownership

| Fase | Naturaleza | Owner / canal | Estado |
|---|---|---|---|
| **0 · Doctrina** | Harness — alinear rule `shell-mockup-per-component.md` + skill `nicolify-design-system` al canon Storybook-first | harness batch (HB-103) | **EN CURSO** (sesión aparte 2026-06-24) |
| **1 · Baseline inventario brand** | **Producto** — `.stories.tsx` brand-local + `SHELL-DESIGN-CONTRACT.md` 1:1 | **ESTA story** (`/po-ux`→`/architect`→`/dev-team`→`/auditor`) | idea (handoff) |
| **2 · Loop activo** | Emergente — toda hoja nueva cae en el bucle rule #34 | proceso (post 0+1) | nada que hacer aparte |
| **3 · Manifiesto consultable** | **CORE/cross-brand** — generador machine-readable (storybook + grep de usos): "cambio X → estos N lugares". Cierra el hueco #1 de vitalia | **`/pm-luana`** proposal en `core/` | tras Fase 1 |

## § Decisiones de Chris (2026-06-24)

1. **Arranque: doctrina-primero** — Fase 0 (harness) ANTES de la story, para que el baseline nazca con la doctrina correcta. (Chris ya lanzó Fase 0 en sesión aparte.)
2. **Profundidad: "mejor que vitalia"** — además del modelo textual, la **Fase 3** agrega el manifiesto **machine-readable consultable** (cierra el hueco que vitalia no cerró). Cross-brand → `/pm-luana`.

## § Directiva CORE (sync hygiene · standing)

> Lo que sea **CORE** (Fase 3 + cualquier promoción de pieza al kit en Fase 1) se hace **acá en el hub nicolify**, pero: **(a) sync-ANTES** (`scripts/git/sync-from-main.sh` con árbol limpio) para construir sobre lo último, **(b)** core acá, **(c) sync-DESPUÉS** (`make promote-to-main` + `sync-all`) para que las 4 marcas tengan lo mismo. Edits a `core/` desde un worktree de marca son invisibles a los demás hasta el squash-merge (ver MEMORY `engine-edits-brand-worktree-invisible`).
>
> **Estado de sync al 2026-06-24:** NO sincronizable ahora — el hub tiene trabajo sin commitear de la sesión Fase 0. wip/nicolify behind main 7 / ahead 125. El sync va DESPUÉS de que Fase 0 commitee.

## § Referencias (SSoT — leer on-demand)

- `.claude/rules/frontend-visual-fidelity.md § Storybook` — doctrina binding (canon, cement 2026-06-22)
- `docs/architecture/luana-platform/design-system-canon.md §5` — bucle 5 actores
- `core/@luana/ui-kit/.storybook` + `/stories/` — el inventario compartido (82 stories)
- `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md` + `vitalia/frontend/.storybook` (44 stories) — el modelo a replicar
- `nicolify/docs/product/stories/nicolify-r0-design-system-adoption/` — la homologación (base de esto)
- `docs/process/harness-backlog.md` HB-103 — Fase 0
