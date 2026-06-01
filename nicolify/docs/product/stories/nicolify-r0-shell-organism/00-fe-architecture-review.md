# FE Architecture Review — Nicolify shell (R0)

> Revisión `/pm-luana` 2026-05-29 (consulta cross-brand/core, ratificada Chris). Input para `ADR-nicolify-001` + el design-contract. Brand de referencia: Vitalia (worktree `~/Proyectos/luana-vitalia/`).

## 1. Consumir de `core/@luana/*` (NO recrear)

| Paquete | Qué exporta | Uso en Nicolify |
|---|---|---|
| `@luana/ui-kit` | ~40 primitivas Shadcn (Button, Card, Dialog, Table, Tabs, Sheet, Form, CurrencySelector, etc.) | **Base de átomos.** Importar, no recrear. |
| `@luana/format` | `formatMoney`, `currencies`, `formatDate`, `utils` (cn) | **Clave B2B multi-currency** (contratos en distintas monedas LatAm). |
| `@luana/hooks` | `useDebounce`, `useLocalStorage`, `useViewport`, `useIntersectionObserver`, `useIsMounted` | leaf hooks. |
| `@luana/design-tokens` | **solo `Z_INDEX`/`Z_INDEX_CLASSES`** | z-index. ⚠️ **NO tiene colores** — color tokens van brand-local en `globals.css`. |
| `@luana/extension-sdk` | types: `BrandContext`, `BrandSlug`, `SidebarRouteDef`, etc. | declarar el shell de Nicolify. |
| `@luana/api-client` | ~20 apis dominio (`leads`, `crm-dashboard`, `availability`, `connections`, `whatsapp`...) | reusar las relevantes a Revenue/Ops. |
| `@luana/schemas` | vacío (placeholder) | schemas Zod van brand-local en `features/{agent}/types/`. |

**Trampa confirmada:** los tokens de color de Vitalia viven en `vitalia/frontend/src/app/globals.css` (no en core). Nicolify replica la estructura (CSS vars `:root`+`.dark`, `--primary`, `--agent-{slug}`, etc.) con **su propia paleta B2B** (a definir en R0).

## 2. Patrón a adoptar → `ADR-nicolify-001` (hereda ADR-vitalia-004)

Las **9 secciones** del shell-feature pattern (SSoT vitalia: `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md`):

1. **Routing** — route group `(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx`, Server Component default, SSR initial state, datos sensibles nunca en URL. N3-static via SubSubTabsBar (NO Shadcn Tabs internas).
2. **FSD-Lite** — `features/{agent}/{components/{subtab},api,hooks,store,types}/`. Sin cross-feature imports (arch test). Shadcn solo en `components/ui/`.
3. **Client root** — `{Agent}{Subtab}View.tsx` `"use client"` línea 1 + props hidratación.
4. **Data layer split** — server→React Query · UI state→Zustand · URL→searchParams · forms→RHF. Nunca mezclar.
5. **Forms** — RHF + Zod (`{subtab}-schema.ts`), discriminated unions, autosave debounce 600ms.
6. **BE DDD Inside-Out** — domain→infra→app→api. **★ Nicolify: SIN `PhiRepositoryBase`/dual-filter clínica.** En su lugar: guardrails de autonomía (Brenda kill-switch audit, Christian outbound consent) + tenant-isolation raíz.
7. **Migrations** — raw SQL idempotent (`IF NOT EXISTS`), nunca `op.create_table()`/`sa.Enum(create_type=True)`.
8. **Telemetría** — tabla brand-local `nicolify_growth_studio_event` (con `account_id`, NO `clinic_id`). Nunca `copilot_trace_event` engine.
9. **Tests** — Vitest unit + Playwright funcional + visual goldens (mockup side-by-side 3×2) + axe + BE pytest dual-tenant + arch fitness.

**Gates de proceso heredados:**
- **Mockup-per-component** (ADR-vitalia-003): mockup HTML por componente ratificado por Chris ANTES de `refining→refined`. `/architect` REFUSE sin `ratified_visual_by_chris: true`.
- **SSR-safe persisted store** (ADR-vitalia-006): factory `createSsrSafePersistedStore` + `useStoreHydration` dentro del chunk `dynamic({ssr:false})`. NUNCA `persist` raw. Skeleton store-free.

