---
story_id: nicolify-r0-shell
brand: nicolify
arch_version: 1
schema_version: v4.1
type: ui-story
surface: FE
architecture_pattern: ADR-nicolify-001
adr_001_compliance: partial-with-rationale
architect_run_on: 2026-05-30
ratified_by_chris: true
ratified_visual_by_chris: true
map_zone: infraestructura
map_box: plataforma-tecnica
cap_target: null
cap_change_type: new
---

# 03-arch — nicolify-r0-shell (consolidado · surface FE)

> Contrato técnico SINGLE-SHOT del shell-organism agéntico de Nicolify (esqueleto FE estático/navegable).
> **PORT verbatim re-tematizado** del shell maduro de Vitalia → Nicolify (paleta nicolify.com + 5 agentes Revenue/Ops).
> NO se reinventa simplificado. SSoT de diseño: `SHELL-DESIGN-CONTRACT.md` + `ADR-nicolify-001` + mockup `shell.html` (5 tabs).

## 0. Context Summary

- **Story:** `nicolify-r0-shell` (R0 · Fundación + shell agéntico) · state `refined → ready`.
- **Naturaleza:** FE-ONLY · esqueleto estático. Cero endpoints BE nuevos, cero runtime agéntico, cero data real. Paneles renderizan estructura + empty-states; ChatComposer no-funcional.
- **Architect run on:** 2026-05-30 (model knowledge cutoff Jan 2026; el patrón se valida contra código vitalia live + canonical Next.js/React docs — no requiere research novel, ver § 15).
- **architecture_pattern:** `ADR-nicolify-001` (9 secciones · hereda ADR-vitalia-004 sin PHI + guardrails agénticos). `adr_001_compliance: partial-with-rationale` (ver § Architecture Decisions — divergencias: BE/telemetría no aplican en R0 skeleton; Tailwind v4 CSS-based config).

### Surface → builder → auditor mapping (PM/dev-team spawn)

| Surface | Builder | Auditor |
|---|---|---|
| `nicolify/frontend/src/**` (tokens + organismos shell + routing + stores + e2e) | **`builder-frontend`** (Sonnet) | **`auditor-frontend`** (Opus) |

> **Cero tickets BE/AGENTIC.** No hay `nicolify/backend/src/**` ni `modules/{copilot,sales_agent}/` tocado. `primary_agent` SIEMPRE `builder-frontend`, `model_preference: sonnet`.

- **Skills consultados:**
  - `nicolify-design-system` → SSoT tokens + shell organism + catálogo 5 agentes + wrapper fidelity (portar verbatim de vitalia). Decisión: consumir `@luana/ui-kit` átomos, portar moléculas/organismos de `vitalia/.../shell-organism/` re-tematizados.
  - `frontend-expert` → FSD-Lite boundaries, Server-First, React Query/Zustand split, SSR-safe store gate.
  - `playwright-expert` → test_construction_plan E2E (regression scoped + axe a11y).
- **CONTEXT-BRIEF source:** absent (story pequeña, brief skipped) → self-ran reads de spec + design-contract + ADR + nav-tree + fe-architecture-review + vitalia source (Path B fallback para anti-duplication audit, ver § Prior art audit).
- **capability YAML files affected (post-merge):** ninguno en R0 (`cap_target: null` · shell = infra-container). La cap se define al merge cuando una sub-tab traiga funcionalidad real (R1+). `/pm-nicolify` Fase F.3 puede crear `shell-organism.shell-nicolify` cap stub si lo decide — NO bloquea R0.
- **Architecture gates que deben seguir verdes:** `nicolify/frontend/src/__tests__/architecture/*` (FSD boundaries no-cross-feature, no-store-in-ssr-skeleton, agent-tw-classes-no-template-literals, shell-routes-ssot, spanish-neutro). EXTEND el set existente; allowlists shrink-only.

## 1. Domain Entities

**N/A — FE-only skeleton.** No hay entidades de dominio BE nuevas. El "modelo" del shell es client-side declarativo:

- `shell-routes.ts` — catálogo declarativo `AGENT_CATALOG` + `AGENT_SUBTABS` + `AGENT_SUBSUBTABS` (TS const, no persistido).
- `useShellStore` — UI state (luanaState · shellSplitState · mobileDrawerOpen) persistido en localStorage vía `createSsrSafePersistedStore`.

## 2. SQLAlchemy 2.0 Models

