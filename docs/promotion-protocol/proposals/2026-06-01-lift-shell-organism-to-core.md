---
proposal_id: 2026-06-01-lift-shell-organism-to-core
state: accepted                # proposed | under_review | accepted | rejected | migrated
opened_date: 2026-06-01
opened_by: /pm-luana
ratified_by: Chris             # dirección 2026-06-01 + APPROVED formal del lift 2026-06-06 (target reconciliado → @luana/ui-kit). Ejecución gated tras 4 stories abiertas
ratified_date: 2026-06-06

# Origen — mirror cross-brand CONCRETO (ya no preventive)
origin_learnings:
  - vitalia/docs/learnings/2026-05-22-shell-mockup-per-component-protocol.md
origin_brands: [vitalia, nicolify]   # vitalia construyó el shell-organism; nicolify lo portó verbatim re-temizado

# Target
target_package: core/@luana/ui-kit          # reconciliado 2026-06-06: luana-core-ui NO existe; el package UI real es @luana/ui-kit (sin organism layer aún). umbrella: 2026-05-21-luana-core-ui-extraction
target_module: src/components/organism/shell/   # ShellOrganismLayout + Ribbon + SubTabsBar + SubSubTabsBar + ValeriaSidebar/Rail + AppPanelSlot + shell-routes helpers
target_ep: null              # TS UI (copy-paste shadcn-style), no Python EP

# Impact assessment
semver_bump: minor           # nuevo organism layer dentro de core-ui (0.x)
breaking_change: false       # brands opt-in / retrofit
brands_affected_consumers: [vitalia, nicolify, comunify, lupulo]
brands_at_risk_regression: [vitalia, nicolify]   # ambos tienen el shell shipped → arch test downstream obligatorio

# Lift plan
lift_estimated_effort: "1-2 semanas (organism layer grande: layout + ribbon + subtabs + sidebar + routing helpers + re-theming hooks)"
lift_owner: /dev-team
arch_test_downstream_required: true   # R3 — correr e2e/vitest de vitalia + nicolify post-lift
migration_notes_required: true        # ambos brands deben re-wire a core (no es package nuevo vacío)

# Parent / relacionados
parent_proposal: 2026-05-21-luana-core-ui-extraction   # umbrella UI; organism/shell estaba DEFERRED "pending Chris agentic idea"
unblocked_by: docs/architecture/luana-platform/PARADIGM.md   # 2026-05-30 cementó el modelo agéntico (la "idea pending" del parent)
related_adr: docs/architecture/luana-platform/ADR-008-luana-core-ui-shadcn-cli-pattern.md
---

## /pm-luana review (under_review · 2026-06-06)

**Recomendación: ACCEPT** — mirror cross-brand CONCRETO confirmado (vitalia + nicolify ambos shippearon el shell; nicolify es copia independiente verbatim re-temizada). Dirección ya ratificada por Chris 2026-06-01. Caso canónico de `anti-duplication.md`.

⚠️ **Corrección de target (verify 2026-06-06):** `core/luana-core-ui` **NO existe**. El package UI real es **`core/@luana/ui-kit`** (TS namespace) y aún SIN capa `organism/`. El lift debe apuntar a `core/@luana/ui-kit/src/components/organism/shell/`, no a `luana-core-ui`. Mismo drift en el parent (ui-extraction).

**Secuencia:** depende del parent `2026-05-21-luana-core-ui-extraction` (umbrella). Ratificar ambos juntos; el shell se ejecuta DESPUÉS de que el umbrella consolide el organism layer en `@luana/ui-kit`.

**Para ratificar (Chris):** APPROVED formal del lift execution (1-2 sem `/dev-team`, arch-test downstream vitalia+nicolify obligatorio, migration notes). Al APPROVED → `accepted` + outcome platform + stories consumer.

---

## 1. Patrón a promover

El **shell-organism agéntico** (TopBar + Ribbon de agentes + SubTabsBar/SubSubTabsBar N3 + ValeriaSidebar/Rail + AppPanelSlot + splitter resizable + helpers de routing `shell-routes.ts`, `extractAgentFromPath`, `extractSubtabFromPath`, `SubTabMeta`, `AGENT_CATALOG`/`AGENT_RIBBON_ORDER`). Es el wrapper de navegación que encarna el Paradigma de 3 zonas (Agentes/Plataforma/Infra) — `PARADIGM.md`.

