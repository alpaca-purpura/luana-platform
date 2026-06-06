---
story_id: nicolify-r0-sitemap-completo
kind: 03-arch
brand: nicolify
surfaces: [frontend]
story_type: ui-story-thin           # THIN nav-skeleton build — NO diseña hojas
architecture_pattern: ADR-nicolify-001
adr_001_compliance: partial-with-rationale   # THIN nav-data build · ver § Architecture Decisions
cap_target: shell-organism.shell-nicolify
cap_change_type: extend             # extiende la cap del shell ya shipped (datos de nav, no maquinaria)
owner: /architect
architect_run_on: 2026-06-03
state: ready
verification_nature: functional     # UI nav (rutas navegables + empty-states)
---

# Contract: Nicolify R0 — Sitemap completo (thin nav-skeleton build)

> **Atípico — leelo primero.** Esta NO es una story que diseña pantallas. Es el **thin build del esqueleto de navegación** del shell-organism. La maquinaria (Ribbon, SubTabsBar N2, SubSubTabsBar N3, Luana sidebar, dispatcher de empty-states) **YA está construida y shipped** por `nicolify-r0-shell` (archivada, done). Acá SOLO se **reescriben los DATOS de navegación** (`shell-routes.ts` + el content-map de empty-states) para reflejar el árbol nuevo (sitemap v3 / SYSTEM-MAP v2.0), se **agrega la ruta N3** que falta, y se **actualizan los tests-de-datos**. `cap_change_type: extend`.

## 0. Context Summary

- **Story:** `nicolify-r0-sitemap-completo` · Release **R0** · `nicolify/docs/product/stories/nicolify-r0-sitemap-completo/`
- **Architect run on:** 2026-06-03
- **Surfaces tocados:** **FE only.** Sin backend, sin agentic, sin engine, sin DB, sin migración.
- **Surface → builder → auditor mapping** (PM usa para spawnear agentes):

  | Surface | Builder | Auditor |
  |---|---|---|
  | `nicolify/frontend/src/lib/routing/shell-routes.ts` (SSoT) + `lib/agent-catalog.ts` + dispatcher empty-states + ruta N3 + tests | **`builder-frontend`** (Sonnet) | **`auditor-frontend`** (Opus) |

  **NINGÚN ticket AGENTIC.** Christian es bifronte en el SYSTEM-MAP, pero acá NO se toca su engine — solo el slug de su tab/áreas. R23 (Opus para agentic) NO aplica.

- **Skills consultados** (decisión de cada uno):
  - `frontend-expert` — confirmé que la maquinaria es 100% data-driven desde `shell-routes.ts`; el cambio es de DATOS, no de componentes. Server-First preservado (todo el shell es Server Components salvo barras N2/N3 que ya son `"use client"`).
  - `nicolify-design-system` — labels en español neutro tuteo + emoji por subtab; reuse del `EmptyState` molécula existente (NO diseñar contenido nuevo); ADR-nicolify-001 N3-static (SubSubTabsBar), NUNCA Shadcn `Tabs` internas.
  - `playwright-expert` — nav-walk e2e con fixture anti-burbuja (`base.ts`) que recorre TODO el árbol; specs autenticados importan de `base.ts`/`auth.fixture`, NUNCA de `@playwright/test`.
- **CONTEXT-BRIEF source:** sin `CONTEXT-BRIEF.md` (story chica · `/architect` corrió greps Path B + leyó checkpoint § Architect handoff que es la spec principal). NO-NEW-LAYER self-ran. Override no requerido.
- **capability YAML afectadas (post-merge):** la cap `shell-organism.shell-nicolify` (extend) — `/pm-nicolify` actualiza `nicolify/docs/product/capabilities/shell-organism/shell-nicolify.yaml` (nav tree v3 + N3 leaves) + el `dev_preview` apunta a `shell-routes.ts`. NO se crean caps por hoja (cada hoja declara la suya al construirse en R1..R5). `SYSTEM-MAP.yaml` v2.0 ya es SSoT del árbol — la build lo refleja, no lo modifica.
- **Architecture gates que deben seguir verdes:**
  - `nicolify/frontend/src/__tests__/architecture/test_shell_routes_ssot.test.ts` (SSoT enforce — actualizar el bloque Sara, ver § 12)
  - `nicolify/frontend/src/lib/routing/__tests__/shell-routes.test.ts` (unit de datos — actualizar arrays, ver § 12)
  - FSD boundaries (`boundaries/dependencies`), `tsc --noEmit --strict`, `eslint --max-warnings 0`

