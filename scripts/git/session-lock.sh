#!/usr/bin/env bash
set -euo pipefail
# session-lock.sh — Bucket lock para N sesiones paralelas mismo cwd (v2 cementado 2026-05-18)
# SSoT: docs/process/worktree-protocol-v2-plan.md § CORE #5 + parallel-safety.md M14
#
# Permite N sesiones Claude/opencode en mismo canónico (mismo branch wip/{brand})
# coordinadas por buckets de scope: code, docs, tests.
#
# Usage:
#   scripts/git/session-lock.sh acquire BUCKET SKILL_NAME
#   scripts/git/session-lock.sh release BUCKET
#   scripts/git/session-lock.sh status [BUCKET]   # all if omit
#   scripts/git/session-lock.sh kick BUCKET       # force release (use si PID crashed)
#
# Buckets:
#   code   → {brand}/{backend,frontend}/src/
#   docs   → {brand}/docs/ + raíz docs/
#   tests  → {brand}/{backend,frontend}/tests/
#
# Exit codes:
#   0  acquire OK / release OK / status OK
#   1  bucket taken (acquire) / no lock to release / no such PID
#   2  arg error / invalid bucket
#   3  no worktree detected

if [[ $# -lt 1 ]]; then
  echo "Usage: session-lock.sh ACTION [BUCKET] [SKILL_NAME]"
  echo "  ACTION: acquire | release | status | kick"
  echo "  BUCKET: code | docs | tests (optional for 'status' to list all)"
  exit 2
fi
ACTION="$1"
BUCKET="${2:-}"
SKILL="${3:-unknown}"

# Worktree detection
WORKTREE="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${WORKTREE}" ]]; then
  echo "::error::Not in a git repo"
  exit 3
fi
LOCK_DIR="${WORKTREE}/.session-locks"
mkdir -p "${LOCK_DIR}"

# Validate bucket — required except for "status" with no bucket arg
NEEDS_BUCKET=1
if [[ "${ACTION}" == "status" && -z "${BUCKET}" ]]; then
  NEEDS_BUCKET=0
fi
if [[ ${NEEDS_BUCKET} -eq 1 ]]; then
  case "${BUCKET}" in
    code|docs|tests) ;;
    *)
      echo "::error::Invalid bucket '${BUCKET}'. Allowed: code, docs, tests"
      exit 2
      ;;
  esac
fi

LOCK_FILE="${LOCK_DIR}/${BUCKET:-_unset}.lock"

case "${ACTION}" in
  acquire)
    if [[ -f "${LOCK_FILE}" ]]; then
      OWNER_PID=$(head -1 "${LOCK_FILE}" | awk '{print $1}')
      OWNER_SKILL=$(head -1 "${LOCK_FILE}" | awk '{print $2}')
      OWNER_AT=$(head -1 "${LOCK_FILE}" | awk '{print $3}')

      # Auto-release if PID dead
      if ! kill -0 "${OWNER_PID}" 2>/dev/null; then
        echo "→ Lock ${BUCKET} owner PID ${OWNER_PID} dead — auto-releasing"
        rm "${LOCK_FILE}"
      else
        echo "::error::Bucket '${BUCKET}' LOCKED by PID ${OWNER_PID} (skill=${OWNER_SKILL}, at=${OWNER_AT})"
        echo "  Opciones:"
        echo "    1. Esperar a que termine + reintentar"
        echo "    2. Pedir worktree story explícito (EXPLICIT_USER_REQUEST=1 scripts/git/new-session.sh BRAND story SLUG)"
        echo "    3. Kick lock si crashed: scripts/git/session-lock.sh kick ${BUCKET}"
        exit 1
      fi
    fi
    echo "$$ ${SKILL} $(date -Iseconds)" > "${LOCK_FILE}"
    echo "✓ Lock acquired: ${BUCKET} (PID $$, skill=${SKILL})"
    exit 0
    ;;

  release)
    if [[ ! -f "${LOCK_FILE}" ]]; then
      echo "ℹ No lock to release: ${BUCKET}"
      exit 0
    fi
    OWNER_PID=$(head -1 "${LOCK_FILE}" | awk '{print $1}')
    if [[ "${OWNER_PID}" != "$$" ]] && kill -0 "${OWNER_PID}" 2>/dev/null; then
      echo "::error::Lock ${BUCKET} owned by PID ${OWNER_PID} (not us). Use 'kick' to force-release."
      exit 1
    fi
    rm "${LOCK_FILE}"
    echo "✓ Lock released: ${BUCKET}"
    exit 0
    ;;

  status)
    if [[ -n "${BUCKET}" ]]; then
      BUCKETS=("${BUCKET}")
    else
      BUCKETS=(code docs tests)
    fi
    echo "Worktree: ${WORKTREE}"
    for B in "${BUCKETS[@]}"; do
      LF="${LOCK_DIR}/${B}.lock"
      if [[ -f "${LF}" ]]; then
        OWNER=$(head -1 "${LF}")
        PID=$(echo "${OWNER}" | awk '{print $1}')
        if kill -0 "${PID}" 2>/dev/null; then
          echo "  ${B}: LOCKED by ${OWNER}"
        else
          echo "  ${B}: LOCKED by ${OWNER} (PID DEAD — call kick or auto-cleanup on next acquire)"
        fi
      else
        echo "  ${B}: free"
      fi
    done
    exit 0
    ;;

  kick)
    if [[ ! -f "${LOCK_FILE}" ]]; then
      echo "ℹ No lock to kick: ${BUCKET}"
      exit 0
    fi
    OWNER=$(head -1 "${LOCK_FILE}")
    rm "${LOCK_FILE}"
    echo "✓ Lock kicked: ${BUCKET} (was: ${OWNER})"
    exit 0
    ;;

  *)
    echo "::error::Unknown action '${ACTION}'. Allowed: acquire, release, status, kick"
    exit 2
    ;;
esac
