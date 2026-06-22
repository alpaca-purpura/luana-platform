# Nicolify brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific nicolify (**Agent-as-a-Service** — equipo de agentes Revenue/Ops orquestados para agencias y servicios profesionales B2B LatAm).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `nicolify/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `nicolify/`.

| Rule | Descripción |
|---|---|
| `agent-revenue-engine.md` | Modelo de los 5 agentes (Luana orquesta, no ejecuta) + autonomía con guardrails (Brenda kill-switch CAC/ROAS, Christian outbound con consentimiento + rate limits, Norvil aprobación humana) + token economy (metering por agente/acción, alertas recarga, funciones críticas nunca se cortan, tier gating server-side) + CRM cuenta/stakeholder (multi tomador de decisión) + propuestas/contratos + scope descartado (billable-hours legacy) |
| `shell-feature-architecture.md` | Gate bloqueante: toda sub-tab del shell cita `architecture_pattern: ADR-nicolify-001` (9 secciones · hereda ADR-vitalia-004, sin PHI + guardrails agénticos) + gates G1 mockup-per-component, G2 SSR-safe store, G3 Tailwind JIT-safe. `/architect` REFUSE sin la cita. SSoT: `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md` |
| `shell-mockup-per-component.md` | **⚠️ SUPERSEDED 2026-06-22 por Storybook = SSoT visual** (`design-system-canon.md § 5` + `.claude/rules/frontend-visual-fidelity.md § Storybook`). El mockup-base `_shared.css` espejo es el "HTML que driftea" que Storybook mata; el diseño/ratificación parte de Storybook (`@luana/ui-kit`, componente REAL), net-new se promueve al kit + story. Protocolo histórico — no aplicar en stories nuevas. |

**Naming:** `{topic}.md` (ej. `agent-revenue-engine.md`).

> **Histórico:** `b2b-billable-hours.md` (pre-2026-05-29) framing project-billing fue **reemplazado** por `agent-revenue-engine.md` al resetear Nicolify a paradigma agentic-first. Ver § 7 de la nueva rule.