## 0.1 Árbol a construir (de SYSTEM-MAP v2.0 · slugs EXACTOS · esto es la spec)

```
N1 Ribbon (orden):  abel · brenda · christian · sara · norvil · [config]
Luana = sidebar (NO Ribbon · EXCLUIDA de AGENT_CATALOG) — sin cambios

N2 AGENT_SUBTABS:
  abel:       icp · oferta · marca
  brenda:     contenido-presencia · pauta · inteligencia-asesoria
  christian:  contactos · inbox · pipeline · equipo-comercial · agenda · propuestas
  sara:       proximamente            (único · empty-state "Próximamente" · deferred)
  norvil:     cartera · renovaciones · fidelizacion
  config:     conexiones · preferencias · tokens · autonomia-agentes

N3 AGENT_SUBSUBTABS (poblar SOLO estos 3):
  "abel.oferta":          [catalogo-escalera, dossier-mineria]
  "christian.propuestas": [propuestas, licitaciones]
  "norvil.fidelizacion":  [momentos, champion-shield, value-proof-qbr, gifting]

DEFAULT_LANDING:  christian/pipeline   (SE MANTIENE · pipeline sigue existiendo)
```

`AGENT_CATALOG.defaultSubtab` por agente = 1er subtab del árbol nuevo:
`abel→icp · brenda→contenido-presencia · christian→pipeline (= DEFAULT_LANDING, no contactos) · sara→proximamente · norvil→cartera · config→conexiones`.
`tabLabel` sara → **"Próximamente"** (los demás tabLabels actuales OK: Estrategia/Growth/Ventas/Cuentas/Configurar — ajustables si el builder ve drift menor, pero NO es el foco).

> **Nota christian default:** `DEFAULT_LANDING` = `christian/pipeline` se mantiene (ratificado · `test_shell_routes_ssot` lo exige). Por coherencia, `AGENT_CATALOG.christian.defaultSubtab = "pipeline"` (NO `contactos`), para que el landing post-login y el click directo en la tab Christian coincidan. `pipeline` está en el array de christian (posición 3) → guard `getDefaultSubtab` devuelve el **primer** subtab (`contactos`); por eso el default explícito de Christian se setea en `AGENT_CATALOG.defaultSubtab`, no se deriva de `getDefaultSubtab`. (El `[agent]/page.tsx` usa `getDefaultSubtab`; ver § Integration design para la decisión.)

## 1. Domain Entities

N/A — FE routing puro, sin entidades de dominio, sin persistencia, sin `tenant_id` (no hay queries).

## 2. SQLAlchemy 2.0 Models

N/A — sin backend, sin DB, sin migración.

## 3. Pydantic v2 DTOs

N/A — sin API.

## 4. API Routes

N/A — sin endpoints. Las "rutas" acá son **rutas de Next.js App Router** (FE), cubiertas en § 10 + § Integration design.

## 5. TypeScript Types (Frontend) — los que cambian

Los tipos del SSoT **ya existen** y NO cambian de forma (solo se amplía el set de valores que validan):

```ts
// lib/routing/shell-routes.ts — tipos EXISTENTES (sin cambio estructural)
export type RibbonTabSlug = "abel" | "brenda" | "christian" | "sara" | "norvil" | "config";
export interface SubTabMeta    { id: string; label: string; icon: string; }
export interface SubSubTabMeta { id: string; label: string; icon: string; }
export interface RibbonAgentDescriptor { slug: RibbonTabSlug; name: string; tabLabel: string; defaultSubtab: string; }
export interface LandingAnchor { agent: RibbonTabSlug; subtab: string; }
```

Lo que cambia = los **valores** de `AGENT_CATALOG`, `AGENT_SUBTABS`, `AGENT_SUBSUBTABS` (datos), no los tipos.
`VALID_RIBBON_SLUGS` (Set interno) NO cambia (los 6 slugs de agente son los mismos — solo se reescriben sus subtabs).

## 6. Repository Interfaces

N/A — sin repos.

## 7. Application Services