**N/A — cero migraciones, cero tablas.** R0 no crea ninguna tabla. Telemetría declarada pero NO emitida (ver § 8 conceptual abajo). Cuando se instrumente (R0 opcional o R1+): tabla brand-local `nicolify_growth_studio_event` (con `account_id`, NUNCA `clinic_id`) — fuera de scope de esta story.

## 3. Pydantic v2 DTOs

**N/A — cero endpoints BE nuevos.** El shell NO hace fetch de datos en R0 (todas las hojas arrancan en empty-state). Cuando una sub-tab traiga data (R1+) declarará sus DTOs.

## 4. API Routes

**N/A — cero rutas API nuevas.** El routing es Next.js App Router FE (ver § Routing FE abajo). El único `fetch` heredable del patrón vitalia (`fetchUserTenants` en el route-group layout) se **simplifica en R0**: ver § Architecture Decisions D1 (tenant resolution skeleton).

## 5. TypeScript Types (Frontend)

> SSoT en `nicolify/frontend/src/lib/routing/shell-routes.ts` + `nicolify/frontend/src/stores/shell-store.ts`.

```ts
// shell-routes.ts (NEW — del navigation-tree, re-tematizado)
export type AgentSlug = "abel" | "brenda" | "christian" | "sara" | "norvil" | "config";

export interface AgentMeta {
  slug: AgentSlug;
  label: string;          // "Abel", "Configurar"
  role: string;           // "Estratega · Branding & Oferta"
  colorVar: `--agent-${AgentSlug}`;
  inRibbon: true;         // todos los del catálogo van en Ribbon (Luana NO está acá)
  defaultSubtab: string;  // abel→"oferta", christian→"pipeline", config→"conexiones"
  avatarSrc: `/agents/${AgentSlug}/avatar.svg` | null; // config → null
}

export const AGENT_CATALOG: readonly AgentMeta[];          // 6 entradas (abel..config)
export const DEFAULT_LANDING = "christian/pipeline" as const;  // ratificado Chris 2026-05-30

export const AGENT_SUBTABS: Readonly<Record<AgentSlug, readonly string[]>>;
//  abel: [oferta, angulos, escalera-valor, marca]
//  brenda: [campanas, contenido, presupuesto]
//  christian: [prospectos, secuencias, pipeline, propuestas, licitaciones]
//  sara: [proyectos]                       ← solo proyectos en R0 (ratif. Chris)
//  norvil: [cuentas, salud-cuenta, renovaciones]
//  config: [conexiones, preferencias, tokens, agentes]

export interface SubSubTabMeta { id: string; label: string; icon: string; }
export const AGENT_SUBSUBTABS: Partial<Record<`${AgentSlug}.${string}`, readonly SubSubTabMeta[]>>;
//  vacío en R0 (N3-static se materializa cuando una hoja lo necesite).

// guards (whitelist enforcement — bloquean XSS / path injection del scenario A4)
export function isValidAgent(s: string): s is AgentSlug;
export function isValidSubtab(agent: AgentSlug, subtab: string): boolean;
export function getDefaultSubtab(agent: AgentSlug): string;

// shell-store.ts (PORT de vitalia · re-tematizado · ValeriaState→LuanaState)
export type LuanaState = "collapsed" | "history" | "full";   // rail = collapsed render
export type ShellSplitState = "chat-collapsed" | "chat-narrow" | "50-50";
export const SHELL_STORAGE_KEY = "nicolify-shell-state" as const;
```

> **camelCase ↔ snake_case:** N/A (sin DTOs BE en R0). Naming TS = camelCase interno; URL segments = kebab-case (`escalera-valor`, `salud-cuenta`).

## 6. Repository Interfaces

**N/A — sin repositorios BE.**

## 7. Application Services

**N/A — sin services BE.**

## 8. Agentic Surfaces

**N/A — esta story NO toca `modules/copilot/` ni `modules/sales_agent/`.** El panel de Luana es **skeleton no-funcional**: render de estructura (ChatHeader + MessageBubble mock + ChatComposer placeholder + TypingIndicator) sin LangGraph, sin tools, sin prompt slots, sin checkpointer, sin observability writes. `LuanaHistory` usa empty-state o `_mock-conversations.ts` (datos estáticos, NO fetch). El cableado agéntico real llega en R1+ vía `/ux-agentico`. **Cero auditor-agentic involvement.**

## 9. Migration Notes

**N/A — cero migraciones.**

