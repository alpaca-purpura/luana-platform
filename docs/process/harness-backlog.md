# Harness Backlog (vivo)

> Issue-tracker liviano del harness. Captura sin fricción (`/harness-issue` o "anotá al harness backlog: X"). Estados: `reported → triaged → ratified → applied → verified`. Severidad: 🔴 silent-killer · 🟡 quick-win · 🔵 decision · 🟣 wave. Proceso: `docs/process/harness-lifecycle.md`. Detalle de items grandes vive en el catálogo (`docs/learnings/tooling/harness-audit-2026-06-01.md`) — acá solo el tracking.
>
> **Convención de estado:** `verified` = efecto confirmado (gate/live/re-read independiente). `applied` = commiteado pero el efecto no se ejerció aparte (típico de staleness de docs). `ratified` = Chris aprobó, falta aplicar.

| id | fecha | sev | item | estado | ref |
|---|---|---|---|---|---|
| HB-1 | 2026-06-01 | 🔴 | contract-guard.js muerto en worktrees (hardcode `/luana-platform/`) | **verified** | 17bf3c62 |
| HB-2 | 2026-06-01 | 🔴 | QW-1 comentario voseo-allowed línea-1 rompe registro skills (handoff/worktree-protocol/po) | **verified** | 17bf3c62 |
| HB-3 | 2026-06-01 | 🔴 | grep-bot self-id "Nicolify" | **verified** | 17bf3c62 |
| HB-4 | 2026-06-01 | 🟡 | voseo enforcement acotado a UI/agentic (descope harness) | **verified** | 17bf3c62 |
| HB-5 | 2026-06-01 | 🟡 | `make install-hooks` roto en worktrees → `git rev-parse --git-path hooks` | **verified** | 1a0dc598 (make -n) |
| HB-6 | 2026-06-01 | 🟣 | Wave 1 quick-wins (QW-3..QW-20: model IDs, containers visionarias_*, 04→06 tickets, WIP caps, overlay caps) | **verified** | 2388a13a (machinery-check) |
| HB-7 | 2026-06-01 | 🟣 | Wave 2 gates: #37 DoD + #33 CONN en templates + 5 globs de rules + tessl cleanup | **applied** | dc6a94fa · 32c01fcd · 46633718 · 3a9c53f2 — residual PII → HB-18 |
| HB-8 | 2026-06-01 | 🔵 | D-2 retirar git-manager · D-3 deprecar ux-disruptivo/ux-flow-architect/02-design-ui | **verified** | ab647839 (frontmatter línea-1 + bash -n) |
| HB-9 | 2026-06-01 | 🔵 | D-6 bump caps CLAUDE.md (270/165) · D-10 self-fix v4.2 canónico | **applied** | D-6 verified 2388a13a · D-10 propagación a verificar → HB-19 |
| HB-10 | 2026-06-01 | 🔵 | D-11 tessl: refs `tessl__*` → guía inline/`tessl-context` | **verified** | 3a9c53f2 (gates preservados) |
| HB-11 | 2026-06-01 | 🟡 | limpiar ~73 comentarios `voseo-allowed` heredados (ruido inofensivo) | reported | Wave 3 — opcional |
| HB-12 | 2026-06-01 | 🟣 | Wave 3 staleness masiva paths/vocab + `isolation: worktree` builders | **verified** | Wave3 96aa9559/ab647839 · isolation 2119d0c1 |
| HB-13 | 2026-06-01 | 🔵 | D-1: ¿`model:` campo válido de skills frontmatter? | **verified** | claude-code-guide vs docs oficiales → SÍ, turn-scoped (mantener) |
| HB-14 | 2026-06-01 | 🟣 | Wave 4: ADR-002/003/004/010/011 addenda + PARADIGM §7 DoD + D-4 banner + fix offer-preset test ref. (ADR-001/005/007/008/012/013 ya en Wave 3 → reconciliación ADR COMPLETA) | **applied** | cbc736ce (3 claims fácticas spot-checked; ADR-011 overestimate) |
| HB-15 | 2026-06-01 | 🔵 | D-5: crear scripts dev-app-up.sh + cloudflared-setup.sh + e2e-preflight.sh (referenciados, nunca existieron; `make dev-app-{brand}` roto) | **verified** | 22dacb4c (bash -n + shellcheck + e2e-preflight corrió verde live) |
| HB-16 | 2026-06-01 | 🟣 | Wave 5: agent runtime hints `isolation:worktree`(builders) + `background:true`(grep-bot) + `memory:user`(auditores/architect) + rule #37 honesty (tunnel credencial pendiente) | **applied** | 2119d0c1 — memory:user es enabler, activación → HB-17 |
| HB-17 | 2026-06-01 | 🟣 | **Wave 5b**: (a) `context:fork` análisis por-skill (handoff ya delega Haiku; ai-docs es interactivo) (b) migración `when_to_use` (pilotear architect/auditor/dev-team/playwright) (c) activar `memory:user` con body-instructions en auditores/architect | reported | catálogo § Roadmap W5 |
| HB-18 | 2026-06-01 | 🟡 | PII scanners (`scan_seed_pii.py`/`scan_goldens_pii.py`) + `pii-sanitisation.md` stub — pre-commit §8-9 degradan a WARNING (gate PII inerte) | reported | catálogo § Hooks HIGH (residual HB-7) |
| HB-19 | 2026-06-01 | 🔵 | Verificar D-10 self-fix v4.2 propagado en todos lados (auditor SKILL · ADR-007 · rules-detail/auditor-self-fix-policy) | reported | session-plan D-10 |
| HB-20 | 2026-06-01 | 🟡 | inconsistencia nombre workflow auditoría: comment del .js dice invocar `harness-audit`, `meta.name` dice `harness-audit-2026` | reported | `.claude/workflows/harness-audit.js` L2/L7 |
| HB-21 | 2026-06-01 | 🔵 | **operacional (Chris)**: provisionar credencial tunnel vitalia (`cloudflared-setup.sh vitalia`) + setear `DEV_APP_TEST_PASSWORD` en `vitalia/.env.dev`. Hoy live-verify vía localhost (fallback). Idem nicolify | reported | rule #37 (corregida cbc.../2119d0c1) |
| HB-22 | 2026-06-01 | 🟡 | cola MEDIUM/LOW del catálogo sin wave explícita (README cockpit staleness, settings.json StopFailure, pre-push dynamic brand discovery, bidirectional hook dedup, etc.) | reported | catálogo § (varias secciones MEDIUM/LOW) |

## Próxima acción

Waves 1–5 + D-1..D-11 + D-5 scripts + reconciliación ADR = **cerradas** (16 commits, 17bf3c62..2119d0c1). **Abierto** (drenar por cadencia HLP, no urgente): HB-17 (Wave 5b), HB-18 (PII), HB-19 (D-10 verify), HB-11 (voseo cleanup), HB-20 (workflow name), HB-22 (cola MEDIUM/LOW). **Operacional Chris:** HB-21 (provisión tunnel). Correr `/harness-audit-2026` fresco cuando "huela a drift" para realimentar esta tabla.