N/A — sin servicios.

## 8. Agentic Surfaces

**N/A — esta story NO toca `copilot/` ni `sales_agent/`.** Christian figura como bifronte en SYSTEM-MAP, pero acá solo se reescribe su slug de navegación. Ningún state LangGraph, tool, prompt slot, checkpointer ni eval golden. **Owner agentic: ninguno.**

## 9. Migration Notes

N/A — sin migración (sin DB).

## 9.5 Tests audit (default flip)

`[x] No aplica — 03-arch.md no flipea defaults side-effect.` Esta story no toca feature flags ni call paths con side-effects (events/persistence/LLM routing). Es FE routing-data.

## 10. File Structure (NEW vs MODIFIED)

```
nicolify/frontend/src/
├── lib/routing/
│   ├── shell-routes.ts                          # MODIFIED — el SSoT: AGENT_CATALOG.defaultSubtab,
│   │                                            #   AGENT_SUBTABS (árbol v3), AGENT_SUBSUBTABS (3 leaves),
│   │                                            #   DEFAULT_LANDING (sin cambio). Guards SIN cambio de lógica.
│   └── __tests__/shell-routes.test.ts           # MODIFIED — unit de datos: arrays nuevos por agente + guards
├── lib/agent-catalog.ts                          # MODIFIED — AGENT_CATALOG.defaultSubtab (Luana-panel catalog):
│                                                 #   abel→icp · brenda→contenido-presencia · christian→pipeline ·
│                                                 #   sara→proximamente · norvil→cartera. (Sara role = "Próximamente".)
├── components/shared/shell-organism/
│   └── SubTabContent.tsx                          # MODIFIED — SUBTAB_CONTENT_MAP: reescribir keys al árbol v3
│                                                 #   (N2 + las 8 leaves N3). Reusa EmptyState molécula (NO nueva UI).
└── app/[tenantId]/(shell-organism)/[agent]/[subtab]/
    └── [subsubtab]/page.tsx                       # ★ NEW — ruta N3 que FALTA hoy. Valida agent+subtab+subsubtab
                                                  #   contra el whitelist → notFound() si inválido → delega al
                                                  #   dispatcher de empty-state N3. (SubSubTabsBar ya navega acá.)
    └── [subsubtab]/not-found.tsx                  # ★ NEW (opcional · recomendado) — 404 contextual del segmento N3.

nicolify/frontend/e2e/
├── fixtures/base.ts                              # ★ NEW — fixture anti-burbuja (pageerror/console/response/Next
│                                                 #   overlay) extendiendo auth.fixture (Clerk token). DoD #37.
└── regression/nicolify-r0-shell/
    ├── nav-walk-v3.spec.ts                        # ★ NEW — recorre TODO el árbol v3 (Ribbon→N2→N3) + assert
    │                                             #   empty-state visible + 0 errores (importa base.ts).
    └── empty-states-all-subtabs.spec.ts          # MODIFIED — actualizar ALL_SUBTABS al árbol v3 (data)
    └── ribbon-nav.spec.ts                         # MODIFIED (si referencia slugs viejos · ver § 14 regression_guard)
    └── ribbon-deeplink.spec.ts                    # MODIFIED (si referencia slugs viejos · ver § 14)
```

> **NO tocar (maquinaria shipped):** `Ribbon.tsx` · `RibbonTab.tsx` · `SubTabsBar.tsx` · `SubTab.tsx` · `SubSubTabsBar.tsx` · `SubSubTab.tsx` · `EmptyState.tsx` · `ShellOrganismLayout*` · `LuanaSidebar*` · `TopBarGlobal*` · `[agent]/page.tsx` · `[subtab]/page.tsx` · `components/ui/`. Son data-driven desde el SSoT — se alimentan, no se editan. (Excepción: `[subtab]/page.tsx` se LEE para clonar el patrón en `[subsubtab]/page.tsx`, NO se modifica.)

## 11. Cross-Cutting Concerns