## 9.5 Tests audit (default flip)

`[x] No aplica — CONTRACT no flipea defaults side-effect.` (FE-only skeleton, sin feature flags, sin call-path side-effects).

## 10. File Structure (FE · NEW vs PORTED)

```
nicolify/frontend/
├── package.json                                  MODIFIED (add react-resizable-panels@^4.11.1 — gap detectado)
├── src/
│   ├── app/
│   │   ├── globals.css                           MODIFIED (tokens nicolify.com via @theme · :root + .dark · @agent vars)
│   │   ├── [tenantId]/
│   │   │   └── (shell-organism)/                 NEW route group
│   │   │       ├── layout.tsx                     NEW (Server Component · tenant skeleton resolve · ShellOrganismLayout)
│   │   │       ├── page.tsx                       NEW (redirect → DEFAULT_LANDING christian/pipeline)
│   │   │       ├── not-found.tsx                  NEW (404 root del route-group · shell chrome intacto)
│   │   │       └── [agent]/
│   │   │           ├── not-found.tsx              NEW (404 agente · "Ese agente no existe")
│   │   │           ├── page.tsx                   NEW (redirect → getDefaultSubtab(agent))
│   │   │           └── [subtab]/
│   │   │               ├── not-found.tsx          NEW (404 sub-tab · "Esa sección no existe para este agente")
│   │   │               └── page.tsx               NEW (Server · valida agent+subtab → SubTabContent dispatcher)
│   ├── lib/routing/shell-routes.ts               NEW (SSoT routing · AGENT_CATALOG + AGENT_SUBTABS + guards)
│   ├── stores/shell-store.ts                     PORT de vitalia (re-tematizado · createSsrSafePersistedStore)
│   ├── stores/__tests__/                         NEW (shell-store + hydration tests)
│   ├── components/shared/shell-organism/         NEW dir (PORT verbatim re-tematizado de vitalia/.../shell-organism/)
│   │   ├── _agent-tw-classes.ts                   NEW (G3 JIT-safe static lookup · agent-color literals)
│   │   ├── _mock-conversations.ts / _mock-messages.ts  PORT (datos estáticos skeleton)
│   │   ├── LogoMark.tsx                           PORT (svg claro/oscuro nicolify)
│   │   ├── ThemeToggle.tsx                        PORT
│   │   ├── TenantSwitcher.tsx (+ TenantBadge, TenantOption)  PORT (skeleton · "Cambiar de agencia")
│   │   ├── TopBarGlobal.tsx                       PORT (LogoMark izq + [splitter ctrl · ThemeToggle · TenantSwitcher] der · role=banner)
│   │   ├── ShellOrganismLayout.tsx                PORT (wrapper · dynamic({ssr:false}) boundary · skeleton store-free)
│   │   ├── ShellOrganismLayoutClient.tsx          PORT (Group/Panel/Separator react-resizable-panels · useGroupRef snap-up · useStoreHydration)
│   │   ├── AppPanelSlot.tsx                       PORT (Ribbon + SubTabsBar + SubSubTabsBar + children)
│   │   ├── LuanaSidebar.tsx                       PORT (ValeriaSidebar→Luana · 3 estados · role=complementary · C/R/F · mobile drawer)
│   │   ├── LuanaRail.tsx / LuanaHistory.tsx / LuanaChat.tsx   PORT (Valeria*→Luana*)
│   │   ├── ChatHeader.tsx / ChatMessages.tsx / MessageBubble.tsx / ChatComposer.tsx / TypingIndicator.tsx / HistoryGroup.tsx / HistoryItem.tsx  PORT
│   │   ├── Ribbon.tsx / RibbonTab.tsx / ConfigTab.tsx         PORT (5 agentes + Config · agent-color border)
│   │   ├── SubTabsBar.tsx / SubTab.tsx / SubSubTabsBar.tsx / SubSubTab.tsx  PORT
│   │   ├── SubTabContent.tsx                      NEW (dispatcher subtab → EmptyState · sin 22-combo de vitalia, usa AGENT_SUBTABS)
│   │   ├── AgentAvatar.tsx                        PORT (fallback inicial si avatar 404 — cubre gap Sara)
│   │   ├── EmptyState.tsx / EmptyStateInline.tsx / PlaceholderCard.tsx  PORT (re-tematizado · copy nicolify)
│   │   ├── StatusDot.tsx / TogglePill.tsx / ShellModeToggle.tsx / DelegateMarker.tsx  PORT (según necesidad del wrapper)
│   │   ├── useViewportGuard.ts                    PORT (one-way rail guard <1104px)
│   │   └── types.ts                               PORT
│   ├── components/shared/agents/                  NEW (AgentAvatar reuse · agent-names si aplica)
│   └── __tests__/architecture/                    EXTEND (FSD boundaries + ssr-skeleton + tw-classes + routes-ssot)
├── public/
│   ├── agents/{abel,brenda,christian,sara,norvil}/avatar.svg   NEW (copiar de mockups/assets/agents/ · placeholder · Chris reemplaza 1:1)
│   └── nico-assets/                               NEW (logos LogoMark · copiar de legacy worktree)
└── e2e/regression/nicolify-r0-shell/             NEW (12 specs · ver § 14 + 04-validators)
```

