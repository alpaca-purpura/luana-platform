---
name: nicolify-design-system
description: SSoT cargable del sistema de diseño + shell-organism de Nicolify (índice narrado sobre los docs + código — NO duplica). Cargá ANTES de tocar cualquier `nicolify/frontend/src/**` UI. Cubre autoridad de tokens (globals.css + tailwind.config.ts brand-local), átomos/moléculas/organism consumidos de `@luana/ui-kit` + locales, el shell de Luana-orquestador + Ribbon de 5 agentes expertos (Abel/Brenda/Christian/Sara/Norvil) + Config, catálogo de agentes (colores hex), gates ADR-nicolify-001 (hereda ADR-vitalia-003/004) + SSR-safe store (ADR-vitalia-006), fidelidad del wrapper (portar verbatim de Vitalia re-temizado), y guardrails agénticos (tier gating + audit autonomía) en vez de PHI. Triggers: 'pantalla nicolify', 'componente nicolify', 'shell organism nicolify', 'átomos nicolify', 'colores de marca nicolify', 'agent color', 'ribbon', 'sub-tab', 'LuanaSidebar', 'tokens nicolify', 'cómo se hace este módulo en nicolify', 'fidelidad visual nicolify'. Es brand-scoped (instancia de la clase `{brand}-design-system`).
---

<!-- voseo-allowed: internal skill doc (instrucciones al agente builder/architect), no user-facing -->

# nicolify-design-system — SSoT cargable del diseño Nicolify

> **Soy un índice narrado + router, NO una copia.** El SSoT real vive en los docs (`nicolify/docs/architecture/`) y el código (`nicolify/frontend/`). Mi trabajo es que llegues a la fuente correcta sin triangular, y que **el builder reciba esto en el build** (vía `must_load_skills`), que es donde se pierde (learning cross-brand `docs/learnings/2026-05-29-brand-design-system-skill.md`).
>
> **Regla de oro:** antes de crear cualquier elemento visual → buscá acá si ya existe (en `@luana/ui-kit` o local). Reinventar un átomo/molécula/token existente = FAIL (`anti-duplication.md`).
>
> **★ Estado 2026-05-29:** Nicolify está en **rebuild desde cero** (FE vacío). Los paths marcados **(a crear en R0)** todavía no existen — este skill es el plano + crece a medida que R0 construye el shell. El patrón se **reusa de Vitalia** (brand de referencia), adaptado a los 5 agentes Revenue/Ops.

## 0 · Cuándo cargarme (obligatorio)

- Cualquier ticket que toque `nicolify/frontend/src/{app,components,features}/**` con UI.
- `/architect` (architect-fe) DEBE listarme en `assignment.must_load_skills` de todo ticket FE de nicolify.
- `builder-frontend` me carga y reporta "Skills consulted" en `T-{n}-result.md`.
- `auditor-frontend` me carga antes de scorear categorías Visual fidelity + Anti-duplication.

## 1 · Autoridad de tokens (SSoT real — NO inventar)

| Qué | SSoT autoritativo | Nota |
|---|---|---|
| Colores, tipografía, radios, gradientes (vivos) | `nicolify/frontend/src/app/globals.css` **(a crear en R0)** | CSS vars `:root` + `.dark`. ES el SSoT runtime. Paleta B2B/agencia (NO clínica). |
| Wiring de vars → utilidades Tailwind | `nicolify/frontend/tailwind.config.ts` **(a crear en R0)** | `hsl(var(--*))`. |
| Lookup runtime de agent-color (JIT-safe) | `nicolify/frontend/src/components/shared/shell-organism/_agent-tw-classes.ts` **(a crear en R0)** | Static helpers (switch/map → class literals completas). **NUNCA template literals** (purga JIT — learning `2026-05-25-q16-tailwind-jit-template-purge`). |
| Z-index | `@luana/design-tokens` → `Z_INDEX` / `Z_INDEX_CLASSES` | **Consumir del engine**, NO inventar escala. |
| Intención visual / brandbook | `nicolify/docs/architecture/design-system.md` **(a crear en R0)** | doc de diseño Nicolify. |

> ⚠️ **Trampa común (heredada de Vitalia):** `core/@luana/design-tokens` **solo exporta `Z_INDEX`** — NO colores. No busques tokens de color ahí; el SSoT es brand-local (`globals.css`). Quien busca color en el engine no encuentra nada y reinventa → ese es el bug.

**Reglas de token:** nunca hardcodear hex/px que ya es var. Usá clases Tailwind que mapean a las vars (`bg-primary`, `text-agent-christian`, etc.). Paleta Nicolify = a definir en R0 (B2B/Revenue-Ops, distinta de la clínica de Vitalia).

## 2 · Átomos — consumir de `@luana/ui-kit` (NO recrear)