- **Tenant isolation:** N/A — FE routing puro, sin queries. (El `[tenantId]` del path es contexto de Clerk/middleware ya resuelto por el shell; esta story no lo toca.)
- **Currency / Master data:** N/A — sin montos ni fechas.
- **Spanish neutro LatAm (tuteo, sin voseo):** TODOS los labels de subtab/subsubtab + copy de empty-state. Sara tab = "Próximamente". Verificar `_VOSEO` cero en los strings nuevos (pre-commit §1 escanea `.ts/.tsx` de producto). Ver § Microcopy.
- **PII:** N/A — sin datos de usuario en esta story.
- **Native-first:** lint/tests nativos (`npx tsc/eslint/vitest` + `npx playwright` host) — NUNCA docker exec.

## 12. Architecture Fitness Impact

| Gate | Path | Acción en esta story |
|---|---|---|
| shell-routes SSoT | `src/__tests__/architecture/test_shell_routes_ssot.test.ts` | **ACTUALIZAR** el bloque "Sara constraint" (hoy asserta `sara: [proyectos]` exactamente 1 subtab). Con el árbol v3 Sara sigue teniendo **exactamente 1** subtab pero el slug es `proximamente`, no `proyectos`. El test (líneas 148-166) chequea `idMatches.length === 1` (sigue verde) + `saraSection.toContain('"proyectos"')` (FALLA → cambiar a `'"proximamente"'`). El resto del test (exports, DEFAULT_LANDING christian/pipeline, no-hardcode) sigue verde sin cambio. **Es allowlist del SSoT, no gate de comportamiento → update es legítimo (R7 ratchet: el árbol es la fuente, el test lo refleja).** |
| shell-routes unit | `src/lib/routing/__tests__/shell-routes.test.ts` | **ACTUALIZAR** los `toEqual([...])` de cada agente al árbol v3 (líneas 92-119) + `getDefaultSubtab` esperados (200-205) + agregar asserts para `AGENT_SUBSUBTABS` (3 leaves). |
| FSD boundaries | `boundaries/dependencies: error` | sin cambio — la ruta N3 nueva importa del SSoT + dispatcher (capas permitidas). |
| tsc strict + eslint | — | 0 errores. NUNCA template literals en class strings (G3). |

**Allowlist:** ninguna crece. El SSoT-test "Sara block" no es allowlist numérica — es assertion de contenido que refleja el árbol; se actualiza al árbol nuevo (no se relaja un gate). Documentar el cambio en el commit body.

## 13. capability YAML + SYSTEM-MAP updates required (post-merge)

- `nicolify/docs/product/capabilities/shell-organism/shell-nicolify.yaml` (extend): reflejar el nav tree v3 (N2 + 8 leaves N3) + `dev_preview` → `shell-routes.ts`. Owner: `/pm-nicolify` Fase F.
- `SYSTEM-MAP.yaml` v2.0 — **YA es SSoT del árbol** (no se modifica en la build; la build lo implementa). El builder verifica paridad slug-a-slug contra `agents[].functional_areas[].leaves[]`.
- **Flag a /pm-nicolify (pendiente, NO bloquea esta build):** enmendar `ADR-nicolify-002 D-D` (Sara activa "Mi Día") → Sara deferred "Próximamente" (ya marcado `sara_status: deferred` en el map). Es trabajo de doc del PM, no de esta story.

## 14. Test Surfaces (TDD RED-first) + regression_guard

**FE (Vitest unit · RED primero):**
- `shell-routes.test.ts` — RED: arrays viejos fallan contra árbol nuevo → GREEN: arrays v3. Cubre guards (`isValidAgent`/`isValidSubtab`/`getDefaultSubtab`) + `AGENT_SUBSUBTABS` (3 leaves presentes, combos inexistentes → null).
- `test_shell_routes_ssot.test.ts` (arch) — RED: assertion Sara `'"proyectos"'` falla → GREEN: `'"proximamente"'`.

