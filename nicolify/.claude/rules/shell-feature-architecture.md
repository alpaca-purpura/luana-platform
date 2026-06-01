# Nicolify — Shell-Feature Architecture Mandatory

**Overlay:** extiende `.claude/rules/` raíz (refuerza `backend-ddd.md` + `frontend-fsd.md` + `tdd-mandatory.md`).
**Brand:** nicolify · **Cement-date:** 2026-05-29 · **SSoT:** `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md`.

## Regla cardinal

Toda story Nicolify que construye una **sub-tab nueva** dentro del shell-organism (`nicolify/frontend/src/app/[tenantId]/(shell-organism)/{agent}/{subtab}/page.tsx`) MUST seguir las **9 secciones** de `ADR-nicolify-001` (hereda ADR-vitalia-004, adaptado: sin PHI, con guardrails agénticos + tier gating).

Sin `architecture_pattern: ADR-nicolify-001` en el frontmatter de `01-spec.md` → `/architect` REFUSE arrancar.

## Scope

**Aplica** (gate bloqueante): toda story Fase R0+ con UI sub-tab (`abel-*`, `brenda-*`, `christian-*`, `norvil-*`, `config-*`, los `nicolify-r0-*` del shell).
**NO aplica:** service-only (`nicolify-r0-dev-stack`), agentic-conversacional pura (flujo Luana → `/ux-agentico`), la propia design-story `nicolify-r0-shell-organism` (es el origen del patrón).

## Gates (de ADR-nicolify-001)

- **G0 — 9 secciones**: routing route-group · FSD-Lite · client root · React Query+Zustand · RHF+Zod · DDD Inside-Out (SIN PhiRepositoryBase · CON guardrails `agent-revenue-engine.md` + tier gating) · migrations idempotent · telemetría `nicolify_growth_studio_event` · tests 4 capas.
- **G1 — Mockup-per-component** (ADR-vitalia-003): componente shell nuevo → mockup HTML ratificado por Chris (`ratified_visual_by_chris: true`) ANTES de `refining→refined`. Wrapper portado verbatim de Vitalia re-temizado.
- **G2 — SSR-safe store** (ADR-vitalia-006): `persist` → factory `createSsrSafePersistedStore` + `useStoreHydration` en chunk `dynamic({ssr:false})`. Skeleton store-free.
- **G3 — Tailwind JIT-safe**: NUNCA template literals en class strings (usar `_agent-tw-classes.ts`).

## Frontmatter requirements

- `01-spec.md`: `architecture_pattern: ADR-nicolify-001` (sin él → `/po-ux` Step 5 FAIL).
- `03-arch.md`: `architecture_pattern: ADR-nicolify-001` + `adr_001_compliance: full | partial-with-rationale`.
- `checkpoint.md`: `architecture_pattern: ADR-nicolify-001` (stories sub-tab `state ∈ {idea..reviewing}`).

## Anti-patterns

- `/architect` arranca sin verificar la cita del ADR.
- Shadcn `Tabs` internas para agrupar 3+ vistas de una hoja → usar N3-static (SubSubTabsBar).
- Reinventar el wrapper del shell simplificado en vez de portarlo verbatim de Vitalia.
- `persist` raw (sin factory SSR-safe).
- Repo con dual-filter clínico / `PhiRepositoryBase` (eso es Vitalia · Nicolify usa tenant-isolation raíz + guardrails agénticos).
- Telemetría en `copilot_trace_event` engine en vez de `nicolify_growth_studio_event`.

## Enforcement

| Layer | Mecanismo |
|---|---|
| `/po-ux` Step 5 | verifica `architecture_pattern` en spec |
| `/architect` REFUSE | verifica cita + valida 9 secciones |
| `/auditor` | score 9 secciones + G1-G3 |
| arch fitness | tenant-isolation, response_model, no-cross-imports, growth_studio_event no-PII |

## Referencias

- `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md`
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- `nicolify/.claude/rules/agent-revenue-engine.md` — guardrails (reemplaza PHI)
- `.claude/skills/nicolify-design-system/SKILL.md`
- `vitalia/.claude/rules/{shell-feature-architecture-mandatory,shell-mockup-per-component}.md` — fuente del patrón
