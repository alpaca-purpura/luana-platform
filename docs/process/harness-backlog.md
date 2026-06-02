# Harness Backlog (vivo)

> Issue-tracker liviano del harness. Captura sin fricción (`/harness-issue` o "anotá al harness backlog: X"). Estados: `reported → triaged → ratified → applied → verified`. Severidad: 🔴 silent-killer · 🟡 quick-win · 🔵 decision · 🟣 wave. Proceso: `docs/process/harness-lifecycle.md`. Detalle de items grandes vive en el catálogo (`docs/learnings/tooling/harness-audit-2026-06-01.md`) — acá solo el tracking.

| id | fecha | sev | item | estado | ref |
|---|---|---|---|---|---|
| HB-1 | 2026-06-01 | 🔴 | contract-guard.js muerto en worktrees (hardcode `/luana-platform/`) | **verified** | commit 17bf3c62 |
| HB-2 | 2026-06-01 | 🔴 | QW-1 comentario voseo-allowed línea-1 rompe registro skills (handoff/worktree-protocol/po) | **verified** | commit 17bf3c62 |
| HB-3 | 2026-06-01 | 🔴 | grep-bot self-id "Nicolify" | **verified** | commit 17bf3c62 |
| HB-4 | 2026-06-01 | 🟡 | voseo enforcement acotado a UI/agentic (descope harness) | **verified** | commit 17bf3c62 |
| HB-5 | 2026-06-01 | 🟡 | `make install-hooks` roto en worktrees (`mkdir .git/hooks`) → usar `git rev-parse --git-path hooks` | ratified | session-plan |
| HB-6 | 2026-06-01 | 🟣 | Wave 1 quick-wins restantes (QW-3..QW-20: model IDs, containers visionarias_*, 04→06 tickets, WIP caps, etc.) | ratified | catálogo § Quick wins |
| HB-7 | 2026-06-01 | 🟣 | Wave 2 gates rotos (#37/#33 en templates, globs de rules, PII scanners) | ratified | catálogo § Roadmap W2 |
| HB-8 | 2026-06-01 | 🔵 | D-2 retirar git-manager · D-3 deprecar ux-disruptivo/ux-flow-architect/02-design-ui | ratified | session-plan D-table |
| HB-9 | 2026-06-01 | 🔵 | D-6 bump caps CLAUDE.md (270/165) · D-10 self-fix v4.2 canónico | ratified | session-plan D-table |
| HB-10 | 2026-06-01 | 🔵 | D-11 tessl: reemplazar `tessl__*` refs por guía inline/`tessl-context` (o instalar plugin Tessl) | ratified | session-plan D-table |
| HB-11 | 2026-06-01 | 🟡 | limpiar ~73 comentarios `voseo-allowed` heredados (ruido inofensivo) | reported | Wave 3 |
| HB-12 | 2026-06-01 | 🟣 | Wave 3 staleness masiva paths/vocab + `isolation: worktree` builders | reported | catálogo § Roadmap W3 |
| HB-13 | 2026-06-01 | 🔵 | D-1 verificar si `model:` es campo válido de skills frontmatter (afecta ~15 skills) | reported | Wave 2 |

## Próxima acción

Wave 1+2 se aplican en **sesión fresca** vía workflow `apply-wave-1` (ver prompt de handoff en `harness-modernization-session-plan.md` / chat de cierre 2026-06-01).
