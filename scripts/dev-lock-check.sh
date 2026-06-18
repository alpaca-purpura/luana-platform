#!/usr/bin/env bash
set -euo pipefail
# dev-lock-check.sh — Guard contra worktree-mismatch del dev-stack (mec. F)
# SSoT: docs/process/parallel-sessions-protocol.md § D5
#
# El proyecto compose se llama `luana-dev` (compartido por TODOS los worktrees).
# `make dev-{brand}` bindea `.:/workspace` al CWD donde se corre → si una sesión
# lo lanza desde otro worktree, RECREA los containers apuntando a ESE worktree,
# en silencio. El último que lanza gana → tu código no se deploya y no hay señal.
#
# Este guard compara el worktree que el stack corriendo bindea vs el worktree
# actual. Si difieren → BLOQUEA (recrear desde acá rebindearía el stack ajeno).
#
# Usage:
#   scripts/dev-lock-check.sh <brand>     # pre-condición de make dev-{brand}
#   scripts/dev-lock-check.sh --which     # tabla read-only: qué worktree sirve cada marca
#   scripts/dev-lock-check.sh --self-check
#
# Escape: FORCE_REBIND=1 make dev-{brand}   (rebindea a propósito)
# Fail-OPEN si docker no está disponible.

BRANDS="nicolify vitalia comunify lupulo"
_mount_src() {  # echo el Source del bind /workspace del backend de una marca ('' si no hay stack)
  docker inspect "luana-dev-${1}_backend_dev-1" \
    --format '{{range .Mounts}}{{if eq .Destination "/workspace"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || echo ''
}

_decide_rebind() {  # pura: BLOCK|OK  (bound, current, force)
  local bound="$1" current="$2" force="$3"
  [[ "${force}" == "1" ]] && { echo OK; return; }
  [[ -z "${bound}" ]] && { echo OK; return; }          # no hay stack corriendo
  [[ "${bound}" == "${current}" ]] && { echo OK; return; }
  echo BLOCK
}

# ── self-check ────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--self-check" ]]; then
  assert() { [[ "$1" == "$2" ]] || { echo "FAIL: got '$1' want '$2'"; exit 1; }; }
  assert "$(_decide_rebind ''     /a       0)" OK     # no stack → permitir
  assert "$(_decide_rebind /a     /a       0)" OK     # mismo worktree → permitir
  assert "$(_decide_rebind /main  /vitalia 0)" BLOCK  # mismatch → bloquear
  assert "$(_decide_rebind /main  /vitalia 1)" OK     # FORCE_REBIND override
  echo "✓ dev-lock-check self-check passed"
  exit 0
fi

# ── dev-which: vista read-only de todos los stacks ────────────────────────────
if [[ "${1:-}" == "--which" ]]; then
  command -v docker &>/dev/null || { echo "(dev-which: docker not available)"; exit 0; }
  current="$(git rev-parse --show-toplevel 2>/dev/null || echo '?')"
  echo "cwd worktree: ${current}"
  printf '%-10s %s\n' "BRAND" "BOUND WORKTREE (backend /workspace)"
  for b in ${BRANDS}; do
    bound="$(_mount_src "${b}")"
    flag=""
    if [[ -z "${bound}" ]]; then
      bound="(no stack)"
    elif [[ "$(basename "${bound}")" != "luana-${b}" ]]; then
      flag="  ⚠ no es el hub (luana-${b})"
    fi
    printf '%-10s %s%s\n' "${b}" "${bound}" "${flag}"
  done
  exit 0
fi

# ── pre-condición de make dev-{brand} ─────────────────────────────────────────
BRAND="${1:?Usage: dev-lock-check.sh BRAND}"

if ! command -v docker &>/dev/null; then
  echo "  (dev-lock-check: docker not available, skip)"
  exit 0
fi

CURRENT="$(git rev-parse --show-toplevel 2>/dev/null || echo '')"
BOUND="$(_mount_src "${BRAND}")"

if [[ "$(_decide_rebind "${BOUND}" "${CURRENT}" "${FORCE_REBIND:-0}")" == "BLOCK" ]]; then
  cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEV-LOCK STOP — el stack de '${BRAND}' sirve OTRO worktree
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Stack corriendo bindea:  ${BOUND}
  Vos estás en:            ${CURRENT}

  El proyecto compose 'luana-dev' es ÚNICO cross-worktree. Si recreás
  el stack desde acá, REBINDEA los containers a este worktree y le
  rompés el dev-app a la sesión que trabaja en:
      ${BOUND}
  (sus fixes dejarían de deployarse, en silencio).

  Opciones:
    • Editá donde el stack ya apunta:   cd ${BOUND}
    • O rebindeá a propósito a ESTE worktree:
          FORCE_REBIND=1 make dev-${BRAND}
    • Ver todos los stacks:             make dev-which

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
  exit 1
fi

# Notas informativas (no bloquean)
if [[ -n "${BOUND}" && "${BOUND}" == "${CURRENT}" ]]; then
  echo "  (dev-lock-check: stack de ${BRAND} ya bindea este worktree — recrear es seguro)"
elif [[ -n "${BOUND}" ]]; then
  echo "  ⚠ FORCE_REBIND: rebindeando stack de ${BRAND} de ${BOUND} → ${CURRENT}"
fi
exit 0
