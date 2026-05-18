#!/usr/bin/env bash
set -euo pipefail
# new-session.v2.sh — Crea worktree + branch + manifest + symlink venv per modelo cementado 2026-05-17
# SSoT del modelo: docs/process/parallel-sessions-protocol.md
#
# Usage:
#   scripts/git/new-session.v2.sh BRAND TYPE [SLUG] [LANE]
#
# Args:
#   BRAND    brand activa: vitalia | nicolify | comunify | lupulo
#   TYPE     worktree type:
#              canonical  → ~/Proyectos/luana-{brand}/             branch wip/{brand}-{slug}
#              story      → ~/Proyectos/luana-{brand}-{slug}/      branch wip/{brand}-{slug}[-{lane}]
#              hotfix     → ~/Proyectos/luana-{brand}-hotfix-{slug}/  branch hotfix/{brand}-{slug}
#              exp        → ~/Proyectos/luana-{brand}-exp-{slug}/  branch exp/{brand}-{slug}
#   SLUG     identificador story-id (story|canonical) o slug-corto (hotfix|exp). Solo [a-z0-9-]
#   LANE     opcional, solo con TYPE=story: be|fe|tests|docs (libre, recomendado)
#
# Exit codes:
#   0  Worktree creado exitosamente
#   1  Error de args / brand desconocida / slug invalido / branch ya existe / dir ya existe
#   2  Error git operation (fetch/worktree add)
#
# Produces:
#   - Branch en remote name según TYPE, nacida de origin/main fresco (NO de HEAD actual)
#   - Worktree fisico en ~/Proyectos/luana-{brand}[-{suffix}]/
#   - Symlink ${worktree}/.venv → ~/Proyectos/luana-platform/.venv/
#   - Manifest ${worktree}/.session.yaml con identidad estática
#   - Copia best-effort de .env.dev.template por brand
#
# Example:
#   scripts/git/new-session.v2.sh vitalia canonical bootstrap
#   scripts/git/new-session.v2.sh vitalia story copilot-tools-impl
#   scripts/git/new-session.v2.sh vitalia story copilot-tools-impl fe
#   scripts/git/new-session.v2.sh comunify hotfix kb-broken

BRAND="${1:?Usage: new-session.v2.sh BRAND TYPE [SLUG] [LANE] — see header}"
TYPE="${2:?Usage: new-session.v2.sh BRAND TYPE [SLUG] [LANE]}"
SLUG="${3:-}"
LANE="${4:-}"

# Validate BRAND (mantener lista en sync con docs/portfolio/PORTFOLIO.md)
case "${BRAND}" in
  vitalia|nicolify|comunify|lupulo) ;;
  *)
    echo "::error::Unknown brand '${BRAND}'. Allowed: vitalia, nicolify, comunify, lupulo"
    exit 1
    ;;
esac

# Validate TYPE
case "${TYPE}" in
  canonical|story|hotfix|exp) ;;
  *)
    echo "::error::Unknown type '${TYPE}'. Allowed: canonical, story, hotfix, exp"
    exit 1
    ;;
esac

# SLUG required for all types
if [[ -z "${SLUG}" ]]; then
  echo "::error::SLUG required for type '${TYPE}'"
  exit 1
fi

# Validate SLUG: only [a-z0-9-], lowercase, max 40 chars
if [[ ! "${SLUG}" =~ ^[a-z0-9-]+$ ]]; then
  echo "::error::Invalid slug '${SLUG}' — only [a-z0-9-] allowed (lowercase, no underscores)"
  exit 1
fi
if [[ ${#SLUG} -gt 40 ]]; then
  echo "::error::Slug too long (${#SLUG} chars, max 40)"
  exit 1
fi

# LANE only valid with story type
if [[ -n "${LANE}" ]]; then
  if [[ "${TYPE}" != "story" ]]; then
    echo "::error::LANE only valid with TYPE=story (got TYPE=${TYPE})"
    exit 1
  fi
  if [[ ! "${LANE}" =~ ^[a-z0-9-]+$ ]]; then
    echo "::error::Invalid lane '${LANE}' — only [a-z0-9-] allowed"
    exit 1
  fi
fi

# Workspace root detection
WS_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${WS_ROOT}" ]] || [[ ! -d "${WS_ROOT}/.git" ]]; then
  echo "::error::Not in a git repo. Run from inside ~/Proyectos/luana-platform/"
  exit 1
fi
# Resolve PRINCIPAL = root path of the main worktree (where .git is a directory, not file)
PRINCIPAL="$(git worktree list --porcelain | awk '/^worktree / {print $2; exit}')"
if [[ ! -d "${PRINCIPAL}/.git" ]]; then
  echo "::error::Could not detect principal worktree (expected .git as directory)"
  exit 1
fi
WORKTREE_PARENT="$(dirname "${PRINCIPAL}")"

# Override for tests
if [[ -n "${WORKTREE_PARENT_OVERRIDE:-}" ]]; then
  WORKTREE_PARENT="${WORKTREE_PARENT_OVERRIDE}"
fi

# Compute branch name + worktree dir per TYPE
case "${TYPE}" in
  canonical)
    BRANCH="wip/${BRAND}-${SLUG}"
    WORKTREE_DIR="${WORKTREE_PARENT}/luana-${BRAND}"
    WORKTREE_TYPE="canonical"
    ;;
  story)
    if [[ -n "${LANE}" ]]; then
      BRANCH="wip/${BRAND}-${SLUG}-${LANE}"
      WORKTREE_DIR="${WORKTREE_PARENT}/luana-${BRAND}-${SLUG}-${LANE}"
    else
      BRANCH="wip/${BRAND}-${SLUG}"
      WORKTREE_DIR="${WORKTREE_PARENT}/luana-${BRAND}-${SLUG}"
    fi
    WORKTREE_TYPE="ephemeral"
    ;;
  hotfix)
    BRANCH="hotfix/${BRAND}-${SLUG}"
    WORKTREE_DIR="${WORKTREE_PARENT}/luana-${BRAND}-hotfix-${SLUG}"
    WORKTREE_TYPE="ephemeral"
    ;;
  exp)
    BRANCH="exp/${BRAND}-${SLUG}"
    WORKTREE_DIR="${WORKTREE_PARENT}/luana-${BRAND}-exp-${SLUG}"
    WORKTREE_TYPE="ephemeral"
    ;;