`@luana/ui-kit` exporta ~40 primitivas Shadcn: `Accordion · Alert · AlertDialog · Avatar · Badge · Button · Calendar · Card · Chart · Checkbox · Collapsible · Command · CurrencySelector · DetailPanel · Dialog · DropdownMenu · Form · Input · Label · LoadingButton · Popover · Progress · RadioGroup · RichSelect · ScrollArea · Select · Separator · Sheet · Skeleton · Slider · SmartDatetimePicker · Sonner · Switch · Table · Tabs · Textarea · TimezoneSelect · Tooltip` (+ más).

→ **Nunca reinventar un átomo.** Importá de `@luana/ui-kit`. Si falta una primitiva, agregar Shadcn estándar local en `components/ui/` (no `<div>` crudo). `Tabs` es para tabs internas de contenido — **NO** para sub-secciones de una sub-tab (eso es N3-static, ver §4). `CurrencySelector` + `formatMoney` (de `@luana/format`) → clave para B2B multi-currency (contratos en distintas monedas LatAm).

## 3 · Moléculas / organism

| Dir | Para qué |
|---|---|
| `nicolify/frontend/src/components/shared/shell-organism/` **(a crear en R0)** | **El organism principal.** Ver §4. Port re-temizado de Vitalia. |
| `nicolify/frontend/src/components/shared/agents/` **(a crear)** | `AgentAvatar`, `AgentAttribution`, `agent-names.ts`. |
| `nicolify/frontend/src/components/shared/guardrails/` **(a crear)** | `BudgetGuardGate`, `AgentActionAuditRow`, `TierGate` — superficies de autonomía/tier (ver §7). |

`@luana/api-client` provee módulos de dominio reutilizables relevantes a Revenue/Ops: `leads`, `crm-dashboard`, `availability`, `connections`, `whatsapp` — reusar antes de crear.

## 4 · Shell organism (lo que más se pierde en build)

**★ Modelo de navegación cardinal:** son **3 niveles de tabs que GUÍAN hasta la hoja**. La **hoja = el contenido** (lo que renderiza el `page.tsx` del último tab) y **es lo único que cambia**. Una **hoja NUNCA contiene tabs/subtabs**. Si el contenido parece necesitar sub-secciones tabuladas → eso es otro nivel de tab (N3-static via SubSubTabsBar), NO `Tabs` de Shadcn dentro de la hoja (anti-pattern, ADR-vitalia-004 §3.1.1).

**Diferencia clave vs Vitalia:** en Vitalia el chat lateral izquierdo es de **Valeria** (una agente con tab). En Nicolify el chat lateral es de **Luana** (orquestadora, único rostro) y **NO tiene tab en el Ribbon** — le hablás a Luana, ella delega. El Ribbon son los 5 agentes expertos + Config.

Los 3 niveles de tab (SSoT: `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` **(a crear en R0)**):

- **N1 — Ribbon de 5 agentes expertos + Config** (tab nivel 1): `Ribbon.tsx` + `RibbonTab.tsx` + `ConfigTab.tsx`. Tabs: **Abel · Brenda · Christian · Sara · Norvil · Configurar**. Cada tab con su agent-color border. (Sara = Jefa de Proyectos · `--agent-sara` ámbar `#F59E0B` ratificado Chris 2026-05-30.)
- **N2 — SubTabsBar** (tab nivel 2): `SubTabsBar.tsx` + `SubTab.tsx`. Whitelist `AGENT_SUBTABS` (ver §5).
- **N3 — SubSubTabsBar** (tab nivel 3, opcional): `SubSubTabsBar.tsx` cuando el destino agrupa 3+ vistas discretas (ej. Christian→propuestas→`borrador/revisión/firmado`). **N3-static, NO Shadcn Tabs internas.**
- **Hoja (contenido)**: lo que renderiza el `page.tsx` del último tab. Destino, NO contiene más tabs.
- **Panel Luana izquierdo (3 estados)**: `LuanaSidebar.tsx` → `LuanaRail.tsx` (collapsed) / `LuanaHistory.tsx` / `LuanaChat.tsx` (con `ChatComposer`/`ChatHeader`/`ChatMessages`/`MessageBubble`/`TypingIndicator`/`ChatStarters`). **El orquestador: traduce intención → delega → reporta digerido.**
- **TopBar global**: `TopBarGlobal.tsx` + `LogoMark.tsx` + `TenantSwitcher.tsx` (agencia/tenant) + `ThemeToggle.tsx`.
- **Layout**: `ShellOrganismLayout.tsx` — dual-mode **50/50 con splitter resizable de 3 estados** (chat-collapsed / narrow / 50-50). NO 50/50 hardcoded (race condition: learning `2026-05-23-shell-layout-race-condition-defer` → usar `useGroupRef()` + `setLayout()` imperativo). El chunk client va en `dynamic({ssr:false})` con skeleton **store-free**.