> **Mark:** PORT = origen `vitalia/frontend/src/components/shared/shell-organism/{Componente}.tsx` (READ-ONLY · re-tematizar) — citado en § Prior art audit. NEW = sin precedente directo (re-tematización/skeleton-specific).

## 11. Cross-Cutting Concerns

- **Tenant isolation:** R0 skeleton no hace queries data. El route-group layout valida `tenantId` (skeleton — ver D1). FE `fetchClient` ya auto-inyecta `X-Tenant-ID` (heredado del esqueleto nicolify). Rutas incluyen `[tenantId]`.
- **Currency:** N/A en R0 (sin montos). `@luana/format` (formatMoney) disponible para R1+ B2B multi-currency.
- **Master data / locale:** N/A en R0 (sin fechas/montos render). `@luana/format` + tenant locale para R1+.
- **Spanish neutro LatAm (tuteo):** TODO microcopy del shell en tuteo (ver § Microcopy del spec). Prohibido voseo. Arch test `spanish-neutro` cubre. (El composer es chrome UI → neutro; output conversacional real de agentes = R1+ respeta voz tenant.)
- **PII:** N/A (sin response models BE en R0). Telemetría futura: `nicolify_growth_studio_event` con `account_id` (no `clinic_id`), montos bucketeados.
- **Native-first dev:** lint/tests/tsc/vitest/playwright NATIVE Linux (host) — `cd nicolify/frontend && npx {tsc,eslint,vitest,playwright}`. NUNCA `docker exec`. E2E native (port 3001).

## 12. Architecture Fitness Impact

Gates FE que corren contra el cambio (EXTEND del set existente · allowlists shrink-only):

| Gate | Qué protege |
|---|---|
| `test_features_no_cross_imports.test.ts` | FSD-Lite: `features/A` no importa `features/B` (shell organism vive en `components/shared/`, no `features/`) |
| `no-store-in-ssr-skeleton.test.ts` (PORT de vitalia) | G2: skeleton del boundary `dynamic({ssr:false})` NO suscribe stores |
| `_agent-tw-classes.test.ts` (PORT) | G3: agent-color via static helpers, NUNCA template literals en class strings |
| `test_shell_routes_ssot.test.ts` (NEW) | sub-tabs hardcodeadas prohibidas fuera de `shell-routes.ts` |
| `spanish-neutro` (hook + test) | tuteo, sin voseo en strings user-facing |
| ESLint boundaries + tsc strict + jscpd | dead code / ciclos / duplicación / tipos |

`gate-runner` correrá: `npx tsc --noEmit` + `npx eslint src/ --cache` + `npx vitest run --coverage` (FE ≥20%) + `npx playwright test --project=regression` (native) + arch fitness vitest suite. Auditor consume `gate-output.json` + este contrato.

## 13. capability YAML + modules/{m}.md Updates Required

Ninguno en R0 (`cap_target: null`). Al cerrar R0, `/pm-luana` abre las promotion proposals de lift a `core/luana-core-ui` (N=2 cumplido con vitalia) — fuera de scope de esta story, solo NOTADO (ver fe-architecture-review § 5).

## 14. Test Surfaces (TDD-mandatory · RED first)

> Naturaleza = **FE route/page nueva + componentes shell** → batería: Vitest unit (componente + store) + **E2E Playwright** (smoke+regression scoped) + visual goldens (side-by-side vs `shell.html`) + axe a11y. Sin BE/agentic. Detalle en `04-validators.yaml § test_construction_plan`.