**E2E (Playwright · gate anti-burbuja DoD #37):**
- `nav-walk-v3.spec.ts` (★ NEW): recorre **TODO** el árbol v3 — cada Ribbon tab → cada N2 subtab → cada N3 leaf (los 3) → assert `[data-testid="subtab-content-{agent}-{subtab}"]` o N3 visible + `[data-testid="empty-state"]` visible + **0 `pageerror`** + **0 console.error** (allowlist shrink-only) + **0 `nextjs-portal`** overlay + **0 responses 4xx/5xx en `/api/`**. Importa de `fixtures/base.ts`.
- `empty-states-all-subtabs.spec.ts` (MODIFIED): `ALL_SUBTABS` → árbol v3 (data update, no machinery).

**regression_guard (NO deben cambiar de comportamiento · solo data si referencian slugs viejos):**
- Specs de maquinaria del shell que NO dependen de slugs específicos (`splitter-*`, `theme-toggle`, `luana-*`, `topbar-*`, `responsive-*`, `a11y-keyboard`, `path-xss-guard`, `avatar-*`) → **intactos**.
- Specs que SÍ referencian slugs (`ribbon-nav` usa `christian/pipeline` [OK, se mantiene] + `abel/oferta` [oferta sigue existiendo, OK]; `ribbon-deeplink`, `empty-states-all-subtabs`) → actualizar SOLO la **data** (las URLs/slugs), nunca la mecánica de aserción. Si un spec rompe por mecánica → revisión explícita, no update mecánico.
- Co-located unit (`LuanaSidebar.test`, `ShellOrganismLayoutClient.test`, etc.) → intactos (no dependen del árbol de subtabs).

## 15. Research Notes

Sin patrón novel — es reescritura de datos sobre maquinaria existente, con precedente directo en la story `nicolify-r0-shell` (misma estructura) y en vitalia (fuente del patrón shell-organism). El único patrón "nuevo" para nicolify es el **fixture anti-burbuja `base.ts`** mandado por la rule `definition-of-done-live-verify.md` (Critical #37, cement 2026-05-31) — su forma canónica (collectors `pageerror`/`console.error`/`response>=400`/`nextjs-portal` con assert-empty en teardown) está especificada en la propia rule (§ "El GATE ANTI-BURBUJA"); vitalia es la referencia implementando `frontend/e2e/fixtures/base.ts`. No requiere WebSearch (es regla interna del harness, no SOTA externo). Knowledge cutoff Jan 2026 no aplica — todo el contexto es interno y leído live 2026-06-03.

## 16. Architecture Decisions (adr_001_compliance: partial-with-rationale)

ADR-nicolify-001 son las **9 secciones para sub-tabs que construyen contenido real**. Esta story es **thin nav-data**, no construye una hoja. Cobertura por sección:

| Sección ADR-001 | Aplica acá | Rationale |
|---|---|---|
| 1. Routing (route group, N3-static, params Promise) | **SÍ** | Se crea `[subsubtab]/page.tsx` siguiendo el patrón verbatim de `[subtab]/page.tsx` (Server Component, `await params`, whitelist guard → `notFound()`). N3 = SubSubTabsBar, nunca Shadcn `Tabs`. |
| 2. FSD-Lite | **SÍ (trivial)** | No se crea `features/{agent}/` — el SSoT vive en `lib/routing/`, el dispatcher en `components/shared/`. Sin cross-feature imports. |
| 3. Client root | **N/A** | No hay vista de hoja con `"use client"` — los empty-states son Server Components (EmptyState molécula pura). |
| 4. Data layer split | **N/A** | Sin data fetched (React Query/Zustand). URL state lo maneja la maquinaria existente. |
| 5. Forms (RHF+Zod) | **N/A** | Sin formularios. |
| 6. Backend DDD + guardrails + tier gating | **N/A** | Sin backend. Sin acción autónoma de agente → sin audit row. Sin tier gating (no hay capacidad invocable acá). |
| 7. Migrations | **N/A** | Sin DB. |
| 8. Telemetría `nicolify_growth_studio_event` | **N/A** | Sin telemetría (nav skeleton vacío · sin evento de negocio). |
| 9. Tests (4 capas) | **PARCIAL** | Unit (guards/SSoT) + Playwright funcional (nav-walk + anti-burbuja) + arch fitness. SIN visual goldens nuevos (no se diseña hoja · empty-states reusan molécula ya golden-ada en `nicolify-r0-shell`) — visual queda OPCIONAL liviano. SIN BE pytest (sin backend). |

**G1 mockup-per-component:** N/A — no se crea componente UI nuevo (EmptyState ya ratificado en `nicolify-r0-shell`). G2 SSR-safe store: N/A (sin store nuevo). G3 Tailwind JIT-safe: aplica (sin template literals en classes — pero esta story casi no toca classes).

**Conclusión:** `partial-with-rationale` justificado — es thin nav-data sobre maquinaria shipped, no una sub-tab de contenido. Las secciones N/A lo son por naturaleza THIN, documentadas arriba.

## 17. Integration Design (CONN · anti-orphan)

- **Consumed (≥1 consumidor real):** cada slug nuevo es consumido por la maquinaria existente — `Ribbon`/`RibbonTab` (N1), `SubTabsBar`/`SubTab` (N2), `SubSubTabsBar`/`SubSubTab` (N3) leen `AGENT_CATALOG`/`AGENT_SUBTABS`/`AGENT_SUBSUBTABS` del SSoT. El `SubTabContent` dispatcher consume `AGENT_SUBTABS` + el content-map.
- **On the map:** vive en la cap `shell-organism.shell-nicolify` (extend) + en `SYSTEM-MAP.yaml` v2.0 (árbol canónico). Hogar = zona Infraestructura → plataforma-tecnica (meta-story del shell).
- **Navigable/reachable:** usuario logueado → shell → Ribbon (5 agentes + config) → SubTabsBar (N2) → SubSubTabsBar (N3 los 3 con leaves) → empty-state de la hoja. **★ Gap cerrado:** hoy la ruta `[subsubtab]/page.tsx` NO existe → los 8 leaves N3 serían 404 al navegar. Esta story la crea → los 3 árboles N3 quedan navegables (reachability completa).
- **Notarized/registered:** el árbol vive en el SSoT `shell-routes.ts` (ya importado por todos los components + el dispatcher); la ruta N3 se registra como segmento `[subsubtab]` del App Router (Next.js la descubre por filesystem). Sin `include_router`/nav-tree manual extra — es file-based routing + SSoT data.
- **NO es isla:** cada slug nuevo es alcanzable por nav + tiene empty-state; ningún leaf queda sin ruta.

### Decisión de routing N3 — `[agent]/page.tsx` y `[subtab]/page.tsx` guards
- `[subtab]/page.tsx` (existente) valida `isValidAgent + isValidSubtab` → si un subtab tiene leaves (ej. `abel/oferta`), navegar a `/{t}/abel/oferta` SIGUE siendo válido y renderiza su empty-state N2 (la SubSubTabsBar aparece encima, mostrando los leaves; el contenido por defecto es el del N2 hasta que el usuario elige un leaf). **No se cambia este comportamiento** — coherente con el patrón actual.
- `[subsubtab]/page.tsx` (NEW) valida `isValidAgent + isValidSubtab + (subsubtab ∈ AGENT_SUBSUBTABS[agent.subtab])`. El builder agrega un mini-guard `isValidSubSubTab(agent, subtab, subsubtab)` en el SSoT (whitelist, simétrico a `isValidSubtab`) — o reusa `getSubSubTabs(agent, subtab)?.some(...)`. Si inválido → `notFound()`.
- `DEFAULT_LANDING` = `christian/pipeline` se mantiene; `AGENT_CATALOG.christian.defaultSubtab = "pipeline"` para coherencia tab-click ↔ landing (ver § 0.1 nota).

## 18. Open Questions for PM

- **OQ-1 (no bloquea build):** `AGENT_CATALOG.christian.defaultSubtab` — la spec de Chris dice "christian→pipeline[default landing] o contactos[1er]". Decidí **`pipeline`** (coherencia con `DEFAULT_LANDING` ratificado + `test_shell_routes_ssot` que exige christian/pipeline). Si `/pm-nicolify` prefiere que el click directo en la tab Christian abra `contactos` (1er área del flujo) y solo el landing post-login sea pipeline, es un ajuste de 1 línea en `AGENT_CATALOG.defaultSubtab` — pero rompería la coherencia tab↔landing. **Recomiendo pipeline.**
- **OQ-2 (doc del PM, no de la build):** enmendar `ADR-nicolify-002 D-D` (Sara "Mi Día" activa → "Próximamente" deferred). Ya marcado en el map; pendiente el ADR. No bloquea esta story.
- **OQ-3 (opcional):** ¿se quieren capability stubs `status: planned` por hoja en `capabilities/{module}/{cap}.yaml`? El checkpoint lo lista como deliverable **opcional**. Lo dejé FUERA de scope de esta build (es trabajo de `/pm-nicolify`, no del builder-frontend) — cada hoja declara su cap al construirse en R1..R5.