## 3. Gotchas FE de Vitalia (9 learnings — aplicar preventivamente)

| Gotcha | Regla preventiva |
|---|---|
| Zustand `persist` en path SSR sobreescribe localStorage con default | factory SSR-safe + skeleton store-free (ADR-006) |
| Splitter `react-resizable-panels v4` no snap-up en hidratación | `useGroupRef()` + `setLayout()` imperativo en efecto de `containerWidth` |
| Tailwind JIT purga template literals en class strings | NUNCA template literals; static helpers que retornan class literals completas (`_agent-tw-classes.ts`) |
| Wrapper del shell reinventado simplificado = "regression flag" Chris | portar wrapper verbatim de Vitalia (dual-mode-shell.html + valeria-chat-sample.html + valeria-rail.html) + re-temizar |
| Mockup auto-aprueba goldens (compara consigo mismo) | mockup-per-component ratificado por Chris pre-architect (ADR-003) |
| E2E tab-order sobre shell `ssr:false` salta skip-link | anclar starting point a `<body tabindex="-1">` antes del primer Tab |
| Turbopack en Docker OOM con 3 browsers Playwright | E2E **native Linux** (host), nunca `make e2e*` Docker |
| E2E DEFERRED no-blocker dejó escapar bugs de integración | E2E DEFERRED = STOP en `developed`; verificación visual manual antes de auditor |
| Builder (sub-agente) pierde el design system | cablear `nicolify-design-system` skill en `must_load_skills` de tickets FE ✅ (skill creado) |

## 4. NO traer (Vitalia-específico)

- HIPAA/PHI: `PhiRepositoryBase`, `validate_dual_filter(tenant_id, clinic_id)`, `PiiMaskedSpan`, `RequireRole`, `AuditedSection`, `test_phi_dual_filter.py`.
- Componentes `Valeria*` (crear `Luana*` equivalentes con mockups propios).
- Catálogo/colores/assets de agentes Vitalia.
- Legacy `.vt-*` (Nicolify arranca limpio, sin deuda).

## 5. Lift candidates → core (decisión Chris: **copy-now, lift-later**)

Nicolify copia el patrón ahora (velocidad); se generaliza a core cuando haya 2 consumidores reales (N=2 → abstracción limpia). NO bloquear R0.

| Candidato | Destino | Estado |
|---|---|---|
| `createSsrSafePersistedStore` + `useStoreHydration` | `@luana/hooks` | post-R0 (ADR-006 lo menciona) |
| Organismos shell (`ShellLayout`/`TopBar`/`Ribbon`/`AgentSidebar`) | `core/luana-core-ui` | ADR-008 + proposal `2026-05-21-luana-core-ui-extraction.md` ya abiertos |
| Patrón ADR-vitalia-004 (como ADR platform) | `docs/architecture/luana-platform/` | promotable:yes; N=2 al cerrar R0 |
| ADR-003 mockup protocol + `_agent-tw-classes` pattern | rule raíz + `@luana/ui-kit` | post-R0 |

> Al cerrar R0, `/pm-luana` abre las promotion proposals correspondientes (N=2 cumplido).

## 6. Decisiones de diseño ratificadas (Chris 2026-05-29)

- Luana = **chat orquestador, fuera del Ribbon** (sidebar izq, 3 estados).
- Layout **dual-mode 50/50** con splitter 3 estados (chat-collapsed/narrow/50-50).
- **Reuse FE de Vitalia** re-temizado.
- **Sub-tabs ratificadas** → ver `navigation-tree.md`.
- Skill `nicolify-design-system` creado ✅.

## Referencias

- `navigation-tree.md` (este story) — nav-tree ratificado
- `.claude/skills/nicolify-design-system/SKILL.md` — design system cargable
- `vitalia/docs/architecture/{ADR-vitalia-003,004,006, SHELL-DESIGN-CONTRACT, design-system}.md` (worktree `~/Proyectos/luana-vitalia/`)
- `core/@luana/*` — engine FE compartido
- `docs/architecture/luana-platform/ADR-008-luana-core-ui-shadcn-cli-pattern.md`
