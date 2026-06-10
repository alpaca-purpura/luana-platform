# T-2 — Reescribir .claude/rules/parallel-safety.md (M9+M10+M11 + worktrees requeridos)

## Status

DONE (validators green)

## Files changed

- `.claude/rules/parallel-safety.md` (MODIFY) — rewritten from 62-line legacy to ~120-line triple-branch parallel policy

## Decisions honored

- D1: Triple-branch in parallel: each session its own wip/* branch + worktree
- D2: Worktrees REQUIRED (replaces 'WORKTREES PROHIBIDOS' — ban revocado)
- D3: WIP safety net documented (M10, M11)
- D6: M11 push >30min rule as new rule
- M1-M8 preserved with M1 updated (branches wip/* DISTINTOS, not 'modulos distintos')
- M9 NEW: Agent tool sub-agents can use ephemeral worktree isolation
- M10 NEW: wip/* branches are autosave; push frecuente garantiza recovery
- M11 NEW: never >30 min without push if significant changes

## Validators run

- `parallel_safety_m9_m10_m11` validator: PASS (M9/M10/M11 present, WORKTREES PROHIBIDOS removed)
- M1-M8 still present: PASS (checked via grep)
- 'worktree add' command referenced: PASS

## Notes

- 'WORKTREES PROHIBIDOS' text completely removed
- 'Chris perdio 1 semana previa' backstory removed (legacy context not needed)
- Reference to git-safety.md for triple-branch policy (no duplication of content)

## Iteration count

1