esac

# Pre-flight checks
if git rev-parse --verify "${BRANCH}" &>/dev/null; then
  echo "::error::Branch ${BRANCH} already exists locally. Pick a different slug or cleanup first"
  exit 1
fi
if [[ -e "${WORKTREE_DIR}" ]]; then
  echo "::error::Directory ${WORKTREE_DIR} already exists. Remove it first or pick a different slug"
  exit 1
fi

# Fetch origin/main fresh (the branch is born from origin/main, NOT from current HEAD)
echo "→ Fetching origin/main fresh..."
if ! git -C "${PRINCIPAL}" fetch origin main 2>&1; then
  echo "::error::git fetch origin main failed"
  exit 2
fi
ORIGIN_MAIN_SHA="$(git -C "${PRINCIPAL}" rev-parse origin/main)"

# Create worktree at origin/main HEAD with new branch
echo "→ Creating worktree ${WORKTREE_DIR} on branch ${BRANCH} from origin/main (${ORIGIN_MAIN_SHA:0:7})..."
if ! git -C "${PRINCIPAL}" worktree add -b "${BRANCH}" "${WORKTREE_DIR}" "${ORIGIN_MAIN_SHA}" 2>&1; then
  echo "::error::git worktree add failed"
  exit 2
fi

# Create symlink to shared .venv (if principal has one)
if [[ -d "${PRINCIPAL}/.venv" ]]; then
  echo "→ Creating symlink ${WORKTREE_DIR}/.venv → ${PRINCIPAL}/.venv"
  ln -sfn "${PRINCIPAL}/.venv" "${WORKTREE_DIR}/.venv"
else
  echo "⚠ ${PRINCIPAL}/.venv does not exist — run 'uv sync' in principal first then re-symlink manually"
fi

# Generate .session.yaml manifest
MANIFEST="${WORKTREE_DIR}/.session.yaml"
echo "→ Writing manifest ${MANIFEST}"
cat > "${MANIFEST}" <<EOF
# Manifest auto-generado por new-session.v2.sh ($(date -u +%Y-%m-%dT%H:%M:%SZ))
# SSoT: docs/process/parallel-sessions-protocol.md § D8
# Este archivo NO se versiona (debe estar gitignored).
brand: ${BRAND}
worktree_type: ${WORKTREE_TYPE}
story_id: ${SLUG}
lane: ${LANE:-}
tickets: []
created_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
created_by_skill: chris-manual
parent_branch: origin/main
parent_sha: ${ORIGIN_MAIN_SHA}
branch: ${BRANCH}
notes: ""
EOF

# Add .session.yaml to local exclude (per-worktree gitignore, not committed)
# Note: .git/info/exclude is shared across worktrees, so we add it once if not present.
EXCLUDE_FILE="${PRINCIPAL}/.git/info/exclude"
if ! grep -qxF "/.session.yaml" "${EXCLUDE_FILE}" 2>/dev/null; then
  echo "/.session.yaml" >> "${EXCLUDE_FILE}"
  echo "→ Added /.session.yaml to ${EXCLUDE_FILE}"
fi

# Copy .env.dev.template per brand (best-effort) — only copy for the BRAND of this worktree
template="${WORKTREE_DIR}/${BRAND}/.env.dev.template"
if [[ -f "${template}" ]]; then
  dest="${WORKTREE_DIR}/${BRAND}/.env.dev"
  if [[ ! -e "${dest}" ]]; then
    cp "${template}" "${dest}"
    echo "→ Copied ${BRAND}/.env.dev.template → ${BRAND}/.env.dev"
  fi
fi

# Final report
echo ""
echo "✓ Worktree ready"
echo "  Path:      ${WORKTREE_DIR}"
echo "  Branch:    ${BRANCH}"
echo "  Type:      ${WORKTREE_TYPE}"
echo "  Born from: origin/main @ ${ORIGIN_MAIN_SHA:0:7}"
echo "  Manifest:  .session.yaml created"
echo "  Venv:      symlinked from principal (if available)"
echo ""
echo "Next steps:"
echo "  1. cd ${WORKTREE_DIR}"
echo "  2. Open Warp tab (Cmd+T) and cd to the new path"
echo "  3. Run 'claude' (or 'opencode') in that tab"
echo "  4. Push at least every 30 min: git push origin ${BRANCH} (safety net M11)"
