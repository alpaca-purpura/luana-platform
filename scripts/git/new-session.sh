#!/usr/bin/env bash
set -euo pipefail
# new-session.sh — Crea worktree + branch wip/{SLUG} para sesion paralela nueva
#
# Usage:  scripts/git/new-session.sh SLUG
# Args:
#   SLUG     Identificador alfanumerico de la sesion (ej: A-docker, B-cicd, chris-hotfix)
#            Solo caracteres [a-zA-Z0-9_-]. REQUERIDO.
# Exit codes:
#   0  Worktree creado exitosamente
#   1  Error: slug invalido / branch ya existe / dir ya existe / git error
#
# Produces:
#   - Branch wip/{SLUG} en el repositorio local
#   - Worktree fisico en ../luana-{SLUG} (sibling del monorepo)
#   - Copias best-effort de .env.dev.template por brand (si existen)
#
# Example:
#   cd /home/chalreme/Proyectos/luana-platform
#   scripts/git/new-session.sh A-docker
#   cd ../luana-A-docker

SLUG="${1:?Usage: new-session.sh SLUG}"

# D1 — Sanitize: solo alnum + dash + underscore. Excluye .., /, \, espacios
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

# Verificar que la branch no existe (mensaje de error mejor que el de git)
if git rev-parse --verify "${BRANCH}" &>/dev/null; then
  echo "::error::Branch ${BRANCH} already exists — use a different slug or cleanup first"
  exit 1
fi

# Verificar que el directorio worktree no existe
if [[ -e "${WORKTREE_DIR}" ]]; then
  echo "::error::Directory ${WORKTREE_DIR} already exists — remove it first or use a different slug"
  exit 1
fi

echo "Creating worktree ${WORKTREE_DIR} on branch ${BRANCH}..."
git worktree add -b "${BRANCH}" "${WORKTREE_DIR}" HEAD

# D1 — Copiar .env templates best-effort (no falla si no existen)
for brand_dir in nicolify vitalia comunify lupulo; do
  template="${brand_dir}/.env.dev.template"
  if [[ -f "${template}" ]]; then
    dest="${WORKTREE_DIR}/${brand_dir}/.env.dev"
    mkdir -p "$(dirname "${dest}")"
    if cp "${template}" "${dest}"; then
      echo "Copied ${template} -> ${dest}"
    fi
  fi
done

echo ""
echo "Worktree ready: cd ${WORKTREE_DIR}"
echo "Branch: ${BRANCH}"
echo "Next: git commit + git push origin ${BRANCH} (safety net cada 30 min — M11)"
