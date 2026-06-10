---
story_id: core-ds-foundation
title: S-CORE-DS-FOUNDATION — Design system buildable (tokens + layout-primitives + enforcement mecánico) en @luana/{design-tokens,ui-kit}
brand: platform
type: ui-story            # build platform de componentes core (FE)
state: done              # ★ /pm-luana merge 2026-06-08 — 07-merge.md + semver minor bumps + archived
phase: MERGED
merged_at: 2026-06-08
semver_bumps: "@luana/design-tokens 0.2.0 · @luana/ui-kit 0.3.0 · @luana/hooks 0.4.0 · @luana/eslint-config 0.1.0 (net-new)"
main_integration: "deferred — staging deploy MANUAL; story closes done on wip/vitalia, squash to main = separate Chris-gated step"
audit_verdict: APPROVED
audit_finding_fixed: "no-div-layout ratchet RED → showcase dog-food refactor (commit 79925085) → 300/301 GREEN + live-verify re-confirmed (Carril R)"
audit_artifacts: [CHECKPOINTS.md]
harness_backlog: [HB-62 builder-frontend lockfile overflow, HB-63 docker host/container store skew, HB-64 hook cross-brand staging]

# ── DoD live-verify (Critical Rule #37) — /showcase exercised in a real browser ──
dod_live_verified: true
dod_env: "make dev-vitalia (Docker :3002) → http://localhost:3002/showcase · Playwright anti-burbuja smoke (e2e/fixtures/base.ts)"
dod_evidence:
  - action: "Navigate /showcase in real Chromium (Playwright smoke, project=smoke) — renders the REAL @luana/ui-kit components"
    observed: "3 passed (13.9s): Design System heading + 5 canon sections (atoms/layout/entity/autosave/archetypes by data-testid) + Átomos heading all visible"
    backend_log: "anti-burbuja gate (base.ts) asserted at teardown: 0 pageerror · 0 console.error · 0 response>=400 on /api · nextjs-portal overlay count 0 (no error bubble)"
verified_at: 2026-06-08
# Live-verify exposed (and this story fixed) 3 build-blocking defects beyond the 9 tickets — see § live_verify_fixes
live_verify_fixes:
  - "ENGINE DECOUPLE (notable): @luana/ui-kit was UNCONSUMABLE in vitalia — 4 atoms (dialog/sheet/alert-dialog/detail-panel) hard-imported @luana/hooks/use-copilot-offset → @/features/copilot/* (exists in NO brand; barrel-only export pulls them). Rewrote use-copilot-offset to read an optional `--copilot-offset` CSS var (default 0) — zero regression (no brand consumes the ui-kit barrel yet; adoption=Fase 3). This is the DS's foundational consumability, caught ONLY by live-verify (unit tests mocked it)."
  - "CSS compile break: a Tailwind v4 auto-scan picked up the literal `text-[hsl(var(--agent-*))]` from a comment in test_no_hardcoded_colors.test.ts (+ 2 fixture pages) → invalid arbitrary class `*` broke globals.css for EVERY route. Replaced `*` with a concrete token. Pre-existing latent, exposed by the T-1 globals.css recompile."
  - "Infra: @tanstack/react-virtual host/container pnpm-store version skew + docker anonymous-volume node_modules — reconciled to the committed lockfile version."
owner: /pm-luana          # /pm-luana abrió + consolidó; /architect produjo el ready package
autonomous_mode: true    # ★ RATIFICADO por Chris 2026-06-08 (vía AskUserQuestion) — corre a DONE sin pausas. Low-risk técnico/componentes (sin PHI/auth/migration/agentic/engine); resuelve mirror cross-brand (lift sancionado); única superficie funcional = /showcase live-verify (automatable).
open_questions_resolved:  # ★ Chris ratificó las 3 recomendaciones del architect (2026-06-08)
  Q1_entitypicker_windowing: "@tanstack/react-virtual (dep workspace existente; el react-virtuoso del canon §6.4 era ilustrativo)"
  Q2_eslint_config_package: "crear package net-new @luana/eslint-config (regla compartible cross-brand, NO regla local en vitalia)"
  Q3_r1src_aliasing: "aliasar --vitalia-* → tokens Shadcn (no-breaking, 85 consumers siguen renderizando); borrar/migrar = Fase 3"
