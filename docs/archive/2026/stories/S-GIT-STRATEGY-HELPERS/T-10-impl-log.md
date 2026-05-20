# T-10 impl log — Helper scripts + bash unit tests

Story: S-GIT-STRATEGY-HELPERS
Ticket: T-10 — new-session.sh + cleanup-session.sh + bash unit tests
Owner: claude-sonnet-4-6
Started: 2026-05-15
State: done

## TDD iteration log

### Iteration 1 (RED) — Tests escritos antes de scripts

Creados primero:
- `scripts/tests/test_new_session.sh` (7 tests, todos RED porque scripts no existen)
- `scripts/tests/test_cleanup_session.sh` (4 tests, todos RED porque scripts no existen)

shellcheck: PASS en ambos archivos de test.

### Iteration 2 (GREEN scripts created)

Creados los scripts de produccion:
- `scripts/git/new-session.sh` — con WORKTREE_PARENT_OVERRIDE env var para isolation en tests
- `scripts/git/cleanup-session.sh` — con GIT_PUSH_DRY_RUN=1 env var para dry-run en tests
- `chmod +x` aplicado a ambos

shellcheck scripts: PASS

### Iteration 3 (RED tests fixed — exit code capture pattern)

Problema detectado: `output=$(cmd) || true` hace que `$?` sea siempre 0 aun cuando el comando falla.
Solucion: helper `capture_cmd` con patron `{ "$@" > file; }; _ec=$?` que captura exit code real.
Patron `set -uo pipefail` (sin `-e`) en test files para no necesitar || true.

Tests new_session: 7/7 PASS
Tests cleanup_session: 4/4 PASS

## Validators corridos (pre-commit)

- shellcheck scripts/git/new-session.sh scripts/git/cleanup-session.sh → PASS
- shellcheck scripts/tests/test_new_session.sh scripts/tests/test_cleanup_session.sh → PASS
- bash scripts/tests/test_new_session.sh → 7/7 PASS
- bash scripts/tests/test_cleanup_session.sh → 4/4 PASS
- test -x scripts/git/new-session.sh && test -x scripts/git/cleanup-session.sh → PASS
- head check set -euo pipefail: PASS ambos scripts
- grep regex sanitizacion: PASS ambos scripts

## Files entregados

- NEW scripts/git/new-session.sh
- NEW scripts/git/cleanup-session.sh
- NEW scripts/tests/test_new_session.sh (7 scenarios)
- NEW scripts/tests/test_cleanup_session.sh (4 scenarios)

## Decisiones tecnicas aplicadas

- D1: bash puro con set -euo pipefail — no Python, no venv required
- D2: ubicacion canonica scripts/git/ (no Makefile targets)
- WORKTREE_PARENT_OVERRIDE env var para isolation tests (F8: tests no tocan repo real)
- GIT_PUSH_DRY_RUN=1 para dry-run git push en tests (no requiere remote)
- Exit codes semanticos: 0=ok, 1=error, 2=dirty tree (R3)
- Sanitizacion regex ^[a-zA-Z0-9_-]+$ (R2)