**Routing** (SSoT: `nicolify/frontend/src/lib/routing/shell-routes.ts` **(a crear en R0)** → `AGENT_CATALOG` + `AGENT_SUBTABS` + `AGENT_SUBSUBTABS`):
```
app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx
```
Server Component default · SSR initial state · datos sensibles nunca en URL/searchParams.

### ★ Fidelidad del wrapper — portar VERBATIM re-temizado (causa #1 de pérdida)

Cuando un componente/sub-tab aterriza dentro del shell, el wrapper de contexto (TopBar + Ribbon + SubTabsBar + LuanaSidebar/chat) se **porta verbatim de Vitalia y se re-temiza** — NO se reinventa simplificado (genera grises en vez de tokens, 50/50 hardcoded, chat inventado — learning `2026-05-27-shell-mockup-wrapper-fidelity`):

| Layer | Fuente canónica Vitalia (read-only · re-temizar a Nicolify) |
|---|---|
| Shell integral (macro) | `vitalia/docs/archive/2026/stories/vitalia-shell-organism/mockups/dual-mode-shell.html` |
| Chat orquestador completo | `vitalia/docs/archive/2026/stories/vitalia-fase1-valeria-chat-skeleton/mockups/valeria-chat-sample.html` |
| Rail (collapsed) | `vitalia/docs/archive/2026/stories/vitalia-fase1-valeria-rail-history/mockups/valeria-rail.html` |

> Worktree de Vitalia al día: `~/Proyectos/luana-vitalia/`.

## 5 · Catálogo de agentes (6) — roles + nav (colores a definir en R0)

| Agente | slug | rol corto | en Ribbon? | sub-tabs (N2, ratificadas 2026-05-29) |
|---|---|---|---|---|
| **Luana** | `luana` | orquestadora · único rostro (chat lateral izq) | **NO** (es el sidebar, no tab) | — (panel chat 3 estados) |
| **Abel** | `abel` | estratega · branding & oferta | sí | Oferta · Ángulos · Escalera de valor · Marca |
| **Brenda** | `brenda` | growth · guardiana del presupuesto | sí | Campañas (pauta) · Contenido · Presupuesto (CAC/ROAS) |
| **Christian** | `christian` | cazador · SDR/outbound | sí | Prospectos · Secuencias · Pipeline · Propuestas · Licitaciones (minería) |
| **Sara** | `sara` | jefa de proyectos · operación/delivery | sí | Mi Día · Proyectos & entregables · Estado de entregas (sub-tabs a ratificar) |
| **Norvil** | `norvil` | cultivador · account manager | sí | Cuentas · Salud de cuenta · Renovaciones/Upsell |
| **(Configurar)** | `config` | settings | sí | Conexiones · Preferencias · Tokens/Plan · Agentes (autonomía/umbrales) |

Cada agente con tab: `--agent-{slug}` + `--agent-{slug}-soft` en `globals.css`. Default chat = `luana` (siempre presente).

**Colores de agente (★ paleta oficial de `nicolify.com` — actualizada 2026-05-29):**

| Agente | `--agent-{slug}` | avatar (placeholder temporal) |
|---|---|---|
| luana | `#635BFF` (indigo-violeta · firma) | `nicolify/frontend/public/agents/luana/avatar.svg` |
| abel | `#A855F7` (púrpura) | `…/abel/avatar.svg` |
| brenda | `#22C55E` (verde) | `…/brenda/avatar.svg` |
| christian | `#3B82F6` (azul) | `…/christian/avatar.svg` |
| sara | `#F59E0B` (ámbar · **ratificado Chris 2026-05-30**) | `…/sara/avatar.svg` **(pendiente)** |
| norvil | `#EC4899` (rosa) | `…/norvil/avatar.svg` |
| config | `#64748b` (slate) | — |

**Paleta de marca (de `nicolify.com`):** primario `#635BFF` (indigo) + `#A855F7` (púrpura, gradiente) · neutros grises fríos (Tailwind gray/slate) · fondo blanco / dark slate `#0F172A` (mockup usa deep-indigo `#0E1124`) · acentos azul `#3B82F6` / verde `#22C55E` / rosa `#EC4899`.
**Fuentes (de `nicolify.com`):** **League Spartan** (display/UI · weights 400-800) + **Bree Serif** (serif acento) vía Google Fonts.
**Logos:** `public/nico-assets/{isotipo,logotipo-fondo{claro,oscuro}}-nicolify.svg` (en legacy `~/Proyectos/luana-nicolify-legacy/`; copiar al FE en R0).
**Avatares:** SVG placeholder generados 2026-05-29 (`/tmp/gen_nicolify_avatars.py`) — **Chris entrega finales en semanas, reemplazo 1:1 en `public/agents/{slug}/avatar.svg`.**