created: 2026-06-07        # (origen core-ds-tokens-lock) · consolidada 2026-06-08
consolidated: 2026-06-08   # ★ Fase 0 + 1 + 2 fusionadas en ESTA story (Chris: "todo en uno, no agrandar")
supersedes: [core-ds-tokens-lock, core-ds-layout-primitives (nunca creada), core-ds-enforcement-bindings (nunca creada), core-ds-poux-kit (nunca creada)]

parent_adr: docs/architecture/luana-platform/ADR-014-design-system-homologation.md
parent_proposal: docs/promotion-protocol/proposals/2026-06-07-design-system-homologation.md
contract_ssot: docs/architecture/luana-platform/design-system-canon.md   # ★ los contratos + EJEMPLOS DE CÓDIGO que se construyen
track: A                  # independiente — NO gateado por las stories code abiertas (adrian-embudo/lisa-doctores/abel-icp)
modules: [core/@luana/design-tokens, core/@luana/ui-kit, eslint-config]

next_action: "AUTONOMOUS: auto-handoff /auditor (brand: platform) — 9 tickets pushed + /showcase live-verify GREEN + dod_evidence registrado. Auditor revisa @luana/{design-tokens,ui-kit,eslint-config,hooks} + vitalia pilot; verifica el ENGINE DECOUPLE (use-copilot-offset) + los 3 live_verify_fixes. APPROVED → /pm-luana merge (semver minor @luana/* + changelog)."

# ─────────────────────────────────────────────────────────────────────────────
# SCOPE — Fases 0+1+2 fusionadas (Fase 3 adopción por marca = stories aparte)
# ─────────────────────────────────────────────────────────────────────────────
scope:
  fase_0_tokens_lock:
    - "Consolidar escala de tokens en core/@luana/design-tokens (hoy solo exporta z-index): spacing(4px-base)+radius+font-size+color sobre nombres compartidos; cada marca importa, no redefine"
    - "Resolver R-1SRC: globals.css de vitalia tiene duplicación (--radius 0.625 vs 0.5 legacy + sistema --vitalia-* paralelo al Shadcn) → UN solo sistema"
    - "eslint no-arbitrary-value sobre ejes tokenizados (spacing+radius+font-size+color-hex) + allowlist ratchet shrink-only (w/h/min/max sizing)"
  fase_1_layout_primitives:
    - "Construir las ~10 page-primitives + page archetypes en @luana/ui-kit (ver § build_inventory)"
    - "Generalizar EntityWorkspaceLayout + EntitySubNavBar (de nicolify/vitalia) a @luana/ui-kit re-temizado cross-brand"
    - "EntityInfoCard (Opción B) + Skeleton + Empty · EntityPicker (buscar server-side + paginado + windowed)"
    - "/showcase route en la app real (R-FID durable; renderiza componentes REALES — reemplaza el showcase.html estático)"
  fase_2_enforcement:
    - "Arch-test FE: prohíbe <div> de layout donde hay primitive + hex/px hardcoded + <select> nativo (ratchet shrink-only)"
    - "frontend-visual-fidelity D1 = mecánico (lint/arch-test, no criterio)"
    - "[YA HECHO 2026-06-08 — NO rehacer] bindings de proceso en skills/rule (ver § already_done)"

out_of_scope:
  - "Fase 3 — adopción COMPREHENSIVA por marca (migrar las pantallas existentes a las primitivas + encender el lock): stories {brand}-ds-adoption (vitalia→nicolify→comunify), owner cada /pm-{brand}"
  - "Las stories code abiertas (adrian-embudo/lisa-doctores/abel-icp) — Chris las retoma/actualiza aparte"
  - "Shell-organism (chrome) — lift ya accepted aparte (2026-06-01-lift-shell-organism, 256517a3)"

