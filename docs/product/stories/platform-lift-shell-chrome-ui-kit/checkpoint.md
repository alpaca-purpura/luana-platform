---
story_id: platform-lift-shell-chrome-ui-kit
type: service-story                     # lift técnico FE (refactor move+parametrize, cero UI nueva user-facing — mockup gate ADR-vitalia-003 N/A)
title: Lift del chrome shell-organism a @luana/ui-kit (brand-agnostic) + convergencia nicolify
brand: platform                         # story platform-level — owner /pm-luana (cross core + vitalia + nicolify)

# Release entity
release: null                           # platform story bajo programa, sin release brand
program: design-system-homologation     # ADR-014
program_adr: docs/architecture/luana-platform/ADR-014-design-system-homologation.md

# Capability lineage
cap_target: null                        # chrome transversal map_zone infraestructura (precedente vitalia-shell-core-hardening: fix+null, gate HB-34 no exige YAML para fix)
cap_change_type: fix
parent_story: null
predecessor_story: vitalia-shell-core-hardening   # done 2026-06-11 — chrome hardened, handoff en proposal § Estado post

state: refined
phase: SPEC_RATIFIED            # ratificación = criterios verbatim Chris 2026-06-11 (autonomous_mode — sin loop)
ratified_by_chris: true
last_artifact: 01-spec.md
module: shell
cross_module_scope: [shell]             # core/@luana/ui-kit + vitalia FE shell + nicolify FE shell
agent_owner: null
map_zone: infraestructura
last_modified: 2026-06-11T00:00:00-05:00

# Promotion governance (este lift ES la ejecución de la proposal accepted)
promotion_proposal: docs/promotion-protocol/proposals/2026-06-01-lift-shell-organism-to-core.md
proposal_state: accepted                # ratified Chris 2026-06-06 · al merge → migrated
parent_proposal: docs/promotion-protocol/proposals/2026-05-21-luana-core-ui-extraction.md

# ── Autonomous mode (ratificado Chris 2026-06-11 verbatim) ──
autonomous_mode: true                   # "RATIFICO autonomous_mode: true verbatim para toda la cadena: refinar→arch→build→audit→merge; trabajá hasta el done sin pausas. Escalá SOLO breaking-change imposible de decidir solo — y aun así documentá+parqueá esa pieza y seguí con el resto."
autonomous_mode_chain: [po, architect, dev-team, auditor, pm-merge]
autonomous_mode_ratified_by: chris
autonomous_mode_ratified_at: 2026-06-11T00:00:00-05:00
autonomous_mode_caps:
  max_iterations_per_ticket: 10
  max_audit_iterations: 4
  max_wall_clock_minutes: 240
  on_cap_exceeded: "documentar + parquear pieza + HANDOFF-next-session.md + seguir con el resto"

parallel_safe: false                    # toca el chrome de 2 brands + kit

# Naturaleza de verificación (DoD #37 — preliminar, /architect cierra en 04-validators)
verification_nature: tecnica            # refactor sin cambio de conducta — el verde honesto = suite e2e existente contra el chrome consumido del kit
demo_required: false                    # autonomous (Chris descansando) — chris_verify.required: false per story-closure-gate (autonomous_mode)
chris_verify:
  required: false
  signoff: null
  rounds: []
reconciled: false

# ── DoD #37 live-verify (obligatorio per criterios Chris — autonomous NO lo relaja) ──
dod_live_verified: false                # → true al ejercer colapsar/reabrir/historial/drag live en vitalia :3002 contra chrome del kit
dod_env: null
dod_evidence: []

# ─────────────────────────────────────────────────────────────
# Prior-art scan (anti-duplication-refining)
# ─────────────────────────────────────────────────────────────
prior_art_scan:
  engine: "core/@luana/ui-kit v0.3.0 — N3 (EntityWorkspaceLayout/EntitySubNavBar) + layout-primitives + archetypes YA shipped. Chrome NO está en el kit (este lift lo agrega). @luana/hooks tiene create-ssr-safe-persisted-store (CONSUMIR para shell-store del kit, no recrear)."
  brands_live: "vitalia/.../shell-organism/ = chrome hardened (origen, máquina valeriaOpen closed|chat + historyOpen, strip 44px, push 280, e2e 68+7) · nicolify/.../shell-organism/ = mirror verbatim re-temizado con máquina LEGACY (valeriaState + LuanaRail) — diverge del hardened."
  learnings:
    - "memoria shell-core-hardening-done-lift-pending (resizable-panels v4 props-capture-on-mount · grid implícito · container queries · pnpm symlink-war · builders mueren ~140 tool-uses · allowlists mismo commit)"
    - vitalia/docs/learnings/2026-06-06-n3-entity-workspace-layout-from-nicolify.md
    - docs/learnings/2026-06-03-next16-softnav-redirect-rendered-more-hooks.md
  decision: "LIFT (mover chrome hardened de vitalia al kit, parametrizar brand-specific) + CONVERGER nicolify al modelo hardened consumiendo kit (mata mirror). N3 NO se rehace (ya en kit)."

