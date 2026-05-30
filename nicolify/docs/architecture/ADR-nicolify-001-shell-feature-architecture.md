# ADR-nicolify-001 — Shell-Feature Architecture (patrón por sub-tab)

- **Status:** accepted
- **Date:** 2026-05-29
- **Ratified by:** Chris
- **Brand:** nicolify
- **Hereda:** `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` (+ ADR-vitalia-003 mockup gate + ADR-vitalia-006 SSR-safe store)
- **Supersede:** —

## Contexto

Nicolify se reconstruye desde cero (rebuild agentic-first 2026-05-29) con el paradigma **shell-organism agéntico** (Luana orquestadora + Ribbon Abel/Brenda/Christian/Norvil + Config). Vitalia ya cementó y shippeó este patrón (1 story Fase 2 live). En vez de reinventar, Nicolify **adopta el patrón de Vitalia** (las 9 secciones de ADR-vitalia-004) **adaptado**: sin la maquinaria clínica (HIPAA/PHI) y con **guardrails de autonomía agéntica + tier gating** en su lugar.

## Decisión

Toda story Nicolify que construye una **sub-tab nueva** dentro del shell (`nicolify/frontend/src/app/[tenantId]/(shell-organism)/{agent}/{subtab}/page.tsx`) MUST seguir las **9 secciones** de este ADR. `/architect` cita este ADR en `03-arch.md § 0`; solo se diverge documentando rationale en `03-arch.md § Architecture Decisions`.

**Gate:** sin `architecture_pattern: ADR-nicolify-001` en el frontmatter de `01-spec.md` → `/architect` REFUSE arrancar.

## Las 9 secciones del patrón

1. **Routing** — route group `(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx`, static segment, Server Component default, SSR initial state vía `getInitialState({tenantId, searchParams})`, `params`/`searchParams` son `Promise<>` (Next.js 16). Datos sensibles nunca en URL. Agrupar 3+ vistas discretas → **N3-static (SubSubTabsBar)**, NUNCA Shadcn `Tabs` internas en la hoja.
2. **FSD-Lite** — `features/{agent}/{components/{subtab},api,hooks,store,types}/`. Sin cross-feature imports (arch test). Shadcn solo en `components/ui/` (o importado de `@luana/ui-kit`). Organismos del shell NUNCA en `features/`.
3. **Client root** — `{Agent}{Subtab}View.tsx` con `"use client"` línea 1 + props de hidratación; hidrata React Query cache en mount.
4. **Data layer split** — server data → React Query · UI state (modals/drawers/filtros) → Zustand · URL state → searchParams · forms → RHF. NUNCA Zustand para data fetched; NUNCA Redux/Context para fetch.
5. **Forms** — RHF + `zodResolver` (`types/{subtab}-schema.ts`), discriminated unions para sub-forms condicionales, autosave debounce 600ms cuando aplique, toasts vía `sonner`.
6. **Backend DDD Inside-Out** — domain → infrastructure → application → api. **★ Nicolify NO usa `PhiRepositoryBase`/dual-filter clínica.** En su lugar:
   - **Tenant isolation raíz** (`.where(Model.tenant_id == tenant_id)` en TODA query).
   - **Guardrails de autonomía agéntica** (`nicolify/.claude/rules/agent-revenue-engine.md`): toda acción autónoma (Brenda kill-switch, Christian outbound) registra **audit row** + reporta vía Luana; umbrales/consent desde config del tenant, NUNCA hardcodeados.
   - **Tier gating** server-side (`core/luana-core-billing/` BudgetGuard): el plan determina qué agentes invoca el tenant.
7. **Migrations** — raw SQL idempotent (`IF NOT EXISTS`); nunca `op.create_table()`, `op.add_column()`, `sa.Enum(create_type=True)`.
8. **Telemetría** — tabla brand-local `nicolify_growth_studio_event` (con `account_id`, NO `clinic_id`); montos bucketeados; emitter best-effort (no rompe respuesta primaria); FE `useTelemetry()`. Nunca `copilot_trace_event` engine.
9. **Tests** — Vitest unit co-located + Playwright funcional + **visual goldens** (mockup HTML side-by-side · 3 secciones × 2 themes) + axe a11y + BE pytest dual-tenant + arch fitness EXTEND.

## Gates heredados (sub-decisiones)

### G1 — Mockup-per-component (hereda ADR-vitalia-003)
Componente UI shell nuevo → mockup HTML por-componente ratificado por Chris ANTES de `refining→refined`. `checkpoint.md::ratified_visual_by_chris: true`. `/architect` REFUSE sin ese flag. Wrapper del shell se porta verbatim de Vitalia re-temizado (no reinventar simplificado).

### G2 — SSR-safe persisted store (hereda ADR-vitalia-006)
Todo store Zustand `persist` bajo Next.js 16 App Router → factory `createSsrSafePersistedStore` + `useStoreHydration` DENTRO del chunk `dynamic({ssr:false})`. Skeleton del boundary = 100% store-free. NUNCA `persist` raw (sobreescribe localStorage con el default en SSR/skeleton).

### G3 — Tailwind JIT-safe (hereda learning vitalia 2026-05-25)
NUNCA template literals en class strings de Tailwind (los purga el JIT). Usar static helpers (`_agent-tw-classes.ts`) que retornan class literals completas.

## Frontmatter requirements

- `01-spec.md` (`/po-ux`): `architecture_pattern: ADR-nicolify-001`. Sin él → Step 5 gate FAIL.
- `03-arch.md` (`/architect`): `architecture_pattern: ADR-nicolify-001` + `adr_001_compliance: full | partial-with-rationale`.
- `checkpoint.md` (`/pm-nicolify`): `architecture_pattern: ADR-nicolify-001` para stories sub-tab en `state ∈ {idea..reviewing}`.

## Consecuencias

- **+** Cero reinvención: 1 story Fase 2 de Vitalia ya validó el patrón. Nicolify es el 2do consumer (N=2) → habilita el lift de los organismos genéricos a `core/luana-core-ui` (ADR-008) post-R0.
- **+** Builder (sub-agente) recibe el patrón vía `must_load_skills: [nicolify-design-system]` en los tickets FE.
- **−** Acoplamiento al patrón de Vitalia: divergencias requieren rationale explícito.

## Enforcement

| Layer | Mecanismo |
|---|---|
| `/po-ux` Step 5 | Verifica `architecture_pattern: ADR-nicolify-001` en spec |
| `/architect` REFUSE | Verifica cita + valida 9 secciones en arch |
| `/auditor` | Score cobertura 9 secciones + gates G1-G3 |
| Arch fitness tests | tenant-isolation, response_model, no-cross-imports, growth_studio_event no-PII, react-query-keys |

## Referencias

- `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` — fuente del patrón
- `vitalia/docs/architecture/{ADR-vitalia-003,ADR-vitalia-006}.md` — gates heredados
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — atomic design
- `nicolify/.claude/rules/agent-revenue-engine.md` — guardrails autonomía + tier (reemplaza PHI)
- `.claude/skills/nicolify-design-system/SKILL.md` — índice cargable
- `docs/architecture/luana-platform/ADR-008-luana-core-ui-shadcn-cli-pattern.md` — destino del lift post-R0