# ─────────────────────────────────────────────────────────────────────────────
# ★ YA EXISTE — NO REHACER (Chris: "no quiero volver a armar lo que ya armamos")
# ─────────────────────────────────────────────────────────────────────────────
already_done:
  bindings_proceso_2026_06_08:   # hechos esta sesión — la story NO los re-arma, los da por puestos
    - "design-system-canon.md (contratos + ejemplos de código) — el contrato que esta story implementa"
    - ".claude/rules/frontend-visual-fidelity.md § Design System Canon (binding HARD, auto-cargada por builder/auditor-frontend)"
    - ".claude/skills/{po-ux,dev-team,architect}/SKILL.md — gates del canon"
    - "docs/process/harness-backlog.md HB-60 (drift check CIL)"
  atomos_en_ui_kit:   # @luana/ui-kit YA tiene — CONSUMIR, no recrear
    - "button input textarea badge avatar label checkbox switch radio-group card popover alert-dialog dialog sheet dropdown-menu accordion collapsible tabs table calendar command progress slider scroll-area separator skeleton sonner form"
    - "select.tsx → YA es Shadcn canónico (SelectTrigger/ChevronDown/check) — el 'Select canónico' del canon §2.5 = ESTE, solo verificar paridad, NO construir nuevo"
    - "tooltip.tsx → YA tiene Provider/Arrow (canon §2.8) — usar, no recrear"
    - "AutosaveBadge.tsx (+ examples/AutosaveShowcase + test) · detail-panel.tsx (≈ base DetailLayout) · inline-editable · loading-button · rich-select · field-info · skeleton"
  componentes_a_liftar:   # existen per-brand → GENERALIZAR a ui-kit, NO from scratch
    - "EntityWorkspaceLayout + EntitySubNavBar → base nicolify (nicolify/frontend/src/components/shared/shell-organism/) — generalizar re-temizado"
    - "use-autosave hook (600ms+coalesce) + FloatingAutosaveIndicator → base vitalia (vitalia/frontend/src/hooks/use-autosave.ts + components/shared/FloatingAutosaveIndicator.tsx)"
    - "EntityInfoCard → base vitalia StaffCard + ícono agent-color nicolify IcpCard"
    - "Group/GroupHeader → base nicolify IcpDatosForm"

# ─────────────────────────────────────────────────────────────────────────────
# ★ CONSTRUIR (net-new + lifts) — el trabajo real de la story
# ─────────────────────────────────────────────────────────────────────────────
build_inventory:
  tokens: "escala completa en @luana/design-tokens (spacing/radius/font-size/color sobre nombres compartidos) + resolver R-1SRC duplicación"
  layout_primitives: "PageContainer · PageHeader · PageSection · PageContentStack · Toolbar · FilterBar · EmptyState · ErrorState · ListPageSkeleton · FormPageSkeleton · Pagination · DetailLayout · FormLayout"
  entity_components: "EntityWorkspaceLayout(lift) · EntitySubNavBar(lift, franja=tercer-ribbon full-bleed) · EntityInfoCard B + Skeleton + Empty(lift StaffCard) · EntityPicker(net-new: search server-side+paginado+windowed+lazy)"
  autosave: "lift use-autosave 600ms+coalesce + FloatingAutosaveIndicator (AutosaveBadge ya está)"
  archetypes: "scaffolds list / detail / form / dashboard (rellenar slots, no maquetar)"
  showcase_route: "/showcase en la app real renderizando los componentes REALES (R-FID)"
  enforcement: "eslint no-arbitrary-value + arch-test FE no-div-layout/no-native-select/no-hardcoded-hex (ratchet shrink-only)"

# ─────────────────────────────────────────────────────────────────────────────
# Grounding (medido 2026-06-07 — vitalia/frontend/src)
# ─────────────────────────────────────────────────────────────────────────────
grounding:
  arbitrary_total: 650
  by_axis: { text_fontsize: 182, sizing_w_h_minmax: 189, color_hex: 64, radius: 32, spacing_p_m_gap: ~10 }
  finding: "Spacing ya casi limpio (~10). El drift real = font-size+color+radius (278). El lock Fase 0 apunta ahí."