## 6 · Gates de proceso (cumplir, no re-litigar)

- **ADR-nicolify-001** (a crear · hereda ADR-vitalia-004 9 secciones): sub-tab nueva → patrón de 9 secciones (routing route-group · FSD-Lite · client root · React Query+Zustand · RHF+Zod · DDD Inside-Out **sin PHI** · migrations idempotent · telemetría `nicolify_growth_studio_event` · tests 4 capas). `01-spec.md`/`03-arch.md`/`checkpoint.md` citan `architecture_pattern: ADR-nicolify-001`.
- **Mockup-per-component** (hereda ADR-vitalia-003): componente UI nuevo → mockup HTML por-componente ratificado por Chris ANTES de `refining→refined`. `/architect` REFUSE sin `ratified_visual_by_chris: true`.
- **SSR-safe persisted store** (hereda ADR-vitalia-006): todo store Zustand `persist` bajo Next.js 16 → factory `createSsrSafePersistedStore` + `useStoreHydration` dentro del chunk `ssr:false`. NUNCA `persist` raw. (Candidato a consumir de `@luana/hooks` post-lift.)

## 7 · Superficies de autonomía + tier (en vez de PHI)

Nicolify NO tiene HIPAA/PHI. En su lugar, los guardrails agénticos (SSoT: `nicolify/.claude/rules/agent-revenue-engine.md`):

- **Tier gating:** `TierGate` / `BudgetGuardGate` — verifica el plan del tenant antes de renderizar features de agentes premium (Christian/Norvil) · consume `core/luana-core-billing/` BudgetGuard. Server-side, no solo UI.
- **Autonomía auditada:** `AgentActionAuditRow` — toda acción autónoma (Brenda apaga campaña por umbral CAC/ROAS · Christian outbound) muestra/registra audit + se reporta vía Luana.
- **Token economy:** indicadores de bolsa de tokens + alertas de recarga (80/95/100%); funciones críticas (recepción pasiva de leads) nunca se cortan.

## 8 · Checklist "cómo construir una pantalla Nicolify"

1. ¿Es sub-tab del shell? → seguí ADR-nicolify-001 (9 secciones) + routing en `shell-routes.ts`.
2. Tokens: usá clases Tailwind mapeadas a `globals.css`. Cero hex/px nuevo. Z-index de `@luana/design-tokens`.
3. Átomos: importá de `@luana/ui-kit`. Moléculas: reusá `components/shared/`. Dominio: reusá `@luana/api-client`. Solo si nada sirve → creá en `features/{agent}/components/` con átomos.
4. Wrapper del shell: portá verbatim de Vitalia + re-temizá (§4). No reinventar.
5. Agent-color: usá `--agent-{slug}` del agente dueño de la tab (§5). Luana = sidebar, no tab.
6. Guardrails: `TierGate`/`BudgetGuardGate` para features premium; `AgentActionAuditRow` para acciones autónomas (§7).
7. Spanish neutro (tuteo, sin voseo — salvo output sales_agent). Estados empty/loading/error/success como el mockup.
8. Tests: Vitest + Playwright visual golden vs mockup + axe. SSR-safe store (§6).

## Referencias (SSoT — leer on-demand)

- `nicolify/docs/product/vision.md` — visión de negocio (5 agentes + ciclo Atracción→Cierre→Retención)
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — **(a crear en R0)** atomic design + inventario + routing
- `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md` — **(a crear en R0)** patrón 9 secciones (hereda ADR-vitalia-004)
- `nicolify/docs/product/stories/nicolify-r0-shell-organism/` — design-story + nav-tree + fe-architecture-review
- `nicolify/.claude/rules/agent-revenue-engine.md` — guardrails autonomía + tier + token economy
- `core/@luana/{ui-kit,format,hooks,design-tokens,api-client,extension-sdk}/` — engine FE compartido (consumir)
- **Vitalia (brand de referencia, worktree `~/Proyectos/luana-vitalia/`):** `vitalia/docs/architecture/{SHELL-DESIGN-CONTRACT.md, ADR-vitalia-003/004/006, design-system.md}` + `vitalia/.claude/skills/vitalia-design-system/SKILL.md` (este skill es su análogo) + `vitalia/frontend/src/{app/globals.css, lib/routing/shell-routes.ts, components/shared/shell-organism/}`
- `docs/architecture/luana-platform/ADR-008-luana-core-ui-shadcn-cli-pattern.md` — futuro hogar de los organismos del shell (lift post-R0)
- `.claude/rules/frontend-fsd.md` · `.claude/rules/anti-duplication.md` · `.claude/rules/spanish-text.md`