El parent `2026-05-21-luana-core-ui-extraction` dejó el **organism layer DEFERRED** ("PATTERN PENDING REVIEW con Chris antes de cementar shell/navigation"). Esa idea **ya está cementada** en `PARADIGM.md` (2026-05-30). Y el mirror que en 2026-05-21 "no existía todavía" **ya es concreto**: vitalia construyó el shell completo y **nicolify lo portó verbatim re-temizado** (design intent del rebuild nicolify — skill `nicolify-design-system`).

## 2. Por qué cross-brand (mirror CONCRETO, evidencia 2026-06-01)

| Brand | Estado | Evidencia |
|---|---|---|
| vitalia | ✅ shipped (origen) | `vitalia/frontend/src/components/shared/shell-organism/` + `lib/shell-routes.ts` + `lib/agent-catalog.ts` |
| nicolify | ✅ shipped (port verbatim re-temizado) | `nicolify/frontend/src/components/shared/shell-organism/` + `lib/routing/shell-routes.ts` — ShellOrganismLayout ×7, SubTabsBar ×10, SubTab ×14, Ribbon ×18, useShellStore ×12, AGENT_CATALOG ×13 (NO importa de vitalia — copia independiente) |
| comunify | candidato | shell pendiente; heredaría de core |
| lupulo | candidato | idem |

Es **exactamente** el caso de `.claude/rules/anti-duplication.md`: "dos brands replican mismo patrón → lift a core". El propio arch-test de vitalia (`test-no-cross-brand-shell-mirror.test.ts` línea 111-112) ya lo anticipa: *"if a second brand adopts a similar pattern, escalate to /pm-luana for promotion to core/@luana/... (LIFT CANDIDATE documented)."*

## 3. Tensión que resuelve (gate roto hoy)

`vitalia/frontend/src/__tests__/architecture/test-no-cross-brand-shell-mirror.test.ts` es **zero-tolerance por NOMBRE**: falla si cualquier símbolo del shell vitalia aparece en otra brand. Con el port deliberado de nicolify, falla (~23 vitest fails, **pre-existente en origin/main**). La premisa del test ("ninguna otra brand tendrá shell") quedó obsoleta cuando el rebuild nicolify adoptó el shell por diseño.

**Generalización a producir en el lift:** parametrizar lo brand-specific (agent catalog, tokens/colores, voz Valeria→supervisor-name, copy) de modo que el wrapper viva en core y cada brand inyecte su catálogo + theme. El `AGENT_CATALOG` y los nombres `Valeria*` se vuelven props/config, no hardcode.

## 4. Acción inmediata ratificada por Chris (2026-06-01)

Dirección ratificada: **lift a core + ajustar el arch-test** (NO renombrar en nicolify — sería cosmético y ocultaría el mirror real).

- **Interim (vitalia FE, vía builder):** ajustar `test-no-cross-brand-shell-mirror.test.ts` para que (a) siga detectando IMPORTS cross-brand reales (la pollution de verdad — vitalia↔nicolify NO se importan, confirmado), y (b) trate el set de símbolos del shell-organism como **mirror sancionado conocido** (ratchet allowlist) que apunta a esta proposal, fallando solo ante mirrors NUEVOS no sancionados. Esto desbloquea los ~23 vitest honestamente sin perder la protección anti-mirror para casos nuevos.
- **Lift completo (esta proposal, post APPROVED formal):** `/dev-team` extrae el organism a `core/luana-core-ui` + re-wire vitalia + nicolify + arch-test downstream + migration notes.

## 5. Estado / próximos pasos

- `state: proposed`. Chris ratificó la DIRECCIÓN; falta APPROVED formal del lift execution (es esfuerzo 1-2 semanas → planificar como story/outcome platform, no inline).
- Interim test-adjust: handoff `/pm-vitalia` → builder-frontend (tracked en checkpoint de la sesión 2026-06-01).
- Al APPROVED → mover a `accepted` + abrir outcome platform + stories consumer vitalia/nicolify.

## Referencias

- `.claude/rules/anti-duplication.md` — "dos brands replican → lift a core"
- `docs/promotion-protocol/proposals/2026-05-21-luana-core-ui-extraction.md` — umbrella (organism estaba DEFERRED)
- `docs/architecture/luana-platform/PARADIGM.md` — modelo agéntico cementado (la idea pending del parent)
- `vitalia/frontend/src/__tests__/architecture/test-no-cross-brand-shell-mirror.test.ts` — gate roto
- `.claude/skills/nicolify-design-system/SKILL.md` — "portar verbatim de Vitalia re-temizado" (design intent del mirror)