# Decisiones RATIFICADAS por Chris
ratified_decisions:
  # Fase 0 (2026-06-07 vía AskUserQuestion)
  D1-spacing-scale: "Tailwind default 4px-base as-is. Migración spacing ~0."
  D2-lock-scope: "eslint no-arbitrary prohíbe spacing+radius+font-size+color-hex. ALLOWLIST w/h/min/max sizing. Ratchet shrink-only."
  D3-pilot: "vitalia primero."
  # Showcase canon (2026-06-08, 8 rondas /po-ux — ver design-system-canon.md + vitalia-ds-showcase)
  D4-n3-pattern: "List/detail = EntityWorkspaceLayout 1-panel (master grilla EntityInfoCard ↔ detalle workspace). NO 2-col persistente."
  D5-n3-strip: "EntitySubNavBar = tercer ribbon full-bleed (sticky, bg-card, NO card redondeada). Root-pill '‹ {RootLabel}' vuelve."
  D6-entity-picker: "Identidad = selector ▾ con buscar + paginado + windowed + lazy (cambiar sin volver). NO cargar todo al cliente."
  D7-leaf-container: "Hoja 100% ancho full-responsive · franjas full-bleed · contenido PageContainer + PageContentStack."
  D8-entity-card: "EntityInfoCard Opción B (auto-fill minmax(250px), circular, clickeable, kebab ⋮)."
  D9-autosave: "1 FloatingAutosaveIndicator por página + barrita de agente (sin badge por-grupo)."
  D10-select: "Select canónico Shadcn (= @luana/ui-kit/select.tsx existente)."
  D11-durable: "Showcase durable = /showcase route en la app real."
lock_axes_locked: [spacing, radius, font-size, color-hex]
lock_axes_allowlisted: [width, height, min-width, max-width, min-height, max-height]

chris_verify:
  required: false   # build de componentes core + lint/arch-test (sin UI funcional de marca user-reachable directa). El /showcase route SÍ se live-verifica al construirlo.
  signoff: null
reconciled: false
---

# core-ds-foundation — log

## 2026-06-07 · apertura como core-ds-tokens-lock (/pm-luana)
Story Track A (Fase 0). Grounding medido. Decisiones D1-D3 ratificadas Chris.

## 2026-06-08 · CONSOLIDACIÓN Fase 0+1+2 en una sola (/pm-luana, ratificado Chris)
Chris: *"todos los code (fase 0,1,2) júntalos en uno solo, no agrandar; pon todo lo aprendido; cuando
la armes pon lo que es necesario, no quiero volver a armar lo que ya armamos."*

Renombrada `core-ds-tokens-lock → core-ds-foundation`. Scope = tokens(lock) + layout-primitives +
enforcement, en una story. El **contrato + ejemplos de código** viven en `design-system-canon.md`
(ratificado vía showcase, 8 rondas /po-ux). Fase 3 (adopción por marca) queda aparte.

**Clave "no rehacer":** `@luana/ui-kit` YA tiene 40+ átomos incluido `select.tsx` (Shadcn canónico),
`tooltip.tsx` (Provider/Arrow), `AutosaveBadge`, `detail-panel`, `skeleton` → CONSUMIR. Los bindings de
proceso (canon doc + rule + skills + HB-60) YA están hechos (sesión 2026-06-08) → la story NO los re-arma.
Lo que se construye = § build_inventory (layout-primitives + Entity* + EntityPicker + archetypes +
/showcase + lint/arch-test); EntityWorkspaceLayout/EntitySubNavBar/use-autosave/FloatingAutosaveIndicator/
EntityInfoCard/Group = **lifts** (generalizar lo existente), no from-scratch.

**Próximo (conversación nueva):** `/architect brand: platform core-ds-foundation` → ready package
consumiendo el canon. NOTA: `01-spec.md` en esta carpeta es el spec viejo Fase-0 (tokens-lock) — sirve
de insumo del eje tokens; el architect lo expande o el /po lo rehace al scope consolidado.
