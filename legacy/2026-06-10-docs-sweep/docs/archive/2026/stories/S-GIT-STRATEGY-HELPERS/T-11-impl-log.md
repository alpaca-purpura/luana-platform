# T-11 impl log — CLAUDE.md + AGENTS.md Git Workflow update

Story: S-GIT-STRATEGY-HELPERS
Ticket: T-11 — Update CLAUDE.md + AGENTS.md: legacy → triple-branch + worktrees
Owner: claude-sonnet-4-6
Started: 2026-05-15
State: done

## Cambios realizados

### AGENTS.md

- REEMPLAZADA seccion `## Git Workflow` legacy ("Single branch = development. main = prod only. No feature branches, no worktrees...")
- NUEVA politica: triple-branch (wip/{slug} + main + release/{brand}-vX.Y.Z)
- Worktrees HABILITADOS con ejemplo de uso de scripts/git/new-session.sh + cleanup-session.sh
- Referencias: .claude/rules/git-safety.md + .claude/rules/parallel-safety.md + ADR-004

### CLAUDE.md

- NUEVA seccion `## Git Workflow` insertada antes de `## Critical Rules`
- Mismo contenido que AGENTS.md (coherencia garantizada R10)
- Triple-branch policy table + worktrees example + forbidden + M11 rule + references

## Validators corridos

- grep -q 'wip/' CLAUDE.md + grep -q 'release/' + grep -q 'worktree' → PASS
- grep -q 'wip/' AGENTS.md + grep -q 'release/' + grep -q 'worktree' → PASS
- ! grep -q 'Single branch = .development' CLAUDE.md → PASS (legacy eliminado)
- ! grep -q 'Single branch = .development' AGENTS.md → PASS (legacy eliminado)
- grep -q 'new-session.sh' CLAUDE.md AGENTS.md → PASS

## Nota

La politica legacy "No feature branches, no worktrees" en AGENTS.md fue el texto SSoT
que contradecia el outcome git-strategy-revised.md. T-11 la reemplaza consistentemente.
CLAUDE.md no tenia seccion Git Workflow previa — se agrego nueva segun spec T-11.