- **Unit (Vitest, co-located):** `useShellStore` (estados + hydration SSR-safe) · `_agent-tw-classes` (lookup literals) · `shell-routes` guards (isValidAgent/isValidSubtab/getDefaultSubtab + XSS whitelist) · cada organismo (Ribbon active state · LuanaSidebar 3 estados · TopBarGlobal render · SubTabsBar URL-derived · AgentAvatar fallback · EmptyState).
- **E2E (Playwright regression, native :3001):** 12 specs mapeados 1:1 a scenarios A1-A5/B1-B3/C1-C3/D1-D2/E1-E5/F1-F2 (ver 04-validators).
- **Visual goldens:** side-by-side vs `nicolify-r0-shell-organism/mockups/shell.html` (shell-default · luana-rail · ribbon-active × light/dark). `maxDiffPixelRatio` tolerancia 0.001 (ratchet shrink-only post-ratificación).
- **a11y:** axe wcag2aa (F1) + keyboard tablist (roving tabindex).

## 15. Research Notes (DATE-AWARE)

No se introduce patrón novel — es un **PORT de patrones ya validados en producción vitalia**. Knowledge cutoff Opus = Jan 2026; el patrón se valida contra código vitalia live (no requiere WebSearch). Canonical refs (no consultadas vía fetch — el patrón ya existe en repo):

- Next.js 16 App Router (route groups, `params: Promise<>`, `not-found.tsx` jerárquico) — patrón ya implementado en `vitalia/frontend/src/app/[tenantId]/(shell-organism)/`, accedido 2026-05-30 (repo local).
- `react-resizable-panels@^4.11.1` (Group/Panel/Separator + useGroupRef snap-up) — patrón en `vitalia/.../ShellOrganismLayoutClient.tsx`, accedido 2026-05-30 (repo local). **GAP:** no está en `nicolify/frontend/package.json` → T-1 lo agrega.
- `createSsrSafePersistedStore` (ADR-vitalia-006 G2) — ya vive en `@luana/hooks/create-ssr-safe-persisted-store.ts`, consumir vía import.
- Learnings vitalia aplicados (citados en spec § Prior art): JIT template-purge (G3), wrapper fidelity, hit-area ≥8px, nextjs-16 proxy.ts, SSR-safe store.

## Architecture Decisions (divergencias de ADR-nicolify-001 · adr_001_compliance: partial-with-rationale)

> El ADR-nicolify-001 define 9 secciones. En R0 skeleton, varias NO aplican (no hay BE/data). Divergencias documentadas:

- **D1 · Sección 6 (BE DDD) NO aplica:** R0 no toca backend. El route-group `layout.tsx` de vitalia hace `fetchUserTenants` + audit IAM; en R0 **se simplifica a tenant-resolution skeleton** — valida sesión Clerk (`auth()` → userId) y, si falla, redirige a `/sign-in`; la validación cross-tenant completa se difiere a cuando el IAM nicolify esté cableado. El layout NO debe romper si `fetchUserTenants` no existe aún: usar el `tenantId` de la URL directamente (skeleton) + TODO marcado para wire IAM. **Rationale:** Clerk + IAM baseline ya existen (BE `main.py` + migración `001_nicolify_iam_baseline`); **T-0 (dev-stack boot, absorbido)** deja `make dev-nicolify` verde + el middleware Clerk de rutas tenant; R0-shell asume eso pero no construye IAM completo.
- **D2 · Sección 8 (Telemetría) declarada NO emitida:** eventos `nicolify_shell_mounted` etc. (spec § Telemetría) quedan declarados; emisión real vía `nicolify_growth_studio_event` se difiere (R0 opcional). NUNCA `copilot_trace_event`.
- **D3 · Tailwind v4 CSS-based config:** nicolify usa Tailwind **v4** (`tailwindcss@^4.1.18`) → tokens van en `globals.css` vía `@theme`/`@layer`, NO en `tailwind.config.ts` (que el design-contract menciona asumiendo v3). El `_agent-tw-classes.ts` (G3) sigue obligatorio. **Rationale:** v4 no usa archivo JS de config; el SSoT de tokens es `globals.css` (alineado con el contrato que ya dice "globals.css = SSoT runtime").
- **D4 · Sección 9 (Tests) sin BE pytest dual-tenant:** no hay BE → la capa de tests es Vitest + Playwright + visual goldens + axe (sin pytest). Conforme a naturaleza FE-only.
- **D5 · Sección 2 (FSD-Lite):** los organismos del shell viven en `components/shared/shell-organism/` (NO en `features/{agent}/`), idéntico a vitalia — son chrome cross-agente, no feature-owned. Las hojas (page.tsx) usan `SubTabContent` dispatcher → `EmptyState` (no hay `features/{agent}/` en R0 porque no hay contenido real). R1+ creará `features/{agent}/` cuando una sub-tab traiga lógica.