next_action: >-
  /architect brand=platform → ready package (03-arch corte exacto file-by-file del chrome, API
  brand-agnostic props+CSS vars, SEMVER, sequencing kit→vitalia→nicolify, 04-validators con
  verification_nature + 06-tickets con assignment) → /dev-team → /auditor → /pm-luana merge +
  proposal → migrated.
---

# platform-lift-shell-chrome-ui-kit — checkpoint

## Goal

Liftar el **chrome del shell-organism** (máquina de estados `valeriaOpen: closed|chat` + `historyOpen` · strip 44px · push historial 280px · clamp/drawer/viewport-guard · store SSR-safe) desde `vitalia/frontend/src/components/shared/shell-organism/` a `core/@luana/ui-kit` como piezas **brand-agnostic** (tokens/avatares/labels/agent-catalog vía props + CSS vars — cero hardcode vitalia), hacer que **vitalia consuma el kit** (re-point imports + borrar lo local) y **converger nicolify** (su shell espejo con máquina legacy pasa a consumir el kit → mirror cross-brand MUERTO).

N3 (`EntityWorkspaceLayout`/`EntitySubNavBar`) **ya está en el kit v0.3.x — NO se rehace**.

## Criterios de éxito (Chris verbatim 2026-06-11 — el verde honesto)

- Vitalia: suite e2e `e2e/regression/shell-core-hardening/` 68/68 + `resizer-matrix.spec.ts` 7/7 contra el chrome CONSUMIDO del kit (stack dev :3002) + vitest/tsc/eslint/arch FULL verdes.
- Nicolify: tsc/vitest/arch verdes + su shell renderiza con el kit (e2e/live si su stack levanta).
- Kit: tests propios + bump versión (minor si additivo, major si breaking — documentar SEMVER en el proposal) + cero token vitalia hardcodeado (grep `#01B2F8|vitalia|valeria` en lógica del kit = 0; nombres de agente vía props).
- Arch: allowlists mirror ENCOGEN (shrink-only) — actualizadas en el MISMO commit que cada move.
- Live-verify #37 real en vitalia (≥colapsar/reabrir/historial/drag ejercidos + logs) — Playwright autenticado vale si Chrome MCP no está.
- Proposal actualizado a `migrated` + 07-merge + archive de la story.

## Aprendizajes obligatorios (sesión hardening — pre-cargados, NO redescubrir)

1. **react-resizable-panels v4** captura `collapsible/collapsedSize/minSize` EN MOUNT → el chrome del kit DEBE conservar key-remount + retry-rAF (comentarios ★ Live-fix 2026-06-11 en `ShellOrganismLayoutClient` — portar tal cual, NO simplificar). number=PX, string="%". `setLayout` clampea (no colapsa); collapse real = `panelRef.collapse()`.
2. **Grid:** grid-rows sin cols explícitas recorta contenido → conservar `grid-cols-[minmax(0,1fr)]` + `min-w-0` (ValeriaChat).
3. **Container queries** Tailwind v4 (`@container` + `@[24rem]`) para el pill del header — depende del panel, no del viewport.
4. **Builders mueren ~140 tool-uses:** todo prompt de builder lleva "COMMIT INCREMENTAL por pathspec apenas un bloque esté verde"; builder muerto → verificar tree+commits + agent nuevo (NO restart from scratch).
5. **pnpm symlink-war host↔container:** host-install para vitest/tsc, container-install para e2e; NUNCA alternar sin re-install; restart del container FE pierde node_modules raíz.
6. **Verificación visual REAL:** screenshots + overhang-check — números solos mienten.
7. Workspace: hub `~/Proyectos/luana-vitalia` (stack dev vivo). Commits por pathspec. M13 bloquea mix core+vitalia+nicolify → `SCOPE_GATE_SKIP=1` con razón en commit body (lift sancionado, proposal accepted).
8. Modelos: subagents HEREDAN el modelo de sesión (Fable 5) — sin model override en spawns.

## Anti-objetivos

- NO rehacer el N3 (ya en kit v0.3.x).
- NO "simplificar" la máquina del splitter al moverla (los fixes v4 props-capture son quirúrgicos).
- NO dejar tokens/labels vitalia en el kit (brand-agnostic estricto).
- NO tocar conducta del chrome (refactor puro — la suite e2e existente ES el contrato).
- NO importar cross-brand (vitalia↛nicolify): ambos importan del kit.

## Referencias

- `docs/promotion-protocol/proposals/2026-06-01-lift-shell-organism-to-core.md` (accepted · § Estado post hardening = handoff)
- `vitalia/docs/archive/2026/stories/vitalia-shell-core-hardening/{07-merge.md,checkpoint.md,T-5-result.md,03-arch.md § Decisión B}`
- `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md` + `ADR-vitalia-006` (store SSR-safe)
- `vitalia/docs/learnings/2026-06-06-n3-entity-workspace-layout-from-nicolify.md`
