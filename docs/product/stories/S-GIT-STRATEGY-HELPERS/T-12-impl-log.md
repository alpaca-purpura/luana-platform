# T-12 impl log — ADR-004 git-branching-and-environments

Story: S-GIT-STRATEGY-HELPERS
Ticket: T-12 — ADR-004: git-branching-and-environments (triple-branch + reversion ban worktrees)
Owner: claude-sonnet-4-6
Started: 2026-05-15
State: done

## Archivo creado

- NEW docs/architecture/luana-platform/ADR-004-git-branching-and-environments.md

## Estructura implementada (formato canonico Luana, igual ADR-001)

1. Context — politica legacy + cambios de contexto que la invalidan + problema concreto sesiones paralelas
2. Decision — triple-branch policy (tabla) + worktrees per sesion + WIP safety net
3. Justificacion tecnica reversion ban — tabla: problema previo vs solucion actual
4. Alternativas descartadas — A(single branch) / B(feature branches sin worktrees) / C(multi-repo) / D(stash)
5. Consecuencias — positivas + negativas con mitigaciones
6. Referencias — todas las rules + scripts + runbook
7. Historial de revisiones

## Validators corridos

- markdownlint ADR-004 → fix x2 (fenced code sin language + space inside emphasis en wip/*) → PASS
- grep -qi 'ACCEPTED' ADR-004 → PASS (Status: ACCEPTED)
- grep -qi 'worktree' ADR-004 → PASS (tema central)
- grep -qi 'alternativa\|descartad' ADR-004 → PASS (seccion "Alternativas descartadas")

## Decisiones aplicadas

- D3: formato ADR canonico Luana (igual ADR-001) — Status: ACCEPTED (no PROPOSED)
- Status=ACCEPTED porque Chris ratifico la decision en el outcome doc git-strategy-revised.md
- No replica contenido de las rules files — solo rationale + referencias
