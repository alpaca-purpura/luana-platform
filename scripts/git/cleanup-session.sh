#!/usr/bin/env bash
set -euo pipefail
# cleanup-session.sh — Push final + remueve worktree de sesion terminada
#
# Usage:  scripts/git/cleanup-session.sh SLUG
# Args:
#   SLUG     Identificador de la sesion a limpiar (ej: A-docker)
#            Solo caracteres [a-zA-Z0-9_-]. REQUERIDO.
# Exit codes:
#   0  Cleanup exitoso: worktree removido + branch pusheada
#   1  Error: slug invalido / worktree no existe / git error
#   2  STOP: worktree tiene cambios uncommitted — no destruye WIP
#
# SAFETY: el script NO remueve la branch wip/{SLUG} del repositorio.
#         Solo remueve el directorio fisico (worktree). La branch queda
#         para merge futuro a main o cleanup manual.
#
# Example:
#   cd /home/chalreme/Proyectos/luana-platform
#   scripts/git/cleanup-session.sh A-docker

SLUG="${1:?Usage: cleanup-session.sh SLUG}"

# D1 — Sanitize: solo alnum + dash + underscore
if [[ ! "${SLUG}" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "::error::Invalid slug '${SLUG}' — only [a-zA-Z0-9_-] allowed"
  exit 1
fi

BRANCH="wip/${SLUG}"

# Soporte para WORKTREE_PARENT_OVERRIDE (permite tests aislar del repo real)
if [[ -n "${WORKTREE_PARENT_OVERRIDE:-}" ]]; then
  WORKTREE_DIR="${WORKTREE_PARENT_OVERRIDE}/luana-${SLUG}"
else
  WORKTREE_DIR="../luana-${SLUG}"
fi

# Verificar que el directorio worktree existe
if [[ ! -d "${WORKTREE_DIR}" ]]; then
  echo "::error::No worktree at ${WORKTREE_DIR} — nothing to cleanup"
  exit 1
fi

# SAFETY GATE — verificar tree limpio antes de cualquier operacion destructiva
# F1: NUNCA destruir sin verificacion previa
DIRTY_FILES="$(git -C "${WORKTREE_DIR}" status --short 2>/dev/null || true)"
if [[ -n "${DIRTY_FILES}" ]]; then
  echo "::error::Worktree ${WORKTREE_DIR} has uncommitted changes — commit or stash first"
  echo "Run: cd ${WORKTREE_DIR} && git status"
  exit 2
fi

# Push final (modo seco si GIT_PUSH_DRY_RUN=1, para tests)
echo "Pushing ${BRANCH}..."
if [[ "${GIT_PUSH_DRY_RUN:-0}" == "1" ]]; then
  echo "(dry-run: skipping actual git push)"
else
  git -C "${WORKTREE_DIR}" push origin "${BRANCH}" --set-upstream 2>/dev/null \
    || git -C "${WORKTREE_DIR}" push origin "${BRANCH}" \
    || echo "(Branch already up-to-date or no remote — skipping push)"
fi

# Remover worktree fisico (NO borra la branch)
echo "Removing worktree ${WORKTREE_DIR}..."
git worktree remove "${WORKTREE_DIR}"

echo ""
echo "Cleanup complete: worktree removed, branch ${BRANCH} pushed"
echo "Branch ${BRANCH} still exists — merge to main when ready or delete manually"
