---
story_id: nicolify-r0-shell-organism
brand: nicolify
type: design-story                  # categoría especial — NO produce código, produce SSoT funcional + plan
state: done                          # PLANNING-ONLY · planning completo + mockup ratificado 2026-05-29
release: R0
phase: PLANNING_COMPLETE             # contrato + ADR + nav-tree + mockup ratificado + backlog R0 generado
last_modified: 2026-05-29
ratified_by_chris: true
ratified_visual_by_chris: true       # gate ADR-003 · mockup shell.html ratificado
ratified_visual_at: 2026-05-29
archive_deferred: true               # NO archivar todavía: es el SSoT de diseño vivo que referencian las 7 stories R0 + el skill nicolify-design-system. Archivar al cerrar R0.
architecture_pattern: ADR-nicolify-001   # creado · hereda ADR-vitalia-004
shell_decisions:                    # ratificadas Chris 2026-05-29 (Q1-Q4 + FE arch)
  luana_placement: chat-orquestador-fuera-del-ribbon
  layout: dual-mode-50/50-splitter-3-estados   # reuse vitalia
  ribbon: [abel, brenda, christian, norvil, configurar]   # Luana NO es tab
  reuse_fe: vitalia-componentes-re-tematizados             # ADR-nicolify-001 hereda ADR-vitalia-003/004
  sub_tabs: RATIFICADO                                      # ver navigation-tree.md
  lift_strategy: copy-now-lift-later                        # core/luana-core-ui post-R0 (N=2)
  design_system_skill: nicolify-design-system              # creado 2026-05-29
deliverables_producidos:
  - navigation-tree.md                  # ✅ nav-tree 5 agentes + sub-tabs ratificado
  - 00-fe-architecture-review.md        # ✅ revisión FE /pm-luana (consumir @luana + ADR-nicolify-001 + gotchas + lifts)
  - mockups/shell.html                  # ✅ mockup ratificado Chris (paleta nicolify.com + League Spartan + splitter drag + avatares)
  - SHELL-DESIGN-CONTRACT.md            # ✅ nicolify/docs/architecture/ (atomic design SSoT)
  - ADR-nicolify-001                    # ✅ nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md (9 secciones · hereda ADR-vitalia-004)
  - SYSTEM-MAP.yaml                     # ✅ nicolify/docs/architecture/ (mapa funcional cockpit)
  - overlay rule shell-feature          # ✅ nicolify/.claude/rules/shell-feature-architecture.md (gate)
  - skill nicolify-design-system        # ✅ .claude/skills/nicolify-design-system/SKILL.md
  - backlog R0                          # ✅ 7 stories (dev-stack, design-system-tokens, topbar, shell-layout-splitter, luana-chat, ribbon-subtabs, routing-empty-states)
parallel_safe: true
priority: critical
estimated_dev_weeks: 0              # planning-only
cap_target: null                    # design-story planning-only · no produce cap directa
cap_change_type: new
parent_story: null
spawned_at: 2026-05-29T19:29:36-05:00
spawned_by: chris
ssot_owner: /pm-nicolify

deliverables_esperados:
  - design_contract: "nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md (a producir)"
  - navigation_tree: "nicolify/docs/product/stories/nicolify-r0-shell-organism/navigation-tree.md (a producir)"
  - mockup_html: "nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups/shell.html (a producir, reuse vitalia)"
  - baseline_decisions: "nicolify/docs/product/stories/nicolify-r0-shell-organism/00-session-baseline.md (a producir)"
  - adr_candidate: "ADR-nicolify-001-shell-feature-architecture (reuse ADR-vitalia-003/004)"
  - backlog_generado: "stories de R0 (shell esqueleto) + arranque R1"
---

# nicolify-r0-shell-organism — checkpoint

## Goal

Cementar el paradigma **shell-organism agéntico** para Nicolify: **Luana como chat orquestador persistente** (único rostro) + Ribbon de los agentes expertos (Abel · Brenda · Christian · Norvil) + Config, con panel de app por agente (sub-tabs + contenido). Producir el **contrato de diseño + nav-tree + mockup** (reusando el patrón maduro de Vitalia) y el **backlog de R0** (stories del shell esqueleto).

Es el equivalente Nicolify de `vitalia-shell-organism` (design-story planning-only).

## Prior art scan (anti-duplication-refining · 2026-05-29)

| Fuente | Path | Decisión |
|---|---|---|
| **Vitalia shell (pattern source)** | `vitalia/docs/archive/2026/stories/vitalia-shell-organism/` + 10 stories `vitalia-fase1-*` + `vitalia/frontend/src/components/` | **REUSE del patrón** (Ribbon + chat orquestador + sub-tabs + dual-mode). NO mirror — se adapta a los 5 agentes de Nicolify |
| **Vitalia ADRs** | `vitalia/docs/architecture/{ADR-vitalia-003,ADR-vitalia-004,SHELL-DESIGN-CONTRACT}.md` | REUSE como base de `ADR-nicolify-001` (mockup-per-component + shell-feature-architecture) |
| **Engine agéntico** | `core/luana-core-{copilot,sales-agent,channels}/` | CONSUMIR vía Extension SDK — Luana/Abel/Brenda/Christian/Norvil son brand-extensions, NO se recrean |
| **Comunify** | `comunify/docs/product/capabilities/` | sin shell — N/A |

**Conclusión:** net-new para Nicolify pero **fuertemente apalancado en Vitalia** (reuse arquitectura + componentes FE base). Cero mirror; la diferencia es el set de agentes (5 Revenue/Ops vs 6 clínicos) + el rol de Luana como orquestador.

## Decisiones a ratificar con Chris (refinement en curso)

Ver `chris-input.md` § 💬 Conversación — set de preguntas Q1-Q5 sobre layout, rol de Luana, ribbon, sub-tabs por agente, reuse FE.

## Next action

Chris responde las preguntas de diseño en `chris-input.md` → se cementan decisiones → se produce design-contract + nav-tree + mockup → handoff a `/architect` para ADR-nicolify-001 + ready package del shell esqueleto.