> **G1 (mockup ratificado):** ✅ satisfecho (`ratified_visual_by_chris: true` · shell.html 5 tabs). **G2 (SSR-safe store):** cubierto por port de `createSsrSafePersistedStore` + `useStoreHydration` + skeleton store-free + arch test `no-store-in-ssr-skeleton`. **G3 (Tailwind JIT-safe):** `_agent-tw-classes.ts` static lookup + arch test.

## Prior art audit (NO-NEW-LAYER · cross-brand)

### Source of evidence
- [x] Self-run reads (Path B — fallback · CONTEXT-BRIEF ausente)

### Audit ejecutado
```bash
WS=$(git rev-parse --show-toplevel)
# Engine FE packages (consumir, NO recrear)
ls ${WS}/core/@luana/   # ui-kit, design-tokens, hooks, format, api-client, schemas, extension-sdk
find ${WS}/core/@luana/hooks -name "create-ssr-safe-persisted-store.ts"   # ✓ existe → consumir
# Shell organism existente cross-brand (port source)
find ${WS}/vitalia/frontend/src/components/shared/shell-organism/ -type f   # 35+ componentes maduros
find ${WS}/vitalia/frontend/src/app/[tenantId]/'(shell-organism)'/ -type f  # routing + not-found jerárquico
find ${WS}/vitalia/frontend/src/{stores/shell-store.ts,lib/shell-routes.ts}  # store + routes
# Cross-brand mirror check: nicolify FE vacío de shell aún
find ${WS}/nicolify/frontend/src -path "*shell*"   # ∅ → NEW en nicolify (no mirror, es port)
```

### Sistemas existentes encontrados

| Sistema | Path | Estado | Decisión |
|---|---|---|---|
| Átomos Shadcn | `core/@luana/ui-kit` | active engine | **CONSUMIR** vía import (`@luana/ui-kit`). Cero recreación de primitivas. |
| SSR-safe store factory | `core/@luana/hooks/src/create-ssr-safe-persisted-store.ts` + `use-store-hydration` | active engine | **CONSUMIR** vía import. Cumple G2. |
| Z-index | `core/@luana/design-tokens` → `Z_INDEX` | active engine | **CONSUMIR**. (⚠️ NO exporta colores — color tokens brand-local en globals.css.) |
| format / api-client | `core/@luana/{format,api-client}` | active engine | disponibles R1+ (no usados en R0 skeleton). |
| Shell organism completo (35+ componentes) | `vitalia/frontend/src/components/shared/shell-organism/` | active brand (vitalia, shipped Fase 2) | **PORT verbatim re-tematizado** → `nicolify/.../shell-organism/`. NO mirror cross-brand (es port deliberado N=1→N=2 · lift a core diferido post-R0). |
| Routing route-group + not-found jerárquico | `vitalia/frontend/src/app/[tenantId]/(shell-organism)/` | active brand | **PORT re-tematizado** (5 agentes Revenue/Ops vs 5 salud). |
| shell-store + shell-routes | `vitalia/frontend/src/{stores,lib}/` | active brand | **PORT re-tematizado** (Valeria→Luana · agentes nicolify). |

### Decisión por sistema
- **@luana/* engine packages:** CONSUMIR vía import (NUNCA recrear primitivas/factory/z-index).
- **Shell organism vitalia:** PORT verbatim re-tematizado (decisión Chris ratificada · "copy-now, lift-later" N=2). **NO es un mirror prohibido** — es la 2da instancia que HABILITA el lift a `core/luana-core-ui` post-R0. El lift se NOTA como candidato (fe-architecture-review § 5), NO se propone ahora (diferido post-R0 por decisión Chris). **Cero `/pm-luana` lift en esta story.**
- **NEW justificado:** `_agent-tw-classes.ts` (G3 JIT-safe), `SubTabContent` dispatcher (basado en `AGENT_SUBTABS` nicolify, no en los 22-combo de vitalia), re-tematización tokens (paleta nicolify.com), avatares/logos nicolify.

> **Cross-brand mirror ban:** se RESPETA. Nicolify NUNCA importa de `vitalia/frontend/`. El port copia código a `nicolify/frontend/` re-tematizado (filesystem copy + theme), no `import from vitalia`. El lift compartido a core es el paso correcto post-R0 (N=2), explícitamente diferido por Chris.

## Integration design (CONN — anti-isla)

### Reachability path (cómo se LLEGA)
```
[T-0 dev-stack boot] make dev-nicolify → BE :8001/health 200 + FE :3001 + Clerk middleware
usuario NO autenticado en /{tenantId} → middleware redirige → /sign-in → login Clerk
usuario autenticado (Clerk) entra a /{tenantId}
  → (shell-organism)/page.tsx redirect → /{tenantId}/christian/pipeline (DEFAULT_LANDING)
  → (shell-organism)/layout.tsx monta ShellOrganismLayout (TopBar + LuanaSidebar + AppPanelSlot)
  → [agent]/[subtab]/page.tsx valida (christian, pipeline) vía shell-routes guards
  → SubTabContent dispatcher → EmptyState "Aún no hay deals en tu pipeline"
  → Ribbon (christian active, agent-color azul) + SubTabsBar (5 sub-tabs christian) visibles
  → click otra tab → navega → marca active (URL-derived) → empty-state de esa hoja
```

### Consumers (quién la USA)
- El shell ES el contenedor raíz post-login → su consumer es **el bootstrap de la app** (todo R1+ vive adentro). No es una isla: cada organismo se consume entre sí (TopBar→splitter ctrl→layout · Ribbon→routing · LuanaSidebar→store) Y el shell es el entry point de la app tenant.
- `shell-routes.ts` consumido por: Ribbon, SubTabsBar, page.tsx guards, layout redirects.
- `useShellStore` consumido por: ShellOrganismLayoutClient, LuanaSidebar, TopBarGlobal (splitter ctrl + mobile burger).

### Registration points (dónde se CABLEA — deliverables verificables)
- **Routing:** route-group `app/[tenantId]/(shell-organism)/` + redirects en page.tsx (root → DEFAULT_LANDING; [agent] → default subtab) — registrados como archivos del App Router (Next.js los descubre).
- **Nav:** Ribbon renderiza `AGENT_CATALOG` desde `shell-routes.ts` (SSoT). SubTabsBar renderiza `AGENT_SUBTABS[agent]`. Cero hardcode fuera de `shell-routes.ts`.
- **Store:** `useShellStore` cableado en `ShellOrganismLayoutClient` (dynamic ssr:false chunk) vía `useStoreHydration`.

### Home (cap)
- `cap_target: null` · `cap_change_type: new` · **shell = infra-container (zona Infraestructura · caja plataforma-tecnica)**. La cap se define al merge si `/pm-nicolify` crea `shell-organism.shell-nicolify` stub (NO bloquea R0). El "On-the-map" del shell es su caja del SYSTEM-MAP (plataforma-tecnica) — declarado en checkpoint.

> **CONN check:** Consumed ✓ (entry point + organismos entre sí) · On-the-map ✓ (caja plataforma-tecnica) · Navigable ✓ (bootstrap post-login → default landing) · Notarized ✓ (route-group registrado + Ribbon nav desde shell-routes SSoT). Cero isla.

## 16. Open Questions for PM

- **`react-resizable-panels` dep gap:** no está en `nicolify/frontend/package.json` → T-1 lo agrega (`^4.11.1`, igual que vitalia). Asumido OK (port directo). Si `/pm-nicolify` prefiere otra estrategia de splitter, flag antes de build.
- **IAM `fetchUserTenants` skeleton (D1):** dev-stack ahora es **T-0 interno** (absorbido 2026-05-30). Provee Clerk baseline + middleware pero NO IAM tenant-resolution completo. El layout usa el `tenantId` de URL directamente (skeleton) — la validación cross-tenant completa se difiere a una story IAM dedicada. Resuelto: no bloquea R0.
- **Avatares:** placeholders SVG (Sara `assets/agents/sara.svg` + resto de mockups). Chris entrega finales en semanas (reemplazo 1:1). E4 cubre fallback a inicial. OK para R0.
- **Sub-tabs provisionales:** el conjunto de sub-tabs por agente se replantea en story dedicada (ratif. Chris). `shell-routes.ts` es el único punto de cambio. R0 las usa para tener rutas + empty-states que recorrer.
